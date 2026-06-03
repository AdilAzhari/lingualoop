<?php

namespace App\Http\Controllers;

use App\Models\SpeakingPrompt;
use App\Models\SpeakingSession;
use App\Models\VocabularyEntry;
use App\Services\GeminiClient;
use App\Services\Speaking\SpeakingGrader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;
use Inertia\Response;

class SpeakingController extends Controller
{
    /** GET /speaking */
    public function index(): Response
    {
        $userId  = auth()->id();
        $prompts = SpeakingPrompt::orderBy('level')->get();

        $best = SpeakingSession::where('user_id', $userId)
            ->where('status', 'graded')
            ->selectRaw('prompt_id, MAX(score_fluency + score_vocabulary + score_grammar + score_pronunciation) / 4 as best_avg, COUNT(*) as attempts')
            ->groupBy('prompt_id')
            ->get()
            ->keyBy('prompt_id');

        $topics = $prompts->pluck('topic')->unique()->sort()->values()->all();

        return Inertia::render('Speaking/Index', [
            'topics'  => $topics,
            'prompts' => $prompts->map(fn ($p) => [
                'id'             => $p->id,
                'text'           => $p->text,
                'topic'          => $p->topic,
                'level'          => $p->level,
                'target_seconds' => $p->target_seconds,
                'cue_count'      => count($p->cue_points),
                'best_score'     => $best->has($p->id) ? (int) round($best->get($p->id)->best_avg) : null,
                'attempts'       => (int) ($best->get($p->id)?->attempts ?? 0),
            ]),
        ]);
    }

    /** GET /speaking/{prompt} */
    public function show(SpeakingPrompt $prompt): Response
    {
        $vocabWords = VocabularyEntry::where('user_id', auth()->id())
            ->orderByRaw("CASE WHEN level IN ('c1','c2') THEN 0 ELSE 1 END")
            ->orderBy('word')
            ->get(['id', 'word', 'definition', 'level'])
            ->map(fn ($e) => [
                'id'         => $e->id,
                'word'       => $e->word,
                'definition' => $e->definition,
                'level'      => $e->level,
            ])
            ->all();

        return Inertia::render('Speaking/Show', [
            'prompt' => [
                'id'             => $prompt->id,
                'text'           => $prompt->text,
                'cue_points'     => $prompt->cue_points,
                'topic'          => $prompt->topic,
                'level'          => $prompt->level,
                'target_seconds' => $prompt->target_seconds,
            ],
            'vocab_words' => $vocabWords,
        ]);
    }

    /** POST /speaking/{prompt} */
    public function store(Request $request, SpeakingPrompt $prompt): RedirectResponse
    {
        $request->validate([
            'audio'    => 'required|file|max:30720', // 30 MB
            'duration' => 'nullable|integer|min:0|max:300',
        ]);

        $userId   = auth()->id();
        $file     = $request->file('audio');
        $mimeType = $file->getMimeType() ?? 'audio/webm';
        $ext      = match (true) {
            str_contains($mimeType, 'ogg')  => 'ogg',
            str_contains($mimeType, 'mp4')  => 'mp4',
            str_contains($mimeType, 'wav')  => 'wav',
            default                         => 'webm',
        };

        $audioPath = $file->storeAs(
            "speaking/{$userId}",
            now()->format('YmdHis') . ".{$ext}",
            'local'
        );

        $duration = $request->integer('duration') ?: null;

        $result = (new SpeakingGrader())->grade(
            $audioPath,
            $mimeType,
            $prompt->text,
            $prompt->cue_points,
            $duration
        );

        $session = SpeakingSession::create([
            'user_id'            => $userId,
            'prompt_id'          => $prompt->id,
            'status'             => 'graded',
            'audio_path'         => $audioPath,
            'audio_mime'         => $mimeType,
            'transcript'         => $result->transcript,
            'score_fluency'      => $result->scores['fluency'],
            'score_vocabulary'   => $result->scores['vocabulary'],
            'score_grammar'      => $result->scores['grammar'],
            'score_pronunciation'=> $result->scores['pronunciation'],
            'dimension_notes'    => $result->dimensionNotes,
            'headline'           => $result->headline,
            'overall_note'       => $result->overallNote,
            'collocation_errors' => $result->collocationErrors,
            'improvement_tips'   => $result->improvementTips,
            'duration_seconds'   => $result->durationSeconds,
            'graded_at'          => now(),
        ]);

        return redirect()->route('speaking.sessions.show', $session->id);
    }

    /** POST /speaking/{prompt}/sample */
    public function sample(SpeakingPrompt $prompt): JsonResponse
    {
        $cues = implode("\n- ", $prompt->cue_points);

        $text = <<<PROMPT
Write a model spoken response (180–220 words) for this IELTS-style speaking task.
Use sophisticated C1-level vocabulary naturally and seamlessly — words such as pivotal, nuanced, foster, inadvertently, compelling, encompass, commendable, integral, whereby, albeit.
The response must sound fluent and conversational, written in the first person, as if being spoken aloud.
Do NOT include headings, bullet points, or labels — write as continuous flowing speech.

Speaking task: {$prompt->text}

Cover these points:
- {$cues}
PROMPT;

        try {
            $generated = GeminiClient::ask($text, 30);
            return response()->json(['text' => trim($generated)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Could not generate a sample right now. Please try again.'], 500);
        }
    }

    /** POST /speaking/{prompt}/vocab-suggest */
    public function vocabSuggest(SpeakingPrompt $prompt): JsonResponse
    {
        $systemPrompt = <<<PROMPT
Speaking topic: "{$prompt->topic}"
Task: {$prompt->text}

Suggest exactly 7 English vocabulary words that would be impressive and useful for a candidate speaking on this topic in an IELTS context.

Requirements:
- Mix of B2, C1, and C2 CEFR level words
- Each word must be directly relevant to this specific topic
- Prefer sophisticated, naturally spoken academic or descriptive words
- Avoid overly obscure or archaic words

Return ONLY a valid JSON object in this exact format:
{"words": [
  {"word": "...", "definition": "short definition (max 10 words)", "level": "b2"},
  {"word": "...", "definition": "short definition (max 10 words)", "level": "c1"},
  {"word": "...", "definition": "short definition (max 10 words)", "level": "c2"}
]}
PROMPT;

        try {
            $data  = GeminiClient::json($systemPrompt, 30);
            $items = $data['words'] ?? [];

            $words = collect($items)
                ->filter(fn ($w) => is_array($w) && isset($w['word'], $w['definition'], $w['level']))
                ->map(fn ($w) => [
                    'word'       => (string) $w['word'],
                    'definition' => (string) $w['definition'],
                    'level'      => in_array($w['level'], ['a2', 'b1', 'b2', 'c1', 'c2']) ? $w['level'] : 'b2',
                ])
                ->values()
                ->all();

            return response()->json(['words' => $words]);
        } catch (\Throwable) {
            return response()->json(['words' => []], 500);
        }
    }

    /** POST /speaking/sessions/{session}/followup — AI examiner follow-up */
    public function followup(Request $request, SpeakingSession $session): JsonResponse
    {
        abort_if($session->user_id !== auth()->id(), 403);

        $data = $request->validate([
            'conversation'  => 'nullable|array',
            'user_response' => 'required|string|max:1000',
            'exchange'      => 'required|integer|min:1|max:3',
        ]);

        $transcript    = $session->transcript ?? '';
        $promptText    = $session->prompt?->text ?? '';
        $exchange      = (int) $data['exchange'];
        $userResponse  = $data['user_response'];
        $history       = collect($data['conversation'] ?? [])
            ->map(fn ($m) => "{$m['role']}: {$m['text']}")
            ->implode("\n");

        $isLast = $exchange >= 3;
        $exchangeInstruction = $isLast
            ? "This is the final exchange (exchange {$exchange}/3). Give brief positive feedback on their last response (1 sentence), then conclude warmly."
            : "This is exchange {$exchange}/3. Give one sentence of brief, encouraging feedback on their response, then ask ONE sharp follow-up question that pushes deeper into the topic. Keep the question concise and open-ended.";
        $doneJson = $isLast ? 'true' : 'false';

        $systemPrompt = <<<PROMPT
You are an IELTS examiner conducting Part 3 follow-up questions after a candidate's speaking response.

The original speaking task was: {$promptText}

The candidate's transcript:
{$transcript}

Conversation so far:
{$history}
user: {$userResponse}

{$exchangeInstruction}

Return ONLY valid JSON:
{"feedback": "One sentence of feedback.", "question": "The follow-up question.", "done": {$doneJson}}
PROMPT;

        try {
            $result = GeminiClient::json($systemPrompt, 25);
            return response()->json([
                'feedback' => $result['feedback'] ?? '',
                'question' => $result['question'] ?? '',
                'done'     => $isLast,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /** GET /speaking/sessions/{session}/audio */
    public function audio(SpeakingSession $session): BinaryFileResponse
    {
        abort_if($session->user_id !== auth()->id(), 403);
        $path = storage_path('app/' . $session->audio_path);
        abort_if(! file_exists($path), 404);
        return response()->file($path, ['Content-Type' => $session->audio_mime ?? 'audio/webm']);
    }

    /** GET /speaking/sessions/{session} */
    public function session(SpeakingSession $session): Response
    {
        abort_if($session->user_id !== auth()->id(), 403);

        $prompt = $session->prompt;

        return Inertia::render('Speaking/Feedback', [
            'prompt' => [
                'id'    => $prompt->id,
                'text'  => $prompt->text,
                'topic' => $prompt->topic,
                'level' => $prompt->level,
            ],
            'session' => [
                'id'          => $session->id,
                'overall'     => $session->overall,
                'has_audio'   => $session->audio_path && file_exists(storage_path('app/' . $session->audio_path)),
                'transcript'  => $session->transcript,
                'scores'      => [
                    'fluency'       => $session->score_fluency,
                    'vocabulary'    => $session->score_vocabulary,
                    'grammar'       => $session->score_grammar,
                    'pronunciation' => $session->score_pronunciation,
                ],
                'dimension_notes' => $session->dimension_notes ?? ['fluency' => '', 'vocabulary' => '', 'grammar' => '', 'pronunciation' => ''],
                'headline'        => $session->headline        ?? ['primary' => 'Feedback', 'secondary' => ''],
                'overall_note'       => $session->overall_note,
                'collocation_errors' => $session->collocation_errors ?? [],
                'improvement_tips'   => $session->improvement_tips   ?? [],
                'duration_seconds'   => $session->duration_seconds,
                'graded_at'          => $session->graded_at?->toIso8601String(),
            ],
        ]);
    }
}

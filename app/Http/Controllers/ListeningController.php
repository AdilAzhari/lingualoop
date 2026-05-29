<?php

namespace App\Http\Controllers;

use App\Models\ListeningPassage;
use App\Models\ListeningSession;
use App\Services\ElevenLabsTtsClient;
use App\Services\GeminiClient;
use App\Services\Reading\ReadingGrader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ListeningController extends Controller
{
    /** GET /listening */
    public function index(): Response
    {
        $userId   = auth()->id();
        $passages = ListeningPassage::withCount('questions')->orderBy('level')->get();

        $best = ListeningSession::where('user_id', $userId)
            ->where('status', 'graded')
            ->selectRaw('passage_id, MAX(score) as best_score, COUNT(*) as attempts')
            ->groupBy('passage_id')
            ->get()
            ->keyBy('passage_id');

        $topics = $passages->pluck('topic')->unique()->sort()->values()->all();

        return Inertia::render('Listening/Index', [
            'topics'   => $topics,
            'passages' => $passages->map(fn ($p) => [
                'id'             => $p->id,
                'title'          => $p->title,
                'topic'          => $p->topic,
                'level'          => $p->level,
                'word_count'     => $p->word_count,
                'question_count' => $p->questions_count,
                'best_score'     => $best->has($p->id) ? (int) $best->get($p->id)->best_score : null,
                'attempts'       => (int) ($best->get($p->id)?->attempts ?? 0),
            ]),
        ]);
    }

    /** GET /listening/{passage} */
    public function show(ListeningPassage $passage): Response
    {
        return Inertia::render('Listening/Show', [
            'passage' => [
                'id'           => $passage->id,
                'title'        => $passage->title,
                'audio_script' => $passage->audio_script,
                'topic'        => $passage->topic,
                'level'        => $passage->level,
                'word_count'   => $passage->word_count,
            ],
            'questions' => $passage->questions()
                ->orderBy('position')
                ->get(['id', 'position', 'question_text'])
                ->values()
                ->all(),
        ]);
    }

    /** POST /listening/{passage} */
    public function store(Request $request, ListeningPassage $passage): RedirectResponse
    {
        $data = $request->validate([
            'started_at'            => 'required|integer',
            'answers'               => 'required|array|min:1',
            'answers.*.question_id' => 'required|integer',
            'answers.*.answer'      => 'required|string|max:2000',
        ]);

        $timeTaken  = max(0, (int) round((now()->timestamp * 1000 - $data['started_at']) / 1000));
        $questionMap = $passage->questions()->orderBy('position')->get()->keyBy('id');

        $gradingInput = collect($data['answers'])->map(fn ($a) => [
            'question_id'   => (int) $a['question_id'],
            'position'      => $questionMap->get($a['question_id'])?->position ?? 0,
            'question_text' => $questionMap->get($a['question_id'])?->question_text ?? '',
            'model_answer'  => $questionMap->get($a['question_id'])?->model_answer ?? '',
            'user_answer'   => $a['answer'],
        ])->all();

        $result = (new ReadingGrader())->grade($passage->audio_script, $gradingInput);

        $session = ListeningSession::create([
            'user_id'           => auth()->id(),
            'passage_id'        => $passage->id,
            'status'            => 'graded',
            'answers'           => $data['answers'],
            'score'             => $result->score,
            'question_feedback' => $result->questionFeedback,
            'overall_note'      => $result->overallNote,
            'time_taken_seconds'=> $timeTaken,
            'started_at'        => now()->subSeconds($timeTaken),
            'graded_at'         => now(),
        ]);

        return redirect()->route('listening.sessions.show', $session->id);
    }

    /** GET /listening/sessions/{session} */
    public function session(ListeningSession $session): Response
    {
        abort_if($session->user_id !== auth()->id(), 403);

        $passage     = $session->passage()->with('questions')->first();
        $questionMap = $passage->questions->keyBy('id');
        $answerMap   = collect($session->answers)->keyBy('question_id');
        $fbMap       = collect($session->question_feedback)->keyBy('question_id');

        return Inertia::render('Listening/Feedback', [
            'passage' => [
                'id'    => $passage->id,
                'title' => $passage->title,
                'topic' => $passage->topic,
                'level' => $passage->level,
            ],
            'session' => [
                'id'                 => $session->id,
                'score'              => $session->score,
                'overall_note'       => $session->overall_note,
                'time_taken_seconds' => $session->time_taken_seconds,
                'graded_at'          => $session->graded_at?->toIso8601String(),
            ],
            'questions' => $passage->questions->sortBy('position')->values()->map(fn ($q) => [
                'id'            => $q->id,
                'position'      => $q->position,
                'question_text' => $q->question_text,
                'user_answer'   => $answerMap->get($q->id)['answer'] ?? '',
                'feedback'      => $fbMap->get($q->id),
            ])->all(),
        ]);
    }

    /** GET /listening/{passage}/audio — synthesize or serve cached MP3 */
    public function audio(ListeningPassage $passage): BinaryFileResponse|JsonResponse
    {
        if (!ElevenLabsTtsClient::isConfigured()) {
            return response()->json(['error' => 'TTS not configured. Add ELEVENLABS_API_KEY to .env'], 503);
        }

        try {
            $filePath = ElevenLabsTtsClient::synthesize(
                $passage->audio_script,
                "passage_{$passage->id}"
            );
            return response()->file($filePath, [
                'Content-Type'  => 'audio/mpeg',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /** POST /listening/{passage}/sample — model answers */
    public function sample(ListeningPassage $passage): JsonResponse
    {
        $questions = $passage->questions()->orderBy('position')->get();
        $qList     = $questions->map(fn ($q) => "Q{$q->position}: {$q->question_text}")->implode("\n");

        $prompt = <<<PROMPT
Read the following transcript, then provide model answers for each comprehension question.
Use C1-level vocabulary. Keep each answer concise (1–2 sentences) and grounded in the text.
Format as: Q1: [answer]  Q2: [answer] — one per line.

Transcript:
{$passage->audio_script}

Questions:
{$qList}
PROMPT;

        try {
            return response()->json(['text' => trim(GeminiClient::ask($prompt, 30))]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Could not generate sample answers right now.'], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ReadingPassage;
use App\Models\ReadingSession;
use App\Models\VocabularyEntry;
use App\Services\GeminiClient;
use App\Services\Reading\ReadingGrader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReadingController extends Controller
{
    /** GET /reading */
    public function index(): Response
    {
        $userId   = auth()->id();
        $passages = ReadingPassage::withCount('questions')->orderBy('level')->get();

        $latestScores = ReadingSession::where('user_id', $userId)
            ->where('status', 'graded')
            ->selectRaw('passage_id, MAX(score) as best_score, COUNT(*) as attempts')
            ->groupBy('passage_id')
            ->get()
            ->keyBy('passage_id');

        $topics = $passages->pluck('topic')->unique()->sort()->values()->all();

        return Inertia::render('Reading/Index', [
            'topics'   => $topics,
            'passages' => $passages->map(fn ($p) => [
                'id'             => $p->id,
                'title'          => $p->title,
                'topic'          => $p->topic,
                'level'          => $p->level,
                'word_count'     => $p->word_count,
                'question_count' => $p->questions_count,
                'best_score'     => $latestScores->get($p->id)?->best_score,
                'attempts'       => (int) ($latestScores->get($p->id)?->attempts ?? 0),
            ]),
        ]);
    }

    /** GET /reading/{passage} */
    public function show(ReadingPassage $passage): Response
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

        return Inertia::render('Reading/Show', [
            'passage' => [
                'id'         => $passage->id,
                'title'      => $passage->title,
                'body'       => $passage->body,
                'topic'      => $passage->topic,
                'level'      => $passage->level,
                'word_count' => $passage->word_count,
            ],
            'questions'   => $passage->questions()
                ->orderBy('position')
                ->get(['id', 'position', 'question_text'])
                ->values()
                ->all(),
            'vocab_words' => $vocabWords,
        ]);
    }

    /** POST /reading/{passage} */
    public function store(Request $request, ReadingPassage $passage): RedirectResponse
    {
        $data = $request->validate([
            'started_at'               => 'required|integer',
            'answers'                  => 'required|array|min:1',
            'answers.*.question_id'    => 'required|integer',
            'answers.*.answer'         => 'required|string|max:2000',
        ]);

        $timeTaken = max(0, (int) round((now()->timestamp * 1000 - $data['started_at']) / 1000));

        $questionMap = $passage->questions()->orderBy('position')->get()->keyBy('id');

        $gradingInput = collect($data['answers'])->map(fn ($a) => [
            'question_id'   => (int) $a['question_id'],
            'position'      => $questionMap->get($a['question_id'])?->position ?? 0,
            'question_text' => $questionMap->get($a['question_id'])?->question_text ?? '',
            'model_answer'  => $questionMap->get($a['question_id'])?->model_answer ?? '',
            'user_answer'   => $a['answer'],
        ])->all();

        $result = (new ReadingGrader())->grade($passage->body, $gradingInput);

        $session = ReadingSession::create([
            'user_id'          => auth()->id(),
            'passage_id'       => $passage->id,
            'status'           => 'graded',
            'answers'          => $data['answers'],
            'score'            => $result->score,
            'question_feedback'=> $result->questionFeedback,
            'overall_note'     => $result->overallNote,
            'time_taken_seconds' => $timeTaken,
            'started_at'       => now()->subSeconds($timeTaken),
            'graded_at'        => now(),
        ]);

        return redirect()->route('reading.sessions.show', $session->id);
    }

    /** POST /reading/{passage}/sample */
    public function sample(ReadingPassage $passage): JsonResponse
    {
        $questions = $passage->questions()->orderBy('position')->get();
        $qList     = $questions->map(fn ($q) => "Q{$q->position}: {$q->question_text}")->implode("\n");

        $text = <<<PROMPT
Read the following passage, then provide model answers for each comprehension question.
Use C1-level vocabulary in your responses. Keep each answer concise (1–2 sentences) and ground it clearly in the passage text.
Format each answer as:  Q1: [answer]   Q2: [answer]  and so on — one per line, no additional commentary.

Passage:
{$passage->body}

Questions:
{$qList}
PROMPT;

        try {
            $generated = GeminiClient::ask($text, 30);
            return response()->json(['text' => trim($generated)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Could not generate sample answers right now. Please try again.'], 500);
        }
    }

    /** GET /reading/sessions/{session} */
    public function session(ReadingSession $session): Response
    {
        abort_if($session->user_id !== auth()->id(), 403);

        $passage     = $session->passage()->with('questions')->first();
        $questionMap = $passage->questions->keyBy('id');
        $answerMap   = collect($session->answers)->keyBy('question_id');
        $fbMap       = collect($session->question_feedback)->keyBy('question_id');

        return Inertia::render('Reading/Feedback', [
            'passage' => [
                'id'    => $passage->id,
                'title' => $passage->title,
                'topic' => $passage->topic,
                'level' => $passage->level,
            ],
            'session' => [
                'id'                  => $session->id,
                'score'               => $session->score,
                'overall_note'        => $session->overall_note,
                'time_taken_seconds'  => $session->time_taken_seconds,
                'graded_at'           => $session->graded_at?->toIso8601String(),
            ],
            'questions' => $passage->questions->sortBy('position')->values()->map(fn ($q) => [
                'id'           => $q->id,
                'position'     => $q->position,
                'question_text'=> $q->question_text,
                'user_answer'  => $answerMap->get($q->id)['answer'] ?? '',
                'feedback'     => $fbMap->get($q->id),
            ])->all(),
        ]);
    }
}

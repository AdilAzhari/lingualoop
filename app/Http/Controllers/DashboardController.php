<?php

namespace App\Http\Controllers;

use App\Models\Prompt;
use App\Models\ReadingPassage;
use App\Models\ReadingQuestion;
use App\Models\SpeakingPrompt;
use App\Services\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** GET /dashboard */
    public function index(): Response
    {
        $reading  = ReadingPassage::orderBy('level')->orderBy('topic')->get(['id', 'title', 'topic', 'level']);
        $speaking = SpeakingPrompt::orderBy('level')->orderBy('topic')->get(['id', 'text', 'topic', 'level']);
        $writing  = Prompt::orderBy('level')->orderBy('task_type')->get(['id', 'text', 'level', 'task_type']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'reading'  => ['b2' => $reading->where('level', 'b2')->count(),  'c1' => $reading->where('level', 'c1')->count(),  'total' => $reading->count()],
                'speaking' => ['b2' => $speaking->where('level', 'b2')->count(), 'c1' => $speaking->where('level', 'c1')->count(), 'total' => $speaking->count()],
                'writing'  => ['b2' => $writing->where('level', 'b2')->count(),  'c1' => $writing->where('level', 'c1')->count(),  'total' => $writing->count()],
            ],
            'reading'  => $reading->values()->all(),
            'speaking' => $speaking->values()->all(),
            'writing'  => $writing->values()->all(),
        ]);
    }

    /** POST /dashboard/generate — preview only, does not persist */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'      => 'required|in:reading,speaking,writing',
            'level'     => 'required|in:b1,b2,c1,c2',
            'topic'     => 'required|string|max:120',
            'task_type' => 'nullable|in:task-1,task-2',
        ]);

        try {
            $result = match ($data['type']) {
                'reading'  => $this->generateReading($data['level'], $data['topic']),
                'speaking' => $this->generateSpeaking($data['level'], $data['topic']),
                'writing'  => $this->generateWriting($data['level'], $data['topic'], $data['task_type'] ?? 'task-2'),
            };

            return response()->json(['ok' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /** POST /dashboard/save — persist a previously generated item */
    public function save(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type'      => 'required|in:reading,speaking,writing',
            'level'     => 'required|in:b1,b2,c1,c2',
            'topic'     => 'nullable|string|max:120',
            'task_type' => 'nullable|in:task-1,task-2',
            // reading
            'title'      => 'required_if:type,reading|nullable|string|max:200',
            'body'       => 'required_if:type,reading|nullable|string',
            'word_count' => 'nullable|integer',
            'questions'  => 'required_if:type,reading|nullable|array',
            'questions.*.position'      => 'required|integer',
            'questions.*.question_text' => 'required|string',
            'questions.*.model_answer'  => 'required|string',
            // speaking
            'text'           => 'required_if:type,speaking,writing|nullable|string',
            'target_seconds' => 'nullable|integer',
            'cue_points'     => 'nullable|array',
        ]);

        match ($data['type']) {
            'reading'  => $this->saveReading($data),
            'speaking' => $this->saveSpeaking($data),
            'writing'  => $this->saveWriting($data),
        };

        return redirect()->route('dashboard')->with('success', 'Saved successfully.');
    }

    /** DELETE /dashboard/{type}/{id} */
    public function destroy(Request $request, string $type, int $id): RedirectResponse
    {
        match ($type) {
            'reading' => $this->deleteReading($id),
            'speaking'=> $this->deleteSpeaking($id),
            'writing' => $this->deleteWriting($id),
            default   => abort(404),
        };

        return back();
    }

    // ── Generators ──────────────────────────────────────────────────────────

    private function generateReading(string $level, string $topic): array
    {
        $levelDesc = $level === 'c1' ? 'C1 (advanced) — sophisticated vocabulary, complex ideas, dense academic prose' : 'B2 (upper-intermediate) — clear academic style, accessible ideas';

        $prompt = <<<PROMPT
Generate a reading comprehension passage for an English language learning app (IELTS preparation).

Level: {$levelDesc}
Topic: {$topic}

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "title": "A specific, informative title (not generic)",
  "topic": "{$topic}",
  "body": "The passage body — exactly 260–290 words. Use formal academic register. Present real facts, research, or a well-structured argument. No headings or bullets — continuous paragraphs only.",
  "word_count": 275,
  "questions": [
    {"position": 1, "question_text": "Factual retrieval question answerable directly from the text", "model_answer": "Precise 1–2 sentence answer grounded in the passage"},
    {"position": 2, "question_text": "Explanation question (why / how)", "model_answer": "..."},
    {"position": 3, "question_text": "Definition or term question", "model_answer": "..."},
    {"position": 4, "question_text": "Example identification question", "model_answer": "..."},
    {"position": 5, "question_text": "Implication or summary question", "model_answer": "..."}
  ]
}

Important: every question must be unambiguously answerable from the passage text alone.
PROMPT;

        $result = GeminiClient::json($prompt, 50);
        $result['type']  = 'reading';
        $result['level'] = $level;
        return $result;
    }

    private function generateSpeaking(string $level, string $topic): array
    {
        $levelDesc    = $level === 'c1' ? 'C1 — abstract argumentation, philosophical nuance, critical analysis, competing perspectives' : 'B2 — personal reflection, accessible ideas, concrete experience';
        $targetSecs   = $level === 'c1' ? 150 : 120;

        $prompt = <<<PROMPT
Generate a speaking practice prompt for an English language learning app (IELTS speaking).

Level: {$levelDesc}
Topic: {$topic}

Return ONLY valid JSON — no markdown, no code fences:
{
  "text": "The speaking task as a single open-ended question or instruction. Must invite a substantive response.",
  "topic": "{$topic}",
  "target_seconds": {$targetSecs},
  "cue_points": [
    "first point to address (a guiding question or sub-topic)",
    "second point to address",
    "third point to address",
    "fourth point to address"
  ]
}

Requirements:
- cue_points must be exactly 4 items
- Each cue point is a concise guiding phrase (not a full sentence question)
- The prompt must be engaging and open-ended, not answerable with yes/no
PROMPT;

        $result = GeminiClient::json($prompt, 40);
        $result['type']  = 'speaking';
        $result['level'] = $level;
        return $result;
    }

    private function generateWriting(string $level, string $topic, string $taskType): array
    {
        $levelDesc = $level === 'c1' ? 'C1 — requires nuanced argumentation, engagement with competing perspectives, analysis of complex phenomena' : 'B2 — clear, accessible, invites personal reflection or straightforward argumentation';
        $taskDesc  = $taskType === 'task-2' ? 'Task 2 (argumentative essay, 250+ words)' : 'Task 1 (descriptive or narrative response, 150+ words)';

        $prompt = <<<PROMPT
Generate a writing practice prompt for an English language learning app (IELTS Academic Writing).

Level: {$levelDesc}
Task type: {$taskDesc}
Topic: {$topic}

Return ONLY valid JSON — no markdown, no code fences:
{
  "text": "The writing prompt — a single clear instruction or question. IELTS Academic style. Do not include word count instructions."
}

The prompt must be substantive and specific — not generic. It should invite a clear argument or position.
PROMPT;

        $result = GeminiClient::json($prompt, 35);
        $result['type']      = 'writing';
        $result['level']     = $level;
        $result['task_type'] = $taskType;
        $result['topic']     = $topic;
        return $result;
    }

    // ── Persisters ──────────────────────────────────────────────────────────

    private function saveReading(array $data): void
    {
        $passage = ReadingPassage::create([
            'title'      => $data['title'],
            'topic'      => $data['topic'],
            'level'      => $data['level'],
            'body'       => $data['body'],
            'word_count' => $data['word_count'] ?? str_word_count($data['body']),
        ]);

        foreach ($data['questions'] as $q) {
            ReadingQuestion::create([
                'passage_id'    => $passage->id,
                'position'      => $q['position'],
                'question_text' => $q['question_text'],
                'model_answer'  => $q['model_answer'],
            ]);
        }
    }

    private function saveSpeaking(array $data): void
    {
        SpeakingPrompt::create([
            'text'           => $data['text'],
            'topic'          => $data['topic'] ?? 'General',
            'level'          => $data['level'],
            'target_seconds' => $data['target_seconds'] ?? 120,
            'cue_points'     => $data['cue_points'] ?? [],
        ]);
    }

    private function saveWriting(array $data): void
    {
        Prompt::create([
            'text'             => $data['text'],
            'level'            => $data['level'],
            'task_type'        => $data['task_type'] ?? 'task-2',
            'duration_minutes' => 20,
            'focus_category'   => 'cohesion_weak',
        ]);
    }

    // ── Deleters ────────────────────────────────────────────────────────────

    private function deleteReading(int $id): void
    {
        $passage = ReadingPassage::findOrFail($id);
        $passage->questions()->delete();
        if (method_exists($passage, 'sessions')) {
            $passage->sessions()->delete();
        }
        $passage->delete();
    }

    private function deleteSpeaking(int $id): void
    {
        $prompt = SpeakingPrompt::findOrFail($id);
        if (method_exists($prompt, 'sessions')) {
            $prompt->sessions()->delete();
        }
        $prompt->delete();
    }

    private function deleteWriting(int $id): void
    {
        Prompt::findOrFail($id)->delete();
    }
}

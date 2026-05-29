<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubmissionRequest;
use App\Jobs\GradeSubmission;
use App\Models\Prompt;
use App\Models\Submission;
use App\Models\VocabularyEntry;
use App\Services\GeminiClient;
use App\Support\StubContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ComposeController extends Controller
{
    /** GET /compose → Write. */
    public function show(): Response
    {
        $user = auth()->user();
        $prompt = Prompt::where('level', $user->level ?? 'b2')->latest()->first();
        $promptData = $prompt
            ? ['id' => $prompt->id, 'text' => $prompt->text, 'level' => $prompt->level, 'task_type' => $prompt->task_type, 'duration_minutes' => $prompt->duration_minutes, 'focus_category' => $prompt->focus_category]
            : StubContent::todayPrompt();

        $cacheKey = "draft:{$user->id}:{$promptData['id']}";
        $draft = Cache::get($cacheKey, ['text' => '', 'updated_at' => null]);

        // Up to 3 recent vocabulary words to encourage using in the essay
        $vocabWords = VocabularyEntry::where('user_id', $user->id)
            ->where('used_in_prompt', false)
            ->orderByDesc('created_at')
            ->take(3)
            ->pluck('word')
            ->all();

        return Inertia::render('Compose', [
            'prompt' => $promptData,
            'draft' => $draft,
            'focus_category' => $promptData['focus_category'] ?? null,
            'focus_label' => 'Prepositions',
            'vocab_challenge' => $vocabWords,
        ]);
    }

    /** POST /compose/sample → on-demand sample essay for the current prompt. */
    public function sample(): JsonResponse
    {
        $user   = auth()->user();
        $prompt = Prompt::where('level', $user->level ?? 'b2')->latest()->first();

        if (! $prompt) {
            return response()->json(['error' => 'No prompt found.'], 404);
        }

        $taskDesc = $prompt->task_type === 'task-2'
            ? 'IELTS Academic Writing Task 2 argumentative essay (250–280 words)'
            : 'IELTS Academic Writing Task 1 descriptive response (150–180 words)';

        $text = <<<PROMPT
Write a sample {$taskDesc} for the following prompt.
Use sophisticated C1-level academic vocabulary naturally and precisely — words such as unequivocal, substantiate, exacerbate, nuanced, pertinent, empirical, discernible, ostensibly, underpin, hitherto.
Structure: introduction with a clear thesis → two body paragraphs each with a topic sentence, supporting evidence, and an example → conclusion restating the thesis.
Write in continuous paragraphs; do NOT include section labels or headings.

Prompt: {$prompt->text}
PROMPT;

        try {
            $generated = GeminiClient::ask($text, 35);
            return response()->json(['text' => trim($generated)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Could not generate a sample right now. Please try again.'], 500);
        }
    }

    /** POST /compose/draft → debounced autosave per user. */
    public function saveDraft(Request $request): RedirectResponse
    {
        $data = $request->validate(['prompt_id' => 'required|integer', 'text' => 'nullable|string']);
        $cacheKey = "draft:{$request->user()->id}:{$data['prompt_id']}";
        Cache::put($cacheKey, [
            'text' => $data['text'] ?? '',
            'updated_at' => now()->toIso8601String(),
        ], now()->addDays(7));

        return back();
    }

    /** POST /compose → create submission, kick off grading, show Grading screen. */
    public function store(StoreSubmissionRequest $request): Response
    {
        $user = $request->user();
        $promptId = $request->validated('prompt_id');

        // Find or fall back to the stub prompt ID
        $promptExists = Prompt::whereKey($promptId)->exists();
        $resolvedPromptId = $promptExists ? $promptId : null;

        $submission = Submission::create([
            'user_id' => $user->id,
            'prompt_id' => $resolvedPromptId ?? $promptId,
            'text' => $request->validated('text'),
            'status' => 'grading',
            'submitted_at' => now(),
        ]);

        Cache::put("grading:{$submission->id}:started_at", now()->timestamp, now()->addHour());
        Cache::forget("grading:{$submission->id}:status");

        $vocabWords = VocabularyEntry::where('user_id', $user->id)
            ->where('used_in_prompt', false)
            ->orderByDesc('created_at')
            ->take(5)
            ->get(['word', 'definition'])
            ->map(fn ($e) => ['word' => $e->word, 'definition' => $e->definition ?? ''])
            ->all();

        GradeSubmission::dispatch($submission->id, [
            'text'           => $submission->text,
            'level'          => $user->level ?? 'b2',
            'focus_category' => 'preposition_choice',
            'vocab_words'    => $vocabWords,
        ]);

        return Inertia::render('Grading', [
            'submission_id' => $submission->id,
            'estimated_seconds' => 10,
            'channel' => "submission.{$submission->id}",
        ]);
    }
}

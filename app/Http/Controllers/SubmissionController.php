<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Services\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    /** GET /submissions → full history list. */
    public function index(): Response
    {
        $submissions = Submission::with('prompt')
            ->where('user_id', auth()->id())
            ->where('status', 'graded')
            ->orderByDesc('submitted_at')
            ->paginate(20);

        return Inertia::render('Submissions', [
            'submissions' => $submissions->through(fn ($s) => [
                'id' => $s->id,
                'submitted_at' => $s->submitted_at?->toIso8601String(),
                'score' => [
                    'grammar' => $s->score_grammar,
                    'vocabulary' => $s->score_vocabulary,
                    'coherence' => $s->score_coherence,
                    'task' => $s->score_task,
                    'overall' => $s->overall,
                ],
                'prompt' => ['text' => $s->prompt?->text ?? '—'],
                'headline' => $s->headline,
            ]),
        ]);
    }

    /** GET /submissions/{id} → Feedback page. */
    public function show(int $id): Response
    {
        $submission = Submission::with(['prompt', 'errorInstances'])
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        // Count how many times each error type appeared in the last 14 days (excluding this submission)
        $recentCounts = \App\Models\ErrorInstance::where('user_id', auth()->id())
            ->where('submission_id', '!=', $id)
            ->where('created_at', '>=', now()->subDays(14))
            ->get()
            ->groupBy('type')
            ->map->count();

        $errors = $submission->errorInstances->map(fn ($e) => [
            'id' => 'e' . $e->id,
            'type' => $e->type,
            'dimension' => $e->dimension,
            'span_start' => $e->span_start,
            'span_end' => $e->span_end,
            'span_text' => $e->span_text,
            'suggested_fix' => $e->suggested_fix,
            'note' => $e->note,
            'severity' => $e->severity,
            'recent_count' => ($recentCounts[$e->type] ?? 0) + 1,
        ])->all();

        $noticedPattern = Cache::get("grading:{$id}:noticed");
        $drillCardCount = Cache::get("grading:{$id}:drill_cards", 0);

        // Delta vs last graded submission before this one
        $prevSubmission = Submission::where('user_id', auth()->id())
            ->where('status', 'graded')
            ->where('id', '<', $id)
            ->latest()
            ->first();
        $delta = $prevSubmission
            ? $submission->overall - $prevSubmission->overall
            : 0;

        return Inertia::render('Feedback', [
            'submission' => [
                'id' => $submission->id,
                'prompt' => $submission->prompt ? [
                    'id' => $submission->prompt->id,
                    'text' => $submission->prompt->text,
                    'level' => $submission->prompt->level,
                    'task_type' => $submission->prompt->task_type,
                    'duration_minutes' => $submission->prompt->duration_minutes,
                    'focus_category' => $submission->prompt->focus_category,
                ] : null,
                'text' => $submission->text,
                'submitted_at' => $submission->submitted_at?->toIso8601String(),
                'graded_at' => $submission->graded_at?->toIso8601String(),
                'status' => $submission->status,
                'score' => [
                    'grammar' => $submission->score_grammar,
                    'vocabulary' => $submission->score_vocabulary,
                    'coherence' => $submission->score_coherence,
                    'task' => $submission->score_task,
                    'overall' => $submission->overall,
                ],
                'errors' => $errors,
                'dimension_notes'  => $submission->dimension_notes ?? ['grammar' => '', 'vocabulary' => '', 'coherence' => '', 'task' => ''],
                'vocab_examples'   => $submission->vocab_examples ?? [],
                'headline' => $submission->headline ?? ['primary' => 'Feedback', 'secondary' => ''],
                'meta' => ['model' => 'stub', 'taxonomy_version' => 'v3.2'],
                'added_drill_cards' => $drillCardCount,
                'recurring_pattern' => $noticedPattern,
            ],
            'delta_vs_last_week' => $delta,
        ]);
    }

    /**
     * GET /submissions/{id}/status → polling fallback for the Grading screen.
     * Computes phase from elapsed time; Reverb supersedes this when wired.
     */
    public function status(int $id): JsonResponse
    {
        $startedAt = Cache::get("grading:{$id}:started_at");
        if ($startedAt === null) {
            return response()->json(['status' => 'graded', 'phase' => 3]);
        }

        $elapsed = now()->timestamp - $startedAt;
        $phase = min(3, intdiv($elapsed, 2));
        $status = $elapsed >= 8 ? 'graded' : 'grading';

        return response()->json(['status' => $status, 'phase' => $phase]);
    }

    /** POST /submissions/{id}/coach — generate 3 actionable priorities from errors */
    public function coach(int $id): JsonResponse
    {
        $submission = Submission::with('errorInstances')
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        $errorSummary = $submission->errorInstances
            ->groupBy('type')
            ->map(fn ($g, $type) => "{$type} ({$g->count()} instance" . ($g->count() > 1 ? 's' : '') . ")")
            ->values()
            ->implode(', ');

        $dimensionNotes = collect($submission->dimension_notes ?? [])
            ->map(fn ($note, $dim) => "{$dim}: {$note}")
            ->implode("\n");

        $prompt = <<<PROMPT
You are an IELTS writing coach. A student just submitted an essay and received this feedback:

Error patterns found: {$errorSummary}

Dimension feedback:
{$dimensionNotes}

Overall score: {$submission->overall}/100

Generate exactly 3 concise, specific, actionable coaching priorities for the student's NEXT essay.
Each priority should be 1–2 sentences max. Focus on the most impactful improvements.
Use encouraging but direct language. Do NOT repeat generic advice.

Return ONLY valid JSON — no markdown, no code fences:
{"priorities": ["Priority 1 text.", "Priority 2 text.", "Priority 3 text."]}
PROMPT;

        try {
            $result = GeminiClient::json($prompt, 30);
            return response()->json(['priorities' => $result['priorities'] ?? []]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

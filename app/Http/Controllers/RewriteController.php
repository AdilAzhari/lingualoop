<?php

namespace App\Http\Controllers;

use App\Models\ParagraphRewrite;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RewriteController extends Controller
{
    /** GET /submissions/{submission}/rewrite */
    public function show(Submission $submission): Response
    {
        abort_if($submission->user_id !== auth()->id(), 403);

        // Pick the paragraph with the most errors as the rewrite target
        $errors = $submission->errorInstances()->where('severity', '!=', 'good')->get();
        $text = $submission->text;
        $paragraphs = array_values(array_filter(explode("\n\n", $text)));

        // Find which paragraph has the most errors by checking span_start offsets
        $scored = collect($paragraphs)->map(function ($para, $i) use ($paragraphs, $errors) {
            $offset = array_sum(array_map(fn ($p) => strlen($p) + 2, array_slice($paragraphs, 0, $i)));
            $len = strlen($para);
            $count = $errors->filter(fn ($e) => $e->span_start >= $offset && $e->span_start < $offset + $len)->count();
            return ['para' => $para, 'count' => $count];
        });

        $target = $scored->sortByDesc('count')->first();
        $targetPara = $target['para'] ?? ($paragraphs[0] ?? $text);

        $errorsInPara = $errors->filter(fn ($e) => str_contains($targetPara, $e->span_text))
            ->map(fn ($e) => ['type' => $e->type, 'span_text' => $e->span_text, 'suggested_fix' => $e->suggested_fix, 'note' => $e->note])
            ->values()
            ->all();

        $previousRewrites = ParagraphRewrite::where('submission_id', $submission->id)
            ->where('user_id', auth()->id())
            ->latest()
            ->take(3)
            ->get(['id', 'rewritten_paragraph', 'ai_feedback', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'rewrite' => $r->rewritten_paragraph,
                'feedback' => $r->ai_feedback,
                'date' => $r->created_at->format('M j, H:i'),
            ])
            ->all();

        return Inertia::render('Rewrite', [
            'submission_id' => $submission->id,
            'original_paragraph' => $targetPara,
            'errors_targeted' => $errorsInPara,
            'previous_rewrites' => $previousRewrites,
        ]);
    }

    /** POST /submissions/{submission}/rewrite */
    public function store(Request $request, Submission $submission): RedirectResponse
    {
        abort_if($submission->user_id !== auth()->id(), 403);

        $data = $request->validate([
            'original_paragraph' => 'required|string',
            'rewritten_paragraph' => 'required|string|min:20',
            'errors_targeted' => 'required|array',
        ]);

        // Simple check: did they fix the targeted errors?
        $fixed = collect($data['errors_targeted'])->filter(fn ($e) =>
            isset($e['span_text']) && ! str_contains($data['rewritten_paragraph'], $e['span_text'])
        )->count();

        $total = count($data['errors_targeted']);
        $improved = $total > 0 && $fixed >= ceil($total / 2);

        $notes = $improved
            ? "Good. You removed at least {$fixed} of the {$total} flagged patterns. Keep this rhythm."
            : "The rewrite is a start, but {$total} flagged patterns may still be present. Read it against the original.";

        ParagraphRewrite::create([
            'user_id' => auth()->id(),
            'submission_id' => $submission->id,
            'original_paragraph' => $data['original_paragraph'],
            'rewritten_paragraph' => $data['rewritten_paragraph'],
            'errors_targeted' => $data['errors_targeted'],
            'ai_feedback' => ['improved' => $improved, 'notes' => $notes],
        ]);

        return back();
    }
}

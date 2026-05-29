<?php

namespace App\Http\Controllers;

use App\Models\VocabularyEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VocabularyReviewController extends Controller
{
    /** GET /vocabulary/review */
    public function index(): Response
    {
        $cards = VocabularyEntry::where('user_id', auth()->id())
            ->where(fn ($q) => $q->whereNull('srs_due_at')->orWhere('srs_due_at', '<=', now()))
            ->orderByRaw("CASE WHEN srs_state = 'new' THEN 0 WHEN srs_state = 'learning' THEN 1 ELSE 2 END")
            ->orderBy('srs_due_at')
            ->take(20)
            ->get(['id', 'word', 'definition', 'example', 'level', 'srs_state', 'srs_stability'])
            ->map(fn ($e) => [
                'id'         => $e->id,
                'word'       => $e->word,
                'definition' => $e->definition,
                'example'    => $e->example,
                'level'      => $e->level,
                'state'      => $e->srs_state,
            ])
            ->all();

        $totalDue = VocabularyEntry::where('user_id', auth()->id())
            ->where(fn ($q) => $q->whereNull('srs_due_at')->orWhere('srs_due_at', '<=', now()))
            ->count();

        return Inertia::render('Vocabulary/Review', [
            'cards'     => $cards,
            'total_due' => $totalDue,
        ]);
    }

    /** POST /vocabulary/review/{entry} — rate recall quality */
    public function answer(Request $request, VocabularyEntry $entry): RedirectResponse
    {
        abort_if($entry->user_id !== auth()->id(), 403);

        $rating = $request->validate(['rating' => 'required|in:forgot,hard,good,easy'])['rating'];

        $this->applySrs($entry, $rating);
        $entry->last_reviewed_at = now();
        $entry->save();

        return back();
    }

    private function applySrs(VocabularyEntry $entry, string $rating): void
    {
        $stability  = max(0.5, $entry->srs_stability);
        $difficulty = $entry->srs_difficulty;
        $isNew      = $entry->srs_state === 'new';

        if ($rating === 'forgot') {
            $entry->srs_stability  = 0.5;
            $entry->srs_difficulty = min(10.0, $difficulty + 1.0);
            $entry->srs_state      = 'learning';
            $entry->srs_due_at     = now()->addDay();
        } elseif ($rating === 'hard') {
            $newStab = $isNew ? 1.0 : round($stability * 1.2, 2);
            $entry->srs_stability  = $newStab;
            $entry->srs_difficulty = min(10.0, $difficulty + 0.3);
            $entry->srs_state      = 'learning';
            $entry->srs_due_at     = now()->addDays(max(1, (int) ($newStab * 0.6)));
        } elseif ($rating === 'good') {
            $newStab = $isNew ? 2.0 : round($stability * 2.0, 2);
            $entry->srs_stability  = $newStab;
            $entry->srs_state      = 'review';
            $entry->srs_due_at     = now()->addDays(max(1, (int) $newStab));
        } else {
            $newStab = $isNew ? 4.0 : round($stability * 2.5, 2);
            $entry->srs_stability  = $newStab;
            $entry->srs_difficulty = max(1.0, $difficulty - 0.2);
            $entry->srs_state      = 'review';
            $entry->srs_due_at     = now()->addDays(max(1, (int) ($newStab * 1.5)));
        }
    }
}

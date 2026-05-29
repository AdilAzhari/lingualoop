<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnswerDrillCardRequest;
use App\Models\DrillCard;
use App\Models\DrillSession;
use App\Support\StubContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DrillController extends Controller
{
    /** GET /drill → drill session from the learner's due cards. */
    public function index(): Response
    {
        $user = auth()->user();

        $dbCards = DrillCard::where('user_id', $user->id)
            ->where(fn ($q) => $q->whereNull('due_at')->orWhere('due_at', '<=', now()))
            ->orderBy('due_at')
            ->take(10)
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'type' => $c->type,
                'source' => $c->source_span_text ? "Your submission" : 'Synthesized from your patterns',
                'is_real_source' => $c->source_submission_id !== null,
                'prompt' => $c->prompt,
                'options' => $c->options,
                'correct_index' => $c->correct_index,
                'yours' => $c->source_span_text,
                'note' => $c->note,
            ])
            ->all();

        // Fall back to stub cards if the user has none yet
        $cards = count($dbCards) > 0 ? $dbCards : StubContent::drillCards();

        // Determine focus category from the first card's type
        $focusCategory = count($dbCards) > 0
            ? ($dbCards[0]['type'] ?? 'preposition_choice')
            : 'preposition_choice';

        $sessionId = (string) Str::uuid();

        // Create a session record (completed later via summary endpoint)
        DrillSession::create([
            'user_id' => $user->id,
            'session_uuid' => $sessionId,
            'focus_category' => $focusCategory,
            'total_cards' => count($cards),
        ]);

        return Inertia::render('Drill/Index', [
            'session_id' => $sessionId,
            'cards' => $cards,
            'focus_category' => $focusCategory,
        ]);
    }

    /** POST /drill/{card}/answer → record answer and apply FSRS scheduling. */
    public function answer(AnswerDrillCardRequest $request, string $card): RedirectResponse
    {
        $drillCard = DrillCard::where('user_id', auth()->id())->find($card);

        if ($drillCard) {
            $correct = $request->boolean('correct');
            $this->applyFsrs($drillCard, $correct);
            $drillCard->last_reviewed_at = now();
            $drillCard->save();
        }

        return back();
    }

    /** GET /drill/summary → results screen + persist session result. */
    public function summary(Request $request): Response
    {
        $total = (int) $request->integer('total', 5);
        $correct = (int) $request->integer('correct', 0);
        $sessionId = (string) $request->string('session', '');

        // Mark the session as complete
        DrillSession::where('session_uuid', $sessionId)
            ->where('user_id', auth()->id())
            ->update(['correct_cards' => $correct, 'completed_at' => now()]);

        // Recent session history (last 7)
        $history = DrillSession::where('user_id', auth()->id())
            ->whereNotNull('completed_at')
            ->orderByDesc('completed_at')
            ->take(7)
            ->get()
            ->map(fn ($s) => [
                'date' => $s->completed_at->format('M j'),
                'correct' => $s->correct_cards,
                'total' => $s->total_cards,
                'accuracy' => $s->accuracy,
            ])
            ->all();

        return Inertia::render('Drill/Summary', [
            'session_id' => $sessionId,
            'focus_category' => 'preposition_choice',
            'correct' => $correct,
            'total' => $total,
            'note' => $correct >= $total
                ? "Perfect session — I'll space these out further."
                : "Good work. I'll bring the missed ones back tomorrow.",
            'history' => $history,
        ]);
    }

    private function applyFsrs(DrillCard $card, bool $correct): void
    {
        if ($correct) {
            if ($card->state === 'new') {
                $card->stability = 1.0;
                $card->state = 'learning';
                $card->due_at = now()->addDay();
            } elseif ($card->state === 'learning') {
                $card->stability = 4.0;
                $card->state = 'review';
                $card->due_at = now()->addDays(4);
            } else {
                $card->stability = round($card->stability * 2.5, 2);
                $card->due_at = now()->addDays((int) max(1, $card->stability));
            }
        } else {
            $card->stability = max(0.5, round($card->stability * 0.5, 2));
            $card->difficulty = min(10.0, $card->difficulty + 0.5);
            $card->state = 'learning';
            $card->due_at = now()->addDay();
        }
    }
}

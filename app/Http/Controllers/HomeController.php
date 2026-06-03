<?php

namespace App\Http\Controllers;

use App\Models\DrillCard;
use App\Models\ImageSession;
use App\Models\LevelMilestone;
use App\Models\ListeningSession;
use App\Models\Prompt;
use App\Models\ReadingSession;
use App\Models\SeSession;
use App\Models\SpeakingSession;
use App\Models\Streak;
use App\Models\VocabularyEntry;
use App\Support\StubContent;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /** GET / → Today dashboard. */
    public function __invoke(): Response
    {
        $user = auth()->user();

        // Today's prompt (first for user's level, or stub)
        $prompt = Prompt::where('level', $user->level ?? 'b2')->latest()->first();
        $todayPrompt = $prompt
            ? ['id' => $prompt->id, 'text' => $prompt->text, 'level' => $prompt->level, 'task_type' => $prompt->task_type, 'duration_minutes' => $prompt->duration_minutes, 'focus_category' => $prompt->focus_category]
            : StubContent::todayPrompt();

        // Streak
        $streak = $user->streak;
        $currentDays = $streak?->current_days ?? 0;
        $streakData = [
            'current_days' => $currentDays,
            'history' => $this->buildStreakHistory($currentDays),
        ];

        // Most recent graded submission for headline
        $lastGraded = $user->submissions()->where('status', 'graded')->latest()->first();
        $headline = $lastGraded?->headline ?? ['primary' => 'Ready to write?', 'secondary' => ''];

        // Score history (last 10 graded, oldest first)
        $scoreHistory = $user->submissions()
            ->where('status', 'graded')
            ->orderBy('submitted_at')
            ->take(10)
            ->get()
            ->map(fn ($s) => [
                'date' => $s->submitted_at?->format('M j') ?? '—',
                'score' => $s->overall,
            ])
            ->all();

        // Has the user already written today?
        $writtenToday = $user->submissions()
            ->where('created_at', '>=', today())
            ->exists();

        // Cross-skill activity for today
        $readingToday   = ReadingSession::where('user_id', $user->id)->where('created_at', '>=', today())->count();
        $speakingToday  = SpeakingSession::where('user_id', $user->id)->where('created_at', '>=', today())->count();
        $listeningToday = ListeningSession::where('user_id', $user->id)->where('created_at', '>=', today())->count();
        $imageToday     = ImageSession::where('user_id', $user->id)->where('created_at', '>=', today())->count();
        $seToday        = SeSession::where('user_id', $user->id)->where('created_at', '>=', today())->count();
        $vocabDue       = VocabularyEntry::where('user_id', $user->id)
            ->where(fn ($q) => $q->whereNull('srs_due_at')->orWhere('srs_due_at', '<=', now()))
            ->count();
        $drillDue = DrillCard::where('user_id', $user->id)
            ->where(fn ($q) => $q->whereNull('due_at')->orWhere('due_at', '<=', now()))
            ->count();

        // Recent submissions
        $recent = $user->submissions()
            ->with('prompt')
            ->where('status', 'graded')
            ->latest()
            ->take(3)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'submitted_at' => $s->submitted_at?->diffForHumans() ?? '—',
                'score' => ['overall' => $s->overall],
                'prompt' => ['text' => $s->prompt?->text ?? '—'],
                'flag' => null,
            ])
            ->all();

        // Top error patterns from the last 4 weeks
        $patterns = $user->errorInstances()
            ->where('created_at', '>=', now()->subWeeks(4))
            ->get()
            ->groupBy('type')
            ->map(fn ($g, $code) => [
                'code' => $code,
                'display_name' => ucfirst(str_replace('_', ' ', $code)),
                'delta' => $g->count(),
                'trend' => 'up',
            ])
            ->sortByDesc('delta')
            ->take(3)
            ->values()
            ->all();

        // Level progression check: if last 3 submissions avg grammar+task ≥ 85, suggest upgrade
        $levelUp = null;
        $levelMap = ['a2' => 'b1', 'b1' => 'b2', 'b2' => 'c1', 'c1' => 'c2'];
        $nextLevel = $levelMap[$user->level ?? 'b2'] ?? null;
        if ($nextLevel) {
            $recentScores = $user->submissions()
                ->where('status', 'graded')
                ->orderByDesc('submitted_at')
                ->take(3)
                ->get();
            if ($recentScores->count() === 3) {
                $avgOverall = $recentScores->avg(fn ($s) => $s->overall);
                $avgGrammar = $recentScores->avg('score_grammar');
                if ($avgOverall >= 85 && $avgGrammar >= 85) {
                    $alreadyLogged = \App\Models\LevelMilestone::where('user_id', $user->id)
                        ->where('to_level', $nextLevel)
                        ->exists();
                    if (! $alreadyLogged) {
                        $levelUp = ['current' => $user->level, 'suggested' => $nextLevel, 'avg_score' => (int) round($avgOverall)];
                    }
                }
            }
        }

        $h = (int) now()->format('G');
        $timeOfDay = match (true) {
            $h < 5 => 'night',
            $h < 12 => 'morning',
            $h < 18 => 'afternoon',
            default => 'evening',
        };

        $dayLabel = $currentDays > 0
            ? now()->format('l') . ' · day ' . $currentDays . ' of practice'
            : now()->format('l') . ' · welcome back';

        return Inertia::render('Home', [
            'greeting' => ['time_of_day' => $timeOfDay, 'day_label' => $dayLabel],
            'headline' => $headline,
            'lead' => count($patterns) > 0
                ? "Your top pattern this week: {$patterns[0]['display_name']}. Let's keep pushing."
                : "Start writing and I'll build a personalised error profile for you.",
            'today_prompt' => $todayPrompt,
            'streak' => $streakData,
            'patterns' => count($patterns) > 0 ? $patterns : StubContent::home()['patterns'],
            'recent' => count($recent) > 0 ? $recent : StubContent::home()['recent'],
            'score_history' => $scoreHistory,
            'written_today' => $writtenToday,
            'level_up' => $levelUp,
            'today_activity' => [
                'reading'   => $readingToday,
                'speaking'  => $speakingToday,
                'listening' => $listeningToday,
                'image'     => $imageToday,
                'se'        => $seToday,
                'vocab_due' => $vocabDue,
                'drill_due' => $drillDue,
            ],
        ]);
    }

    private function buildStreakHistory(int $currentDays): array
    {
        $days = min(21, $currentDays);
        return [
            ...array_fill(0, 21 - $days, 0),
            ...array_fill(0, $days, 1),
        ];
    }
}

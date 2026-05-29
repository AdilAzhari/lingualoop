<?php

namespace App\Http\Controllers;

use App\Models\ListeningSession;
use App\Models\ReadingSession;
use App\Models\SpeakingSession;
use App\Models\Streak;
use App\Models\VocabularyEntry;
use App\Services\ErrorProfile\ProfileAggregator;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(private ProfileAggregator $aggregator) {}

    /** GET /profile → Error profile + stratigraphy. */
    public function __invoke(): Response
    {
        $user = auth()->user();

        $rawInstances = $user->errorInstances()->get();

        $instances = $rawInstances->map(fn ($e) => [
            'code' => $e->type,
            'dimension' => $e->dimension,
            'display_name' => ucfirst(str_replace('_', ' ', $e->type)),
            'occurred_at' => $e->created_at,
        ]);

        $layers = $instances->isEmpty()
            ? $this->aggregator->stub()
            : $this->aggregator->aggregate($instances);

        // Compute by_dimension counts
        $byDimension = $rawInstances->groupBy('dimension')
            ->map(fn ($g, $dim) => [
                'dimension' => $dim,
                'count' => $g->count(),
                'codes' => $g->pluck('type')->unique()->values()->all(),
            ])
            ->values()
            ->all();

        if (empty($byDimension)) {
            $byDimension = [
                ['dimension' => 'grammar', 'count' => 23, 'codes' => ['preposition_choice', 'article_omission', 'subject_verb_agreement', 'comma_splice', 'verb_tense_shift']],
                ['dimension' => 'vocabulary', 'count' => 12, 'codes' => ['register_mismatch', 'word_form', 'collocation_unusual']],
                ['dimension' => 'coherence', 'count' => 8, 'codes' => ['cohesion_weak', 'paragraph_unfocused']],
                ['dimension' => 'task', 'count' => 3, 'codes' => ['off_topic_drift', 'prompt_partial']],
            ];
        }

        // Determine active focus from the top active layer
        $topActive = collect($layers)->where('status', 'active')->sortByDesc('peak')->first();
        $activeFocus = $topActive ? [
            'code' => $topActive['code'],
            'display_name' => $topActive['display_name'],
            'headline' => $topActive['display_name'] . ' — ' . (array_slice($topActive['weeks'], -2) ? 'recurring pattern.' : 'watch this space.'),
            'lead' => 'This is your most active error type. We\'ll track it week by week.',
            'weekly_count' => collect($topActive['weeks'])->last()['count'] ?? 0,
            'monthly_count' => $topActive['peak'],
        ] : [
            'code' => 'preposition_choice',
            'display_name' => 'Preposition choice',
            'headline' => 'Preposition choice — at / in / on in motion and location.',
            'lead' => "3 instances this week. 11 in the last month. We'll know this one is gone when you go two weeks without it.",
            'weekly_count' => 3,
            'monthly_count' => 11,
        ];

        $scoreHistory = $user->submissions()
            ->where('status', 'graded')
            ->orderBy('submitted_at')
            ->take(10)
            ->get()
            ->map(fn ($s) => ['date' => $s->submitted_at?->format('M j') ?? '—', 'score' => $s->overall])
            ->all();

        $readingHistory = ReadingSession::where('user_id', $user->id)
            ->where('status', 'graded')
            ->orderBy('graded_at')
            ->take(10)
            ->get()
            ->map(fn ($s) => ['date' => $s->graded_at?->format('M j') ?? '—', 'score' => (int) $s->score])
            ->all();

        $speakingHistory = SpeakingSession::where('user_id', $user->id)
            ->where('status', 'graded')
            ->orderBy('graded_at')
            ->take(10)
            ->get()
            ->map(fn ($s) => ['date' => $s->graded_at?->format('M j') ?? '—', 'score' => $s->overall])
            ->all();

        $listeningHistory = ListeningSession::where('user_id', $user->id)
            ->where('status', 'graded')
            ->orderBy('graded_at')
            ->take(10)
            ->get()
            ->map(fn ($s) => ['date' => $s->graded_at?->format('M j') ?? '—', 'score' => (int) $s->score])
            ->all();

        $bestWriting = (int) round((float) $user->submissions()
            ->where('status', 'graded')
            ->selectRaw('MAX((score_grammar + score_vocabulary + score_coherence + score_task) / 4.0) as best')
            ->value('best'));

        $bestReading = (int) ReadingSession::where('user_id', $user->id)->where('status', 'graded')->max('score');

        $bestSpeaking = (int) round((float) SpeakingSession::where('user_id', $user->id)->where('status', 'graded')
            ->selectRaw('MAX((score_fluency + score_vocabulary + score_grammar + score_pronunciation) / 4.0) as best')
            ->value('best'));

        $streak = Streak::where('user_id', $user->id)->value('current_days') ?? 0;

        $badgeStats = [
            'streak'    => (int) $streak,
            'essays'    => $user->submissions()->where('status', 'graded')->count(),
            'reading'   => ReadingSession::where('user_id', $user->id)->where('status', 'graded')->count(),
            'speaking'  => SpeakingSession::where('user_id', $user->id)->where('status', 'graded')->count(),
            'listening' => ListeningSession::where('user_id', $user->id)->where('status', 'graded')->count(),
            'vocab'     => VocabularyEntry::where('user_id', $user->id)->count(),
            'best_writing'  => $bestWriting,
            'best_reading'  => $bestReading,
            'best_speaking' => $bestSpeaking,
        ];

        return Inertia::render('Profile', [
            'active_focus'      => $activeFocus,
            'layers'            => $layers,
            'by_dimension'      => $byDimension,
            'score_history'     => $scoreHistory,
            'reading_history'   => $readingHistory,
            'speaking_history'  => $speakingHistory,
            'listening_history' => $listeningHistory,
            'badge_stats'       => $badgeStats,
        ]);
    }
}

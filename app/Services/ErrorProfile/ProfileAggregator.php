<?php

namespace App\Services\ErrorProfile;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Builds the 12-week stratigraphy data for the Profile page (handoff §6.5).
 *
 * `aggregate()` is the production algorithm; it expects a collection of error
 * instances each shaped like:
 *   ['code' => string, 'dimension' => string, 'display_name' => string, 'occurred_at' => CarbonImmutable|string]
 *
 * `stub()` returns the prototype's canned layers so the Profile page renders
 * with no database.
 */
class ProfileAggregator
{
    private const WEEKS = 12;
    private const DISPLAY_NAMES = [
        'preposition_choice' => 'Preposition choice',
        'article_omission' => 'Article omission',
        'register_mismatch' => 'Register slip',
        'subject_verb_agreement' => 'Subject-verb agreement',
        'cohesion_weak' => 'Cohesion weak',
        'comma_splice' => 'Comma splice',
        'verb_tense_shift' => 'Verb tense shift',
        'word_form' => 'Word form',
        'collocation_unusual' => 'Collocation unusual',
        'paragraph_unfocused' => 'Paragraph unfocused',
        'off_topic_drift' => 'Off-topic drift',
        'prompt_partial' => 'Prompt partial',
    ];
    private const DIMENSION_OF = [
        'preposition_choice' => 'grammar', 'article_omission' => 'grammar',
        'subject_verb_agreement' => 'grammar', 'comma_splice' => 'grammar', 'verb_tense_shift' => 'grammar',
        'register_mismatch' => 'vocabulary', 'word_form' => 'vocabulary', 'collocation_unusual' => 'vocabulary',
        'cohesion_weak' => 'coherence', 'paragraph_unfocused' => 'coherence',
        'off_topic_drift' => 'task', 'prompt_partial' => 'task',
    ];

    /**
     * @param  Collection<int,array{code:string,dimension?:string,occurred_at:mixed}>  $instances
     * @return array<int,array> ordered by status (active, improving, resolved), peak desc
     */
    public function aggregate(Collection $instances, ?CarbonImmutable $now = null): array
    {
        $now = $now ?? CarbonImmutable::now();
        $weekStarts = collect(range(self::WEEKS - 1, 0))
            ->map(fn (int $back) => $now->startOfWeek()->subWeeks($back));

        $byCode = $instances->groupBy('code');
        $layers = [];

        foreach ($byCode as $code => $codeInstances) {
            // 1. Bin by week.
            $bins = $weekStarts->map(function (CarbonImmutable $weekStart) use ($codeInstances) {
                $weekEnd = $weekStart->addWeek();
                $count = $codeInstances->filter(function ($i) use ($weekStart, $weekEnd) {
                    $at = CarbonImmutable::parse($i['occurred_at']);
                    return $at >= $weekStart && $at < $weekEnd;
                })->count();

                return ['week_starting' => $weekStart->toDateString(), 'count' => $count];
            });

            $peak = (int) $codeInstances->count();
            $maxWeek = max(1, (int) $bins->max('count'));

            // 3. Normalize each week's count to 0..1 by the layer's busiest week.
            $weeks = $bins->map(fn ($b) => [
                'week_starting' => $b['week_starting'],
                'count' => $b['count'],
                'intensity' => round($b['count'] / $maxWeek, 3),
            ])->values()->all();

            $layers[] = [
                'code' => $code,
                'display_name' => self::DISPLAY_NAMES[$code] ?? ucfirst(str_replace('_', ' ', $code)),
                'dimension' => self::DIMENSION_OF[$code] ?? 'grammar',
                'peak' => $peak,
                'status' => $this->status($codeInstances, $now),
                'weeks' => $weeks,
            ];
        }

        return $this->sortLayers($layers);
    }

    /**
     * 2. status:
     *  - resolved: 0 instances in last 14 days AND there was activity before
     *  - improving: last-4-weeks total < first-4-weeks total by 30%+
     *  - active: otherwise
     */
    private function status(Collection $codeInstances, CarbonImmutable $now): string
    {
        $cutoff = $now->subDays(14);
        $recent = $codeInstances->filter(fn ($i) => CarbonImmutable::parse($i['occurred_at']) >= $cutoff)->count();
        $hadActivityBefore = $codeInstances->filter(fn ($i) => CarbonImmutable::parse($i['occurred_at']) < $cutoff)->count();

        if ($recent === 0 && $hadActivityBefore > 0) {
            return 'resolved';
        }

        $firstFour = $now->startOfWeek()->subWeeks(self::WEEKS - 1);
        $lastFourStart = $now->startOfWeek()->subWeeks(3);
        $firstWindowEnd = $firstFour->addWeeks(4);

        $first = $codeInstances->filter(function ($i) use ($firstFour, $firstWindowEnd) {
            $at = CarbonImmutable::parse($i['occurred_at']);
            return $at >= $firstFour && $at < $firstWindowEnd;
        })->count();
        $last = $codeInstances->filter(fn ($i) => CarbonImmutable::parse($i['occurred_at']) >= $lastFourStart)->count();

        if ($first > 0 && $last <= $first * 0.7) {
            return 'improving';
        }

        return 'active';
    }

    /** 4. active desc by peak, then improving desc, then resolved desc. */
    private function sortLayers(array $layers): array
    {
        $rank = ['active' => 0, 'improving' => 1, 'resolved' => 2];
        usort($layers, function ($a, $b) use ($rank) {
            return [$rank[$a['status']], -$a['peak']] <=> [$rank[$b['status']], -$b['peak']];
        });

        return $layers;
    }

    /** Prototype layers (handoff §6.5 demo data), shaped like aggregate() output. */
    public function stub(): array
    {
        $raw = [
            ['preposition_choice', 'active', 11, [.2, .25, .3, .35, .25, .4, .5, .35, .45, .6, .5, .55]],
            ['article_omission', 'improving', 4, [.85, .8, .9, .75, .6, .6, .55, .4, .35, .25, .2, .15]],
            ['register_mismatch', 'active', 6, [.1, .15, .25, .3, .25, .3, .4, .3, .35, .35, .3, .4]],
            ['subject_verb_agreement', 'resolved', 1, [.6, .55, .4, .35, .25, .2, .15, .1, .05, .05, 0, 0]],
            ['cohesion_weak', 'active', 5, [.4, .3, .35, .4, .3, .35, .4, .3, .35, .25, .3, .3]],
            ['comma_splice', 'improving', 2, [.7, .65, .55, .5, .45, .35, .25, .2, .15, .1, .1, .1]],
            ['verb_tense_shift', 'resolved', 1, [.4, .3, .25, .15, .1, .1, .05, 0, 0, 0, 0, 0]],
            ['word_form', 'active', 3, [.25, .3, .2, .3, .2, .25, .3, .25, .3, .35, .3, .25]],
        ];

        $now = CarbonImmutable::now();
        $layers = array_map(function ($r) use ($now) {
            [$code, $status, $peak, $intensities] = $r;
            $weeks = [];
            foreach ($intensities as $w => $intensity) {
                $weeks[] = [
                    'week_starting' => $now->startOfWeek()->subWeeks(self::WEEKS - 1 - $w)->toDateString(),
                    'count' => (int) round($intensity * $peak),
                    'intensity' => $intensity,
                ];
            }

            return [
                'code' => $code,
                'display_name' => self::DISPLAY_NAMES[$code],
                'dimension' => self::DIMENSION_OF[$code],
                'peak' => $peak,
                'status' => $status,
                'weeks' => $weeks,
            ];
        }, $raw);

        return $this->sortLayers($layers);
    }
}

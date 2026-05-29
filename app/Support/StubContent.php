<?php

namespace App\Support;

/**
 * Canned content matching the design prototype. This lets the whole learner
 * loop render end-to-end with no database, AI key, or queue worker — the
 * "stub" grading driver (handoff §10, and the scope choice for this build).
 *
 * When wiring the real backend, replace these calls with Eloquent queries and
 * the GradingService output; the array shapes already match resources/js/lib/types.ts.
 */
class StubContent
{
    public static function user(): array
    {
        return [
            'id' => 1,
            'name' => 'Adil Omer',
            'initial' => 'A',
            'level' => 'b2',
            'streak_days' => 17,
        ];
    }

    public static function todayPrompt(): array
    {
        return [
            'id' => 42,
            'text' => 'Some people believe travel broadens the mind. Others find it leaves you more rooted. Which has been true for you?',
            'level' => 'b2',
            'task_type' => 'task-2',
            'duration_minutes' => 20,
            'focus_category' => 'preposition_choice',
        ];
    }

    /** The four paragraphs of the graded submission, joined by blank lines. */
    public static function essayText(): string
    {
        return implode("\n\n", [
            'I always thought travel would change me into someone wiser, but honestly the opposite has happened — the more I move around, the more I notice what I am missing from home.',
            "The first time I left Casablanca for university in Lyon, I expected to come back fluent and confident in three languages. Instead I came back hungry for my mother's harira and convinced that the best conversations of my life had happened in the kitchen with my grandmother, who never left the medina.",
            'In Lyon I met people who had crossed half the planet on a single afternoon flight. They spoke about cities the way I speak of streets. For a while I tried to keep up. I went on weekend trips to Berlin and Lisbon. I learned to order coffee in five different ways. But when I sat down to write a postcard to my brother, I had nothing to tell him that I could not have learned from a magazine.',
            'The trips that did broaden me were the small ones — a week in a village two hours from Casablanca where the only English speaker was a retired teacher who asked me, over mint tea, what I was really running from. Travel does not broaden the mind on its own. It only sharpens the questions you brought with you.',
        ]);
    }

    /**
     * Errors with character offsets computed against essayText(). Each entry is
     * located by a unique anchor phrase so the offsets stay correct if the text
     * is edited. Mirrors the ERRORS constant in screens-feedback.jsx (the model's
     * target tone — handoff §8.2).
     */
    public static function errors(): array
    {
        $text = self::essayText();

        $specs = [
            ['id' => 'e1', 'type' => 'preposition_choice', 'dimension' => 'grammar',
                'anchor' => 'missing from home', 'inner' => 8, 'span_text' => 'from',
                'suggested_fix' => '— or omit',
                'note' => '"Missing from home" works, but reads slightly heavier than you intended. Native speakers usually drop the preposition here: "what I am missing." Mark it as a stylistic choice rather than an error.',
                'severity' => 'low'],
            ['id' => 'e2', 'type' => 'preposition_choice', 'dimension' => 'grammar',
                'anchor' => 'university in Lyon', 'inner' => 11, 'span_text' => 'in',
                'suggested_fix' => 'at',
                'note' => 'When the university is treated as an institution rather than a location, "at Lyon" is more idiomatic. "In Lyon" makes Lyon the place; "at Lyon (university)" treats it as a single noun.',
                'severity' => 'med'],
            ['id' => 'e3', 'type' => 'preposition_choice', 'dimension' => 'grammar',
                'anchor' => 'happened in the kitchen', 'inner' => 9, 'span_text' => 'in the kitchen',
                'suggested_fix' => '— okay; consider "at the kitchen table"',
                'note' => 'Not wrong, but vague. "At the kitchen table" gives the same image with more specificity and avoids stacking another "in"-construction back-to-back. A vocabulary nudge more than a grammar one.',
                'severity' => 'low'],
            ['id' => 'e4', 'type' => 'preposition_choice', 'dimension' => 'grammar',
                'anchor' => 'planet on a single', 'inner' => 7, 'span_text' => 'on',
                'suggested_fix' => 'in',
                'note' => '"In a single afternoon flight" — the flight is a container of time/space, not a surface. This is the pattern I keep flagging. Same shape as last week\'s "on the meeting".',
                'severity' => 'high'],
            ['id' => 'e5', 'type' => 'register_mismatch', 'dimension' => 'vocabulary',
                'anchor' => 'really running from', 'inner' => 14, 'span_text' => 'from',
                'suggested_fix' => '— good',
                'note' => 'Lovely ending. Mark for the record: idiomatic register here, no change needed. I want you to notice you got this one right.',
                'severity' => 'good'],
        ];

        $errors = [];
        foreach ($specs as $s) {
            $anchorPos = mb_strpos($text, $s['anchor']);
            $start = $anchorPos === false ? 0 : $anchorPos + $s['inner'];
            $errors[] = [
                'id' => $s['id'],
                'type' => $s['type'],
                'dimension' => $s['dimension'],
                'span_start' => $start,
                'span_end' => $start + mb_strlen($s['span_text']),
                'span_text' => $s['span_text'],
                'suggested_fix' => $s['suggested_fix'],
                'note' => $s['note'],
                'severity' => $s['severity'],
            ];
        }

        return $errors;
    }

    public static function submission(int $id): array
    {
        $score = ['grammar' => 82, 'vocabulary' => 74, 'coherence' => 79, 'task' => 86];
        $score['overall'] = (int) round(($score['grammar'] + $score['vocabulary'] + $score['coherence'] + $score['task']) / 4);

        return [
            'id' => $id,
            'prompt' => self::todayPrompt(),
            'text' => self::essayText(),
            'submitted_at' => now()->subMinutes(3)->toIso8601String(),
            'graded_at' => now()->toIso8601String(),
            'status' => 'graded',
            'score' => $score,
            'errors' => self::errors(),
            'dimension_notes' => [
                'grammar' => 'Sentence structure is sturdy. Articles cleaning up. Prepositions need targeted work.',
                'vocabulary' => 'Reaching for stronger verbs. "Sharpens the questions" is your best metaphor this month.',
                'coherence' => 'Argument moves cleanly. Middle paragraph carries the essay — let it breathe more.',
                'task' => 'Answered the prompt with a real opinion, not a hedged one. Good.',
            ],
            'headline' => [
                'primary' => 'You wrote thoughtfully.',
                'secondary' => "The middle paragraph is the strongest thing you've written this month.",
            ],
            'meta' => ['model' => 'gemini-2.5-pro', 'taxonomy_version' => 'v3.2'],
            'added_drill_cards' => 4,
            'recurring_pattern' => [
                'code' => 'preposition_choice',
                'headline' => 'You\'re swapping at, in, and on in places that need motion.',
                'weekly_count' => 3,
                'streak_length' => 2,
            ],
        ];
    }

    public static function home(): array
    {
        return [
            'greeting' => ['time_of_day' => self::timeOfDay(), 'day_label' => 'Tuesday · day 17 of practice'],
            'headline' => [
                'primary' => 'Articles are starting to behave.',
                'secondary' => '',
            ],
            'lead' => "You dropped six articles last week and only two this week. I'd like to push a little on prepositions today — they've been quietly bothering us both.",
            'today_prompt' => self::todayPrompt(),
            'streak' => [
                'current_days' => 17,
                'history' => [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
            ],
            'patterns' => [
                ['code' => 'preposition_choice', 'display_name' => 'Preposition choice', 'delta' => 2, 'trend' => 'up'],
                ['code' => 'article_omission', 'display_name' => 'Article omission', 'delta' => -4, 'trend' => 'down'],
                ['code' => 'register_mismatch', 'display_name' => 'Register slip', 'delta' => 0, 'trend' => 'flat'],
            ],
            'recent' => [
                [
                    'id' => 18,
                    'submitted_at' => 'Yesterday, 9:42pm',
                    'score' => ['overall' => 80],
                    'prompt' => ['text' => 'A childhood place you still dream about.'],
                    'flag' => ['kind' => 'pattern', 'text' => 'preposition_choice — 3rd time this week'],
                ],
                [
                    'id' => 17,
                    'submitted_at' => 'Sunday, 8:10am',
                    'score' => ['overall' => 78],
                    'prompt' => ['text' => 'Argue for or against banning short-haul flights.'],
                    'flag' => ['kind' => 'win', 'text' => 'article_omission shrinking ↓'],
                ],
                [
                    'id' => 16,
                    'submitted_at' => 'Friday, 7:33pm',
                    'score' => ['overall' => 71],
                    'prompt' => ['text' => 'Describe the room you grew up sharing.'],
                    'flag' => null,
                ],
            ],
        ];
    }

    public static function drillCards(): array
    {
        return [
            ['id' => 'd1', 'type' => 'preposition_choice', 'source' => 'Your submission · 9:42pm yesterday', 'is_real_source' => true,
                'prompt' => 'They had crossed half the planet ___ a single afternoon flight.',
                'options' => ['on', 'in', 'at', 'by'], 'correct_index' => 1, 'yours' => 'on',
                'note' => 'A flight contains time and space — it\'s a container, not a surface. Same pattern as last week\'s "on the meeting".'],
            ['id' => 'd2', 'type' => 'preposition_choice', 'source' => 'Your submission · Sunday 8:10am', 'is_real_source' => true,
                'prompt' => 'I studied ___ Lyon for two years before moving back.',
                'options' => ['in', 'at', 'on', 'to'], 'correct_index' => 1, 'yours' => 'in',
                'note' => 'When the place stands in for the institution ("Lyon" = the university), "at" tightens the meaning.'],
            ['id' => 'd3', 'type' => 'preposition_choice', 'source' => 'Synthesized from your patterns', 'is_real_source' => false,
                'prompt' => 'We talked ___ length about whether to stay.',
                'options' => ['at', 'in', 'on', 'with'], 'correct_index' => 0, 'yours' => null,
                'note' => '"At length" is the fixed idiom. Worth memorizing as a unit.'],
            ['id' => 'd4', 'type' => 'preposition_choice', 'source' => 'Your submission · Friday 7:33pm', 'is_real_source' => true,
                'prompt' => 'I waited ___ the corner for almost twenty minutes.',
                'options' => ['at', 'on', 'in', 'by'], 'correct_index' => 0, 'yours' => 'on',
                'note' => '"At the corner" = a point. "On the corner" = on top of (rare). British English is firm here.'],
            ['id' => 'd5', 'type' => 'preposition_choice', 'source' => 'Synthesized from your patterns', 'is_real_source' => false,
                'prompt' => 'She arrived ___ the airport just before midnight.',
                'options' => ['at', 'in', 'on', 'to'], 'correct_index' => 0, 'yours' => null,
                'note' => '"Arrive at" for specific places; "arrive in" for cities/countries. The airport is a place, not a region.'],
        ];
    }

    private static function timeOfDay(): string
    {
        $h = (int) now()->format('G');
        return match (true) {
            $h < 5 => 'night',
            $h < 12 => 'morning',
            $h < 18 => 'afternoon',
            default => 'evening',
        };
    }
}

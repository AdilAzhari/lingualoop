<?php

namespace App\Services\SE;

class SeGradingResult
{
    public function __construct(
        public string $transcript,
        /** @var array{technical:int,clarity:int,completeness:int,tradeoffs:int} */
        public array  $scores,
        /** @var array{technical:string,clarity:string,completeness:string,tradeoffs:string} */
        public array  $dimensionNotes,
        /** @var array{primary:string,secondary:string} */
        public array  $headline,
        public string $overallNote,
        /** @var string[] */
        public array  $keyConceptsMissed,
        /** @var string[] */
        public array  $improvementTips,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            transcript:        $data['transcript']          ?? '',
            scores:            $data['scores']              ?? ['technical' => 0, 'clarity' => 0, 'completeness' => 0, 'tradeoffs' => 0],
            dimensionNotes:    $data['dimension_notes']     ?? ['technical' => '', 'clarity' => '', 'completeness' => '', 'tradeoffs' => ''],
            headline:          $data['headline']            ?? ['primary' => 'Feedback', 'secondary' => ''],
            overallNote:       $data['overall_note']        ?? '',
            keyConceptsMissed: $data['key_concepts_missed'] ?? [],
            improvementTips:   $data['improvement_tips']    ?? [],
        );
    }

    public static function stub(string $mode): self
    {
        return new self(
            transcript:        $mode === 'speaking'
                ? 'I would approach this by first understanding the requirements at scale, then choosing appropriate data stores. For the URL shortener, a base-62 encoding scheme with a counter or random ID generation would work well. I\'d use Redis for caching popular URLs and a relational database for the mapping. The write path would generate the short code and store the mapping, while reads would check the cache first before hitting the database.'
                : '',
            scores:            ['technical' => 70, 'clarity' => 72, 'completeness' => 68, 'tradeoffs' => 65],
            dimensionNotes:    [
                'technical'    => 'Good grasp of the core data storage requirements. Consider discussing the trade-offs between counter-based and hash-based ID generation more explicitly.',
                'clarity'      => 'Your explanation was easy to follow. Structuring your response with explicit sections (data model, read path, write path) would improve clarity further.',
                'completeness' => 'You covered the happy path well. Missing considerations: custom domains, analytics/click tracking, and expiry/TTL for short URLs.',
                'tradeoffs'    => 'Mentioned Redis vs database but did not discuss the consistency implications of caching or how you\'d handle cache invalidation on URL deletion.',
            ],
            headline:          ['primary' => 'A solid foundation — now push deeper on trade-offs.', 'secondary' => 'Your data-layer intuition is strong; articulating the why behind each choice will elevate the response.'],
            overallNote:       'This is a competent mid-level answer. You identified the right components and described the happy path clearly. To reach senior level, explicitly discuss failure modes, capacity estimation, and the trade-offs of each design decision — especially around consistency and availability.',
            keyConceptsMissed: ['Custom short domain support', 'Click analytics and rate limiting', 'URL expiry / TTL handling', 'Capacity estimation for storage and QPS'],
            improvementTips:   [
                'State your assumptions upfront (e.g. "I\'ll assume 100M URLs stored, 10:1 read-to-write ratio") — it shows structured thinking.',
                'For each major component, explicitly name the trade-off: "I chose Redis because reads are far more frequent than writes, accepting that a cache miss adds one DB round-trip."',
                'End with a section on what you\'d do differently at 10× the scale — this signals senior-level thinking.',
            ],
        );
    }
}

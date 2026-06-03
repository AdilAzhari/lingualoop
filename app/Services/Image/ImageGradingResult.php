<?php

namespace App\Services\Image;

class ImageGradingResult
{
    public function __construct(
        public string $transcript,
        /** @var array{task:int,vocabulary:int,coherence:int,accuracy:int} */
        public array  $scores,
        /** @var array{task:string,vocabulary:string,coherence:string,accuracy:string} */
        public array  $dimensionNotes,
        /** @var array{primary:string,secondary:string} */
        public array  $headline,
        public string $overallNote,
        /** @var array<int,array{original:string,correction:string,note:string}> */
        public array  $collocationErrors = [],
        /** @var string[] */
        public array  $keyFeaturesMissed = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            transcript:        $data['transcript']          ?? '',
            scores:            $data['scores']              ?? ['task' => 0, 'vocabulary' => 0, 'coherence' => 0, 'accuracy' => 0],
            dimensionNotes:    $data['dimension_notes']     ?? ['task' => '', 'vocabulary' => '', 'coherence' => '', 'accuracy' => ''],
            headline:          $data['headline']            ?? ['primary' => 'Feedback', 'secondary' => ''],
            overallNote:       $data['overall_note']        ?? '',
            collocationErrors: $data['collocation_errors']  ?? [],
            keyFeaturesMissed: $data['key_features_missed'] ?? [],
        );
    }

    public static function stub(string $mode): self
    {
        $transcript = $mode === 'speaking'
            ? 'The bar chart shows the number of visitors to three different museums in London between 2010 and 2015. Overall, all three museums experienced an increase in visitors over the period. The British Museum saw the most dramatic rise, going from approximately 5 million visitors in 2010 to nearly 7 million by 2015.'
            : '';

        return new self(
            transcript:        $transcript,
            scores:            ['task' => 68, 'vocabulary' => 72, 'coherence' => 65, 'accuracy' => 80],
            dimensionNotes:    [
                'task'       => 'You identified the main trend and included a general overview — good. However, you did not compare all three museums or mention the lowest-performing one.',
                'vocabulary' => 'Good use of "dramatic rise". Try to vary your language: "surged", "remained relatively stable", "accounted for". Avoid repeating "increase" throughout.',
                'coherence'  => 'The paragraph structure is clear. Work on referencing — use "the former/latter" or "the museum in question" rather than repeating the name.',
                'accuracy'   => 'Your figures are accurate. Well done for correctly reading the approximate values from the chart.',
            ],
            headline:          ['primary' => 'A clear overview with room to grow.', 'secondary' => 'Your key trend identification is solid — now work on comparative language.'],
            overallNote:       'A promising B2-level response. You captured the main story of the chart accurately and structured your response well. Focus on expanding your chart vocabulary and ensuring you cover all data series, not just the most striking one.',
            collocationErrors: [
                ['original' => 'experienced a big increase', 'correction' => 'experienced a sharp increase', 'note' => '"Sharp" is the natural collocate for a sudden increase — "big" works but sounds informal in academic writing.'],
            ],
            keyFeaturesMissed: ['Comparison between Museum B and Museum C', 'The dip in 2013 for Museum A'],
        );
    }
}

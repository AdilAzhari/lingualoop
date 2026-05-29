<?php

namespace App\Services\Speaking;

class SpeakingGradingResult
{
    public function __construct(
        public string  $transcript,
        /** @var array{fluency:int,vocabulary:int,grammar:int,pronunciation:int} */
        public array   $scores,
        /** @var array{fluency:string,vocabulary:string,grammar:string,pronunciation:string} */
        public array   $dimensionNotes,
        /** @var array{primary:string,secondary:string} */
        public array   $headline,
        public string  $overallNote,
        public ?int    $durationSeconds,
    ) {}

    public static function fromArray(array $data, ?int $durationSeconds = null): self
    {
        return new self(
            transcript:      $data['transcript']       ?? '',
            scores:          $data['scores']           ?? ['fluency' => 0, 'vocabulary' => 0, 'grammar' => 0, 'pronunciation' => 0],
            dimensionNotes:  $data['dimension_notes']  ?? ['fluency' => '', 'vocabulary' => '', 'grammar' => '', 'pronunciation' => ''],
            headline:        $data['headline']         ?? ['primary' => 'Feedback', 'secondary' => ''],
            overallNote:     $data['overall_note']     ?? '',
            durationSeconds: $durationSeconds,
        );
    }
}

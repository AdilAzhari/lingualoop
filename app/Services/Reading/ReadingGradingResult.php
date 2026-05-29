<?php

namespace App\Services\Reading;

class ReadingGradingResult
{
    public function __construct(
        public int    $score,
        public string $overallNote,
        /** @var array<int,array{question_id:int,score:int,correct:bool,note:string}> */
        public array  $questionFeedback,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            score:            (int) ($data['score'] ?? 0),
            overallNote:      $data['overall_note'] ?? '',
            questionFeedback: $data['question_feedback'] ?? [],
        );
    }
}

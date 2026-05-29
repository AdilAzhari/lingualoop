<?php

namespace App\Services\Grading;

/**
 * Value object returned by a grading provider. Maps 1:1 onto the LLM JSON
 * contract in handoff §8.2.
 */
class GradingResult
{
    public function __construct(
        /** @var array{grammar:int,vocabulary:int,coherence:int,task:int} */
        public array $scores,
        /** @var array<string,string> */
        public array $dimensionNotes,
        /** @var array{primary:string,secondary:string} */
        public array $headline,
        /** @var array<int,array> */
        public array $errors,
        /** @var array{code:string,headline:string,weekly_count:int,streak_length:int}|null */
        public ?array $noticed,
        /** @var array<int,array{word:string,examples:string[]}> */
        public array $vocabExamples = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            scores: $data['scores'],
            dimensionNotes: $data['dimension_notes'] ?? [],
            headline: $data['headline'],
            errors: $data['errors'] ?? [],
            noticed: $data['noticed'] ?? null,
            vocabExamples: $data['vocab_examples'] ?? [],
        );
    }

    public function overall(): int
    {
        return (int) round(array_sum($this->scores) / max(1, count($this->scores)));
    }
}

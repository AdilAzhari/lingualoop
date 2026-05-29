<?php

namespace App\Services\Grading\Providers;

use App\Services\Grading\GradingProvider;
use App\Services\Grading\GradingResult;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Real LLM provider — Gemini 2.5 Pro. Scaffolded but not exercised in this
 * build (GRADING_DRIVER defaults to "stub"). The system prompt should instruct
 * the model on the warm-coach tone with examples drawn from the prototype's
 * ERRORS notes (handoff §8.2), and request strict JSON matching the §8.2 schema.
 */
class GeminiProvider implements GradingProvider
{
    public function __construct(
        private string $apiKey,
        private string $model = 'gemini-2.5-pro',
    ) {}

    public function grade(array $context): GradingResult
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('GEMINI_API_KEY is not set. Use GRADING_DRIVER=stub for local dev.');
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        $response = Http::withHeaders(['x-goog-api-key' => $this->apiKey])
            ->post($endpoint, [
                'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
                'contents' => [['role' => 'user', 'parts' => [['text' => $this->userPrompt($context)]]]],
                'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.4],
            ])
            ->throw();

        $json = $response->json('candidates.0.content.parts.0.text');
        $data = json_decode($json, true, flags: JSON_THROW_ON_ERROR);

        return GradingResult::fromArray($data);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
        You are a warm, attentive language coach in the tradition of an editor's
        marginal notes — not a chatbot. You notice patterns across a learner's
        submissions and speak plainly, with care. You never use emoji. You say
        "I noticed something" rather than "Here's some feedback". You frame the
        score as a temperature reading, not a verdict.

        Return STRICT JSON only, matching this schema:
        { "scores": {grammar,vocabulary,coherence,task: int 0-100},
          "dimension_notes": {grammar,vocabulary,coherence,task: string},
          "headline": {primary, secondary},
          "errors": [{type, dimension, span_start, span_end, span_text,
                      suggested_fix, note, severity}],
          "noticed": {code, headline, weekly_count, streak_length} | null }

        span_start/span_end are character offsets into the submission text.
        severity is one of: good, low, med, high. Mark at least one thing the
        learner did right with severity "good".
        PROMPT;
    }

    private function userPrompt(array $context): string
    {
        return implode("\n\n", [
            'Learner level: '.($context['level'] ?? 'b2'),
            'Today\'s focus category: '.($context['focus_category'] ?? 'none'),
            'Recent error profile: '.($context['profile_summary'] ?? 'n/a'),
            "Submission:\n".($context['text'] ?? ''),
        ]);
    }
}

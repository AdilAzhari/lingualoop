<?php

namespace App\Services\Grading;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements GradingProvider
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';

    // Free-tier daily caps
    public const LIMIT_REQUESTS_DAY = 1500;
    public const LIMIT_TOKENS_DAY   = 1_000_000;
    public const LIMIT_REQUESTS_MIN = 30;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $model = 'gemini-2.5-flash-lite',
    ) {}

    public function grade(array $context): GradingResult
    {
        if (! $this->apiKey) {
            Log::warning('GeminiProvider: GEMINI_API_KEY not set, falling back to stub.');
            return (new StubGradingProvider())->grade($context);
        }

        $prompt = $this->buildPrompt($context);

        try {
            $response = Http::timeout(60)->post(
                self::ENDPOINT . $this->model . ':generateContent?key=' . $this->apiKey,
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature'      => 0.3,
                        'maxOutputTokens'  => 3000,
                    ],
                ]
            );

            if (! $response->successful()) {
                Log::error('GeminiProvider HTTP error', ['status' => $response->status(), 'body' => $response->body()]);
                return (new StubGradingProvider())->grade($context);
            }

            $this->trackUsage($response->json());

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            $data = json_decode($text, true);

            if (! $data) {
                Log::error('GeminiProvider: failed to parse JSON response', ['raw' => $text]);
                return (new StubGradingProvider())->grade($context);
            }

            return GradingResult::fromArray($data);

        } catch (\Throwable $e) {
            Log::error('GeminiProvider exception: ' . $e->getMessage());
            return (new StubGradingProvider())->grade($context);
        }
    }

    private function buildPrompt(array $context): string
    {
        $text    = $context['text'] ?? '';
        $level   = strtoupper($context['level'] ?? 'B2');
        $focus   = $context['focus_category'] ?? 'general accuracy';
        $vocab   = $context['vocab_words'] ?? [];   // [{word, definition}]

        $vocabSection = '';
        $vocabSchema  = '';

        if (! empty($vocab)) {
            $lines = array_map(
                fn ($v) => '  - ' . $v['word'] . ($v['definition'] ? ' (' . $v['definition'] . ')' : ''),
                $vocab
            );
            $vocabSection = "\nLEARNER'S VOCABULARY NOTEBOOK (words they are actively studying):\n"
                . implode("\n", $lines)
                . "\n\nFor each word in the notebook, generate 3 natural, varied example sentences that "
                . "a {$level}-level learner could realistically write. Sentences should be different in "
                . "structure and context. Return them in the vocab_examples array.\n";

            $vocabWordsList = implode(', ', array_column($vocab, 'word'));
            $vocabSchema    = "\n  \"vocab_examples\": [{\"word\": \"<word from notebook>\", \"examples\": [\"<sentence 1>\", \"<sentence 2>\", \"<sentence 3>\"]}],";
        }

        return <<<PROMPT
You are an expert IELTS writing coach. Grade the following {$level}-level essay and return a JSON object ONLY — no markdown, no explanation outside JSON.
{$vocabSection}
ESSAY:
{$text}

TODAY'S FOCUS: {$focus}

Return EXACTLY this JSON structure:
{
  "scores": { "grammar": <0-100>, "vocabulary": <0-100>, "coherence": <0-100>, "task": <0-100> },
  "dimension_notes": {
    "grammar": "<one sentence — warm, specific>",
    "vocabulary": "<one sentence>",
    "coherence": "<one sentence>",
    "task": "<one sentence>"
  },
  "headline": {
    "primary": "<encouraging headline ending with the strongest quality, e.g. 'You wrote carefully.'>",
    "secondary": "<one observation about the best moment in the essay>"
  },
  "errors": [
    {
      "type": "<one of: preposition_choice|article_omission|subject_verb_agreement|comma_splice|verb_tense_shift|register_mismatch|word_form|collocation_unusual|cohesion_weak|paragraph_unfocused|off_topic_drift|prompt_partial>",
      "dimension": "<grammar|vocabulary|coherence|task>",
      "span_start": <character offset of start of error in essay>,
      "span_end": <character offset of end>,
      "span_text": "<exact text from essay>",
      "suggested_fix": "<the correct word or short phrase only>",
      "note": "<coach's full explanation, 1-3 sentences, warm tone>",
      "severity": "<good|low|med|high>"
    }
  ],
  "noticed": <null or { "code": "<error_type>", "headline": "<one sentence>", "weekly_count": <int>, "streak_length": <int> }>,{$vocabSchema}
}

Rules:
- severity "good" = something the learner got right (celebrate it)
- span_start/span_end are character offsets from the start of the essay string (0-indexed)
- Return 3-6 errors maximum — quality over quantity
- If the essay is excellent, return 1-2 "good" severity items and 0-1 corrections
PROMPT;
    }

    private function trackUsage(array $responseJson): void
    {
        $tokens = (int) data_get($responseJson, 'usageMetadata.totalTokenCount', 0);
        $date   = now()->format('Y-m-d');
        $minute = now()->format('Y-m-d_H:i');

        // Cache::add() sets the key only if it doesn't exist (with TTL),
        // then increment() is guaranteed to work on an existing key.
        Cache::add("gemini:usage:{$date}:requests", 0, now()->endOfDay());
        Cache::increment("gemini:usage:{$date}:requests");

        Cache::add("gemini:usage:{$date}:tokens", 0, now()->endOfDay());
        Cache::increment("gemini:usage:{$date}:tokens", max(1, $tokens));

        Cache::add("gemini:usage:min:{$minute}:requests", 0, 90);
        Cache::increment("gemini:usage:min:{$minute}:requests");
    }

    /** Called from HandleInertiaRequests to share stats with every page. */
    public static function todayStats(): array
    {
        $date = now()->format('Y-m-d');
        $minute = now()->format('Y-m-d_H:i');

        return [
            'requests_today'  => (int) Cache::get("gemini:usage:{$date}:requests", 0),
            'tokens_today'    => (int) Cache::get("gemini:usage:{$date}:tokens", 0),
            'requests_min'    => (int) Cache::get("gemini:usage:min:{$minute}:requests", 0),
            'limit_req_day'   => self::LIMIT_REQUESTS_DAY,
            'limit_tok_day'   => self::LIMIT_TOKENS_DAY,
            'limit_req_min'   => self::LIMIT_REQUESTS_MIN,
        ];
    }
}

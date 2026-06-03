<?php

namespace App\Services\SE;

use App\Services\GeminiClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SeGrader
{
    public function gradeWriting(
        string $text,
        string $keyConceptsStr,
        string $frameworkHints,
        string $description,
        string $difficulty,
    ): SeGradingResult {
        $driver = env('GRADING_DRIVER', 'stub');

        if ($driver !== 'gemini') {
            return SeGradingResult::stub('writing');
        }

        try {
            $prompt = $this->buildWritingPrompt($text, $keyConceptsStr, $frameworkHints, $description, $difficulty);
            $data   = GeminiClient::json($prompt, 60);
            return SeGradingResult::fromArray($data);
        } catch (\Throwable $e) {
            Log::error('SeGrader writing error: ' . $e->getMessage());
            return SeGradingResult::stub('writing');
        }
    }

    public function gradeSpeaking(
        string $audioPath,
        string $audioMime,
        string $keyConceptsStr,
        string $frameworkHints,
        string $description,
        string $difficulty,
    ): SeGradingResult {
        $key    = env('GEMINI_API_KEY', '');
        $model  = env('GEMINI_MODEL', 'gemini-2.5-flash-lite');
        $driver = env('GRADING_DRIVER', 'stub');

        if ($driver !== 'gemini' || ! $key) {
            return SeGradingResult::stub('speaking');
        }

        if (! Storage::exists($audioPath)) {
            Log::error('SeGrader: audio file not found', ['path' => $audioPath]);
            return SeGradingResult::stub('speaking');
        }

        try {
            $audioData = base64_encode(Storage::get($audioPath));

            $response = Http::timeout(90)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
                [
                    'contents' => [[
                        'parts' => [
                            ['text'        => $this->buildSpeakingPrompt($keyConceptsStr, $frameworkHints, $description, $difficulty)],
                            ['inline_data' => ['mime_type' => $audioMime, 'data' => $audioData]],
                        ],
                    ]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature'      => 0.3,
                        'maxOutputTokens'  => 2000,
                    ],
                ]
            );

            if (! $response->successful()) {
                Log::error('SeGrader speaking HTTP error', ['status' => $response->status(), 'body' => $response->body()]);
                return SeGradingResult::stub('speaking');
            }

            $this->trackUsage($response->json());

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            $data = json_decode($text, true);

            if (! $data) {
                Log::error('SeGrader: failed to parse JSON', ['raw' => $text]);
                return SeGradingResult::stub('speaking');
            }

            return SeGradingResult::fromArray($data);

        } catch (\Throwable $e) {
            Log::error('SeGrader speaking exception: ' . $e->getMessage());
            return SeGradingResult::stub('speaking');
        }
    }

    private function buildWritingPrompt(
        string $text,
        string $keyConceptsStr,
        string $frameworkHints,
        string $description,
        string $difficulty,
    ): string {
        return <<<PROMPT
You are a staff-level software engineer conducting a {$difficulty}-level technical design review.

Question: {$description}

Key concepts to cover: {$keyConceptsStr}

Framework hints: {$frameworkHints}

The candidate wrote:
---
{$text}
---

Evaluate this response as a technical interviewer. Return STRICT JSON only — no markdown, no text outside JSON:
{
  "transcript": "",
  "scores": {
    "technical":    <0-100, depth and correctness of technical reasoning>,
    "clarity":      <0-100, structure and ease of following the explanation>,
    "completeness": <0-100, coverage of the problem space and edge cases>,
    "tradeoffs":    <0-100, quality of trade-off discussion and justification>
  },
  "dimension_notes": {
    "technical":    "<1-2 specific sentences>",
    "clarity":      "<1-2 specific sentences>",
    "completeness": "<1-2 specific sentences>",
    "tradeoffs":    "<1-2 specific sentences>"
  },
  "headline": {
    "primary":   "<one strong, specific observation about the response>",
    "secondary": "<one encouraging note about the candidate's approach>"
  },
  "overall_note": "<2-3 sentences: honest, direct summary of the response quality>",
  "key_concepts_missed": ["<concept not covered or under-addressed>", "..."],
  "improvement_tips": ["<specific, actionable improvement>", "..."]
}

Rules:
- improvement_tips: 2-3 tips maximum, each specific and actionable (not generic)
- key_concepts_missed: list only genuine gaps, not style preferences
- Scores reflect {$difficulty}-level expectations, not absolute beginner
PROMPT;
    }

    private function buildSpeakingPrompt(
        string $keyConceptsStr,
        string $frameworkHints,
        string $description,
        string $difficulty,
    ): string {
        return <<<PROMPT
You are a staff-level software engineer conducting a {$difficulty}-level technical interview. Listen carefully to the audio recording.

The candidate was given this design question: "{$description}"

Key concepts to cover: {$keyConceptsStr}
Framework hints: {$frameworkHints}

Please:
1. Transcribe exactly what the candidate said (verbatim, including hesitations)
2. Evaluate their verbal design explanation

Return STRICT JSON only — no markdown, no text outside JSON:
{
  "transcript": "<verbatim transcription>",
  "scores": {
    "technical":    <0-100>,
    "clarity":      <0-100>,
    "completeness": <0-100>,
    "tradeoffs":    <0-100>
  },
  "dimension_notes": {
    "technical":    "<1-2 specific sentences>",
    "clarity":      "<1-2 specific sentences>",
    "completeness": "<1-2 specific sentences>",
    "tradeoffs":    "<1-2 specific sentences>"
  },
  "headline": {
    "primary":   "<one strong, specific observation>",
    "secondary": "<one encouraging note>"
  },
  "overall_note": "<2-3 sentences: honest, direct summary>",
  "key_concepts_missed": ["..."],
  "improvement_tips": ["...", "..."]
}

Rules:
- improvement_tips: 2-3 tips maximum, specific and actionable
- If the recording is silent or less than 5 seconds, set all scores to 0 and explain in overall_note
PROMPT;
    }

    private function trackUsage(array $responseJson): void
    {
        $tokens = (int) data_get($responseJson, 'usageMetadata.totalTokenCount', 0);
        $date   = now()->format('Y-m-d');
        $minute = now()->format('Y-m-d_H:i');

        Cache::add("gemini:usage:{$date}:requests", 0, now()->endOfDay());
        Cache::increment("gemini:usage:{$date}:requests");
        Cache::add("gemini:usage:{$date}:tokens", 0, now()->endOfDay());
        Cache::increment("gemini:usage:{$date}:tokens", max(1, $tokens));
        Cache::add("gemini:usage:min:{$minute}:requests", 0, 90);
        Cache::increment("gemini:usage:min:{$minute}:requests");
    }
}

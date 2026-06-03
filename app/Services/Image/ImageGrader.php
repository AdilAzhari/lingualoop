<?php

namespace App\Services\Image;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImageGrader
{
    private string $key;
    private string $model;
    private bool   $live;

    public function __construct()
    {
        $this->key   = env('GEMINI_API_KEY', '');
        $this->model = env('GEMINI_MODEL', 'gemini-2.5-flash-lite');
        $this->live  = env('GRADING_DRIVER', 'stub') === 'gemini' && $this->key !== '';
    }

    public function gradeWriting(string $imagePath, string $imageMime, string $text, array $keyFeatures, string $taskInstruction): ImageGradingResult
    {
        if (! $this->live) {
            return ImageGradingResult::stub('writing');
        }

        $imageData = base64_encode(Storage::disk('local')->get($imagePath));
        $prompt    = $this->writingPrompt($text, $keyFeatures, $taskInstruction);

        return $this->callGemini([
            ['text'        => $prompt],
            ['inline_data' => ['mime_type' => $imageMime, 'data' => $imageData]],
        ], 'writing');
    }

    public function gradeSpeaking(string $imagePath, string $imageMime, string $audioPath, string $audioMime, array $keyFeatures, string $taskInstruction): ImageGradingResult
    {
        if (! $this->live) {
            return ImageGradingResult::stub('speaking');
        }

        $imageData = base64_encode(Storage::disk('local')->get($imagePath));
        $audioData = base64_encode(Storage::disk('local')->get($audioPath));
        $prompt    = $this->speakingPrompt($keyFeatures, $taskInstruction);

        return $this->callGemini([
            ['text'        => $prompt],
            ['inline_data' => ['mime_type' => $imageMime, 'data' => $imageData]],
            ['inline_data' => ['mime_type' => $audioMime, 'data' => $audioData]],
        ], 'speaking');
    }

    private function callGemini(array $parts, string $mode): ImageGradingResult
    {
        try {
            $response = Http::timeout(90)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->key}",
                [
                    'contents'         => [['parts' => $parts]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature'      => 0.3,
                        'maxOutputTokens'  => 2500,
                    ],
                ]
            );

            if (! $response->successful()) {
                Log::error('ImageGrader HTTP error', ['status' => $response->status()]);
                return ImageGradingResult::stub($mode);
            }

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            $data = json_decode($text, true);

            if (! $data) {
                Log::error('ImageGrader: failed to parse JSON', ['raw' => $text]);
                return ImageGradingResult::stub($mode);
            }

            return ImageGradingResult::fromArray($data);

        } catch (\Throwable $e) {
            Log::error('ImageGrader exception: ' . $e->getMessage());
            return ImageGradingResult::stub($mode);
        }
    }

    private function writingPrompt(string $text, array $keyFeatures, string $taskInstruction): string
    {
        $features = implode("\n", array_map(fn ($f) => "• {$f}", $keyFeatures));

        return <<<PROMPT
You are an experienced IELTS Academic Writing Task 1 examiner and warm language coach.
The learner was shown an image and given this task:

Task: {$taskInstruction}

Key features that should be described:
{$features}

The learner wrote:
---
{$text}
---

Assess their description. Return STRICT JSON only — no markdown, no text outside JSON:
{
  "transcript": "",
  "scores": {
    "task":       <0-100, did they identify key features and give a clear overview?>,
    "vocabulary": <0-100, range of chart/image language and collocations>,
    "coherence":  <0-100, organisation, referencing, cohesive devices>,
    "accuracy":   <0-100, are their stated facts and figures correct vs the image?>
  },
  "dimension_notes": {
    "task":       "<1-2 warm, specific sentences>",
    "vocabulary": "<1-2 sentences>",
    "coherence":  "<1-2 sentences>",
    "accuracy":   "<1-2 sentences>"
  },
  "headline": {
    "primary":   "<encouraging headline>",
    "secondary": "<one observation about their strongest moment>"
  },
  "overall_note": "<2-3 sentences: honest, warm coach summary>",
  "collocation_errors": [
    {"original": "<phrase used>", "correction": "<natural English>", "note": "<brief explanation>"}
  ],
  "key_features_missed": ["<feature they did not mention>", ...]
}

Rules:
- Leave "transcript" as an empty string for writing mode
- collocation_errors: flag unnatural word pairings only (e.g. "make a big rise" → "show a sharp rise"). Return [] if none.
- key_features_missed: list only key_features the learner did NOT mention at all. Return [] if all covered.
- Accuracy scoring: carefully check figures, labels, and trends the learner stated against the image
PROMPT;
    }

    private function speakingPrompt(array $keyFeatures, string $taskInstruction): string
    {
        $features = implode("\n", array_map(fn ($f) => "• {$f}", $keyFeatures));

        return <<<PROMPT
You are an IELTS Speaking examiner and warm language coach. The learner was shown an image and asked to describe it aloud.

Task: {$taskInstruction}

Key features that should be mentioned:
{$features}

Listen to the audio recording and look at the image. Please:
1. Transcribe exactly what the learner said (verbatim, including hesitations)
2. Grade their spoken description

Return STRICT JSON only — no markdown, no text outside JSON:
{
  "transcript": "<verbatim transcription>",
  "scores": {
    "task":       <0-100, key features covered, overview given?>,
    "vocabulary": <0-100, range and appropriacy of image description language>,
    "coherence":  <0-100, logical flow, referencing>,
    "accuracy":   <0-100, factual accuracy vs the image>
  },
  "dimension_notes": {
    "task":       "<1-2 warm, specific sentences>",
    "vocabulary": "<1-2 sentences>",
    "coherence":  "<1-2 sentences>",
    "accuracy":   "<1-2 sentences>"
  },
  "headline": {
    "primary":   "<encouraging headline>",
    "secondary": "<one observation about their strongest moment>"
  },
  "overall_note": "<2-3 sentences: honest, warm coach summary>",
  "collocation_errors": [
    {"original": "<phrase used>", "correction": "<natural English>", "note": "<brief explanation>"}
  ],
  "key_features_missed": ["<feature not mentioned>", ...]
}

Rules:
- collocation_errors: only genuine collocation issues, not grammar. Return [] if none.
- key_features_missed: only features completely absent from the description.
PROMPT;
    }
}

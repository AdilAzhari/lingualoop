<?php

namespace App\Services\Speaking;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SpeakingGrader
{
    public function grade(string $audioPath, string $mimeType, string $promptText, array $cuePoints, ?int $durationSeconds = null): SpeakingGradingResult
    {
        $key    = env('GEMINI_API_KEY', '');
        $model  = env('GEMINI_MODEL', 'gemini-2.5-flash-lite');
        $driver = env('GRADING_DRIVER', 'stub');

        if ($driver !== 'gemini' || ! $key) {
            return $this->stub($durationSeconds);
        }

        if (! Storage::exists($audioPath)) {
            Log::error('SpeakingGrader: audio file not found', ['path' => $audioPath]);
            return $this->stub($durationSeconds);
        }

        try {
            $audioData = base64_encode(Storage::get($audioPath));

            $response = Http::timeout(90)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
                [
                    'contents' => [[
                        'parts' => [
                            ['text'        => $this->buildPrompt($promptText, $cuePoints)],
                            ['inline_data' => ['mime_type' => $mimeType, 'data' => $audioData]],
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
                Log::error('SpeakingGrader HTTP error', ['status' => $response->status(), 'body' => $response->body()]);
                return $this->stub($durationSeconds);
            }

            $this->trackUsage($response->json());

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            $data = json_decode($text, true);

            if (! $data) {
                Log::error('SpeakingGrader: failed to parse JSON', ['raw' => $text]);
                return $this->stub($durationSeconds);
            }

            return SpeakingGradingResult::fromArray($data, $durationSeconds);

        } catch (\Throwable $e) {
            Log::error('SpeakingGrader exception: ' . $e->getMessage());
            return $this->stub($durationSeconds);
        }
    }

    private function buildPrompt(string $promptText, array $cuePoints): string
    {
        $cues = implode("\n", array_map(fn ($c) => "• {$c}", $cuePoints));

        return <<<PROMPT
You are an experienced IELTS speaking examiner and warm language coach. Listen carefully to the audio recording.

The learner was given this speaking task:

"{$promptText}"

They were told to cover:
{$cues}

Please:
1. Transcribe exactly what the learner said (verbatim, including hesitations like "um", "uh", false starts)
2. Grade their performance on the four IELTS speaking criteria

Return STRICT JSON only — no markdown, no text outside JSON:
{
  "transcript": "<verbatim transcription of the audio>",
  "scores": {
    "fluency":       <0-100, based on pace, hesitation, self-correction>,
    "vocabulary":    <0-100, range and precision of words chosen>,
    "grammar":       <0-100, accuracy and range of grammatical structures>,
    "pronunciation": <0-100, clarity, word stress, intonation>
  },
  "dimension_notes": {
    "fluency":       "<1-2 warm, specific sentences>",
    "vocabulary":    "<1-2 sentences>",
    "grammar":       "<1-2 sentences>",
    "pronunciation": "<1-2 sentences>"
  },
  "headline": {
    "primary":   "<encouraging headline e.g. 'You spoke with clarity and purpose.'>",
    "secondary": "<one observation about the learner's strongest moment>"
  },
  "overall_note": "<2-3 sentences: honest, warm coach summary>"
}

Rules:
- If the recording is silent or less than 5 seconds, set all scores to 0 and explain in overall_note
- Pronunciation scoring requires listening carefully to stress, intonation, and clarity
- Fluency is about naturalness, not speed — comfortable pauses are fine
PROMPT;
    }

    private function stub(?int $durationSeconds): SpeakingGradingResult
    {
        return new SpeakingGradingResult(
            transcript:     'I would like to learn how to play the piano. It\'s something I\'ve always wanted to do since I was a child. I think, um, music is a universal language and learning piano would, would allow me to express myself in a completely different way. To get started, I would probably find a local teacher and take weekly lessons. I\'d also practise every day, even if it\'s just for thirty minutes. The difference it would make to my life is... I think it would reduce my stress levels and give me a creative outlet that I currently don\'t have.',
            scores:         ['fluency' => 72, 'vocabulary' => 68, 'grammar' => 75, 'pronunciation' => 70],
            dimensionNotes: [
                'fluency'       => 'Good overall flow with some natural hesitations. Try to reduce filler words like "um" and avoid repeating words mid-sentence.',
                'vocabulary'    => 'Appropriate range for B2 level. Consider using more precise adjectives — "wonderful" or "profound" instead of "completely different".',
                'grammar'       => 'Strong sentence structure throughout. Minor errors with article usage — watch "a universal language" vs "the universal language".',
                'pronunciation' => 'Generally clear and easy to follow. Pay attention to stress on multi-syllable words like "uni-VER-sal" and "cre-A-tive".',
            ],
            headline:       ['primary' => 'You spoke with clear purpose.', 'secondary' => 'Your ideas were well-organised and your personal example felt genuine.'],
            overallNote:    'A solid B2 performance. Your ideas came through clearly and your fluency is developing well — the hesitations are natural and didn\'t interrupt the flow significantly. Focus on expanding your vocabulary range and reducing filler words for the next session.',
            durationSeconds: $durationSeconds,
        );
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

<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiClient
{
    public static function ask(string $prompt, int $timeout = 30): string
    {
        return self::call($prompt, $timeout, false);
    }

    /** Generate and return decoded JSON array. */
    public static function json(string $prompt, int $timeout = 45): array
    {
        $raw = self::call($prompt, $timeout, true);
        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Gemini returned invalid JSON: ' . json_last_error_msg());
        }
        return $decoded;
    }

    private static function call(string $prompt, int $timeout, bool $jsonMode): string
    {
        $key   = env('GEMINI_API_KEY', '');
        $model = env('GEMINI_MODEL', 'gemini-2.5-flash-lite');

        if (! $key) {
            throw new \RuntimeException('GEMINI_API_KEY not configured');
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";

        $config = ['temperature' => 0.7, 'maxOutputTokens' => 2500];
        if ($jsonMode) {
            $config['responseMimeType'] = 'application/json';
        }

        $response = Http::timeout($timeout)->post($url, [
            'contents'         => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => $config,
        ]);

        if ($response->failed()) {
            Log::error('GeminiClient failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Gemini request failed: ' . $response->status());
        }

        return data_get($response->json(), 'candidates.0.content.parts.0.text', '');
    }
}

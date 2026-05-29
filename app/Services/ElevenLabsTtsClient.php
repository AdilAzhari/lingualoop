<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ElevenLabsTtsClient
{
    private static function key(): string
    {
        return config('services.elevenlabs.key', '');
    }

    private static function voiceId(): string
    {
        // Rachel — American female, calm and clear. Good default for IELTS listening.
        return config('services.elevenlabs.voice_id', '21m00Tcm4TlvDq8ikWAM');
    }

    private static function model(): string
    {
        return config('services.elevenlabs.model', 'eleven_turbo_v2_5');
    }

    public static function isConfigured(): bool
    {
        return strlen(self::key()) > 0;
    }

    /**
     * Synthesize text to MP3, caching the result by $cacheKey.
     * Returns the absolute path to the stored MP3 file.
     */
    public static function synthesize(string $text, string $cacheKey): string
    {
        $storagePath = "tts/{$cacheKey}.mp3";

        if (Storage::exists($storagePath)) {
            return Storage::path($storagePath);
        }

        if (!self::isConfigured()) {
            throw new RuntimeException('ElevenLabs TTS is not configured. Add ELEVENLABS_API_KEY to your .env file.');
        }

        Storage::makeDirectory('tts');

        $response = Http::timeout(60)
            ->withHeaders([
                'xi-api-key' => self::key(),
                'Accept'     => 'audio/mpeg',
            ])
            ->post("https://api.elevenlabs.io/v1/text-to-speech/" . self::voiceId(), [
                'text'          => $text,
                'model_id'      => self::model(),
                'voice_settings' => [
                    'stability'        => 0.5,
                    'similarity_boost' => 0.75,
                    'style'            => 0.0,
                    'use_speaker_boost' => true,
                ],
            ]);

        if (!$response->successful()) {
            throw new RuntimeException("ElevenLabs TTS error {$response->status()}: " . $response->body());
        }

        Storage::put($storagePath, $response->body());

        return Storage::path($storagePath);
    }
}

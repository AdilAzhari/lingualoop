<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class AzureTtsClient
{
    private static function key(): string
    {
        return config('services.azure_tts.key', '');
    }

    private static function region(): string
    {
        return config('services.azure_tts.region', 'eastus');
    }

    private static function voice(): string
    {
        return config('services.azure_tts.voice', 'en-GB-SoniaNeural');
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
            throw new RuntimeException('Azure TTS is not configured. Add AZURE_TTS_KEY to your .env file.');
        }

        Storage::makeDirectory('tts');

        $voice  = self::voice();
        $region = self::region();
        $lang   = str_contains($voice, '-GB-') ? 'en-GB' : 'en-US';

        // Escape any XML special characters in the passage text
        $escaped = htmlspecialchars($text, ENT_XML1 | ENT_COMPAT, 'UTF-8');

        $ssml = <<<SSML
<speak version='1.0' xml:lang='{$lang}'>
    <voice xml:lang='{$lang}' name='{$voice}'>
        <prosody rate='-5%' pitch='0%'>{$escaped}</prosody>
    </voice>
</speak>
SSML;

        $response = Http::timeout(60)
            ->withHeaders([
                'Ocp-Apim-Subscription-Key' => self::key(),
                'Content-Type'              => 'application/ssml+xml',
                'X-Microsoft-OutputFormat'  => 'audio-24khz-96kbitrate-mono-mp3',
                'User-Agent'                => 'lingualoop-app',
            ])
            ->withBody($ssml, 'application/ssml+xml')
            ->post("https://{$region}.tts.speech.microsoft.com/cognitiveservices/v1");

        if (!$response->successful()) {
            throw new RuntimeException("Azure TTS error {$response->status()}: " . $response->body());
        }

        Storage::put($storagePath, $response->body());

        return Storage::path($storagePath);
    }
}

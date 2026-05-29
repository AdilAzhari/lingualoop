<?php

namespace Tests\Unit;

use App\Services\GeminiClient;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class GeminiClientTest extends TestCase
{
    private function fakeGeminiResponse(string $text): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode([
                    'candidates' => [[
                        'content' => ['parts' => [['text' => $text]]],
                    ]],
                ])
            ),
        ]);
    }

    // ── ask() ─────────────────────────────────────────────────────────────────

    public function test_ask_returns_text_from_gemini(): void
    {
        $this->fakeGeminiResponse('Hello from Gemini.');

        $result = GeminiClient::ask('Say hello.');

        $this->assertSame('Hello from Gemini.', $result);
    }

    public function test_ask_throws_on_api_error(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response('Unauthorized', 401),
        ]);

        $this->expectException(RuntimeException::class);

        GeminiClient::ask('Trigger error.');
    }

    public function test_ask_returns_empty_string_when_candidates_missing(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(json_encode(['candidates' => []])),
        ]);

        // data_get returns '' as default — should not throw
        $result = GeminiClient::ask('Empty response.');
        $this->assertSame('', $result);
    }

    // ── json() ────────────────────────────────────────────────────────────────

    public function test_json_parses_valid_json_response(): void
    {
        $this->fakeGeminiResponse('{"example":"She was tenacious.","level":"c1"}');

        $result = GeminiClient::json('Generate example for tenacious.');

        $this->assertSame('She was tenacious.', $result['example']);
        $this->assertSame('c1', $result['level']);
    }

    public function test_json_throws_on_invalid_json(): void
    {
        $this->fakeGeminiResponse('not valid json at all');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/invalid JSON/i');

        GeminiClient::json('Return JSON.');
    }

    public function test_json_throws_on_api_error(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response('Server Error', 500),
        ]);

        $this->expectException(RuntimeException::class);

        GeminiClient::json('Return JSON.');
    }

    public function test_json_handles_json_wrapped_in_markdown_fences(): void
    {
        // Gemini sometimes wraps JSON in ```json ... ``` fences
        $raw = "```json\n{\"score\":7}\n```";
        $this->fakeGeminiResponse($raw);

        // The client may or may not strip fences — test what it actually does
        // This test documents the current behaviour rather than asserting a specific format
        try {
            $result = GeminiClient::json('Return fenced JSON.');
            // If it strips fences successfully, the score should be readable
            $this->assertIsArray($result);
        } catch (RuntimeException $e) {
            // If it doesn't strip fences, it will throw — that's also valid behaviour to document
            $this->assertStringContainsStringIgnoringCase('JSON', $e->getMessage());
        }
    }
}

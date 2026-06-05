<?php

namespace App\Http\Controllers;

use App\Models\BrandPost;
use App\Services\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    /** GET /brand */
    public function index(): Response
    {
        $drafts = BrandPost::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get(['id', 'topic', 'type', 'tone', 'status', 'created_at'])
            ->map(fn ($p) => [
                'id'         => $p->id,
                'topic'      => $p->topic,
                'type'       => $p->type,
                'tone'       => $p->tone,
                'status'     => $p->status,
                'created_at' => $p->created_at->diffForHumans(),
            ]);

        return Inertia::render('Brand/Index', ['drafts' => $drafts]);
    }

    /** POST /brand/generate — AI content generation */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic'   => 'required|string|max:300',
            'type'    => 'required|in:post,article,carousel',
            'tone'    => 'required|in:thought-leader,educator,storyteller',
            'context' => 'nullable|string|max:500',
        ]);

        $prompt = $this->buildPrompt($data['topic'], $data['type'], $data['tone'], $data['context'] ?? null);

        try {
            $content = GeminiClient::json($prompt, 60);
            return response()->json(['content' => $content]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Generation failed. Please try again.'], 500);
        }
    }

    /** POST /brand — save a draft */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic'   => 'required|string|max:300',
            'type'    => 'required|in:post,article,carousel',
            'tone'    => 'required|in:thought-leader,educator,storyteller',
            'context' => 'nullable|string|max:500',
            'content' => 'required|array',
        ]);

        $post = BrandPost::create([
            'user_id' => auth()->id(),
            'topic'   => trim($data['topic']),
            'type'    => $data['type'],
            'tone'    => $data['tone'],
            'context' => $data['context'] ?? null,
            'content' => $data['content'],
            'status'  => 'draft',
        ]);

        return response()->json(['id' => $post->id]);
    }

    /** PUT /brand/{post}/status — mark ready/draft */
    public function updateStatus(Request $request, BrandPost $post): JsonResponse
    {
        abort_if($post->user_id !== auth()->id(), 403);
        $post->update(['status' => $request->validate(['status' => 'required|in:draft,ready'])['status']]);
        return response()->json(['ok' => true]);
    }

    /** DELETE /brand/{post} */
    public function destroy(BrandPost $post): RedirectResponse
    {
        abort_if($post->user_id !== auth()->id(), 403);
        $post->delete();
        return back();
    }

    /** GET /brand/{post} — load a saved draft back into the generator */
    public function show(BrandPost $post): Response
    {
        abort_if($post->user_id !== auth()->id(), 403);

        $drafts = BrandPost::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get(['id', 'topic', 'type', 'tone', 'status', 'created_at'])
            ->map(fn ($p) => [
                'id'         => $p->id,
                'topic'      => $p->topic,
                'type'       => $p->type,
                'tone'       => $p->tone,
                'status'     => $p->status,
                'created_at' => $p->created_at->diffForHumans(),
            ]);

        return Inertia::render('Brand/Index', [
            'drafts'      => $drafts,
            'loaded_post' => [
                'id'      => $post->id,
                'topic'   => $post->topic,
                'type'    => $post->type,
                'tone'    => $post->tone,
                'context' => $post->context,
                'content' => $post->content,
            ],
        ]);
    }

    // ── Prompt builders ─────────────────────────────────────────────

    private function buildPrompt(string $topic, string $type, string $tone, ?string $context): string
    {
        $toneGuide = match ($tone) {
            'thought-leader' => 'Bold, confident, opinionated. Take a clear stance. Challenge conventional wisdom.',
            'educator'       => 'Clear, practical, step-by-step. Prioritise usefulness. Explain like you\'re teaching a peer.',
            'storyteller'    => 'Narrative-driven, personal, relatable. Start with a moment or observation. Build to insight.',
            default          => 'Professional and engaging.',
        };

        $contextLine = $context ? "\nExtra context: {$context}" : '';

        return match ($type) {
            'post'     => $this->postPrompt($topic, $toneGuide, $contextLine),
            'article'  => $this->articlePrompt($topic, $toneGuide, $contextLine),
            'carousel' => $this->carouselPrompt($topic, $toneGuide, $contextLine),
        };
    }

    private function postPrompt(string $topic, string $toneGuide, string $contextLine): string
    {
        return <<<PROMPT
You are a LinkedIn content strategist and senior software engineer writing a high-impact LinkedIn post.

Topic: {$topic}{$contextLine}
Tone guide: {$toneGuide}

Write a LinkedIn post (220–320 words). Return STRICT JSON only:
{
  "hooks": [
    "<hook option 1 — first line, max 12 words, creates a pattern interrupt>",
    "<hook option 2 — a bold claim or surprising stat>",
    "<hook option 3 — starts with 'I' and a personal truth>"
  ],
  "body": "<main content, 180-240 words, use double newlines to separate paragraphs, no markdown headers>",
  "cta": "<1 sentence closing call to action — invite comment or follow>",
  "hashtags": ["HashtagOne", "HashtagTwo", "HashtagThree", "HashtagFour", "HashtagFive"]
}

Rules:
- Hooks must be punchy standalone sentences — the reader decides to keep reading based on these
- No em-dashes in the body (LinkedIn renders them oddly)
- Use short paragraphs (1-3 sentences max)
- Hashtags: title-case, no spaces, relevant to the topic
PROMPT;
    }

    private function articlePrompt(string $topic, string $toneGuide, string $contextLine): string
    {
        return <<<PROMPT
You are writing a LinkedIn article for a senior software engineer's personal brand.

Topic: {$topic}{$contextLine}
Tone guide: {$toneGuide}

Write a long-form LinkedIn article (600–900 words). Return STRICT JSON only:
{
  "title": "<compelling headline, max 12 words>",
  "intro": "<opening paragraph, 60-80 words, hooks the reader and states the central argument>",
  "sections": [
    {"heading": "<section heading>", "content": "<section body, 100-150 words>"},
    {"heading": "<section heading>", "content": "<section body, 100-150 words>"},
    {"heading": "<section heading>", "content": "<section body, 100-150 words>"}
  ],
  "conclusion": "<closing paragraph, 60-80 words, ties back to intro and leaves the reader with one key action or thought>",
  "key_takeaways": [
    "<takeaway 1 — one punchy sentence>",
    "<takeaway 2>",
    "<takeaway 3>"
  ],
  "hashtags": ["HashtagOne", "HashtagTwo", "HashtagThree", "HashtagFour", "HashtagFive"]
}
PROMPT;
    }

    private function carouselPrompt(string $topic, string $toneGuide, string $contextLine): string
    {
        return <<<PROMPT
You are creating a LinkedIn carousel (swipeable slides) for a senior software engineer's personal brand.

Topic: {$topic}{$contextLine}
Tone guide: {$toneGuide}

Design a 7-slide LinkedIn carousel. Return STRICT JSON only:
{
  "cover": {
    "headline": "<cover slide headline — bold, 4-8 words, sparks curiosity>",
    "subheadline": "<subtitle — 1 line completing the thought>"
  },
  "slides": [
    {"number": 2, "heading": "<slide heading, max 6 words>", "bullets": ["<point 1, max 15 words>", "<point 2>", "<point 3>"]},
    {"number": 3, "heading": "<slide heading>", "bullets": ["<point 1>", "<point 2>", "<point 3>"]},
    {"number": 4, "heading": "<slide heading>", "bullets": ["<point 1>", "<point 2>", "<point 3>"]},
    {"number": 5, "heading": "<slide heading>", "bullets": ["<point 1>", "<point 2>", "<point 3>"]},
    {"number": 6, "heading": "<slide heading>", "bullets": ["<point 1>", "<point 2>", "<point 3>"]},
    {"number": 7, "heading": "Key Takeaway", "bullets": ["<the single most important insight from the carousel>"]}
  ],
  "cta_slide": {
    "heading": "Found this useful?",
    "action": "<1 sentence — follow me / share this / drop a comment>"
  },
  "hashtags": ["HashtagOne", "HashtagTwo", "HashtagThree", "HashtagFour", "HashtagFive"]
}
PROMPT;
    }
}

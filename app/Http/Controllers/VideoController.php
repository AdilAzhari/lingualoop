<?php

namespace App\Http\Controllers;

use App\Models\VideoScript;
use App\Services\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VideoController extends Controller
{
    /** GET /video */
    public function index(): Response
    {
        $scripts = VideoScript::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get(['id', 'topic', 'video_type', 'platform', 'status', 'created_at'])
            ->map(fn ($s) => [
                'id'         => $s->id,
                'topic'      => $s->topic,
                'video_type' => $s->video_type,
                'platform'   => $s->platform,
                'status'     => $s->status,
                'created_at' => $s->created_at->diffForHumans(),
            ]);

        return Inertia::render('Video/Index', ['scripts' => $scripts]);
    }

    /** GET /video/{script} — load saved script into generator */
    public function show(VideoScript $script): Response
    {
        abort_if($script->user_id !== auth()->id(), 403);

        $scripts = VideoScript::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get(['id', 'topic', 'video_type', 'platform', 'status', 'created_at'])
            ->map(fn ($s) => [
                'id'         => $s->id,
                'topic'      => $s->topic,
                'video_type' => $s->video_type,
                'platform'   => $s->platform,
                'status'     => $s->status,
                'created_at' => $s->created_at->diffForHumans(),
            ]);

        return Inertia::render('Video/Index', [
            'scripts'       => $scripts,
            'loaded_script' => [
                'id'         => $script->id,
                'topic'      => $script->topic,
                'video_type' => $script->video_type,
                'platform'   => $script->platform,
                'duration'   => $script->duration,
                'tone'       => $script->tone,
                'content'    => $script->content,
            ],
        ]);
    }

    /** POST /video/generate */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic'      => 'required|string|max:300',
            'video_type' => 'required|in:tutorial,talking-head,case-study,shorts',
            'platform'   => 'required|in:youtube,linkedin,tiktok',
            'duration'   => 'required|in:short,medium,long',
            'tone'       => 'required|in:educational,entertaining,thought-leadership',
        ]);

        $prompt = $this->buildPrompt($data);

        try {
            $content = GeminiClient::json($prompt, 90);
            return response()->json(['content' => $content]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Generation failed. Please try again.'], 500);
        }
    }

    /** POST /video — save draft */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic'      => 'required|string|max:300',
            'video_type' => 'required|in:tutorial,talking-head,case-study,shorts',
            'platform'   => 'required|in:youtube,linkedin,tiktok',
            'duration'   => 'required|in:short,medium,long',
            'tone'       => 'required|in:educational,entertaining,thought-leadership',
            'content'    => 'required|array',
        ]);

        $script = VideoScript::create([
            'user_id'    => auth()->id(),
            'topic'      => trim($data['topic']),
            'video_type' => $data['video_type'],
            'platform'   => $data['platform'],
            'duration'   => $data['duration'],
            'tone'       => $data['tone'],
            'content'    => $data['content'],
        ]);

        return response()->json(['id' => $script->id]);
    }

    /** PUT /video/{script}/status */
    public function updateStatus(Request $request, VideoScript $script): JsonResponse
    {
        abort_if($script->user_id !== auth()->id(), 403);
        $script->update($request->validate(['status' => 'required|in:draft,ready']));
        return response()->json(['ok' => true]);
    }

    /** DELETE /video/{script} */
    public function destroy(VideoScript $script): RedirectResponse
    {
        abort_if($script->user_id !== auth()->id(), 403);
        $script->delete();
        return back();
    }

    // ── Prompt builder ────────────────────────────────────────────────────

    private function buildPrompt(array $data): string
    {
        $type     = $data['video_type'];
        $platform = $data['platform'];
        $duration = $data['duration'];
        $tone     = $data['tone'];
        $topic    = $data['topic'];

        $durationGuide = match ($duration) {
            'short'  => '3–5 minutes (2–3 main sections)',
            'medium' => '8–12 minutes (4–5 main sections)',
            'long'   => '15–20 minutes (6–7 main sections)',
            default  => '5 minutes',
        };

        $toneGuide = match ($tone) {
            'educational'         => 'Clear, structured, step-by-step. Assume the viewer wants to learn a skill.',
            'entertaining'        => 'Engaging, with light humour and personality. Keep energy high.',
            'thought-leadership'  => 'Opinionated, confident, forward-looking. Share a strong point of view.',
            default               => 'Professional and engaging.',
        };

        $typeGuide = match ($type) {
            'tutorial'     => 'Step-by-step tutorial with code/demo walkthroughs.',
            'talking-head' => 'Face-to-camera explanation. Conversational, no live demo.',
            'case-study'   => 'Deep-dive into a real project or problem you solved.',
            'shorts'       => 'Under 60 seconds. One insight, punchy. No chapters needed.',
            default        => 'General explainer.',
        };

        if ($type === 'shorts' || $platform === 'tiktok') {
            return $this->shortsPrompt($topic, $toneGuide);
        }

        $platformNote = match ($platform) {
            'youtube'  => 'Include detailed chapters and a 120-150 word description with keywords for YouTube SEO.',
            'linkedin' => 'Keep description under 80 words, professional, no chapters list needed.',
            default    => 'Keep it concise.',
        };

        return <<<PROMPT
You are an expert video script writer for tech content creators.

Topic: {$topic}
Video type: {$typeGuide}
Platform: {$platform}
Duration: {$durationGuide}
Tone: {$toneGuide}
Platform note: {$platformNote}

Write a complete, ready-to-record video script. Return STRICT JSON only — no markdown, no text outside JSON:
{
  "title": "<SEO-optimised video title, max 10 words>",
  "hook": "<first 10-15 seconds of script — a surprising fact, bold claim, or relatable pain point that makes the viewer stay>",
  "intro": "<30-45 second intro: greet audience, state what they will learn, why it matters to them>",
  "sections": [
    {
      "title": "<section heading>",
      "script": "<verbatim script for this section — what to say out loud>",
      "talking_points": ["<key point 1>", "<key point 2>", "<key point 3>"],
      "broll": "<description of visuals, screen recording, or b-roll to show while talking>",
      "duration_seconds": <estimated seconds for this section as integer>
    }
  ],
  "outro": "<30-second outro: summarise key takeaway, CTA (subscribe/follow/comment), tease next video>",
  "chapters": [{"time": "0:00", "title": "Intro"}, ...],
  "description": "<platform description with relevant keywords>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Rules:
- Script text should sound natural when spoken aloud — no bullet-point lists in the script field
- Talking points are for the presenter's reference only, not read aloud
- B-roll should be specific (e.g., "Show terminal with docker-compose running" not just "show code")
- Chapters must include timestamps starting at 0:00 for Intro
PROMPT;
    }

    private function shortsPrompt(string $topic, string $toneGuide): string
    {
        return <<<PROMPT
You are writing a 45-60 second short-form video script (TikTok/Shorts/Reels).

Topic: {$topic}
Tone: {$toneGuide}

Return STRICT JSON only:
{
  "title": "<punchy title, max 8 words>",
  "hook": "<first 3 seconds — one sentence that stops the scroll>",
  "intro": "",
  "sections": [
    {
      "title": "Main point",
      "script": "<35-45 seconds of content — one focused insight, delivered fast>",
      "talking_points": ["<key point>"],
      "broll": "<visual suggestion>",
      "duration_seconds": 40
    }
  ],
  "outro": "<5-second CTA — follow for more, comment your answer, etc.>",
  "chapters": [],
  "description": "<short caption with 3-5 hashtags>",
  "tags": ["tag1", "tag2", "tag3"]
}
PROMPT;
    }
}

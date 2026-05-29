<?php

namespace App\Http\Controllers;

use App\Models\VocabularyEntry;
use App\Services\GeminiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VocabularyController extends Controller
{
    /** GET /vocabulary */
    public function index(): Response
    {
        $user = auth()->user();

        $entries = $user->vocabularyEntries()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'word' => $e->word,
                'definition' => $e->definition,
                'example' => $e->example,
                'source' => $e->source,
                'level' => $e->level,
                'used_in_prompt' => $e->used_in_prompt,
                'srs_state' => $e->srs_state,
                'srs_due_at' => $e->srs_due_at?->toIso8601String(),
                'created_at' => $e->created_at->format('M j'),
            ])
            ->all();

        return Inertia::render('Vocabulary', ['entries' => $entries]);
    }

    /** POST /vocabulary */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $data = $request->validate([
            'word'       => 'required|string|max:100',
            'definition' => 'nullable|string|max:500',
            'example'    => 'nullable|string|max:500',
            'level'      => 'nullable|in:a2,b1,b2,c1,c2',
        ]);

        VocabularyEntry::create([
            'user_id'    => auth()->id(),
            'word'       => trim($data['word']),
            'definition' => $data['definition'] ?? null,
            'example'    => $data['example'] ?? null,
            'level'      => $data['level'] ?? null,
            'source'     => 'manual',
        ]);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back();
    }

    /** PUT /vocabulary/{entry} */
    public function update(Request $request, VocabularyEntry $entry): RedirectResponse
    {
        abort_if($entry->user_id !== auth()->id(), 403);

        $data = $request->validate([
            'definition' => 'nullable|string|max:500',
            'example'    => 'nullable|string|max:500',
            'level'      => 'nullable|in:a2,b1,b2,c1,c2',
        ]);

        $entry->update($data);

        return back();
    }

    /** POST /vocabulary/suggest — AI-generated example + CEFR level for a word */
    public function suggest(Request $request): JsonResponse
    {
        $word = trim($request->validate(['word' => 'required|string|max:100'])['word']);

        $prompt = <<<PROMPT
Word: "{$word}"

Return a JSON object with exactly two keys:
- "example": one natural example sentence using this word (IELTS academic writing style, clear and concise)
- "level": the CEFR difficulty level of this vocabulary word (must be exactly one of: a2, b1, b2, c1, c2)

Respond with valid JSON only.
PROMPT;

        try {
            $data = GeminiClient::json($prompt, 20);
            return response()->json([
                'example' => isset($data['example']) ? (string) $data['example'] : null,
                'level'   => isset($data['level']) && in_array($data['level'], ['a2','b1','b2','c1','c2'])
                    ? $data['level'] : null,
            ]);
        } catch (\Throwable) {
            return response()->json(['example' => null, 'level' => null]);
        }
    }

    /** DELETE /vocabulary/{entry} */
    public function destroy(VocabularyEntry $entry): RedirectResponse
    {
        abort_if($entry->user_id !== auth()->id(), 403);
        $entry->delete();

        return back();
    }
}

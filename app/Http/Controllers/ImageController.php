<?php

namespace App\Http\Controllers;

use App\Models\ImagePrompt;
use App\Models\ImageSession;
use App\Services\Image\ImageGrader;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ImageController extends Controller
{
    /** GET /images */
    public function index(): Response
    {
        $userId  = auth()->id();
        $prompts = ImagePrompt::orderBy('type')->orderBy('level')->get();

        $best = ImageSession::where('user_id', $userId)
            ->where('status', 'graded')
            ->selectRaw('prompt_id, mode, MAX(score_task + score_vocabulary + score_coherence + score_accuracy) / 4 as best_avg, COUNT(*) as attempts')
            ->groupBy('prompt_id', 'mode')
            ->get()
            ->groupBy('prompt_id');

        $topics = $prompts->pluck('topic')->unique()->sort()->values()->all();
        $types  = $prompts->pluck('type')->unique()->sort()->values()->all();

        return Inertia::render('Image/Index', [
            'topics'  => $topics,
            'types'   => $types,
            'prompts' => $prompts->map(fn ($p) => [
                'id'           => $p->id,
                'title'        => $p->title,
                'type'         => $p->type,
                'topic'        => $p->topic,
                'level'        => $p->level,
                'mode'         => $p->mode,
                'target_words' => $p->target_words,
                'best_writing' => $best->has($p->id)
                    ? (int) round($best->get($p->id)->firstWhere('mode', 'writing')?->best_avg ?? 0) ?: null
                    : null,
                'best_speaking' => $best->has($p->id)
                    ? (int) round($best->get($p->id)->firstWhere('mode', 'speaking')?->best_avg ?? 0) ?: null
                    : null,
            ]),
        ]);
    }

    /** GET /images/{prompt} */
    public function show(ImagePrompt $prompt): Response
    {
        return Inertia::render('Image/Show', [
            'prompt' => [
                'id'              => $prompt->id,
                'title'           => $prompt->title,
                'type'            => $prompt->type,
                'topic'           => $prompt->topic,
                'level'           => $prompt->level,
                'task_instruction'=> $prompt->task_instruction,
                'key_features'    => $prompt->key_features,
                'mode'            => $prompt->mode,
                'target_words'    => $prompt->target_words,
                'target_seconds'  => $prompt->target_seconds,
            ],
        ]);
    }

    /** GET /images/{prompt}/image — serve the image file */
    public function image(ImagePrompt $prompt): BinaryFileResponse
    {
        $path = Storage::disk('local')->path($prompt->image_path);
        abort_if(! file_exists($path), 404);
        $headers = str_ends_with($prompt->image_path, '.svg')
            ? ['Content-Type' => 'image/svg+xml']
            : [];
        return response()->file($path, $headers);
    }

    /** POST /images/{prompt}/writing */
    public function storeWriting(Request $request, ImagePrompt $prompt): RedirectResponse
    {
        $data = $request->validate([
            'text' => 'required|string|min:10|max:5000',
        ]);

        $result = (new ImageGrader())->gradeWriting(
            $prompt->image_path,
            $this->detectMime($prompt->image_path),
            $data['text'],
            $prompt->key_features,
            $prompt->task_instruction,
        );

        $session = ImageSession::create([
            'user_id'             => auth()->id(),
            'prompt_id'           => $prompt->id,
            'mode'                => 'writing',
            'status'              => 'graded',
            'text'                => $data['text'],
            'score_task'          => $result->scores['task'],
            'score_vocabulary'    => $result->scores['vocabulary'],
            'score_coherence'     => $result->scores['coherence'],
            'score_accuracy'      => $result->scores['accuracy'],
            'dimension_notes'     => $result->dimensionNotes,
            'headline'            => $result->headline,
            'overall_note'        => $result->overallNote,
            'collocation_errors'  => $result->collocationErrors,
            'key_features_missed' => $result->keyFeaturesMissed,
            'graded_at'           => now(),
        ]);

        return redirect()->route('images.sessions.show', $session->id);
    }

    /** POST /images/{prompt}/speaking */
    public function storeSpeaking(Request $request, ImagePrompt $prompt): RedirectResponse
    {
        $request->validate([
            'audio'    => 'required|file|max:30720',
            'duration' => 'nullable|integer|min:0|max:300',
        ]);

        $userId   = auth()->id();
        $file     = $request->file('audio');
        $mimeType = $file->getMimeType() ?? 'audio/webm';
        $ext      = match (true) {
            str_contains($mimeType, 'ogg') => 'ogg',
            str_contains($mimeType, 'mp4') => 'mp4',
            str_contains($mimeType, 'wav') => 'wav',
            default                        => 'webm',
        };

        $audioPath = $file->storeAs(
            "image-speaking/{$userId}",
            now()->format('YmdHis') . ".{$ext}",
            disk: 'local'
        );

        $result = (new ImageGrader())->gradeSpeaking(
            $prompt->image_path,
            $this->detectMime($prompt->image_path),
            $audioPath,
            $mimeType,
            $prompt->key_features,
            $prompt->task_instruction,
        );

        $session = ImageSession::create([
            'user_id'             => auth()->id(),
            'prompt_id'           => $prompt->id,
            'mode'                => 'speaking',
            'status'              => 'graded',
            'audio_path'          => $audioPath,
            'audio_mime'          => $mimeType,
            'transcript'          => $result->transcript,
            'score_task'          => $result->scores['task'],
            'score_vocabulary'    => $result->scores['vocabulary'],
            'score_coherence'     => $result->scores['coherence'],
            'score_accuracy'      => $result->scores['accuracy'],
            'dimension_notes'     => $result->dimensionNotes,
            'headline'            => $result->headline,
            'overall_note'        => $result->overallNote,
            'collocation_errors'  => $result->collocationErrors,
            'key_features_missed' => $result->keyFeaturesMissed,
            'graded_at'           => now(),
        ]);

        return redirect()->route('images.sessions.show', $session->id);
    }

    /** GET /images/sessions/{session}/audio */
    public function audio(ImageSession $session): BinaryFileResponse
    {
        abort_if($session->user_id !== auth()->id(), 403);
        $path = Storage::disk('local')->path($session->audio_path);
        abort_if(! file_exists($path), 404);
        return response()->file($path, ['Content-Type' => $session->audio_mime ?? 'audio/webm']);
    }

    /** GET /images/sessions/{session} */
    public function session(ImageSession $session): Response
    {
        abort_if($session->user_id !== auth()->id(), 403);
        $prompt = $session->prompt;

        return Inertia::render('Image/Feedback', [
            'prompt' => [
                'id'    => $prompt->id,
                'title' => $prompt->title,
                'type'  => $prompt->type,
                'topic' => $prompt->topic,
                'level' => $prompt->level,
            ],
            'session' => [
                'id'                  => $session->id,
                'mode'                => $session->mode,
                'overall'             => $session->overall,
                'text'                => $session->text,
                'transcript'          => $session->transcript,
                'has_audio'           => $session->audio_path && file_exists(storage_path('app/' . $session->audio_path)),
                'scores'              => [
                    'task'       => $session->score_task,
                    'vocabulary' => $session->score_vocabulary,
                    'coherence'  => $session->score_coherence,
                    'accuracy'   => $session->score_accuracy,
                ],
                'dimension_notes'     => $session->dimension_notes ?? ['task' => '', 'vocabulary' => '', 'coherence' => '', 'accuracy' => ''],
                'headline'            => $session->headline ?? ['primary' => 'Feedback', 'secondary' => ''],
                'overall_note'        => $session->overall_note,
                'collocation_errors'  => $session->collocation_errors ?? [],
                'key_features_missed' => $session->key_features_missed ?? [],
                'graded_at'           => $session->graded_at?->toIso8601String(),
            ],
        ]);
    }

    private function detectMime(string $path): string
    {
        if (str_ends_with($path, '.svg')) return 'image/svg+xml';
        $full = Storage::disk('local')->path($path);
        if (! file_exists($full)) return 'image/jpeg';
        return mime_content_type($full) ?: 'image/jpeg';
    }
}

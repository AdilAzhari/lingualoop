<?php

namespace App\Http\Controllers;

use App\Models\SeFlashcard;
use App\Models\SeFlashcardProgress;
use App\Models\SePrompt;
use App\Models\SeSession;
use App\Services\SE\SeGrader;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SeController extends Controller
{
    /** GET /software */
    public function index(): Response
    {
        $userId  = auth()->id();
        $prompts = SePrompt::orderByRaw("FIELD(difficulty, 'junior', 'mid', 'senior', 'staff')")->get();

        $best = SeSession::where('user_id', $userId)
            ->where('status', 'graded')
            ->selectRaw('prompt_id, mode, MAX((IFNULL(score_technical,0) + IFNULL(score_clarity,0) + IFNULL(score_completeness,0) + IFNULL(score_tradeoffs,0)) / 4) as best_avg')
            ->groupBy('prompt_id', 'mode')
            ->get();

        $bestByPrompt = [];
        foreach ($best as $row) {
            $bestByPrompt[$row->prompt_id][$row->mode] = (int) round($row->best_avg);
        }

        $categories = $prompts->pluck('category')->unique()->sort()->values()->all();

        return Inertia::render('SE/Index', [
            'categories' => $categories,
            'prompts'    => $prompts->map(fn ($p) => [
                'id'            => $p->id,
                'title'         => $p->title,
                'category'      => $p->category,
                'difficulty'    => $p->difficulty,
                'mode'          => $p->mode,
                'best_writing'  => $bestByPrompt[$p->id]['writing']  ?? null,
                'best_speaking' => $bestByPrompt[$p->id]['speaking'] ?? null,
            ]),
        ]);
    }

    /** GET /software/{prompt} */
    public function show(SePrompt $prompt): Response
    {
        return Inertia::render('SE/Show', [
            'prompt' => [
                'id'              => $prompt->id,
                'title'           => $prompt->title,
                'category'        => $prompt->category,
                'difficulty'      => $prompt->difficulty,
                'description'     => $prompt->description,
                'context'         => $prompt->context,
                'key_concepts'    => $prompt->key_concepts,
                'framework_hints' => $prompt->framework_hints,
                'mode'            => $prompt->mode,
                'target_words'    => $prompt->target_words,
                'target_seconds'  => $prompt->target_seconds,
            ],
        ]);
    }

    /** POST /software/{prompt}/writing */
    public function storeWriting(Request $request, SePrompt $prompt): RedirectResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|min:10|max:10000',
        ]);

        $userId         = auth()->id();
        $keyConceptsStr = implode(', ', $prompt->key_concepts ?? []);
        $frameworkHints = implode(', ', $prompt->framework_hints ?? []);

        $result = (new SeGrader())->gradeWriting(
            $validated['text'],
            $keyConceptsStr,
            $frameworkHints,
            $prompt->description,
            $prompt->difficulty,
        );

        $session = SeSession::create([
            'user_id'             => $userId,
            'prompt_id'           => $prompt->id,
            'mode'                => 'writing',
            'status'              => 'graded',
            'text'                => $validated['text'],
            'score_technical'     => $result->scores['technical'],
            'score_clarity'       => $result->scores['clarity'],
            'score_completeness'  => $result->scores['completeness'],
            'score_tradeoffs'     => $result->scores['tradeoffs'],
            'dimension_notes'     => $result->dimensionNotes,
            'headline'            => $result->headline,
            'overall_note'        => $result->overallNote,
            'key_concepts_missed' => $result->keyConceptsMissed,
            'improvement_tips'    => $result->improvementTips,
            'graded_at'           => now(),
        ]);

        return redirect()->route('se.sessions.show', $session->id);
    }

    /** POST /software/{prompt}/speaking */
    public function storeSpeaking(Request $request, SePrompt $prompt): RedirectResponse
    {
        $request->validate([
            'audio'    => 'required|file|max:30720',
            'duration' => 'nullable|integer|min:0|max:600',
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
            "se/{$userId}",
            now()->format('YmdHis') . ".{$ext}",
            'local'
        );

        $keyConceptsStr = implode(', ', $prompt->key_concepts ?? []);
        $frameworkHints = implode(', ', $prompt->framework_hints ?? []);

        $result = (new SeGrader())->gradeSpeaking(
            $audioPath,
            $mimeType,
            $keyConceptsStr,
            $frameworkHints,
            $prompt->description,
            $prompt->difficulty,
        );

        $session = SeSession::create([
            'user_id'             => $userId,
            'prompt_id'           => $prompt->id,
            'mode'                => 'speaking',
            'status'              => 'graded',
            'audio_path'          => $audioPath,
            'audio_mime'          => $mimeType,
            'transcript'          => $result->transcript,
            'score_technical'     => $result->scores['technical'],
            'score_clarity'       => $result->scores['clarity'],
            'score_completeness'  => $result->scores['completeness'],
            'score_tradeoffs'     => $result->scores['tradeoffs'],
            'dimension_notes'     => $result->dimensionNotes,
            'headline'            => $result->headline,
            'overall_note'        => $result->overallNote,
            'key_concepts_missed' => $result->keyConceptsMissed,
            'improvement_tips'    => $result->improvementTips,
            'graded_at'           => now(),
        ]);

        return redirect()->route('se.sessions.show', $session->id);
    }

    /** GET /software/sessions/{session} */
    public function session(SeSession $session): Response
    {
        abort_if($session->user_id !== auth()->id(), 403);

        $prompt = $session->prompt;

        return Inertia::render('SE/Feedback', [
            'prompt' => [
                'id'         => $prompt->id,
                'title'      => $prompt->title,
                'category'   => $prompt->category,
                'difficulty' => $prompt->difficulty,
            ],
            'session' => [
                'id'                  => $session->id,
                'mode'                => $session->mode,
                'overall'             => $session->overall,
                'text'                => $session->text,
                'transcript'          => $session->transcript,
                'has_audio'           => $session->audio_path && file_exists(storage_path('app/' . $session->audio_path)),
                'scores'              => [
                    'technical'    => $session->score_technical,
                    'clarity'      => $session->score_clarity,
                    'completeness' => $session->score_completeness,
                    'tradeoffs'    => $session->score_tradeoffs,
                ],
                'dimension_notes'     => $session->dimension_notes    ?? ['technical' => '', 'clarity' => '', 'completeness' => '', 'tradeoffs' => ''],
                'headline'            => $session->headline            ?? ['primary' => 'Feedback', 'secondary' => ''],
                'overall_note'        => $session->overall_note,
                'key_concepts_missed' => $session->key_concepts_missed ?? [],
                'improvement_tips'    => $session->improvement_tips    ?? [],
                'graded_at'           => $session->graded_at?->toIso8601String(),
            ],
        ]);
    }

    /** GET /software/sessions/{session}/audio */
    public function audio(SeSession $session): BinaryFileResponse
    {
        abort_if($session->user_id !== auth()->id(), 403);
        $path = storage_path('app/' . $session->audio_path);
        abort_if(! file_exists($path), 404);
        return response()->file($path, ['Content-Type' => $session->audio_mime ?? 'audio/webm']);
    }

    /** GET /software/flashcards */
    public function flashcards(): Response
    {
        $userId = auth()->id();

        $hasProgress = SeFlashcardProgress::where('user_id', $userId)->exists();

        if (! $hasProgress) {
            SeFlashcard::all()->each(function (SeFlashcard $card) use ($userId) {
                SeFlashcardProgress::create([
                    'user_id'      => $userId,
                    'flashcard_id' => $card->id,
                    'stability'    => 0,
                    'difficulty'   => 0,
                    'state'        => 'new',
                    'due_at'       => null,
                ]);
            });
        }

        $cards = SeFlashcardProgress::with('flashcard')
            ->where('user_id', $userId)
            ->where(fn ($q) => $q->whereNull('due_at')->orWhere('due_at', '<=', now()))
            ->orderByRaw("CASE WHEN state = 'new' THEN 0 WHEN state = 'learning' THEN 1 ELSE 2 END")
            ->orderBy('due_at')
            ->take(20)
            ->get()
            ->map(fn ($p) => [
                'progress_id' => $p->id,
                'state'       => $p->state,
                'id'          => $p->flashcard->id,
                'concept'     => $p->flashcard->concept,
                'category'    => $p->flashcard->category,
                'front'       => $p->flashcard->front,
                'back'        => $p->flashcard->back,
                'example'     => $p->flashcard->example,
                'gotcha'      => $p->flashcard->gotcha,
            ])
            ->all();

        $totalDue = SeFlashcardProgress::where('user_id', $userId)
            ->where(fn ($q) => $q->whereNull('due_at')->orWhere('due_at', '<=', now()))
            ->count();

        return Inertia::render('SE/Flashcards', [
            'cards'     => $cards,
            'total_due' => $totalDue,
        ]);
    }

    /** POST /software/flashcards/{progress}/answer */
    public function flashcardAnswer(Request $request, SeFlashcardProgress $progress): RedirectResponse
    {
        abort_if($progress->user_id !== auth()->id(), 403);

        $rating = $request->validate(['rating' => 'required|in:forgot,hard,good,easy'])['rating'];

        $this->applySrs($progress, $rating);
        $progress->last_reviewed_at = now();
        $progress->save();

        return back();
    }

    private function applySrs(SeFlashcardProgress $progress, string $rating): void
    {
        $stability  = max(0.5, $progress->stability);
        $difficulty = $progress->difficulty;
        $isNew      = $progress->state === 'new';

        if ($rating === 'forgot') {
            $progress->stability  = 0.5;
            $progress->difficulty = min(10.0, $difficulty + 1.0);
            $progress->state      = 'learning';
            $progress->due_at     = now()->addDay();
        } elseif ($rating === 'hard') {
            $newStab = $isNew ? 1.0 : round($stability * 1.2, 2);
            $progress->stability  = $newStab;
            $progress->difficulty = min(10.0, $difficulty + 0.3);
            $progress->state      = 'learning';
            $progress->due_at     = now()->addDays(max(1, (int) ($newStab * 0.6)));
        } elseif ($rating === 'good') {
            $newStab = $isNew ? 2.0 : round($stability * 2.0, 2);
            $progress->stability  = $newStab;
            $progress->state      = 'review';
            $progress->due_at     = now()->addDays(max(1, (int) $newStab));
        } else {
            $newStab = $isNew ? 4.0 : round($stability * 2.5, 2);
            $progress->stability  = $newStab;
            $progress->difficulty = max(1.0, $difficulty - 0.2);
            $progress->state      = 'review';
            $progress->due_at     = now()->addDays(max(1, (int) ($newStab * 1.5)));
        }
    }
}

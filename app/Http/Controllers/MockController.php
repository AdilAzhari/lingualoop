<?php

namespace App\Http\Controllers;

use App\Models\MockSession;
use App\Models\Prompt;
use App\Models\ReadingPassage;
use App\Models\ReadingSession;
use App\Models\SpeakingPrompt;
use App\Models\SpeakingSession;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MockController extends Controller
{
    /** GET /mock */
    public function index(): Response
    {
        $history = MockSession::where('user_id', auth()->id())
            ->orderByDesc('started_at')
            ->take(5)
            ->with(['prompt', 'passage', 'speakingPrompt'])
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'started_at' => $m->started_at?->format('M j, g:i a'),
                'status'     => $m->status,
                'writing'    => $m->prompt?->text ? mb_substr($m->prompt->text, 0, 80) . '…' : null,
                'reading'    => $m->passage?->title,
                'speaking'   => $m->speakingPrompt?->text ? mb_substr($m->speakingPrompt->text, 0, 80) . '…' : null,
            ])
            ->all();

        return Inertia::render('Mock/Index', ['history' => $history]);
    }

    /** POST /mock */
    public function create(): RedirectResponse
    {
        $userId = auth()->id();

        $prompt          = Prompt::inRandomOrder()->first();
        $passage         = ReadingPassage::inRandomOrder()->first();
        $speakingPrompt  = SpeakingPrompt::inRandomOrder()->first();

        $session = MockSession::create([
            'user_id'           => $userId,
            'prompt_id'         => $prompt?->id,
            'passage_id'        => $passage?->id,
            'speaking_prompt_id'=> $speakingPrompt?->id,
            'status'            => 'in_progress',
            'started_at'        => now(),
        ]);

        return redirect()->route('mock.show', $session->id);
    }

    /** GET /mock/{session} */
    public function show(MockSession $session): Response
    {
        abort_if($session->user_id !== auth()->id(), 403);

        $userId = auth()->id();

        // Writing: latest graded submission for this prompt
        $writingScore = $session->prompt_id
            ? Submission::where('user_id', $userId)
                ->where('prompt_id', $session->prompt_id)
                ->where('status', 'graded')
                ->where('submitted_at', '>=', $session->started_at)
                ->orderByDesc('submitted_at')
                ->value('overall')
            : null;

        // Reading: latest graded session for this passage
        $readingScore = $session->passage_id
            ? ReadingSession::where('user_id', $userId)
                ->where('passage_id', $session->passage_id)
                ->where('status', 'graded')
                ->where('graded_at', '>=', $session->started_at)
                ->orderByDesc('graded_at')
                ->value('score')
            : null;

        // Speaking: latest graded session for this prompt
        $speakingScore = $session->speaking_prompt_id
            ? SpeakingSession::where('user_id', $userId)
                ->where('prompt_id', $session->speaking_prompt_id)
                ->where('status', 'graded')
                ->where('graded_at', '>=', $session->started_at)
                ->orderByDesc('graded_at')
                ->selectRaw('(score_fluency + score_vocabulary + score_grammar + score_pronunciation) / 4 as avg_score')
                ->first()?->avg_score
            : null;

        $allDone = $writingScore !== null && $readingScore !== null && $speakingScore !== null;
        if ($allDone && $session->status !== 'complete') {
            $session->update(['status' => 'complete', 'completed_at' => now()]);
        }

        return Inertia::render('Mock/Hub', [
            'mock' => [
                'id'         => $session->id,
                'started_at' => $session->started_at?->toIso8601String(),
                'status'     => $session->status,
                'writing' => $session->prompt_id ? [
                    'prompt_id' => $session->prompt_id,
                    'text'      => $session->prompt?->text,
                    'score'     => $writingScore !== null ? (int) round($writingScore) : null,
                ] : null,
                'reading' => $session->passage_id ? [
                    'passage_id' => $session->passage_id,
                    'title'      => $session->passage?->title,
                    'score'      => $readingScore !== null ? (int) $readingScore : null,
                ] : null,
                'speaking' => $session->speaking_prompt_id ? [
                    'prompt_id' => $session->speaking_prompt_id,
                    'text'      => $session->speakingPrompt?->text,
                    'score'     => $speakingScore !== null ? (int) round($speakingScore) : null,
                ] : null,
            ],
        ]);
    }
}

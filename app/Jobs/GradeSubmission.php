<?php

namespace App\Jobs;

use App\Events\Grading\Completed;
use App\Events\Grading\PhaseAdvanced;
use App\Models\DrillCard;
use App\Models\ErrorInstance;
use App\Models\Streak;
use App\Models\Submission;
use App\Models\VocabularyEntry;
use App\Services\Grading\GradingResult;
use App\Services\Grading\GradingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class GradeSubmission implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $submissionId, public array $context = []) {}

    public function handle(GradingService $grading): void
    {
        $key = "grading:{$this->submissionId}";

        $this->phase($key, 0);

        $result = $grading->grade($this->context);

        foreach ([1, 2, 3] as $phase) {
            usleep(1_900_000);
            $this->phase($key, $phase);
        }

        $submission = Submission::find($this->submissionId);
        if ($submission) {
            $this->persist($submission, $result);
        }

        Cache::put("{$key}:status", 'graded', now()->addHour());
        broadcast(new Completed($this->submissionId));
    }

    private function persist(Submission $submission, GradingResult $result): void
    {
        // 1. Update submission with grading results
        $submission->update([
            'status'           => 'graded',
            'score_grammar'    => $result->scores['grammar'],
            'score_vocabulary' => $result->scores['vocabulary'],
            'score_coherence'  => $result->scores['coherence'],
            'score_task'       => $result->scores['task'],
            'dimension_notes'  => $result->dimensionNotes,
            'headline'         => $result->headline,
            'vocab_examples'   => $result->vocabExamples ?: null,
            'graded_at'        => now(),
        ]);

        // 2. Persist error instances
        foreach ($result->errors as $error) {
            ErrorInstance::create([
                'user_id' => $submission->user_id,
                'submission_id' => $submission->id,
                'type' => $error['type'],
                'dimension' => $error['dimension'],
                'span_start' => $error['span_start'],
                'span_end' => $error['span_end'],
                'span_text' => $error['span_text'],
                'suggested_fix' => $error['suggested_fix'] ?? null,
                'note' => $error['note'] ?? null,
                'severity' => $error['severity'],
            ]);
        }

        // 3. Generate drill cards from actionable errors
        $cardCount = $this->generateDrillCards($submission, $result->errors);
        Cache::put("grading:{$submission->id}:drill_cards", $cardCount, now()->addHour());

        // 4. Cache the noticed pattern for SubmissionController
        if ($result->noticed) {
            Cache::put("grading:{$submission->id}:noticed", $result->noticed, now()->addHour());
        }

        // 5. Mark vocab words used in this essay
        $this->markVocabUsed($submission->user_id, $submission->text);

        // 6. Update streak
        $this->updateStreak($submission->user_id);
    }

    private function generateDrillCards(Submission $submission, array $errors): int
    {
        $prepositionPool = ['on', 'in', 'at', 'by', 'to', 'for', 'from', 'of', 'about', 'with'];
        $count = 0;

        foreach ($errors as $error) {
            if ($error['severity'] === 'good') {
                continue;
            }

            // Extract a clean single-word answer from suggested_fix
            $fixCleaned = trim($error['suggested_fix'] ?? '', " —–-\t\n\"'");
            if (! preg_match('/^([a-zA-Z]+)$/', $fixCleaned, $m)) {
                continue;
            }
            $correct = strtolower($m[1]);
            $wrong = strtolower($error['span_text']);

            // Build cloze prompt from the submission text around the span
            $text = $submission->text;
            $spanStart = (int) $error['span_start'];
            $spanEnd = (int) $error['span_end'];
            $snippetStart = max(0, $spanStart - 80);
            $before = ($snippetStart > 0 ? '…' : '') . substr($text, $snippetStart, $spanStart - $snippetStart);
            $after = substr($text, $spanEnd, 80) . ($spanEnd + 80 < strlen($text) ? '…' : '');
            $prompt = trim($before) . ' ___ ' . ltrim($after);

            // Build 4 options: correct + wrong + 2 distractors
            $distractors = collect($prepositionPool)
                ->reject(fn ($p) => $p === $correct || $p === $wrong)
                ->shuffle()
                ->take(2)
                ->values()
                ->all();

            $options = collect([$correct, $wrong, ...$distractors])->shuffle()->values()->all();
            $correctIndex = array_search($correct, $options);

            DrillCard::create([
                'user_id' => $submission->user_id,
                'type' => $error['type'],
                'source_submission_id' => $submission->id,
                'source_span_text' => $error['span_text'],
                'prompt' => $prompt,
                'options' => $options,
                'correct_index' => $correctIndex,
                'note' => $error['note'] ?? null,
                'stability' => 0.0,
                'difficulty' => 5.0,
                'state' => 'new',
                'due_at' => null,
            ]);

            $count++;
        }

        return $count;
    }

    private function markVocabUsed(int $userId, string $text): void
    {
        $lowerText = mb_strtolower($text);

        VocabularyEntry::where('user_id', $userId)
            ->where('used_in_prompt', false)
            ->each(function (VocabularyEntry $entry) use ($lowerText) {
                if (str_contains($lowerText, mb_strtolower($entry->word))) {
                    $entry->update(['used_in_prompt' => true]);
                }
            });
    }

    private function updateStreak(int $userId): void
    {
        $streak = Streak::firstOrCreate(
            ['user_id' => $userId],
            ['current_days' => 0, 'longest_days' => 0]
        );

        $today = today();

        if ($streak->last_active_on?->eq($today)) {
            return; // already recorded today
        }

        if ($streak->last_active_on?->eq($today->subDay())) {
            $streak->current_days++;
        } else {
            $streak->current_days = 1;
        }

        $streak->longest_days = max($streak->longest_days, $streak->current_days);
        $streak->last_active_on = $today;
        $streak->save();
    }

    private function phase(string $key, int $phase): void
    {
        Cache::put("{$key}:phase", $phase, now()->addHour());
        Cache::put("{$key}:status", 'grading', now()->addHour());
        broadcast(new PhaseAdvanced($this->submissionId, $phase));
    }
}

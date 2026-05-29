<?php

namespace App\Services\Reading;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReadingGrader
{
    public function grade(string $passageBody, array $questions): ReadingGradingResult
    {
        $key    = env('GEMINI_API_KEY', '');
        $model  = env('GEMINI_MODEL', 'gemini-2.5-flash-lite');
        $driver = env('GRADING_DRIVER', 'stub');

        if ($driver !== 'gemini' || ! $key) {
            return $this->stub($questions);
        }

        try {
            $response = Http::timeout(45)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
                [
                    'contents'         => [['parts' => [['text' => $this->buildPrompt($passageBody, $questions)]]]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature'      => 0.2,
                        'maxOutputTokens'  => 2000,
                    ],
                ]
            );

            if (! $response->successful()) {
                Log::error('ReadingGrader HTTP error', ['status' => $response->status(), 'body' => $response->body()]);
                return $this->stub($questions);
            }

            $this->trackUsage($response->json());

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text', '');
            $data = json_decode($text, true);

            if (! $data) {
                Log::error('ReadingGrader: failed to parse JSON', ['raw' => $text]);
                return $this->stub($questions);
            }

            return ReadingGradingResult::fromArray($data);

        } catch (\Throwable $e) {
            Log::error('ReadingGrader exception: ' . $e->getMessage());
            return $this->stub($questions);
        }
    }

    private function buildPrompt(string $passageBody, array $questions): string
    {
        $qBlock = '';
        foreach ($questions as $q) {
            $qBlock .= "Question ID {$q['question_id']} (#{$q['position']}): {$q['question_text']}\n";
            $qBlock .= "  Model answer : {$q['model_answer']}\n";
            $qBlock .= "  Learner answer: {$q['user_answer']}\n\n";
        }

        $ids = implode(', ', array_column($questions, 'question_id'));

        return <<<PROMPT
You are an IELTS reading comprehension examiner and warm language coach. Grade the learner's answers below.

PASSAGE:
{$passageBody}

---

{$qBlock}
Return STRICT JSON only — no markdown, no text outside JSON:
{
  "score": <0-100, weighted average of all question scores>,
  "overall_note": "<2-3 warm, specific sentences summarising the learner's comprehension>",
  "question_feedback": [
    {
      "question_id": <int — one of: {$ids}>,
      "score": <0-100>,
      "correct": <true if score >= 70>,
      "note": "<1-2 sentences referencing the passage — what they got right or where to look>"
    }
  ]
}

Rules:
- Judge understanding, not exact wording — paraphrases count as correct
- Blank or completely off-topic answers score 0
- Include every question_id in question_feedback
PROMPT;
    }

    private function stub(array $questions): ReadingGradingResult
    {
        $pool = [
            [100, true,  'Correct. The passage clearly states this in the second paragraph.'],
            [60,  false, 'Partially correct — you identified the right area but missed the specific detail.'],
            [80,  true,  'Good understanding here. The passage supports your interpretation.'],
            [30,  false, 'Not quite. Look at the third paragraph — the answer is stated explicitly there.'],
            [90,  true,  'Exactly right. Well done picking up that detail.'],
        ];

        $feedback = [];
        foreach ($questions as $i => $q) {
            [$score, $correct, $note] = $pool[$i % count($pool)];
            $feedback[] = [
                'question_id' => $q['question_id'],
                'score'       => $score,
                'correct'     => $correct,
                'note'        => $note,
            ];
        }

        $overall = (int) round(array_sum(array_column($feedback, 'score')) / count($feedback));

        return new ReadingGradingResult(
            score:            $overall,
            overallNote:      'A solid attempt overall. You grasped the main ideas well, though a few specific details need closer reading.',
            questionFeedback: $feedback,
        );
    }

    private function trackUsage(array $responseJson): void
    {
        $tokens = (int) data_get($responseJson, 'usageMetadata.totalTokenCount', 0);
        $date   = now()->format('Y-m-d');
        $minute = now()->format('Y-m-d_H:i');

        Cache::add("gemini:usage:{$date}:requests", 0, now()->endOfDay());
        Cache::increment("gemini:usage:{$date}:requests");
        Cache::add("gemini:usage:{$date}:tokens", 0, now()->endOfDay());
        Cache::increment("gemini:usage:{$date}:tokens", max(1, $tokens));
        Cache::add("gemini:usage:min:{$minute}:requests", 0, 90);
        Cache::increment("gemini:usage:min:{$minute}:requests");
    }
}

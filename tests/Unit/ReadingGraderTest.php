<?php

namespace Tests\Unit;

use App\Services\Reading\ReadingGrader;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReadingGraderTest extends TestCase
{
    private string $passage = 'Urban farming is the practice of cultivating food in cities.';

    private array $questions = [
        [
            'question_id'   => 1,
            'position'      => 1,
            'question_text' => 'What is urban farming?',
            'model_answer'  => 'Cultivating food in cities',
            'user_answer'   => 'Growing food in urban areas',
        ],
    ];

    // ── Stub driver (default in tests via phpunit.xml) ────────────────────────

    public function test_grade_with_stub_returns_score_out_of_100(): void
    {
        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $this->questions);

        $this->assertGreaterThanOrEqual(0, $result->score);
        $this->assertLessThanOrEqual(100, $result->score);
    }

    public function test_grade_with_stub_returns_feedback_for_each_question(): void
    {
        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $this->questions);

        $this->assertCount(count($this->questions), $result->questionFeedback);
    }

    public function test_grade_with_stub_feedback_has_expected_keys(): void
    {
        $grader   = new ReadingGrader();
        $result   = $grader->grade($this->passage, $this->questions);
        $feedback = $result->questionFeedback[0];

        $this->assertArrayHasKey('question_id', $feedback);
        $this->assertArrayHasKey('score', $feedback);
        $this->assertArrayHasKey('correct', $feedback);
        $this->assertArrayHasKey('note', $feedback);
    }

    public function test_grade_with_stub_returns_overall_note(): void
    {
        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $this->questions);

        $this->assertNotEmpty($result->overallNote);
    }

    public function test_grade_with_multiple_questions_returns_all_feedback(): void
    {
        $questions = [
            ['question_id' => 1, 'position' => 1, 'question_text' => 'Q1?', 'model_answer' => 'A1', 'user_answer' => 'a1'],
            ['question_id' => 2, 'position' => 2, 'question_text' => 'Q2?', 'model_answer' => 'A2', 'user_answer' => 'a2'],
            ['question_id' => 3, 'position' => 3, 'question_text' => 'Q3?', 'model_answer' => 'A3', 'user_answer' => 'a3'],
        ];

        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $questions);

        $this->assertCount(3, $result->questionFeedback);
        $ids = array_column($result->questionFeedback, 'question_id');
        $this->assertContains(1, $ids);
        $this->assertContains(2, $ids);
        $this->assertContains(3, $ids);
    }

    public function test_grade_score_is_average_of_question_scores(): void
    {
        $questions = [
            ['question_id' => 1, 'position' => 1, 'question_text' => 'Q1?', 'model_answer' => 'A', 'user_answer' => 'a'],
            ['question_id' => 2, 'position' => 2, 'question_text' => 'Q2?', 'model_answer' => 'B', 'user_answer' => 'b'],
        ];

        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $questions);

        $individualScores = array_column($result->questionFeedback, 'score');
        $expectedAvg      = (int) round(array_sum($individualScores) / count($individualScores));

        $this->assertSame($expectedAvg, $result->score);
    }

    // ── Gemini driver path ────────────────────────────────────────────────────

    private function setDriver(string $driver): void
    {
        putenv("GRADING_DRIVER={$driver}");
        $_ENV['GRADING_DRIVER']    = $driver;
        $_SERVER['GRADING_DRIVER'] = $driver;
    }

    public function test_grade_calls_gemini_when_driver_is_gemini(): void
    {
        $this->setDriver('gemini');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode([
                    'candidates' => [[
                        'content' => ['parts' => [[
                            'text' => json_encode([
                                'score'             => 85,
                                'overall_note'      => 'Good comprehension.',
                                'question_feedback' => [[
                                    'question_id' => 1,
                                    'score'       => 85,
                                    'correct'     => true,
                                    'note'        => 'Correct — similar meaning.',
                                ]],
                            ]),
                        ]]],
                    ]],
                ])
            ),
        ]);

        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $this->questions);

        $this->assertSame(85, $result->score);
        $this->assertSame('Good comprehension.', $result->overallNote);

        $this->setDriver('stub'); // restore
    }

    public function test_grade_falls_back_to_stub_when_gemini_returns_error(): void
    {
        putenv('GRADING_DRIVER=gemini');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response('Server Error', 500),
        ]);

        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $this->questions);

        // Falls back to stub — score is still valid
        $this->assertGreaterThanOrEqual(0, $result->score);
        $this->assertLessThanOrEqual(100, $result->score);

        putenv('GRADING_DRIVER=stub');
    }

    public function test_grade_falls_back_to_stub_when_gemini_returns_invalid_json(): void
    {
        putenv('GRADING_DRIVER=gemini');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode([
                    'candidates' => [[
                        'content' => ['parts' => [['text' => 'not valid json']]],
                    ]],
                ])
            ),
        ]);

        $grader = new ReadingGrader();
        $result = $grader->grade($this->passage, $this->questions);

        $this->assertGreaterThanOrEqual(0, $result->score);
        $this->assertNotEmpty($result->questionFeedback);

        putenv('GRADING_DRIVER=stub');
    }
}

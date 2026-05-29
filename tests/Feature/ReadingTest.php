<?php

namespace Tests\Feature;

use App\Models\ReadingPassage;
use App\Models\ReadingQuestion;
use App\Models\ReadingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReadingTest extends TestCase
{
    use RefreshDatabase;

    private function makePassage(array $attrs = []): ReadingPassage
    {
        return ReadingPassage::create(array_merge([
            'title'      => 'Urban Farming',
            'body'       => 'Urban farming is the practice of growing food in cities.',
            'level'      => 'b2',
            'topic'      => 'environment',
            'word_count' => 10,
        ], $attrs));
    }

    private function makeQuestion(ReadingPassage $passage, int $pos = 1): ReadingQuestion
    {
        return ReadingQuestion::create([
            'passage_id'    => $passage->id,
            'position'      => $pos,
            'question_text' => 'What is urban farming?',
            'model_answer'  => 'Growing food in cities',
        ]);
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_reading_index(): void
    {
        $this->get('/reading')->assertRedirect('/login');
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_reading_index_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/reading')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Reading/Index'));
    }

    public function test_reading_index_lists_passages(): void
    {
        $user = User::factory()->create();
        $this->makePassage(['title' => 'Space Travel']);

        $this->actingAs($user)
            ->get('/reading')
            ->assertInertia(fn ($p) => $p
                ->component('Reading/Index')
                ->has('passages', 1)
                ->where('passages.0.title', 'Space Travel')
            );
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_reading_show_renders_with_questions(): void
    {
        $user    = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $this->actingAs($user)
            ->get("/reading/{$passage->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Reading/Show')
                ->has('passage')
                ->has('questions', 1)
            );
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_user_can_submit_reading_answers(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => json_encode([
                    'score'             => 1,
                    'question_feedback' => [['question_id' => 1, 'correct' => true, 'feedback' => 'Correct.']],
                    'overall_note'      => 'Well done.',
                ])]]]]]])
            ),
        ]);

        $user     = User::factory()->create();
        $passage  = $this->makePassage();
        $question = $this->makeQuestion($passage);

        $this->actingAs($user)
            ->post("/reading/{$passage->id}", [
                'started_at' => now()->subMinutes(15)->timestamp * 1000,
                'answers'    => [['question_id' => $question->id, 'answer' => 'Growing food in cities']],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reading_sessions', [
            'user_id'    => $user->id,
            'passage_id' => $passage->id,
            'status'     => 'graded',
        ]);
    }

    public function test_answers_are_required(): void
    {
        $user    = User::factory()->create();
        $passage = $this->makePassage();

        $this->actingAs($user)
            ->post("/reading/{$passage->id}", ['started_at' => now()->timestamp * 1000])
            ->assertSessionHasErrors('answers');
    }

    // ── Session ───────────────────────────────────────────────────────────────

    public function test_session_feedback_renders(): void
    {
        $user     = User::factory()->create();
        $passage  = $this->makePassage();
        $question = $this->makeQuestion($passage);

        $session = ReadingSession::create([
            'user_id'            => $user->id,
            'passage_id'         => $passage->id,
            'status'             => 'graded',
            'answers'            => [['question_id' => $question->id, 'answer' => 'cities']],
            'score'              => 1,
            'question_feedback'  => [['question_id' => $question->id, 'correct' => true, 'feedback' => 'Good']],
            'overall_note'       => 'Good attempt.',
            'time_taken_seconds' => 600,
            'started_at'         => now()->subMinutes(10),
            'graded_at'          => now(),
        ]);

        $this->actingAs($user)
            ->get("/reading/sessions/{$session->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Reading/Feedback'));
    }

    public function test_user_cannot_view_another_users_session(): void
    {
        $user    = User::factory()->create();
        $other   = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $session = ReadingSession::create([
            'user_id'            => $other->id,
            'passage_id'         => $passage->id,
            'status'             => 'graded',
            'answers'            => [],
            'score'              => 0,
            'question_feedback'  => [],
            'overall_note'       => '',
            'time_taken_seconds' => 0,
            'started_at'         => now(),
            'graded_at'          => now(),
        ]);

        $this->actingAs($user)
            ->get("/reading/sessions/{$session->id}")
            ->assertForbidden();
    }

    // ── Sample ────────────────────────────────────────────────────────────────

    public function test_sample_answers_returns_text(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => 'Q1: Growing food in cities']]]]]])
            ),
        ]);

        $user    = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $this->actingAs($user)
            ->postJson("/reading/{$passage->id}/sample")
            ->assertOk()
            ->assertJsonStructure(['text']);
    }
}

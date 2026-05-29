<?php

namespace Tests\Feature;

use App\Models\ListeningPassage;
use App\Models\ListeningQuestion;
use App\Models\ListeningSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ListeningTest extends TestCase
{
    use RefreshDatabase;

    private function makePassage(array $attrs = []): ListeningPassage
    {
        return ListeningPassage::create(array_merge([
            'title'        => 'Climate Change',
            'audio_script' => 'Scientists warn that temperatures are rising globally.',
            'topic'        => 'environment',
            'level'        => 'b2',
            'word_count'   => 9,
        ], $attrs));
    }

    private function makeQuestion(ListeningPassage $passage, int $pos = 1): ListeningQuestion
    {
        return ListeningQuestion::create([
            'passage_id'    => $passage->id,
            'position'      => $pos,
            'question_text' => 'What are scientists warning about?',
            'model_answer'  => 'Rising global temperatures',
        ]);
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_listening_index(): void
    {
        $this->get('/listening')->assertRedirect('/login');
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_listening_index_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/listening')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Listening/Index'));
    }

    public function test_listening_index_lists_passages(): void
    {
        $user = User::factory()->create();
        $this->makePassage(['title' => 'Ocean Life']);

        $this->actingAs($user)
            ->get('/listening')
            ->assertInertia(fn ($p) => $p
                ->component('Listening/Index')
                ->has('passages', 1)
                ->where('passages.0.title', 'Ocean Life')
            );
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_listening_show_renders(): void
    {
        $user    = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $this->actingAs($user)
            ->get("/listening/{$passage->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Listening/Show')
                ->has('passage')
                ->has('questions', 1)
            );
    }

    // ── Store (submit answers) ────────────────────────────────────────────────

    public function test_user_can_submit_answers(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => json_encode([
                    'score'            => 1,
                    'question_feedback'=> [['question_id' => 1, 'correct' => true, 'feedback' => 'Good']],
                    'overall_note'     => 'Well done.',
                ])]]]]]])
            ),
        ]);

        $user     = User::factory()->create();
        $passage  = $this->makePassage();
        $question = $this->makeQuestion($passage);

        $this->actingAs($user)
            ->post("/listening/{$passage->id}", [
                'started_at' => now()->subMinutes(10)->timestamp * 1000,
                'answers'    => [['question_id' => $question->id, 'answer' => 'Rising temperatures']],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('listening_sessions', [
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
            ->post("/listening/{$passage->id}", ['started_at' => now()->timestamp * 1000])
            ->assertSessionHasErrors('answers');
    }

    // ── Audio endpoint ────────────────────────────────────────────────────────

    public function test_audio_endpoint_returns_503_when_tts_not_configured(): void
    {
        config(['services.elevenlabs.key' => '']);

        $user    = User::factory()->create();
        $passage = $this->makePassage();

        $this->actingAs($user)
            ->get("/listening/{$passage->id}/audio")
            ->assertStatus(503);
    }

    // ── Session feedback ──────────────────────────────────────────────────────

    public function test_session_feedback_page_renders(): void
    {
        $user    = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $session = ListeningSession::create([
            'user_id'            => $user->id,
            'passage_id'         => $passage->id,
            'status'             => 'graded',
            'answers'            => [],
            'score'              => 1,
            'question_feedback'  => [],
            'overall_note'       => 'Good.',
            'time_taken_seconds' => 300,
            'started_at'         => now()->subMinutes(5),
            'graded_at'          => now(),
        ]);

        $this->actingAs($user)
            ->get("/listening/sessions/{$session->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Listening/Feedback'));
    }

    public function test_user_cannot_view_another_users_session(): void
    {
        $user    = User::factory()->create();
        $other   = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $session = ListeningSession::create([
            'user_id'            => $other->id,
            'passage_id'         => $passage->id,
            'status'             => 'graded',
            'answers'            => [],
            'score'              => 1,
            'question_feedback'  => [],
            'overall_note'       => '',
            'time_taken_seconds' => 0,
            'started_at'         => now(),
            'graded_at'          => now(),
        ]);

        $this->actingAs($user)
            ->get("/listening/sessions/{$session->id}")
            ->assertForbidden();
    }

    // ── Sample answers ────────────────────────────────────────────────────────

    public function test_sample_answers_endpoint_returns_text(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => 'Q1: Rising temperatures']]]]]])
            ),
        ]);

        $user    = User::factory()->create();
        $passage = $this->makePassage();
        $this->makeQuestion($passage);

        $this->actingAs($user)
            ->postJson("/listening/{$passage->id}/sample")
            ->assertOk()
            ->assertJsonStructure(['text']);
    }
}

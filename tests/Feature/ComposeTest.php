<?php

namespace Tests\Feature;

use App\Models\Prompt;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComposeTest extends TestCase
{
    use RefreshDatabase;

    private function makePrompt(array $attrs = []): Prompt
    {
        return Prompt::create(array_merge([
            'text'             => 'Some countries are increasing their use of surveillance cameras. Discuss the advantages and disadvantages.',
            'level'            => 'b2',
            'task_type'        => 'task2',
            'duration_minutes' => 40,
            'focus_category'   => 'coherence',
        ], $attrs));
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_compose(): void
    {
        $this->get('/compose')->assertRedirect('/login');
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_compose_page_renders(): void
    {
        $user = User::factory()->create();
        $this->makePrompt();

        $this->actingAs($user)
            ->get('/compose')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Compose'));
    }

    // ── Store (submit essay) ──────────────────────────────────────────────────

    public function test_user_can_submit_an_essay(): void
    {
        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        // min:40 chars required
        $essay = str_repeat('This is a test sentence for grading. ', 10);

        $this->actingAs($user)
            ->post('/compose', [
                'prompt_id' => $prompt->id,
                'text'      => $essay,
            ])
            // Controller renders Grading page inline (200), not redirect
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Grading'));

        $this->assertDatabaseHas('submissions', [
            'user_id'   => $user->id,
            'prompt_id' => $prompt->id,
        ]);
    }

    public function test_essay_shorter_than_40_chars_is_rejected(): void
    {
        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        $this->actingAs($user)
            ->post('/compose', ['prompt_id' => $prompt->id, 'text' => 'Too short.'])
            ->assertSessionHasErrors('text');
    }

    public function test_prompt_id_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/compose', ['text' => str_repeat('Long enough text. ', 5)])
            ->assertSessionHasErrors('prompt_id');
    }

    // ── Draft ─────────────────────────────────────────────────────────────────

    public function test_draft_can_be_saved(): void
    {
        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        // saveDraft returns back() — expects redirect
        $this->actingAs($user)
            ->post('/compose/draft', [
                'prompt_id' => $prompt->id,
                'text'      => 'Draft content so far...',
            ])
            ->assertRedirect();
    }

    // ── Submissions index ─────────────────────────────────────────────────────

    public function test_submissions_index_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/submissions')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Submissions'));
    }

    // ── Submission feedback ───────────────────────────────────────────────────

    public function test_submission_feedback_renders(): void
    {
        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        $submission = Submission::create([
            'user_id'          => $user->id,
            'prompt_id'        => $prompt->id,
            'text'             => 'My essay text here.',
            'status'           => 'graded',
            'score_grammar'    => 6.0,
            'score_vocabulary' => 6.5,
            'score_coherence'  => 6.0,
            'score_task'       => 6.5,
            'dimension_notes'  => [],
            'headline'         => 'Good attempt.',
            'vocab_examples'   => [],
            'submitted_at'     => now()->subMinutes(5),
            'graded_at'        => now(),
        ]);

        $this->actingAs($user)
            ->get("/submissions/{$submission->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Feedback'));
    }

    // SubmissionController uses findOrFail with user scope → 404 (not 403)
    public function test_user_cannot_view_another_users_submission(): void
    {
        $user   = User::factory()->create();
        $other  = User::factory()->create();
        $prompt = $this->makePrompt();

        $submission = Submission::create([
            'user_id'          => $other->id,
            'prompt_id'        => $prompt->id,
            'text'             => 'Their essay.',
            'status'           => 'graded',
            'score_grammar'    => 5.5,
            'score_vocabulary' => 5.5,
            'score_coherence'  => 5.5,
            'score_task'       => 5.5,
            'dimension_notes'  => [],
            'headline'         => '',
            'vocab_examples'   => [],
            'submitted_at'     => now(),
            'graded_at'        => now(),
        ]);

        $this->actingAs($user)
            ->get("/submissions/{$submission->id}")
            ->assertNotFound();
    }

    // ── Status polling ────────────────────────────────────────────────────────

    public function test_status_endpoint_returns_grading_state(): void
    {
        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        $submission = Submission::create([
            'user_id'          => $user->id,
            'prompt_id'        => $prompt->id,
            'text'             => 'Essay text.',
            'status'           => 'graded',
            'score_grammar'    => 6.0,
            'score_vocabulary' => 6.0,
            'score_coherence'  => 6.0,
            'score_task'       => 6.0,
            'dimension_notes'  => [],
            'headline'         => '',
            'vocab_examples'   => [],
            'submitted_at'     => now(),
            'graded_at'        => now(),
        ]);

        $this->actingAs($user)
            ->getJson("/submissions/{$submission->id}/status")
            ->assertOk()
            ->assertJsonFragment(['status' => 'graded']);
    }
}

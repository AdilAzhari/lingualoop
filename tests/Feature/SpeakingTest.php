<?php

namespace Tests\Feature;

use App\Models\SpeakingPrompt;
use App\Models\SpeakingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SpeakingTest extends TestCase
{
    use RefreshDatabase;

    private function makePrompt(array $attrs = []): SpeakingPrompt
    {
        return SpeakingPrompt::create(array_merge([
            'text'           => 'Describe a time you faced a challenge.',
            'cue_points'     => ['what the challenge was', 'how you dealt with it', 'what you learned'],
            'topic'          => 'personal experience',
            'level'          => 'b2',
            'target_seconds' => 120,
        ], $attrs));
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_speaking_index(): void
    {
        $this->get('/speaking')->assertRedirect('/login');
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_speaking_index_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/speaking')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Speaking/Index'));
    }

    public function test_speaking_index_lists_prompts(): void
    {
        $user = User::factory()->create();
        $this->makePrompt(['topic' => 'travel']);

        $this->actingAs($user)
            ->get('/speaking')
            ->assertInertia(fn ($p) => $p
                ->component('Speaking/Index')
                ->has('prompts', 1)
            );
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_speaking_show_renders(): void
    {
        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        $this->actingAs($user)
            ->get("/speaking/{$prompt->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('Speaking/Show')
                ->has('prompt')
            );
    }

    // ── Store (audio upload) ──────────────────────────────────────────────────

    public function test_user_can_upload_audio_for_grading(): void
    {
        Storage::fake('local');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => json_encode([
                    'transcript'       => 'I faced a challenge at work last year.',
                    'score_fluency'    => 6.5,
                    'score_vocabulary' => 6.0,
                    'score_grammar'    => 6.5,
                    'score_pronunciation' => 6.0,
                    'dimension_notes'  => [],
                    'headline'         => 'Competent speaker.',
                    'overall_note'     => 'Good effort.',
                ])]]]]]])
            ),
        ]);

        $user   = User::factory()->create();
        $prompt = $this->makePrompt();
        $file   = UploadedFile::fake()->create('recording.webm', 50, 'audio/webm');

        $this->actingAs($user)
            ->post("/speaking/{$prompt->id}", [
                'audio'            => $file,
                'duration_seconds' => 90,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('speaking_sessions', [
            'user_id'   => $user->id,
            'prompt_id' => $prompt->id,
        ]);
    }

    // ── Session feedback ──────────────────────────────────────────────────────

    public function test_session_feedback_renders(): void
    {
        Storage::fake('local');

        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        $session = SpeakingSession::create([
            'user_id'              => $user->id,
            'prompt_id'            => $prompt->id,
            'status'               => 'graded',
            'audio_path'           => 'speaking/test.webm',
            'audio_mime'           => 'audio/webm',
            'transcript'           => 'I faced a challenge.',
            'score_fluency'        => 6.0,
            'score_vocabulary'     => 6.0,
            'score_grammar'        => 6.0,
            'score_pronunciation'  => 6.0,
            'dimension_notes'      => [],
            'headline'             => 'Competent.',
            'overall_note'         => 'Good.',
            'duration_seconds'     => 90,
            'graded_at'            => now(),
        ]);

        $this->actingAs($user)
            ->get("/speaking/sessions/{$session->id}")
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Speaking/Feedback'));
    }

    public function test_user_cannot_view_another_users_session(): void
    {
        Storage::fake('local');

        $user   = User::factory()->create();
        $other  = User::factory()->create();
        $prompt = $this->makePrompt();

        $session = SpeakingSession::create([
            'user_id'             => $other->id,
            'prompt_id'           => $prompt->id,
            'status'              => 'graded',
            'audio_path'          => 'speaking/test.webm',
            'audio_mime'          => 'audio/webm',
            'transcript'          => '',
            'score_fluency'       => 5.0,
            'score_vocabulary'    => 5.0,
            'score_grammar'       => 5.0,
            'score_pronunciation' => 5.0,
            'dimension_notes'     => [],
            'headline'            => '',
            'overall_note'        => '',
            'duration_seconds'    => 60,
            'graded_at'           => now(),
        ]);

        $this->actingAs($user)
            ->get("/speaking/sessions/{$session->id}")
            ->assertForbidden();
    }

    // ── Sample ────────────────────────────────────────────────────────────────

    public function test_sample_response_returns_text(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => 'I faced a major challenge at university...']]]]]])
            ),
        ]);

        $user   = User::factory()->create();
        $prompt = $this->makePrompt();

        $this->actingAs($user)
            ->postJson("/speaking/{$prompt->id}/sample")
            ->assertOk()
            ->assertJsonStructure(['text']);
    }
}

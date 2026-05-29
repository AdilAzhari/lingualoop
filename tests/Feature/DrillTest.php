<?php

namespace Tests\Feature;

use App\Models\DrillCard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DrillTest extends TestCase
{
    use RefreshDatabase;

    private function makeCard(User $user, array $attrs = []): DrillCard
    {
        return DrillCard::create(array_merge([
            'user_id'       => $user->id,
            'type'          => 'mcq',
            'prompt'        => 'Which word correctly fills the gap: "She was ___ about the outcome."',
            'options'       => ['optimistic', 'optomistic', 'optimistik', 'optomistik'],
            'correct_index' => 0,
            'note'          => 'Correct spelling is "optimistic".',
            'state'         => 'new',
            'stability'     => 1.0,
            'difficulty'    => 5.0,
            'due_at'        => now()->subMinute(),
        ], $attrs));
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_drill(): void
    {
        $this->get('/drill')->assertRedirect('/login');
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_drill_index_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/drill')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Drill/Index'));
    }

    public function test_drill_index_shows_due_db_cards_when_present(): void
    {
        $user = User::factory()->create();
        $this->makeCard($user, ['due_at' => now()->subHour()]);
        $this->makeCard($user, ['due_at' => now()->subHour()]);

        // With due cards in DB, the controller returns DB cards (not stubs)
        $this->actingAs($user)
            ->get('/drill')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->has('cards', 2));
    }

    public function test_drill_index_returns_stub_cards_when_user_has_none(): void
    {
        $user = User::factory()->create();

        // No DB cards → falls back to StubContent::drillCards() (5 cards)
        $this->actingAs($user)
            ->get('/drill')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->has('cards', 5));
    }

    // ── Answer ────────────────────────────────────────────────────────────────

    public function test_user_can_answer_a_card(): void
    {
        $user = User::factory()->create();
        $card = $this->makeCard($user);

        $this->actingAs($user)
            ->post("/drill/{$card->id}/answer", [
                'session_id'   => 'test-session-uuid',
                'chosen_index' => 0,
                'correct'      => true,
            ])
            ->assertRedirect();
    }

    public function test_answering_with_invalid_chosen_index_fails_validation(): void
    {
        $user = User::factory()->create();
        $card = $this->makeCard($user);

        $this->actingAs($user)
            ->post("/drill/{$card->id}/answer", [
                'session_id'   => 'test-uuid',
                'chosen_index' => 9, // out of range 0-3
                'correct'      => true,
            ])
            ->assertSessionHasErrors('chosen_index');
    }

    public function test_answering_correctly_updates_card_state(): void
    {
        $user = User::factory()->create();
        $card = $this->makeCard($user, ['state' => 'new']);

        $this->actingAs($user)
            ->post("/drill/{$card->id}/answer", [
                'session_id'   => 'test-uuid',
                'chosen_index' => 0,
                'correct'      => true,
            ])
            ->assertRedirect();

        $card->refresh();
        $this->assertNotNull($card->last_reviewed_at);
    }

    // DrillController silently skips another user's card (no 403) — returns back()
    public function test_answering_another_users_card_is_silently_ignored(): void
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $card  = $this->makeCard($other);

        $this->actingAs($user)
            ->post("/drill/{$card->id}/answer", [
                'session_id'   => 'test-uuid',
                'chosen_index' => 0,
                'correct'      => true,
            ])
            ->assertRedirect();

        // The other user's card is unchanged
        $card->refresh();
        $this->assertNull($card->last_reviewed_at);
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    public function test_drill_summary_renders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/drill/summary')
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Drill/Summary'));
    }
}

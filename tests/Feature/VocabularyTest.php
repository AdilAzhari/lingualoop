<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VocabularyEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VocabularyTest extends TestCase
{
    use RefreshDatabase;

    // ── Auth guard ────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_from_vocabulary(): void
    {
        $this->get('/vocabulary')->assertRedirect('/login');
    }

    public function test_guests_cannot_add_a_word(): void
    {
        $this->post('/vocabulary', ['word' => 'ubiquitous'])->assertRedirect('/login');
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_vocabulary_index_renders_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/vocabulary')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Vocabulary'));
    }

    public function test_vocabulary_index_includes_user_entries(): void
    {
        $user = User::factory()->create();
        VocabularyEntry::create([
            'user_id'    => $user->id,
            'word'       => 'tenacious',
            'definition' => 'holding firm',
            'source'     => 'manual',
        ]);

        $this->actingAs($user)
            ->get('/vocabulary')
            ->assertInertia(fn ($page) => $page
                ->component('Vocabulary')
                ->has('entries', 1)
                ->where('entries.0.word', 'tenacious')
            );
    }

    public function test_vocabulary_index_does_not_include_other_users_entries(): void
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        VocabularyEntry::create(['user_id' => $other->id, 'word' => 'other', 'source' => 'manual']);

        $this->actingAs($user)
            ->get('/vocabulary')
            ->assertInertia(fn ($page) => $page->has('entries', 0));
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_user_can_add_a_word(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/vocabulary', ['word' => 'ubiquitous'])
            ->assertRedirect();

        $this->assertDatabaseHas('vocabulary_entries', [
            'user_id' => $user->id,
            'word'    => 'ubiquitous',
        ]);
    }

    public function test_adding_word_with_all_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/vocabulary', [
            'word'       => 'resilient',
            'definition' => 'able to recover quickly',
            'example'    => 'She is resilient in the face of adversity.',
            'level'      => 'b2',
        ])->assertRedirect();

        $this->assertDatabaseHas('vocabulary_entries', [
            'user_id'    => $user->id,
            'word'       => 'resilient',
            'definition' => 'able to recover quickly',
            'level'      => 'b2',
        ]);
    }

    public function test_word_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/vocabulary', ['word' => ''])
            ->assertSessionHasErrors('word');
    }

    public function test_level_must_be_valid_cefr(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/vocabulary', ['word' => 'test', 'level' => 'x9'])
            ->assertSessionHasErrors('level');
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_user_can_update_their_entry(): void
    {
        $user  = User::factory()->create();
        $entry = VocabularyEntry::create(['user_id' => $user->id, 'word' => 'apt', 'source' => 'manual']);

        $this->actingAs($user)
            ->put("/vocabulary/{$entry->id}", ['definition' => 'appropriate', 'level' => 'b1'])
            ->assertRedirect();

        $this->assertDatabaseHas('vocabulary_entries', [
            'id'         => $entry->id,
            'definition' => 'appropriate',
            'level'      => 'b1',
        ]);
    }

    public function test_user_cannot_update_another_users_entry(): void
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $entry = VocabularyEntry::create(['user_id' => $other->id, 'word' => 'apt', 'source' => 'manual']);

        $this->actingAs($user)
            ->put("/vocabulary/{$entry->id}", ['definition' => 'hacked'])
            ->assertForbidden();
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function test_user_can_delete_their_entry(): void
    {
        $user  = User::factory()->create();
        $entry = VocabularyEntry::create(['user_id' => $user->id, 'word' => 'delete-me', 'source' => 'manual']);

        $this->actingAs($user)
            ->delete("/vocabulary/{$entry->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('vocabulary_entries', ['id' => $entry->id]);
    }

    public function test_user_cannot_delete_another_users_entry(): void
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $entry = VocabularyEntry::create(['user_id' => $other->id, 'word' => 'safe', 'source' => 'manual']);

        $this->actingAs($user)
            ->delete("/vocabulary/{$entry->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('vocabulary_entries', ['id' => $entry->id]);
    }

    // ── Suggest ───────────────────────────────────────────────────────────────

    public function test_suggest_requires_authentication(): void
    {
        // JSON request → 401 (not redirect); form request would redirect
        $this->postJson('/vocabulary/suggest', ['word' => 'test'])->assertUnauthorized();
    }

    public function test_suggest_returns_example_and_level(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(
                json_encode(['candidates' => [['content' => ['parts' => [['text' => '{"example":"The tenacious athlete refused to quit.","level":"c1"}']]]]]])
            ),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/vocabulary/suggest', ['word' => 'tenacious'])
            ->assertOk()
            ->assertJsonStructure(['example', 'level']);

        $this->assertContains($response->json('level'), ['a2', 'b1', 'b2', 'c1', 'c2', null]);
    }

    public function test_suggest_returns_nulls_gracefully_on_gemini_failure(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response('server error', 500),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/vocabulary/suggest', ['word' => 'obscure'])
            ->assertOk()
            ->assertJson(['example' => null, 'level' => null]);
    }

    public function test_suggest_requires_word(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/vocabulary/suggest', ['word' => ''])
            ->assertUnprocessable();
    }
}

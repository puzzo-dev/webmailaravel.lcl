<?php

namespace Tests\Feature;

use App\Models\Sender;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SenderAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithSubscription(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['role' => 'user'], $overrides));
        Subscription::factory()->create(['user_id' => $user->id]);
        return $user;
    }

    public function test_authenticated_users_can_list_their_senders(): void
    {
        $user = $this->createUserWithSubscription();
        Sender::factory()->count(3)->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user, 'api')->getJson('/api/senders');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_users_cannot_list_senders(): void
    {
        $response = $this->getJson('/api/senders');

        $response->assertStatus(401);
    }

    public function test_users_can_view_their_own_sender(): void
    {
        $user = $this->createUserWithSubscription();
        $sender = Sender::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user, 'api')->getJson("/api/senders/{$sender->id}");

        $response->assertStatus(200);
    }

    public function test_users_cannot_view_other_users_senders(): void
    {
        $owner = $this->createUserWithSubscription();
        $otherUser = $this->createUserWithSubscription();
        $sender = Sender::factory()->create([
            'user_id' => $owner->id,
        ]);

        $response = $this->actingAs($otherUser, 'api')->getJson("/api/senders/{$sender->id}");

        $response->assertStatus(403);
    }

    public function test_users_can_delete_their_own_sender(): void
    {
        $user = $this->createUserWithSubscription();
        $sender = Sender::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user, 'api')->deleteJson("/api/senders/{$sender->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('senders', ['id' => $sender->id]);
    }

    public function test_users_cannot_delete_other_users_senders(): void
    {
        $owner = $this->createUserWithSubscription();
        $otherUser = $this->createUserWithSubscription();
        $sender = Sender::factory()->create([
            'user_id' => $owner->id,
        ]);

        $response = $this->actingAs($otherUser, 'api')->deleteJson("/api/senders/{$sender->id}");

        $response->assertStatus(403);
    }

    public function test_admins_can_view_any_sender(): void
    {
        $owner = $this->createUserWithSubscription();
        $admin = User::factory()->admin()->create();
        $sender = Sender::factory()->create([
            'user_id' => $owner->id,
        ]);

        $response = $this->actingAs($admin, 'api')->getJson("/api/senders/{$sender->id}");

        $response->assertStatus(200);
    }

    public function test_admins_can_delete_any_sender(): void
    {
        $owner = $this->createUserWithSubscription();
        $admin = User::factory()->admin()->create();
        $sender = Sender::factory()->create([
            'user_id' => $owner->id,
        ]);

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/senders/{$sender->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('senders', ['id' => $sender->id]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithSubscription(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['role' => 'user'], $overrides));
        Subscription::factory()->create(['user_id' => $user->id]);
        return $user;
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/users');

        $response->assertStatus(200);
    }

    public function test_regular_users_cannot_list_users(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_users_cannot_list_users(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertStatus(401);
    }

    public function test_admin_can_view_any_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($admin, 'api')->getJson('/api/users/' . $user->id);

        $response->assertStatus(200);
    }

    public function test_admin_can_update_any_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($admin, 'api')->putJson('/api/users/' . $user->id, [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_admin_can_delete_other_users(): void
    {
        $admin = User::factory()->admin()->create();
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/users/' . $user->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/users/' . $admin->id);

        $response->assertStatus(403);
    }

    public function test_users_can_get_their_own_profile(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/user/profile');

        $response->assertStatus(200);
    }

    public function test_users_can_update_their_own_profile(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->putJson('/api/user/profile', [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_users_can_get_their_settings(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/user/settings');

        $response->assertStatus(200);
    }

    public function test_users_can_get_their_devices(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/user/devices');

        $response->assertStatus(200);
    }

    public function test_users_can_get_their_sessions(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/user/sessions');

        $response->assertStatus(200);
    }

    public function test_users_can_get_their_activities(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/user/activities');

        $response->assertStatus(200);
    }
}

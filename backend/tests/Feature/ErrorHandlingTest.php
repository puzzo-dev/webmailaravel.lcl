<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithSubscription(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['role' => 'user'], $overrides));
        Subscription::factory()->create(['user_id' => $user->id]);
        return $user;
    }

    public function test_not_found_returns_404(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/campaigns/999999');

        $response->assertStatus(404);
    }

    public function test_validation_errors_return_422(): void
    {
        $user = $this->createUserWithSubscription();

        // Use sender creation which requires validation and is not admin-only
        $response = $this->actingAs($user, 'api')->postJson('/api/senders', [
            'name' => '',
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422);
    }

    public function test_unauthorized_access_returns_401(): void
    {
        $response = $this->getJson('/api/campaigns');

        $response->assertStatus(401);
    }

    public function test_forbidden_access_returns_403(): void
    {
        $owner = $this->createUserWithSubscription();
        $otherUser = $this->createUserWithSubscription();
        $campaign = \App\Models\Campaign::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherUser, 'api')->getJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(403);
    }

    public function test_admin_only_endpoints_return_403_for_regular_users(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_only_endpoints_return_200_for_admins(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_system_status_requires_admin(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/system-status');

        $response->assertStatus(403);
    }

    public function test_system_status_works_for_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/system-status');

        $response->assertStatus(200);
    }

    public function test_error_responses_do_not_expose_raw_exception_messages(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/campaigns/999999');

        $response->assertStatus(404);
        $content = $response->json();
        $this->assertArrayNotHasKey('exception', $content);
        $this->assertArrayNotHasKey('trace', $content);
        $this->assertArrayNotHasKey('file', $content);
        $this->assertArrayNotHasKey('line', $content);
    }
}

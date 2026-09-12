<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithSubscription(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['role' => 'user'], $overrides));
        Subscription::factory()->create(['user_id' => $user->id]);
        return $user;
    }

    public function test_authenticated_users_can_list_their_subscriptions(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/billing/subscriptions');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_users_cannot_list_subscriptions(): void
    {
        $response = $this->getJson('/api/billing/subscriptions');

        $response->assertStatus(401);
    }

    public function test_users_can_view_their_own_subscription(): void
    {
        $user = $this->createUserWithSubscription();
        $subscription = Subscription::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'api')->getJson("/api/billing/subscriptions/{$subscription->id}");

        $response->assertStatus(200);
    }

    public function test_users_cannot_view_other_users_subscriptions(): void
    {
        $owner = $this->createUserWithSubscription();
        $otherUser = $this->createUserWithSubscription();
        $subscription = Subscription::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherUser, 'api')->getJson("/api/billing/subscriptions/{$subscription->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_view_any_subscription(): void
    {
        $owner = $this->createUserWithSubscription();
        $admin = User::factory()->admin()->create();
        $subscription = Subscription::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($admin, 'api')->getJson("/api/billing/subscriptions/{$subscription->id}");

        $response->assertStatus(200);
    }

    public function test_anyone_can_view_plans(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/billing/plans');

        $response->assertStatus(200);
    }

    public function test_regular_users_cannot_access_admin_billing_stats(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/billing/stats');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_billing_stats(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/billing/stats');

        $response->assertStatus(200);
    }

    public function test_regular_users_cannot_access_all_subscriptions(): void
    {
        $user = $this->createUserWithSubscription();

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/billing/subscriptions');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_all_subscriptions(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/billing/subscriptions');

        $response->assertStatus(200);
    }
}

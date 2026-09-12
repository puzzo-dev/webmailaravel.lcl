<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithSubscription(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['role' => 'user'], $overrides));
        Subscription::factory()->create(['user_id' => $user->id]);
        return $user;
    }

    public function test_authenticated_users_can_list_their_campaigns(): void
    {
        $user = $this->createUserWithSubscription();
        Campaign::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'api')->getJson('/api/campaigns');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_users_cannot_list_campaigns(): void
    {
        $response = $this->getJson('/api/campaigns');

        $response->assertStatus(401);
    }

    public function test_users_cannot_access_other_users_campaigns(): void
    {
        $owner = $this->createUserWithSubscription();
        $otherUser = $this->createUserWithSubscription();
        $campaign = Campaign::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherUser, 'api')->getJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(403);
    }

    public function test_users_can_view_their_own_campaign(): void
    {
        $user = $this->createUserWithSubscription();
        $campaign = Campaign::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'api')->getJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(200);
    }

    public function test_users_can_delete_their_own_draft_campaign(): void
    {
        $user = $this->createUserWithSubscription();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($user, 'api')->deleteJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('campaigns', ['id' => $campaign->id]);
    }

    public function test_users_cannot_delete_running_campaigns(): void
    {
        $user = $this->createUserWithSubscription();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'status' => 'running',
        ]);

        $response = $this->actingAs($user, 'api')->deleteJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('campaigns', ['id' => $campaign->id]);
    }

    public function test_users_cannot_delete_other_users_campaigns(): void
    {
        $owner = $this->createUserWithSubscription();
        $otherUser = $this->createUserWithSubscription();
        $campaign = Campaign::factory()->create([
            'user_id' => $owner->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($otherUser, 'api')->deleteJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(403);
    }

    public function test_admins_can_delete_any_campaign(): void
    {
        $owner = $this->createUserWithSubscription();
        $admin = User::factory()->admin()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $owner->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/campaigns/{$campaign->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('campaigns', ['id' => $campaign->id]);
    }
}

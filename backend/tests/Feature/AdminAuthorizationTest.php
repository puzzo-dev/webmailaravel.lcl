<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_logs_routes(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/logs');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_logs_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/logs');

        $response->assertStatus(200);
    }

    public function test_non_admin_cannot_access_admin_system_settings(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/system-settings');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_system_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/system-settings');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_users_cannot_access_admin_routes(): void
    {
        $response = $this->getJson('/api/admin/logs');

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_access_powermta_routes(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user, 'api')->getJson('/api/admin/powermta/status');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_powermta_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'api')->getJson('/api/admin/powermta/status');

        $response->assertStatus(200);
    }
}

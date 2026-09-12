<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Auth/Login'));
    }

    public function test_register_page_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Auth/Register'));
    }

    public function test_users_can_login_with_email(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'identifier' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated('web');
        $response->assertRedirect('/dashboard');
    }

    public function test_users_can_login_with_username(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'identifier' => 'testuser',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated('web');
        $response->assertRedirect('/dashboard');
    }

    public function test_users_cannot_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'identifier' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest('web');
        $response->assertSessionHasErrors('auth');
    }

    public function test_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'username' => 'newuser',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertAuthenticated('web');
        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', [
            'email' => 'new@example.com',
            'username' => 'newuser',
        ]);
    }

    public function test_registration_requires_unique_email_and_username(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
            'username' => 'existing',
        ]);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'username' => 'existing',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasErrors(['email', 'username']);
        $this->assertGuest('web');
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->post('/logout');

        $this->assertGuest('web');
        $response->assertRedirect('/login');
    }

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_users_can_access_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard/Index'));
    }

    public function test_authenticated_users_are_redirected_from_login(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->get('/login');

        $response->assertRedirect('/dashboard');
    }
}

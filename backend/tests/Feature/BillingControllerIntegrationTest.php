<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Http\Controllers\BillingController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BillingControllerIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_billing_controller_loads_successfully()
    {
        $controller = new BillingController();
        $this->assertInstanceOf(BillingController::class, $controller);
    }

    public function test_billing_controller_has_http_methods()
    {
        $controller = new BillingController();
        
        // Use reflection to check if protected methods exist
        $reflection = new \ReflectionClass($controller);
        
        $this->assertTrue($reflection->hasMethod('get'));
        $this->assertTrue($reflection->hasMethod('post'));
        
        $getMethod = $reflection->getMethod('get');
        $postMethod = $reflection->getMethod('post');
        
        $this->assertTrue($getMethod->isProtected());
        $this->assertTrue($postMethod->isProtected());
    }

    public function test_billing_trait_methods_available()
    {
        $controller = new BillingController();
        
        // Check if trait methods are available
        $this->assertTrue(method_exists($controller, 'createBTCPayInvoice'));
        $this->assertTrue(method_exists($controller, 'createBTCPaySubscription'));
        $this->assertTrue(method_exists($controller, 'traitProcessManualPayment'));
    }

    public function test_billing_routes_exist()
    {
        // Test that billing routes are registered
        $routes = app('router')->getRoutes();
        $billingRoutes = collect($routes)->filter(function ($route) {
            return str_contains($route->uri(), 'billing');
        });
        
        $this->assertGreaterThan(0, $billingRoutes->count());
    }
}

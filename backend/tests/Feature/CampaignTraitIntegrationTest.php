<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\CampaignService;
use App\Services\UnifiedEmailSendingService;
use App\Http\Controllers\CampaignController;
use App\Traits\SuppressionListTrait;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;

class CampaignTraitIntegrationTest extends TestCase
{
    public function test_campaign_service_loads_successfully()
    {
        $service = new CampaignService();
        $this->assertInstanceOf(CampaignService::class, $service);
    }

    public function test_unified_email_service_loads_successfully()
    {
        $service = new UnifiedEmailSendingService();
        $this->assertInstanceOf(UnifiedEmailSendingService::class, $service);
    }

    public function test_campaign_controller_loads_successfully()
    {
        $campaignService = new CampaignService();
        $emailService = new UnifiedEmailSendingService();
        $controller = new CampaignController($campaignService, $emailService);
        $this->assertInstanceOf(CampaignController::class, $controller);
    }

    public function test_suppression_list_trait_methods_available()
    {
        $service = new class {
            use SuppressionListTrait;
            
            public function testMethod()
            {
                return method_exists($this, 'processFBLFile');
            }
        };

        $this->assertTrue($service->testMethod());
    }

    public function test_trait_dependencies_resolved()
    {
        // Test that traits with dependencies can be instantiated together
        $service = new class {
            use LoggingTrait, ValidationTrait, CacheManagementTrait, SuppressionListTrait;
            
            public function testTraitMethods()
            {
                return [
                    'logging' => method_exists($this, 'logInfo'),
                    'validation' => method_exists($this, 'validateEmail'),
                    'cache' => method_exists($this, 'getCachedData'),
                    'suppression' => method_exists($this, 'processFBLFile')
                ];
            }
        };

        $methods = $service->testTraitMethods();
        $this->assertTrue($methods['logging']);
        $this->assertTrue($methods['validation']);
        $this->assertTrue($methods['cache']);
        $this->assertTrue($methods['suppression']);
    }
}

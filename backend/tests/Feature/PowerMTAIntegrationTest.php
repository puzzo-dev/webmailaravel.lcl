<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\PowerMTAService;
use App\Models\Domain;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class PowerMTAIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock PowerMTA API responses
        Http::fake([
            '*/api/status' => Http::response([
                'status' => 'online',
                'version' => '4.5r17',
                'uptime' => '5 days, 3 hours'
            ], 200),
            
            '*/api/fbl/accounts' => Http::response([
                'accounts' => [
                    [
                        'domain' => 'example.com',
                        'fbl_count' => 15,
                        'last_updated' => '2025-01-15T10:00:00Z'
                    ]
                ]
            ], 200),
            
            '*/api/diagnostics/files' => Http::response([
                'files' => [
                    'diagnostic_2025-01-15.csv',
                    'diagnostic_2025-01-14.csv'
                ]
            ], 200),
            
            '*/api/diagnostics/download*' => Http::response(
                "date,domain,sent,bounces,complaints\n2025-01-15,example.com,1000,50,5\n2025-01-15,test.com,500,25,2",
                200
            ),
            
            '*/api/fbl/domain*' => Http::response([
                'domain' => 'example.com',
                'complaints' => 5,
                'date' => '2025-01-15'
            ], 200),
            
            '*/api/diagnostics/domain*' => Http::response([
                'domain' => 'example.com',
                'sent' => 1000,
                'bounces' => 50,
                'date' => '2025-01-15'
            ], 200)
        ]);
    }

    public function test_powermta_status_check()
    {
        $service = new PowerMTAService();
        $status = $service->getStatus();

        $this->assertEquals('online', $status['status']);
        $this->assertArrayHasKey('timestamp', $status);
    }

    public function test_fbl_accounts_retrieval()
    {
        $service = new PowerMTAService();
        $accounts = $service->getFBLAccounts();

        $this->assertTrue($accounts['success']);
        $this->assertArrayHasKey('data', $accounts);
        $this->assertArrayHasKey('accounts', $accounts['data']);
    }

    public function test_diagnostic_files_retrieval()
    {
        $service = new PowerMTAService();
        $files = $service->getDiagnosticFiles('2025-01-15');

        $this->assertTrue($files['success']);
        $this->assertEquals('2025-01-15', $files['date']);
        $this->assertArrayHasKey('data', $files);
    }

    public function test_diagnostic_file_parsing()
    {
        $service = new PowerMTAService();
        $parsed = $service->parseDiagnosticFile('diagnostic_2025-01-15.csv', '2025-01-15');

        $this->assertTrue($parsed['success']);
        $this->assertEquals('diagnostic_2025-01-15.csv', $parsed['filename']);
        $this->assertArrayHasKey('data', $parsed);
        $this->assertCount(2, $parsed['data']); // 2 rows in CSV
    }

    public function test_sender_reputation_analysis()
    {
        $service = new PowerMTAService();
        $analysis = $service->analyzeSenderReputation('example.com', '2025-01-15');

        $this->assertTrue($analysis['success']);
        $this->assertEquals('example.com', $analysis['sender_domain']);
        $this->assertArrayHasKey('reputation_metrics', $analysis);
        $this->assertArrayHasKey('reputation_score', $analysis['reputation_metrics']);
        $this->assertArrayHasKey('risk_level', $analysis['reputation_metrics']);
    }

    public function test_reputation_metrics_calculation()
    {
        $service = new PowerMTAService();
        $analysis = $service->analyzeSenderReputation('example.com', '2025-01-15');
        
        $metrics = $analysis['reputation_metrics'];
        
        $this->assertEquals(1000, $metrics['total_emails_sent']);
        $this->assertEquals(50, $metrics['total_bounces']);
        $this->assertEquals(5, $metrics['total_complaints']);
        $this->assertEquals(5.0, $metrics['bounce_rate']); // 50/1000 * 100
        $this->assertEquals(0.5, $metrics['complaint_rate']); // 5/1000 * 100
        $this->assertEquals(95.0, $metrics['delivery_rate']); // 100 - 5
        $this->assertGreaterThanOrEqual(0, $metrics['reputation_score']);
        $this->assertLessThanOrEqual(100, $metrics['reputation_score']);
        $this->assertContains($metrics['risk_level'], ['low', 'medium', 'high']);
    }

    public function test_powermta_configuration_management()
    {
        $service = new PowerMTAService();
        
        // Mock config response
        Http::fake([
            '*/api/config' => Http::response([
                'max_connections' => 100,
                'timeout' => 30
            ], 200)
        ]);
        
        $config = $service->getConfiguration();
        
        $this->assertTrue($config['success']);
        $this->assertArrayHasKey('data', $config);
    }
} 
 
 
 
 
 
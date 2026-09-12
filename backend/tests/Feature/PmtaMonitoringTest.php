<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Campaign;
use App\Models\Sender;
use App\Services\PmtaMonitoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PmtaMonitoringTest extends TestCase
{
    use RefreshDatabase;

    private string $testDataDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testDataDir = sys_get_temp_dir() . '/pmta-test-' . uniqid();

        // Create directory structure matching PMTA production
        mkdir($this->testDataDir . '/pmta-acct', 0777, true);
        mkdir($this->testDataDir . '/pmta-fbl', 0777, true);
        mkdir($this->testDataDir . '/pmta-diag', 0777, true);

        // Copy real production sample files
        $source = '/home/puzzo/codebase/EmailMarketingSaaS/SendActivities';
        if (file_exists($source . '/acct-2026-08-28-0000.csv')) {
            copy($source . '/acct-2026-08-28-0000.csv', $this->testDataDir . '/pmta-acct/acct-2026-08-28-0000.csv');
            copy($source . '/bounce-2026-08-28-0000.csv', $this->testDataDir . '/pmta-acct/bounce.csv');
            copy($source . '/diag-2026-08-28-0000.csv', $this->testDataDir . '/pmta-acct/diag.csv');
        }
    }

    protected function tearDown(): void
    {
        // Clean up test directory
        if (is_dir($this->testDataDir)) {
            $this->removeDirectory($this->testDataDir);
        }
        parent::tearDown();
    }

    private function removeDirectory(string $dir): void
    {
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    public function test_parser_extracts_custom_headers_from_real_production_data(): void
    {
        $file = $this->testDataDir . '/pmta-acct/acct-2026-08-28-0000.csv';
        if (!file_exists($file)) {
            $this->markTestSkipped('Production sample data not available');
        }

        // Parse the file directly (bypass project filter for this test)
        $content = file_get_contents($file);
        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');

        // Verify CSV has the custom header columns
        $this->assertContains('header_X-User-ID', $headers);
        $this->assertContains('header_X-Campaign-ID', $headers);
        $this->assertContains('header_X-SMTP-Config-ID', $headers);
        $this->assertContains('header_X-Sender-ID', $headers);

        // Parse first data record
        $firstDataLine = null;
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line !== '') {
                $firstDataLine = $line;
                break;
            }
        }
        $this->assertNotNull($firstDataLine);

        $row = str_getcsv($firstDataLine, ',', '"', '\\');
        $data = array_combine($headers, $row);

        // Verify the first record has the tracking headers
        $this->assertNotEmpty($data['header_X-User-ID']);
        $this->assertNotEmpty($data['header_X-Campaign-ID']);
        $this->assertNotEmpty($data['header_X-SMTP-Config-ID']);
        $this->assertNotEmpty($data['header_X-Sender-ID']);
    }

    public function test_parser_correctly_counts_delivered_records(): void
    {
        $file = $this->testDataDir . '/pmta-acct/acct-2026-08-28-0000.csv';
        if (!file_exists($file)) {
            $this->markTestSkipped('Production sample data not available');
        }

        $content = file_get_contents($file);
        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');

        $delivered = 0;
        $bounced = 0;
        $deferred = 0;
        $total = 0;
        $withUserId = 0;
        $withoutUserId = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            $row = str_getcsv($line, ',', '"', '\\');
            if (count($row) < count($headers)) continue;

            $data = array_combine($headers, $row);
            $total++;

            $userId = $data['header_X-User-ID'] ?? '';
            if (!empty($userId)) {
                $withUserId++;
            } else {
                $withoutUserId++;
            }

            $action = strtolower($data['dsnAction'] ?? '');
            $status = strtolower($data['dsnStatus'] ?? '');

            if ($action === 'relayed' || $action === 'delivered' || str_starts_with($status, '2.')) {
                $delivered++;
            } elseif ($action === 'failed' || str_starts_with($status, '5.')) {
                $bounced++;
            } elseif ($action === 'delayed' || str_starts_with($status, '4.')) {
                $deferred++;
            }
        }

        // The production sample has 671 records, all delivered (relayed)
        $this->assertGreaterThan(600, $total, 'Should have 600+ records');
        $this->assertGreaterThan(600, $delivered, 'Most should be delivered');
        $this->assertEquals(0, $bounced, 'No bounces in accounting file');

        // Some records have user_id (from EmailMarketingSaaS), some don't (other emails)
        $this->assertGreaterThan(0, $withUserId, 'Some records should have X-User-ID');
        $this->assertGreaterThan(0, $withoutUserId, 'Some records should lack X-User-ID (other projects)');
    }

    public function test_project_filter_excludes_records_from_other_projects(): void
    {
        $file = $this->testDataDir . '/pmta-acct/acct-2026-08-28-0000.csv';
        if (!file_exists($file)) {
            $this->markTestSkipped('Production sample data not available');
        }

        // Create a user with ID 2 (matching the production data's user_id)
        $user = User::factory()->create(['id' => 2]);

        // Create the monitoring service with test config
        $service = $this->createMonitoringService();

        // Use reflection to call parseAccountingFile
        $reflect = new \ReflectionClass($service);
        $method = $reflect->getMethod('parseAccountingFile');
        $method->setAccessible(true);

        $records = $method->invoke($service, $file);

        // Should only include records with user_id=2 (which exists in our DB)
        $this->assertGreaterThan(0, count($records), 'Should have records for user_id=2');

        foreach ($records as $record) {
            $this->assertEquals('2', (string)$record['user_id'], 'All records should belong to user_id=2');
        }
    }

    public function test_project_filter_excludes_all_records_when_no_users_match(): void
    {
        $file = $this->testDataDir . '/pmta-acct/acct-2026-08-28-0000.csv';
        if (!file_exists($file)) {
            $this->markTestSkipped('Production sample data not available');
        }

        // Create a user with ID 999 (NOT matching the production data's user_id=2)
        User::factory()->create(['id' => 999]);

        $service = $this->createMonitoringService();

        $reflect = new \ReflectionClass($service);
        $method = $reflect->getMethod('parseAccountingFile');
        $method->setAccessible(true);

        $records = $method->invoke($service, $file);

        // Should have 0 records since user_id=2 doesn't exist in our DB
        $this->assertEquals(0, count($records), 'No records should match when user_id=2 is not in DB');
    }

    public function test_project_filter_uses_project_id_when_present(): void
    {
        // Create a CSV with X-Project-ID column
        $csv = "type,timeLogged,orig,rcpt,dsnAction,dsnStatus,header_X-User-ID,header_X-Project-ID\n"
            . "d,2026-09-12 10:00:00,sender@webmailaravel.com,user@example.com,relayed,2.0.0,5,webmailaravel\n"
            . "d,2026-09-12 10:01:00,sender@emailsaas.com,user2@example.com,relayed,2.0.0,5,emailmarketing\n"
            . "d,2026-09-12 10:02:00,sender@unknown.com,user3@example.com,relayed,2.0.0,3,\n";

        $file = $this->testDataDir . '/pmta-acct/test-project-id.csv';
        file_put_contents($file, $csv);

        // Create users with id=3 and id=5 (matching the test records)
        User::factory()->create(['id' => 3]);
        User::factory()->create(['id' => 5]);

        $service = $this->createMonitoringService();

        $reflect = new \ReflectionClass($service);
        $method = $reflect->getMethod('parseAccountingFile');
        $method->setAccessible(true);

        $records = $method->invoke($service, $file);

        // Should only include the record with project_id=webmailaravel
        // The second record (project_id=emailmarketing) must be excluded
        // even though it has the same user_id=5
        // The third record (no project_id) falls back to user_id matching
        $this->assertEquals(2, count($records), 'Should include webmailaravel record + fallback record');
        $this->assertEquals('webmailaravel', $records[0]['project_id']);
        $this->assertEquals('user@example.com', $records[0]['recipient']);
        // Third record has no project_id (empty string) - falls back to user_id matching
        $this->assertEquals('', $records[1]['project_id']);
        $this->assertEquals('user3@example.com', $records[1]['recipient']);
    }

    public function test_bounce_file_has_only_user_id_header(): void
    {
        $file = $this->testDataDir . '/pmta-acct/bounce.csv';
        if (!file_exists($file)) {
            $this->markTestSkipped('Production sample data not available');
        }

        $content = file_get_contents($file);
        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');

        // Bounce file should have header_X-User-ID but NOT the other tracking headers
        $this->assertContains('header_X-User-ID', $headers);
        $this->assertNotContains('header_X-Campaign-ID', $headers);
        $this->assertNotContains('header_X-Sender-ID', $headers);
        $this->assertNotContains('header_X-SMTP-Config-ID', $headers);
    }

    public function test_diag_file_has_only_user_id_header(): void
    {
        $file = $this->testDataDir . '/pmta-acct/diag.csv';
        if (!file_exists($file)) {
            $this->markTestSkipped('Production sample data not available');
        }

        $content = file_get_contents($file);
        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        $headers = str_getcsv(array_shift($lines), ',', '"', '\\');

        // Diagnostic file should have header_X-User-ID but NOT the other tracking headers
        $this->assertContains('header_X-User-ID', $headers);
        $this->assertNotContains('header_X-Campaign-ID', $headers);
        $this->assertNotContains('header_X-Sender-ID', $headers);
        $this->assertNotContains('header_X-SMTP-Config-ID', $headers);
    }

    public function test_campaign_email_includes_all_four_tracking_headers(): void
    {
        // Create test data
        $user = User::factory()->create();
        $smtpConfig = \App\Models\SmtpConfig::factory()->create();
        $sender = Sender::factory()->create([
            'user_id' => $user->id,
            'smtp_config_id' => $smtpConfig->id,
        ]);
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
        ]);

        $content = \App\Models\Content::factory()->create([
            'user_id' => $user->id,
        ]);

        $mailable = new \App\Mail\CampaignEmail(
            $campaign,
            $content,
            $sender,
            'test@example.com'
        );

        $headers = $mailable->headers();

        // Extract headers from the Headers object
        $headerArray = $headers->text ?? [];

        // Verify all 5 tracking headers are present (4 ID headers + project ID)
        $this->assertArrayHasKey('X-Project-ID', $headerArray);
        $this->assertNotEmpty($headerArray['X-Project-ID']);

        $this->assertArrayHasKey('X-User-ID', $headerArray);
        $this->assertEquals($user->id, $headerArray['X-User-ID']);

        $this->assertArrayHasKey('X-Campaign-ID', $headerArray);
        $this->assertEquals($campaign->id, $headerArray['X-Campaign-ID']);

        $this->assertArrayHasKey('X-Sender-ID', $headerArray);
        $this->assertEquals($sender->id, $headerArray['X-Sender-ID']);

        $this->assertArrayHasKey('X-SMTP-Config-ID', $headerArray);
        $this->assertEquals($smtpConfig->id, $headerArray['X-SMTP-Config-ID']);
    }

    private function createMonitoringService(): PmtaMonitoringService
    {
        // Mock the SystemConfig to use our test directory
        $mockConfig = [
            'enabled' => true,
            'files_path' => $this->testDataDir,
            'fbl_path' => 'pmta-fbl',
            'logs_path' => 'pmta-logs',
            'acct_path' => 'pmta-acct',
            'diag_path' => 'pmta-diag',
            'scan_interval' => 5,
            'retention_days' => 30,
        ];

        $service = \Mockery::mock(PmtaMonitoringService::class)->makePartial();
        $service->shouldReceive('getConfig')->andReturn($mockConfig);
        $service->shouldReceive('isEnabled')->andReturn(true);

        // Override the config property via reflection
        $reflect = new \ReflectionClass($service);
        $configProp = $reflect->getProperty('config');
        $configProp->setAccessible(true);
        $configProp->setValue($service, $mockConfig);

        return $service;
    }
}

<?php

namespace App\Services;

use App\Traits\HttpClientTrait;
use App\Traits\LoggingTrait;
use App\Traits\CacheServiceTrait;
use App\Traits\ValidationTrait;
use App\Models\SystemConfig;
use GeoIp2\Database\Reader;
use GeoIp2\Exception\AddressNotFoundException;
use Illuminate\Support\Facades\Http;

class GeoIPService
{
    use HttpClientTrait, LoggingTrait, CacheServiceTrait, ValidationTrait;

    protected $systemConfig;
    protected $reader;
    protected $apiKey;

    public function __construct()
    {
        $this->systemConfig = app(\App\Models\SystemConfig::class);
        $this->initializeGeoIP();
    }

    /**
     * Initialize GeoIP service
     */
    protected function initializeGeoIP(): void
    {
        $geoipConfig = $this->systemConfig::getGeoIPConfig();
        $this->apiKey = $geoipConfig['api_key'];

        // Try to initialize MaxMind database reader
        if (!empty($geoipConfig['database_path']) && file_exists($geoipConfig['database_path'])) {
            try {
                $this->reader = new Reader($geoipConfig['database_path']);
            } catch (\Exception $e) {
                $this->logWarning('Failed to initialize MaxMind database', [
                    'error' => $e->getMessage(),
                    'database_path' => $geoipConfig['database_path']
                ]);
            }
        }
    }

    /**
     * Get location from IP address
     */
    public function getLocation(string $ip): array
    {
        $this->logMethodEntry(__METHOD__, ['ip' => $ip]);

        try {
            // Validate IP address
            if (!$this->validateIPAddress($ip)) {
                return [
                    'success' => false,
                    'error' => 'Invalid IP address'
                ];
            }

            // Check cache first
            $cacheKey = "geoip:{$ip}";
            $cachedResult = $this->getCache($cacheKey);
            
            if ($cachedResult) {
                $this->logMethodExit(__METHOD__, $cachedResult);
                return $cachedResult;
            }

            // Try MaxMind database first
            if ($this->reader) {
                $result = $this->getLocationFromDatabase($ip);
                if ($result['success']) {
                    $this->setCache($cacheKey, $result, 86400); // Cache for 24 hours
                    $this->logMethodExit(__METHOD__, $result);
                    return $result;
                }
            }

            // Fallback to external API
            $result = $this->getLocationFromAPI($ip);
            if ($result['success']) {
                $this->setCache($cacheKey, $result, 86400); // Cache for 24 hours
            }

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('GeoIP lookup failed', [
                'ip' => $ip,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to get location: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get location from MaxMind database
     */
    protected function getLocationFromDatabase(string $ip): array
    {
        try {
            $record = $this->reader->city($ip);

            return [
                'success' => true,
                'country' => $record->country->isoCode,
                'country_name' => $record->country->name,
                'city' => $record->city->name,
                'state' => $record->mostSpecificSubdivision->isoCode,
                'state_name' => $record->mostSpecificSubdivision->name,
                'postal_code' => $record->postal->code,
                'latitude' => $record->location->latitude,
                'longitude' => $record->location->longitude,
                'timezone' => $record->location->timeZone,
                'source' => 'maxmind_database'
            ];

        } catch (AddressNotFoundException $e) {
            return [
                'success' => false,
                'error' => 'IP address not found in database'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Database lookup failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get location from external API
     */
    protected function getLocationFromAPI(string $ip): array
    {
        try {
            $geoipConfig = $this->systemConfig::getGeoIPConfig();
            $service = $geoipConfig['service'] ?? 'ipapi';

            switch ($service) {
                case 'ipapi':
                    return $this->getLocationFromIPAPI($ip);
                case 'ipstack':
                    return $this->getLocationFromIPStack($ip);
                case 'ipgeolocation':
                    return $this->getLocationFromIPGeolocation($ip);
                default:
                    return $this->getLocationFromIPAPI($ip);
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'API lookup failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get location from ipapi.co
     */
    protected function getLocationFromIPAPI(string $ip): array
    {
        $response = Http::timeout(10)->get("http://ip-api.com/json/{$ip}");

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] === 'success') {
                return [
                    'success' => true,
                    'country' => $data['countryCode'],
                    'country_name' => $data['country'],
                    'city' => $data['city'],
                    'state' => $data['region'],
                    'state_name' => $data['regionName'],
                    'postal_code' => $data['zip'],
                    'latitude' => $data['lat'],
                    'longitude' => $data['lon'],
                    'timezone' => $data['timezone'],
                    'source' => 'ipapi'
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'IP-API lookup failed'
        ];
    }

    /**
     * Get location from IPStack
     */
    protected function getLocationFromIPStack(string $ip): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'error' => 'IPStack API key not configured'
            ];
        }

        $response = Http::timeout(10)->get("http://api.ipstack.com/{$ip}", [
            'access_key' => $this->apiKey
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if (!isset($data['error'])) {
                return [
                    'success' => true,
                    'country' => $data['country_code'],
                    'country_name' => $data['country_name'],
                    'city' => $data['city'],
                    'state' => $data['region_code'],
                    'state_name' => $data['region_name'],
                    'postal_code' => $data['zip'],
                    'latitude' => $data['latitude'],
                    'longitude' => $data['longitude'],
                    'timezone' => $data['time_zone']['id'] ?? null,
                    'source' => 'ipstack'
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'IPStack lookup failed'
        ];
    }

    /**
     * Get location from IPGeolocation
     */
    protected function getLocationFromIPGeolocation(string $ip): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'error' => 'IPGeolocation API key not configured'
            ];
        }

        $response = Http::timeout(10)->get("https://api.ipgeolocation.io/ipgeo", [
            'apiKey' => $this->apiKey,
            'ip' => $ip
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if (!isset($data['message'])) {
                return [
                    'success' => true,
                    'country' => $data['country_code2'],
                    'country_name' => $data['country_name'],
                    'city' => $data['city'],
                    'state' => $data['state_prov'],
                    'state_name' => $data['state_prov'],
                    'postal_code' => $data['zipcode'],
                    'latitude' => $data['latitude'],
                    'longitude' => $data['longitude'],
                    'timezone' => $data['time_zone']['name'] ?? null,
                    'source' => 'ipgeolocation'
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'IPGeolocation lookup failed'
        ];
    }

    /**
     * Validate IP address
     */
    protected function validateIPAddress(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    }

    /**
     * Get location for multiple IPs
     */
    public function getLocationsForIPs(array $ips): array
    {
        $this->logMethodEntry(__METHOD__, ['ip_count' => count($ips)]);

        $results = [];
        $successCount = 0;
        $errorCount = 0;

        foreach ($ips as $ip) {
            $result = $this->getLocation($ip);
            
            if ($result['success']) {
                $successCount++;
            } else {
                $errorCount++;
            }
            
            $results[$ip] = $result;
        }

        $this->logInfo('Batch GeoIP lookup completed', [
            'total' => count($ips),
            'success' => $successCount,
            'errors' => $errorCount
        ]);

        return [
            'success' => true,
            'results' => $results,
            'summary' => [
                'total' => count($ips),
                'success' => $successCount,
                'errors' => $errorCount
            ]
        ];
    }

    /**
     * Get country list
     */
    public function getCountryList(): array
    {
        $cacheKey = 'geoip:countries';
        $countries = $this->getCache($cacheKey);

        if (!$countries) {
            $countries = [
                'US' => 'United States',
                'CA' => 'Canada',
                'GB' => 'United Kingdom',
                'DE' => 'Germany',
                'FR' => 'France',
                'AU' => 'Australia',
                'JP' => 'Japan',
                'CN' => 'China',
                'IN' => 'India',
                'BR' => 'Brazil',
                // Add more countries as needed
            ];

            $this->setCache($cacheKey, $countries, 86400 * 7); // Cache for 7 days
        }

        return [
            'success' => true,
            'countries' => $countries
        ];
    }

    /**
     * Test GeoIP service
     */
    public function testService(): array
    {
        $this->logMethodEntry(__METHOD__);

        try {
            // Test with a known IP
            $testIP = '8.8.8.8'; // Google DNS
            $result = $this->getLocation($testIP);

            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => 'GeoIP service is working',
                    'test_ip' => $testIP,
                    'test_result' => $result
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'GeoIP service test failed: ' . $result['error']
                ];
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'GeoIP service test failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get service statistics
     */
    public function getServiceStatistics(): array
    {
        $cacheKey = 'geoip:stats';
        $stats = $this->getCache($cacheKey);

        if (!$stats) {
            $stats = [
                'total_lookups' => 0,
                'successful_lookups' => 0,
                'failed_lookups' => 0,
                'cache_hits' => 0,
                'database_lookups' => 0,
                'api_lookups' => 0
            ];
        }

        return [
            'success' => true,
            'statistics' => $stats
        ];
    }

    /**
     * Update service statistics
     */
    protected function updateStatistics(string $type): void
    {
        $cacheKey = 'geoip:stats';
        $stats = $this->getCache($cacheKey) ?? [
            'total_lookups' => 0,
            'successful_lookups' => 0,
            'failed_lookups' => 0,
            'cache_hits' => 0,
            'database_lookups' => 0,
            'api_lookups' => 0
        ];

        $stats['total_lookups']++;
        $stats[$type]++;

        $this->setCache($cacheKey, $stats, 86400); // Cache for 24 hours
    }
} 
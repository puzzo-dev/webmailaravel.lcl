<?php

namespace App\Traits;

use App\Models\SystemConfig;
use App\Traits\CloudflareIPTrait;
use GeoIp2\Database\Reader;
use GeoIp2\Exception\AddressNotFoundException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait GeoIPTrait
{
    use LoggingTrait, CacheManagementTrait, ValidationTrait, CloudflareIPTrait;

    /**
     * Get location from IP address
     */
    protected function getLocation(string $ip): array
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

            // Check if we have Cloudflare country data for this IP
            $cloudflareCountry = $this->getCloudflareCountryForIP($ip);
            
            // Try MaxMind database first
            $systemConfig = app(SystemConfig::class);
            $geoipConfig = $systemConfig::getGeoIPConfig();
            
            if (!empty($geoipConfig['database_path']) && file_exists($geoipConfig['database_path'])) {
                try {
                    $reader = new Reader($geoipConfig['database_path']);
                    $result = $this->getLocationFromDatabase($reader, $ip);
                    if ($result['success']) {
                        // Enhance with Cloudflare country if available and more accurate
                        if ($cloudflareCountry) {
                            $result['cf_country'] = $cloudflareCountry;
                            $result['source'] .= '+cloudflare';
                        }
                        $this->setCache($cacheKey, $result, 86400); // Cache for 24 hours
                        $this->logMethodExit(__METHOD__, $result);
                        return $result;
                    }
                } catch (\Exception $e) {
                    $this->logWarning('Failed to use MaxMind database', [
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Fallback to external API
            $result = $this->getLocationFromAPI($ip, $geoipConfig);
            if ($result['success']) {
                // Enhance with Cloudflare country if available
                if ($cloudflareCountry) {
                    $result['cf_country'] = $cloudflareCountry;
                    $result['source'] .= '+cloudflare';
                }
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
    protected function getLocationFromDatabase(Reader $reader, string $ip): array
    {
        try {
            $record = $reader->city($ip);

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
    protected function getLocationFromAPI(string $ip, array $geoipConfig): array
    {
        try {
            $service = $geoipConfig['service'] ?? 'ipapi';

            switch ($service) {
                case 'ipapi':
                    return $this->getLocationFromIPAPI($ip);
                case 'ipstack':
                    return $this->getLocationFromIPStack($ip, $geoipConfig);
                case 'ipgeolocation':
                    return $this->getLocationFromIPGeolocation($ip, $geoipConfig);
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
    protected function getLocationFromIPStack(string $ip, array $geoipConfig): array
    {
        $apiKey = $geoipConfig['ipstack_key'] ?? '';
        
        if (empty($apiKey)) {
            return [
                'success' => false,
                'error' => 'IPStack API key not configured'
            ];
        }

        $response = Http::timeout(10)->get("http://api.ipstack.com/{$ip}?access_key={$apiKey}");

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
                    'timezone' => $data['location']['time_zone'] ?? null,
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
    protected function getLocationFromIPGeolocation(string $ip, array $geoipConfig): array
    {
        $apiKey = $geoipConfig['ipgeolocation_key'] ?? '';
        
        if (empty($apiKey)) {
            return [
                'success' => false,
                'error' => 'IPGeolocation API key not configured'
            ];
        }

        $response = Http::timeout(10)->get("https://api.ipgeolocation.io/ipgeo?apiKey={$apiKey}&ip={$ip}");

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] === 200) {
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
                    'timezone' => $data['timezone']['name'] ?? null,
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
        return filter_var($ip, FILTER_VALIDATE_IP) !== false;
    }

    /**
     * Get Cloudflare country for specific IP from current request context
     */
    protected function getCloudflareCountryForIP(string $ip): ?string
    {
        // Check if current request is for this IP and has Cloudflare headers
        $request = request();
        if ($request && $this->getRealClientIP($request) === $ip) {
            return $this->getCloudflareCountry($request);
        }
        
        return null;
    }

    /**
     * Get locations for multiple IPs
     */
    protected function getLocationsForIPs(array $ips): array
    {
        $results = [];
        $validIPs = array_filter($ips, [$this, 'validateIPAddress']);

        foreach ($validIPs as $ip) {
            $results[$ip] = $this->getLocation($ip);
        }

        return [
            'success' => true,
            'results' => $results,
            'total' => count($validIPs),
            'valid' => count(array_filter($results, fn($r) => $r['success'])),
            'invalid' => count(array_filter($results, fn($r) => !$r['success']))
        ];
    }
} 
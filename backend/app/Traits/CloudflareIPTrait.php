<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait CloudflareIPTrait
{
    /**
     * Get the real client IP address, handling Cloudflare and other proxies
     */
    protected function getRealClientIP(Request $request = null): string
    {
        if (!$request) {
            $request = request();
        }

        // Priority order for IP detection
        $ipHeaders = [
            'CF-Connecting-IP',     // Cloudflare's real IP header
            'X-Forwarded-For',      // Standard proxy header
            'X-Real-IP',            // Nginx proxy header
            'X-Forwarded',          // Less common
            'X-Cluster-Client-IP',  // Cluster/load balancer
            'Client-IP',            // IIS
        ];

        // Check each header in priority order
        foreach ($ipHeaders as $header) {
            $ip = $request->header($header);
            
            if ($ip) {
                // Handle comma-separated IPs (X-Forwarded-For can have multiple)
                $ips = explode(',', $ip);
                
                foreach ($ips as $potentialIP) {
                    $potentialIP = trim($potentialIP);
                    
                    // Validate IP and ensure it's not private/reserved
                    if ($this->isValidPublicIP($potentialIP)) {
                        return $potentialIP;
                    }
                }
            }
        }

        // Fallback to Laravel's default IP detection
        return $request->ip();
    }

    /**
     * Check if an IP is valid and public
     */
    protected function isValidPublicIP(string $ip): bool
    {
        // First check if it's a valid IP
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return false;
        }

        // Check if it's not a private or reserved IP
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    /**
     * Get detailed IP information including Cloudflare data
     */
    protected function getIPDetails(Request $request = null): array
    {
        if (!$request) {
            $request = request();
        }

        $realIP = $this->getRealClientIP($request);
        
        return [
            'real_ip' => $realIP,
            'request_ip' => $request->ip(),
            'cloudflare_ip' => $request->header('CF-Connecting-IP'),
            'x_forwarded_for' => $request->header('X-Forwarded-For'),
            'x_real_ip' => $request->header('X-Real-IP'),
            'behind_cloudflare' => $request->hasHeader('CF-Ray'),
            'cloudflare_ray' => $request->header('CF-Ray'),
            'cloudflare_country' => $request->header('CF-IPCountry'),
            'user_agent' => $request->userAgent(),
        ];
    }

    /**
     * Check if request is coming through Cloudflare
     */
    protected function isBehindCloudflare(Request $request = null): bool
    {
        if (!$request) {
            $request = request();
        }

        return $request->hasHeader('CF-Ray') || $request->hasHeader('CF-Connecting-IP');
    }

    /**
     * Get Cloudflare country code if available
     */
    protected function getCloudflareCountry(Request $request = null): ?string
    {
        if (!$request) {
            $request = request();
        }

        return $request->header('CF-IPCountry');
    }
}

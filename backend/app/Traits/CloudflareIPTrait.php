<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

trait CloudflareIPTrait
{
    /**
     * Get the real client IP address considering Cloudflare and proxy headers
     */
    public function getRealClientIP(?Request $request = null): string
    {
        if (!$request) {
            $request = request();
        }

        // Check for Cloudflare specific header first (most reliable for Cloudflare)
        if ($request->hasHeader('CF-Connecting-IP')) {
            $ip = $request->header('CF-Connecting-IP');
            if ($this->isValidPublicIP($ip)) {
                Log::debug('IP detected from CF-Connecting-IP', ['ip' => $ip]);
                return $ip;
            }
        }

        // Check X-Forwarded-For header (standard proxy header)
        if ($request->hasHeader('X-Forwarded-For')) {
            $forwardedIps = explode(',', $request->header('X-Forwarded-For'));
            // Get the first IP in the chain (original client)
            $ip = trim($forwardedIps[0]);
            if ($this->isValidPublicIP($ip)) {
                Log::debug('IP detected from X-Forwarded-For', ['ip' => $ip, 'chain' => $request->header('X-Forwarded-For')]);
                return $ip;
            }
        }

        // Check X-Real-IP header (often used by Nginx)
        if ($request->hasHeader('X-Real-IP')) {
            $ip = $request->header('X-Real-IP');
            if ($this->isValidPublicIP($ip)) {
                Log::debug('IP detected from X-Real-IP', ['ip' => $ip]);
                return $ip;
            }
        }

        // Check other common proxy headers
        $proxyHeaders = [
            'X-Forwarded',
            'X-Cluster-Client-IP',
            'Client-IP',
            'Forwarded-For',
            'Forwarded'
        ];

        foreach ($proxyHeaders as $header) {
            if ($request->hasHeader($header)) {
                $ip = $request->header($header);
                // Handle comma-separated values
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if ($this->isValidPublicIP($ip)) {
                    Log::debug("IP detected from {$header}", ['ip' => $ip]);
                    return $ip;
                }
            }
        }

        // Fallback to Laravel's default IP detection
        $ip = $request->ip() ?: '127.0.0.1'; // Ensure we always return a string
        Log::debug('IP detected from request()->ip() fallback', ['ip' => $ip]);
        
        return $ip;
    }

    /**
     * Check if request is behind Cloudflare
     */
    public function isBehindCloudflare(?Request $request = null): bool
    {
        if (!$request) {
            $request = request();
        }

        return $request->hasHeader('CF-Ray') || 
               $request->hasHeader('CF-Connecting-IP') || 
               $request->hasHeader('CF-IPCountry');
    }

    /**
     * Get Cloudflare country code if available
     */
    public function getCloudflareCountry(?Request $request = null): ?string
    {
        if (!$request) {
            $request = request();
        }

        return $request->header('CF-IPCountry');
    }

    /**
     * Get detailed IP information for debugging
     */
    public function getIPDetails(?Request $request = null): array
    {
        if (!$request) {
            $request = request();
        }

        $details = [
            'real_ip' => $this->getRealClientIP($request),
            'laravel_ip' => $request->ip(),
            'is_cloudflare' => $this->isBehindCloudflare($request),
            'cloudflare_country' => $this->getCloudflareCountry($request),
            'headers' => []
        ];

        // Collect relevant headers for debugging
        $relevantHeaders = [
            'CF-Connecting-IP',
            'CF-Ray',
            'CF-IPCountry',
            'X-Forwarded-For',
            'X-Real-IP',
            'X-Forwarded',
            'X-Cluster-Client-IP',
            'Client-IP',
            'Forwarded-For',
            'Forwarded'
        ];

        foreach ($relevantHeaders as $header) {
            if ($request->hasHeader($header)) {
                $details['headers'][$header] = $request->header($header);
            }
        }

        return $details;
    }

    /**
     * Check if an IP address is valid and public
     */
    public function isValidPublicIP(string $ip): bool
    {
        // Basic IP validation
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return false;
        }

        // Check if it's a public IP (not private, reserved, or localhost)
        return filter_var(
            $ip, 
            FILTER_VALIDATE_IP, 
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    /**
     * Log IP detection details for debugging
     */
    public function logIPDetection(?Request $request = null): void
    {
        if (!$request) {
            $request = request();
        }

        $details = $this->getIPDetails($request);
        
        Log::info('IP Detection Details', $details);
    }
}

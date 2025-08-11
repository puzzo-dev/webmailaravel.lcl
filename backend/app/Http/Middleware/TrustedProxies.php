<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrustedProxies
{
    /**
     * The trusted proxies for this application.
     *
     * @var array<int, string>|string|null
     */
    protected $proxies = [
        // Cloudflare IP ranges
        '173.245.48.0/20',
        '103.21.244.0/22',
        '103.22.200.0/22',
        '103.31.4.0/22',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '104.16.0.0/13',
        '104.24.0.0/14',
        '172.64.0.0/13',
        '131.0.72.0/22',
        // IPv6 ranges
        '2400:cb00::/32',
        '2606:4700::/32',
        '2803:f800::/32',
        '2405:b500::/32',
        '2405:8100::/32',
        '2a06:98c0::/29',
        '2c0f:f248::/32',
    ];

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected $headers = Request::HEADER_X_FORWARDED_FOR | 
                        Request::HEADER_X_FORWARDED_HOST | 
                        Request::HEADER_X_FORWARDED_PORT | 
                        Request::HEADER_X_FORWARDED_PROTO;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Set trusted proxies
        $request->setTrustedProxies($this->proxies, $this->headers);
        
        // Handle Cloudflare specific headers
        $this->handleCloudflareHeaders($request);
        
        return $next($request);
    }

    /**
     * Handle Cloudflare specific headers
     */
    protected function handleCloudflareHeaders(Request $request): void
    {
        // Cloudflare provides the real IP in CF-Connecting-IP header
        if ($cfConnectingIp = $request->header('CF-Connecting-IP')) {
            // Validate the IP
            if (filter_var($cfConnectingIp, FILTER_VALIDATE_IP)) {
                // Override the client IP with Cloudflare's connecting IP
                $request->server->set('REMOTE_ADDR', $cfConnectingIp);
            }
        }
        
        // Also check for other common headers as fallback
        $possibleHeaders = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_CLIENT_IP',
        ];

        foreach ($possibleHeaders as $header) {
            if ($ip = $request->server->get($header)) {
                // For comma-separated list (like X-Forwarded-For), take the first IP
                $ip = trim(explode(',', $ip)[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    $request->server->set('REMOTE_ADDR', $ip);
                    break;
                }
            }
        }
    }
}

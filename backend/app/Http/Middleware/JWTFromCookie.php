<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use App\Services\SecurityService;
use App\Models\ApiKey;

class JWTFromCookie
{
    protected $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Handle an incoming request with dual authentication support.
     * Supports both JWT tokens and API keys seamlessly.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if the token is in the Authorization header first
        $authHeader = $request->header('Authorization');
        
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7); // Remove 'Bearer ' prefix
            
            // Check if this is an API key (not JWT format)
            if (substr_count($token, '.') !== 2) {
                // This is likely an API key, not a JWT
                if ($this->authenticateWithApiKey($token, $request)) {
                    return $next($request);
                }
            }
            // If it's JWT format, let it continue normally
        } else {
            // Check for API key in other headers/params
            $apiKey = $this->extractApiKey($request);
            if ($apiKey && $this->authenticateWithApiKey($apiKey, $request)) {
                return $next($request);
            }
            
            // If no Authorization header or Bearer token, check cookies for JWT
            $token = $request->cookie('jwt_token');
            
            if ($token) {
                // Set the token for JWTAuth to use
                $request->headers->set('Authorization', 'Bearer ' . $token);
            } elseif (auth('web')->check()) {
                // Fallback: user is authenticated via the web session (Inertia)
                // but has no JWT cookie. Generate a JWT on the fly so the
                // auth:api middleware accepts the request.
                try {
                    $token = JWTAuth::fromUser(auth('web')->user());
                    $request->headers->set('Authorization', 'Bearer ' . $token);
                } catch (\Exception $e) {
                    // If JWT generation fails, the auth:api middleware
                    // will return 401 as expected.
                }
            }
        }

        return $next($request);
    }

    /**
     * Authenticate using API key
     */
    private function authenticateWithApiKey(string $apiKey, Request $request): bool
    {
        $secret = $this->extractSecret($request);
        $validApiKey = $this->securityService->validateApiKey($apiKey, $secret);
        
        if ($validApiKey) {
            // Set the authenticated user for the request
            auth()->login($validApiKey->user);
            
            // Store API key info in request for later use
            $request->merge([
                'auth_method' => 'api_key',
                'api_key_id' => $validApiKey->id,
                'api_key_name' => $validApiKey->name,
                'api_key_permissions' => json_decode($validApiKey->permissions, true)
            ]);
            
            return true;
        }
        
        return false;
    }

    /**
     * Extract API key from various sources (excluding Authorization header)
     */
    private function extractApiKey(Request $request): ?string
    {
        // Check X-API-Key header (preferred — not logged in access logs)
        $apiKeyHeader = $request->header('X-API-Key');
        if ($apiKeyHeader) {
            return $apiKeyHeader;
        }

        // Check request body (POST only — not logged in access logs)
        if ($request->isMethod('POST')) {
            $bodyKey = $request->input('api_key');
            if ($bodyKey) {
                return $bodyKey;
            }
        }

        return null;
    }

    /**
     * Extract API secret from various sources
     */
    private function extractSecret(Request $request): ?string
    {
        // Check X-API-Secret header
        $secretHeader = $request->header('X-API-Secret');
        if ($secretHeader) {
            return $secretHeader;
        }

        // Check query parameter
        $querySecret = $request->query('api_secret');
        if ($querySecret) {
            return $querySecret;
        }

        // Check request body
        $bodySecret = $request->input('api_secret');
        if ($bodySecret) {
            return $bodySecret;
        }

        return null;
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\SecurityService;
use App\Models\ApiKey;
use Illuminate\Http\JsonResponse;

class ApiKeyAuth
{
    protected $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\JsonResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Extract API key from different sources
        $apiKey = $this->extractApiKey($request);
        $secret = $this->extractSecret($request);

        if (!$apiKey) {
            return $this->unauthorizedResponse('API key is required');
        }

        // Validate the API key
        $validApiKey = $this->securityService->validateApiKey($apiKey, $secret);

        if (!$validApiKey) {
            return $this->unauthorizedResponse('Invalid or expired API key');
        }

        // Set the authenticated user for the request
        auth()->login($validApiKey->user);
        
        // Store API key info in request for later use
        $request->merge([
            'api_key_id' => $validApiKey->id,
            'api_key_name' => $validApiKey->name,
            'api_key_permissions' => json_decode($validApiKey->permissions, true)
        ]);

        return $next($request);
    }

    /**
     * Extract API key from various sources
     */
    private function extractApiKey(Request $request): ?string
    {
        // Check Authorization header (Bearer token)
        $authHeader = $request->header('Authorization');
        if ($authHeader && preg_match('/^Bearer\s+(.+)$/', $authHeader, $matches)) {
            return $matches[1];
        }

        // Check X-API-Key header
        $apiKeyHeader = $request->header('X-API-Key');
        if ($apiKeyHeader) {
            return $apiKeyHeader;
        }

        // Check query parameter
        $queryKey = $request->query('api_key');
        if ($queryKey) {
            return $queryKey;
        }

        // Check request body
        $bodyKey = $request->input('api_key');
        if ($bodyKey) {
            return $bodyKey;
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

    /**
     * Return unauthorized response
     */
    private function unauthorizedResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error' => 'Unauthorized'
        ], 401);
    }
}

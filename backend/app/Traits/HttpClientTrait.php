<?php

namespace App\Traits;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response;

trait HttpClientTrait
{
    /**
     * Make HTTP request with Laravel's HTTP client
     */
    protected function makeHttpRequest(string $method, string $url, array $data = [], array $headers = [], int $timeout = 30): array
    {
        try {
            $response = Http::timeout($timeout)
                ->withHeaders($headers)
                ->$method($url, $data);

            return $this->processHttpResponse($response, $url, $method);

        } catch (\Exception $e) {
            Log::error('HTTP request failed', [
                'url' => $url,
                'method' => $method,
                'error' => $e->getMessage(),
                'service' => static::class
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Process HTTP response
     */
    protected function processHttpResponse(Response $response, string $url, string $method): array
    {
        if ($response->successful()) {
            return [
                'success' => true,
                'data' => $response->json(),
                'status' => $response->status(),
                'headers' => $response->headers(),
                'timestamp' => now()->toISOString()
            ];
        }

        Log::warning('HTTP request failed', [
            'url' => $url,
            'method' => $method,
            'status' => $response->status(),
            'body' => $response->body(),
            'service' => static::class
        ]);

        return [
            'success' => false,
            'error' => 'HTTP request failed',
            'status' => $response->status(),
            'details' => $response->body(),
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Make GET request
     */
    protected function get(string $url, array $headers = [], int $timeout = 30): array
    {
        return $this->makeHttpRequest('get', $url, [], $headers, $timeout);
    }

    /**
     * Make POST request
     */
    protected function post(string $url, array $data = [], array $headers = [], int $timeout = 30): array
    {
        return $this->makeHttpRequest('post', $url, $data, $headers, $timeout);
    }

    /**
     * Make PUT request
     */
    protected function put(string $url, array $data = [], array $headers = [], int $timeout = 30): array
    {
        return $this->makeHttpRequest('put', $url, $data, $headers, $timeout);
    }

    /**
     * Make DELETE request
     */
    protected function delete(string $url, array $headers = [], int $timeout = 30): array
    {
        return $this->makeHttpRequest('delete', $url, [], $headers, $timeout);
    }

    /**
     * Make PATCH request
     */
    protected function patch(string $url, array $data = [], array $headers = [], int $timeout = 30): array
    {
        return $this->makeHttpRequest('patch', $url, $data, $headers, $timeout);
    }

    /**
     * Add authorization header
     */
    protected function withAuth(string $token, string $type = 'Bearer'): array
    {
        return [
            'Authorization' => "{$type} {$token}",
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
    }

    /**
     * Add API key header
     */
    protected function withApiKey(string $apiKey): array
    {
        return [
            'Authorization' => "token {$apiKey}",
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
    }

    /**
     * Add basic auth header
     */
    protected function withBasicAuth(string $username, string $password): array
    {
        return [
            'Authorization' => 'Basic ' . base64_encode("{$username}:{$password}"),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
    }

    /**
     * Create HTTP client with default configuration
     */
    protected function createHttpClient(int $timeout = 30): \Illuminate\Http\Client\PendingRequest
    {
        return Http::timeout($timeout)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'EmailCampaignSystem/1.0'
            ]);
    }

    /**
     * Make HTTP request with retry logic
     */
    protected function makeHttpRequestWithRetry(string $method, string $url, array $data = [], array $headers = [], int $timeout = 30, int $retries = 3): array
    {
        $attempt = 0;
        
        while ($attempt < $retries) {
            $result = $this->makeHttpRequest($method, $url, $data, $headers, $timeout);
            
            if ($result['success']) {
                return $result;
            }
            
            $attempt++;
            
            if ($attempt < $retries) {
                Log::warning("HTTP request attempt {$attempt} failed, retrying...", [
                    'url' => $url,
                    'method' => $method,
                    'error' => $result['error'] ?? 'Unknown error'
                ]);
                
                sleep(1); // Wait 1 second before retry
            }
        }
        
        return $result; // Return last failed attempt
    }
} 
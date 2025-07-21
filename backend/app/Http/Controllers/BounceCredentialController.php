<?php

namespace App\Http\Controllers;

use App\Models\BounceCredential;
use App\Models\Domain;
use App\Http\Requests\StoreBounceCredentialRequest;
use App\Http\Requests\UpdateBounceCredentialRequest;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BounceCredentialController extends Controller
{
    use ResponseTrait, LoggingTrait;

    /**
     * Get user's bounce credentials
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();
            $perPage = $request->input('per_page', 10);
            
            $query = BounceCredential::forUser($user->id)
                ->with(['domain'])
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc');

            // Filter by domain if provided
            if ($request->has('domain_id')) {
                if ($request->input('domain_id') === 'null') {
                    $query->whereNull('domain_id');
                } else {
                    $query->where('domain_id', $request->input('domain_id'));
                }
            }

            $credentials = $query->paginate($perPage);

            // Hide password in response
            $credentials->getCollection()->makeHidden(['password']);

            return $this->paginatedResponse($credentials, 'Bounce credentials retrieved successfully');
        }, 'get_bounce_credentials');
    }

    /**
     * Store a new bounce credential
     */
    public function store(StoreBounceCredentialRequest $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();
            $data = $request->validated();
            $data['user_id'] = $user->id;

            // If this is being set as default, unset other defaults
            if ($data['is_default'] ?? false) {
                BounceCredential::forUser($user->id)
                    ->whereNull('domain_id')
                    ->update(['is_default' => false]);
            }

            // If domain is specified, ensure user owns it
            if (!empty($data['domain_id'])) {
                $domain = Domain::where('id', $data['domain_id'])
                    ->where('user_id', $user->id)
                    ->firstOrFail();
                
                // Remove existing credential for this domain
                BounceCredential::forUser($user->id)
                    ->forDomain($data['domain_id'])
                    ->delete();
                
                $data['is_default'] = false; // Domain-specific can't be default
            }

            $credential = BounceCredential::create($data);
            $credential->makeHidden(['password']);

            return $this->createdResponse($credential, 'Bounce credential created successfully');
        }, 'create_bounce_credential');
    }

    /**
     * Show a specific bounce credential
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = Auth::user();
            
            $credential = BounceCredential::forUser($user->id)
                ->with(['domain'])
                ->findOrFail($id);

            $credential->makeHidden(['password']);

            return $this->successResponse($credential, 'Bounce credential retrieved successfully');
        }, 'get_bounce_credential');
    }

    /**
     * Update a bounce credential
     */
    public function update(UpdateBounceCredentialRequest $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $user = Auth::user();
            
            $credential = BounceCredential::forUser($user->id)->findOrFail($id);
            $data = $request->validated();

            // If this is being set as default, unset other defaults
            if (($data['is_default'] ?? false) && !$credential->domain_id) {
                BounceCredential::forUser($user->id)
                    ->whereNull('domain_id')
                    ->where('id', '!=', $id)
                    ->update(['is_default' => false]);
            }

            $credential->update($data);
            $credential->makeHidden(['password']);

            return $this->successResponse($credential, 'Bounce credential updated successfully');
        }, 'update_bounce_credential');
    }

    /**
     * Delete a bounce credential
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = Auth::user();
            
            $credential = BounceCredential::forUser($user->id)->findOrFail($id);
            
            // Don't allow deleting the only default credential
            if ($credential->is_default) {
                $otherDefaults = BounceCredential::forUser($user->id)
                    ->whereNull('domain_id')
                    ->where('id', '!=', $id)
                    ->count();
                
                if ($otherDefaults === 0) {
                    return $this->errorResponse('Cannot delete the only default bounce credential', null, 400);
                }
            }

            $credential->delete();

            return $this->successResponse(null, 'Bounce credential deleted successfully');
        }, 'delete_bounce_credential');
    }

    /**
     * Test bounce credential connection
     */
    public function testConnection(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = Auth::user();
            
            $credential = BounceCredential::forUser($user->id)->findOrFail($id);
            $result = $credential->testConnection();

            if ($result['success']) {
                return $this->successResponse($result, 'Connection test successful');
            } else {
                return $this->errorResponse('Connection test failed', $result, 400);
            }
        }, 'test_bounce_connection');
    }

    /**
     * Get bounce processing statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();
            
            $credentials = BounceCredential::forUser($user->id)
                ->with(['domain', 'bounceProcessingLogs' => function ($query) {
                    $query->where('created_at', '>=', now()->subDays(30));
                }])
                ->get();

            $stats = [
                'total_credentials' => $credentials->count(),
                'active_credentials' => $credentials->where('is_active', true)->count(),
                'default_credential' => $credentials->where('is_default', true)->first(),
                'last_30_days' => [
                    'total_processed' => $credentials->sum('processed_count'),
                    'total_errors' => $credentials->filter(function ($cred) {
                        return !empty($cred->last_error);
                    })->count(),
                ],
                'by_domain' => $credentials->groupBy('domain_id')->map(function ($domainCreds, $domainId) {
                    $domain = $domainCreds->first()->domain;
                    return [
                        'domain_name' => $domain ? $domain->name : 'Default',
                        'credential_count' => $domainCreds->count(),
                        'processed_count' => $domainCreds->sum('processed_count'),
                        'last_checked' => $domainCreds->max('last_checked_at'),
                    ];
                })->values()
            ];

            return $this->successResponse($stats, 'Bounce processing statistics retrieved successfully');
        }, 'get_bounce_statistics');
    }

    /**
     * Get user's domains for dropdown
     */
    public function domains(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            $user = Auth::user();
            
            $domains = Domain::where('user_id', $user->id)
                ->select('id', 'name', 'is_active')
                ->orderBy('name')
                ->get();

            return $this->successResponse($domains, 'Domains retrieved successfully');
        }, 'get_user_domains');
    }

    /**
     * Set credential as default
     */
    public function setAsDefault(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = Auth::user();
            
            $credential = BounceCredential::forUser($user->id)
                ->whereNull('domain_id') // Only user-level credentials can be default
                ->findOrFail($id);

            // Unset other defaults
            BounceCredential::forUser($user->id)
                ->whereNull('domain_id')
                ->update(['is_default' => false]);

            // Set this as default
            $credential->update(['is_default' => true]);
            $credential->makeHidden(['password']);

            return $this->successResponse($credential, 'Credential set as default successfully');
        }, 'set_default_bounce_credential');
    }
}

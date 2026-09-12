<?php

namespace App\Http\Controllers;

use App\Models\BounceCredential;
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
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc');

            $credentials = $query->paginate($perPage);
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
                    ->update(['is_default' => false]);
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

            $credential = BounceCredential::forUser($user->id)->findOrFail($id);
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
            if (($data['is_default'] ?? false) && !$credential->is_default) {
                BounceCredential::forUser($user->id)
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
                ->with(['bounceProcessingLogs' => function ($query) {
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
            ];

            return $this->successResponse($stats, 'Bounce processing statistics retrieved successfully');
        }, 'get_bounce_statistics');
    }

    /**
     * Set credential as default
     */
    public function setAsDefault(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = Auth::user();

            $credential = BounceCredential::forUser($user->id)->findOrFail($id);

            // Unset other defaults
            BounceCredential::forUser($user->id)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);

            // Set this as default
            $credential->update(['is_default' => true]);
            $credential->makeHidden(['password']);

            return $this->successResponse($credential, 'Credential set as default successfully');
        }, 'set_default_bounce_credential');
    }
}

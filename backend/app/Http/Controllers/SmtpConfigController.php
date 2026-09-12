<?php

namespace App\Http\Controllers;

use App\Models\SmtpConfig;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SmtpConfigController extends Controller
{
    /**
     * List all SMTP configs (admin only)
     */
    public function index(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            return SmtpConfig::with(['senders'])->orderBy('created_at', 'desc')->get();
        }, 'list_smtp_configs');
    }

    /**
     * Get a single SMTP config (admin only)
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            return SmtpConfig::with(['senders'])->findOrFail($id);
        }, 'view_smtp_config');
    }

    /**
     * Create a new SMTP config (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validator = Validator::make($request->all(), [
                'host' => 'required|string|max:255',
                'port' => 'required|integer|min:1|max:65535',
                'username' => 'required|string|max:255',
                'password' => 'required|string',
                'encryption' => 'required|string|in:tls,ssl,none',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $data = $validator->validated();
            $data['password'] = \Illuminate\Support\Facades\Crypt::encryptString($data['password']);

            $smtpConfig = SmtpConfig::create($data);

            return $this->createdResponse($smtpConfig, 'SMTP config created successfully');
        }, 'create_smtp_config');
    }

    /**
     * Update an SMTP config (admin only)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'host' => 'sometimes|string|max:255',
                'port' => 'sometimes|integer|min:1|max:65535',
                'username' => 'sometimes|string|max:255',
                'password' => 'sometimes|string',
                'encryption' => 'sometimes|string|in:tls,ssl,none',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $data = $validator->validated();
            if (isset($data['password'])) {
                $data['password'] = \Illuminate\Support\Facades\Crypt::encryptString($data['password']);
            }

            $smtpConfig->update($data);

            return $smtpConfig;
        }, 'update_smtp_config');
    }

    /**
     * Delete an SMTP config (admin only)
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::findOrFail($id);
            $smtpConfig->delete();

            return null;
        }, 'delete_smtp_config');
    }

    /**
     * Test an SMTP config (admin only)
     */
    public function test(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'test_email' => 'required|email',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $testEmail = $validator->validated()['test_email'];
            $originalConfig = config('mail');

            try {
                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp' => [
                        'transport' => 'smtp',
                        'host' => $smtpConfig->host,
                        'port' => $smtpConfig->port,
                        'username' => $smtpConfig->username,
                        'password' => $smtpConfig->password,
                        'encryption' => $smtpConfig->encryption,
                        'timeout' => 30,
                        'local_domain' => $smtpConfig->host,
                    ],
                    'mail.from.address' => $smtpConfig->username,
                    'mail.from.name' => 'SMTP Test',
                ]);

                app('mail.manager')->purge('smtp');

                \Illuminate\Support\Facades\Mail::raw('This is a test email from your SMTP configuration.', function ($message) use ($testEmail) {
                    $message->to($testEmail)->subject('SMTP Config Test');
                });

                return [
                    'success' => true,
                    'message' => 'Test email sent successfully',
                    'smtp_config' => [
                        'host' => $smtpConfig->host,
                        'port' => $smtpConfig->port,
                        'username' => $smtpConfig->username,
                        'encryption' => $smtpConfig->encryption,
                    ],
                ];
            } catch (\Exception $e) {
                return $this->errorResponse('Test failed: ' . $e->getMessage(), 400);
            } finally {
                config(['mail' => $originalConfig]);
                app('mail.manager')->purge('smtp');
            }
        }, 'test_smtp_config');
    }
}

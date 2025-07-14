<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\SuppressionListService;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SuppressionListController extends Controller
{
    public function __construct(
        private SuppressionListService $suppressionListService,
        private FileUploadService $fileUploadService
    ) {}

    /**
     * Handle unsubscribe request
     */
    public function unsubscribe(Request $request, string $emailId): JsonResponse
    {
        try {
            $email = $request->get('email');
            
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email address'
                ], 400);
            }

            $metadata = [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'unsubscribed_at' => now()->toISOString()
            ];

            $result = $this->suppressionListService->handleUnsubscribe($emailId, $email, $metadata);

            if ($result['success']) {
                Log::info('Unsubscribe processed', [
                    'email' => $email,
                    'email_id' => $emailId,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'email' => $email,
                        'unsubscribed_at' => now()->toISOString()
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to process unsubscribe',
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Unsubscribe failed', [
                'email_id' => $emailId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process unsubscribe request'
            ], 500);
        }
    }

    /**
     * Process FBL file upload
     */
    public function processFBLFile(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'fbl_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
                'source' => 'nullable|string|max:255'
            ]);

            $file = $request->file('fbl_file');
            $source = $request->input('source', 'fbl_upload');

            // Upload file
            $filepath = $this->fileUploadService->uploadFile($file, 'fbl_files');

            // Process FBL file
            $result = $this->suppressionListService->processFBLFile($filepath, $source);

            if ($result['success']) {
                Log::info('FBL file processed successfully', [
                    'filepath' => $filepath,
                    'processed' => $result['processed'],
                    'added' => $result['added']
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'FBL file processed successfully',
                    'data' => $result
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to process FBL file',
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('FBL file processing failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process FBL file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get suppression list statistics
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $stats = $this->suppressionListService->getStatistics();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get suppression statistics', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get suppression statistics'
            ], 500);
        }
    }

    /**
     * Export suppression list
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $filename = $request->input('filename');
            $filepath = $this->suppressionListService->exportSuppressionList($filename);

            Log::info('Suppression list exported', [
                'filepath' => $filepath
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Suppression list exported successfully',
                'data' => [
                    'filepath' => $filepath,
                    'download_url' => url('/api/suppression-list/download/' . basename($filepath))
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to export suppression list', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export suppression list'
            ], 500);
        }
    }

    /**
     * Download suppression list file
     */
    public function download(string $filename): JsonResponse
    {
        try {
            $filepath = 'suppression_lists/' . $filename;

            if (!Storage::disk('local')->exists($filepath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            $content = Storage::disk('local')->get($filepath);
            $headers = [
                'Content-Type' => 'text/plain',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ];

            return response($content, 200, $headers);

        } catch (\Exception $e) {
            Log::error('Failed to download suppression list', [
                'filename' => $filename,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download file'
            ], 500);
        }
    }

    /**
     * Import suppression list from file
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'suppression_file' => 'required|file|mimes:csv,txt|max:10240',
                'type' => 'required|string|in:unsubscribe,fbl,bounce,complaint,manual',
                'source' => 'nullable|string|max:255'
            ]);

            $file = $request->file('suppression_file');
            $type = $request->input('type');
            $source = $request->input('source', 'manual_import');

            // Upload file
            $filepath = $this->fileUploadService->uploadFile($file, 'suppression_imports');

            // Import suppression list
            $result = $this->suppressionListService->importSuppressionList($filepath, $type, $source);

            Log::info('Suppression list imported', [
                'filepath' => $filepath,
                'type' => $type,
                'result' => $result
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Suppression list imported successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to import suppression list', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to import suppression list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove email from suppression list (admin only)
     */
    public function removeEmail(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email'
            ]);

            $email = $request->input('email');
            $result = $this->suppressionListService->removeFromSuppressionList($email);

            if ($result) {
                Log::info('Email removed from suppression list', [
                    'email' => $email,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Email removed from suppression list'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Email not found in suppression list'
                ], 404);
            }

        } catch (\Exception $e) {
            Log::error('Failed to remove email from suppression list', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove email from suppression list'
            ], 500);
        }
    }

    /**
     * Clean up old suppression entries
     */
    public function cleanup(Request $request): JsonResponse
    {
        try {
            $days = $request->input('days', 365);
            $removed = $this->suppressionListService->cleanupOldEntries($days);

            Log::info('Suppression list cleanup completed', [
                'days' => $days,
                'removed' => $removed
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cleanup completed successfully',
                'data' => [
                    'removed_entries' => $removed,
                    'days_old' => $days
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to cleanup suppression list', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cleanup suppression list'
            ], 500);
        }
    }
} 
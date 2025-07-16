<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\SuppressionListTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SuppressionListController extends Controller
{
    use SuppressionListTrait, FileProcessingTrait;

    /**
     * Handle unsubscribe request
     */
    public function unsubscribe(Request $request, string $emailId): JsonResponse
    {
        try {
            $email = $request->get('email');
            
            if (!$email || !$this->validateEmail($email)) {
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

            $result = $this->handleUnsubscribe($emailId, $email, $metadata);

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
            $filepath = $this->uploadFile($file, 'fbl_files');

            // Process FBL file
            $result = $this->processFBLFile($filepath, $source);

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
            $stats = $this->getSuppressionStatistics();

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
            $filepath = $this->exportSuppressionList($filename);

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

            return response()->download(
                Storage::disk('local')->path($filepath),
                $filename,
                ['Content-Type' => 'text/csv']
            );

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
     * Import suppression list
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:10240',
                'type' => 'nullable|string|max:50',
                'source' => 'nullable|string|max:255'
            ]);

            $file = $request->file('file');
            $type = $request->input('type', 'manual');
            $source = $request->input('source', 'import');

            // Upload file
            $filepath = $this->uploadFile($file, 'suppression_lists');

            // Import suppression list
            $result = $this->importSuppressionList($filepath, $type, $source);

            if ($result['success']) {
                Log::info('Suppression list imported', [
                    'filepath' => $filepath,
                    'imported' => $result['imported'],
                    'skipped' => $result['skipped']
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Suppression list imported successfully',
                    'data' => $result
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to import suppression list',
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Suppression list import failed', [
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
     * Remove email from suppression list
     */
    public function removeEmail(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email'
            ]);

            $email = $request->input('email');
            $removed = $this->removeFromSuppressionList($email);

            if ($removed) {
                Log::info('Email removed from suppression list', [
                    'email' => $email
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Email removed from suppression list'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to remove email from suppression list'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to remove email from suppression list', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove email'
            ], 500);
        }
    }

    /**
     * Cleanup old suppression list entries
     */
    public function cleanup(Request $request): JsonResponse
    {
        try {
            $days = $request->input('days', 365);
            $removed = $this->cleanupOldEntries($days);

            Log::info('Suppression list cleanup completed', [
                'days' => $days,
                'removed' => $removed
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cleanup completed successfully',
                'data' => [
                    'removed_entries' => $removed
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Suppression list cleanup failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cleanup suppression list'
            ], 500);
        }
    }
} 
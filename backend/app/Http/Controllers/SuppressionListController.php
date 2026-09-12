<?php

namespace App\Http\Controllers;

use App\Traits\SuppressionListTrait;
use App\Traits\FileProcessingTrait;
use App\Traits\CacheManagementTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SuppressionListController extends Controller
{
    use SuppressionListTrait, FileProcessingTrait, CacheManagementTrait;

    /**
     * Get suppression list (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $perPage = $request->input('per_page', 20);
            $page = $request->input('page', 1);
            $search = $request->input('search');

            $query = \App\Models\SuppressionList::query();

            if ($search) {
                $query->where('email', 'like', "%{$search}%")
                     ->orWhere('reason', 'like', "%{$search}%");
            }

            $results = $query->orderBy('created_at', 'desc')
                           ->paginate($perPage, ['*'], 'page', $page);

            return $this->paginatedResponse($results, 'Suppression list retrieved successfully');
        }, 'get_suppression_list');
    }

    /**
     * Process FBL file upload
     */
    public function processFBLFile(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validated = $request->validate([
                'fbl_file' => 'required|file|mimes:csv,txt|max:10240',
                'source' => 'nullable|string|max:255',
            ]);

            $file = $request->file('fbl_file');
            $source = $validated['source'] ?? 'fbl_upload';

            $filepath = $this->uploadFile($file, 'fbl_files');
            $result = $this->processFBLFileData($filepath, $source);

            if (!$result['success']) {
                return $this->errorResponse('Failed to process FBL file: ' . ($result['error'] ?? 'Unknown error'), 500);
            }

            return $result;
        }, 'process_fbl_file');
    }

    /**
     * Get suppression list statistics
     */
    public function getStatistics(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            return $this->getSuppressionStatistics();
        }, 'get_suppression_statistics');
    }

    /**
     * Export suppression list
     */
    public function export(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $filename = $request->input('filename');
            $filepath = $this->exportSuppressionList($filename);

            return [
                'filepath' => $filepath,
                'download_url' => url('/api/suppression-list/download/' . basename($filepath)),
            ];
        }, 'export_suppression_list');
    }

    /**
     * Download suppression list file
     */
    public function download(string $filename): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($filename) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            // Prevent path traversal — only allow safe filenames
            $filename = basename($filename);
            if (!preg_match('/^[a-zA-Z0-9._-]+\.(csv|txt)$/', $filename)) {
                return $this->errorResponse('Invalid file name', 400);
            }

            $filepath = 'suppression_lists/' . $filename;

            if (!Storage::disk('local')->exists($filepath)) {
                return $this->errorResponse('File not found', 404);
            }

            return response()->download(
                Storage::disk('local')->path($filepath),
                $filename,
                ['Content-Type' => 'text/csv']
            );
        }, 'download_suppression_list');
    }

    /**
     * Import suppression list
     */
    public function import(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validated = $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:10240',
                'type' => 'nullable|string|max:50',
                'source' => 'nullable|string|max:255',
            ]);

            $file = $request->file('file');
            $type = $validated['type'] ?? 'manual';
            $source = $validated['source'] ?? 'import';

            $filepath = $this->uploadFile($file, 'suppression_lists');
            $result = $this->importSuppressionList($filepath, $type, $source);

            if (!$result['success']) {
                return $this->errorResponse('Failed to import suppression list: ' . ($result['error'] ?? 'Unknown error'), 500);
            }

            return $result;
        }, 'import_suppression_list');
    }

    /**
     * Remove email from suppression list
     */
    public function removeEmail(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validated = $request->validate([
                'email' => 'required|email',
            ]);

            $removed = $this->removeFromSuppressionList($validated['email']);

            if (!$removed) {
                return $this->errorResponse('Failed to remove email from suppression list', 500);
            }

            return ['message' => 'Email removed from suppression list'];
        }, 'remove_suppression_email');
    }

    /**
     * Cleanup old suppression list entries
     */
    public function cleanup(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $days = (int) $request->input('days', 365);
            $removed = $this->cleanupOldEntries($days);

            return ['removed_entries' => $removed];
        }, 'cleanup_suppression_list');
    }
}

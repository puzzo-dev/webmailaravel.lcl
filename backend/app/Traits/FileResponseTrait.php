<?php

namespace App\Traits;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

trait FileResponseTrait
{
    /**
     * Download a file with proper headers
     */
    protected function downloadFile(string $filePath, string $fileName = null, array $headers = []): Response
    {
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($filePath);
        
        $defaultHeaders = [
            'Content-Type' => mime_content_type($filePath),
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Content-Length' => filesize($filePath),
            'Cache-Control' => 'no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ];

        return response()->download($filePath, $fileName, array_merge($defaultHeaders, $headers));
    }

    /**
     * Stream a large file download
     */
    protected function streamFile(string $filePath, string $fileName = null): StreamedResponse
    {
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($filePath);
        
        return response()->stream(function () use ($filePath) {
            $handle = fopen($filePath, 'rb');
            
            while (!feof($handle)) {
                echo fread($handle, 8192);
                ob_flush();
                flush();
            }
            
            fclose($handle);
        }, 200, [
            'Content-Type' => mime_content_type($filePath),
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Content-Length' => filesize($filePath),
            'Cache-Control' => 'no-cache, must-revalidate'
        ]);
    }

    /**
     * Download file from storage disk
     */
    protected function downloadStorageFile(string $disk, string $path, string $fileName = null): Response
    {
        if (!Storage::disk($disk)->exists($path)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($path);
        
        return Storage::disk($disk)->download($path, $fileName);
    }

    /**
     * View file in browser (inline)
     */
    protected function viewFile(string $filePath, string $fileName = null): Response
    {
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        $fileName = $fileName ?: basename($filePath);
        
        return response()->file($filePath, [
            'Content-Type' => mime_content_type($filePath),
            'Content-Disposition' => 'inline; filename="' . $fileName . '"'
        ]);
    }
}

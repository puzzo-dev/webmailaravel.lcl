<?php

namespace App\Services;

use App\Models\Campaign;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Xls;
use App\Traits\LoggingTrait;
use App\Traits\FileProcessingTrait;
use App\Traits\ValidationTrait;

class UnsubscribeExportService
{
    use LoggingTrait, FileProcessingTrait, ValidationTrait;

    /**
     * Append an unsubscribed email to the campaign's unsubscribe list file
     */
    public function appendToUnsubscribeList(int $campaignId, string $email, array $metadata = []): bool
    {
        try {
            $campaign = Campaign::find($campaignId);
            if (!$campaign) {
                $this->logError('Campaign not found for unsubscribe list', ['campaign_id' => $campaignId]);
                return false;
            }

            $format = $campaign->unsubscribe_list_format ?? 'txt';
            $path = $this->getUnsubscribeFilePath($campaignId, $format);

            // For txt format, append email with metadata
            if ($format === 'txt') {
                $line = $email;
                if (!empty($metadata)) {
                    $line .= ' | ' . json_encode($metadata);
                }
                $this->appendLineToFile($path, $line);
            } else {
                // For other formats, we need to read existing data and rewrite
                $this->updateFormattedUnsubscribeList($campaignId, $email, $metadata, $format);
            }

            // Update campaign's unsubscribe list path if not set
            if (!$campaign->unsubscribe_list_path) {
                $campaign->update([
                    'unsubscribe_list_path' => $path,
                    'unsubscribe_list_format' => $format
                ]);
            }

            $this->logInfo('Email added to unsubscribe list', [
                'campaign_id' => $campaignId,
                'email' => $email,
                'format' => $format,
                'path' => $path
            ]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Failed to append to unsubscribe list', [
                'campaign_id' => $campaignId,
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Update formatted unsubscribe list (CSV, XLS, XLSX)
     */
    private function updateFormattedUnsubscribeList(int $campaignId, string $email, array $metadata, string $format): void
    {
        $emails = $this->getUnsubscribeEmails($campaignId);
        
        // Add new email if not already present
        if (!in_array($email, $emails)) {
            $emails[] = $email;
        }

        // Export in the specified format
        switch ($format) {
            case 'csv':
                $this->exportCsv($campaignId, $emails, $metadata);
                break;
            case 'xls':
                $this->exportExcel($campaignId, $emails, 'xls', $metadata);
                break;
            case 'xlsx':
                $this->exportExcel($campaignId, $emails, 'xlsx', $metadata);
                break;
            default:
                $this->exportTxt($campaignId, $emails, $metadata);
        }
    }

    /**
     * Export the unsubscribe list for a campaign in the requested format
     */
    public function exportUnsubscribeList(int $campaignId, string $format = null): array
    {
        try {
            $campaign = Campaign::find($campaignId);
            if (!$campaign) {
                return ['success' => false, 'error' => 'Campaign not found'];
            }

            $format = $format ?? $campaign->unsubscribe_list_format ?? 'txt';
            $emails = $this->getUnsubscribeEmails($campaignId);

            if (empty($emails)) {
                return ['success' => false, 'error' => 'No unsubscribed emails found'];
            }

            $path = $this->exportInFormat($campaignId, $emails, $format);

            // Update campaign's unsubscribe list path
            $campaign->update([
                'unsubscribe_list_path' => $path,
                'unsubscribe_list_format' => $format
            ]);

            return [
                'success' => true,
                'path' => $path,
                'format' => $format,
                'count' => count($emails),
                'filename' => basename($path)
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to export unsubscribe list', [
                'campaign_id' => $campaignId,
                'format' => $format,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => 'Failed to export unsubscribe list'];
        }
    }

    /**
     * Export in specified format
     */
    private function exportInFormat(int $campaignId, array $emails, string $format): string
    {
        switch ($format) {
            case 'csv':
                return $this->exportCsv($campaignId, $emails);
            case 'xls':
                return $this->exportExcel($campaignId, $emails, 'xls');
            case 'xlsx':
                return $this->exportExcel($campaignId, $emails, 'xlsx');
            case 'txt':
            default:
                return $this->exportTxt($campaignId, $emails);
        }
    }

    /**
     * Get the unsubscribe file path for a campaign and format
     */
    public function getUnsubscribeFilePath(int $campaignId, string $format = 'txt'): string
    {
        return "unsubscribe_lists/campaign_{$campaignId}.{$format}";
    }

    /**
     * Get all unsubscribed emails for a campaign
     */
    public function getUnsubscribeEmails(int $campaignId): array
    {
        $campaign = Campaign::find($campaignId);
        $format = $campaign->unsubscribe_list_format ?? 'txt';
        $path = $this->getUnsubscribeFilePath($campaignId, $format);
        
        if (!$this->fileExists($path)) {
            return [];
        }

        $content = $this->getFileContent($path);
        
        if ($format === 'txt') {
            $lines = array_filter(array_map('trim', explode("\n", $content)));
            return array_unique($lines);
        }

        // For other formats, we need to parse them properly
        return $this->parseFormattedFile($path, $format);
    }

    /**
     * Parse formatted file (CSV, XLS, XLSX)
     */
    private function parseFormattedFile(string $path, string $format): array
    {
        try {
            if ($format === 'csv') {
                $content = $this->getFileContent($path);
                $lines = array_filter(array_map('trim', explode("\n", $content)));
                $emails = [];
                foreach ($lines as $line) {
                    $data = str_getcsv($line);
                    if (!empty($data[0])) {
                        $emails[] = $data[0];
                    }
                }
                return array_unique($emails);
            }

            // For Excel files, we need PhpSpreadsheet
            if (!class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
                $this->logError('PhpSpreadsheet not available for Excel parsing');
                return [];
            }

            $fullPath = $this->getFilePath($path);
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($fullPath);
            $worksheet = $spreadsheet->getActiveSheet();
            $emails = [];

            foreach ($worksheet->getRowIterator() as $row) {
                $cellValue = $row->getCellIterator()->current()->getValue();
                if (!empty($cellValue)) {
                    $emails[] = $cellValue;
                }
            }

            return array_unique($emails);

        } catch (\Exception $e) {
            $this->logError('Failed to parse formatted file', [
                'path' => $path,
                'format' => $format,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Export as txt
     */
    private function exportTxt(int $campaignId, array $emails, array $metadata = []): string
    {
        $path = $this->getUnsubscribeFilePath($campaignId, 'txt');
        $content = implode("\n", $emails);
        $this->putFileContent($path, $content);
        return $path;
    }

    /**
     * Export as csv
     */
    private function exportCsv(int $campaignId, array $emails, array $metadata = []): string
    {
        $path = $this->getUnsubscribeFilePath($campaignId, 'csv');
        $csv = "Email,Unsubscribed At\n";
        foreach ($emails as $email) {
            $csv .= '"' . addslashes($email) . '",' . now()->toISOString() . "\n";
        }
        $this->putFileContent($path, $csv);
        return $path;
    }

    /**
     * Export as Excel (xls or xlsx)
     */
    private function exportExcel(int $campaignId, array $emails, string $type, array $metadata = []): string
    {
        if (!class_exists('\PhpOffice\PhpSpreadsheet\Spreadsheet')) {
            $this->logError('PhpSpreadsheet not available for Excel export');
            return $this->exportTxt($campaignId, $emails);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set headers
        $sheet->setCellValue('A1', 'Email');
        $sheet->setCellValue('B1', 'Unsubscribed At');
        $sheet->setCellValue('C1', 'Metadata');

        $row = 2;
        foreach ($emails as $email) {
            $sheet->setCellValue('A' . $row, $email);
            $sheet->setCellValue('B' . $row, now()->toISOString());
            $sheet->setCellValue('C' . $row, json_encode($metadata));
            $row++;
        }

        $path = storage_path('app/private/' . $this->getUnsubscribeFilePath($campaignId, $type));
        
        if ($type === 'xls') {
            $writer = new Xls($spreadsheet);
        } else {
            $writer = new Xlsx($spreadsheet);
        }
        
        $writer->save($path);
        return 'unsubscribe_lists/campaign_' . $campaignId . '.' . $type;
    }

    /**
     * Get unsubscribe list statistics for a campaign
     */
    public function getUnsubscribeStats(int $campaignId): array
    {
        $emails = $this->getUnsubscribeEmails($campaignId);
        $campaign = Campaign::find($campaignId);
        
        return [
            'campaign_id' => $campaignId,
            'campaign_name' => $campaign->name ?? 'Unknown',
            'unsubscribe_count' => count($emails),
            'file_path' => $campaign->unsubscribe_list_path,
            'file_format' => $campaign->unsubscribe_list_format ?? 'txt',
            'last_updated' => $campaign->updated_at
        ];
    }
} 
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;

class MonitoringController extends Controller
{

    /**
     * Get monitoring status
     */
    public function getMonitoringStatus(Request $request): JsonResponse
    {
        $lastRun = Cache::get('domain_monitoring_last_run');
        $results = Cache::get('domain_monitoring_results', []);
        
        $status = [
            'last_run' => $lastRun ? Carbon::parse($lastRun)->toISOString() : null,
            'next_run' => $lastRun ? Carbon::parse($lastRun)->addHours(24)->toISOString() : Carbon::now()->toISOString(),
            'total_domains' => count($results),
            'last_results' => $results
        ];
        
        return response()->json([
            'success' => true,
            'data' => $status,
            'message' => 'Monitoring status retrieved successfully'
        ]);
    }

    /**
     * Get all monitoring results
     */
    public function getAllMonitoringResults(Request $request): JsonResponse
    {
        $results = Cache::get('domain_monitoring_results', []);
        
        return response()->json([
            'success' => true,
            'data' => $results,
            'message' => 'Monitoring results retrieved successfully'
        ]);
    }

    /**
     * Force run monitoring
     */
    public function forceRunMonitoring(Request $request): JsonResponse
    {
        try {
            Artisan::call('domains:monitor', ['--force' => true]);
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'data' => ['output' => $output],
                'message' => 'Domain monitoring executed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to run monitoring: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear monitoring data
     */
    public function clearMonitoringData(Request $request): JsonResponse
    {
        try {
            Artisan::call('domains:monitor', ['--clear' => true]);
            
            return response()->json([
                'success' => true,
                'message' => 'Monitoring data cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear monitoring data: ' . $e->getMessage()
            ], 500);
        }
    }
}

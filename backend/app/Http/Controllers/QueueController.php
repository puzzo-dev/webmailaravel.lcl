<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\ResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Queue;

class QueueController extends Controller
{
    use ResponseTrait;

    /**
     * Get queue statistics
     */
    public function getQueueStats(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            // Get pending jobs count
            $pendingJobs = DB::table('jobs')->count();

            // Get failed jobs count
            $failedJobs = DB::table('failed_jobs')->count();

            // Get job types breakdown for pending jobs
            $jobTypes = DB::table('jobs')
                ->selectRaw('
                    JSON_EXTRACT(payload, "$.displayName") as job_class,
                    COUNT(*) as count
                ')
                ->groupBy('job_class')
                ->get();

            // Get failed job types breakdown
            $failedJobTypes = DB::table('failed_jobs')
                ->selectRaw('
                    JSON_EXTRACT(payload, "$.displayName") as job_class,
                    COUNT(*) as count
                ')
                ->groupBy('job_class')
                ->get();

            $stats = [
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
                'job_types' => $jobTypes,
                'failed_job_types' => $failedJobTypes,
                'total_jobs' => $pendingJobs + $failedJobs,
            ];

            return $this->successResponse($stats, 'Queue statistics retrieved successfully');
        }, 'view_queue_stats');
    }

    /**
     * Get pending jobs
     */
    public function getPendingJobs(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $page = $request->input('page', 1);
            $limit = $request->input('limit', 20);
            $jobType = $request->input('job_type');

            $query = DB::table('jobs')
                ->select([
                    'id',
                    'queue',
                    'payload',
                    'attempts',
                    'reserved_at',
                    'available_at',
                    'created_at'
                ])
                ->orderBy('created_at', 'desc');

            if ($jobType) {
                $query->whereRaw('JSON_EXTRACT(payload, "$.displayName") = ?', [$jobType]);
            }

            $total = $query->count();
            $jobs = $query->offset(($page - 1) * $limit)
                ->limit($limit)
                ->get()
                ->map(function ($job) {
                    $payload = json_decode($job->payload, true);
                    return [
                        'id' => $job->id,
                        'queue' => $job->queue,
                        'job_class' => $payload['displayName'] ?? 'Unknown',
                        'attempts' => $job->attempts,
                        'reserved_at' => $job->reserved_at,
                        'available_at' => $job->available_at,
                        'created_at' => $job->created_at,
                        'payload' => $payload,
                    ];
                });

            return $this->successResponse([
                'data' => $jobs,
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'last_page' => ceil($total / $limit),
            ], 'Pending jobs retrieved successfully');
        }, 'view_pending_jobs');
    }

    /**
     * Get failed jobs
     */
    public function getFailedJobs(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $page = $request->input('page', 1);
            $limit = $request->input('limit', 20);
            $jobType = $request->input('job_type');

            $query = DB::table('failed_jobs')
                ->select([
                    'id',
                    'uuid',
                    'connection',
                    'queue',
                    'payload',
                    'exception',
                    'failed_at'
                ])
                ->orderBy('failed_at', 'desc');

            if ($jobType) {
                $query->whereRaw('JSON_EXTRACT(payload, "$.displayName") = ?', [$jobType]);
            }

            $total = $query->count();
            $failedJobs = $query->offset(($page - 1) * $limit)
                ->limit($limit)
                ->get()
                ->map(function ($job) {
                    $payload = json_decode($job->payload, true);
                    return [
                        'id' => $job->id,
                        'uuid' => $job->uuid,
                        'connection' => $job->connection,
                        'queue' => $job->queue,
                        'job_class' => $payload['displayName'] ?? 'Unknown',
                        'failed_at' => $job->failed_at,
                        'exception' => $job->exception,
                        'payload' => $payload,
                    ];
                });

            return $this->successResponse([
                'data' => $failedJobs,
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'last_page' => ceil($total / $limit),
            ], 'Failed jobs retrieved successfully');
        }, 'view_failed_jobs');
    }

    /**
     * Retry a failed job
     */
    public function retryFailedJob(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $failedJob = DB::table('failed_jobs')->where('id', $id)->first();
            
            if (!$failedJob) {
                return $this->errorResponse('Failed job not found', 404);
            }

            try {
                // Recreate the job
                $payload = json_decode($failedJob->payload, true);
                
                // Add the job back to the queue
                DB::table('jobs')->insert([
                    'queue' => $failedJob->queue,
                    'payload' => $failedJob->payload,
                    'attempts' => 0,
                    'reserved_at' => null,
                    'available_at' => now()->timestamp,
                    'created_at' => now()->timestamp,
                ]);

                // Remove from failed jobs
                DB::table('failed_jobs')->where('id', $id)->delete();

                return $this->successResponse(null, 'Job retried successfully');
            } catch (\Exception $e) {
                return $this->errorResponse('Failed to retry job: ' . $e->getMessage());
            }
        }, 'retry_failed_job');
    }

    /**
     * Delete a failed job
     */
    public function deleteFailedJob(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $deleted = DB::table('failed_jobs')->where('id', $id)->delete();
            
            if (!$deleted) {
                return $this->errorResponse('Failed job not found', 404);
            }

            return $this->successResponse(null, 'Failed job deleted successfully');
        }, 'delete_failed_job');
    }

    /**
     * Clear all failed jobs
     */
    public function clearAllFailedJobs(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $deletedCount = DB::table('failed_jobs')->delete();

            return $this->successResponse([
                'deleted_count' => $deletedCount
            ], "Cleared {$deletedCount} failed jobs successfully");
        }, 'clear_failed_jobs');
    }

    /**
     * Delete a pending job
     */
    public function deletePendingJob(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $deleted = DB::table('jobs')->where('id', $id)->delete();
            
            if (!$deleted) {
                return $this->errorResponse('Job not found', 404);
            }

            return $this->successResponse(null, 'Job deleted successfully');
        }, 'delete_pending_job');
    }

    /**
     * Clear all pending jobs
     */
    public function clearAllPendingJobs(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $deletedCount = DB::table('jobs')->delete();

            return $this->successResponse([
                'deleted_count' => $deletedCount
            ], "Cleared {$deletedCount} pending jobs successfully");
        }, 'clear_pending_jobs');
    }

    /**
     * Get job detail
     */
    public function getJobDetail(string $type, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($type, $id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $table = $type === 'failed' ? 'failed_jobs' : 'jobs';
            $job = DB::table($table)->where('id', $id)->first();
            
            if (!$job) {
                return $this->errorResponse('Job not found', 404);
            }

            $payload = json_decode($job->payload, true);
            
            $jobDetail = [
                'id' => $job->id,
                'type' => $type,
                'queue' => $job->queue,
                'job_class' => $payload['displayName'] ?? 'Unknown',
                'payload' => $payload,
                'created_at' => $job->created_at ?? null,
            ];

            if ($type === 'failed') {
                $jobDetail['uuid'] = $job->uuid;
                $jobDetail['connection'] = $job->connection;
                $jobDetail['failed_at'] = $job->failed_at;
                $jobDetail['exception'] = $job->exception;
            } else {
                $jobDetail['attempts'] = $job->attempts;
                $jobDetail['reserved_at'] = $job->reserved_at;
                $jobDetail['available_at'] = $job->available_at;
            }

            return $this->successResponse($jobDetail, 'Job detail retrieved successfully');
        }, 'view_job_detail');
    }
}

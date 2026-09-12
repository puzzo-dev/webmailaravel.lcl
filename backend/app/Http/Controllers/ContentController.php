<?php

namespace App\Http\Controllers;


use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ContentController extends Controller
{
    /**
     * Display a listing of the resource
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = $request->input('per_page', 15);
            $page = $request->input('page', 1);
            
            // Check if user is admin
            if (Auth::user()->hasRole('admin')) {
                // Admin sees all contents
                $query = Content::with(['user']);
                $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
                
                return $this->paginatedResponse($results, 'All contents retrieved successfully');
            } else {
                // Regular users see only their contents
                $query = Content::where('user_id', Auth::id());
                $results = $query->paginate($perPage, ['*'], 'page', $page);
                
                return $this->paginatedResponse($results, 'Contents retrieved successfully');
            }
        }, 'list_contents');
    }

    /**
     * Get the model class for this controller
     */
    protected function getModelClass(): string
    {
        return Content::class;
    }

    /**
     * Get the resource name for messages
     */
    protected function getResourceName(): string
    {
        return 'content';
    }

    /**
     * Get validation rules for store operation
     */
    protected function getStoreRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'nullable|string',
            'html_body' => 'nullable|string',
            'text_body' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get validation rules for update operation
     */
    protected function getUpdateRules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'body' => 'nullable|string',
            'html_body' => 'nullable|string',
            'text_body' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ];
    }

    /**
     * Get relationships to load with the resource
     */
    protected function getRelationships(): array
    {
        return ['user'];
    }

    /**
     * Get additional context for logging
     */
    protected function getLogContext(): array
    {
        return ['content_type' => 'email'];
    }

    /**
     * Store a newly created resource.
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            $this->getStoreRules(),
            function ($data) use ($request) {
                $data['user_id'] = Auth::id();

                $content = Content::create($data);
                
                return $this->createdResponse($content->load($this->getRelationships()), 'Content created successfully');
            },
            'create_content'
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $content = Content::with($this->getRelationships())->findOrFail($id);
            
            if (!$this->canAccessResource($content)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            return $this->successResponse($content, 'Content retrieved successfully');
        }, 'view_content');
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            $this->getUpdateRules(),
            function ($data) use ($request, $id) {
                $content = Content::findOrFail($id);
                
                if (!$this->canAccessResource($content)) {
                    return $this->forbiddenResponse('Access denied');
                }
                
                $content->update($data);
                
                return $this->successResponse($content->load($this->getRelationships()), 'Content updated successfully');
            },
            'update_content'
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $content = Content::findOrFail($id);
            
            if (!$this->canAccessResource($content)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $content->delete();
            
            return $this->successResponse(null, 'Content deleted successfully');
        }, 'delete_content');
    }

    /**
     * Custom method for content preview
     */
    public function preview(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $content = Content::with($this->getRelationships())->findOrFail($id);

            if (!$this->canAccessResource($content)) {
                return $this->forbiddenResponse('Access denied');
            }

            // Generate preview data
            $previewData = [
                'id' => $content->id,
                'name' => $content->name,
                'subject' => $content->subject,
                'html_body' => $content->html_body ?? $content->body,
                'preview_text' => strip_tags($content->html_body ?? $content->body ?? '')
            ];

            return $this->successResponse($previewData, 'Content preview generated successfully');
        }, 'preview_content');
    }

    /**
     * Custom method for content duplication
     */
    public function duplicate(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $originalContent = Content::findOrFail($id);

            if (!$this->canAccessResource($originalContent)) {
                return $this->forbiddenResponse('Access denied');
            }

            $duplicatedContent = Content::create([
                'name' => $originalContent->name . ' (Copy)',
                'subject' => $originalContent->subject,
                'body' => $originalContent->body,
                'html_body' => $originalContent->html_body,
                'text_body' => $originalContent->text_body,
                'is_active' => true,
                'user_id' => auth()->id()
            ]);

            $this->logResourceCreated('content', $duplicatedContent->id, ['duplicated_from' => $id]);

            return $this->createdResponse(
                $duplicatedContent->load($this->getRelationships()),
                'Content duplicated successfully'
            );
        }, 'duplicate_content');
    }

    /**
     * Generate preview HTML
     */
    private function generatePreviewHtml(string $body): string
    {
        // Simple HTML generation for preview
        return '<div class="preview-content">' . htmlspecialchars($body) . '</div>';
    }

    /**
     * Generate preview text
     */
    private function generatePreviewText(string $body): string
    {
        // Strip HTML tags for text preview
        return strip_tags($body);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ContentController extends BaseController
{
    /**
     * Display a listing of the resource
     */
    public function index(): JsonResponse
    {
        return $this->executeControllerMethod(function () {
            $query = Content::where('user_id', Auth::id())
                ->with(['campaign'])
                ->orderBy('created_at', 'desc');

            return $this->getPaginatedResults($query, request(), 'contents', ['campaign']);
        }, 'list_contents');
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'html_body' => 'nullable|string',
                'text_body' => 'nullable|string',
                'campaign_id' => 'required|exists:campaigns,id'
            ],
            function () use ($request) {
                $data = $request->validated();
                $data['user_id'] = Auth::id();

                $content = Content::create($data);
                return $this->createdResponse($content, 'Content created successfully');
            },
            'create_content'
        );
    }

    /**
     * Display the specified resource
     */
    public function show(Content $content): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($content),
            fn() => $this->getResource($content, 'content', $content->id),
            'view_content'
        );
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, Content $content): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:255',
                'body' => 'sometimes|string',
                'html_body' => 'nullable|string',
                'text_body' => 'nullable|string',
            ],
            fn() => $this->authorizeResourceAccess($content),
            function () use ($request, $content) {
                $content->update($request->validated());
                return $this->updateResponse($content, 'Content updated successfully');
            },
            'update_content'
        );
    }

    /**
     * Remove the specified resource
     */
    public function destroy(Content $content): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($content),
            function () use ($content) {
                $content->delete();
                return $this->deleteResponse('Content deleted successfully');
            },
            'delete_content'
        );
    }

    /**
     * Send test email
     */
    public function sendTestEmail(Request $request, Content $content): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'test_email' => 'required|email',
                'sender_id' => 'required|exists:senders,id'
            ],
            fn() => $this->authorizeResourceAccess($content),
            function () use ($request, $content) {
                $testEmail = $request->input('test_email');
                $senderId = $request->input('sender_id');

                // Send test email logic here
                $result = $this->sendTestEmailLogic($content, $testEmail, $senderId);

                if ($result['success']) {
                    return $this->actionResponse(null, 'Test email sent successfully');
                }

                return $this->errorResponse('Failed to send test email', $result['error']);
            },
            'send_test_email'
        );
    }

    /**
     * Send test email logic
     */
    private function sendTestEmailLogic(Content $content, string $testEmail, int $senderId): array
    {
        try {
            // Implementation for sending test email
            return ['success' => true];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
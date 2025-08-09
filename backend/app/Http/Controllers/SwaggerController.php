<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="Email Campaign Management API",
 *     version="1.0.0",
 *     description="Comprehensive API for managing email campaigns, users, analytics, domains, senders, and more. This system provides enterprise-grade email marketing capabilities with advanced tracking, analytics, and management features.",
 *     @OA\Contact(
 *         email="support@example.com",
 *         name="API Support Team"
 *     ),
 *     @OA\License(
 *         name="MIT",
 *         url="https://opensource.org/licenses/MIT"
 *     )
 * )
 * 
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="API Server"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="bearer_token",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="JWT Bearer token authentication. Include the token in the Authorization header as 'Bearer {token}'"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="api_key",
 *     type="apiKey",
 *     in="header",
 *     name="X-API-Key",
 *     description="API Key authentication for external integrations"
 * )
 * 
 * @OA\Tag(
 *     name="Authentication",
 *     description="User authentication and session management"
 * )
 * 
 * @OA\Tag(
 *     name="Campaigns",
 *     description="Email campaign creation, management, and sending"
 * )
 * 
 * @OA\Tag(
 *     name="Analytics",
 *     description="Campaign analytics, tracking, and performance metrics"
 * )
 * 
 * @OA\Tag(
 *     name="Users",
 *     description="User management and profile operations"
 * )
 * 
 * @OA\Tag(
 *     name="Domains",
 *     description="Domain management and verification"
 * )
 * 
 * @OA\Tag(
 *     name="Senders",
 *     description="Sender identity management and verification"
 * )
 * 
 * @OA\Tag(
 *     name="Suppression",
 *     description="Suppression list management and bounce handling"
 * )
 * 
 * @OA\Tag(
 *     name="Billing",
 *     description="Subscription and billing management"
 * )
 * 
 * @OA\Tag(
 *     name="Admin",
 *     description="Administrative operations and system management"
 * )
 * 
 * @OA\Tag(
 *     name="Tracking",
 *     description="Email tracking endpoints (opens, clicks, unsubscribes)"
 * )
 * 
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     title="User",
 *     description="User object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="John Doe"),
 *     @OA\Property(property="email", type="string", format="email", example="john@example.com"),
 *     @OA\Property(property="role", type="string", example="user"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 *     schema="Campaign",
 *     type="object",
 *     title="Campaign",
 *     description="Email campaign object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Summer Sale Campaign"),
 *     @OA\Property(property="subject", type="string", example="Don't miss our summer sale!"),
 *     @OA\Property(property="status", type="string", enum={"draft", "scheduled", "sending", "sent", "paused", "failed"}, example="draft"),
 *     @OA\Property(property="sender_id", type="integer", example=1),
 *     @OA\Property(property="domain_id", type="integer", example=1),
 *     @OA\Property(property="recipients_count", type="integer", example=1000),
 *     @OA\Property(property="sent_count", type="integer", example=950),
 *     @OA\Property(property="opens_count", type="integer", example=380),
 *     @OA\Property(property="clicks_count", type="integer", example=95),
 *     @OA\Property(property="bounces_count", type="integer", example=15),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 *     schema="Domain",
 *     type="object",
 *     title="Domain",
 *     description="Email domain object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="domain", type="string", example="example.com"),
 *     @OA\Property(property="status", type="string", enum={"pending", "verified", "failed"}, example="verified"),
 *     @OA\Property(property="dkim_verified", type="boolean", example=true),
 *     @OA\Property(property="spf_verified", type="boolean", example=true),
 *     @OA\Property(property="dmarc_verified", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 *     schema="Sender",
 *     type="object",
 *     title="Sender",
 *     description="Email sender object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="John Doe"),
 *     @OA\Property(property="email", type="string", format="email", example="john@example.com"),
 *     @OA\Property(property="domain_id", type="integer", example=1),
 *     @OA\Property(property="status", type="string", enum={"pending", "verified", "failed"}, example="verified"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 *     schema="ApiResponse",
 *     type="object",
 *     title="API Response",
 *     description="Standard API response format",
 *     @OA\Property(property="success", type="boolean", example=true),
 *     @OA\Property(property="message", type="string", example="Operation completed successfully"),
 *     @OA\Property(property="data", type="object", description="Response data"),
 *     @OA\Property(property="errors", type="array", @OA\Items(type="string"), description="Error messages if any")
 * )
 * 
 * @OA\Schema(
 *     schema="PaginatedResponse",
 *     type="object",
 *     title="Paginated Response",
 *     description="Paginated API response format",
 *     @OA\Property(property="data", type="array", @OA\Items(type="object"), description="Array of data items"),
 *     @OA\Property(
 *         property="meta",
 *         type="object",
 *         @OA\Property(property="current_page", type="integer", example=1),
 *         @OA\Property(property="last_page", type="integer", example=10),
 *         @OA\Property(property="per_page", type="integer", example=15),
 *         @OA\Property(property="total", type="integer", example=150),
 *         @OA\Property(property="from", type="integer", example=1),
 *         @OA\Property(property="to", type="integer", example=15)
 *     ),
 *     @OA\Property(
 *         property="links",
 *         type="object",
 *         @OA\Property(property="first", type="string", example="http://example.com/api/campaigns?page=1"),
 *         @OA\Property(property="last", type="string", example="http://example.com/api/campaigns?page=10"),
 *         @OA\Property(property="prev", type="string", nullable=true, example=null),
 *         @OA\Property(property="next", type="string", example="http://example.com/api/campaigns?page=2")
 *     )
 * )
 * 
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *     title="Validation Error",
 *     description="Validation error response",
 *     @OA\Property(property="message", type="string", example="The given data was invalid."),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         @OA\Property(
 *             property="email",
 *             type="array",
 *             @OA\Items(type="string", example="The email field is required.")
 *         )
 *     )
 * )
 */
class SwaggerController extends Controller
{
    /**
     * Display the Swagger UI documentation
     */
    public function index()
    {
        // Redirect to l5-swagger documentation
        return redirect('/api/documentation');
    }

    /**
     * Return the OpenAPI JSON specification
     */
    public function json()
    {
        // Return the generated swagger JSON
        $swagger = \OpenApi\Generator::scan([
            app_path('Http/Controllers'),
            app_path('Models'),
        ]);
        
        return response()->json($swagger->toArray());
    }
}

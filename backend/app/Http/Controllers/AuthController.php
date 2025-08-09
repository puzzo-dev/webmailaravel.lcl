<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Services\NotificationService;
use App\Models\User;
use OpenApi\Annotations as OA;

class AuthController extends Controller
{
    public function __construct()
    {
        // $this->middleware('auth:api', ['except' => ['login', 'register', 'forgotPassword', 'resetPassword']]);
    }

    /**
     * @OA\Post(
     *     path="/api/auth/login",
     *     tags={"Authentication"},
     *     summary="User login",
     *     description="Authenticate user with email/username and password, returns JWT token",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"identifier", "password"},
     *             @OA\Property(property="identifier", type="string", example="user@example.com", description="Email or username"),
     *             @OA\Property(property="password", type="string", format="password", example="password123"),
     *             @OA\Property(property="remember", type="boolean", example=false, description="Remember user session")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Login successful"),
     *             @OA\Property(property="token", type="string", example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."),
     *             @OA\Property(property="token_type", type="string", example="bearer"),
     *             @OA\Property(property="expires_in", type="integer", example=3600),
     *             @OA\Property(property="user", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Invalid credentials")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ValidationError")
     *     )
     * )
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $identifier = $request->identifier;
        $password = $request->password;

        // Try to authenticate with email or username
        $user = User::where('email', $identifier)
                   ->orWhere('username', $identifier)
                   ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        try {
            // Generate JWT token
            $token = JWTAuth::fromUser($user);
            
            // Set the JWT token in a secure HTTP-only cookie
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl'), // TTL in minutes
                '/', // Path
                null, // Domain
                request()->secure(), // Secure flag (true for HTTPS)
                true, // HTTP only
                false, // Raw
                'Lax' // SameSite
            );

            // Send login notification
            $notificationService = app(NotificationService::class);
            $loginData = [
                'device' => $request->header('User-Agent') ?? 'Unknown',
                'ip' => $request->ip(),
                'location' => 'Unknown', // Could be enhanced with IP geolocation
                'time' => now()->format('Y-m-d H:i:s')
            ];
            $notificationService->sendLoginNotification($user, $loginData);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $user,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60 // Convert to seconds
                ]
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'user',
        ]);

        try {
            // Generate JWT token
            $token = JWTAuth::fromUser($user);
            
            // Set the JWT token in a secure HTTP-only cookie
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl'), // TTL in minutes
                '/', // Path
                null, // Domain
                request()->secure(), // Secure flag (true for HTTPS)
                true, // HTTP only
                false, // Raw
                'Lax' // SameSite
            );

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'user' => $user,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60 // Convert to seconds
                ]
            ], 201)->withCookie($cookie);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Try to get the token and invalidate it if it exists
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }
            
            // Clear the JWT cookie regardless of token validity
            $cookie = cookie()->forget('jwt_token');
            
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            // Even if token invalidation fails, clear the cookie
            $cookie = cookie()->forget('jwt_token');
            
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ])->withCookie($cookie);
        }
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'User profile retrieved',
            'data' => [
                'user' => $request->user()
            ]
        ]);
    }

    public function refresh(Request $request)
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            
            // Set the new JWT token in a secure HTTP-only cookie
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl'), // TTL in minutes
                '/', // Path
                null, // Domain
                request()->secure(), // Secure flag (true for HTTPS)
                true, // HTTP only
                false, // Raw
                'Lax' // SameSite
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60 // Convert to seconds
                ]
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not refresh token - please login again'
            ], 401);
        }
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Generate password reset token
            $token = \Illuminate\Support\Str::random(64);
            
            // Store the token in database (you may want to create a password_resets table)
            // For now, we'll use the remember_token field as a temporary solution
            $user->remember_token = $token;
            $user->save();
            
            // In a production environment, you would send an email here
            // For now, we'll just return success
            // You can integrate with your mail service later
            
            \Log::info('Password reset requested', [
                'email' => $request->email,
                'token' => $token,
                'reset_url' => url("/reset-password?token={$token}&email=" . urlencode($request->email))
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email',
                'data' => [
                    'reset_url' => url("/reset-password?token={$token}&email=" . urlencode($request->email))
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Forgot password error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process password reset request'
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Verify the token
            if ($user->remember_token !== $request->token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token'
                ], 400);
            }

            // Update the password
            $user->password = Hash::make($request->password);
            $user->remember_token = null; // Clear the reset token
            $user->save();

            \Log::info('Password reset completed', [
                'email' => $request->email,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Reset password error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset password'
            ], 500);
        }
    }
} 
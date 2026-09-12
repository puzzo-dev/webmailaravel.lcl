<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use App\Services\NotificationService;
use App\Services\AuthService;
use App\Services\UserAgentParser;
use App\Traits\GeoIPTrait;
use App\Models\User;

class AuthController extends Controller
{
    use GeoIPTrait;

    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Create a secure HTTP-only JWT cookie.
     */
    private function createJwtCookie(string $token)
    {
        return cookie(
            'jwt_token',
            $token,
            config('jwt.ttl'),
            '/',
            null,
            request()->secure(),
            true,
            false,
            'Lax'
        );
    }

    /**
     * Build the standard login/register success response with cookie.
     */
    private function buildAuthResponse(User $user, string $message, int $statusCode = 200): \Illuminate\Http\JsonResponse
    {
        try {
            $token = JWTAuth::fromUser($user);
            $cookie = $this->createJwtCookie($token);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'user' => $user,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                ],
            ], $statusCode)->withCookie($cookie);
        } catch (JWTException $e) {
            return $this->errorResponse('Could not create token', 500);
        }
    }

    /**
     * Send login notification with device/location context.
     */
    private function sendLoginNotification(User $user, Request $request): void
    {
        $notificationService = app(NotificationService::class);
        $deviceInfo = UserAgentParser::parse($request->header('User-Agent'));
        $locationData = $this->getLocation($request->ip());

        $location = 'Unknown';
        if ($locationData['success']) {
            $location = trim(implode(', ', array_filter([
                $locationData['city'] ?? null,
                $locationData['state_name'] ?? $locationData['state'] ?? null,
                $locationData['country_name'] ?? $locationData['country'] ?? null,
            ])));
            if (empty($location)) {
                $location = $locationData['country_name'] ?? $locationData['country'] ?? 'Unknown';
            }
        }

        $notificationService->sendLoginNotification($user, [
            'device' => $deviceInfo['combined'],
            'ip' => $request->ip(),
            'location' => $location,
            'time' => now()->format('Y-m-d H:i:s'),
            'browser' => $deviceInfo['browser'],
            'os' => $deviceInfo['os'],
            'device_type' => $deviceInfo['device'],
        ]);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $identifier = $request->identifier;
        $password = $request->password;

        $user = User::where('email', $identifier)
                   ->orWhere('username', $identifier)
                   ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        $this->sendLoginNotification($user, $request);

        return $this->buildAuthResponse($user, 'Login successful');
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
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'user',
        ]);

        $user->sendEmailVerificationNotification();

        return $this->buildAuthResponse($user, 'Registration successful', 201);
    }

    public function logout(Request $request)
    {
        try {
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }
        } catch (JWTException $e) {
            // Token may already be invalid — clear cookie regardless
        }

        $cookie = cookie()->forget('jwt_token');

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ])->withCookie($cookie);
    }

    public function me(Request $request)
    {
        return $this->successResponse(
            ['user' => $request->user()],
            'User profile retrieved'
        );
    }

    public function refresh(Request $request)
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            $cookie = $this->createJwtCookie($token);

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                ],
            ])->withCookie($cookie);
        } catch (JWTException $e) {
            return $this->errorResponse('Could not refresh token - please login again', 401);
        }
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        return $this->executeWithErrorHandling(function () use ($request) {
            $result = $this->authService->requestPasswordReset($request->email, $request);

            if (!$result['success']) {
                return $this->errorResponse($result['message'], 404);
            }

            return $result;
        }, 'forgot_password');
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        return $this->executeWithErrorHandling(function () use ($request) {
            $result = $this->authService->resetPassword(
                $request->token,
                $request->email,
                $request->password,
                $request
            );

            if (!$result['success']) {
                return $this->errorResponse($result['message'], 400);
            }

            return $result;
        }, 'reset_password');
    }

    public function sendVerification(Request $request)
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = $request->user();

            if (!$user) {
                return $this->errorResponse('User not authenticated', 401);
            }

            $result = $this->authService->sendEmailVerification($user, $request);

            if (!$result['success']) {
                return $this->errorResponse($result['message'], 400);
            }

            return $result;
        }, 'send_verification');
    }

    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return $this->errorResponse('Invalid verification link', 400);
        }

        if ($user->hasVerifiedEmail()) {
            return $this->successResponse(null, 'Email already verified');
        }

        $user->markEmailAsVerified();

        return $this->successResponse(null, 'Email verified successfully');
    }

    public function resendVerificationEmail(Request $request)
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = $request->user();

            if (!$user) {
                return $this->errorResponse('User not authenticated', 401);
            }

            if ($user->hasVerifiedEmail()) {
                return ['message' => 'Email already verified'];
            }

            $user->sendEmailVerificationNotification();

            return ['message' => 'Verification link sent'];
        }, 'resend_verification');
    }

    /**
     * Legacy alias for resendVerificationEmail.
     */
    public function resendVerification(Request $request)
    {
        return $this->resendVerificationEmail($request);
    }
}

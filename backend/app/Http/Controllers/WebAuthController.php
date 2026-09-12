<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Services\AuthService;
use Inertia\Inertia;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class WebAuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Show the login page.
     */
    public function showLogin(Request $request)
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    /**
     * Show the registration page.
     */
    public function showRegister(Request $request)
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Register');
    }

    /**
     * Handle a login request via Inertia (session-based).
     *
     * Also sets a jwt_token cookie so that API routes (which use the
     * auth:api guard with JWTFromCookie middleware) can authenticate
     * requests made by the Inertia frontend via axios.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors())->withInput($request->only('identifier'));
        }

        $credentials = $this->resolveCredentials($request->only('identifier', 'password'));
        $remember = (bool) $request->boolean('remember');

        if (!Auth::guard('web')->attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'auth' => 'Invalid credentials.',
            ]);
        }

        $request->session()->regenerate();

        // Generate a JWT token and set it as a cookie so the Inertia
        // frontend's axios calls to /api/* routes are authenticated.
        $response = redirect()->intended(route('dashboard'));
        $this->attachJwtCookie($response, $request->user());

        return $response;
    }

    /**
     * Handle a registration request via Inertia (session-based).
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors())->withInput($request->only('name', 'username', 'email'));
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'status' => 'active',
        ]);

        Auth::guard('web')->login($user);

        $response = redirect()->route('dashboard');
        $this->attachJwtCookie($response, $user);

        return $response;
    }

    /**
     * Log the user out (session-based).
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $response = redirect()->route('login');

        // Also clear the JWT cookie
        $response->withCookie(cookie('jwt_token', '', -1));

        return $response;
    }

    /**
     * Resolve identifier into email/username field for Auth::attempt.
     */
    private function resolveCredentials(array $input): array
    {
        $identifier = $input['identifier'];
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        return [
            $field => $identifier,
            'password' => $input['password'],
        ];
    }

    /**
     * Generate a JWT token for the user and attach it as a cookie
     * to the response, enabling API authentication from the Inertia frontend.
     */
    private function attachJwtCookie($response, User $user): void
    {
        try {
            $token = JWTAuth::fromUser($user);
            $cookie = cookie(
                'jwt_token',
                $token,
                config('jwt.ttl', 60),
                '/',
                null,
                request()->secure(),
                true,   // httpOnly
                false,
                'Lax'
            );
            $response->withCookie($cookie);
        } catch (\Exception $e) {
            // If JWT generation fails, the web session still works;
            // API calls from the frontend will simply need to fall back
            // to session-based auth or re-authenticate via the API.
        }
    }
}

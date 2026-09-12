<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => function () use ($request) {
                $user = $request->user('web');
                if (!$user) {
                    return ['user' => null];
                }

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'username' => $user->username,
                        'role' => $user->role,
                        'status' => $user->status,
                        'billing_status' => $user->billing_status,
                        'two_factor_enabled' => $user->two_factor_enabled,
                        'telegram_notifications_enabled' => $user->telegram_notifications_enabled,
                        'email_notifications_enabled' => $user->email_notifications_enabled,
                    ],
                ];
            },
            'flash' => function () use ($request) {
                return [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'),
                    'warning' => $request->session()->get('warning'),
                    'info' => $request->session()->get('info'),
                ];
            },
            'errors' => function () use ($request) {
                return $this->resolveValidationErrors($request);
            },
        ];
    }

    /**
     * Resolve validation errors from the session.
     */
    public function resolveValidationErrors(Request $request): array
    {
        if (!$request->session()->has('errors')) {
            return [];
        }

        $errors = $request->session()->get('errors');

        if ($errors instanceof \Illuminate\Support\MessageBag) {
            return $errors->getMessages();
        }

        if (is_array($errors)) {
            return $errors;
        }

        return [];
    }
}

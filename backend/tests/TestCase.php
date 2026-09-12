<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Inertia\Inertia;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Inertia checks that page component files exist, but our pages are
        // JSX files resolved via Vite, not Blade views. Disable the check
        // in tests.
        Inertia::setRootView('app');
        config(['inertia.testing.ensure_pages_exist' => false]);
    }
}

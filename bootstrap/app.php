<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\IsSuperAdmin;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $isTesting = env('APP_ENV') === 'testing';

        // Railway terminates TLS before forwarding requests to this container.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );

        $csrfExcept = [
            'categories',
            'categories/*',
            'admin/categories',
            'admin/categories/*',
            // Guest birth-list gift actions (shared link, no account)
            'liste/*',
        ];

        if ($isTesting) {
            $csrfExcept[] = '*';
        }

        $middleware->validateCsrfTokens(except: $csrfExcept);

        // 🔒 Cookie exceptions
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // ✅ Register all aliases in a single call
        $middleware->alias([
            'admin' => IsAdmin::class,
            'super_admin' => IsSuperAdmin::class,
            'role' => CheckRole::class,
            'spatie_role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
        ]);

        // 🌐 Web middleware stack
        $middleware->web(append: [

            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // 🌍 CORS configuration for API routes
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();

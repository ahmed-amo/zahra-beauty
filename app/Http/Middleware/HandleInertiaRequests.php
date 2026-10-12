<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Support\ShopHomeCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return null;
    }

    public function share(Request $request): array
    {
        $locale = app()->getLocale();
        $user = $request->user();
        $isAdmin = $user && $user->role === 'admin';

        return [
            ...parent::share($request),
            'flash' => [
                'review_submitted' => $request->session()->pull('review_submitted'),
                'success' => $request->session()->pull('success'),
                'reservation_token' => $request->session()->pull('reservation_token'),
            ],
            'name' => config('app.name'),
            'locale' => $locale,
            'direction' => $locale === 'ar' ? 'rtl' : 'ltr',
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => method_exists($user, 'uiRole') ? $user->uiRole() : $user->role,
                    'is_super_admin' => method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin(),
                    'picture' => $user->avatarDisplayUrl(),
                    'avatar' => $user->avatar,
                    'phone' => $user->phone,
                    'phone_country_dial' => $user->phone_country_dial,
                    'address' => $user->address,
                ] : null,
            ],
            'adminNotifications' => fn () => ($isAdmin && $request->is('admin', 'admin/*'))
                ? [
                    'unreadCount' => $user->unreadNotifications()->count(),
                    'items' => $user->notifications()
                        ->latest()
                        ->limit(5)
                        ->get()
                        ->map(fn ($notification): array => [
                            'id' => $notification->id,
                            'read_at' => $notification->read_at,
                            'created_at' => optional($notification->created_at)->toDateTimeString(),
                            'data' => $notification->data,
                        ]),
                ]
                : null,
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->cookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'navCategories' => fn () => Cache::remember(ShopHomeCache::NAV_KEY, 300, fn () => Category::query()
                ->active()
                ->topLevel()
                ->with(['children' => fn ($query) => $query->active()])
                ->ordered()
                ->get()
                ->map(fn (Category $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'image_url' => $c->imageUrl(),
                    'children' => $c->children
                        ->map(fn (Category $child) => [
                            'id' => $child->id,
                            'name' => $child->name,
                            'slug' => $child->slug,
                            'image_url' => $child->imageUrl(),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all()),
        ];
    }
}

<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Cache keys + invalidation for the shop home Inertia payload and the
 * category tree shared with every page's header nav.
 * Uses the app default cache store (set CACHE_STORE=redis in .env to use Redis).
 */
final class ShopHomeCache
{
    public const KEY = 'shop.home.index.v5';

    public const NAV_KEY = 'nav_categories_v5';

    public static function forget(): void
    {
        Cache::forget(self::KEY);
        Cache::forget(self::NAV_KEY);
    }
}

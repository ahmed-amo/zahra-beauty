<?php

use App\Http\Controllers\Admin\AttributeController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\SalesController;
use App\Http\Controllers\Admin\HeroController;
use App\Http\Controllers\Admin\SearchController as AdminSearchController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ProductGalleryBladeController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Shop\HomeController;
use App\Http\Controllers\Shop\ProductReviewController;
use App\Http\Controllers\Shop\SearchController;
use App\Http\Controllers\User\CategoryController;
use App\Http\Controllers\User\ClientDashboardController;
use App\Http\Controllers\User\OrderController;
use App\Http\Controllers\User\ProductController;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// PUBLIC ROUTES
Route::get('/', [HomeController::class, 'index'])
    ->name('home');

Route::get('/shop', [HomeController::class, 'index'])
    ->name('shop');

Route::get('/categories', [HomeController::class, 'get_categories'])
    ->name('categories');

Route::get('/products', [HomeController::class, 'all_products'])
    ->name('shop.products');

Route::get('/search', [SearchController::class, 'index'])->name('search');

Route::get('/product/{product:slug}', [ProductController::class, 'get_product_detail'])
    ->name('product_detail');

/** Optional Blade demo: R2 gallery URLs (remove route if unused). */
Route::get('/product/{product:slug}/gallery-blade', [ProductGalleryBladeController::class, 'show'])
    ->name('product.gallery.blade');

Route::post('/product/{product:slug}/reviews', [ProductReviewController::class, 'store'])
    ->middleware('auth')
    ->name('shop.reviews.store');

Route::post('/orders/{orderNumber}/reviews', [ProductReviewController::class, 'storeFromOrder'])
    ->name('orders.reviews.store');

Route::get('/product', function () {
    return Inertia::render('ProductDetail');
})->name('product');

Route::get('/category/{category:slug}', [HomeController::class, 'get_category_products'])
    ->name('category.show');

// Checkout & order success (allow guests)
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/orders/success/{orderNumber}', [CheckoutController::class, 'success'])->name('orders.success');

// Algeria COD location cascade (static dataset — no third-party API)
Route::get('/algeria/wilayas', [\App\Http\Controllers\AlgeriaLocationController::class, 'wilayas'])
    ->name('algeria.wilayas');
Route::get('/algeria/wilayas/{wilayaCode}/communes', [\App\Http\Controllers\AlgeriaLocationController::class, 'communes'])
    ->name('algeria.communes');

// Google OAuth callback view (Inertia page — legacy token flow)
Route::get('/auth/callback', function () {
    return Inertia::render('AuthCallback');
})->name('auth.callback');

// Social OAuth start (web — session state for Socialite)
Route::get('/auth/{provider}', [SocialAuthController::class, 'redirect'])
    ->whereIn('provider', ['google', 'facebook'])
    ->name('auth.social');

// Social OAuth callbacks (web — Socialite redirect URIs)
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])
    ->whereIn('provider', ['google', 'facebook'])
    ->name('auth.social.callback.web');

Route::get('/auth/google/callback', fn () => app(SocialAuthController::class)->callback('google'))
    ->name('auth.google.callback.web');

Route::get('/auth/facebook/callback', fn () => app(SocialAuthController::class)->callback('facebook'))
    ->name('auth.facebook.callback.web');

Route::post('/locale/{locale}', function (string $locale) {
    if (! in_array($locale, ['fr', 'en', 'ar'], true)) {
        abort(404);
    }

    session(['locale' => $locale]);

    return back();
})->name('locale.switch');

// PROTECTED ROUTES
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::redirect('/settings', '/settings/profile');
    Route::get('/settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('/settings/password', [PasswordController::class, 'update'])->name('password.update');

    // CLIENT ROUTES
    Route::get('/home', [HomeController::class, 'index'])
        ->name('ClientHome');

    Route::prefix('client')->group(function () {
        Route::get('/dashboard', ClientDashboardController::class)->name('client-dashboard');

        Route::get('/profile', function (Request $request) {
            $user = $request->user();

            return Inertia::render('Dashboard/Client/Profile', [
                'user' => $user ? $user->only(['id', 'name', 'email', 'phone', 'address', 'picture', 'avatar']) : null,
                'mustVerifyEmail' => $user instanceof MustVerifyEmail,
                'status' => $request->session()->get('status'),
            ]);
        })->name('client.profile');

        Route::patch('/profile', [ProfileController::class, 'update'])->name('client.profile.update');
        Route::post('/profile/picture', [ProfileController::class, 'picture'])->name('client.profile.picture');

        Route::get('/wishlist', function () {
            return Inertia::render('Dashboard/Client/WishList');
        })->name('client-wishlist');

        // Order Routes
        Route::get('/my-orders', [OrderController::class, 'myOrders'])->name('orders.index');
    });

    // ADMIN ROUTES
    Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
        Route::post('/notifications/read-all', function () {
            $user = request()->user();
            if ($user) {
                $user->unreadNotifications->markAsRead();
            }

            return back();
        })->name('admin.notifications.readAll');

        Route::middleware('super_admin')->group(function () {
            Route::get('/admins', [AdminUserController::class, 'index'])
                ->name('admin.admins.index');
            Route::post('/admins', [AdminUserController::class, 'store'])
                ->name('admin.admins.store');
        });

        // Products CRUD
        Route::get('/products', [ProductController::class, 'index'])
            ->name('admin.products');

        Route::get('/products/add', [ProductController::class, 'create'])
            ->name('admin.products.create');

        Route::post('/products', [ProductController::class, 'store'])
            ->name('admin.products.store');

        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])
            ->name('admin.products.edit');

        Route::put('/products/{product}', [ProductController::class, 'update'])
            ->name('admin.products.update');

        Route::delete('/products/{product}', [ProductController::class, 'destroy'])
            ->name('admin.products.destroy');

        // Categories CRUD
        Route::get('/categories', [CategoryController::class, 'index'])
            ->name('admin.categories');

        Route::get('/categories/add', [CategoryController::class, 'create'])
            ->name('admin.categories.create');

        Route::post('/categories/add', [CategoryController::class, 'store'])
            ->name('admin.categories.store');

        Route::get('/categories/{category}/edit', [CategoryController::class, 'edit'])
            ->name('admin.categories.edit');

        Route::put('/categories/{category}', [CategoryController::class, 'update'])
            ->name('admin.categories.update');

        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
            ->name('admin.categories.destroy');

        // Attributes CRUD
        Route::get('/attributes', [AttributeController::class, 'index'])
            ->name('admin.attributes');

        Route::get('/attributes/add', [AttributeController::class, 'create'])
            ->name('admin.attributes.create');

        Route::post('/attributes', [AttributeController::class, 'store'])
            ->name('admin.attributes.store');

        Route::get('/attributes/{attribute}/edit', [AttributeController::class, 'edit'])
            ->name('admin.attributes.edit');

        Route::put('/attributes/{attribute}', [AttributeController::class, 'update'])
            ->name('admin.attributes.update');

        Route::delete('/attributes/{attribute}', [AttributeController::class, 'destroy'])
            ->name('admin.attributes.destroy');

        Route::get('/customer-orders', [AdminOrderController::class, 'index'])
            ->name('admin.orders');

        Route::put('/customer-orders/{order}/confirm', [AdminOrderController::class, 'confirm'])
            ->name('admin.orders.confirm');

        Route::get('/customers', [CustomerController::class, 'index'])->name('admin.customers');
        Route::get('/customers/{user}', [CustomerController::class, 'show'])->name('admin.customer.detail');
        Route::get('/customers/{user}/json', [CustomerController::class, 'show'])->name('customers.show.json');
        Route::get('/customers/statistics', [CustomerController::class, 'statistics'])->name('customers.statistics');

        Route::get('/dashboard', [CustomerController::class, 'dashboard'])->name('admin.dashboard');

        Route::get('/search', AdminSearchController::class)->name('admin.search');

        Route::get('/sales', [SalesController::class, 'index'])->name('admin.sales');
        Route::patch('/sales/{product}', [SalesController::class, 'update'])->name('admin.sales.update');

        Route::get('/hero', [HeroController::class, 'index'])->name('admin.hero');
        Route::put('/hero/cover', [HeroController::class, 'updateCover'])->name('admin.hero.cover');
        Route::post('/hero/brands', [HeroController::class, 'storeBrand'])->name('admin.hero.brands.store');
        Route::put('/hero/brands/{brand}', [HeroController::class, 'updateBrand'])->name('admin.hero.brands.update');
        Route::delete('/hero/brands/{brand}', [HeroController::class, 'destroyBrand'])->name('admin.hero.brands.destroy');
        Route::put('/hero/products', [HeroController::class, 'syncHero'])->name('admin.hero.sync');
    });
});
require __DIR__.'/auth.php';

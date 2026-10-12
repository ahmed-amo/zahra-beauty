<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Shop\SearchController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/search/suggestions', [SearchController::class, 'suggestions'])
    ->middleware('throttle:120,1');

Route::get('/auth/{provider}', [SocialAuthController::class, 'redirect'])
    ->whereIn('provider', ['google', 'facebook'])
    ->name('auth.social.api');

Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])
    ->whereIn('provider', ['google', 'facebook'])
    ->name('auth.social.callback');

// Alias for older Google button URLs / docs
Route::get('/auth/google', fn () => app(SocialAuthController::class)->redirect('google'))
    ->name('auth.google');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => [
                ...$user->only([
                    'id',
                    'name',
                    'email',
                    'avatar',
                    'phone',
                    'address',
                    'google_id',
                    'facebook_id',
                    'email_verified_at',
                ]),
                'picture' => $user->avatarDisplayUrl(),
                'role' => $user->uiRole(),
            ],
        ]);
    })->name('api.user');

    Route::delete('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    })->name('api.logout');
});

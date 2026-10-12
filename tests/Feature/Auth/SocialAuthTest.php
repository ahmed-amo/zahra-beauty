<?php

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

beforeEach(function () {
    config([
        'services.google.client_id' => 'test-google-client-id',
        'services.google.client_secret' => 'test-google-client-secret',
        'services.google.redirect' => 'http://localhost/auth/google/callback',
    ]);
});

function mockGoogleSocialiteUser(
    string $id = 'google-user-123',
    ?string $email = 'google.user@example.com',
    string $name = 'Google User',
    ?string $avatar = 'https://lh3.googleusercontent.com/a/default=s96-c',
): void {
    $socialUser = Mockery::mock(SocialiteUserContract::class);
    $socialUser->shouldReceive('getId')->andReturn($id);
    $socialUser->shouldReceive('getEmail')->andReturn($email);
    $socialUser->shouldReceive('getName')->andReturn($name);
    $socialUser->shouldReceive('getNickname')->andReturn(null);
    $socialUser->shouldReceive('getAvatar')->andReturn($avatar);

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andReturn($socialUser);
    $provider->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('setHttpClient')->andReturnSelf();

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
}

test('google oauth redirect is blocked when credentials are missing', function () {
    config([
        'services.google.client_id' => '',
        'services.google.client_secret' => '',
    ]);

    $response = $this->get(route('auth.social', ['provider' => 'google']));

    $response->assertRedirect(route('login', ['error' => 'google_oauth_missing']));
    $this->assertGuest();
});

test('google oauth redirect sends users to the provider when configured', function () {
    mockGoogleSocialiteUser();

    $response = $this->get(route('auth.social', ['provider' => 'google']));

    $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
});

test('google oauth callback creates a customer and logs them into a session', function () {
    Mail::fake();
    mockGoogleSocialiteUser();

    $response = $this->get(route('auth.social.callback.web', ['provider' => 'google']));

    $response->assertRedirect(route('home'));
    $this->assertAuthenticated();

    $user = User::query()->where('email', 'google.user@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->google_id)->toBe('google-user-123')
        ->and($user->role)->toBe('client')
        ->and($user->hasRole('customer'))->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull();
});

test('google oauth callback links an existing account by email', function () {
    Mail::fake();

    $existing = User::factory()->create([
        'email' => 'existing@example.com',
        'google_id' => null,
        'role' => 'client',
    ]);
    $existing->assignRole('customer');

    mockGoogleSocialiteUser(
        id: 'google-linked-456',
        email: 'existing@example.com',
        name: 'Existing User',
    );

    $response = $this->get(route('auth.social.callback.web', ['provider' => 'google']));

    $response->assertRedirect(route('home'));
    $this->assertAuthenticatedAs($existing);

    $existing->refresh();
    expect($existing->google_id)->toBe('google-linked-456');
});

test('google oauth callback logs in an existing google-linked user', function () {
    Mail::fake();

    $existing = User::factory()->create([
        'email' => 'linked@example.com',
        'google_id' => 'google-user-123',
        'role' => 'client',
    ]);
    $existing->assignRole('customer');

    mockGoogleSocialiteUser();

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect(route('home'));
    $this->assertAuthenticatedAs($existing);
    expect(User::query()->count())->toBe(1);
});

test('google oauth callback redirects admins to the admin dashboard', function () {
    Mail::fake();

    $admin = User::factory()->create([
        'email' => 'admin.oauth@example.com',
        'google_id' => 'google-admin-1',
        'role' => 'admin',
    ]);

    mockGoogleSocialiteUser(
        id: 'google-admin-1',
        email: 'admin.oauth@example.com',
        name: 'Admin User',
    );

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($admin);
});

function mockFacebookSocialiteUser(
    string $id = 'facebook-user-123',
    ?string $email = 'facebook.user@example.com',
    string $name = 'Facebook User',
    ?string $avatar = 'https://platform-lookaside.fbsbx.com/platform/profilepic/example.jpg',
): void {
    $socialUser = Mockery::mock(SocialiteUserContract::class);
    $socialUser->shouldReceive('getId')->andReturn($id);
    $socialUser->shouldReceive('getEmail')->andReturn($email);
    $socialUser->shouldReceive('getName')->andReturn($name);
    $socialUser->shouldReceive('getNickname')->andReturn(null);
    $socialUser->shouldReceive('getAvatar')->andReturn($avatar);

    $provider = Mockery::mock(\Laravel\Socialite\Two\FacebookProvider::class);
    $provider->shouldReceive('user')->andReturn($socialUser);
    $provider->shouldReceive('redirect')->andReturn(redirect('https://www.facebook.com/v23.0/dialog/oauth'));
    $provider->shouldReceive('stateless')->andReturnSelf();
    $provider->shouldReceive('scopes')->andReturnSelf();
    $provider->shouldReceive('fields')->andReturnSelf();
    $provider->shouldReceive('setHttpClient')->andReturnSelf();

    Socialite::shouldReceive('driver')->with('facebook')->andReturn($provider);
}

test('facebook oauth redirect is blocked when credentials are missing', function () {
    config([
        'services.facebook.client_id' => '',
        'services.facebook.client_secret' => '',
    ]);

    $response = $this->get(route('auth.social', ['provider' => 'facebook']));

    $response->assertRedirect(route('login', ['error' => 'facebook_oauth_missing']));
    $this->assertGuest();
});

test('facebook oauth redirect sends users to the provider when configured', function () {
    config([
        'services.facebook.client_id' => 'test-facebook-client-id',
        'services.facebook.client_secret' => 'test-facebook-client-secret',
        'services.facebook.redirect' => 'http://localhost/auth/facebook/callback',
    ]);

    mockFacebookSocialiteUser();

    $response = $this->get(route('auth.social', ['provider' => 'facebook']));

    $response->assertRedirect('https://www.facebook.com/v23.0/dialog/oauth');
});

test('facebook oauth callback creates a customer and logs them into a session', function () {
    Mail::fake();

    config([
        'services.facebook.client_id' => 'test-facebook-client-id',
        'services.facebook.client_secret' => 'test-facebook-client-secret',
        'services.facebook.redirect' => 'http://localhost/auth/facebook/callback',
    ]);

    mockFacebookSocialiteUser();

    $response = $this->get('/auth/facebook/callback');

    $response->assertRedirect(route('home'));
    $this->assertAuthenticated();

    $user = User::query()->where('email', 'facebook.user@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->facebook_id)->toBe('facebook-user-123')
        ->and($user->role)->toBe('client')
        ->and($user->hasRole('customer'))->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull();
});

test('facebook oauth callback creates a user without email when facebook omits it', function () {
    Mail::fake();

    config([
        'services.facebook.client_id' => 'test-facebook-client-id',
        'services.facebook.client_secret' => 'test-facebook-client-secret',
        'services.facebook.redirect' => 'http://localhost/auth/facebook/callback',
    ]);

    mockFacebookSocialiteUser(
        id: 'facebook-no-email-999',
        email: null,
        name: 'No Email User',
    );

    $response = $this->get('/auth/facebook/callback');

    $response->assertRedirect(route('home'));
    $this->assertAuthenticated();

    $user = User::query()->where('facebook_id', 'facebook-no-email-999')->first();
    expect($user)->not->toBeNull()
        ->and($user->email)->toBe('facebook_facebook-no-email-999@users.bebedome.local');
});

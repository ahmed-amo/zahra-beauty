<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\WelcomeEmail;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\FacebookProvider;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

    public function redirect(string $provider): RedirectResponse
    {
        if (! $this->isSupported($provider)) {
            abort(404);
        }

        if (! $this->credentialsConfigured($provider)) {
            Log::warning("{$provider} OAuth redirect blocked: missing credentials in environment.");

            return redirect()->route('login', ['error' => "{$provider}_oauth_missing"]);
        }

        return $this->driver($provider)->redirect();
    }

    public function callback(string $provider): RedirectResponse
    {
        if (! $this->isSupported($provider)) {
            abort(404);
        }

        try {
            $socialUser = $this->driver($provider)->user();
            $providerIdColumn = $provider === 'google' ? 'google_id' : 'facebook_id';
            $providerId = $socialUser->getId();
            $email = $socialUser->getEmail();
            $name = $socialUser->getName() ?: ($socialUser->getNickname() ?: 'BéBé Dome Customer');
            $avatarUrl = $this->normalizeAvatar($provider, $socialUser->getAvatar());

            if (! $email && ! $providerId) {
                return redirect()->route('login', ['error' => 'oauth_failed']);
            }

            $user = null;

            if ($providerId) {
                $user = User::query()->where($providerIdColumn, $providerId)->first();
            }

            if (! $user && $email) {
                $user = User::query()->where('email', $email)->first();
            }

            if ($user) {
                $changed = false;

                if ($providerId && ! $user->{$providerIdColumn}) {
                    $user->{$providerIdColumn} = $providerId;
                    $changed = true;
                }
                if ($avatarUrl && $user->avatar !== $avatarUrl) {
                    $user->avatar = $avatarUrl;
                    $changed = true;
                }
                if (! $user->email_verified_at && $email) {
                    $user->email_verified_at = now();
                    $changed = true;
                }

                if ($changed) {
                    $user->save();
                }

                if (! $user->isAdmin() && ! $user->hasRole('customer')) {
                    $user->assignRole('customer');
                }
            } else {
                if (! $email) {
                    // Facebook sometimes omits email if the user denies permission.
                    $email = $provider.'_'.$providerId.'@users.bebedome.local';
                }

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    $providerIdColumn => $providerId,
                    'avatar' => $avatarUrl,
                    'password' => null,
                    'role' => 'client',
                ]);

                $user->forceFill(['email_verified_at' => now()])->save();

                $user->assignRole('customer');

                if (! Str::endsWith($email, '@users.bebedome.local')) {
                    // Queue so OAuth callback is not blocked on SMTP.
                    Mail::to($user->email)->queue(new WelcomeEmail($user));
                }
            }

            Auth::login($user, true);
            request()->session()->regenerate();

            return redirect()->intended($this->redirectPathForUser($user));
        } catch (\Throwable $e) {
            Log::error("{$provider} OAuth Error", [
                'message' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return redirect()->route('login', ['error' => 'oauth_failed']);
        }
    }

    private function redirectPathForUser(User $user): string
    {
        if ($user->isAdmin()) {
            return route('admin.dashboard');
        }

        // Clients land on the shop home after Google / Facebook sign-in.
        return route('home');
    }

    private function isSupported(string $provider): bool
    {
        return in_array($provider, self::PROVIDERS, true);
    }

    private function credentialsConfigured(string $provider): bool
    {
        $clientId = (string) config("services.{$provider}.client_id", '');
        $clientSecret = (string) config("services.{$provider}.client_secret", '');

        return $clientId !== '' && $clientSecret !== '';
    }

    private function driver(string $provider): AbstractProvider
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        // API entry points have no session: fall back to stateless OAuth.
        if (! request()->hasSession()) {
            $driver->stateless();
        }

        // Keep provider HTTP snappy — don't hang the login redirect for ages.
        $driver->setHttpClient(new Client([
            'timeout' => 8,
            'connect_timeout' => 3,
            'verify' => ! ((bool) config('services.google.oauth_insecure_ssl') && ! app()->environment('production')),
        ]));

        if ($provider === 'facebook' && $driver instanceof FacebookProvider) {
            // No reRequest(): asking permissions again on every login feels slow.
            $driver->scopes(['email', 'public_profile'])
                ->fields(['name', 'email', 'picture.width(256)']);
        }

        return $driver;
    }

    private function normalizeAvatar(string $provider, ?string $avatarUrl): ?string
    {
        if (! is_string($avatarUrl) || $avatarUrl === '') {
            return null;
        }

        if ($provider === 'google' && str_contains($avatarUrl, 'googleusercontent.com')) {
            $larger = preg_replace('#=s\d+-c#', '=s256-c', $avatarUrl);
            if (is_string($larger)) {
                return $larger;
            }
        }

        return $avatarUrl;
    }
}

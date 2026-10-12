<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Default storefront language.
     */
    private string $defaultLocale = 'fr';

    /**
     * Supported locales for the storefront.
     *
     * @var array<int, string>
     */
    private array $supportedLocales = ['fr', 'en', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->session()->get('locale');

        if (! is_string($locale) || ! in_array($locale, $this->supportedLocales, true)) {
            $locale = config('app.locale', $this->defaultLocale) ?: $this->defaultLocale;

            if (! in_array($locale, $this->supportedLocales, true)) {
                $locale = $this->defaultLocale;
            }

            $request->session()->put('locale', $locale);
        }

        app()->setLocale($locale);

        return $next($request);
    }
}

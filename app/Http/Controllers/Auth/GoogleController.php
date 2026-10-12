<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\RedirectResponse;

/**
 * @deprecated Use SocialAuthController — kept for route name compatibility.
 */
class GoogleController extends SocialAuthController
{
    public function redirect(): RedirectResponse
    {
        return parent::redirect('google');
    }

    public function callback(): RedirectResponse
    {
        return parent::callback('google');
    }
}

<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\PictureUploadRequest;
use App\Support\PublicUploadDisk;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        return Inertia::render('settings/profile', [
            'user' => $user ? $user->only(['id','name','email','phone','address','picture']) : null,
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (isset($data['email']) && $data['email'] !== $user->email) {
            $user->email_verified_at = null;
        }

        if (isset($data['password']) && $data['password']) {
            $user->password = bcrypt($data['password']);
        } elseif (array_key_exists('password', $data)) {
            unset($data['password']);
        }

        $user->fill($data);
        $user->save();

        return redirect('/settings/profile')->with('status', 'profile-updated');
    }

    public function picture(PictureUploadRequest $request): RedirectResponse
    {
        $user = $request->user();
        if ($request->hasFile('picture')) {
            PublicUploadDisk::delete($user->picture);
            $user->picture = PublicUploadDisk::store('avatars', $request->file('picture'));
            $user->save();
            return redirect('/settings/profile')->with('status', 'picture-updated');
        }
        return redirect('/settings/profile')->with('status', 'picture-failed');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

}

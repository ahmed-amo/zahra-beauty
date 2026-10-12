<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\FlexibleEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function index(): Response
    {
        $admins = User::query()
            ->where('role', 'admin')
            ->orderByDesc('is_super_admin')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'is_super_admin', 'created_at'])
            ->map(fn (User $admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'is_super_admin' => $admin->isSuperAdmin(),
                'created_at' => $admin->created_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('Dashboard/Admin/AdminUsers', [
            'admins' => $admins,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', new FlexibleEmail, 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        DB::transaction(function () use ($data): void {
            // Lock the only super-admin row while creating a delegated admin.
            // It prevents concurrent role-management operations from interleaving.
            User::query()->where('is_super_admin', true)->lockForUpdate()->firstOrFail();

            $admin = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'admin',
                'is_super_admin' => false,
            ]);

            $role = Role::findOrCreate('admin', 'web');
            $admin->syncRoles([$role]);
        }, 3);

        return back()->with('success', __('Admin account created'));
    }
}

<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::findOrCreate('admin', 'web');

    $this->superAdmin = User::factory()->create([
        'role' => 'admin',
        'is_super_admin' => true,
    ]);
    $this->superAdmin->assignRole('admin');
});

test('only the super admin can access admin account management', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'is_super_admin' => false,
    ]);
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.admins.index'))
        ->assertForbidden();

    $this->actingAs($this->superAdmin)
        ->get(route('admin.admins.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Admin/AdminUsers')
            ->has('admins', 2));
});

test('super admin can create an admin exactly once for an email', function () {
    $payload = [
        'name' => 'Inventory Manager',
        'email' => 'inventory@example.com',
        'password' => 'secure-password-123',
        'password_confirmation' => 'secure-password-123',
    ];

    $this->actingAs($this->superAdmin)
        ->post(route('admin.admins.store'), $payload)
        ->assertRedirect();

    $admin = User::query()->where('email', $payload['email'])->firstOrFail();
    expect($admin->role)->toBe('admin')
        ->and($admin->isSuperAdmin())->toBeFalse()
        ->and($admin->hasRole('admin'))->toBeTrue();

    $this->actingAs($this->superAdmin)
        ->post(route('admin.admins.store'), $payload)
        ->assertSessionHasErrors('email');

    expect(User::query()->where('email', $payload['email'])->count())->toBe(1);
    expect(User::query()->where('is_super_admin', true)->count())->toBe(1);
});

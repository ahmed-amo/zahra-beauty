<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    private const GUARD = 'web';

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $admin = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => self::GUARD],
        );
        $customer = Role::firstOrCreate(
            ['name' => 'customer', 'guard_name' => self::GUARD],
        );

        $admin->syncPermissions([]);
        $customer->syncPermissions([]);

        $user = User::query()->where('role', 'admin')->first();
        if ($user !== null) {
            $user->assignRole($admin);
        }
    }
}

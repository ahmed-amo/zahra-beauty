<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) env('ADMIN_EMAIL', ''));
        $password = (string) env('ADMIN_PASSWORD', '');
        if ($email === '') {
            $email = 'zahraadmin@style.com';
        }
        if ($password === '') {
            $password = 'zahrastyle123456';
        }

        if ($email === '' || $password === '') {
            $this->command?->warn('ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping production admin.');

            return;
        }

        // The database partial unique index enforces that this is the only super-admin.
        User::query()->where('is_super_admin', true)->where('email', '!=', $email)->update([
            'is_super_admin' => false,
        ]);

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('ADMIN_NAME', 'Zahra Admin'),
                'password' => $password,
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $user->forceFill([
            'role' => 'admin',
            'is_super_admin' => true,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        if (! $user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}

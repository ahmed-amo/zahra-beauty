<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class ClientsSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) env('DEMO_CLIENT_EMAIL'));
        $password = (string) env('DEMO_CLIENT_PASSWORD');

        if ($email === '' || $password === '') {
            $this->command?->warn('Demo client credentials not set; skipping demo client.');

            return;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('DEMO_CLIENT_NAME', 'Client'),
                'password' => $password,
                'role' => 'user',
            ]
        );

        if (! $user->hasRole('customer')) {
            $user->assignRole('customer');
        }
    }
}

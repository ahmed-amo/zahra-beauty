<?php

use App\Models\Product;
use Illuminate\Support\Facades\Artisan;

it('leaves an existing catalog untouched', function () {
    Product::factory()->create(['status' => true]);

    $exit = Artisan::call('catalog:ensure');

    expect($exit)->toBe(0)
        ->and(Product::query()->count())->toBe(1)
        ->and(Artisan::output())->toContain('already has');
});

it('does not restore the catalog during a normal boot check', function () {
    $exit = Artisan::call('catalog:ensure');

    expect($exit)->toBe(0)
        ->and(Product::query()->count())->toBe(0)
        ->and(Artisan::output())->toContain('Skipping restore during boot');
});

it('refuses to seed mock products in production when restoring without the BEABA file', function () {
    $this->app->detectEnvironment(fn () => 'production');

    $realPath = public_path('BEABA C3 SITE WEB BEBE DOME.xlsx');
    $backupPath = $realPath.'.bak-test';
    $moved = false;

    if (is_file($realPath)) {
        rename($realPath, $backupPath);
        $moved = true;
    }

    try {
        $exit = Artisan::call('catalog:ensure', ['--restore' => true]);

        expect($exit)->toBe(1)
            ->and(Product::query()->count())->toBe(0)
            ->and(Artisan::output())->toContain('Refusing to seed mock products');
    } finally {
        if ($moved && is_file($backupPath)) {
            rename($backupPath, $realPath);
        }
    }
});

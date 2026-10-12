<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Support\Beaba\BeabaCatalogImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class EnsureCatalogCommand extends Command
{
    protected $signature = 'catalog:ensure
        {--restore : Import BEABA (or mock, if allowed) when the catalog is empty}
        {--force-mock : Seed the local mock catalog even in production (dangerous)}';

    protected $description = 'Check that the shop catalog exists. Never writes unless --restore is passed.';

    public function handle(BeabaCatalogImporter $importer): int
    {
        if (app()->isProduction() && env('APP_ENV') !== 'testing' && config('database.default') === 'sqlite') {
            $this->error('Production is using sqlite. That file dies on every deploy. Set DB_CONNECTION=pgsql.');

            return self::FAILURE;
        }

        $count = Product::query()->count();

        if ($count > 0) {
            $this->info("Product catalog already has {$count} products — leaving it untouched.");

            return self::SUCCESS;
        }

        $this->warn('Product catalog is empty.');

        if (! $this->option('restore')) {
            $this->warn('Skipping restore during boot. Run: php artisan catalog:ensure --restore');

            return self::SUCCESS;
        }

        $beabaPath = public_path('BEABA C3 SITE WEB BEBE DOME.xlsx');
        $isProduction = app()->environment('production');
        $allowMock = (bool) $this->option('force-mock')
            || filter_var((string) env('ALLOW_MOCK_CATALOG_SEED', 'false'), FILTER_VALIDATE_BOOLEAN);

        if (is_file($beabaPath)) {
            $this->info('Restoring BEABA catalog from pinned workbook…');
            $plan = $importer->import($beabaPath, replaceMock: false);
            $created = (int) ($plan['write']['products_created'] ?? 0);
            $updated = (int) ($plan['write']['products_updated'] ?? 0);
            $this->info("BEABA restore finished: +{$created} created, ~{$updated} updated.");

            return self::SUCCESS;
        }

        if ($isProduction && ! $allowMock) {
            $this->error('Production catalog is empty and BEABA workbook is missing.');
            $this->error('Refusing to seed mock products. Re-attach the Excel file or set ALLOW_MOCK_CATALOG_SEED=true.');

            return self::FAILURE;
        }

        $this->warn('Seeding mock catalog (dev / ALLOW_MOCK_CATALOG_SEED)…');
        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\CategorySeeder', '--force' => true]);
        $this->output->write(Artisan::output());
        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\ProductSeeder', '--force' => true]);
        $this->output->write(Artisan::output());

        return self::SUCCESS;
    }
}

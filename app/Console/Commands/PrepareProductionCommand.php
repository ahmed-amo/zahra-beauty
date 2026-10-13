<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class PrepareProductionCommand extends Command
{
    protected $signature = 'app:prepare';

    protected $description = 'Migrate, seed, and cache config in one process so a Railway cold start stays short.';

    public function handle(): int
    {
        $this->callSilent('config:clear');
        $this->call('storage:link', ['--force' => true]);
        $this->waitForDatabase();

        $this->call('migrate', ['--force' => true]);
        $this->call('db:seed', ['--class' => 'RolesAndPermissionsSeeder', '--force' => true]);
        $this->call('db:seed', ['--class' => 'SuperAdminSeeder', '--force' => true]);
        $this->refreshCatalog();
        $this->call('optimize');

        $this->info('Production prepare finished.');

        return self::SUCCESS;
    }

    private function waitForDatabase(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            try {
                DB::connection()->getPdo();

                return;
            } catch (Throwable $e) {
                if ($i === 30) {
                    $this->error('Database not reachable after 60s.');
                    throw $e;
                }

                $this->line("  retry {$i}/30");
                sleep(2);
            }
        }
    }

    /**
     * Catalog upserts run once per Railway deployment, not on every wake from sleep.
     */
    private function refreshCatalog(): void
    {
        $deployment = (string) env('RAILWAY_DEPLOYMENT_ID', '');

        if ($deployment !== '' && Cache::get('zahra.catalog.deployment') === $deployment) {
            $this->info('Catalog already applied for this deployment.');

            return;
        }

        $this->call('catalog:zahra');

        if ($deployment !== '') {
            Cache::forever('zahra.catalog.deployment', $deployment);
        }
    }
}

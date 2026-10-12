<?php

namespace App\Console\Commands;

use App\Support\Beaba\BeabaCatalogImporter;
use Illuminate\Console\Command;

class ImportBeabaProductsCommand extends Command
{
    protected $signature = 'products:import-beaba
        {path? : Path to the BEABA XLSX file}
        {--dry-run : Parse and report without writing to the database}
        {--replace-mock : Delete non-BEABA mock catalog products before import (real write only)}
        {--report= : Optional JSON report output path}';

    protected $description = 'Import the BEABA catalog from XLSX (DA prices, Color variants, blank images).';

    public function handle(BeabaCatalogImporter $importer): int
    {
        $path = $this->argument('path')
            ?: public_path('BEABA C3 SITE WEB BEBE DOME.xlsx');

        if (! is_file($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $replaceMock = (bool) $this->option('replace-mock');
        $reportPath = $this->option('report')
            ?: storage_path('app/imports/beaba-report-'.now()->format('Ymd-His').($dryRun ? '-dry' : '').'.json');

        if ($dryRun && $replaceMock) {
            $this->warn('--replace-mock is ignored during --dry-run.');
            $replaceMock = false;
        }

        $this->info(($dryRun ? 'Dry-run' : 'Import').": {$path}");

        $plan = $dryRun
            ? $importer->dryRun($path)
            : $importer->import($path, replaceMock: $replaceMock);

        $importer->writeReport($plan, $reportPath);

        $this->table(
            ['Metric', 'Value'],
            [
                ['Source rows', (string) ($plan['source_rows'] ?? 0)],
                ['Eligible rows', (string) ($plan['eligible_rows'] ?? 0)],
                ['Ignored', (string) ($plan['ignored_count'] ?? 0)],
                ['Duplicate EANs', (string) count($plan['duplicate_eans'] ?? [])],
                ['Product groups', (string) ($plan['product_group_count'] ?? 0)],
                ['Color variant groups', (string) ($plan['color_variant_groups'] ?? 0)],
                ['Uncertain colors', (string) count($plan['uncertain_colors'] ?? [])],
                ['STOP', (string) ($plan['status_buckets']['STOP'] ?? 0)],
                ['Exclu Retail', (string) ($plan['status_buckets']['Exclu Retail'] ?? 0)],
                ['Onliners', (string) ($plan['status_buckets']['Onliners'] ?? 0)],
                ['RUNNING CHANGE', (string) ($plan['status_buckets']['RUNNING CHANGE'] ?? 0)],
                ['Variant create (est.)', (string) ($plan['variant_create_estimate'] ?? 0)],
                ['Variant update (est.)', (string) ($plan['variant_update_estimate'] ?? 0)],
            ],
        );

        if (! $dryRun && isset($plan['write'])) {
            $this->info(sprintf(
                'Wrote products +%d / ~%d, variants +%d / ~%d',
                $plan['write']['products_created'],
                $plan['write']['products_updated'],
                $plan['write']['variants_created'],
                $plan['write']['variants_updated'],
            ));
        }

        if (! $dryRun && isset($plan['mock_removed'])) {
            $this->info(sprintf(
                'Mock cleanup: %d products, %d categories (skipped ordered: %d)',
                $plan['mock_removed']['products_deleted'],
                $plan['mock_removed']['categories_deleted'],
                $plan['mock_removed']['skipped_ordered'],
            ));
        }

        $this->info("Report: {$reportPath}");

        return self::SUCCESS;
    }
}

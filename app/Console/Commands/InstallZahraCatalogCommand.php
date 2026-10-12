<?php

namespace App\Console\Commands;

use App\Support\ZahraCatalog;
use Illuminate\Console\Command;

class InstallZahraCatalogCommand extends Command
{
    protected $signature = 'catalog:zahra';

    protected $description = 'Publish the Zahra womenswear catalog and hide the previous baby catalog once.';

    public function handle(): int
    {
        ZahraCatalog::install();
        $this->info('Zahra catalog is live. Previous non-Zahra products stay hidden after the first run.');

        return self::SUCCESS;
    }
}

<?php

namespace Database\Seeders;

use App\Support\ZahraCatalog;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        ZahraCatalog::install();
    }
}

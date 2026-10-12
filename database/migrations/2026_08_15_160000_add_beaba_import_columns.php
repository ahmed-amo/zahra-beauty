<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('external_key')->nullable()->after('brand');
            $table->string('import_source')->nullable()->after('external_key');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('reference')->nullable()->after('barcode');
            $table->string('import_statut')->nullable()->after('sort_order');
            $table->string('import_availability')->nullable()->after('import_statut');
            $table->string('import_alternative')->nullable()->after('import_availability');
        });

        // Unique barcode when present (PostgreSQL partial / SQLite filtered via raw).
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX product_variants_barcode_unique ON product_variants (barcode) WHERE barcode IS NOT NULL');
            DB::statement('CREATE UNIQUE INDEX products_external_key_unique ON products (external_key) WHERE external_key IS NOT NULL');
            DB::statement('CREATE UNIQUE INDEX product_variants_reference_unique ON product_variants (reference) WHERE reference IS NOT NULL');
        } else {
            // SQLite / MySQL: nullable unique allows multiple NULLs on MySQL; SQLite treats NULL as distinct.
            Schema::table('product_variants', function (Blueprint $table) {
                $table->unique('barcode');
                $table->unique('reference');
            });
            Schema::table('products', function (Blueprint $table) {
                $table->unique('external_key');
            });
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS product_variants_barcode_unique');
            DB::statement('DROP INDEX IF EXISTS products_external_key_unique');
            DB::statement('DROP INDEX IF EXISTS product_variants_reference_unique');
        } else {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->dropUnique(['barcode']);
                $table->dropUnique(['reference']);
            });
            Schema::table('products', function (Blueprint $table) {
                $table->dropUnique(['external_key']);
            });
        }

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['reference', 'import_statut', 'import_availability', 'import_alternative']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['external_key', 'import_source']);
        });
    }
};

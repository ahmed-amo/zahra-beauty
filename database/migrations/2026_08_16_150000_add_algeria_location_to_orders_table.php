<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('wilaya_code', 2)->nullable()->after('shipping_address');
            $table->string('wilaya_name')->nullable()->after('wilaya_code');
            $table->string('commune_name')->nullable()->after('wilaya_name');
        });

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN customer_email DROP NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE orders MODIFY customer_email VARCHAR(255) NULL');
        } else {
            // SQLite: recreate is heavy; leave as-is — app treats empty email as null.
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['wilaya_code', 'wilaya_name', 'commune_name']);
        });
    }
};

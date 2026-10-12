<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            $table->boolean('is_global')->default(false)->after('is_active');
        });

        // Common option types used across the catalog.
        DB::table('attributes')
            ->whereIn('slug', ['color', 'size', 'couleur', 'taille'])
            ->update(['is_global' => true]);
    }

    public function down(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            $table->dropColumn('is_global');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Self-referencing parent. The app enforces a two-level tree
            // (category -> sous-catégorie); the column itself allows deeper
            // nesting so raising that limit stays a validation change.
            $table->foreignId('parent_id')
                ->nullable()
                ->after('id')
                ->constrained('categories')
                ->nullOnDelete();

            $table->unsignedInteger('sort_order')->default(0)->after('status');

            $table->index(['parent_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['parent_id', 'sort_order']);
            $table->dropConstrainedForeignId('parent_id');
            $table->dropColumn('sort_order');
        });
    }
};

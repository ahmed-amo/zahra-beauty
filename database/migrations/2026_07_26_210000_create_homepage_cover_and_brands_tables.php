<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homepage_settings', function (Blueprint $table) {
            $table->id();
            $table->string('cover_image')->nullable();
            $table->string('cover_title')->nullable();
            $table->string('cover_subtitle')->nullable();
            $table->string('cover_link')->nullable();
            $table->string('cover_link_label')->nullable();
            $table->timestamps();
        });

        DB::table('homepage_settings')->insert([
            'cover_image' => null,
            'cover_title' => null,
            'cover_subtitle' => null,
            'cover_link' => null,
            'cover_link_label' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->string('image')->nullable();
            $table->string('url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brands');
        Schema::dropIfExists('homepage_settings');
    }
};

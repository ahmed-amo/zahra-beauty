<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('birth_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('baby_birth_date');
            $table->string('baby_first_name')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('visibility', 20)->default('private'); // private | shared
            $table->string('share_token', 64)->unique();
            $table->boolean('show_donor_names')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'visibility']);
        });

        Schema::create('birth_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('birth_list_id')->constrained('birth_lists')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('allow_cagnotte')->default(false);
            $table->string('status', 20)->default('available'); // available | reserved | gifted
            $table->string('reserved_by_name')->nullable();
            $table->string('reserved_by_email')->nullable();
            $table->string('reservation_token', 64)->nullable()->unique();
            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('gifted_at')->nullable();
            $table->timestamps();

            $table->unique(['birth_list_id', 'product_id']);
            $table->index(['birth_list_id', 'status']);
        });

        Schema::create('birth_list_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('birth_list_item_id')->constrained('birth_list_items')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('donor_name')->nullable();
            $table->string('donor_email')->nullable();
            $table->string('message')->nullable();
            $table->timestamps();
        });

        Schema::create('birth_list_packs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('age_band');
            $table->string('cover_image')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'sort_order']);
        });

        Schema::create('birth_list_pack_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('birth_list_pack_id')->constrained('birth_list_packs')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['birth_list_pack_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('birth_list_pack_items');
        Schema::dropIfExists('birth_list_packs');
        Schema::dropIfExists('birth_list_contributions');
        Schema::dropIfExists('birth_list_items');
        Schema::dropIfExists('birth_lists');
    }
};

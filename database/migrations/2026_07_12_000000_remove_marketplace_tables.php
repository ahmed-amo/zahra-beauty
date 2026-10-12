<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('order_items', 'vendor_order_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropForeign(['vendor_order_id']);
                $table->dropColumn('vendor_order_id');
            });
        }

        if (Schema::hasColumn('products', 'vendor_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropForeign(['vendor_id']);
                $table->dropColumn('vendor_id');
            });
        }

        Schema::dropIfExists('vendor_orders');
        Schema::dropIfExists('vendors');
    }

    public function down(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('shop_name');
            $table->string('slug')->unique();
            $table->string('phone')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->decimal('subtotal', 10, 2);
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('vendor_order_id')->nullable()->after('order_id')->constrained()->nullOnDelete();
        });
    }
};

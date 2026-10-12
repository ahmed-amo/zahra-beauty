<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->foreignId('order_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });

        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('product_reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['product_id', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'order_id']);
            $table->dropForeign(['order_id']);
            $table->dropColumn('order_id');
            $table->dropForeign(['user_id']);
        });

        Schema::table('product_reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};

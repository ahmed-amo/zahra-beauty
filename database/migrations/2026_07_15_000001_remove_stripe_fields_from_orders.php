<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'stripe_session_id')) {
                $table->dropColumn('stripe_session_id');
            }
            if (Schema::hasColumn('orders', 'stripe_payment_intent')) {
                $table->dropColumn('stripe_payment_intent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_payment_intent')->nullable();
        });
    }
};

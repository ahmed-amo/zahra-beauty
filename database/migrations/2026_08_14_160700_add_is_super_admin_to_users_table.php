<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('role');
        });

        // A partial unique index makes the "one super-admin" invariant database-enforced.
        DB::statement(
            'CREATE UNIQUE INDEX users_one_super_admin ON users (is_super_admin) WHERE is_super_admin = true'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS users_one_super_admin');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_super_admin');
        });
    }
};

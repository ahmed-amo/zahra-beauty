<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('birth_list_packs', function (Blueprint $table) {
            $table->string('baby_type', 32)->default('newborn')->after('name');
        });

        // Map legacy free-text age_band values into the three baby types.
        if (Schema::hasColumn('birth_list_packs', 'age_band')) {
            $rows = DB::table('birth_list_packs')->select('id', 'age_band')->get();
            foreach ($rows as $row) {
                $band = mb_strtolower((string) $row->age_band);
                $type = 'newborn';
                if (str_contains($band, 'bambin') || str_contains($band, '1 an') || str_contains($band, '2 ans') || str_contains($band, '3 ans') || str_contains($band, 'toddler')) {
                    $type = 'toddler';
                } elseif (str_contains($band, '6') || str_contains($band, '12') || str_contains($band, 'bébé') || str_contains($band, 'bebe') || str_contains($band, 'baby')) {
                    $type = 'baby';
                }
                DB::table('birth_list_packs')->where('id', $row->id)->update(['baby_type' => $type]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('birth_list_packs', function (Blueprint $table) {
            $table->dropColumn('baby_type');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vocabulary_entries', function (Blueprint $table) {
            $table->float('srs_stability')->default(0)->after('level');
            $table->float('srs_difficulty')->default(5)->after('srs_stability');
            $table->string('srs_state', 20)->default('new')->after('srs_difficulty');
            $table->timestamp('srs_due_at')->nullable()->after('srs_state');
            $table->timestamp('last_reviewed_at')->nullable()->after('srs_due_at');
        });
    }

    public function down(): void
    {
        Schema::table('vocabulary_entries', function (Blueprint $table) {
            $table->dropColumn(['srs_stability', 'srs_difficulty', 'srs_state', 'srs_due_at', 'last_reviewed_at']);
        });
    }
};

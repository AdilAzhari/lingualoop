<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('speaking_sessions', function (Blueprint $table) {
            $table->json('improvement_tips')->nullable()->after('collocation_errors');
        });
    }

    public function down(): void
    {
        Schema::table('speaking_sessions', function (Blueprint $table) {
            $table->dropColumn('improvement_tips');
        });
    }
};

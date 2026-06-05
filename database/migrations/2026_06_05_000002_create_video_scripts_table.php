<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_scripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('topic');
            $table->string('video_type', 20);              // tutorial|talking-head|case-study|shorts
            $table->string('platform', 20);                // youtube|linkedin|tiktok
            $table->string('duration', 10);                // short|medium|long
            $table->string('tone', 30);                    // educational|entertaining|thought-leadership
            $table->json('content');                       // full structured script
            $table->string('status', 20)->default('draft');
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_scripts');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('se_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prompt_id')->constrained('se_prompts')->cascadeOnDelete();
            $table->string('mode'); // writing|speaking
            $table->string('status')->default('graded');
            $table->text('text')->nullable();
            $table->string('audio_path')->nullable();
            $table->string('audio_mime')->nullable();
            $table->text('transcript')->nullable();
            $table->unsignedTinyInteger('score_technical')->nullable();
            $table->unsignedTinyInteger('score_clarity')->nullable();
            $table->unsignedTinyInteger('score_completeness')->nullable();
            $table->unsignedTinyInteger('score_tradeoffs')->nullable();
            $table->json('dimension_notes')->nullable();
            $table->json('headline')->nullable();
            $table->text('overall_note')->nullable();
            $table->json('key_concepts_missed')->nullable();
            $table->json('improvement_tips')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'prompt_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('se_sessions');
    }
};

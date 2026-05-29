<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('speaking_prompts', function (Blueprint $table) {
            $table->id();
            $table->text('text');                    // main instruction
            $table->json('cue_points');              // ["what the skill is", "why you want it", ...]
            $table->string('topic');
            $table->string('level', 2)->default('b2');
            $table->unsignedSmallInteger('target_seconds')->default(120); // 2 min target
            $table->timestamps();
        });

        Schema::create('speaking_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prompt_id')->constrained('speaking_prompts')->cascadeOnDelete();
            $table->string('status')->default('graded');   // graded|failed
            $table->string('audio_path')->nullable();
            $table->string('audio_mime')->default('audio/webm');
            $table->text('transcript')->nullable();
            $table->unsignedTinyInteger('score_fluency')->nullable();
            $table->unsignedTinyInteger('score_vocabulary')->nullable();
            $table->unsignedTinyInteger('score_grammar')->nullable();
            $table->unsignedTinyInteger('score_pronunciation')->nullable();
            $table->json('dimension_notes')->nullable();   // {fluency,vocabulary,grammar,pronunciation}
            $table->json('headline')->nullable();          // {primary,secondary}
            $table->text('overall_note')->nullable();
            $table->unsignedSmallInteger('duration_seconds')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'prompt_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('speaking_sessions');
        Schema::dropIfExists('speaking_prompts');
    }
};

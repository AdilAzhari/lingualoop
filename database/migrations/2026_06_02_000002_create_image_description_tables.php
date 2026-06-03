<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('image_prompts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('image_path');                             // storage/app/image-prompts/...
            $table->string('type', 20);                               // chart|graph|table|diagram|map|photo
            $table->string('topic');
            $table->string('level', 2)->default('b2');
            $table->text('task_instruction');
            $table->json('key_features');                             // ["overall trend", "peak in 2010", ...]
            $table->string('mode', 10)->default('both');              // writing|speaking|both
            $table->unsignedSmallInteger('target_words')->default(150);
            $table->unsignedSmallInteger('target_seconds')->default(120);
            $table->timestamps();
        });

        Schema::create('image_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prompt_id')->constrained('image_prompts')->cascadeOnDelete();
            $table->string('mode', 10);                               // writing|speaking
            $table->string('status', 20)->default('graded');
            $table->text('text')->nullable();                         // written description
            $table->string('audio_path')->nullable();
            $table->string('audio_mime')->nullable();
            $table->text('transcript')->nullable();
            $table->unsignedTinyInteger('score_task')->nullable();
            $table->unsignedTinyInteger('score_vocabulary')->nullable();
            $table->unsignedTinyInteger('score_coherence')->nullable();
            $table->unsignedTinyInteger('score_accuracy')->nullable();
            $table->json('dimension_notes')->nullable();
            $table->json('headline')->nullable();
            $table->text('overall_note')->nullable();
            $table->json('collocation_errors')->nullable();
            $table->json('key_features_missed')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'prompt_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_sessions');
        Schema::dropIfExists('image_prompts');
    }
};

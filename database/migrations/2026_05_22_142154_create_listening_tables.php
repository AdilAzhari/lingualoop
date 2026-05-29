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
        Schema::create('listening_passages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('audio_script');
            $table->string('topic', 80);
            $table->string('level', 2);
            $table->unsignedSmallInteger('word_count')->default(0);
            $table->timestamps();
        });

        Schema::create('listening_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('passage_id')->constrained('listening_passages')->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->text('question_text');
            $table->text('model_answer');
            $table->timestamps();
        });

        Schema::create('listening_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('passage_id')->constrained('listening_passages');
            $table->string('status', 20)->default('submitted');
            $table->json('answers')->nullable();
            $table->unsignedSmallInteger('score')->nullable();
            $table->json('question_feedback')->nullable();
            $table->text('overall_note')->nullable();
            $table->unsignedSmallInteger('time_taken_seconds')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listening_sessions');
        Schema::dropIfExists('listening_questions');
        Schema::dropIfExists('listening_passages');
    }
};

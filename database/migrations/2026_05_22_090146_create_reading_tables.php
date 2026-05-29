<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_passages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->longText('body');
            $table->string('level', 2);
            $table->string('topic');
            $table->unsignedSmallInteger('word_count')->default(0);
            $table->timestamps();
        });

        Schema::create('reading_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('passage_id')->constrained('reading_passages')->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->text('question_text');
            $table->text('model_answer');
            $table->timestamps();
            $table->unique(['passage_id', 'position']);
        });

        Schema::create('reading_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('passage_id')->constrained('reading_passages')->cascadeOnDelete();
            $table->string('status')->default('graded');
            $table->json('answers');
            $table->unsignedTinyInteger('score')->nullable();
            $table->json('question_feedback')->nullable();
            $table->text('overall_note')->nullable();
            $table->unsignedInteger('time_taken_seconds')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'passage_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_sessions');
        Schema::dropIfExists('reading_questions');
        Schema::dropIfExists('reading_passages');
    }
};

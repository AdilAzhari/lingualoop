<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('se_flashcards', function (Blueprint $table) {
            $table->id();
            $table->string('concept');
            $table->string('category');
            $table->text('front');
            $table->text('back');
            $table->text('example')->nullable();
            $table->text('gotcha')->nullable();
            $table->timestamps();
        });

        Schema::create('se_flashcard_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('flashcard_id')->constrained('se_flashcards')->cascadeOnDelete();
            $table->float('stability')->default(0);
            $table->float('difficulty')->default(0);
            $table->string('state')->default('new'); // new|learning|review
            $table->timestamp('due_at')->nullable();
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'flashcard_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('se_flashcard_progress');
        Schema::dropIfExists('se_flashcards');
    }
};

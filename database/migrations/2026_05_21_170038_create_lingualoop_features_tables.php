<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vocabulary notebook entries
        Schema::create('vocabulary_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('word');
            $table->text('definition')->nullable();
            $table->text('example')->nullable();
            $table->string('source')->default('manual'); // manual | feedback | drill
            $table->foreignId('source_submission_id')->nullable()->constrained('submissions')->nullOnDelete();
            $table->boolean('used_in_prompt')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        // Drill session history
        Schema::create('drill_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_uuid');
            $table->string('focus_category')->nullable();
            $table->unsignedSmallInteger('total_cards')->default(0);
            $table->unsignedSmallInteger('correct_cards')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        // Paragraph rewrite attempts
        Schema::create('paragraph_rewrites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->text('original_paragraph');
            $table->text('rewritten_paragraph');
            $table->json('errors_targeted');
            $table->json('ai_feedback')->nullable();
            $table->timestamps();
        });

        // Level progression log
        Schema::create('level_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('from_level', 2);
            $table->string('to_level', 2);
            $table->unsignedSmallInteger('trigger_score');
            $table->timestamp('achieved_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('level_milestones');
        Schema::dropIfExists('paragraph_rewrites');
        Schema::dropIfExists('drill_sessions');
        Schema::dropIfExists('vocabulary_entries');
    }
};

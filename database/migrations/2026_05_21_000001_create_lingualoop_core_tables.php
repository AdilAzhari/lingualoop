<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core domain schema for the learner loop. Mirrors resources/js/lib/types.ts.
 * (Assumes Laravel's default users/sessions/cache/jobs migrations are also present.)
 */
return new class extends Migration
{
    public function up(): void
    {
        // Learner CEFR level lives on users.
        Schema::table('users', function (Blueprint $table) {
            $table->string('level', 2)->default('b2')->after('email');
        });

        Schema::create('prompts', function (Blueprint $table) {
            $table->id();
            $table->text('text');
            $table->string('level', 2);
            $table->string('task_type'); // task-1 | task-2
            $table->unsignedSmallInteger('duration_minutes')->default(20);
            $table->string('focus_category')->nullable();
            $table->timestamps();
        });

        Schema::create('error_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->index();
            $table->string('display_name');
            $table->string('dimension'); // grammar|vocabulary|coherence|task
            $table->string('taxonomy_version')->default('v3.2');
            $table->timestamps();
            $table->unique(['code', 'taxonomy_version']);
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prompt_id')->constrained();
            $table->longText('text');
            $table->string('status')->default('draft'); // draft|grading|graded|failed
            $table->unsignedTinyInteger('score_grammar')->nullable();
            $table->unsignedTinyInteger('score_vocabulary')->nullable();
            $table->unsignedTinyInteger('score_coherence')->nullable();
            $table->unsignedTinyInteger('score_task')->nullable();
            $table->json('dimension_notes')->nullable();
            $table->json('headline')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('error_instances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('error_type_id')->nullable()->constrained();
            $table->string('type')->index();
            $table->string('dimension');
            $table->unsignedInteger('span_start');
            $table->unsignedInteger('span_end');
            $table->text('span_text');
            $table->string('suggested_fix')->nullable();
            $table->text('note')->nullable();
            $table->string('severity'); // good|low|med|high
            $table->timestamps();
            $table->index(['user_id', 'type', 'created_at']);
        });

        Schema::create('drill_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index();
            $table->foreignId('source_submission_id')->nullable()->constrained('submissions')->nullOnDelete();
            $table->text('source_span_text')->nullable();
            $table->text('prompt');
            $table->json('options');
            $table->unsignedTinyInteger('correct_index');
            $table->text('note')->nullable();
            // FSRS scheduling (handoff §8.3)
            $table->float('stability')->default(0);
            $table->float('difficulty')->default(0);
            $table->string('state')->default('new'); // new|learning|review
            $table->timestamp('due_at')->nullable();
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'due_at']);
        });

        Schema::create('drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prompt_id')->constrained()->cascadeOnDelete();
            $table->longText('text')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'prompt_id']);
        });

        Schema::create('streaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('current_days')->default(0);
            $table->unsignedInteger('longest_days')->default(0);
            $table->date('last_active_on')->nullable();
            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('streaks');
        Schema::dropIfExists('drafts');
        Schema::dropIfExists('drill_cards');
        Schema::dropIfExists('error_instances');
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('error_types');
        Schema::dropIfExists('prompts');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('level'));
    }
};

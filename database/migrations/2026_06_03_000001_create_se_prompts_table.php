<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('se_prompts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category'); // system-design|architecture|use-cases|real-world
            $table->string('difficulty'); // junior|mid|senior|staff
            $table->text('description');
            $table->text('context')->nullable();
            $table->json('key_concepts');
            $table->json('framework_hints');
            $table->string('mode')->default('both'); // writing|speaking|both
            $table->unsignedSmallInteger('target_words')->default(300);
            $table->unsignedSmallInteger('target_seconds')->default(120);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('se_prompts');
    }
};

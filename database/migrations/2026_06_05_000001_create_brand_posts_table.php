<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brand_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('topic');
            $table->string('type', 20);                // post|article|carousel
            $table->string('tone', 30);                // thought-leader|educator|storyteller
            $table->string('context')->nullable();     // optional extra context from user
            $table->json('content');                   // structured generated content (hooks, body, slides, etc.)
            $table->string('status', 20)->default('draft'); // draft|ready
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_posts');
    }
};

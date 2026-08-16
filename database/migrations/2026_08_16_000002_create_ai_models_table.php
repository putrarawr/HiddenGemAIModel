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
        Schema::create('ai_models', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('author');
            $table->float('parameter_size');
            $table->integer('context_window')->default(4096);
            $table->string('access_type')->default('open_weights'); // open_weights, free_cloud_api, gguf
            $table->jsonb('hardware_specs')->nullable();
            $table->jsonb('pros_cons')->nullable();
            $table->jsonb('run_commands')->nullable();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->boolean('is_verified_gem')->default(false);
            $table->string('review_status')->default('pending'); // pending, needs_review, published
            $table->timestamp('last_synced_at')->nullable();
            $table->string('source')->default('unknown'); // openrouter, huggingface, ollama
            $table->timestamps();

            // Single indexes
            $table->index('category_id');
            $table->index('parameter_size');
            $table->index('access_type');

            // Composite index for catalog queries
            $table->index(['review_status', 'is_verified_gem']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_models');
    }
};

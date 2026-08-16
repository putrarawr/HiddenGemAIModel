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
        Schema::create('ingestion_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('model_id')->nullable()->constrained('ai_models')->nullOnDelete();
            $table->string('source'); // openrouter, huggingface, ollama
            $table->string('status'); // success, partial, failed
            $table->integer('items_processed')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingestion_logs');
    }
};

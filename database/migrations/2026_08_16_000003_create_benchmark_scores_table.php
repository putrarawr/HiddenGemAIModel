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
        Schema::create('benchmark_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('model_id')->constrained('ai_models')->cascadeOnDelete();
            $table->string('benchmark_name'); // e.g. MMLU, HumanEval, GSM8K
            $table->decimal('score', 8, 2);
            $table->string('baseline_comparison')->nullable(); // e.g. "vs Llama-3-8B (+4.2%)"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('benchmark_scores');
    }
};

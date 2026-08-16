<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BenchmarkScore extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'model_id',
        'benchmark_name',
        'score',
        'baseline_comparison',
    ];

    protected $casts = [
        'score' => 'float',
    ];

    public function model(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'model_id');
    }
}

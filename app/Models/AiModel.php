<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiModel extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'author',
        'parameter_size',
        'context_window',
        'access_type',
        'hardware_specs',
        'pros_cons',
        'run_commands',
        'category_id',
        'is_verified_gem',
        'review_status',
        'last_synced_at',
        'source',
    ];

    protected $casts = [
        'parameter_size' => 'float',
        'context_window' => 'integer',
        'hardware_specs' => 'array',
        'pros_cons' => 'array',
        'run_commands' => 'array',
        'is_verified_gem' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function benchmarkScores(): HasMany
    {
        return $this->hasMany(BenchmarkScore::class, 'model_id');
    }

    public function ingestionLogs(): HasMany
    {
        return $this->hasMany(IngestionLog::class, 'model_id');
    }
}

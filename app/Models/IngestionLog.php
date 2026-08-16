<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngestionLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'model_id',
        'source',
        'status',
        'items_processed',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'items_processed' => 'integer',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function model(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'model_id');
    }
}

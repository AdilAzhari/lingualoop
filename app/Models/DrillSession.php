<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrillSession extends Model
{
    protected $fillable = [
        'user_id', 'session_uuid', 'focus_category',
        'total_cards', 'correct_cards', 'completed_at',
    ];

    protected $casts = ['completed_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function getAccuracyAttribute(): int
    {
        return $this->total_cards > 0
            ? (int) round(($this->correct_cards / $this->total_cards) * 100)
            : 0;
    }
}

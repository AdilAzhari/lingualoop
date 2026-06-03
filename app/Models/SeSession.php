<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeSession extends Model
{
    protected $fillable = [
        'user_id', 'prompt_id', 'mode', 'status',
        'text', 'audio_path', 'audio_mime', 'transcript',
        'score_technical', 'score_clarity', 'score_completeness', 'score_tradeoffs',
        'dimension_notes', 'headline', 'overall_note',
        'key_concepts_missed', 'improvement_tips', 'graded_at',
    ];

    protected $casts = [
        'dimension_notes'     => 'array',
        'headline'            => 'array',
        'key_concepts_missed' => 'array',
        'improvement_tips'    => 'array',
        'graded_at'           => 'datetime',
    ];

    public function getOverallAttribute(): int
    {
        return (int) round(
            ((int) $this->score_technical + (int) $this->score_clarity
            + (int) $this->score_completeness + (int) $this->score_tradeoffs) / 4
        );
    }

    public function prompt(): BelongsTo
    {
        return $this->belongsTo(SePrompt::class, 'prompt_id');
    }
}

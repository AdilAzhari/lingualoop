<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpeakingSession extends Model
{
    protected $fillable = [
        'user_id', 'prompt_id', 'status', 'audio_path', 'audio_mime',
        'transcript', 'score_fluency', 'score_vocabulary', 'score_grammar', 'score_pronunciation',
        'dimension_notes', 'headline', 'overall_note', 'collocation_errors', 'duration_seconds', 'graded_at',
    ];

    protected $casts = [
        'dimension_notes'    => 'array',
        'headline'           => 'array',
        'collocation_errors' => 'array',
        'graded_at'          => 'datetime',
    ];

    public function user(): BelongsTo   { return $this->belongsTo(User::class); }
    public function prompt(): BelongsTo { return $this->belongsTo(SpeakingPrompt::class, 'prompt_id'); }

    public function getOverallAttribute(): int
    {
        return (int) round(
            ($this->score_fluency + $this->score_vocabulary + $this->score_grammar + $this->score_pronunciation) / 4
        );
    }
}

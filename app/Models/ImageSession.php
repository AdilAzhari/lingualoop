<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImageSession extends Model
{
    protected $fillable = [
        'user_id', 'prompt_id', 'mode', 'status',
        'text', 'audio_path', 'audio_mime', 'transcript',
        'score_task', 'score_vocabulary', 'score_coherence', 'score_accuracy',
        'dimension_notes', 'headline', 'overall_note',
        'collocation_errors', 'key_features_missed', 'graded_at',
    ];

    protected $casts = [
        'dimension_notes'    => 'array',
        'headline'           => 'array',
        'collocation_errors' => 'array',
        'key_features_missed'=> 'array',
        'graded_at'          => 'datetime',
    ];

    public function user(): BelongsTo   { return $this->belongsTo(User::class); }
    public function prompt(): BelongsTo { return $this->belongsTo(ImagePrompt::class, 'prompt_id'); }

    public function getOverallAttribute(): int
    {
        $scores = array_filter([
            $this->score_task, $this->score_vocabulary,
            $this->score_coherence, $this->score_accuracy,
        ], fn ($s) => $s !== null);

        return $scores ? (int) round(array_sum($scores) / count($scores)) : 0;
    }
}

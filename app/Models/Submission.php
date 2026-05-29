<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'prompt_id', 'text', 'status',
    'score_grammar', 'score_vocabulary', 'score_coherence', 'score_task',
    'dimension_notes', 'headline', 'vocab_examples', 'submitted_at', 'graded_at',
])]
class Submission extends Model
{
    use HasFactory;

    protected $casts = [
        'dimension_notes' => 'array',
        'headline' => 'array',
        'vocab_examples' => 'array',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function prompt(): BelongsTo
    {
        return $this->belongsTo(Prompt::class);
    }

    public function errorInstances(): HasMany
    {
        return $this->hasMany(ErrorInstance::class);
    }

    /** Overall score = simple mean of the four dimensions (handoff §10.2). */
    public function getOverallAttribute(): int
    {
        return (int) round(
            ($this->score_grammar + $this->score_vocabulary + $this->score_coherence + $this->score_task) / 4
        );
    }
}

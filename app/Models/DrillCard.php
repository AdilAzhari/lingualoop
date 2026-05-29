<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A spaced-repetition card. FSRS fields (stability, difficulty, state, due_at)
 * drive scheduling — handoff §8.3. Cards from real submissions carry
 * source_submission_id + source_span_text so the UI can show "your original".
 */
class DrillCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'type', 'source_submission_id', 'source_span_text',
        'prompt', 'options', 'correct_index', 'note',
        'stability', 'difficulty', 'state', 'due_at', 'last_reviewed_at',
    ];

    protected $casts = [
        'options' => 'array',
        'correct_index' => 'integer',
        'stability' => 'float',
        'difficulty' => 'float',
        'due_at' => 'datetime',
        'last_reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sourceSubmission(): BelongsTo
    {
        return $this->belongsTo(Submission::class, 'source_submission_id');
    }

    public function isFromRealSubmission(): bool
    {
        return $this->source_submission_id !== null;
    }
}

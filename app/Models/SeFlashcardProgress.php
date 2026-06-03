<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeFlashcardProgress extends Model
{
    protected $table = 'se_flashcard_progress';

    protected $fillable = [
        'user_id', 'flashcard_id', 'stability', 'difficulty',
        'state', 'due_at', 'last_reviewed_at',
    ];

    protected $casts = [
        'due_at'           => 'datetime',
        'last_reviewed_at' => 'datetime',
    ];

    public function flashcard(): BelongsTo
    {
        return $this->belongsTo(SeFlashcard::class, 'flashcard_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

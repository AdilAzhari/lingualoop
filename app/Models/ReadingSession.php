<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingSession extends Model
{
    protected $fillable = [
        'user_id', 'passage_id', 'status', 'answers',
        'score', 'question_feedback', 'overall_note',
        'time_taken_seconds', 'started_at', 'graded_at',
    ];

    protected $casts = [
        'answers'           => 'array',
        'question_feedback' => 'array',
        'started_at'        => 'datetime',
        'graded_at'         => 'datetime',
    ];

    public function user(): BelongsTo   { return $this->belongsTo(User::class); }
    public function passage(): BelongsTo { return $this->belongsTo(ReadingPassage::class, 'passage_id'); }
}

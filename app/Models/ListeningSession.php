<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'passage_id', 'status', 'answers', 'score',
    'question_feedback', 'overall_note', 'time_taken_seconds', 'started_at', 'graded_at',
])]
class ListeningSession extends Model
{
    protected $casts = [
        'answers'           => 'array',
        'question_feedback' => 'array',
        'started_at'        => 'datetime',
        'graded_at'         => 'datetime',
    ];

    public function user(): BelongsTo    { return $this->belongsTo(User::class); }
    public function passage(): BelongsTo { return $this->belongsTo(ListeningPassage::class, 'passage_id'); }
}

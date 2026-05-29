<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'word', 'definition', 'example',
    'source', 'source_submission_id', 'used_in_prompt', 'level',
    'srs_stability', 'srs_difficulty', 'srs_state', 'srs_due_at', 'last_reviewed_at',
])]
class VocabularyEntry extends Model
{
    protected $casts = [
        'used_in_prompt'   => 'boolean',
        'srs_stability'    => 'float',
        'srs_difficulty'   => 'float',
        'srs_due_at'       => 'datetime',
        'last_reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function sourceSubmission(): BelongsTo { return $this->belongsTo(Submission::class, 'source_submission_id'); }
}

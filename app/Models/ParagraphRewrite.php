<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParagraphRewrite extends Model
{
    protected $fillable = [
        'user_id', 'submission_id', 'original_paragraph',
        'rewritten_paragraph', 'errors_targeted', 'ai_feedback',
    ];

    protected $casts = ['errors_targeted' => 'array', 'ai_feedback' => 'array'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function submission(): BelongsTo { return $this->belongsTo(Submission::class); }
}

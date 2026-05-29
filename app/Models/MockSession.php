<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'prompt_id', 'passage_id', 'speaking_prompt_id',
    'status', 'started_at', 'completed_at',
])]
class MockSession extends Model
{
    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo          { return $this->belongsTo(User::class); }
    public function prompt(): BelongsTo        { return $this->belongsTo(Prompt::class); }
    public function passage(): BelongsTo       { return $this->belongsTo(ReadingPassage::class, 'passage_id'); }
    public function speakingPrompt(): BelongsTo { return $this->belongsTo(SpeakingPrompt::class, 'speaking_prompt_id'); }
}

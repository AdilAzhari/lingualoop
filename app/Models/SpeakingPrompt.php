<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SpeakingPrompt extends Model
{
    protected $fillable = ['text', 'cue_points', 'topic', 'level', 'target_seconds'];
    protected $casts    = ['cue_points' => 'array'];

    public function sessions(): HasMany
    {
        return $this->hasMany(SpeakingSession::class, 'prompt_id');
    }
}

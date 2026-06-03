<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SePrompt extends Model
{
    protected $fillable = [
        'title', 'category', 'difficulty', 'description', 'context',
        'key_concepts', 'framework_hints', 'mode', 'target_words', 'target_seconds',
    ];

    protected $casts = [
        'key_concepts'    => 'array',
        'framework_hints' => 'array',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(SeSession::class, 'prompt_id');
    }
}

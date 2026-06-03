<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImagePrompt extends Model
{
    protected $fillable = [
        'title', 'image_path', 'type', 'topic', 'level',
        'task_instruction', 'key_features', 'mode',
        'target_words', 'target_seconds',
    ];

    protected $casts = [
        'key_features' => 'array',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(ImageSession::class, 'prompt_id');
    }
}

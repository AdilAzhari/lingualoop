<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoScript extends Model
{
    protected $fillable = [
        'user_id', 'topic', 'video_type', 'platform', 'duration', 'tone', 'content', 'status',
    ];

    protected $casts = [
        'content' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

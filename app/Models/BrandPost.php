<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandPost extends Model
{
    protected $fillable = [
        'user_id', 'topic', 'type', 'tone', 'context', 'content', 'status',
    ];

    protected $casts = [
        'content' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

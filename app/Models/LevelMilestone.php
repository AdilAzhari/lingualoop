<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LevelMilestone extends Model
{
    protected $fillable = ['user_id', 'from_level', 'to_level', 'trigger_score', 'achieved_at'];
    protected $casts = ['achieved_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}

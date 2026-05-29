<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingPassage extends Model
{
    protected $fillable = ['title', 'body', 'level', 'topic', 'word_count'];

    public function questions(): HasMany
    {
        return $this->hasMany(ReadingQuestion::class, 'passage_id')->orderBy('position');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ReadingSession::class, 'passage_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'audio_script', 'topic', 'level', 'word_count'])]
class ListeningPassage extends Model
{
    public function questions(): HasMany { return $this->hasMany(ListeningQuestion::class, 'passage_id')->orderBy('position'); }
    public function sessions(): HasMany  { return $this->hasMany(ListeningSession::class, 'passage_id'); }
}

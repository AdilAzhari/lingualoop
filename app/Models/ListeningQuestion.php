<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['passage_id', 'position', 'question_text', 'model_answer'])]
class ListeningQuestion extends Model
{
    public function passage(): BelongsTo { return $this->belongsTo(ListeningPassage::class, 'passage_id'); }
}

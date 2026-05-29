<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingQuestion extends Model
{
    protected $fillable = ['passage_id', 'position', 'question_text', 'model_answer'];

    public function passage(): BelongsTo
    {
        return $this->belongsTo(ReadingPassage::class, 'passage_id');
    }
}

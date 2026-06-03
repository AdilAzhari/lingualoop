<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeFlashcard extends Model
{
    protected $fillable = ['concept', 'category', 'front', 'back', 'example', 'gotcha'];
}

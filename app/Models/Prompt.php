<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prompt extends Model
{
    use HasFactory;

    protected $fillable = ['text', 'level', 'task_type', 'duration_minutes', 'focus_category'];

    protected $casts = ['duration_minutes' => 'integer'];
}

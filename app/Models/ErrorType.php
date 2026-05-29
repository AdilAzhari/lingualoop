<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** A taxonomy node (versioned). e.g. preposition_choice / grammar. */
class ErrorType extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'display_name', 'dimension', 'taxonomy_version'];
}

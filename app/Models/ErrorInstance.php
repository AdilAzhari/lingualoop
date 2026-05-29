<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A single error found in a submission. */
class ErrorInstance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'submission_id', 'error_type_id', 'type', 'dimension',
        'span_start', 'span_end', 'span_text', 'suggested_fix', 'note', 'severity',
    ];

    protected $casts = ['span_start' => 'integer', 'span_end' => 'integer'];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function errorType(): BelongsTo
    {
        return $this->belongsTo(ErrorType::class);
    }
}

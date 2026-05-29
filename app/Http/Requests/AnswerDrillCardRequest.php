<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnswerDrillCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string,mixed> */
    public function rules(): array
    {
        return [
            'session_id' => ['required', 'string'],
            'chosen_index' => ['required', 'integer', 'between:0,3'],
            'correct' => ['required', 'boolean'],
        ];
    }
}

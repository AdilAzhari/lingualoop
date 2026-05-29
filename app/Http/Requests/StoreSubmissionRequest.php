<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string,mixed> */
    public function rules(): array
    {
        return [
            'prompt_id' => ['required', 'integer'],
            // A real essay; min length keeps empty/accidental submits out.
            'text' => ['required', 'string', 'min:40', 'max:8000'],
        ];
    }

    public function messages(): array
    {
        return [
            'text.min' => 'Write a little more before sending it to grading.',
        ];
    }
}

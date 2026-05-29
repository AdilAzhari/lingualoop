<?php

namespace App\Services\Grading;

/**
 * A grading provider turns a piece of writing into structured feedback.
 * Implementations: StubGradingProvider (canned), GeminiProvider (real LLM).
 * Selected via the GRADING_DRIVER env var; bound in AppServiceProvider.
 */
interface GradingProvider
{
    /**
     * @param  array  $context  ['text' => string, 'level' => string,
     *                           'focus_category' => ?string, 'profile_summary' => string]
     */
    public function grade(array $context): GradingResult;
}

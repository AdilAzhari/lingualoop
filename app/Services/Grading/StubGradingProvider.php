<?php

namespace App\Services\Grading;

use App\Support\StubContent;

/**
 * Returns canned feedback matching the prototype. The default driver — lets the
 * app run with no API key. Swap GRADING_DRIVER=gemini to use the real provider.
 */
class StubGradingProvider implements GradingProvider
{
    public function grade(array $context): GradingResult
    {
        $submission = StubContent::submission(18);

        return new GradingResult(
            scores: [
                'grammar' => $submission['score']['grammar'],
                'vocabulary' => $submission['score']['vocabulary'],
                'coherence' => $submission['score']['coherence'],
                'task' => $submission['score']['task'],
            ],
            dimensionNotes: $submission['dimension_notes'],
            headline: $submission['headline'],
            errors: $submission['errors'],
            noticed: $submission['recurring_pattern'],
        );
    }
}

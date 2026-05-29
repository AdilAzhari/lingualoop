<?php

namespace App\Services\Grading;

/**
 * Orchestrates the grading call. Thin wrapper around the configured provider —
 * builds the context (text, level, focus category, recent error-profile
 * summary) and delegates parsing to the provider (handoff §3.1, §8.1).
 */
class GradingService
{
    public function __construct(private GradingProvider $provider) {}

    public function grade(array $context): GradingResult
    {
        return $this->provider->grade($context);
    }
}

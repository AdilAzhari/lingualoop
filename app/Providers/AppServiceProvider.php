<?php

namespace App\Providers;

use App\Services\Grading\GradingProvider;
use App\Services\Grading\GeminiProvider;
use App\Services\Grading\StubGradingProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Select the grading provider from GRADING_DRIVER (defaults to stub).
        $this->app->bind(GradingProvider::class, function ($app) {
            $driver = config('grading.driver', env('GRADING_DRIVER', 'stub'));

            return match ($driver) {
                'gemini' => new GeminiProvider(
                    apiKey: (string) env('GEMINI_API_KEY', ''),
                    model: (string) env('GEMINI_MODEL', 'gemini-2.5-pro'),
                ),
                default => new StubGradingProvider(),
            };
        });
    }

    public function boot(): void
    {
        //
    }
}

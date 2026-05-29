<?php

namespace App\Http\Middleware;

use App\Services\Grading\GeminiProvider;
use App\Support\StubContent;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props shared with every page. The Topbar reads auth.user (initial, level)
     * and the streak chip. Production: pull from $request->user().
     *
     * @return array<string,mixed>
     */
    public function share(Request $request): array
    {
        $user = StubContent::user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user,
            ],
            'streak' => [
                'current_days' => $user['streak_days'],
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
            ],
            'gemini_usage' => fn () => env('GRADING_DRIVER') === 'gemini'
                ? GeminiProvider::todayStats()
                : null,
        ]);
    }
}

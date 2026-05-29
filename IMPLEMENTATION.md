# LinguaLoop — learner app (implementation)

This is the implementation of the design handoff: a **Laravel 13 · Inertia.js v3 · React 19 · TypeScript · Vite** recreation of the LinguaLoop learner core loop (Today, Write, Grading, Feedback, Profile, Drill).

This pass is **frontend-first with a stubbed backend**: every Inertia page and component is built to spec, and the controllers return canned data that matches the prototype so the whole loop runs end-to-end **with no AI key, queue worker, or Redis**. The AI grading, FSRS spaced-repetition, and Reverb realtime layers are scaffolded (real structure, interfaces, and wiring) but return / advance with stub data.

## What's built vs. scaffolded

**Built to spec (the design-heavy part the prototype is the source of truth for):**

- All design tokens — OKLCH palette, paper grain, typography ramp, shadows, radii (`resources/css/app.css`, `tailwind.config.ts`).
- All seven Inertia pages: `Home`, `Compose`, `Grading`, `Feedback`, `Profile`, `Drill/Index`, `Drill/Summary`.
- All components from the handoff directory: Layout (AppShell, Topbar, Page, PageHeader, SectionHeader), Typography (Display, Eyebrow, Marginalia), Common (icons, Chip, ScoreArc, Pulse), Feedback (Essay, AnnotatedSpan, MarginPanel, MarginNote, **NoticedCallout** — the wedge, DimensionCard), Profile (StratiLayer), Drill (DrillCard, OptionButton, ProgressDots), Compose (WritingSurface, Timer, FocusSidebar).
- TypeScript prop contracts for every page (`resources/js/lib/types.ts`), exactly matching handoff §5.
- The `Essay` renders annotations from real character offsets (`span_start`/`span_end`), not hardcoded segments.
- The `ProfileAggregator` implements the real §6.5 binning/status/sort algorithm (with a `stub()` for the demo data).

**Scaffolded (real structure, stub behavior):**

- `GradingService` + `GradingProvider` interface, `StubGradingProvider` (default) and `GeminiProvider` (real Gemini call, off by default via `GRADING_DRIVER`).
- `GradeSubmission` queued job — broadcasts phase events; the Grading screen also has a polling fallback that works with no worker.
- Reverb events (`Grading\PhaseAdvanced`, `Grading\Completed`) + `routes/channels.php`.
- FSRS scheduling — `DrillCard` model carries the FSRS fields; `DrillController@answer` is the hook (no-op in stub).
- Eloquent models + a migration for the full domain schema.

## Running it

PHP/Composer were not available in the environment this was generated in, so the standard Laravel skeleton files (`artisan`, `public/index.php`, `bootstrap/`, `config/`, framework default migrations) are **not** included — only the application-specific code. The cleanest way to get a runnable app:

### Recommended: overlay onto a fresh Laravel 11 + Inertia React starter

```bash
# 1. Scaffold a fresh Laravel 11 app with the Inertia + React + TS preset
composer create-project laravel/laravel lingualoop-app
cd lingualoop-app
composer require laravel/breeze --dev
php artisan breeze:install react --typescript   # choose React, TypeScript

# 2. Copy this bundle's application code over the scaffold
#    (from the directory that contains this IMPLEMENTATION.md)
cp -R app/*            /path/to/lingualoop-app/app/
cp -R resources/js/*   /path/to/lingualoop-app/resources/js/
cp    resources/css/app.css      /path/to/lingualoop-app/resources/css/app.css
cp    resources/views/app.blade.php /path/to/lingualoop-app/resources/views/app.blade.php
cp -R database/migrations/*  /path/to/lingualoop-app/database/migrations/
cp    routes/web.php routes/channels.php /path/to/lingualoop-app/routes/
cp    tailwind.config.ts vite.config.ts tsconfig.json package.json /path/to/lingualoop-app/

# 3. Make sure HandleInertiaRequests is registered (Breeze adds its own — replace
#    it with the one in app/Http/Middleware, or merge the share() method).

# 4. Install + run
npm install
cp .env.example .env       # or merge GRADING_/REVERB_ keys into the generated .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
composer run dev            # or: php artisan serve & npm run dev
```

Then open the app — `/` is Today. The full loop works: **Today → Write → Send to grading → (Grading screen advances ~8s) → Feedback → Take the drill → Drill → Summary**, plus the Profile stratigraphy.

> The grading screen advances via the polling fallback (`GET /submissions/{id}/status`), which derives the phase from elapsed time — no queue worker needed. Wire `BROADCAST_CONNECTION=reverb` + uncomment the Echo block in `resources/js/bootstrap.ts` to use realtime instead.

### Turning on the real Gemini grader

Set in `.env`:

```
GRADING_DRIVER=gemini
GEMINI_API_KEY=your-key
```

The provider requests strict JSON matching the §8.2 schema; the system prompt is in `app/Services/Grading/Providers/GeminiProvider.php`.

## Notes on fidelity & decisions

- The serif (**Newsreader**) is loaded via bunny.net in `app.blade.php` (the handoff asked for self-hosted / bunny-style instead of the prototype's Google Fonts CDN). The serif is load-bearing — do not swap it.
- Colors are kept in **OKLCH** as required; Tailwind consumes them through CSS variables.
- Open questions from handoff §10 resolved per the doc's own recommendations: draft autosave debounced 800 ms; overall score = simple mean; grading poll fallback at 2 s intervals.
- The `NoticedCallout` (the wedge) is full-width, above the fold, in the terracotta band — as specified in §6.4 / §11.

## Verification done in this environment

- Static check: **all 100 internal module imports resolve** to real files.
- All package imports are declared in `package.json` (the only two flagged — `laravel-echo`, `pusher-js` — are inside the commented-out Echo block in `bootstrap.ts`).
- A live `tsc --noEmit` / `vite build` could not be run here because a full `npm install` doesn't complete within the sandbox's limits. **Run `npm run typecheck` after installing** to confirm types compile in your environment.

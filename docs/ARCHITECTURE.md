# Architecture

## Overview

Lingualoop is a server-rendered SPA built on the **Inertia.js** stack: Laravel handles routing, auth, data, and AI calls; React handles all rendering. There is no separate API layer — Inertia pages receive typed props directly from controllers.

```
Browser (React + TypeScript)
       ↕  Inertia (XHR + full-page)
Laravel (routing, auth, Eloquent)
       ↕  HTTP
External APIs  (Gemini · ElevenLabs · dictionaryapi.dev)
```

---

## Module Breakdown

### Writing (`/compose`)

1. `ComposeController@show` — renders prompt + user's active draft via Inertia
2. `ComposeController@store` — saves submission, dispatches async grading job (or grades inline on `sync` queue)
3. `GradingService` selects a driver (`GeminiProvider` or `StubProvider`) based on `GRADING_DRIVER`
4. Grader returns `GradingResult` with band scores (TA/CC/LR/GRA), `ErrorInstance` records, and drill card candidates
5. `SubmissionController@show` renders the feedback page with `ScoreArc`, `BandBadge`, margin annotations

**Key models:** `Prompt`, `Submission`, `ErrorInstance`, `ErrorType`, `DrillCard`, `ParagraphRewrite`

### Reading (`/reading`)

1. Passages seeded by admin via `/dashboard`
2. `ReadingController@store` collects answers, passes them to `ReadingGrader::grade()`
3. `ReadingGrader` builds a Gemini prompt with the passage + questions, parses the JSON response into a `ReadingGradingResult`
4. Results stored in `ReadingSession`

**Key models:** `ReadingPassage`, `ReadingQuestion`, `ReadingSession`

### Speaking (`/speaking`)

1. User records audio in-browser using the `MediaRecorder` API
2. Audio blob posted as multipart to `SpeakingController@store`
3. `SpeakingGrader` sends audio directly to Gemini (multimodal) for transcription + grading
4. AI examiner follow-up questions generated via `SpeakingController@followup`
5. Recorded audio stored on disk and served back via `SpeakingController@audio`

**Key models:** `SpeakingPrompt`, `SpeakingSession`

### Listening (`/listening`)

1. Passage `audio_script` sent to `ElevenLabsTtsClient::synthesize()` on first request
2. MP3 cached at `storage/app/tts/passage_{id}.mp3` — served directly on subsequent requests
3. Audio plays in-browser via `window.speechSynthesis` (Web Speech API fallback if TTS unconfigured)
4. Comprehension answers graded by `ReadingGrader` (same grader, reused)

**Key models:** `ListeningPassage`, `ListeningQuestion`, `ListeningSession`

### Vocabulary (`/vocabulary`)

1. Words added manually or auto-annotated from reading passage selection
2. On word blur, the UI calls:
   - `dictionaryapi.dev` for the definition (client-side, no key needed)
   - `POST /vocabulary/suggest` for AI-generated example + CEFR level (Gemini)
3. `VocabularyReviewController` serves cards due for review according to FSRS schedule
4. `VocabularyReviewController@answer` applies the FSRS algorithm to update `srs_stability`, `srs_difficulty`, `srs_due_at`

**Key models:** `VocabularyEntry`

### Drills (`/drill`)

FSRS-scheduled flashcard sessions built from writing error cards.

1. `DrillController@index` fetches `DrillCard` records where `due_at <= now()`
2. `DrillController@answer` receives a rating (1–4) and re-schedules the card using FSRS

**Key models:** `DrillCard`, `DrillSession`

### Mock Exam (`/mock`)

1. `MockController@create` picks one random `Prompt`, `ReadingPassage`, and `SpeakingPrompt`
2. `MockSession` tracks completion status for each skill
3. 65-minute countdown runs client-side; each skill module auto-detects the active mock

**Key models:** `MockSession`

### Profile (`/profile`)

Aggregates data from all sessions into:
- **Error stratigraphy** — `ErrorInstance` records grouped by type and submission date, rendered as layered bar chart
- **Score sparklines** — rolling band scores for Writing, Reading, Speaking from last N sessions
- **Badge system** — 20 badges evaluated against session counts, streaks, and scores; stored in `localStorage`

### Dashboard (`/dashboard`)

Admin-only panel. Generates content by prompting Gemini with a topic and level, then saves to the appropriate model (`ReadingPassage`, `SpeakingPrompt`, `Prompt`).

---

## Key Services

### `GeminiClient`

All Gemini calls go through this class.

```php
GeminiClient::ask($prompt, $timeout)   // returns string
GeminiClient::json($prompt, $timeout)  // returns array (JSON mode)
```

Env vars: `GEMINI_API_KEY`, `GEMINI_MODEL`

### `GradingService` / `GradingDriver`

Pluggable writing grader. Set `GRADING_DRIVER=stub` for tests or local dev without an API key.

```
GRADING_DRIVER=gemini  →  GeminiProvider  →  GeminiClient::json()
GRADING_DRIVER=stub    →  StubProvider    →  returns hardcoded GradingResult
```

### `ReadingGrader`

Reused for both Reading and Listening comprehension grading. Builds a structured prompt with the passage body + Q&A, calls `GeminiClient::json()`, and maps the response into `ReadingGradingResult`.

### `ElevenLabsTtsClient` / `AzureTtsClient`

Both follow the same interface:

```php
TtsClient::synthesize(string $text, string $cacheKey): string  // returns local MP3 path
TtsClient::isConfigured(): bool
```

The cache key is `passage_{id}`, so audio is generated once and served forever from `storage/app/tts/`.

---

## FSRS Scheduling

FSRS (Free Spaced Repetition Scheduler) is applied to both `DrillCard` and `VocabularyEntry`.

Each record has:

| Field | Description |
|-------|-------------|
| `srs_stability` | How long the memory is expected to last (days) |
| `srs_difficulty` | How hard the card is (0–10 scale) |
| `srs_state` | `new` · `learning` · `review` |
| `srs_due_at` | Next review timestamp |

On each answer, the controller applies the FSRS formulae to compute the new stability and due date.

---

## Error Taxonomy

Writing errors are classified into 12 types (`ErrorType`) across three dimensions:

| Dimension | Error codes |
|-----------|-------------|
| Grammar | verb_tense, subject_verb, article_det, sentence_structure |
| Vocabulary | word_choice, collocation, register, spelling |
| Coherence | cohesion, paragraph_dev, argument_flow, task_response |

Each `ErrorInstance` records:
- `span_start` / `span_end` — character offsets in the submitted essay
- `span_text` — the exact problematic text
- `suggested_fix` — Gemini-suggested correction
- `severity` — `minor` · `major` · `critical`

The `ProfileAggregator` groups instances by type and date into "layers" for the stratigraphy chart.

---

## Data Flow — Writing Submission

```
User submits essay
  → ComposeController::store()
    → Submission::create() [status=pending]
    → GradingService::grade()
      → GeminiClient::json(essay + rubric prompt)
        → parse GradingResult
      → Submission::update() [status=graded, scores, error_instances]
      → DrillCard::create() for each error
  → redirect → SubmissionController::show()
    → Inertia::render('Feedback', scores + errors)
```

---

## Design System

All UI is built with CSS custom properties — no Tailwind utility classes. Key tokens:

| Token | Usage |
|-------|-------|
| `--serif` | Body and heading text (literary feel) |
| `--mono` | Labels, chips, metadata |
| `--ink` → `--ink-4` | Text hierarchy (darkest → faintest) |
| `--paper` → `--paper-3` | Background hierarchy |
| `--signal` | Error / warning colour |
| `--progress` | Success / mastery colour |
| `--hairline` | Borders |

Shared components: `ScoreArc`, `BandBadge`, `PageHeader`, `SectionHeader`, `Marginalia`, `Ico`.

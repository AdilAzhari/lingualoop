# API / Route Reference

All routes are web routes behind auth middleware unless marked **public**. Inertia routes return HTML on first load and JSON on XHR navigations; JSON-only endpoints return `application/json`.

---

## Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/login` | Login page |
| POST | `/login` | Authenticate |
| POST | `/logout` | Log out |
| GET | `/register` | Registration page |
| POST | `/register` | Create account |
| GET | `/forgot-password` | Password reset request |
| POST | `/forgot-password` | Send reset link |
| GET | `/reset-password/{token}` | Reset password form |
| POST | `/reset-password` | Apply new password |

---

## Home & Dashboard

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/` | Inertia `Home` | Today's dashboard — prompt, streak, recent scores |
| GET | `/dashboard` | Inertia `Dashboard` | Admin content panel |
| POST | `/dashboard/generate` | JSON `{ preview }` | AI-generate a passage / prompt for review |
| POST | `/dashboard/save` | Redirect | Persist generated content to DB |
| DELETE | `/dashboard/{type}/{id}` | Redirect | Delete passage / prompt by type + id |

---

## Writing

### Compose

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/compose` | — | Inertia `Compose` | Writing task — active prompt + draft |
| POST | `/compose` | `{ text, prompt_id }` | Redirect → `/submissions/{id}` | Submit essay for grading |
| POST | `/compose/draft` | `{ text, prompt_id }` | JSON `{ ok: true }` | Autosave draft (debounced) |
| POST | `/compose/sample` | `{ prompt_id }` | JSON `{ text }` | AI sample essay for the current prompt |

### Submissions

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/submissions` | Inertia `Submissions` | Paginated submission history |
| GET | `/submissions/{id}` | Inertia `Feedback` | Graded feedback — scores, errors, drill cards |
| GET | `/submissions/{id}/status` | JSON `{ status, score? }` | Poll grading status |
| POST | `/submissions/{id}/coach` | JSON `{ priorities }` | AI coaching summary (3 top priorities) |
| GET | `/submissions/{id}/rewrite` | Inertia `Rewrite` | Paragraph rewrite task |
| POST | `/submissions/{id}/rewrite` | Redirect | Save rewrite + AI feedback |

---

## Reading

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/reading` | — | Inertia `Reading/Index` | Passage listing with best scores |
| GET | `/reading/{passage}` | — | Inertia `Reading/Show` | Passage + comprehension questions |
| POST | `/reading/{passage}` | `{ started_at, answers[] }` | Redirect → `/reading/sessions/{id}` | Submit answers for grading |
| POST | `/reading/{passage}/sample` | — | JSON `{ text }` | AI model answers |
| GET | `/reading/sessions/{session}` | — | Inertia `Reading/Feedback` | Graded session feedback |

**`answers[]` shape:**
```json
[{ "question_id": 1, "answer": "string" }]
```

---

## Speaking

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/speaking` | — | Inertia `Speaking/Index` | Prompt listing with best scores |
| GET | `/speaking/{prompt}` | — | Inertia `Speaking/Show` | Prompt + recorder UI |
| POST | `/speaking/{prompt}` | multipart: `audio` (blob), `duration_seconds` | Redirect → `/speaking/sessions/{id}` | Upload audio for grading |
| POST | `/speaking/{prompt}/sample` | — | JSON `{ text }` | AI sample response |
| GET | `/speaking/sessions/{session}` | — | Inertia `Speaking/Feedback` | Graded session feedback |
| GET | `/speaking/sessions/{session}/audio` | — | `audio/webm` or `audio/mp4` | Stream recorded audio |
| POST | `/speaking/sessions/{session}/followup` | `{ history[] }` | JSON `{ question }` | AI examiner follow-up question |

---

## Listening

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/listening` | — | Inertia `Listening/Index` | Passage listing with best scores |
| GET | `/listening/{passage}` | — | Inertia `Listening/Show` | Passage + audio player + questions |
| POST | `/listening/{passage}` | `{ started_at, answers[] }` | Redirect → `/listening/sessions/{id}` | Submit answers for grading |
| POST | `/listening/{passage}/sample` | — | JSON `{ text }` | AI model answers |
| GET | `/listening/{passage}/audio` | — | `audio/mpeg` (MP3) | Synthesised audio (cached after first request) |
| GET | `/listening/sessions/{session}` | — | Inertia `Listening/Feedback` | Graded session feedback |

**Error responses for `/audio`:**
- `503` — TTS not configured (missing API key)
- `500` — TTS API error (body: `{ "error": "..." }`)

---

## Vocabulary

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/vocabulary` | — | Inertia `Vocabulary` | Notebook list + stats |
| POST | `/vocabulary` | `{ word, definition?, example?, level? }` | Redirect | Add word |
| POST | `/vocabulary/suggest` | `{ word }` | JSON `{ example, level }` | AI-generate example sentence + CEFR level |
| PUT | `/vocabulary/{entry}` | `{ definition?, example?, level? }` | Redirect | Update entry |
| DELETE | `/vocabulary/{entry}` | — | Redirect | Delete entry |
| GET | `/vocabulary/review` | — | Inertia `Vocabulary/Review` | SRS cards due today |
| POST | `/vocabulary/review/{entry}` | `{ rating }` (1–4) | JSON `{ next_due, state }` | Rate recall, apply FSRS |

**`/vocabulary/suggest` response:**
```json
{ "example": "She was tenacious in her pursuit of the promotion.", "level": "c1" }
```
Returns `null` for either field if Gemini fails.

---

## Drills

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/drill` | — | Inertia `Drill/Index` | Session start — cards due today |
| POST | `/drill/{card}/answer` | `{ rating, session_uuid }` | JSON `{ next_due, state, session_summary? }` | Answer card, update FSRS |
| GET | `/drill/summary` | — | Inertia `Drill/Summary` | Session results + history |

---

## Mock Exam

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/mock` | — | Inertia `Mock/Index` | Session history |
| POST | `/mock` | — | Redirect → `/mock/{session}` | Start new 65-min exam |
| GET | `/mock/{session}` | — | Inertia `Mock/Hub` | Hub with skill completion status + scores |

---

## Profile & Glossary

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/profile` | Inertia `Profile` | Error stratigraphy, score sparklines, badges |
| GET | `/glossary` | Inertia `Glossary` | Error code definitions and examples |

---

## Common Patterns

**Authentication:** All protected routes redirect unauthenticated requests to `/login`.

**Ownership:** Session/entry resources check `user_id === auth()->id()` and return `403` otherwise.

**Inertia responses:** Controllers call `Inertia::render('Page/Name', [...props])`. On XHR (Inertia) requests this returns JSON; on first-load requests it returns a full HTML page.

**JSON-only endpoints** (`/compose/draft`, `/vocabulary/suggest`, `/submissions/{id}/status`, etc.) check `$request->wantsJson()` or always return `response()->json()`.

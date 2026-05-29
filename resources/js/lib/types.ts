// Inertia page-prop contracts. These are the contracts each controller must
// satisfy. Mirrors handoff §5 exactly.

export type User = {
    id: number;
    name: string;
    initial: string;
    level: 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
    streak_days: number;
};

export type Dimension = 'grammar' | 'vocabulary' | 'coherence' | 'task';

export type ErrorCode =
    | 'preposition_choice'
    | 'article_omission'
    | 'register_mismatch'
    | 'subject_verb_agreement'
    | 'cohesion_weak'
    | 'comma_splice'
    | 'verb_tense_shift'
    | 'word_form'
    | 'collocation_unusual'
    | 'paragraph_unfocused'
    | 'off_topic_drift'
    | 'prompt_partial';

export type Prompt = {
    id: number;
    text: string;
    level: User['level'];
    task_type: 'task-1' | 'task-2';
    duration_minutes: number;
    focus_category?: ErrorCode; // "today's focus"
};

export type Severity = 'good' | 'low' | 'med' | 'high';

export type ErrorInstance = {
    id: string;
    type: ErrorCode;
    dimension: Dimension;
    span_start: number; // character offsets into submission.text
    span_end: number;
    span_text: string;
    suggested_fix: string; // includes the prefix dash if shown ("— or omit", "at", etc.)
    note: string; // the coach's marginalia — full sentence, warm tone
    severity: Severity;
    recent_count?: number; // how many times this type appeared in last 14 days (incl. this one)
};

export type SubmissionScore = {
    grammar: number; // 0–100
    vocabulary: number;
    coherence: number;
    task: number;
    overall: number; // computed: round((g+v+c+t)/4)
};

export type Submission = {
    id: number;
    prompt: Prompt;
    text: string;
    submitted_at: string; // ISO
    graded_at: string | null;
    status: 'draft' | 'grading' | 'graded' | 'failed';
    score: SubmissionScore;
    errors: ErrorInstance[];
    dimension_notes: Record<Dimension, string>;
    headline: { primary: string; secondary: string };
    meta: { model: string; taxonomy_version: string };
    added_drill_cards: number;
    recurring_pattern: {
        code: ErrorCode;
        headline: string;
        weekly_count: number;
        streak_length: number;
    } | null;
    vocab_examples: { word: string; examples: string[] }[];
};

export type StratiBin = {
    week_starting: string; // ISO date
    count: number; // raw count of instances that week
    intensity: number; // 0..1, normalized for chart drawing
};

export type StratiLayer = {
    code: ErrorCode;
    display_name: string;
    dimension: Dimension;
    peak: number; // total count for the period
    status: 'active' | 'improving' | 'resolved';
    weeks: StratiBin[]; // last 12 weeks, oldest first
};

export type DrillCard = {
    id: string;
    type: ErrorCode;
    source: string; // "Your submission · 9:42pm yesterday" OR "Synthesized from your patterns"
    is_real_source: boolean;
    prompt: string; // contains "___" exactly once
    options: string[]; // length 4
    correct_index: number;
    yours: string | null; // the answer they originally wrote (if from real submission)
    note: string; // explanation revealed after answer
};

// ── Shared (every page) ──────────────────────────────────────────
export type GeminiUsage = {
    requests_today: number;
    tokens_today: number;
    requests_min: number;
    limit_req_day: number;
    limit_tok_day: number;
    limit_req_min: number;
};

export type SharedProps = {
    auth: { user: User };
    streak: { current_days: number };
    gemini_usage: GeminiUsage | null;
};

// ── Per-page prop bundles ────────────────────────────────────────

export type ScorePoint = { date: string; score: number };

export type VocabularyEntry = {
    id: number;
    word: string;
    definition: string | null;
    example: string | null;
    level: string | null;
    source: 'manual' | 'feedback' | 'drill';
    used_in_prompt: boolean;
    srs_state: string | null;
    srs_due_at: string | null;
    created_at: string;
};

export type VocabWord = {
    id: number;
    word: string;
    definition: string | null;
    level: string | null;
};

export type GlossaryEntry = {
    code: ErrorCode;
    display_name: string;
    dimension: Dimension;
    explanation: string;
    wrong: string;
    right: string;
    tip: string;
};

export type HomePageProps = {
    greeting: { time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'; day_label: string };
    headline: { primary: string; secondary: string };
    lead: string;
    today_prompt: Prompt;
    streak: { current_days: number; history: number[] }; // 21 entries, 0 or 1
    patterns: Array<{ code: ErrorCode; display_name: string; delta: number; trend: 'up' | 'down' | 'flat' }>;
    recent: Array<
        Pick<Submission, 'id' | 'submitted_at' | 'score'> & {
            prompt: Pick<Prompt, 'text'>;
            flag: { kind: 'pattern' | 'win'; text: string } | null;
        }
    >;
    score_history: ScorePoint[];
    written_today: boolean;
    level_up: { current: string; suggested: string; avg_score: number } | null;
    today_activity: { reading: number; speaking: number; listening: number; vocab_due: number };
};

export type ComposePageProps = {
    prompt: Prompt;
    draft: { text: string; updated_at: string | null };
    focus_category: ErrorCode | null;
    focus_label: string | null;
    vocab_challenge: string[]; // words from notebook to try using in this essay
};

export type GradingPageProps = {
    submission_id: number;
    estimated_seconds: number;
    channel: string; // Reverb channel to subscribe to
};

export type FeedbackPageProps = {
    submission: Submission;
    delta_vs_last_week: number;
};

export type ProfilePageProps = {
    active_focus: {
        code: ErrorCode;
        display_name: string;
        headline: string;
        lead: string;
        weekly_count: number;
        monthly_count: number;
    } | null;
    layers: StratiLayer[]; // ordered by status then peak desc
    by_dimension: Array<{ dimension: Dimension; count: number; codes: ErrorCode[] }>;
    score_history:      ScorePoint[];
    reading_history:    ScorePoint[];
    speaking_history:   ScorePoint[];
    listening_history:  ScorePoint[];
    badge_stats: {
        streak: number; essays: number; reading: number; speaking: number;
        listening: number; vocab: number;
        best_writing: number; best_reading: number; best_speaking: number;
    };
};

export type DrillPageProps = {
    session_id: string;
    cards: DrillCard[];
    focus_category: ErrorCode;
};

export type DrillSummaryPageProps = {
    session_id: string;
    focus_category: ErrorCode;
    correct: number;
    total: number;
    note: string;
    history: Array<{ date: string; correct: number; total: number; accuracy: number }>;
};

// ── Speaking ─────────────────────────────────────────────────────────

export type SpeakingDimension = 'fluency' | 'vocabulary' | 'grammar' | 'pronunciation';

export type SpeakingPromptSummary = {
    id: number;
    text: string;
    topic: string;
    level: string;
    target_seconds: number;
    cue_count: number;
    best_score: number | null;
    attempts: number;
};

export type SpeakingIndexProps = { topics: string[]; prompts: SpeakingPromptSummary[] };

export type SpeakingShowProps = {
    prompt: {
        id: number;
        text: string;
        cue_points: string[];
        topic: string;
        level: string;
        target_seconds: number;
    };
    vocab_words: VocabWord[];
};

export type SpeakingFeedbackProps = {
    prompt: { id: number; text: string; topic: string; level: string };
    session: {
        id: number;
        overall: number;
        has_audio: boolean;
        transcript: string;
        scores: Record<SpeakingDimension, number>;
        dimension_notes: Record<SpeakingDimension, string>;
        headline: { primary: string; secondary: string };
        overall_note: string;
        duration_seconds: number | null;
        graded_at: string;
    };
};

// ── Reading ──────────────────────────────────────────────────────────

export type ReadingPassageSummary = {
    id: number;
    title: string;
    topic: string;
    level: string;
    word_count: number;
    question_count: number;
    best_score: number | null;
    attempts: number;
};

export type ReadingQuestionItem = {
    id: number;
    position: number;
    question_text: string;
};

export type ReadingQuestionFeedback = {
    question_id: number;
    score: number;
    correct: boolean;
    note: string;
};

export type ReadingIndexProps  = { topics: string[]; passages: ReadingPassageSummary[] };

export type ReadingShowProps = {
    passage: { id: number; title: string; body: string; topic: string; level: string; word_count: number };
    questions: ReadingQuestionItem[];
    vocab_words: VocabWord[];
};

// ── Content Studio Dashboard ─────────────────────────────────────────

export type DashboardReading = {
    id: number;
    title: string;
    topic: string;
    level: string;
};

export type DashboardSpeaking = {
    id: number;
    text: string;
    topic: string;
    level: string;
};

export type DashboardWriting = {
    id: number;
    text: string;
    level: string;
    task_type: string;
};

export type DashboardStats = {
    reading:  { b2: number; c1: number; total: number };
    speaking: { b2: number; c1: number; total: number };
    writing:  { b2: number; c1: number; total: number };
};

export type DashboardProps = {
    stats:    DashboardStats;
    reading:  DashboardReading[];
    speaking: DashboardSpeaking[];
    writing:  DashboardWriting[];
};

// ── Listening ────────────────────────────────────────────────────────────────

export type ListeningPassageSummary = {
    id: number;
    title: string;
    topic: string;
    level: string;
    word_count: number;
    question_count: number;
    best_score: number | null;
    attempts: number;
};

export type ListeningIndexProps = { topics: string[]; passages: ListeningPassageSummary[] };

export type ListeningShowProps = {
    passage: { id: number; title: string; audio_script: string; topic: string; level: string; word_count: number };
    questions: Array<{ id: number; position: number; question_text: string }>;
};

export type ListeningFeedbackProps = {
    passage: { id: number; title: string; topic: string; level: string };
    session: {
        id: number;
        score: number;
        overall_note: string;
        time_taken_seconds: number;
        graded_at: string;
    };
    questions: Array<{
        id: number;
        position: number;
        question_text: string;
        user_answer: string;
        feedback: { score: number; correct: boolean; note: string } | null;
    }>;
};

// ── Vocab Review (SRS) ───────────────────────────────────────────────────────

export type VocabReviewCard = {
    id: number;
    word: string;
    definition: string | null;
    example: string | null;
    level: string | null;
    state: 'new' | 'learning' | 'review';
};

export type VocabularyReviewProps = {
    cards: VocabReviewCard[];
    total_due: number;
};

// ── Mock Test ────────────────────────────────────────────────────────────────

export type MockSection = {
    prompt_id?: number;
    passage_id?: number;
    text?: string;
    title?: string;
    score: number | null;
};

export type MockHubProps = {
    mock: {
        id: number;
        started_at: string;
        status: string;
        writing:  { prompt_id: number; text: string; score: number | null } | null;
        reading:  { passage_id: number; title: string; score: number | null } | null;
        speaking: { prompt_id: number; text: string; score: number | null } | null;
    };
};

export type MockIndexProps = {
    history: Array<{
        id: number;
        started_at: string;
        status: string;
        writing: string | null;
        reading: string | null;
        speaking: string | null;
    }>;
};

// ── SpeakingFeedbackProps — updated with has_audio ───────────────────────────

export type ReadingFeedbackProps = {
    passage: { id: number; title: string; topic: string; level: string };
    session: {
        id: number;
        score: number;
        overall_note: string;
        time_taken_seconds: number;
        graded_at: string;
    };
    questions: Array<{
        id: number;
        position: number;
        question_text: string;
        user_answer: string;
        feedback: ReadingQuestionFeedback | null;
    }>;
};

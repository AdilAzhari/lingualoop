export type BadgeStat = {
    streak: number;
    essays: number;
    reading: number;
    speaking: number;
    listening: number;
    vocab: number;
    best_writing: number;
    best_reading: number;
    best_speaking: number;
};

export type Badge = {
    key: string;
    label: string;
    description: string;
    icon: string;
    earned: (s: BadgeStat) => boolean;
};

export const BADGES: Badge[] = [
    // Streaks
    { key: 'streak_3',  label: '3-Day Streak',   description: '3 days in a row',  icon: '🔥', earned: (s) => s.streak >= 3  },
    { key: 'streak_7',  label: 'Week Warrior',    description: '7 days straight',  icon: '🔥', earned: (s) => s.streak >= 7  },
    { key: 'streak_14', label: 'Two Weeks',        description: '14 days straight', icon: '⚡', earned: (s) => s.streak >= 14 },
    { key: 'streak_30', label: 'Monthly Grind',   description: '30 days straight', icon: '💎', earned: (s) => s.streak >= 30 },
    // Writing
    { key: 'essays_1',  label: 'First Essay',     description: 'Submit your first essay',       icon: '✍️', earned: (s) => s.essays >= 1  },
    { key: 'essays_5',  label: 'Prolific',         description: '5 graded essays',              icon: '✍️', earned: (s) => s.essays >= 5  },
    { key: 'essays_10', label: 'Writer',           description: '10 graded essays',             icon: '✍️', earned: (s) => s.essays >= 10 },
    { key: 'essays_25', label: 'Essay Machine',   description: '25 graded essays',              icon: '🏆', earned: (s) => s.essays >= 25 },
    // Reading
    { key: 'reading_1', label: 'First Read',       description: 'Complete a reading passage',   icon: '📖', earned: (s) => s.reading >= 1  },
    { key: 'reading_5', label: 'Avid Reader',      description: '5 reading sessions',           icon: '📖', earned: (s) => s.reading >= 5  },
    // Speaking
    { key: 'speaking_1', label: 'First Take',      description: 'Complete a speaking session',  icon: '🎤', earned: (s) => s.speaking >= 1 },
    { key: 'speaking_5', label: 'Confident',       description: '5 speaking sessions',          icon: '🎤', earned: (s) => s.speaking >= 5 },
    // Listening
    { key: 'listening_1', label: 'Good Ear',       description: 'Complete a listening session', icon: '👂', earned: (s) => s.listening >= 1 },
    // Vocabulary
    { key: 'vocab_10',  label: 'Word Collector',   description: '10 words in notebook',         icon: '📚', earned: (s) => s.vocab >= 10 },
    { key: 'vocab_25',  label: 'Lexicon Builder',  description: '25 words in notebook',         icon: '📚', earned: (s) => s.vocab >= 25 },
    // Scores
    { key: 'score_w80', label: 'Sharp Pen',        description: 'Score ≥ 80 on writing',        icon: '⭐', earned: (s) => s.best_writing >= 80  },
    { key: 'score_w90', label: 'Band 9 Writing',   description: 'Score ≥ 90 on writing',        icon: '🌟', earned: (s) => s.best_writing >= 90  },
    { key: 'score_r80', label: 'Sharp Reader',     description: 'Score ≥ 80 on reading',        icon: '⭐', earned: (s) => s.best_reading >= 80  },
    { key: 'score_s80', label: 'Fluent Speaker',   description: 'Score ≥ 80 on speaking',       icon: '⭐', earned: (s) => s.best_speaking >= 80 },
];

const STORAGE_KEY = 'll_earned_badges';

export function getStoredBadges(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

export function storeBadges(keys: string[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch {}
}

export function computeEarned(stats: BadgeStat): string[] {
    return BADGES.filter((b) => b.earned(stats)).map((b) => b.key);
}

export function findNewBadges(stats: BadgeStat): Badge[] {
    const stored  = getStoredBadges();
    const earned  = computeEarned(stats);
    storeBadges(earned);
    return BADGES.filter((b) => earned.includes(b.key) && !stored.has(b.key));
}

import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import { Ico } from '@/Components/Common/icons';
import type { SeIndexProps, SePromptSummary } from '@/lib/types';

const DIFFICULTY_ORDER = ['junior', 'mid', 'senior', 'staff'];

const DIFFICULTY_COLOR: Record<string, string> = {
    junior: 'var(--progress)',
    mid:    'oklch(0.45 0.14 60)',
    senior: 'var(--signal)',
    staff:  'oklch(0.35 0.18 280)',
};

function ScorePip({ label, score }: { label: string; score: number | null }) {
    if (score === null) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-4)', fontStyle: 'italic' }}>—</div>
            </div>
        );
    }
    const color = score >= 80 ? 'var(--progress)' : score >= 60 ? 'oklch(0.45 0.14 60)' : 'var(--signal)';
    return (
        <div style={{ textAlign: 'center' }}>
            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 3 }}>{label}</div>
            <div className="num" style={{ fontSize: 18, color }}>{score}</div>
        </div>
    );
}

function PromptCard({ prompt }: { prompt: SePromptSummary }) {
    const diffColor = DIFFICULTY_COLOR[prompt.difficulty] ?? 'var(--ink-3)';
    const showBoth  = prompt.mode === 'both';

    return (
        <Link href={`/software/${prompt.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
                padding: '20px 24px', display: 'flex',
                alignItems: 'flex-start', justifyContent: 'space-between',
                gap: 16, transition: 'box-shadow .15s',
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="chip" style={{ fontSize: 9.5 }}>
                            {prompt.category.replace(/-/g, ' ')}
                        </span>
                        <span style={{
                            fontFamily: 'var(--mono, monospace)', fontSize: 9.5,
                            color: diffColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            {prompt.difficulty}
                        </span>
                        {prompt.mode !== 'both' && (
                            <span className="chip" style={{ fontSize: 9, background: 'var(--paper-2)', color: 'var(--ink-3)' }}>
                                {prompt.mode} only
                            </span>
                        )}
                    </div>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink)', margin: 0 }}>
                        {prompt.title}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                    {showBoth ? (
                        <>
                            <ScorePip label="writing"  score={prompt.best_writing} />
                            <ScorePip label="speaking" score={prompt.best_speaking} />
                        </>
                    ) : prompt.mode === 'writing' ? (
                        <ScorePip label="writing"  score={prompt.best_writing} />
                    ) : (
                        <ScorePip label="speaking" score={prompt.best_speaking} />
                    )}
                    <Ico.arrow style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                </div>
            </div>
        </Link>
    );
}

export default function SeIndex({ prompts, categories }: SeIndexProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filtered = activeCategory
        ? prompts.filter((p) => p.category === activeCategory)
        : prompts;

    const byDifficulty = DIFFICULTY_ORDER.reduce<Record<string, SePromptSummary[]>>((acc, d) => {
        const group = filtered.filter((p) => p.difficulty === d);
        if (group.length) acc[d] = group;
        return acc;
    }, {});

    return (
        <AppShell>
            <Head title="SE Practice" />
            <Page>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <PageHeader
                        eyebrow="Software Engineering"
                        title="Design practice"
                        italic="system design, architecture & more"
                        lead="Write or talk through real-world SE challenges. Get AI feedback on your technical depth, clarity, and trade-off reasoning."
                    />
                    <Link href="/software/flashcards" className="btn btn-ghost" style={{ flexShrink: 0, marginTop: 4 }}>
                        Flashcards <Ico.arrow />
                    </Link>
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={activeCategory === null ? 'btn' : 'btn btn-ghost'}
                        style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                            className={activeCategory === cat ? 'btn' : 'btn btn-ghost'}
                            style={{ fontSize: 12, padding: '6px 14px' }}
                        >
                            {cat.replace(/-/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* Prompts grouped by difficulty */}
                {Object.entries(byDifficulty).map(([difficulty, items]) => (
                    <section key={difficulty} style={{ marginBottom: 40 }}>
                        <div className="label-mono" style={{
                            fontSize: 9.5, color: DIFFICULTY_COLOR[difficulty] ?? 'var(--ink-4)',
                            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                        }}>
                            {difficulty}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map((p) => <PromptCard key={p.id} prompt={p} />)}
                        </div>
                    </section>
                ))}

                {filtered.length === 0 && (
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 15 }}>
                        No prompts in this category yet.
                    </p>
                )}
            </Page>
        </AppShell>
    );
}

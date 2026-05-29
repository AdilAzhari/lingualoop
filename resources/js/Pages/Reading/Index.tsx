import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import ScoreArc from '@/Components/Common/ScoreArc';
import { Ico } from '@/Components/Common/icons';
import type { ReadingIndexProps } from '@/lib/types';

const LEVEL_LABEL: Record<string, string> = {
    a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2',
};

const LEVEL_COLOR: Record<string, { bg: string; color: string }> = {
    c1: { bg: 'var(--signal)',    color: 'white' },
    c2: { bg: 'var(--signal)',    color: 'white' },
    b2: { bg: 'var(--ink)',       color: 'var(--paper)' },
    b1: { bg: 'var(--ink)',       color: 'var(--paper)' },
    a2: { bg: 'var(--ink)',       color: 'var(--paper)' },
};

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="chip"
            style={{
                cursor: 'pointer', border: 'none', fontSize: 11,
                background: active ? 'var(--ink)' : undefined,
                color: active ? 'var(--paper)' : undefined,
            }}
        >
            {label}
        </button>
    );
}

export default function ReadingIndex({ topics, passages }: ReadingIndexProps) {
    const [activeTopic, setActiveTopic] = useState<string | null>(null);
    const [activeLevel, setActiveLevel] = useState<string | null>(null);

    const levels = [...new Set(passages.map((p) => p.level))].sort();

    const visible = passages.filter((p) =>
        (!activeTopic || p.topic === activeTopic) &&
        (!activeLevel || p.level === activeLevel)
    );

    return (
        <AppShell>
            <Head title="Reading" />
            <Page>
                <PageHeader
                    eyebrow="Reading comprehension"
                    title="Choose a passage"
                    italic="read, answer, improve"
                    lead="Each passage comes with five comprehension questions graded by your AI coach. Read carefully — the answers are always in the text."
                />

                {/* Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {/* Level filter */}
                    {levels.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', minWidth: 36 }}>Level</span>
                            <FilterChip label="All" active={activeLevel === null} onClick={() => setActiveLevel(null)} />
                            {levels.map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setActiveLevel(activeLevel === l ? null : l)}
                                    className="chip"
                                    style={{
                                        cursor: 'pointer', border: 'none', fontSize: 11,
                                        background: activeLevel === l ? (LEVEL_COLOR[l]?.bg ?? 'var(--ink)') : undefined,
                                        color: activeLevel === l ? (LEVEL_COLOR[l]?.color ?? 'var(--paper)') : undefined,
                                    }}
                                >
                                    {LEVEL_LABEL[l] ?? l}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Topic filter */}
                    {topics.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', minWidth: 36 }}>Topic</span>
                            <FilterChip label="All" active={activeTopic === null} onClick={() => setActiveTopic(null)} />
                            {topics.map((t) => (
                                <FilterChip
                                    key={t}
                                    label={t}
                                    active={activeTopic === t}
                                    onClick={() => setActiveTopic(activeTopic === t ? null : t)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
                    {visible.map((p) => {
                        const isAdvanced = p.level === 'c1' || p.level === 'c2';
                        return (
                            <div
                                key={p.id}
                                className="card"
                                style={{
                                    padding: 28, display: 'flex', flexDirection: 'column',
                                    borderLeft: isAdvanced ? '3px solid var(--signal)' : undefined,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <span className="chip" style={{
                                            fontSize: 10,
                                            background: isAdvanced ? 'var(--signal-wash)' : undefined,
                                            color: isAdvanced ? 'var(--signal)' : undefined,
                                            fontWeight: isAdvanced ? 600 : undefined,
                                        }}>
                                            {LEVEL_LABEL[p.level] ?? p.level}
                                        </span>
                                        <span className="chip" style={{ fontSize: 10 }}>{p.topic}</span>
                                    </div>
                                    {p.best_score != null && (
                                        <ScoreArc value={p.best_score} size={52} label="best" />
                                    )}
                                </div>

                                <div style={{
                                    fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic',
                                    lineHeight: 1.2, marginBottom: 10, color: 'var(--ink)',
                                }}>
                                    {p.title}
                                </div>

                                <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 20 }}>
                                    {p.word_count} words · {p.question_count} questions
                                    {p.attempts > 0 && ` · ${p.attempts} attempt${p.attempts > 1 ? 's' : ''}`}
                                </div>

                                <Link
                                    href={`/reading/${p.id}`}
                                    className="btn"
                                    style={{ alignSelf: 'flex-start', fontSize: 13 }}
                                >
                                    {p.attempts > 0 ? 'Read again' : 'Start reading'} <Ico.arrow />
                                </Link>
                            </div>
                        );
                    })}

                    {visible.length === 0 && (
                        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)', gridColumn: '1/-1' }}>
                            No passages match these filters.
                        </p>
                    )}
                </div>
            </Page>
        </AppShell>
    );
}

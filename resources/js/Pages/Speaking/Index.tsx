import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import ScoreArc from '@/Components/Common/ScoreArc';
import { Ico } from '@/Components/Common/icons';
import type { SpeakingIndexProps } from '@/lib/types';

const LEVEL_LABEL: Record<string, string> = {
    a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2',
};

function fmtTarget(s: number) {
    return `${Math.floor(s / 60)} min`;
}

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

export default function SpeakingIndex({ topics, prompts }: SpeakingIndexProps) {
    const [activeTopic, setActiveTopic] = useState<string | null>(null);
    const [activeLevel, setActiveLevel] = useState<string | null>(null);

    const levels = [...new Set(prompts.map((p) => p.level))].sort();

    const visible = prompts.filter((p) =>
        (!activeTopic || p.topic === activeTopic) &&
        (!activeLevel || p.level === activeLevel)
    );

    return (
        <AppShell>
            <Head title="Speaking" />
            <Page>
                <PageHeader
                    eyebrow="Speaking practice"
                    title="Choose a prompt"
                    italic="record, listen, improve"
                    lead="You'll see a cue card, then record yourself speaking for up to 3 minutes. Your AI coach will transcribe what you said and grade your fluency, vocabulary, grammar, and pronunciation."
                />

                {/* Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {/* Level filter */}
                    {levels.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', minWidth: 36 }}>Level</span>
                            <FilterChip label="All" active={activeLevel === null} onClick={() => setActiveLevel(null)} />
                            {levels.map((l) => {
                                const isC = l === 'c1' || l === 'c2';
                                const active = activeLevel === l;
                                return (
                                    <button
                                        key={l}
                                        onClick={() => setActiveLevel(active ? null : l)}
                                        className="chip"
                                        style={{
                                            cursor: 'pointer', border: 'none', fontSize: 11,
                                            background: active ? (isC ? 'var(--signal)' : 'var(--ink)') : undefined,
                                            color: active ? 'white' : (isC ? 'var(--signal)' : undefined),
                                            fontWeight: isC ? 600 : undefined,
                                        }}
                                    >
                                        {LEVEL_LABEL[l] ?? l}
                                    </button>
                                );
                            })}
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
                                        <span className="chip" style={{ fontSize: 10 }}>~{fmtTarget(p.target_seconds)}</span>
                                    </div>
                                    {p.best_score != null && (
                                        <ScoreArc value={p.best_score} size={52} label="best" />
                                    )}
                                </div>

                                <p style={{
                                    fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
                                    lineHeight: 1.4, margin: '0 0 10px', color: 'var(--ink)',
                                }}>
                                    {p.text}
                                </p>

                                <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 20 }}>
                                    {p.cue_count} cue points
                                    {p.attempts > 0 && ` · ${p.attempts} attempt${p.attempts > 1 ? 's' : ''}`}
                                </div>

                                <Link
                                    href={`/speaking/${p.id}`}
                                    className="btn"
                                    style={{ alignSelf: 'flex-start', fontSize: 13, marginTop: 'auto' }}
                                >
                                    {p.attempts > 0 ? 'Practice again' : 'Start speaking'} <Ico.arrow />
                                </Link>
                            </div>
                        );
                    })}

                    {visible.length === 0 && (
                        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)', gridColumn: '1/-1' }}>
                            No prompts match these filters.
                        </p>
                    )}
                </div>
            </Page>
        </AppShell>
    );
}

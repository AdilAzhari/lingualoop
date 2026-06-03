import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import type { ImageIndexProps, ImagePromptSummary } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
    chart: 'Chart', graph: 'Graph', table: 'Table',
    diagram: 'Diagram', map: 'Map', photo: 'Photo',
};

function PromptCard({ p }: { p: ImagePromptSummary }) {
    const hasBoth = p.mode === 'both';
    return (
        <Link
            href={`/images/${p.id}`}
            style={{ textDecoration: 'none' }}
        >
            <div className="card" style={{
                padding: '24px 28px', cursor: 'pointer',
                transition: 'transform 0.12s, box-shadow 0.12s',
            }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className="chip" style={{ fontSize: 10 }}>{TYPE_LABELS[p.type] ?? p.type}</span>
                        <span className="chip" style={{ fontSize: 10 }}>{p.level.toUpperCase()}</span>
                        <span className="chip" style={{ fontSize: 10 }}>{p.topic}</span>
                    </div>
                    {hasBoth && (
                        <div style={{ display: 'flex', gap: 4 }}>
                            <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink-4)' }}>✏ W</span>
                            <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink-4)' }}>🎙 S</span>
                        </div>
                    )}
                </div>
                <p style={{
                    fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic',
                    color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.4,
                }}>
                    {p.title}
                </p>
                <div style={{ display: 'flex', gap: 20 }}>
                    {p.best_writing !== null && (
                        <div>
                            <div className="num" style={{ fontSize: 22, color: 'var(--ink)' }}>{p.best_writing}</div>
                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>best · writing</div>
                        </div>
                    )}
                    {p.best_speaking !== null && (
                        <div>
                            <div className="num" style={{ fontSize: 22, color: 'var(--ink)' }}>{p.best_speaking}</div>
                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>best · speaking</div>
                        </div>
                    )}
                    {p.best_writing === null && p.best_speaking === null && (
                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>not attempted</div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function ImageIndex({ prompts, topics, types }: ImageIndexProps) {
    const [topic, setTopic]     = useState('');
    const [type, setType]       = useState('');

    const filtered = prompts
        .filter((p) => !topic || p.topic === topic)
        .filter((p) => !type  || p.type  === type);

    return (
        <AppShell>
            <Head title="Image Description" />
            <Page>
                <SectionHeader label="Image description" />
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)', margin: '0 0 32px', lineHeight: 1.6 }}>
                    Practise describing charts, graphs, diagrams, maps, and photos — in writing or speaking.
                </p>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                    <button onClick={() => { setTopic(''); setType(''); }} className={`chip${!topic && !type ? ' chip-active' : ''}`}>All</button>
                    {types.map((t) => (
                        <button key={t} onClick={() => setType(type === t ? '' : t)} className={`chip${type === t ? ' chip-active' : ''}`}>
                            {TYPE_LABELS[t] ?? t}
                        </button>
                    ))}
                    <span style={{ width: 1, background: 'var(--hairline)', margin: '0 4px' }} />
                    {topics.map((t) => (
                        <button key={t} onClick={() => setTopic(topic === t ? '' : t)} className={`chip${topic === t ? ' chip-active' : ''}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 15 }}>
                        No prompts match these filters.
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {filtered.map((p) => <PromptCard key={p.id} p={p} />)}
                    </div>
                )}
            </Page>
        </AppShell>
    );
}

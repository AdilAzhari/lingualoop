import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import Chip from '@/Components/Common/Chip';
import type { Dimension, GlossaryEntry } from '@/lib/types';

type Props = { entries: GlossaryEntry[] };

const DIM_LABEL: Record<Dimension, string> = {
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    coherence: 'Coherence',
    task: 'Task',
};

const DIM_VARIANT: Record<Dimension, 'default' | 'signal' | 'progress'> = {
    grammar: 'signal',
    vocabulary: 'default',
    coherence: 'progress',
    task: 'default',
};

export default function Glossary({ entries }: Props) {
    const [open, setOpen] = useState<string | null>(null);
    const [filter, setFilter] = useState<Dimension | 'all'>('all');

    const filtered = filter === 'all' ? entries : entries.filter((e) => e.dimension === filter);

    return (
        <AppShell>
            <Head title="Error glossary" />
            <Page>
                <PageHeader
                    eyebrow="Error taxonomy · v3.2"
                    title="What each pattern means"
                    italic="and how to fix it"
                    lead="Twelve error codes, explained once and properly. Each entry shows the rule, a wrong example, a right example, and a memory tip."
                />

                {/* Dimension filter */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
                    {(['all', 'grammar', 'vocabulary', 'coherence', 'task'] as const).map((d) => (
                        <button
                            key={d}
                            onClick={() => setFilter(d)}
                            style={{
                                padding: '6px 16px', fontSize: 13,
                                fontFamily: 'var(--serif)', cursor: 'pointer',
                                borderRadius: 99, border: '1px solid',
                                borderColor: filter === d ? 'var(--ink)' : 'var(--hairline)',
                                background: filter === d ? 'var(--ink)' : 'transparent',
                                color: filter === d ? 'var(--paper)' : 'var(--ink-2)',
                                transition: 'all .15s ease',
                            }}
                        >
                            {d === 'all' ? 'All' : DIM_LABEL[d]}
                        </button>
                    ))}
                </div>

                <div className="col" style={{ gap: 0 }}>
                    {filtered.map((entry, i) => (
                        <div
                            key={entry.code}
                            style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--hairline)' }}
                        >
                            {/* Header row — always visible */}
                            <button
                                onClick={() => setOpen(open === entry.code ? null : entry.code)}
                                style={{
                                    width: '100%', padding: '20px 8px',
                                    display: 'grid', gridTemplateColumns: '220px 1fr 120px 32px',
                                    gap: 20, alignItems: 'center',
                                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                                }}
                            >
                                <div>
                                    <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic' }}>
                                        {entry.display_name}
                                    </div>
                                    <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2 }}>
                                        {entry.code}
                                    </div>
                                </div>
                                <Marginalia style={{ fontSize: 13, lineHeight: 1.4 }}>
                                    {entry.explanation.split('.')[0]}.
                                </Marginalia>
                                <Chip variant={DIM_VARIANT[entry.dimension]} style={{ justifySelf: 'flex-start' }}>
                                    {DIM_LABEL[entry.dimension]}
                                </Chip>
                                <span style={{ color: 'var(--ink-3)', fontSize: 18, fontFamily: 'var(--serif)' }}>
                                    {open === entry.code ? '−' : '+'}
                                </span>
                            </button>

                            {/* Expanded detail */}
                            {open === entry.code && (
                                <div style={{
                                    padding: '0 8px 28px',
                                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                                    gap: 32,
                                }}>
                                    <div>
                                        <Eyebrow style={{ marginBottom: 10 }}>Full explanation</Eyebrow>
                                        <Marginalia style={{ fontSize: 14, lineHeight: 1.6 }}>
                                            {entry.explanation}
                                        </Marginalia>
                                        <div style={{ marginTop: 20, padding: 16, background: 'var(--signal-wash)', borderRadius: 'var(--r-2)' }}>
                                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--signal)', marginBottom: 6 }}>WRONG</div>
                                            <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                                                "{entry.wrong}"
                                            </p>
                                        </div>
                                        <div style={{ marginTop: 10, padding: 16, background: 'var(--progress-wash)', borderRadius: 'var(--r-2)' }}>
                                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--progress)', marginBottom: 6 }}>RIGHT</div>
                                            <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                                                "{entry.right}"
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <Eyebrow style={{ marginBottom: 10 }}>Memory tip</Eyebrow>
                                        <div style={{ padding: 20, background: 'var(--pencil-wash)', borderRadius: 'var(--r-2)', borderLeft: '3px solid var(--pencil)' }}>
                                            <Marginalia style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
                                                {entry.tip}
                                            </Marginalia>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Page>
        </AppShell>
    );
}

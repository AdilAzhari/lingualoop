import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import { Ico } from '@/Components/Common/icons';
import type { MockIndexProps } from '@/lib/types';

export default function MockIndex({ history }: MockIndexProps) {
    const startTest = () => {
        router.post('/mock');
    };

    return (
        <AppShell>
            <Head title="Mock Test" />
            <Page>
                <PageHeader
                    eyebrow="Mock IELTS Test"
                    title="Simulate exam day"
                    italic="write, read, speak"
                    lead="A full practice session across all three skills. You'll get a writing prompt, a reading passage, and a speaking task — all randomly selected. Complete each section, then see your scores."
                />

                {/* Exam structure overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
                    {[
                        { label: 'Writing', desc: 'Argumentative essay or descriptive task', time: '40 min', color: 'var(--ink)' },
                        { label: 'Reading', desc: 'Academic passage with 5 comprehension questions', time: '20 min', color: 'var(--progress)' },
                        { label: 'Speaking', desc: 'Open-ended prompt with cue points', time: '~5 min', color: 'var(--signal)' },
                    ].map((s) => (
                        <div key={s.label} className="card" style={{ padding: '20px 22px', borderTop: `3px solid ${s.color}` }}>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', marginBottom: 6, color: 'var(--ink)' }}>{s.label}</div>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)', marginBottom: 10 }}>{s.desc}</div>
                            <span className="chip" style={{ fontSize: 10 }}>{s.time}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 64 }}>
                    <button onClick={startTest} className="btn" style={{ fontSize: 16, padding: '14px 36px' }}>
                        Start mock test <Ico.arrow />
                    </button>
                </div>

                {/* History */}
                {history.length > 0 && (
                    <div>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14 }}>
                            Previous tests
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {history.map((h) => (
                                <Link
                                    key={h.id}
                                    href={`/mock/${h.id}`}
                                    style={{
                                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16,
                                        padding: '14px 18px', background: 'var(--paper-2)', borderRadius: 10,
                                        color: 'inherit',
                                    }}
                                >
                                    <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', minWidth: 80 }}>{h.started_at}</span>
                                    <span className={`chip`} style={{ fontSize: 10, background: h.status === 'complete' ? 'var(--progress-wash)' : undefined, color: h.status === 'complete' ? 'var(--progress)' : undefined }}>
                                        {h.status}
                                    </span>
                                    <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {h.reading ?? h.writing ?? h.speaking ?? 'Test'}
                                    </span>
                                    <Ico.arrow style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </Page>
        </AppShell>
    );
}

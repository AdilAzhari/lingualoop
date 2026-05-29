import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import { Ico } from '@/Components/Common/icons';
import type { DrillSummaryPageProps } from '@/lib/types';

export default function DrillSummary({ focus_category, correct, total, note, history }: DrillSummaryPageProps) {
    return (
        <AppShell>
            <Head title="Drill complete" />
            <Page>
                <div className="col gap-8 center" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 60 }}>
                    <Eyebrow>Drill complete · {focus_category}</Eyebrow>
                    <h1 className="display" style={{ fontSize: 56, margin: 0, fontWeight: 400, maxWidth: 720, lineHeight: 1.1 }}>
                        <span className="num" style={{ fontStyle: 'normal' }}>{correct}</span>
                        <em style={{ fontWeight: 300, color: 'var(--ink-2)' }}> of {total}</em>
                    </h1>
                    <Marginalia style={{ fontSize: 18, maxWidth: 540, lineHeight: 1.5 }}>{note}</Marginalia>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <Link href="/drill" className="btn-ghost btn">Once more</Link>
                        <Link href="/" className="btn">Back to today <Ico.arrow /></Link>
                    </div>
                </div>

                {/* Session history */}
                {history.length > 1 && (
                    <div style={{ maxWidth: 480, margin: '60px auto 0' }}>
                        <Eyebrow style={{ marginBottom: 16, textAlign: 'center' }}>Your last {history.length} sessions</Eyebrow>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {history.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'grid', gridTemplateColumns: '80px 1fr 80px',
                                        gap: 16, alignItems: 'center', padding: '14px 20px',
                                        borderTop: i === 0 ? 'none' : '0.5px solid var(--hairline)',
                                        background: i === 0 ? 'var(--paper-2)' : 'transparent',
                                    }}
                                >
                                    <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                        {i === 0 ? 'today' : s.date}
                                    </span>
                                    <div style={{ height: 6, background: 'var(--paper-3)', borderRadius: 3 }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3,
                                            width: `${s.accuracy}%`,
                                            background: s.accuracy >= 80 ? 'var(--progress)' : s.accuracy >= 60 ? 'var(--ink-3)' : 'var(--signal)',
                                            transition: 'width .4s ease',
                                        }} />
                                    </div>
                                    <span className="num" style={{
                                        fontSize: 14, textAlign: 'right',
                                        color: s.accuracy >= 80 ? 'var(--progress)' : s.accuracy >= 60 ? 'var(--ink-2)' : 'var(--signal)',
                                    }}>
                                        {s.accuracy}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Page>
        </AppShell>
    );
}

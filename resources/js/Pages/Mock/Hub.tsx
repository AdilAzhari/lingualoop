import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import ScoreArc from '@/Components/Common/ScoreArc';
import { Ico } from '@/Components/Common/icons';
import type { MockHubProps } from '@/lib/types';

function useCountdown(startedAt: string) {
    const TARGET_MINS = 65;
    const endTime = new Date(startedAt).getTime() + TARGET_MINS * 60 * 1000;

    const calcRemaining = () => Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const [remaining, setRemaining] = useState(calcRemaining);

    useEffect(() => {
        if (remaining <= 0) return;
        const id = setInterval(() => setRemaining(calcRemaining), 1000);
        return () => clearInterval(id);
    });

    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const pct = Math.max(0, remaining / (TARGET_MINS * 60));
    return { display: `${m}:${s.toString().padStart(2, '0')}`, expired: remaining === 0, pct };
}

function SectionCard({
    label,
    subtitle,
    score,
    href,
    accentColor,
    truncatedText,
}: {
    label: string;
    subtitle: string;
    score: number | null;
    href: string;
    accentColor: string;
    truncatedText: string;
}) {
    const done = score !== null;
    return (
        <div className="card" style={{ padding: '24px 28px', borderTop: `3px solid ${accentColor}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', marginBottom: 4 }}>{label}</div>
                    <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{subtitle}</div>
                </div>
                {done && <ScoreArc value={score} size={64} label="score" />}
                {!done && (
                    <span className="chip" style={{ fontSize: 10, background: 'var(--paper-3)', color: 'var(--ink-4)' }}>Not started</span>
                )}
            </div>

            <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-3)', margin: '0 0 18px', flexGrow: 1 }}>
                {truncatedText}
            </p>

            {done ? (
                <Link href={href} className="btn" style={{ alignSelf: 'flex-start', fontSize: 13, background: 'var(--paper-3)', color: 'var(--ink)' }}>
                    Do again
                </Link>
            ) : (
                <Link href={href} className="btn" style={{ alignSelf: 'flex-start', fontSize: 13 }}>
                    Start section <Ico.arrow />
                </Link>
            )}
        </div>
    );
}

export default function MockHub({ mock }: MockHubProps) {
    const { display, expired, pct } = useCountdown(mock.started_at);

    const scores = [mock.writing?.score ?? null, mock.reading?.score ?? null, mock.speaking?.score ?? null].filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const allDone = mock.writing?.score != null && mock.reading?.score != null && mock.speaking?.score != null;

    const refreshHub = () => router.reload();

    return (
        <AppShell>
            <Head title="Mock Test Hub" />
            <Page>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 6 }}>Mock test · in progress</div>
                        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>
                            {allDone ? 'Test complete' : 'Complete all three sections'}
                        </h1>
                    </div>

                    {/* Countdown clock */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 36, fontWeight: 600, color: expired ? 'var(--signal)' : pct < 0.25 ? 'oklch(0.45 0.14 60)' : 'var(--ink)' }}>
                            {expired ? 'Time up' : display}
                        </div>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)' }}>
                            {expired ? 'but still submit!' : 'remaining · 65 min exam'}
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 3, background: 'var(--hairline)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(1 - pct) * 100}%`, background: expired ? 'var(--signal)' : 'var(--ink)', transition: 'width 1s linear', borderRadius: 99 }} />
                        </div>
                    </div>
                </div>

                {/* Section cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                    {mock.writing && (
                        <SectionCard
                            label="Writing"
                            subtitle="Task 2 · argumentative essay"
                            score={mock.writing.score}
                            href="/compose"
                            accentColor="var(--ink)"
                            truncatedText={(mock.writing.text?.substring(0, 120) ?? '') + (mock.writing.text && mock.writing.text.length > 120 ? '…' : '')}
                        />
                    )}
                    {mock.reading && (
                        <SectionCard
                            label="Reading"
                            subtitle="5 comprehension questions"
                            score={mock.reading.score}
                            href={`/reading/${mock.reading.passage_id}`}
                            accentColor="var(--progress)"
                            truncatedText={mock.reading.title ?? ''}
                        />
                    )}
                    {mock.speaking && (
                        <SectionCard
                            label="Speaking"
                            subtitle="Cue-card prompt · ~5 min"
                            score={mock.speaking.score}
                            href={`/speaking/${mock.speaking.prompt_id}`}
                            accentColor="var(--signal)"
                            truncatedText={(mock.speaking.text?.substring(0, 120) ?? '') + (mock.speaking.text && mock.speaking.text.length > 120 ? '…' : '')}
                        />
                    )}
                </div>

                {/* Refresh / results */}
                {!allDone && (
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button onClick={refreshHub} className="btn" style={{ fontSize: 13, background: 'var(--paper-3)', color: 'var(--ink)' }}>
                            ↺ Refresh scores
                        </button>
                        <Link href="/mock" className="btn btn-ghost">All tests</Link>
                    </div>
                )}

                {/* Results summary */}
                {allDone && avgScore !== null && (
                    <div className="card" style={{ padding: '32px 40px', textAlign: 'center', background: 'var(--paper-2)', marginTop: 24 }}>
                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 16 }}>Test complete · estimated band score</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 28 }}>
                            <ScoreArc value={avgScore} size={120} label="Overall" />
                            {mock.writing?.score  != null && <ScoreArc value={mock.writing.score}  size={80} label="Writing"  />}
                            {mock.reading?.score  != null && <ScoreArc value={mock.reading.score}  size={80} label="Reading"  />}
                            {mock.speaking?.score != null && <ScoreArc value={mock.speaking.score} size={80} label="Speaking" />}
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Link href="/mock" className="btn btn-ghost">Start new test</Link>
                            <Link href="/profile" className="btn">View progress <Ico.arrow /></Link>
                        </div>
                    </div>
                )}
            </Page>
        </AppShell>
    );
}

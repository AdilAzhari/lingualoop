import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import ScoreArc from '@/Components/Common/ScoreArc';
import BandBadge from '@/Components/Common/BandBadge';
import { Ico } from '@/Components/Common/icons';
import type { ReadingFeedbackProps } from '@/lib/types';

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
}

function ScoreBadge({ score, correct }: { score: number; correct: boolean }) {
    const bg    = correct ? 'var(--progress-wash)' : score >= 40 ? 'oklch(0.97 0.07 70)' : 'var(--signal-wash)';
    const color = correct ? 'var(--progress)'      : score >= 40 ? 'oklch(0.45 0.14 60)'  : 'var(--signal)';
    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 999,
            background: bg, color, fontFamily: 'var(--mono, monospace)',
            fontSize: 11, fontWeight: 500,
        }}>
            {correct ? '✓' : '✗'} {score}
        </span>
    );
}

export default function ReadingFeedback({ passage, session, questions }: ReadingFeedbackProps) {
    return (
        <AppShell>
            <Head title={`Feedback · ${passage.title}`} />
            <Page>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <Link
                        href="/reading"
                        style={{
                            textDecoration: 'none', fontFamily: 'var(--serif)',
                            fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <Ico.arrowLeft /> back to passages
                    </Link>
                    <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        {passage.topic} · {passage.level.toUpperCase()} ·{' '}
                        {session.time_taken_seconds ? formatTime(session.time_taken_seconds) : '—'}
                    </div>
                </div>

                {/* Section 1 — headline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'flex-start', marginBottom: 64 }}>
                    <div>
                        <Eyebrow style={{ marginBottom: 14 }}>Reading comprehension</Eyebrow>
                        <h1 style={{
                            fontFamily: 'var(--serif)', fontSize: 40, fontStyle: 'italic',
                            fontWeight: 400, lineHeight: 1.1, margin: '0 0 18px', color: 'var(--ink)',
                        }}>
                            {passage.title}
                        </h1>
                        {session.overall_note && (
                            <Marginalia style={{ fontSize: 17, maxWidth: 560 }}>
                                {session.overall_note}
                            </Marginalia>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                        <ScoreArc value={session.score} label="Score" size={140} />
                        <BandBadge score={session.score} label="est. IELTS band" />
                    </div>
                </div>

                {/* Section 2 — per-question breakdown */}
                <section>
                    <SectionHeader label="Question by question" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {questions.map((q, i) => {
                            const fb = q.feedback;
                            return (
                                <div
                                    key={q.id}
                                    style={{
                                        padding: '24px 0',
                                        borderTop: i === 0 ? 'none' : '0.5px solid var(--hairline)',
                                        display: 'grid',
                                        gridTemplateColumns: '28px 1fr',
                                        gap: 20,
                                    }}
                                >
                                    <div className="label-mono" style={{ fontSize: 11, color: 'var(--ink-4)', paddingTop: 3 }}>
                                        {q.position}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                                            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.5, margin: 0, color: 'var(--ink)' }}>
                                                {q.question_text}
                                            </p>
                                            {fb && <ScoreBadge score={fb.score} correct={fb.correct} />}
                                        </div>

                                        {/* User's answer */}
                                        <div style={{
                                            fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14,
                                            color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10,
                                            paddingLeft: 12, borderLeft: '2px solid var(--hairline-2)',
                                        }}>
                                            "{q.user_answer || '(no answer)'}"
                                        </div>

                                        {/* Coach note */}
                                        {fb?.note && (
                                            <Marginalia style={{ fontSize: 13 }}>{fb.note}</Marginalia>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Footer actions */}
                <div style={{ marginTop: 56, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Link href={`/reading/${passage.id}`} className="btn btn-ghost">
                        Try again
                    </Link>
                    <Link href="/reading" className="btn btn-ghost">
                        All passages <Ico.arrow />
                    </Link>
                    <Link href="/compose" className="btn">
                        Write today <Ico.arrow />
                    </Link>
                </div>
            </Page>
        </AppShell>
    );
}

import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import ScoreArc from '@/Components/Common/ScoreArc';
import { Ico } from '@/Components/Common/icons';
import type { SeFeedbackProps, SeDimension } from '@/lib/types';

function scoreColor(score: number) {
    if (score >= 80) return 'var(--progress)';
    if (score >= 60) return 'oklch(0.45 0.14 60)';
    return 'var(--signal)';
}

function scoreWash(score: number) {
    if (score >= 80) return 'var(--progress-wash)';
    if (score >= 60) return 'oklch(0.97 0.07 70)';
    return 'var(--signal-wash)';
}

const DIMENSION_META: Record<SeDimension, { label: string; description: string }> = {
    technical:    { label: 'Technical',    description: 'Depth and correctness of technical reasoning' },
    clarity:      { label: 'Clarity',      description: 'Structure and ease of following the explanation' },
    completeness: { label: 'Completeness', description: 'Coverage of the problem space and edge cases' },
    tradeoffs:    { label: 'Trade-offs',   description: 'Quality of trade-off discussion and justification' },
};

const DIMENSIONS: SeDimension[] = ['technical', 'clarity', 'completeness', 'tradeoffs'];

function DimensionCard({ dim, score, note }: { dim: SeDimension; score: number; note: string }) {
    const meta = DIMENSION_META[dim];
    return (
        <div className="card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                        {meta.label}
                    </div>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)' }}>
                        {meta.description}
                    </div>
                </div>
                <div style={{
                    minWidth: 48, height: 48, borderRadius: 999,
                    background: scoreWash(score),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span className="num" style={{ fontSize: 20, color: scoreColor(score) }}>{score}</span>
                </div>
            </div>
            {note && <Marginalia style={{ fontSize: 13.5, lineHeight: 1.6 }}>{note}</Marginalia>}
        </div>
    );
}

export default function SeFeedback({ prompt, session }: SeFeedbackProps) {
    return (
        <AppShell>
            <Head title={`SE Feedback · ${prompt.title}`} />
            <Page>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <Link href="/software" style={{
                        textDecoration: 'none', fontFamily: 'var(--serif)',
                        fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Ico.arrowLeft /> back to prompts
                    </Link>
                    <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        {prompt.category.replace(/-/g, ' ')} · {prompt.difficulty} · {session.mode}
                    </div>
                </div>

                {/* Headline + score */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'flex-start', marginBottom: 56 }}>
                    <div>
                        <Eyebrow style={{ marginBottom: 14 }}>SE feedback</Eyebrow>
                        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 38, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.15, margin: '0 0 6px', color: 'var(--ink)' }}>
                            {session.headline.primary}
                        </h1>
                        {session.headline.secondary && (
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink-3)', margin: '0 0 18px', lineHeight: 1.5 }}>
                                {session.headline.secondary}
                            </p>
                        )}
                        {session.overall_note && (
                            <Marginalia style={{ fontSize: 16, maxWidth: 520 }}>{session.overall_note}</Marginalia>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                        <ScoreArc value={session.overall} label="Overall" size={140} />
                    </div>
                </div>

                {/* Dimension cards */}
                <section style={{ marginBottom: 56 }}>
                    <SectionHeader label="Dimension breakdown" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                        {DIMENSIONS.map((dim) => (
                            <DimensionCard key={dim} dim={dim} score={session.scores[dim]} note={session.dimension_notes[dim]} />
                        ))}
                    </div>
                </section>

                {/* Improvement tips */}
                {session.improvement_tips.length > 0 && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Improvement tips" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Specific actions to level up your answer
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {session.improvement_tips.map((tip, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{i + 1}</span>
                                        </div>
                                        <Marginalia style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{tip}</Marginalia>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Concepts missed */}
                {session.key_concepts_missed.length > 0 && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Concepts to cover next time" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Areas not addressed or under-discussed
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {session.key_concepts_missed.map((concept, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--signal)', fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>•</span>
                                        <span style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>{concept}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Audio — speaking only */}
                {session.mode === 'speaking' && session.has_audio && (
                    <section style={{ marginBottom: 40 }}>
                        <SectionHeader label="Your recording" />
                        <div className="card" style={{ padding: '20px 28px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12 }}>Play back what you said</div>
                            <audio controls src={`/software/sessions/${session.id}/audio`} style={{ width: '100%', height: 40 }} />
                        </div>
                    </section>
                )}

                {/* Transcript — speaking only */}
                {session.mode === 'speaking' && session.transcript && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="What you said" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 16 }}>Transcript · auto-generated</div>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {session.transcript}
                            </p>
                        </div>
                    </section>
                )}

                {/* Written text — writing only */}
                {session.mode === 'writing' && session.text && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Your answer" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {session.text}
                            </p>
                        </div>
                    </section>
                )}

                {/* Prompt reminder */}
                <div className="card" style={{ padding: '20px 24px', marginBottom: 48, background: 'var(--paper-2)' }}>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 8 }}>The question</div>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, margin: 0, color: 'var(--ink-2)' }}>
                        {prompt.title}
                    </p>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Link href={`/software/${prompt.id}`} className="btn btn-ghost">Try again</Link>
                    <Link href="/software" className="btn btn-ghost">All prompts <Ico.arrow /></Link>
                    <Link href="/software/flashcards" className="btn">Flashcards <Ico.arrow /></Link>
                </div>
            </Page>
        </AppShell>
    );
}

import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import ScoreArc from '@/Components/Common/ScoreArc';
import BandBadge from '@/Components/Common/BandBadge';
import { Ico } from '@/Components/Common/icons';
import type { ImageFeedbackProps, ImageDimension } from '@/lib/types';

function scoreColor(s: number) {
    if (s >= 80) return 'var(--progress)';
    if (s >= 60) return 'oklch(0.45 0.14 60)';
    return 'var(--signal)';
}
function scoreWash(s: number) {
    if (s >= 80) return 'var(--progress-wash)';
    if (s >= 60) return 'oklch(0.97 0.07 70)';
    return 'var(--signal-wash)';
}

const DIMENSION_META: Record<ImageDimension, { label: string; description: string }> = {
    task:       { label: 'Task Achievement', description: 'Key features covered and overview given' },
    vocabulary: { label: 'Vocabulary',       description: 'Range and precision of image language' },
    coherence:  { label: 'Coherence',        description: 'Organisation and cohesive devices' },
    accuracy:   { label: 'Accuracy',         description: 'Factual accuracy vs the image' },
};

const DIMENSIONS: ImageDimension[] = ['task', 'vocabulary', 'coherence', 'accuracy'];

function DimensionCard({ dim, score, note }: { dim: ImageDimension; score: number; note: string }) {
    const meta = DIMENSION_META[dim];
    return (
        <div className="card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                        {meta.label}
                    </div>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)' }}>{meta.description}</div>
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

export default function ImageFeedback({ prompt, session }: ImageFeedbackProps) {
    const isWriting = session.mode === 'writing';

    return (
        <AppShell>
            <Head title={`Image Feedback · ${prompt.title}`} />
            <Page>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <Link href="/images" style={{ textDecoration: 'none', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ico.arrowLeft /> back to image prompts
                    </Link>
                    <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        {prompt.type} · {prompt.topic} · {prompt.level.toUpperCase()} · {isWriting ? 'Writing' : 'Speaking'}
                    </div>
                </div>

                {/* Section 1 — headline + overall score */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'flex-start', marginBottom: 56 }}>
                    <div>
                        <Eyebrow style={{ marginBottom: 14 }}>Image description feedback</Eyebrow>
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
                        <BandBadge score={session.overall} label="est. IELTS band" />
                    </div>
                </div>

                {/* Section 2 — dimension cards */}
                <section style={{ marginBottom: 56 }}>
                    <SectionHeader label="Dimension breakdown" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                        {DIMENSIONS.map((dim) => (
                            <DimensionCard key={dim} dim={dim} score={session.scores[dim]} note={session.dimension_notes[dim]} />
                        ))}
                    </div>
                </section>

                {/* Section 3 — collocation errors */}
                {session.collocation_errors.length > 0 && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Collocation check" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Natural word pairings to practise
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {session.collocation_errors.map((e, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 16, borderBottom: i < session.collocation_errors.length - 1 ? '0.5px solid var(--hairline)' : 'none' }}>
                                        <div>
                                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--signal)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {isWriting ? 'you wrote' : 'you said'}
                                            </div>
                                            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-2)', textDecoration: 'line-through', textDecorationColor: 'var(--signal)' }}>
                                                {e.original}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--progress)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                natural English
                                            </div>
                                            <span style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>
                                                {e.correction}
                                            </span>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <Marginalia style={{ fontSize: 13, marginTop: 2 }}>{e.note}</Marginalia>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Section 4 — key features missed */}
                {session.key_features_missed.length > 0 && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Key features to include next time" />
                        <div className="card" style={{ padding: '24px 28px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {session.key_features_missed.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>•</span>
                                        <span style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.4, color: 'var(--ink-2)' }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Audio (speaking mode only) */}
                {!isWriting && session.has_audio && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Your recording" />
                        <div className="card" style={{ padding: '20px 28px' }}>
                            <audio controls src={`/images/sessions/${session.id}/audio`} style={{ width: '100%', height: 40 }} />
                        </div>
                    </section>
                )}

                {/* Transcript (speaking) or original text (writing) */}
                {isWriting && session.text && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="Your description" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {session.text}
                            </p>
                        </div>
                    </section>
                )}
                {!isWriting && session.transcript && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="What you said" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 16 }}>Transcript · auto-generated</div>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {session.transcript}
                            </p>
                        </div>
                    </section>
                )}

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Link href={`/images/${prompt.id}`} className="btn btn-ghost">Try again</Link>
                    <Link href="/images" className="btn btn-ghost">All prompts <Ico.arrow /></Link>
                </div>
            </Page>
        </AppShell>
    );
}

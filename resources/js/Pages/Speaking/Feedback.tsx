import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import ScoreArc from '@/Components/Common/ScoreArc';
import BandBadge from '@/Components/Common/BandBadge';
import { Ico } from '@/Components/Common/icons';
import type { SpeakingFeedbackProps, SpeakingDimension } from '@/lib/types';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

async function saveCollocation(original: string, correction: string) {
    await fetch('/vocabulary', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: correction, definition: `Correct form of: "${original}"`, level: 'b2' }),
    });
}

type CollocationError = { original: string; correction: string; note: string };

function CollocationSection({ errors, label = 'you said' }: { errors: CollocationError[]; label?: string }) {
    const [saved, setSaved] = useState<Set<number>>(new Set());

    async function save(i: number, e: CollocationError) {
        await saveCollocation(e.original, e.correction);
        setSaved(prev => new Set([...prev, i]));
    }

    return (
        <section style={{ marginBottom: 56 }}>
            <SectionHeader label="Collocation check" />
            <div className="card" style={{ padding: '28px 32px' }}>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Natural word pairings to practise
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {errors.map((e, i) => (
                        <div key={i} style={{ paddingBottom: 16, borderBottom: i < errors.length - 1 ? '0.5px solid var(--hairline)' : 'none' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'start' }}>
                                <div>
                                    <div className="label-mono" style={{ fontSize: 9, color: 'var(--signal)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {label}
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
                                <button
                                    onClick={() => !saved.has(i) && save(i, e)}
                                    disabled={saved.has(i)}
                                    title={saved.has(i) ? 'Saved to vocabulary notebook' : 'Save to vocabulary notebook'}
                                    style={{ background: 'none', border: 'none', cursor: saved.has(i) ? 'default' : 'pointer', fontSize: 16, fontWeight: 600, color: saved.has(i) ? 'oklch(0.55 0.15 145)' : 'var(--ink-3)', paddingTop: 18, lineHeight: 1 }}
                                >
                                    {saved.has(i) ? '✓' : '+'}
                                </button>
                            </div>
                            <Marginalia style={{ fontSize: 13, marginTop: 8 }}>{e.note}</Marginalia>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

type ConvMessage = { role: 'ai' | 'user'; text: string };
type ConvState = 'idle' | 'loading' | 'waiting' | 'done' | 'error';

function FollowUpConversation({ sessionId }: { sessionId: number }) {
    const [state, setState] = useState<ConvState>('idle');
    const [exchange, setExchange]       = useState(0);
    const [conversation, setConversation] = useState<ConvMessage[]>([]);
    const [userInput, setUserInput]     = useState('');
    const [, setCurrentQuestion] = useState('');

    const start = async () => {
        setState('loading');
        try {
            const res = await fetch(`/speaking/sessions/${sessionId}/followup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
                body: JSON.stringify({ conversation: [], user_response: '(starting)', exchange: 1 }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            const question = json.question || '';
            setCurrentQuestion(question);
            setConversation([{ role: 'ai', text: question }]);
            setExchange(1);
            setState('waiting');
        } catch { setState('error'); }
    };

    const submit = async () => {
        if (!userInput.trim()) return;
        const nextExchange = exchange + 1;
        const newConv: ConvMessage[] = [...conversation, { role: 'user', text: userInput }];
        setConversation(newConv);
        setUserInput('');
        setState('loading');
        try {
            const res = await fetch(`/speaking/sessions/${sessionId}/followup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
                body: JSON.stringify({ conversation: newConv, user_response: userInput, exchange: nextExchange }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            const msgs: ConvMessage[] = [...newConv];
            if (json.feedback) msgs.push({ role: 'ai', text: json.feedback });
            if (!json.done && json.question) msgs.push({ role: 'ai', text: json.question });
            setConversation(msgs);
            setExchange(nextExchange);
            setState(json.done ? 'done' : 'waiting');
        } catch { setState('error'); }
    };

    return (
        <div style={{ marginTop: 8 }}>
            {state === 'idle' && (
                <button onClick={start} className="btn btn-ghost" style={{ fontSize: 13 }}>
                    Practice follow-up questions
                </button>
            )}
            {state === 'error' && (
                <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--signal)' }}>
                    Failed. <button onClick={start} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 13, textDecoration: 'underline', padding: 0 }}>Retry</button>
                </span>
            )}
            {(state === 'loading' || state === 'waiting' || state === 'done') && (
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                        {conversation.map((m, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'ai' ? 'row' : 'row-reverse' }}>
                                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', flexShrink: 0, marginTop: 4 }}>
                                    {m.role === 'ai' ? 'examiner' : 'you'}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6,
                                    padding: '10px 14px', borderRadius: 10, maxWidth: '85%',
                                    background: m.role === 'ai' ? 'var(--paper-2)' : 'var(--paper-3)',
                                    color: 'var(--ink)',
                                }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {state === 'loading' && (
                            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>thinking…</div>
                        )}
                    </div>
                    {state === 'waiting' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                                rows={2}
                                placeholder="Your response… (Enter to send)"
                                style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 13, padding: '8px 12px', borderRadius: 6, border: '0.5px solid var(--hairline)', background: 'var(--paper)', color: 'var(--ink)', resize: 'none', outline: 'none' }}
                            />
                            <button onClick={submit} className="btn" style={{ fontSize: 12, alignSelf: 'flex-end' }}>Send <Ico.arrow /></button>
                        </div>
                    )}
                    {state === 'done' && (
                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--progress)' }}>Follow-up practice complete.</div>
                    )}
                </div>
            )}
        </div>
    );
}

function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m} min ${sec} sec` : `${sec} sec`;
}

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

const DIMENSION_META: Record<SpeakingDimension, { label: string; description: string }> = {
    fluency:       { label: 'Fluency',       description: 'Pace, flow, and hesitation' },
    vocabulary:    { label: 'Vocabulary',    description: 'Range and precision of word choice' },
    grammar:       { label: 'Grammar',       description: 'Accuracy of structures used' },
    pronunciation: { label: 'Pronunciation', description: 'Clarity and intelligibility' },
};

const DIMENSIONS: SpeakingDimension[] = ['fluency', 'vocabulary', 'grammar', 'pronunciation'];

function DimensionCard({
    dim,
    score,
    note,
}: {
    dim: SpeakingDimension;
    score: number;
    note: string;
}) {
    const meta = DIMENSION_META[dim];
    return (
        <div className="card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div style={{
                        fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500,
                        color: 'var(--ink)', marginBottom: 3,
                    }}>
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
                    <span className="num" style={{ fontSize: 20, color: scoreColor(score) }}>
                        {score}
                    </span>
                </div>
            </div>
            {note && (
                <Marginalia style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                    {note}
                </Marginalia>
            )}
        </div>
    );
}

export default function SpeakingFeedback({ prompt, session }: SpeakingFeedbackProps) {
    return (
        <AppShell>
            <Head title={`Speaking Feedback · ${prompt.topic}`} />
            <Page>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <Link
                        href="/speaking"
                        style={{
                            textDecoration: 'none', fontFamily: 'var(--serif)',
                            fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        <Ico.arrowLeft /> back to prompts
                    </Link>
                    <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        {prompt.topic} · {prompt.level.toUpperCase()}
                        {session.duration_seconds != null && ` · ${fmt(session.duration_seconds)}`}
                    </div>
                </div>

                {/* Section 1 — headline + overall score */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'flex-start', marginBottom: 56 }}>
                    <div>
                        <Eyebrow style={{ marginBottom: 14 }}>Speaking feedback</Eyebrow>
                        <h1 style={{
                            fontFamily: 'var(--serif)', fontSize: 38, fontStyle: 'italic',
                            fontWeight: 400, lineHeight: 1.15, margin: '0 0 6px', color: 'var(--ink)',
                        }}>
                            {session.headline.primary}
                        </h1>
                        {session.headline.secondary && (
                            <p style={{
                                fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink-3)',
                                margin: '0 0 18px', lineHeight: 1.5,
                            }}>
                                {session.headline.secondary}
                            </p>
                        )}
                        {session.overall_note && (
                            <Marginalia style={{ fontSize: 16, maxWidth: 520 }}>
                                {session.overall_note}
                            </Marginalia>
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
                            <DimensionCard
                                key={dim}
                                dim={dim}
                                score={session.scores[dim]}
                                note={session.dimension_notes[dim]}
                            />
                        ))}
                    </div>
                </section>

                {/* Section 3 — collocation errors */}
                {session.collocation_errors.length > 0 && (
                    <CollocationSection errors={session.collocation_errors} label="you said" />
                )}

                {/* Audio player */}
                {session.has_audio && (
                    <section style={{ marginBottom: 40 }}>
                        <SectionHeader label="Your recording" />
                        <div className="card" style={{ padding: '20px 28px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12 }}>
                                Play back what you said
                            </div>
                            <audio
                                controls
                                src={`/speaking/sessions/${session.id}/audio`}
                                style={{ width: '100%', height: 40 }}
                            />
                        </div>
                    </section>
                )}

                {/* Section 3 — transcript */}
                {session.transcript && (
                    <section style={{ marginBottom: 56 }}>
                        <SectionHeader label="What you said" />
                        <div className="card" style={{ padding: '28px 32px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 16 }}>
                                Transcript · auto-generated
                            </div>
                            <p style={{
                                fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.75,
                                color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap',
                            }}>
                                {session.transcript}
                            </p>
                        </div>
                    </section>
                )}

                {/* Prompt reminder */}
                <div className="card" style={{ padding: '20px 24px', marginBottom: 48, background: 'var(--paper-2)' }}>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 8 }}>
                        The prompt
                    </div>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, margin: 0, color: 'var(--ink-2)' }}>
                        {prompt.text}
                    </p>
                </div>

                {/* Follow-up conversation */}
                <section style={{ marginBottom: 48 }}>
                    <SectionHeader label="Examiner follow-up · Part 3 practice" />
                    <div className="card" style={{ padding: '20px 24px' }}>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14 }}>
                            The AI examiner will ask 3 follow-up questions based on what you said — just like IELTS Part 3.
                        </div>
                        <FollowUpConversation sessionId={session.id} />
                    </div>
                </section>

                {/* Improvement tips */}
                {session.improvement_tips && session.improvement_tips.length > 0 && (
                    <section style={{ marginBottom: 48 }}>
                        <SectionHeader label="Next time" />
                        <div className="card" style={{ padding: '24px 28px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {session.improvement_tips.map((tip, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--signal)', fontWeight: 600, paddingTop: 2, flexShrink: 0 }}>{i + 1}</span>
                                        <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Retry nudge for low scores */}
                {session.overall < 60 && (
                    <div className="card" style={{ padding: '20px 24px', marginBottom: 32, background: 'var(--signal-wash)', border: '0.5px solid oklch(0.85 0.06 25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                            <div>
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', margin: '0 0 4px' }}>
                                    This one's worth another go.
                                </p>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                                    Read the tips above, then try this prompt again — the second attempt is usually where the real learning happens.
                                </p>
                            </div>
                            <Link href={`/speaking/${prompt.id}`} className="btn" style={{ flexShrink: 0, background: 'var(--signal)', borderColor: 'var(--signal)' }}>
                                Try again <Ico.arrow />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    {session.overall >= 60 && (
                        <Link href={`/speaking/${prompt.id}`} className="btn btn-ghost">
                            Try again
                        </Link>
                    )}
                    <Link href="/speaking" className="btn btn-ghost">
                        All prompts <Ico.arrow />
                    </Link>
                    <Link href="/compose" className="btn">
                        Write today <Ico.arrow />
                    </Link>
                </div>
            </Page>
        </AppShell>
    );
}

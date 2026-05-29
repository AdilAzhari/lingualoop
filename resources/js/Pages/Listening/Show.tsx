import { useState, useRef, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import { Ico } from '@/Components/Common/icons';
import type { ListeningShowProps } from '@/lib/types';

function getCsrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

type PlayState = 'idle' | 'playing' | 'paused' | 'done' | 'error';

function AudioPlayer({ audioScript }: { audioScript: string }) {
    const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [playState, setPlayState] = useState<PlayState>('idle');

    useEffect(() => {
        return () => { window.speechSynthesis?.cancel(); };
    }, []);

    function makeUtterance(): SpeechSynthesisUtterance {
        const utt = new SpeechSynthesisUtterance(audioScript);
        utt.rate  = 0.92;
        utt.pitch = 1.0;

        // Pick an American English voice if available
        const voices = window.speechSynthesis.getVoices();
        const american = voices.find(
            (v) => v.lang === 'en-US' && /google|microsoft/i.test(v.name)
        ) ?? voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en'));
        if (american) utt.voice = american;

        utt.onstart   = () => setPlayState('playing');
        utt.onend     = () => setPlayState('done');
        utt.onpause   = () => setPlayState('paused');
        utt.onresume  = () => setPlayState('playing');
        utt.onerror   = () => setPlayState('error');
        return utt;
    }

    const play = () => {
        window.speechSynthesis.cancel();
        const utt = makeUtterance();
        uttRef.current = utt;
        window.speechSynthesis.speak(utt);
        setPlayState('playing');
    };

    const pause = () => {
        window.speechSynthesis.pause();
        setPlayState('paused');
    };

    const resume = () => {
        window.speechSynthesis.resume();
        setPlayState('playing');
    };

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setPlayState('done');
    }, []);

    const statusLabel: Record<PlayState, string> = {
        idle:    'Press play to hear the passage — answer the questions below',
        playing: 'Playing…',
        paused:  'Paused',
        done:    'Done',
        error:   'Could not load audio',
    };

    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {(playState === 'idle' || playState === 'error') && (
                <button onClick={play} className="btn" style={{ fontSize: 13 }}>
                    ▶ Play recording
                </button>
            )}
            {playState === 'playing' && (
                <>
                    <button onClick={pause} className="btn" style={{ fontSize: 13, background: 'var(--paper-3)', color: 'var(--ink)' }}>
                        ⏸ Pause
                    </button>
                    <button onClick={stop} style={{ fontFamily: 'var(--serif)', fontSize: 13, background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer' }}>
                        Stop
                    </button>
                </>
            )}
            {playState === 'paused' && (
                <>
                    <button onClick={resume} className="btn" style={{ fontSize: 13 }}>
                        ▶ Resume
                    </button>
                    <button onClick={stop} style={{ fontFamily: 'var(--serif)', fontSize: 13, background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer' }}>
                        Stop
                    </button>
                </>
            )}
            {playState === 'done' && (
                <button onClick={play} className="btn" style={{ fontSize: 13, background: 'var(--paper-3)', color: 'var(--ink)' }}>
                    ↺ Play again
                </button>
            )}
            <span className="label-mono" style={{ fontSize: 10, color: playState === 'error' ? 'var(--signal)' : 'var(--ink-4)' }}>
                {statusLabel[playState]}
            </span>
        </div>
    );
}

type SampleState = 'idle' | 'loading' | 'done' | 'error';

function SampleAnswers({ passageId }: { passageId: number }) {
    const [state, setState] = useState<SampleState>('idle');
    const [text, setText]   = useState('');

    const fetch_ = async () => {
        setState('loading');
        try {
            const res = await fetch(`/listening/${passageId}/sample`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (json.text) { setText(json.text); setState('done'); }
            else setState('error');
        } catch { setState('error'); }
    };

    if (state === 'idle') return (
        <button onClick={fetch_} style={{ fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic', background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}>
            See model answers →
        </button>
    );
    if (state === 'loading') return <span className="label-mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>Generating…</span>;
    if (state === 'error')   return <span className="label-mono" style={{ fontSize: 11, color: 'var(--signal)' }}>Failed. Try again.</span>;

    return (
        <div style={{ marginTop: 14, padding: '14px 18px', background: 'var(--paper-2)', borderRadius: 8 }}>
            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 8 }}>Model answers</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>{text}</p>
        </div>
    );
}

export default function ListeningShow({ passage, questions }: ListeningShowProps) {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showScript, setShowScript] = useState(false);
    const [startedAt] = useState(() => Date.now());
    const [submitting, setSubmitting] = useState(false);

    const setAnswer = (id: number, val: string) => setAnswers((prev) => ({ ...prev, [id]: val }));

    const canSubmit = questions.every((q) => (answers[q.id] ?? '').trim().length > 0) && !submitting;

    const submit = () => {
        setSubmitting(true);
        router.post(
            `/listening/${passage.id}`,
            {
                started_at: startedAt,
                answers: questions.map((q) => ({ question_id: q.id, answer: answers[q.id] ?? '' })),
            },
            { onError: () => setSubmitting(false) }
        );
    };

    const isAdvanced = passage.level === 'c1' || passage.level === 'c2';

    return (
        <AppShell>
            <Head title={`Listening · ${passage.title}`} />
            <Page>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <Link href="/listening" style={{ textDecoration: 'none', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ico.arrowLeft /> all passages
                    </Link>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <span className="chip" style={{ fontSize: 10, background: isAdvanced ? 'var(--signal-wash)' : undefined, color: isAdvanced ? 'var(--signal)' : undefined }}>
                            {passage.level.toUpperCase()}
                        </span>
                        <span className="chip" style={{ fontSize: 10 }}>{passage.topic}</span>
                        <span className="chip" style={{ fontSize: 10 }}>{passage.word_count} words</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'flex-start' }}>
                    {/* Left — audio + transcript */}
                    <div>
                        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.2, margin: '0 0 20px', color: 'var(--ink)' }}>
                            {passage.title}
                        </h1>

                        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14 }}>
                                Audio player · browser text-to-speech
                            </div>
                            <AudioPlayer audioScript={passage.audio_script} />
                        </div>

                        {/* Transcript toggle */}
                        <div className="card" style={{ padding: '16px 20px' }}>
                            <button
                                onClick={() => setShowScript((v) => !v)}
                                style={{ fontFamily: 'var(--serif)', fontSize: 13, background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span style={{ display: 'inline-block', transition: 'transform .2s', transform: showScript ? 'rotate(90deg)' : 'none' }}>▶</span>
                                {showScript ? 'Hide' : 'Show'} transcript
                            </button>
                            {showScript && (
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.7, margin: '14px 0 0', color: 'var(--ink-2)' }}>
                                    {passage.audio_script}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right — questions */}
                    <div style={{ position: 'sticky', top: 80 }}>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14 }}>
                            Answer all {questions.length} questions
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                            {questions.map((q) => (
                                <div key={q.id}>
                                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5, margin: '0 0 8px', color: 'var(--ink)' }}>
                                        {q.position}. {q.question_text}
                                    </p>
                                    <textarea
                                        value={answers[q.id] ?? ''}
                                        onChange={(e) => setAnswer(q.id, e.target.value)}
                                        rows={2}
                                        placeholder="Your answer…"
                                        style={{ width: '100%', fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5, padding: '8px 12px', borderRadius: 6, border: '0.5px solid var(--hairline)', background: 'var(--paper)', color: 'var(--ink)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            ))}
                        </div>

                        <button onClick={submit} disabled={!canSubmit} className="btn" style={{ width: '100%', justifyContent: 'center', fontSize: 14, opacity: canSubmit ? 1 : 0.4 }}>
                            {submitting ? 'Submitting…' : 'Submit answers'} {!submitting && <Ico.arrow />}
                        </button>

                        <div style={{ marginTop: 16 }}>
                            <SampleAnswers passageId={passage.id} />
                        </div>
                    </div>
                </div>
            </Page>
        </AppShell>
    );
}

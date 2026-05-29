import { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import { Ico } from '@/Components/Common/icons';
import type { ReadingShowProps, VocabWord } from '@/lib/types';

type SampleStatus = 'idle' | 'loading' | 'done' | 'error';
type AnnotationState = 'idle' | 'saving' | 'saved';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

type Popover = { x: number; y: number; word: string };

function AnnotationPopover({ popover, onClose }: { popover: Popover; onClose: () => void }) {
    const [state, setState] = useState<AnnotationState>('idle');

    async function save() {
        setState('saving');
        try {
            await fetch('/vocabulary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ word: popover.word }),
            });
            setState('saved');
            setTimeout(onClose, 1200);
        } catch {
            setState('idle');
        }
    }

    return (
        <div style={{
            position: 'fixed',
            left: popover.x,
            top: popover.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 8,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            pointerEvents: 'auto',
        }}>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{popover.word}"
            </span>
            {state === 'saved' ? (
                <span className="label-mono" style={{ fontSize: 10, color: '#86efac' }}>Saved!</span>
            ) : (
                <button
                    onClick={save}
                    disabled={state === 'saving'}
                    style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: 'var(--paper)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 11,
                        fontFamily: 'var(--mono, monospace)',
                        cursor: state === 'saving' ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {state === 'saving' ? '…' : '+ notebook'}
                </button>
            )}
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
            >
                ×
            </button>
        </div>
    );
}

function SampleAnswers({ url }: { url: string }) {
    const [status, setStatus] = useState<SampleStatus>('idle');
    const [text, setText] = useState('');

    async function generate() {
        setStatus('loading');
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed');
            setText(data.text);
            setStatus('done');
        } catch {
            setStatus('error');
        }
    }

    return (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--hairline)' }}>
            {status === 'idle' && (
                <button onClick={generate} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    See sample answers
                </button>
            )}
            {status === 'loading' && (
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0, textAlign: 'center' }}>
                    Generating sample answers…
                </p>
            )}
            {status === 'error' && (
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--signal)', margin: 0, textAlign: 'center' }}>
                    Could not generate samples.{' '}
                    <button onClick={generate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 13, padding: 0, textDecoration: 'underline' }}>
                        Retry
                    </button>
                </p>
            )}
            {status === 'done' && (
                <div>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Sample answers · C1 vocabulary
                    </div>
                    <p style={{
                        fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.75,
                        color: 'var(--ink-2)', margin: '0 0 8px', whiteSpace: 'pre-wrap',
                    }}>
                        {text}
                    </p>
                    <button
                        onClick={() => setStatus('idle')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-4)', padding: 0 }}
                    >
                        Hide
                    </button>
                </div>
            )}
        </div>
    );
}

function useTimer() {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, []);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function VocabPanel({ words }: { words: VocabWord[] }) {
    const [open, setOpen] = useState(false);
    if (words.length === 0) return null;

    return (
        <div style={{ marginTop: 36, borderTop: '0.5px solid var(--hairline)', paddingTop: 20 }}>
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                    fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-3)',
                    fontStyle: 'italic',
                }}
            >
                <span style={{
                    display: 'inline-block', width: 14, height: 14, borderRadius: 999,
                    border: '1px solid var(--hairline-2)', background: 'var(--paper-3)',
                    fontSize: 9, lineHeight: '14px', textAlign: 'center',
                    transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s',
                    fontStyle: 'normal',
                }}>▶</span>
                Your vocabulary · {words.length} {words.length === 1 ? 'word' : 'words'}
            </button>

            {open && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {words.map((w) => {
                        const isAdvanced = w.level === 'c1' || w.level === 'c2';
                        return (
                            <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic',
                                        color: 'var(--ink)',
                                    }}>
                                        {w.word}
                                    </span>
                                    {w.level && (
                                        <span className="chip" style={{
                                            fontSize: 9, padding: '1px 6px',
                                            background: isAdvanced ? 'var(--signal-wash)' : undefined,
                                            color: isAdvanced ? 'var(--signal)' : undefined,
                                        }}>
                                            {w.level.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {(isAdvanced || !w.level) && w.definition && (
                                    <p style={{
                                        margin: 0, fontFamily: 'var(--serif)', fontSize: 12.5,
                                        color: 'var(--ink-3)', lineHeight: 1.5,
                                        paddingLeft: 12, borderLeft: '2px solid var(--hairline-2)',
                                    }}>
                                        {w.definition}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ReadingShow({ passage, questions, vocab_words }: ReadingShowProps) {
    const startedAt = useRef(Date.now());
    const timer = useTimer();
    const [popover, setPopover] = useState<Popover | null>(null);

    function handleMouseUp() {
        const sel = window.getSelection();
        const word = sel?.toString().trim() ?? '';
        if (word.length < 2 || word.length > 80 || word.includes('\n')) {
            setPopover(null);
            return;
        }
        const range = sel?.getRangeAt(0);
        if (!range) return;
        const rect = range.getBoundingClientRect();
        setPopover({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8, word });
    }

    const { data, setData, post, processing } = useForm<{
        started_at: number;
        answers: { question_id: number; answer: string }[];
    }>({
        started_at: startedAt.current,
        answers: questions.map((q) => ({ question_id: q.id, answer: '' })),
    });

    function setAnswer(idx: number, value: string) {
        const next = [...data.answers];
        next[idx] = { ...next[idx], answer: value };
        setData('answers', next);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/reading/${passage.id}`);
    }

    const allAnswered = data.answers.every((a) => a.answer.trim().length > 0);

    return (
        <AppShell>
            <Head title={passage.title} />
            {popover && <AnnotationPopover popover={popover} onClose={() => setPopover(null)} />}

            {/* Sticky reading bar */}
            <div style={{
                position: 'sticky', top: 52, zIndex: 9,
                borderBottom: '0.5px solid var(--hairline)',
                background: 'oklch(0.965 0.012 80 / .92)',
                backdropFilter: 'blur(12px)',
                padding: '10px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link href="/reading" style={{ textDecoration: 'none', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>
                    <Ico.arrowLeft /> passages
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="chip" style={{ fontSize: 10 }}>{passage.topic}</span>
                    <span className="chip" style={{ fontSize: 10 }}>{passage.word_count} words</span>
                    <span className="label-mono" style={{ fontSize: 12, color: 'var(--ink-3)', minWidth: 42, textAlign: 'right' }}>
                        {timer}
                    </span>
                </div>
            </div>

            <Page wide>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56, alignItems: 'flex-start' }}>

                    {/* Passage + vocab panel */}
                    <div>
                        <h1 style={{
                            fontFamily: 'var(--serif)', fontSize: 28, fontStyle: 'italic',
                            fontWeight: 400, lineHeight: 1.2, marginBottom: 28, color: 'var(--ink)',
                        }}>
                            {passage.title}
                        </h1>
                        <div
                            onMouseUp={handleMouseUp}
                            style={{
                                fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.8,
                                color: 'var(--ink)', whiteSpace: 'pre-wrap',
                                userSelect: 'text',
                            }}
                        >
                            {passage.body}
                        </div>

                        <VocabPanel words={vocab_words} />
                    </div>

                    {/* Questions — sticky column */}
                    <div style={{ position: 'sticky', top: 100 }}>
                        <form onSubmit={submit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {questions.map((q, i) => (
                                    <div key={q.id} className="card" style={{ padding: 20 }}>
                                        <div style={{
                                            fontSize: 9.5, fontFamily: 'var(--mono, monospace)',
                                            color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            Question {q.position}
                                        </div>
                                        <p style={{
                                            fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5,
                                            margin: '0 0 12px', color: 'var(--ink)',
                                        }}>
                                            {q.question_text}
                                        </p>
                                        <textarea
                                            value={data.answers[i]?.answer ?? ''}
                                            onChange={(e) => setAnswer(i, e.target.value)}
                                            rows={3}
                                            placeholder="Your answer…"
                                            style={{
                                                width: '100%', padding: '8px 10px', fontSize: 14,
                                                fontFamily: 'var(--serif)', color: 'var(--ink)',
                                                background: 'var(--paper)', border: '1px solid var(--hairline)',
                                                borderRadius: 'var(--r-1)', outline: 'none',
                                                resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !allAnswered}
                                className="btn"
                                style={{ width: '100%', marginTop: 16, justifyContent: 'center', fontSize: 14 }}
                            >
                                {processing ? 'Grading…' : 'Submit answers'}
                            </button>

                            {!allAnswered && (
                                <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 12, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)' }}>
                                    Answer all questions to submit.
                                </p>
                            )}

                            <SampleAnswers url={`/reading/${passage.id}/sample`} />
                        </form>
                    </div>
                </div>
            </Page>
        </AppShell>
    );
}

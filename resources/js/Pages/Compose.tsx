import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import Timer from '@/Components/Compose/Timer';
import WritingSurface from '@/Components/Compose/WritingSurface';
import FocusSidebar from '@/Components/Compose/FocusSidebar';
import { Ico } from '@/Components/Common/icons';
import type { ComposePageProps, Prompt } from '@/lib/types';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

type SampleStatus = 'idle' | 'loading' | 'done' | 'error';

function SampleEssay() {
    const [status, setStatus] = useState<SampleStatus>('idle');
    const [text, setText] = useState('');

    const generate = useCallback(async () => {
        setStatus('loading');
        try {
            const res = await fetch('/compose/sample', {
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
    }, []);

    return (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontFamily: 'var(--serif)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sample essay
            </p>
            {status === 'idle' && (
                <button onClick={generate} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    Generate with C1 vocabulary
                </button>
            )}
            {status === 'loading' && (
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                    Generating sample…
                </p>
            )}
            {status === 'error' && (
                <p style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--signal)', margin: 0 }}>
                    Could not generate.{' '}
                    <button onClick={generate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
                        Retry
                    </button>
                </p>
            )}
            {status === 'done' && (
                <>
                    <p style={{
                        fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.7,
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
                </>
            )}
        </div>
    );
}

function WordCount({ words, taskType }: { words: number; taskType: Prompt['task_type'] }) {
    const target = taskType === 'task-2' ? 250 : 150;
    const pct = Math.min(100, Math.round((words / target) * 100));
    const color = words >= target ? 'var(--progress)' : 'var(--ink-3)';
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span className="num" style={{ fontSize: 13, color }}>{words}</span>
            <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)' }}>
                / {target}
            </span>
            <span className="label-mono" style={{ fontSize: 9.5, color }}>
                {pct >= 100 ? '✓' : `${pct}%`}
            </span>
        </div>
    );
}

function WordCountBar({ words, taskType }: { words: number; taskType: Prompt['task_type'] }) {
    const target = taskType === 'task-2' ? 250 : 150;
    const pct = Math.min(100, (words / target) * 100);
    const reached = words >= target;
    return (
        <div style={{ marginTop: 20, marginBottom: 4 }}>
            <div style={{ height: 2, background: 'var(--hairline-2)', borderRadius: 1 }}>
                <div style={{
                    height: '100%', borderRadius: 1,
                    width: `${pct}%`,
                    background: reached ? 'var(--progress)' : 'var(--ink-4)',
                    transition: 'width .3s ease, background .3s ease',
                }} />
            </div>
            {reached && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--progress)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                    Minimum word count reached — you can submit whenever you're ready.
                </p>
            )}
        </div>
    );
}

export default function Compose({ prompt, draft, focus_label, vocab_challenge }: ComposePageProps) {
    const taRef = useRef<HTMLTextAreaElement>(null);
    const [seconds, setSeconds] = useState(prompt.duration_minutes * 60);
    const [running, setRunning] = useState(true);

    const form = useForm({ prompt_id: prompt.id, text: draft.text ?? '' });
    const text = form.data.text;

    // Countdown. Never auto-ends the session — clamps at 0 and the dot stops.
    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [running]);

    // Stop pulsing when we reach 00:00 (a hint, not a guard).
    useEffect(() => {
        if (seconds === 0) setRunning(false);
    }, [seconds]);

    // Autosave draft, debounced 800ms (handoff §6.2, §10.1).
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const id = setTimeout(() => {
            router.post(
                '/compose/draft',
                { prompt_id: prompt.id, text },
                { preserveScroll: true, preserveState: true, only: [] },
            );
        }, 800);
        return () => clearTimeout(id);
    }, [text, prompt.id]);

    const words = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    function submit() {
        form.post('/compose');
    }

    return (
        <AppShell>
            <Head title={`Write · ${words} words`} />
            <Page wide>
                {/* Toolbar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: 28 }}>
                    <Link
                        href="/"
                        className="btn-link"
                        style={{
                            textDecoration: 'none',
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 14,
                            color: 'var(--ink-3)',
                            justifySelf: 'flex-start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: 'none',
                        }}
                    >
                        <Ico.arrowLeft /> save &amp; exit
                    </Link>

                    <div className="label-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {prompt.level} · {prompt.task_type} · {prompt.duration_minutes}-minute essay
                    </div>

                    <div style={{ justifySelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 18 }}>
                        <WordCount words={words} taskType={prompt.task_type} />
                        <Timer mins={mins} secs={secs} running={running} onToggle={() => setRunning((r) => !r)} />
                    </div>
                </div>

                {/* Prompt */}
                <div style={{ marginBottom: 28 }}>
                    <Eyebrow style={{ marginBottom: 12, color: 'var(--signal)' }}>The prompt</Eyebrow>
                    <p className="display" style={{ fontSize: 28, margin: 0, fontWeight: 400, maxWidth: 880, lineHeight: 1.2 }}>
                        "{prompt.text}"
                    </p>
                </div>

                {/* Composition grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48, alignItems: 'flex-start' }}>
                    <WritingSurface ref={taRef} text={text} onChange={(v) => form.setData('text', v)} />
                    <aside style={{ position: 'sticky', top: 100, paddingTop: 8 }}>
                        <FocusSidebar text={text} focusLabel={focus_label ?? 'Prepositions'} />
                        {vocab_challenge.length > 0 && (
                            <div className="card" style={{ padding: 18, marginTop: 16 }}>
                                <p style={{ margin: '0 0 10px', fontSize: 11, fontFamily: 'var(--serif)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Vocab challenge
                                </p>
                                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                                    Try using these words from your notebook:
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {vocab_challenge.map((w) => {
                                        const used = text.toLowerCase().includes(w.toLowerCase());
                                        return (
                                            <span key={w} style={{
                                                padding: '3px 10px', fontSize: 13,
                                                fontFamily: 'var(--serif)', fontStyle: 'italic',
                                                borderRadius: 99, border: '1px solid',
                                                borderColor: used ? 'var(--progress)' : 'var(--hairline)',
                                                background: used ? 'var(--progress-wash)' : 'transparent',
                                                color: used ? 'var(--progress)' : 'var(--ink-2)',
                                                transition: 'all .2s ease',
                                            }}>
                                                {used ? '✓ ' : ''}{w}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <SampleEssay />
                    </aside>
                </div>

                {/* Word count progress bar (full width, above submit bar) */}
                <WordCountBar words={words} taskType={prompt.task_type} />

                {/* Submit bar */}
                <div
                    style={{
                        marginTop: 36,
                        paddingTop: 24,
                        borderTop: '0.5px solid var(--hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Marginalia style={{ fontSize: 14, maxWidth: 480 }}>
                        Take a breath, read it through once, and let me see it when you're ready. I'll take a few moments.
                    </Marginalia>
                    <button className="btn" onClick={submit} disabled={form.processing || words === 0}>
                        Send to grading <Ico.arrow />
                    </button>
                </div>
            </Page>
        </AppShell>
    );
}

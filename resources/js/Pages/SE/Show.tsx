import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import { Ico } from '@/Components/Common/icons';
import type { SeShowProps } from '@/lib/types';

const MAX_SPEAKING_SECONDS = 300;

type RecordState = 'idle' | 'recording' | 'recorded' | 'submitting';
type ActivePanel = 'writing' | 'speaking';

function fmt(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function CollapsibleList({ label, items }: { label: string; items: string[] }) {
    const [open, setOpen] = useState(false);
    if (items.length === 0) return null;
    return (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--hairline)' }}>
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13,
                    color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6,
                }}
            >
                {open ? '▾' : '▸'} {label}
            </button>
            {open && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--signal)', fontSize: 13, lineHeight: 1.5 }}>•</span>
                            <span style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{item}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function WritingPanel({ prompt }: { prompt: SeShowProps['prompt'] }) {
    const [text, setText]           = useState('');
    const [mono, setMono]           = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const words                     = wordCount(text);

    function submit() {
        if (!text.trim() || submitting) return;
        setSubmitting(true);
        router.post(`/software/${prompt.id}/writing`, { text }, {
            onError: () => {
                setSubmitting(false);
                setError('Something went wrong. Please try again.');
            },
        });
    }

    return (
        <div>
            <div className="card" style={{ padding: '28px 32px', marginBottom: 28 }}>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Design question
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', lineHeight: 1.45, margin: '0 0 10px', color: 'var(--ink)' }}>
                    {prompt.description}
                </p>
                {prompt.context && (
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
                        {prompt.context}
                    </p>
                )}
                <CollapsibleList label="Key concepts to cover" items={prompt.key_concepts} />
                <CollapsibleList label="Framework hints"       items={prompt.framework_hints} />
            </div>

            <div className="card" style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Your design doc
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                            onClick={() => setMono((v) => !v)}
                            style={{
                                fontFamily: 'var(--mono, monospace)', fontSize: 10,
                                background: mono ? 'var(--ink)' : 'var(--paper-3)',
                                color: mono ? 'var(--paper)' : 'var(--ink-3)',
                                border: mono ? 'none' : '1px solid var(--hairline)',
                                borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                            }}
                        >
                            mono
                        </button>
                        <span className="label-mono" style={{ fontSize: 9.5, color: words >= prompt.target_words ? 'var(--progress)' : 'var(--ink-4)' }}>
                            {words} / {prompt.target_words} words
                        </span>
                    </div>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your design here…"
                    rows={16}
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        fontFamily: mono ? 'var(--mono, monospace)' : 'var(--serif)',
                        fontSize: mono ? 13 : 15, lineHeight: 1.7,
                        padding: '14px 16px', borderRadius: 8,
                        border: '0.5px solid var(--hairline)',
                        background: 'var(--paper)', color: 'var(--ink)',
                        resize: 'vertical', outline: 'none',
                    }}
                />
                {error && (
                    <p style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 14, margin: '10px 0 0' }}>
                        {error}
                    </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                        onClick={submit}
                        disabled={submitting || text.trim().length < 10}
                        className="btn"
                        style={{ opacity: text.trim().length < 10 ? 0.5 : 1 }}
                    >
                        {submitting ? 'Grading…' : <>Submit for feedback <Ico.arrow /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SpeakingPanel({ prompt }: { prompt: SeShowProps['prompt'] }) {
    const [state, setState]         = useState<RecordState>('idle');
    const [duration, setDuration]   = useState(0);
    const [audioUrl, setAudioUrl]   = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [error, setError]         = useState<string | null>(null);

    const mediaRecRef = useRef<MediaRecorder | null>(null);
    const chunksRef   = useRef<Blob[]>([]);
    const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const durationRef = useRef(0);

    useEffect(() => () => {
        timerRef.current && clearInterval(timerRef.current);
        audioUrl && URL.revokeObjectURL(audioUrl);
    }, []);

    async function startRecording() {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                ? 'audio/ogg;codecs=opus'
                : 'audio/mp4';
            chunksRef.current = [];
            const mr = new MediaRecorder(stream, { mimeType: mime });
            mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] });
                const url  = URL.createObjectURL(blob);
                const ext  = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'mp4' : 'webm';
                const file = new File([blob], `recording.${ext}`, { type: mime.split(';')[0] });
                setAudioUrl(url);
                setAudioFile(file);
                setState('recorded');
            };
            mr.start(250);
            mediaRecRef.current = mr;
            durationRef.current = 0;
            setDuration(0);
            setState('recording');
            timerRef.current = setInterval(() => {
                durationRef.current += 1;
                setDuration(durationRef.current);
                if (durationRef.current >= MAX_SPEAKING_SECONDS) stopRecording();
            }, 1000);
        } catch {
            setError('Microphone access denied. Please allow microphone access and try again.');
        }
    }

    function stopRecording() {
        timerRef.current && clearInterval(timerRef.current);
        mediaRecRef.current?.stop();
    }

    function reset() {
        audioUrl && URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setAudioFile(null);
        setDuration(0);
        setState('idle');
    }

    function submit() {
        if (!audioFile) return;
        setState('submitting');
        const form = new FormData();
        form.append('audio', audioFile);
        form.append('duration', String(durationRef.current));
        router.post(`/software/${prompt.id}/speaking`, form as any, {
            forceFormData: true,
            onError: () => {
                setState('recorded');
                setError('Something went wrong. Please try again.');
            },
        });
    }

    const timeLeft = MAX_SPEAKING_SECONDS - duration;

    return (
        <div>
            <div className="card" style={{ padding: '28px 32px', marginBottom: 28 }}>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Verbal design question
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', lineHeight: 1.45, margin: '0 0 10px', color: 'var(--ink)' }}>
                    {prompt.description}
                </p>
                {prompt.context && (
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
                        {prompt.context}
                    </p>
                )}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--hairline)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>
                    Aim for about {Math.floor(prompt.target_seconds / 60)} minutes. Cover key concepts, trade-offs, and failure modes.
                </div>
                <CollapsibleList label="Key concepts to cover" items={prompt.key_concepts} />
                <CollapsibleList label="Framework hints"       items={prompt.framework_hints} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                {state === 'idle' && (
                    <>
                        <button onClick={startRecording} style={{
                            width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 12px oklch(0.2 0.02 60 / 0.15)',
                        }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'white' }} />
                        </button>
                        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', margin: 0 }}>
                            Tap to start recording
                        </p>
                    </>
                )}

                {state === 'recording' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="num" style={{ fontSize: 40, lineHeight: 1, color: 'var(--signal)' }}>{fmt(duration)}</div>
                                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4 }}>elapsed</div>
                            </div>
                            <div style={{ width: 0.5, height: 40, background: 'var(--hairline)' }} />
                            <div style={{ textAlign: 'center' }}>
                                <div className="num" style={{ fontSize: 24, lineHeight: 1, color: timeLeft < 60 ? 'var(--signal)' : 'var(--ink-3)' }}>{fmt(timeLeft)}</div>
                                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4 }}>remaining</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 36 }}>
                            {Array.from({ length: 16 }, (_, i) => (
                                <div key={i} style={{
                                    width: 3, borderRadius: 2, background: 'var(--signal)', transformOrigin: 'center',
                                    animation: `pulseDot ${0.6 + (i % 4) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate`,
                                    height: `${12 + Math.abs(Math.sin(i * 0.8)) * 20}px`,
                                }} />
                            ))}
                        </div>
                        <button onClick={stopRecording} style={{
                            width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: 'var(--signal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 0 6px var(--signal-wash), 0 0 0 12px var(--signal-wash)',
                            animation: 'pulseDot 2s ease-in-out infinite',
                        }}>
                            <span style={{ width: 22, height: 22, borderRadius: 4, background: 'white' }} />
                        </button>
                        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', margin: 0 }}>
                            Tap to stop
                        </p>
                    </>
                )}

                {(state === 'recorded' || state === 'submitting') && audioUrl && (
                    <>
                        <div style={{ width: '100%' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 8 }}>
                                Your recording · {fmt(durationRef.current)}
                            </div>
                            <audio src={audioUrl} controls style={{ width: '100%', borderRadius: 8 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                            <button onClick={reset} disabled={state === 'submitting'} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                                Re-record
                            </button>
                            <button onClick={submit} disabled={state === 'submitting'} className="btn" style={{ flex: 2, justifyContent: 'center' }}>
                                {state === 'submitting' ? 'Grading…' : <>Submit for feedback <Ico.arrow /></>}
                            </button>
                        </div>
                    </>
                )}

                {error && (
                    <p style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 14, margin: 0, textAlign: 'center' }}>
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function SeShow({ prompt }: SeShowProps) {
    const showBoth = prompt.mode === 'both';
    const [panel, setPanel] = useState<ActivePanel>(
        prompt.mode === 'speaking' ? 'speaking' : 'writing'
    );

    return (
        <AppShell>
            <Head title={`SE · ${prompt.title}`} />

            <div style={{
                position: 'sticky', top: 52, zIndex: 9,
                borderBottom: '0.5px solid var(--hairline)',
                background: 'oklch(0.965 0.012 80 / .92)',
                backdropFilter: 'blur(12px)',
                padding: '10px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link href="/software" style={{ textDecoration: 'none', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>
                    <Ico.arrowLeft /> SE practice
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.category.replace(/-/g, ' ')}</span>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.difficulty}</span>
                </div>
            </div>

            <Page>
                <div style={{ maxWidth: 720, margin: '0 auto' }}>
                    <h1 style={{
                        fontFamily: 'var(--serif)', fontSize: 28, fontStyle: 'italic',
                        fontWeight: 400, lineHeight: 1.2, margin: '0 0 28px', color: 'var(--ink)',
                    }}>
                        {prompt.title}
                    </h1>

                    {showBoth && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                            <button onClick={() => setPanel('writing')}  className={panel === 'writing'  ? 'btn' : 'btn btn-ghost'} style={{ fontSize: 13 }}>Write it</button>
                            <button onClick={() => setPanel('speaking')} className={panel === 'speaking' ? 'btn' : 'btn btn-ghost'} style={{ fontSize: 13 }}>Say it</button>
                        </div>
                    )}

                    {(panel === 'writing'  || prompt.mode === 'writing')  && <WritingPanel  prompt={prompt} />}
                    {(panel === 'speaking' || prompt.mode === 'speaking') && <SpeakingPanel prompt={prompt} />}
                </div>
            </Page>
        </AppShell>
    );
}

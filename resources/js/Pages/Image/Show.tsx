import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import { Ico } from '@/Components/Common/icons';
import type { ImageShowProps } from '@/lib/types';

const MAX_SECONDS = 180;

type ActiveMode = 'writing' | 'speaking';
type RecordState = 'idle' | 'recording' | 'recorded' | 'submitting';

function fmt(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function WritingPanel({ prompt }: { prompt: ImageShowProps['prompt'] }) {
    const [text, setText]           = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const target = prompt.target_words;

    function submit() {
        if (!text.trim()) return;
        setSubmitting(true);
        router.post(`/images/${prompt.id}/writing`, { text }, {
            onError: () => { setSubmitting(false); setError('Something went wrong. Please try again.'); },
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Your description
                </div>
                <div className="label-mono" style={{ fontSize: 10, color: words >= target ? 'var(--progress)' : 'var(--ink-4)' }}>
                    {words} / {target} words
                </div>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder={`Write your description here. Aim for at least ${target} words.`}
                style={{
                    width: '100%', fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.7,
                    padding: '14px 16px', borderRadius: 8, border: '0.5px solid var(--hairline)',
                    background: 'var(--paper)', color: 'var(--ink)', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                }}
            />
            {error && (
                <p style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 14, margin: 0 }}>{error}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={submit}
                    disabled={submitting || !text.trim()}
                    className="btn"
                    style={{ opacity: submitting || !text.trim() ? 0.5 : 1 }}
                >
                    {submitting ? 'Grading…' : <>Submit for feedback <Ico.arrow /></>}
                </button>
            </div>
        </div>
    );
}

function SpeakingPanel({ prompt }: { prompt: ImageShowProps['prompt'] }) {
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
            const mime   = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
                         : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')  ? 'audio/ogg;codecs=opus'
                         : 'audio/mp4';
            chunksRef.current = [];
            const mr = new MediaRecorder(stream, { mimeType: mime });
            mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] });
                const url  = URL.createObjectURL(blob);
                const ext  = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'mp4' : 'webm';
                setAudioUrl(url);
                setAudioFile(new File([blob], `recording.${ext}`, { type: mime.split(';')[0] }));
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
                if (durationRef.current >= MAX_SECONDS) stopRecording();
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
        setAudioUrl(null); setAudioFile(null); setDuration(0); setState('idle');
    }

    function submit() {
        if (!audioFile) return;
        setState('submitting');
        const form = new FormData();
        form.append('audio', audioFile);
        form.append('duration', String(durationRef.current));
        router.post(`/images/${prompt.id}/speaking`, form as any, {
            forceFormData: true,
            onError: () => { setState('recorded'); setError('Something went wrong. Please try again.'); },
        });
    }

    const timeLeft = MAX_SECONDS - duration;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', margin: 0, textAlign: 'center' }}>
                Look at the image above and describe it aloud. Aim for about {Math.floor(prompt.target_seconds / 60)} minutes.
            </p>

            {state === 'idle' && (
                <>
                    <button onClick={startRecording} style={{
                        width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 12px oklch(0.2 0.02 60 / 0.15)',
                    }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
                    </button>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
                        Tap to start recording
                    </p>
                </>
            )}

            {state === 'recording' && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="num" style={{ fontSize: 36, lineHeight: 1, color: 'var(--signal)' }}>{fmt(duration)}</div>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4 }}>elapsed</div>
                        </div>
                        <div style={{ width: 0.5, height: 36, background: 'var(--hairline)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div className="num" style={{ fontSize: 22, lineHeight: 1, color: timeLeft < 30 ? 'var(--signal)' : 'var(--ink-3)' }}>{fmt(timeLeft)}</div>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4 }}>remaining</div>
                        </div>
                    </div>
                    <button onClick={stopRecording} style={{
                        width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: 'var(--signal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 6px var(--signal-wash), 0 0 0 12px var(--signal-wash)',
                        animation: 'pulseDot 2s ease-in-out infinite',
                    }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, background: 'white' }} />
                    </button>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>Tap to stop</p>
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
                <p style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 14, margin: 0, textAlign: 'center' }}>{error}</p>
            )}
        </div>
    );
}

export default function ImageShow({ prompt }: ImageShowProps) {
    const [mode, setMode] = useState<ActiveMode>(
        prompt.mode === 'speaking' ? 'speaking' : 'writing'
    );
    const [hintsOpen, setHintsOpen] = useState(false);

    const canWrite  = prompt.mode === 'writing'  || prompt.mode === 'both';
    const canSpeak  = prompt.mode === 'speaking' || prompt.mode === 'both';

    return (
        <AppShell>
            <Head title={`Image · ${prompt.title}`} />

            {/* Top bar */}
            <div style={{
                position: 'sticky', top: 52, zIndex: 9,
                borderBottom: '0.5px solid var(--hairline)',
                background: 'oklch(0.965 0.012 80 / .92)',
                backdropFilter: 'blur(12px)',
                padding: '10px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link href="/images" style={{ textDecoration: 'none', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>
                    <Ico.arrowLeft /> image prompts
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.type}</span>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.topic}</span>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.level.toUpperCase()}</span>
                </div>
            </div>

            <Page>
                <div style={{ maxWidth: 720, margin: '0 auto' }}>

                    {/* Image */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
                        <img
                            src={`/images/${prompt.id}/image`}
                            alt={prompt.title}
                            style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', background: 'var(--paper-2)' }}
                        />
                    </div>

                    {/* Task instruction */}
                    <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Task
                        </div>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 16px', color: 'var(--ink)' }}>
                            {prompt.task_instruction}
                        </p>

                        {/* Key features toggle */}
                        <button
                            onClick={() => setHintsOpen((o) => !o)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            {hintsOpen ? '▾' : '▸'} {hintsOpen ? 'Hide' : 'Show'} key features to cover
                        </button>
                        {hintsOpen && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {prompt.key_features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.4 }}>•</span>
                                        <span style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.4, color: 'var(--ink-2)' }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mode toggle */}
                    {canWrite && canSpeak && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                            <button
                                onClick={() => setMode('writing')}
                                className={mode === 'writing' ? 'btn' : 'btn btn-ghost'}
                                style={{ fontSize: 13, padding: '8px 20px' }}
                            >
                                ✏ Write
                            </button>
                            <button
                                onClick={() => setMode('speaking')}
                                className={mode === 'speaking' ? 'btn' : 'btn btn-ghost'}
                                style={{ fontSize: 13, padding: '8px 20px' }}
                            >
                                🎙 Speak
                            </button>
                        </div>
                    )}

                    {/* Active panel */}
                    <div className="card" style={{ padding: '28px 32px' }}>
                        {mode === 'writing' && <WritingPanel prompt={prompt} />}
                        {mode === 'speaking' && <SpeakingPanel prompt={prompt} />}
                    </div>
                </div>
            </Page>
        </AppShell>
    );
}

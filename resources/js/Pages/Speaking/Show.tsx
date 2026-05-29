import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import { Ico } from '@/Components/Common/icons';
import type { SpeakingShowProps, VocabWord } from '@/lib/types';

const MAX_SECONDS = 180; // 3 minutes hard stop

type RecordState = 'idle' | 'recording' | 'recorded' | 'submitting';

function fmt(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function RecordButton({ state, onClick }: { state: RecordState; onClick: () => void }) {
    const isRec = state === 'recording';
    return (
        <button
            onClick={onClick}
            disabled={state === 'submitting'}
            style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: isRec ? 'var(--signal)' : 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.1s',
                boxShadow: isRec ? '0 0 0 6px var(--signal-wash), 0 0 0 12px var(--signal-wash)' : '0 2px 12px oklch(0.2 0.02 60 / 0.15)',
                animation: isRec ? 'pulseDot 2s ease-in-out infinite' : 'none',
            }}
        >
            {isRec
                ? <span style={{ width: 22, height: 22, borderRadius: 4, background: 'white' }} />
                : <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'white' }} />
            }
        </button>
    );
}

type SampleStatus = 'idle' | 'loading' | 'done' | 'error';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

function SampleAnswer({ url }: { url: string }) {
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
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '0.5px solid var(--hairline)' }}>
            {status === 'idle' && (
                <button
                    onClick={generate}
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '6px 14px' }}
                >
                    See a sample response
                </button>
            )}
            {status === 'loading' && (
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                    Generating sample…
                </p>
            )}
            {status === 'error' && (
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--signal)', margin: 0 }}>
                    Could not generate a sample. Please try again.{' '}
                    <button onClick={generate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 13, padding: 0, textDecoration: 'underline' }}>
                        Retry
                    </button>
                </p>
            )}
            {status === 'done' && (
                <div>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Sample response · C1 vocabulary
                    </div>
                    <p style={{
                        fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.75,
                        color: 'var(--ink-2)', margin: '0 0 10px', whiteSpace: 'pre-wrap',
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

function VocabPicker({ words }: { words: VocabWord[] }) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    if (words.length === 0) return null;

    function toggle(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    return (
        <div style={{
            width: '100%', borderTop: '0.5px solid var(--hairline)',
            paddingTop: 24, marginTop: 8,
        }}>
            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your vocabulary · tap words to use while speaking
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {words.map((w) => {
                    const active = selected.has(w.id);
                    const isAdvanced = w.level === 'c1' || w.level === 'c2';
                    return (
                        <div key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 180 }}>
                            <button
                                onClick={() => toggle(w.id)}
                                style={{
                                    background: active ? 'var(--ink)' : 'var(--paper-3)',
                                    color: active ? 'var(--paper)' : 'var(--ink)',
                                    border: active ? 'none' : '1px solid var(--hairline)',
                                    borderRadius: 999,
                                    padding: '5px 14px',
                                    fontFamily: 'var(--serif)',
                                    fontStyle: 'italic',
                                    fontSize: 13.5,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    transition: 'background 0.15s',
                                }}
                            >
                                {w.word}
                                {w.level && (
                                    <span style={{
                                        fontStyle: 'normal',
                                        fontFamily: 'var(--mono, monospace)',
                                        fontSize: 9,
                                        opacity: active ? 0.7 : 0.9,
                                        color: isAdvanced ? (active ? 'var(--paper)' : 'var(--signal)') : undefined,
                                    }}>
                                        {w.level.toUpperCase()}
                                    </span>
                                )}
                            </button>
                            {isAdvanced && w.definition && (
                                <p style={{
                                    margin: 0,
                                    fontFamily: 'var(--serif)',
                                    fontSize: 11.5,
                                    color: 'var(--ink-3)',
                                    lineHeight: 1.4,
                                    paddingLeft: 14,
                                }}>
                                    {w.definition}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            {selected.size > 0 && (
                <p style={{ margin: '12px 0 0', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)' }}>
                    Try to use {selected.size === 1 ? 'this word' : `these ${selected.size} words`} in your response.
                </p>
            )}
        </div>
    );
}

export default function SpeakingShow({ prompt, vocab_words }: SpeakingShowProps) {
    const [state, setState]       = useState<RecordState>('idle');
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [error, setError]         = useState<string | null>(null);

    const mediaRecRef  = useRef<MediaRecorder | null>(null);
    const chunksRef    = useRef<Blob[]>([]);
    const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
    const durationRef  = useRef(0);

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
                const blob    = new Blob(chunksRef.current, { type: mime.split(';')[0] });
                const url     = URL.createObjectURL(blob);
                const ext     = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'mp4' : 'webm';
                const file    = new File([blob], `recording.${ext}`, { type: mime.split(';')[0] });
                setAudioUrl(url);
                setAudioFile(file);
                setState('recorded');
            };
            mr.start(250); // collect data every 250ms
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

        router.post(`/speaking/${prompt.id}`, form as any, {
            forceFormData: true,
            onError: () => {
                setState('recorded');
                setError('Something went wrong. Please try again.');
            },
        });
    }

    const timeLeft = MAX_SECONDS - duration;

    return (
        <AppShell>
            <Head title={`Speaking · ${prompt.topic}`} />

            {/* Top bar */}
            <div style={{
                position: 'sticky', top: 52, zIndex: 9,
                borderBottom: '0.5px solid var(--hairline)',
                background: 'oklch(0.965 0.012 80 / .92)',
                backdropFilter: 'blur(12px)',
                padding: '10px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link href="/speaking" style={{ textDecoration: 'none', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13 }}>
                    <Ico.arrowLeft /> prompts
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.topic}</span>
                    <span className="chip" style={{ fontSize: 10 }}>{prompt.level.toUpperCase()}</span>
                </div>
            </div>

            <Page>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>

                    {/* Cue card */}
                    <div className="card" style={{ padding: '32px 36px', marginBottom: 40 }}>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Speaking task
                        </div>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', lineHeight: 1.4, margin: '0 0 20px', color: 'var(--ink)' }}>
                            {prompt.text}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {prompt.cue_points.map((cue, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--signal)', fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.4 }}>•</span>
                                    <span style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.4, color: 'var(--ink-2)' }}>{cue}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '0.5px solid var(--hairline)', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>
                            You have up to 3 minutes. Speak naturally — aim for about {Math.floor(prompt.target_seconds / 60)} minutes.
                        </div>

                        {/* Sample answer */}
                        <SampleAnswer url={`/speaking/${prompt.id}/sample`} />

                        {/* Vocab picker — inside the cue card so it's visible before and during recording */}
                        <VocabPicker words={vocab_words} />
                    </div>

                    {/* Recording controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

                        {state === 'idle' && (
                            <>
                                <RecordButton state={state} onClick={startRecording} />
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', margin: 0 }}>
                                    Tap to start recording
                                </p>
                            </>
                        )}

                        {state === 'recording' && (
                            <>
                                {/* Timer + time remaining */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="num" style={{ fontSize: 40, lineHeight: 1, color: 'var(--signal)' }}>
                                            {fmt(duration)}
                                        </div>
                                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4 }}>
                                            elapsed
                                        </div>
                                    </div>
                                    <div style={{ width: 0.5, height: 40, background: 'var(--hairline)' }} />
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="num" style={{ fontSize: 24, lineHeight: 1, color: timeLeft < 30 ? 'var(--signal)' : 'var(--ink-3)' }}>
                                            {fmt(timeLeft)}
                                        </div>
                                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 4 }}>
                                            remaining
                                        </div>
                                    </div>
                                </div>

                                {/* Animated waveform bars */}
                                <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 36 }}>
                                    {Array.from({ length: 16 }, (_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: 3,
                                                borderRadius: 2,
                                                background: 'var(--signal)',
                                                transformOrigin: 'center',
                                                animation: `pulseDot ${0.6 + (i % 4) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate`,
                                                height: `${12 + Math.abs(Math.sin(i * 0.8)) * 20}px`,
                                            }}
                                        />
                                    ))}
                                </div>

                                <RecordButton state={state} onClick={stopRecording} />
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', margin: 0 }}>
                                    Tap to stop
                                </p>
                            </>
                        )}

                        {(state === 'recorded' || state === 'submitting') && audioUrl && (
                            <>
                                {/* Playback */}
                                <div style={{ width: '100%' }}>
                                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 8 }}>
                                        Your recording · {fmt(durationRef.current)}
                                    </div>
                                    <audio
                                        src={audioUrl}
                                        controls
                                        style={{ width: '100%', borderRadius: 8 }}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                    <button
                                        onClick={reset}
                                        disabled={state === 'submitting'}
                                        className="btn btn-ghost"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        Re-record
                                    </button>
                                    <button
                                        onClick={submit}
                                        disabled={state === 'submitting'}
                                        className="btn"
                                        style={{ flex: 2, justifyContent: 'center' }}
                                    >
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
            </Page>
        </AppShell>
    );
}

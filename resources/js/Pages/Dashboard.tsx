import { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import { Ico } from '@/Components/Common/icons';
import type { DashboardProps, DashboardReading, DashboardSpeaking, DashboardWriting } from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function getCsrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

const LEVEL_LABEL: Record<string, string> = { b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2' };

function isAdvanced(level: string) { return level === 'c1' || level === 'c2'; }

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, b2, c1, total }: { label: string; b2: number; c1: number; total: number }) {
    return (
        <div className="card" style={{ padding: '20px 24px', flex: 1, minWidth: 160 }}>
            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10 }}>{label}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 500 }}>{total}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <span className="chip" style={{ fontSize: 10 }}>B2 · {b2}</span>
                <span className="chip" style={{ fontSize: 10, background: 'var(--signal-wash)', color: 'var(--signal)' }}>C1 · {c1}</span>
            </div>
        </div>
    );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

type GeneratedReading = {
    type: 'reading';
    title: string; topic: string; body: string; word_count: number; level: string;
    questions: Array<{ position: number; question_text: string; model_answer: string }>;
};
type GeneratedSpeaking = {
    type: 'speaking';
    text: string; topic: string; target_seconds: number; level: string;
    cue_points: string[];
};
type GeneratedWriting = {
    type: 'writing';
    text: string; level: string; task_type: string; topic: string;
};
type Generated = GeneratedReading | GeneratedSpeaking | GeneratedWriting;

function ReadingPreview({ d }: { d: GeneratedReading }) {
    return (
        <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontStyle: 'italic', marginBottom: 6 }}>{d.title}</div>
            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 14 }}>
                {d.word_count} words · {d.questions.length} questions · {LEVEL_LABEL[d.level] ?? d.level} · {d.topic}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: 18 }}>
                {d.body}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.questions.map((q) => (
                    <div key={q.position} style={{ padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 8 }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, marginBottom: 4 }}>{q.position}. {q.question_text}</div>
                        <div className="label-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{q.model_answer}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SpeakingPreview({ d }: { d: GeneratedSpeaking }) {
    return (
        <div>
            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 10 }}>
                {LEVEL_LABEL[d.level] ?? d.level} · {d.topic} · ~{Math.round(d.target_seconds / 60)} min
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', lineHeight: 1.45, marginBottom: 16 }}>
                {d.text}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.cue_points.map((c, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'var(--paper-2)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--serif)', color: 'var(--ink-2)' }}>
                        {i + 1}. {c}
                    </div>
                ))}
            </div>
        </div>
    );
}

function WritingPreview({ d }: { d: GeneratedWriting }) {
    return (
        <div>
            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 10 }}>
                {LEVEL_LABEL[d.level] ?? d.level} · {d.task_type} · {d.topic}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.6 }}>{d.text}</p>
        </div>
    );
}

// ── Generator panel ────────────────────────────────────────────────────────────

type GenState = 'idle' | 'loading' | 'done' | 'saving' | 'error';

function GeneratorPanel() {
    const [type, setType]     = useState<'reading' | 'speaking' | 'writing'>('reading');
    const [level, setLevel]   = useState<'b2' | 'c1'>('b2');
    const [topic, setTopic]   = useState('');
    const [taskType, setTaskType] = useState<'task-1' | 'task-2'>('task-2');
    const [state, setState]   = useState<GenState>('idle');
    const [result, setResult] = useState<Generated | null>(null);
    const [error, setError]   = useState('');

    const generate = useCallback(async () => {
        if (!topic.trim()) return;
        setState('loading');
        setResult(null);
        setError('');
        try {
            const res = await fetch('/dashboard/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
                body: JSON.stringify({ type, level, topic: topic.trim(), task_type: taskType }),
            });
            const json = await res.json();
            if (json.ok) {
                setResult(json.data as Generated);
                setState('done');
            } else {
                setError(json.error ?? 'Unknown error');
                setState('error');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
            setState('error');
        }
    }, [type, level, topic, taskType]);

    const save = useCallback(() => {
        if (!result) return;
        setState('saving');
        router.post('/dashboard/save', result as Parameters<typeof router.post>[1], {
            onSuccess: () => {
                setState('idle');
                setResult(null);
                setTopic('');
            },
            onError: () => setState('done'),
        });
    }, [result]);

    const discard = () => { setResult(null); setState('idle'); };

    return (
        <div className="card" style={{ padding: 28, marginBottom: 40 }}>
            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 16 }}>AI Content Generator</div>

            {/* Type tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {(['reading', 'speaking', 'writing'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className="chip"
                        style={{
                            cursor: 'pointer', border: 'none', fontSize: 11, textTransform: 'capitalize',
                            background: type === t ? 'var(--ink)' : undefined,
                            color: type === t ? 'var(--paper)' : undefined,
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Controls row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'b2' | 'c1')}
                    style={{ fontFamily: 'var(--serif)', fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--hairline)', background: 'var(--paper)', color: 'var(--ink)', cursor: 'pointer' }}
                >
                    <option value="b2">B2</option>
                    <option value="c1">C1</option>
                </select>

                {type === 'writing' && (
                    <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as 'task-1' | 'task-2')}
                        style={{ fontFamily: 'var(--serif)', fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '0.5px solid var(--hairline)', background: 'var(--paper)', color: 'var(--ink)', cursor: 'pointer' }}
                    >
                        <option value="task-2">Task 2 (essay)</option>
                        <option value="task-1">Task 1 (descriptive)</option>
                    </select>
                )}

                <input
                    type="text"
                    placeholder="Topic (e.g. urban planning, free will…)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generate()}
                    style={{ flex: 1, minWidth: 220, fontFamily: 'var(--serif)', fontSize: 13, padding: '6px 12px', borderRadius: 6, border: '0.5px solid var(--hairline)', background: 'var(--paper)', color: 'var(--ink)', outline: 'none' }}
                />

                <button
                    onClick={generate}
                    disabled={state === 'loading' || !topic.trim()}
                    className="btn"
                    style={{ fontSize: 13, opacity: state === 'loading' || !topic.trim() ? 0.5 : 1 }}
                >
                    {state === 'loading' ? 'Generating…' : 'Generate'} {state !== 'loading' && <Ico.arrow />}
                </button>
            </div>

            {/* Result */}
            {state === 'error' && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 8, color: '#991b1b', fontSize: 13, fontFamily: 'var(--serif)' }}>
                    {error}
                </div>
            )}

            {result && (state === 'done' || state === 'saving') && (
                <div>
                    <div style={{ padding: 20, background: 'var(--paper-2)', borderRadius: 10, marginBottom: 14 }}>
                        {result.type === 'reading'  && <ReadingPreview  d={result} />}
                        {result.type === 'speaking' && <SpeakingPreview d={result} />}
                        {result.type === 'writing'  && <WritingPreview  d={result} />}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={save} className="btn" style={{ fontSize: 13, opacity: state === 'saving' ? 0.5 : 1 }} disabled={state === 'saving'}>
                            {state === 'saving' ? 'Saving…' : 'Save to library'} {state !== 'saving' && <Ico.arrow />}
                        </button>
                        <button onClick={generate} className="btn" style={{ fontSize: 13, background: 'var(--paper-3)', color: 'var(--ink)' }} disabled={state === 'saving'}>
                            Regenerate
                        </button>
                        <button onClick={discard} style={{ fontSize: 12, fontFamily: 'var(--serif)', background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', padding: '6px 4px' }} disabled={state === 'saving'}>
                            Discard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Content library tabs ───────────────────────────────────────────────────────

function DeleteBtn({ onDelete }: { onDelete: () => void }) {
    const [confirm, setConfirm] = useState(false);
    if (!confirm) {
        return (
            <button onClick={() => setConfirm(true)} style={{ fontFamily: 'var(--serif)', fontSize: 12, background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}>
                ×
            </button>
        );
    }
    return (
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={onDelete} style={{ fontFamily: 'var(--serif)', fontSize: 11, background: '#fef2f2', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '2px 8px', borderRadius: 4 }}>
                Delete
            </button>
            <button onClick={() => setConfirm(false)} style={{ fontFamily: 'var(--serif)', fontSize: 11, background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', padding: '2px 4px' }}>
                Cancel
            </button>
        </span>
    );
}

function del(type: string, id: number) {
    router.delete(`/dashboard/${type}/${id}`);
}

function ReadingList({ items }: { items: DashboardReading[] }) {
    if (!items.length) return <Empty />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 8, borderLeft: isAdvanced(p.level) ? '3px solid var(--signal)' : undefined }}>
                    <span className="chip" style={{ fontSize: 10, flexShrink: 0, background: isAdvanced(p.level) ? 'var(--signal-wash)' : undefined, color: isAdvanced(p.level) ? 'var(--signal)' : undefined }}>
                        {LEVEL_LABEL[p.level] ?? p.level}
                    </span>
                    <span className="chip" style={{ fontSize: 10, flexShrink: 0 }}>{p.topic}</span>
                    <span style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                    <DeleteBtn onDelete={() => del('reading', p.id)} />
                </div>
            ))}
        </div>
    );
}

function SpeakingList({ items }: { items: DashboardSpeaking[] }) {
    if (!items.length) return <Empty />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 8, borderLeft: isAdvanced(p.level) ? '3px solid var(--signal)' : undefined }}>
                    <span className="chip" style={{ fontSize: 10, flexShrink: 0, background: isAdvanced(p.level) ? 'var(--signal-wash)' : undefined, color: isAdvanced(p.level) ? 'var(--signal)' : undefined }}>
                        {LEVEL_LABEL[p.level] ?? p.level}
                    </span>
                    <span className="chip" style={{ fontSize: 10, flexShrink: 0 }}>{p.topic}</span>
                    <span style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</span>
                    <DeleteBtn onDelete={() => del('speaking', p.id)} />
                </div>
            ))}
        </div>
    );
}

function WritingList({ items }: { items: DashboardWriting[] }) {
    if (!items.length) return <Empty />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 8, borderLeft: isAdvanced(p.level) ? '3px solid var(--signal)' : undefined }}>
                    <span className="chip" style={{ fontSize: 10, flexShrink: 0, background: isAdvanced(p.level) ? 'var(--signal-wash)' : undefined, color: isAdvanced(p.level) ? 'var(--signal)' : undefined }}>
                        {LEVEL_LABEL[p.level] ?? p.level}
                    </span>
                    <span className="chip" style={{ fontSize: 10, flexShrink: 0 }}>{p.task_type}</span>
                    <span style={{ flex: 1, fontFamily: 'var(--serif)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</span>
                    <DeleteBtn onDelete={() => del('writing', p.id)} />
                </div>
            ))}
        </div>
    );
}

function Empty() {
    return (
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)', padding: '20px 0' }}>
            Nothing here yet — generate some content above.
        </p>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type LibTab = 'reading' | 'speaking' | 'writing';

export default function Dashboard({ stats, reading, speaking, writing }: DashboardProps) {
    const [tab, setTab] = useState<LibTab>('reading');

    return (
        <AppShell>
            <Head title="Content Studio" />
            <Page>
                <PageHeader
                    eyebrow="Content Studio"
                    title="Manage your library"
                    italic="generate, save, remove"
                    lead="Use the generator to create new reading passages, speaking prompts, or writing prompts with AI. Preview each one before saving, or delete items that are no longer useful."
                />

                {/* Stats */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
                    <StatCard label="READING PASSAGES" {...stats.reading} />
                    <StatCard label="SPEAKING PROMPTS" {...stats.speaking} />
                    <StatCard label="WRITING PROMPTS"  {...stats.writing} />
                </div>

                {/* Generator */}
                <GeneratorPanel />

                {/* Library */}
                <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                        {(['reading', 'speaking', 'writing'] as LibTab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className="chip"
                                style={{
                                    cursor: 'pointer', border: 'none', fontSize: 11, textTransform: 'capitalize',
                                    background: tab === t ? 'var(--ink)' : undefined,
                                    color: tab === t ? 'var(--paper)' : undefined,
                                }}
                            >
                                {t} ({t === 'reading' ? reading.length : t === 'speaking' ? speaking.length : writing.length})
                            </button>
                        ))}
                    </div>

                    {tab === 'reading'  && <ReadingList  items={reading}  />}
                    {tab === 'speaking' && <SpeakingList items={speaking} />}
                    {tab === 'writing'  && <WritingList  items={writing}  />}
                </div>
            </Page>
        </AppShell>
    );
}

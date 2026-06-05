import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import { Ico } from '@/Components/Common/icons';
import type { VideoIndexProps, VideoType, VideoPlatform, VideoDuration, VideoTone, VideoContent, VideoSection } from '@/lib/types';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

// ── Static data ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<VideoType, string>     = { tutorial: '🎓 Tutorial', 'talking-head': '🎙 Talking head', 'case-study': '🔬 Case study', shorts: '⚡ Shorts' };
const PLATFORM_LABELS: Record<VideoPlatform, string> = { youtube: '▶ YouTube', linkedin: 'in LinkedIn', tiktok: '♪ TikTok/Reels' };
const DURATION_LABELS: Record<VideoDuration, string> = { short: '3–5 min', medium: '8–12 min', long: '15–20 min' };
const TONE_LABELS: Record<VideoTone, { label: string; desc: string }> = {
    educational:        { label: 'Educational',       desc: 'Clear, step-by-step, teach a skill' },
    entertaining:       { label: 'Entertaining',      desc: 'Engaging, energetic, personality-forward' },
    'thought-leadership': { label: 'Thought leadership', desc: 'Opinionated, forward-looking, bold POV' },
};

const FIELD: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--serif)', fontSize: 14,
    padding: '9px 12px', borderRadius: 6, border: '0.5px solid var(--hairline)',
    background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
};

type GenStatus = 'idle' | 'loading' | 'done' | 'error';

// ── AI Tools guide data ───────────────────────────────────────────────────────

const TOOLS = [
    {
        category: 'Editing & Captions',
        items: [
            { name: 'CapCut', tagline: 'Edit, auto-captions, AI effects', free: true, bestFor: 'LinkedIn & TikTok clips', tip: 'Use "Auto-caption" then edit timing. The template library has pro-looking intros.', url: 'https://www.capcut.com' },
            { name: 'Descript', tagline: 'Edit video by editing transcript', free: true, bestFor: 'Talking head cleanup', tip: 'Click "Remove filler words" to delete every "um" and "uh" in one click.', url: 'https://www.descript.com' },
            { name: 'Veed.io', tagline: 'Online editor with AI subtitles & avatars', free: true, bestFor: 'Quick captioned clips', tip: 'Subtitles → Auto-translate to create multilingual versions of your content.', url: 'https://www.veed.io' },
            { name: 'Opus Clip', tagline: 'AI finds your best viral clips', free: true, bestFor: 'Repurposing long videos', tip: 'Upload a 30-min video → get 10 short clips with hook scores. Pick the top 3.', url: 'https://www.opus.pro' },
        ],
    },
    {
        category: 'AI Generation & Enhancement',
        items: [
            { name: 'HeyGen', tagline: 'AI avatar presenter + video translation', free: false, bestFor: 'No-camera explainer videos', tip: 'Create a digital twin of yourself in 2 minutes. Great for product demos.', url: 'https://www.heygen.com' },
            { name: 'Runway', tagline: 'Generate video, remove background, AI effects', free: true, bestFor: 'Creative b-roll & intros', tip: 'Gen-3 Alpha can create realistic b-roll from text prompts. Use for intros.', url: 'https://runwayml.com' },
            { name: 'Pictory', tagline: 'Turn scripts & blogs into videos', free: true, bestFor: 'Repurposing written content', tip: 'Paste your script → Pictory matches stock footage to each sentence automatically.', url: 'https://pictory.ai' },
            { name: 'Canva Video', tagline: 'Templates, AI voiceover, brand kit', free: true, bestFor: 'Thumbnails & short clips', tip: 'Magic Animate turns any design into a polished animated short. Free tier is generous.', url: 'https://www.canva.com/video-editor' },
        ],
    },
];

const WORKFLOWS = [
    {
        scenario: 'Recording a talking head',
        stack: ['Record in natural light (window beside you, not behind)', 'Descript → remove filler words & re-record flubs by typing', 'CapCut → auto-captions + B-roll cutaways + music'],
    },
    {
        scenario: 'No camera / AI presenter',
        stack: ['HeyGen → create avatar from a 2-min sample video of yourself', 'Paste your script → AI lip-syncs + reads it', 'Canva Video or CapCut → add title cards, b-roll, captions'],
    },
    {
        scenario: 'Repurposing long content',
        stack: ['Record or import a long video (30–60 min)', 'Opus Clip → finds top 10 short clips with viral score', 'Veed.io → add captions, resize for each platform'],
    },
];

// ── Components ────────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '6px 14px' }}
        >
            {copied ? '✓ Copied' : label}
        </button>
    );
}

function SectionCard({ section, index }: { section: VideoSection; index: number }) {
    const [open, setOpen] = useState(index === 0);
    const mins = Math.floor(section.duration_seconds / 60);
    const secs = section.duration_seconds % 60;
    const dur  = mins > 0 ? `~${mins}m ${secs}s` : `~${secs}s`;

    return (
        <div style={{ border: '0.5px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%', textAlign: 'left', padding: '14px 18px',
                    background: open ? 'var(--paper-2)' : 'var(--paper)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
            >
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>
                    {section.title}
                </span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="chip" style={{ fontSize: 9.5 }}>{dur}</span>
                    <span style={{ color: 'var(--ink-4)', fontSize: 12, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
                </div>
            </button>
            {open && (
                <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '0.5px solid var(--hairline)' }}>
                    <div>
                        <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Script</div>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0 }}>{section.script}</p>
                    </div>
                    {section.talking_points.length > 0 && (
                        <div>
                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key points</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {section.talking_points.map((p, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ color: 'var(--signal)', flexShrink: 0, fontSize: 14 }}>•</span>
                                        <span style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {section.broll && (
                        <div style={{ padding: '8px 12px', background: 'var(--paper-2)', borderRadius: 6 }}>
                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📹 B-roll / visuals</div>
                            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>{section.broll}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ScriptResult({ content, form, onSave }: { content: VideoContent; form: { topic: string; video_type: VideoType; platform: VideoPlatform; duration: VideoDuration; tone: VideoTone }; onSave: () => void }) {
    const fullScript = [
        `# ${content.title}`,
        '', `[HOOK]`, content.hook,
        '', `[INTRO]`, content.intro,
        ...content.sections.flatMap(s => ['', `[${s.title.toUpperCase()}]`, s.script]),
        '', `[OUTRO]`, content.outro,
        content.chapters.length > 0 ? ['\n[CHAPTERS]', ...content.chapters.map(c => `${c.time} — ${c.title}`)].join('\n') : '',
        '', `[DESCRIPTION]`, content.description,
        '', content.tags.map(t => `#${t}`).join(' '),
    ].filter(Boolean).join('\n');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title + actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic', fontWeight: 400, margin: 0, color: 'var(--ink)', lineHeight: 1.3, flex: 1 }}>
                    {content.title}
                </h2>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <CopyButton text={fullScript} label="Copy script" />
                    <button onClick={onSave} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Save draft</button>
                </div>
            </div>

            {/* Hook — prominent */}
            <div style={{ padding: '16px 20px', background: 'var(--ink)', borderRadius: 10 }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚡ Hook · first 10–15 seconds</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--paper)', margin: 0, fontStyle: 'italic' }}>{content.hook}</p>
            </div>

            {/* Intro */}
            {content.intro && (
                <div style={{ padding: '14px 18px', border: '0.5px solid var(--hairline)', borderRadius: 10 }}>
                    <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Intro · 30–45 seconds</div>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0 }}>{content.intro}</p>
                </div>
            )}

            {/* Sections */}
            <div>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Main content</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {content.sections.map((s, i) => <SectionCard key={i} section={s} index={i} />)}
                </div>
            </div>

            {/* Outro */}
            <div style={{ padding: '14px 18px', background: 'var(--progress-wash)', border: '0.5px solid oklch(0.85 0.06 145)', borderRadius: 10 }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--progress)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outro + CTA</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0 }}>{content.outro}</p>
            </div>

            {/* Chapters (YouTube only) */}
            {content.chapters.length > 0 && form.platform === 'youtube' && (
                <div>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Chapters
                        <CopyButton text={content.chapters.map(c => `${c.time} ${c.title}`).join('\n')} label="Copy" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {content.chapters.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                                <span className="num" style={{ fontSize: 12, color: 'var(--signal)', minWidth: 36 }}>{c.time}</span>
                                <span style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'var(--ink-2)' }}>{c.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
                    <CopyButton text={content.description} label="Copy" />
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--paper-2)', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}>{content.description}</p>
                </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {content.tags.map((t) => <span key={t} className="chip" style={{ fontSize: 11, color: 'var(--ink-3)' }}>#{t}</span>)}
            </div>
        </div>
    );
}

function ToolCard({ tool }: { tool: typeof TOOLS[0]['items'][0] }) {
    return (
        <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, margin: '0 0 3px', color: 'var(--ink)' }}>{tool.name}</p>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>{tool.tagline}</p>
                </div>
                <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 99,
                    background: tool.free ? 'var(--progress-wash)' : 'var(--signal-wash)',
                    color: tool.free ? 'var(--progress)' : 'var(--signal)',
                    flexShrink: 0,
                }}>
                    {tool.free ? 'Free tier' : 'Paid'}
                </span>
            </div>
            <div>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best for</div>
                <span className="chip" style={{ fontSize: 11 }}>{tool.bestFor}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--paper-2)', borderRadius: 6 }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick tip</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0 }}>{tool.tip}</p>
            </div>
            <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
                Open tool <Ico.arrow style={{ fontSize: 11 }} />
            </a>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VideoIndex({ scripts, loaded_script }: VideoIndexProps) {
    const [form, setForm] = useState({
        topic:      loaded_script?.topic      ?? '',
        video_type: (loaded_script?.video_type ?? 'tutorial') as VideoType,
        platform:   (loaded_script?.platform   ?? 'youtube') as VideoPlatform,
        duration:   (loaded_script?.duration   ?? 'medium') as VideoDuration,
        tone:       (loaded_script?.tone       ?? 'educational') as VideoTone,
    });
    const [status, setStatus]   = useState<GenStatus>(loaded_script ? 'done' : 'idle');
    const [content, setContent] = useState<VideoContent | null>(loaded_script?.content ?? null);
    const [savedId, setSavedId] = useState<number | null>(loaded_script?.id ?? null);
    const [saving, setSaving]   = useState(false);

    function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
        setForm(f => ({ ...f, [k]: v }));
    }

    async function generate() {
        setStatus('loading'); setContent(null); setSavedId(null);
        try {
            const res = await fetch('/video/generate', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error);
            setContent(data.content as VideoContent);
            setStatus('done');
        } catch { setStatus('error'); }
    }

    async function saveDraft() {
        if (!content || saving) return;
        setSaving(true);
        try {
            const res = await fetch('/video', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, content }),
            });
            const data = await res.json();
            setSavedId(data.id);
            router.reload({ only: ['scripts'] });
        } catch {}
        setSaving(false);
    }

    async function markReady(id: number, current: string) {
        await fetch(`/video/${id}/status`, {
            method: 'PUT',
            headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: current === 'ready' ? 'draft' : 'ready' }),
        });
        router.reload({ only: ['scripts'] });
    }

    const isShorts = form.video_type === 'shorts' || form.platform === 'tiktok';

    return (
        <AppShell>
            <Head title="Video Studio" />
            <Page>
                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Personal Branding</div>
                    <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontStyle: 'italic', fontWeight: 400, margin: '0 0 10px', color: 'var(--ink)' }}>Video Studio</h1>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                        Generate a complete video script — hook, sections, chapters, description — then edit with AI tools below.
                    </p>
                </div>

                {/* Generator */}
                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 40, alignItems: 'flex-start', marginBottom: 72 }}>

                    {/* Left — form */}
                    <div className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Script generator</div>

                        {/* Topic */}
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic</label>
                            <textarea style={{ ...FIELD, resize: 'none' }} rows={3} value={form.topic} onChange={e => set('topic', e.target.value)}
                                placeholder="e.g. How I debugged a memory leak in production, 5 Git commands I use every day, Why I stopped using ORMs" />
                        </div>

                        {/* Video type */}
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {(Object.keys(TYPE_LABELS) as VideoType[]).map(t => (
                                    <button key={t} onClick={() => set('video_type', t)}
                                        className={form.video_type === t ? 'btn' : 'btn btn-ghost'}
                                        style={{ fontSize: 11.5, padding: '7px 10px' }}>
                                        {TYPE_LABELS[t]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Platform */}
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {(Object.keys(PLATFORM_LABELS) as VideoPlatform[]).map(p => (
                                    <button key={p} onClick={() => set('platform', p)}
                                        className={form.platform === p ? 'btn' : 'btn btn-ghost'}
                                        style={{ fontSize: 11, padding: '7px 10px', flex: 1 }}>
                                        {PLATFORM_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration — hidden for shorts */}
                        {!isShorts && (
                            <div>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(Object.keys(DURATION_LABELS) as VideoDuration[]).map(d => (
                                        <button key={d} onClick={() => set('duration', d)}
                                            className={form.duration === d ? 'btn' : 'btn btn-ghost'}
                                            style={{ fontSize: 11, padding: '7px 10px', flex: 1 }}>
                                            {DURATION_LABELS[d]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tone */}
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tone</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(Object.entries(TONE_LABELS) as [VideoTone, { label: string; desc: string }][]).map(([key, meta]) => (
                                    <button key={key} onClick={() => set('tone', key)}
                                        style={{
                                            textAlign: 'left', padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                            border: form.tone === key ? '1.5px solid var(--ink)' : '0.5px solid var(--hairline)',
                                            background: form.tone === key ? 'var(--paper-2)' : 'var(--paper)',
                                            transition: 'border-color 0.15s',
                                        }}>
                                        <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, fontWeight: form.tone === key ? 500 : 400, color: 'var(--ink)', marginBottom: 2 }}>{meta.label}</div>
                                        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-4)' }}>{meta.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={generate} disabled={!form.topic.trim() || status === 'loading'}
                            className="btn" style={{ width: '100%', justifyContent: 'center', opacity: (!form.topic.trim() || status === 'loading') ? 0.5 : 1 }}>
                            {status === 'loading' ? 'Writing script…' : <>Generate script <Ico.arrow /></>}
                        </button>
                    </div>

                    {/* Right — result */}
                    <div>
                        {status === 'idle' && (
                            <div className="card" style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
                                <div style={{ fontSize: 36 }}>🎬</div>
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)', margin: 0, textAlign: 'center' }}>Your script will appear here.</p>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-4)', margin: 0, textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
                                    Fill in the form and hit Generate. You'll get a hook, full script, chapters, and description ready to record.
                                </p>
                            </div>
                        )}
                        {status === 'loading' && (
                            <div className="card" style={{ padding: '48px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-4)', margin: 0 }}>Writing your script…</p>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="card" style={{ padding: '32px 28px' }}>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--signal)', margin: '0 0 12px' }}>Generation failed. Please try again.</p>
                                <button onClick={generate} className="btn btn-ghost" style={{ fontSize: 12 }}>Retry</button>
                            </div>
                        )}
                        {status === 'done' && content && (
                            <div className="card" style={{ padding: '28px 32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 8 }}>
                                    {savedId && <span className="label-mono" style={{ fontSize: 10, color: 'var(--progress)', alignSelf: 'center' }}>✓ Saved</span>}
                                    <button onClick={generate} className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}>Regenerate</button>
                                </div>
                                <ScriptResult content={content} form={form} onSave={saveDraft} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Saved scripts */}
                {scripts.length > 0 && (
                    <section style={{ marginBottom: 72 }}>
                        <SectionHeader label="Saved scripts" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                            {scripts.map((s) => (
                                <div key={s.id} className="card" style={{ padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <span className="chip" style={{ fontSize: 10 }}>{s.video_type}</span>
                                        <span className="chip" style={{ fontSize: 10 }}>{s.platform}</span>
                                        <span
                                            style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 500, color: s.status === 'ready' ? 'var(--progress)' : 'var(--ink-4)', cursor: 'pointer', textDecoration: 'underline dotted', marginLeft: 'auto' }}
                                            onClick={() => markReady(s.id, s.status)}>
                                            {s.status === 'ready' ? '✓ ready' : 'draft'}
                                        </span>
                                    </div>
                                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.4, color: 'var(--ink)', margin: '0 0 10px' }}>{s.topic}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-4)' }}>{s.created_at}</span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link href={`/video/${s.id}`} style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>Open</Link>
                                            <button onClick={() => router.delete(`/video/${s.id}`, { preserveScroll: true })}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--signal)', padding: 0 }}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* AI Tools Guide */}
                <section>
                    <SectionHeader label="AI video tools guide" />
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', margin: '0 0 32px', lineHeight: 1.6 }}>
                        The best free and paid AI tools for creating, editing, and repurposing video content — with quick tips on how to actually use them.
                    </p>

                    {TOOLS.map((group) => (
                        <div key={group.category} style={{ marginBottom: 40 }}>
                            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                                {group.category}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                                {group.items.map((tool) => <ToolCard key={tool.name} tool={tool} />)}
                            </div>
                        </div>
                    ))}

                    {/* Workflow tips */}
                    <div style={{ marginTop: 8 }}>
                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                            Recommended workflows
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                            {WORKFLOWS.map((w) => (
                                <div key={w.scenario} className="card" style={{ padding: '20px 22px', borderLeft: '3px solid var(--signal)' }}>
                                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, fontWeight: 500, margin: '0 0 14px', color: 'var(--ink)' }}>{w.scenario}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {w.stack.map((step, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--signal)', fontWeight: 600, paddingTop: 2, flexShrink: 0 }}>{i + 1}</span>
                                                <span style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </Page>
        </AppShell>
    );
}

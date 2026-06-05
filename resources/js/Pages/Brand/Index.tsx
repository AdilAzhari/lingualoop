import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import { Ico } from '@/Components/Common/icons';
import type { BrandIndexProps, BrandPostType, BrandPostTone } from '@/lib/types';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

// ── Types ────────────────────────────────────────────────────────────────────

type PostContent    = { hooks: string[]; body: string; cta: string; hashtags: string[] };
type ArticleContent = { title: string; intro: string; sections: { heading: string; content: string }[]; conclusion: string; key_takeaways: string[]; hashtags: string[] };
type CarouselContent = { cover: { headline: string; subheadline: string }; slides: { number: number; heading: string; bullets: string[] }[]; cta_slide: { heading: string; action: string }; hashtags: string[] };
type AnyContent = PostContent | ArticleContent | CarouselContent;
type GenStatus = 'idle' | 'loading' | 'done' | 'error';

// ── Helpers ──────────────────────────────────────────────────────────────────

const FIELD: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--serif)', fontSize: 14,
    padding: '9px 12px', borderRadius: 6, border: '0.5px solid var(--hairline)',
    background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
};

const TYPE_LABELS: Record<BrandPostType, string> = {
    post: '📝 Post',
    article: '📄 Article',
    carousel: '🎠 Carousel',
};

const TONE_LABELS: Record<BrandPostTone, { label: string; desc: string }> = {
    'thought-leader': { label: 'Thought leader', desc: 'Bold, opinionated, takes a clear stance' },
    'educator':       { label: 'Educator',       desc: 'Clear, practical, step-by-step' },
    'storyteller':    { label: 'Storyteller',    desc: 'Narrative-driven, personal, relatable' },
};

function copyText(text: string, onDone: () => void) {
    navigator.clipboard.writeText(text).then(onDone);
}

function Hashtags({ tags }: { tags: string[] }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {tags.map((t) => (
                <span key={t} className="chip" style={{ fontSize: 11, color: 'var(--ink-3)' }}>#{t}</span>
            ))}
        </div>
    );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => copyText(text, () => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '6px 14px' }}
        >
            {copied ? '✓ Copied' : label}
        </button>
    );
}

// ── Post result ──────────────────────────────────────────────────────────────

function PostResult({ content, onSave }: { content: PostContent; onSave: () => void }) {
    const [hook, setHook] = useState(0);
    const fullText = `${content.hooks[hook]}\n\n${content.body}\n\n${content.cta}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Hook chooser */}
            <div>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Opening hook — pick one
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {content.hooks.map((h, i) => (
                        <button
                            key={i}
                            onClick={() => setHook(i)}
                            style={{
                                textAlign: 'left', padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                border: hook === i ? '1.5px solid var(--ink)' : '0.5px solid var(--hairline)',
                                background: hook === i ? 'var(--paper-2)' : 'var(--paper)',
                                fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)',
                                transition: 'border-color 0.15s',
                            }}
                        >
                            {h}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Body
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
                    {content.body}
                </div>
            </div>

            {/* CTA */}
            <div style={{ padding: '12px 16px', background: 'var(--paper-2)', borderRadius: 8 }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CTA</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, fontStyle: 'italic' }}>{content.cta}</p>
            </div>

            <Hashtags tags={content.hashtags} />

            <div style={{ display: 'flex', gap: 10 }}>
                <CopyButton text={fullText} label="Copy full post" />
                <button onClick={onSave} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Save draft</button>
            </div>
        </div>
    );
}

// ── Article result ───────────────────────────────────────────────────────────

function ArticleResult({ content, onSave }: { content: ArticleContent; onSave: () => void }) {
    const fullText = [
        content.title,
        '',
        content.intro,
        '',
        ...content.sections.flatMap(s => [s.heading, s.content, '']),
        content.conclusion,
        '',
        'Key takeaways:',
        ...content.key_takeaways.map((t, i) => `${i + 1}. ${t}`),
        '',
        content.hashtags.map(h => `#${h}`).join(' '),
    ].join('\n');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontStyle: 'italic', fontWeight: 500, margin: 0, color: 'var(--ink)', lineHeight: 1.3 }}>
                {content.title}
            </h2>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0 }}>{content.intro}</p>

            {content.sections.map((s, i) => (
                <div key={i}>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: 'var(--ink)' }}>{s.heading}</h3>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0 }}>{s.content}</p>
                </div>
            ))}

            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--ink-2)', margin: 0 }}>{content.conclusion}</p>

            <div style={{ padding: '16px 20px', background: 'var(--paper-2)', borderRadius: 8 }}>
                <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key takeaways</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {content.key_takeaways.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--signal)', fontWeight: 600, paddingTop: 2, flexShrink: 0 }}>{i + 1}</span>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>{t}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Hashtags tags={content.hashtags} />
            <div style={{ display: 'flex', gap: 10 }}>
                <CopyButton text={fullText} label="Copy full article" />
                <button onClick={onSave} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Save draft</button>
            </div>
        </div>
    );
}

// ── Carousel result ──────────────────────────────────────────────────────────

function CarouselResult({ content, onSave }: { content: CarouselContent; onSave: () => void }) {
    const fullText = [
        `[Slide 1] ${content.cover.headline}`,
        content.cover.subheadline,
        '',
        ...content.slides.flatMap(s => [`[Slide ${s.number}] ${s.heading}`, ...s.bullets.map(b => `• ${b}`), '']),
        `[CTA] ${content.cta_slide.heading}`,
        content.cta_slide.action,
        '',
        content.hashtags.map(h => `#${h}`).join(' '),
    ].join('\n');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Cover */}
            <div style={{ padding: '20px 24px', background: 'var(--ink)', borderRadius: 10, color: 'var(--paper)', textAlign: 'center' }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>SLIDE 1 · COVER</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', fontWeight: 500, margin: '0 0 6px', lineHeight: 1.3 }}>{content.cover.headline}</p>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{content.cover.subheadline}</p>
            </div>

            {/* Content slides */}
            {content.slides.map((s) => (
                <div key={s.number} style={{ padding: '16px 20px', border: '0.5px solid var(--hairline)', borderRadius: 10, background: 'var(--paper)' }}>
                    <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 8 }}>SLIDE {s.number}</div>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 600, margin: '0 0 10px', color: 'var(--ink)' }}>{s.heading}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {s.bullets.map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--signal)', fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>•</span>
                                <span style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{b}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* CTA slide */}
            <div style={{ padding: '16px 20px', border: '0.5px solid oklch(0.85 0.06 145)', borderRadius: 10, background: 'var(--progress-wash)' }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--progress)', marginBottom: 8 }}>CTA SLIDE</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)' }}>{content.cta_slide.heading}</p>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>{content.cta_slide.action}</p>
            </div>

            <Hashtags tags={content.hashtags} />
            <div style={{ display: 'flex', gap: 10 }}>
                <CopyButton text={fullText} label="Copy all slides" />
                <button onClick={onSave} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Save draft</button>
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function BrandIndex({ drafts, loaded_post }: BrandIndexProps) {
    const [form, setForm] = useState({
        topic:   loaded_post?.topic   ?? '',
        type:    (loaded_post?.type   ?? 'post') as BrandPostType,
        tone:    (loaded_post?.tone   ?? 'thought-leader') as BrandPostTone,
        context: loaded_post?.context ?? '',
    });
    const [status, setStatus]   = useState<GenStatus>(loaded_post ? 'done' : 'idle');
    const [content, setContent] = useState<AnyContent | null>(
        loaded_post ? loaded_post.content as AnyContent : null
    );
    const [savedId, setSavedId] = useState<number | null>(loaded_post?.id ?? null);
    const [saving, setSaving]   = useState(false);

    function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

    async function generate() {
        setStatus('loading');
        setContent(null);
        setSavedId(null);
        try {
            const res = await fetch('/brand/generate', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error);
            setContent(data.content as AnyContent);
            setStatus('done');
        } catch {
            setStatus('error');
        }
    }

    async function saveDraft() {
        if (!content || saving) return;
        setSaving(true);
        try {
            const res = await fetch('/brand', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, content }),
            });
            const data = await res.json();
            setSavedId(data.id);
            router.reload({ only: ['drafts'] });
        } catch {}
        setSaving(false);
    }

    async function markReady(id: number, current: string) {
        await fetch(`/brand/${id}/status`, {
            method: 'PUT',
            headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: current === 'ready' ? 'draft' : 'ready' }),
        });
        router.reload({ only: ['drafts'] });
    }

    function deleteDraft(id: number) {
        router.delete(`/brand/${id}`, { preserveScroll: true });
    }

    return (
        <AppShell>
            <Head title="Brand Studio" />
            <Page>
                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        Personal Branding
                    </div>
                    <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontStyle: 'italic', fontWeight: 400, margin: '0 0 10px', color: 'var(--ink)' }}>
                        Brand Studio
                    </h1>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                        Generate LinkedIn posts, long-form articles, and carousel content — tailored to your tone.
                    </p>
                </div>

                {/* Generator */}
                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 40, alignItems: 'flex-start' }}>

                    {/* Left — form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="card" style={{ padding: '28px 28px' }}>
                            <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Generate content
                            </div>

                            {/* Topic */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Topic / idea
                                </label>
                                <textarea
                                    style={{ ...FIELD, resize: 'none' }} rows={3}
                                    value={form.topic}
                                    onChange={e => set('topic', e.target.value)}
                                    placeholder="e.g. Why I stopped writing unit tests for every function, What I learned from my first system design interview, 5 things I wish I knew about distributed systems"
                                />
                            </div>

                            {/* Format */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Format
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['post', 'article', 'carousel'] as BrandPostType[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => set('type', t)}
                                            className={form.type === t ? 'btn' : 'btn btn-ghost'}
                                            style={{ fontSize: 12, padding: '7px 14px', flex: 1 }}
                                        >
                                            {TYPE_LABELS[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Tone
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {(Object.entries(TONE_LABELS) as [BrandPostTone, { label: string; desc: string }][]).map(([key, meta]) => (
                                        <button
                                            key={key}
                                            onClick={() => set('tone', key)}
                                            style={{
                                                textAlign: 'left', padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                                border: form.tone === key ? '1.5px solid var(--ink)' : '0.5px solid var(--hairline)',
                                                background: form.tone === key ? 'var(--paper-2)' : 'var(--paper)',
                                                transition: 'border-color 0.15s',
                                            }}
                                        >
                                            <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, fontWeight: form.tone === key ? 500 : 400, color: 'var(--ink)', marginBottom: 2 }}>
                                                {meta.label}
                                            </div>
                                            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-4)' }}>
                                                {meta.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Context */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Extra context <span style={{ opacity: 0.5 }}>(optional)</span>
                                </label>
                                <input
                                    style={FIELD}
                                    value={form.context}
                                    onChange={e => set('context', e.target.value)}
                                    placeholder="e.g. for mid-level engineers, based on a recent project"
                                />
                            </div>

                            <button
                                onClick={generate}
                                disabled={!form.topic.trim() || status === 'loading'}
                                className="btn"
                                style={{ width: '100%', justifyContent: 'center', opacity: (!form.topic.trim() || status === 'loading') ? 0.5 : 1 }}
                            >
                                {status === 'loading' ? 'Generating…' : <>Generate {TYPE_LABELS[form.type]} <Ico.arrow /></>}
                            </button>
                        </div>
                    </div>

                    {/* Right — result */}
                    <div>
                        {status === 'idle' && (
                            <div className="card" style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12 }}>
                                <div style={{ fontSize: 32 }}>✦</div>
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)', margin: 0, textAlign: 'center' }}>
                                    Enter a topic and hit Generate.
                                </p>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-4)', margin: 0, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
                                    The AI will write a complete {form.type} ready to copy into LinkedIn.
                                </p>
                            </div>
                        )}

                        {status === 'loading' && (
                            <div className="card" style={{ padding: '40px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-4)', margin: 0 }}>
                                    Writing your {form.type}…
                                </p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="card" style={{ padding: '32px 28px' }}>
                                <p style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--signal)', margin: '0 0 12px' }}>
                                    Generation failed. Please try again.
                                </p>
                                <button onClick={generate} className="btn btn-ghost" style={{ fontSize: 12 }}>Retry</button>
                            </div>
                        )}

                        {status === 'done' && content && (
                            <div className="card" style={{ padding: '28px 32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <div>
                                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                                            {TYPE_LABELS[form.type]} · {TONE_LABELS[form.tone].label}
                                        </div>
                                        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
                                            {form.topic}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {savedId && (
                                            <span className="label-mono" style={{ fontSize: 10, color: 'var(--progress)' }}>✓ Saved</span>
                                        )}
                                        <button onClick={generate} className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}>
                                            Regenerate
                                        </button>
                                    </div>
                                </div>

                                {form.type === 'post' && (
                                    <PostResult content={content as PostContent} onSave={saveDraft} />
                                )}
                                {form.type === 'article' && (
                                    <ArticleResult content={content as ArticleContent} onSave={saveDraft} />
                                )}
                                {form.type === 'carousel' && (
                                    <CarouselResult content={content as CarouselContent} onSave={saveDraft} />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Drafts */}
                {drafts.length > 0 && (
                    <section style={{ marginTop: 64 }}>
                        <SectionHeader label="Saved drafts" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                            {drafts.map((d) => (
                                <div key={d.id} className="card" style={{ padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <span className="chip" style={{ fontSize: 10 }}>{d.type}</span>
                                            <span className="chip" style={{ fontSize: 10 }}>{d.tone.replace('-', ' ')}</span>
                                        </div>
                                        <span
                                            style={{
                                                fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 500,
                                                color: d.status === 'ready' ? 'var(--progress)' : 'var(--ink-4)',
                                                cursor: 'pointer', textDecoration: 'underline dotted',
                                            }}
                                            onClick={() => markReady(d.id, d.status)}
                                            title="Toggle ready status"
                                        >
                                            {d.status === 'ready' ? '✓ ready' : 'draft'}
                                        </span>
                                    </div>
                                    <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.45, color: 'var(--ink)', margin: '0 0 12px' }}>
                                        {d.topic}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-4)' }}>
                                            {d.created_at}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link href={`/brand/${d.id}`} style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>
                                                Open
                                            </Link>
                                            <button
                                                onClick={() => deleteDraft(d.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--signal)', padding: 0 }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </Page>
        </AppShell>
    );
}

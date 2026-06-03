import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import { Ico } from '@/Components/Common/icons';
import type { SeIndexProps, SePromptSummary } from '@/lib/types';

const DIFFICULTY_ORDER = ['junior', 'mid', 'senior', 'staff'];

const DIFFICULTY_COLOR: Record<string, string> = {
    junior: 'var(--progress)',
    mid:    'oklch(0.45 0.14 60)',
    senior: 'var(--signal)',
    staff:  'oklch(0.35 0.18 280)',
};

function ScorePip({ label, score }: { label: string; score: number | null }) {
    if (score === null) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--ink-4)', fontStyle: 'italic' }}>—</div>
            </div>
        );
    }
    const color = score >= 80 ? 'var(--progress)' : score >= 60 ? 'oklch(0.45 0.14 60)' : 'var(--signal)';
    return (
        <div style={{ textAlign: 'center' }}>
            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 3 }}>{label}</div>
            <div className="num" style={{ fontSize: 18, color }}>{score}</div>
        </div>
    );
}

function PromptCard({ prompt }: { prompt: SePromptSummary }) {
    const diffColor = DIFFICULTY_COLOR[prompt.difficulty] ?? 'var(--ink-3)';
    const showBoth  = prompt.mode === 'both';

    return (
        <Link href={`/software/${prompt.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
                padding: '20px 24px', display: 'flex',
                alignItems: 'flex-start', justifyContent: 'space-between',
                gap: 16, transition: 'box-shadow .15s',
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="chip" style={{ fontSize: 9.5 }}>
                            {prompt.category.replace(/-/g, ' ')}
                        </span>
                        <span style={{
                            fontFamily: 'var(--mono, monospace)', fontSize: 9.5,
                            color: diffColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            {prompt.difficulty}
                        </span>
                        {prompt.mode !== 'both' && (
                            <span className="chip" style={{ fontSize: 9, background: 'var(--paper-2)', color: 'var(--ink-3)' }}>
                                {prompt.mode} only
                            </span>
                        )}
                    </div>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink)', margin: 0 }}>
                        {prompt.title}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                    {showBoth ? (
                        <>
                            <ScorePip label="writing"  score={prompt.best_writing} />
                            <ScorePip label="speaking" score={prompt.best_speaking} />
                        </>
                    ) : prompt.mode === 'writing' ? (
                        <ScorePip label="writing"  score={prompt.best_writing} />
                    ) : (
                        <ScorePip label="speaking" score={prompt.best_speaking} />
                    )}
                    <Ico.arrow style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                </div>
            </div>
        </Link>
    );
}

const FIELD: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--serif)', fontSize: 14,
    padding: '9px 12px', borderRadius: 6, border: '0.5px solid var(--hairline)',
    background: 'var(--paper)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
};

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

function CreateForm({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
        title: '', category: 'system-design', difficulty: 'mid',
        description: '', context: '', key_concepts: '', framework_hints: '',
        mode: 'both', target_words: '300', target_seconds: '180',
    });
    const [saving, setSaving]       = useState(false);
    const [suggesting, setSuggesting] = useState(false);

    function set(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }

    async function suggest() {
        setSuggesting(true);
        try {
            const res = await fetch('/software/ai-suggest', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json' },
            });
            const data = await res.json();
            const s = data.suggestion;
            if (s) {
                setForm(f => ({
                    ...f,
                    title:           s.title         ?? f.title,
                    category:        s.category       ?? f.category,
                    difficulty:      s.difficulty     ?? f.difficulty,
                    description:     s.description    ?? f.description,
                    context:         s.context        ?? f.context,
                    key_concepts:    Array.isArray(s.key_concepts)    ? s.key_concepts.join('\n')    : f.key_concepts,
                    framework_hints: Array.isArray(s.framework_hints) ? s.framework_hints.join('\n') : f.framework_hints,
                    mode:            s.mode           ?? f.mode,
                }));
            }
        } catch {}
        setSuggesting(false);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post('/software', form, { onError: () => setSaving(false) });
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'oklch(0.1 0.01 60 / 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
        }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: '36px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <div>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            New topic
                        </div>
                        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic', fontWeight: 400, margin: 0, color: 'var(--ink)' }}>
                            Create a practice prompt
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={suggest}
                            disabled={suggesting}
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '6px 14px', opacity: suggesting ? 0.6 : 1 }}
                        >
                            {suggesting ? 'Thinking…' : '✦ Suggest with AI'}
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
                    </div>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Title
                        </label>
                        <input style={FIELD} value={form.title} onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Design a distributed rate limiter" required />
                    </div>

                    {/* Category + Difficulty */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category
                            </label>
                            <select style={{ ...FIELD }} value={form.category} onChange={e => set('category', e.target.value)}>
                                <option value="system-design">System design</option>
                                <option value="architecture">Architecture</option>
                                <option value="use-cases">Use cases</option>
                                <option value="real-world">Real-world</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Difficulty
                            </label>
                            <select style={{ ...FIELD }} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                                <option value="junior">Junior</option>
                                <option value="mid">Mid</option>
                                <option value="senior">Senior</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Question / Scenario
                        </label>
                        <textarea style={{ ...FIELD, resize: 'vertical' }} rows={4}
                            value={form.description} onChange={e => set('description', e.target.value)}
                            placeholder="Write the full question or scenario here..." required />
                    </div>

                    {/* Context (optional) */}
                    <div>
                        <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Constraints / Context <span style={{ opacity: 0.5 }}>(optional)</span>
                        </label>
                        <textarea style={{ ...FIELD, resize: 'vertical' }} rows={2}
                            value={form.context} onChange={e => set('context', e.target.value)}
                            placeholder="e.g. 100M daily active users, 10ms p99 latency requirement" />
                    </div>

                    {/* Key concepts */}
                    <div>
                        <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Key concepts to cover <span style={{ opacity: 0.5 }}>(one per line)</span>
                        </label>
                        <textarea style={{ ...FIELD, resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 12 }} rows={4}
                            value={form.key_concepts} onChange={e => set('key_concepts', e.target.value)}
                            placeholder={"Consistent hashing for sharding\nToken bucket rate limiting\nRedis for distributed state\nCAP theorem trade-offs"} required />
                    </div>

                    {/* Framework hints (optional) */}
                    <div>
                        <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Framework hints <span style={{ opacity: 0.5 }}>(optional — one per line)</span>
                        </label>
                        <textarea style={{ ...FIELD, resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 12 }} rows={3}
                            value={form.framework_hints} onChange={e => set('framework_hints', e.target.value)}
                            placeholder={"Think about: scalability, reliability, cost\nConsider: CAP theorem\nAddress: read vs write ratios"} />
                    </div>

                    {/* Mode + targets */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Mode
                            </label>
                            <select style={{ ...FIELD }} value={form.mode} onChange={e => set('mode', e.target.value)}>
                                <option value="both">Write + Speak</option>
                                <option value="writing">Writing only</option>
                                <option value="speaking">Speaking only</option>
                            </select>
                        </div>
                        {(form.mode === 'writing' || form.mode === 'both') && (
                            <div>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Target words
                                </label>
                                <input style={FIELD} type="number" min={50} max={2000}
                                    value={form.target_words} onChange={e => set('target_words', e.target.value)} />
                            </div>
                        )}
                        {(form.mode === 'speaking' || form.mode === 'both') && (
                            <div>
                                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Target seconds
                                </label>
                                <input style={FIELD} type="number" min={30} max={600}
                                    value={form.target_seconds} onChange={e => set('target_seconds', e.target.value)} />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '0.5px solid var(--hairline)' }}>
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={saving} className="btn">
                            {saving ? 'Creating…' : <>Create topic <Ico.arrow /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SeIndex({ prompts, categories }: SeIndexProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showCreate, setShowCreate]         = useState(false);

    const filtered = activeCategory
        ? prompts.filter((p) => p.category === activeCategory)
        : prompts;

    const byDifficulty = DIFFICULTY_ORDER.reduce<Record<string, SePromptSummary[]>>((acc, d) => {
        const group = filtered.filter((p) => p.difficulty === d);
        if (group.length) acc[d] = group;
        return acc;
    }, {});

    return (
        <AppShell>
            <Head title="SE Practice" />
            {showCreate && <CreateForm onClose={() => setShowCreate(false)} />}
            <Page>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <PageHeader
                        eyebrow="Software Engineering"
                        title="Design practice"
                        italic="system design, architecture & more"
                        lead="Write or talk through real-world SE challenges. Get AI feedback on your technical depth, clarity, and trade-off reasoning."
                    />
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 4 }}>
                        <button onClick={() => setShowCreate(true)} className="btn">
                            + New topic
                        </button>
                        <Link href="/software/flashcards" className="btn btn-ghost">
                            Flashcards <Ico.arrow />
                        </Link>
                    </div>
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={activeCategory === null ? 'btn' : 'btn btn-ghost'}
                        style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                            className={activeCategory === cat ? 'btn' : 'btn btn-ghost'}
                            style={{ fontSize: 12, padding: '6px 14px' }}
                        >
                            {cat.replace(/-/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* Prompts grouped by difficulty */}
                {Object.entries(byDifficulty).map(([difficulty, items]) => (
                    <section key={difficulty} style={{ marginBottom: 40 }}>
                        <div className="label-mono" style={{
                            fontSize: 9.5, color: DIFFICULTY_COLOR[difficulty] ?? 'var(--ink-4)',
                            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                        }}>
                            {difficulty}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map((p) => <PromptCard key={p.id} prompt={p} />)}
                        </div>
                    </section>
                ))}

                {filtered.length === 0 && (
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 15 }}>
                        No prompts in this category yet.
                    </p>
                )}
            </Page>
        </AppShell>
    );
}

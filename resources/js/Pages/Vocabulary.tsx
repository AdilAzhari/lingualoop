import { useState, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Marginalia from '@/Components/Typography/Marginalia';
import { Ico } from '@/Components/Common/icons';
import type { VocabularyEntry } from '@/lib/types';

type Props = { entries: VocabularyEntry[] };
type SortKey = 'newest' | 'alpha' | 'due';

const LEVELS = ['a2', 'b1', 'b2', 'c1', 'c2'] as const;
type Level = typeof LEVELS[number];
const LEVEL_LABEL: Record<string, string> = { a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2' };

function srsBadge(entry: VocabularyEntry): { label: string; color: string; bg: string } | null {
    if (!entry.srs_due_at) return null;
    const diffDays = Math.ceil((new Date(entry.srs_due_at).getTime() - Date.now()) / 86_400_000);
    if (diffDays <= 0)  return { label: 'due',      color: 'oklch(0.5 0.16 60)',  bg: 'oklch(0.97 0.07 70)' };
    if (diffDays === 1) return { label: 'tomorrow', color: 'var(--ink-3)',         bg: 'var(--paper-3)' };
    return              { label: `in ${diffDays}d`, color: 'var(--ink-4)',         bg: 'var(--paper-3)' };
}

function Highlight({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark style={{ background: 'var(--signal-wash)', color: 'var(--signal)', borderRadius: 2, padding: 0 }}>
                {text.slice(idx, idx + q.length)}
            </mark>
            {text.slice(idx + q.length)}
        </>
    );
}

export default function Vocabulary({ entries }: Props) {
    const [adding, setAdding] = useState(false);
    const [query, setQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<Level | null>(null);
    const [sort, setSort] = useState<SortKey>('newest');
    const [fetchingDef, setFetchingDef] = useState(false);
    const [fetchingSuggest, setFetchingSuggest] = useState(false);

    // Export
    const [exported, setExported] = useState(false);
    function exportToClipboard() {
        const lines = [
            `vocabulary notebook — ${entries.length} word${entries.length !== 1 ? 's' : ''}`,
            `exported ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            '',
        ];
        entries.forEach(e => {
            lines.push(`${e.word}${e.level ? ` [${e.level.toUpperCase()}]` : ''}`);
            if (e.definition) lines.push(`  ${e.definition}`);
            if (e.example) lines.push(`  "${e.example}"`);
            lines.push('');
        });
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            setExported(true);
            setTimeout(() => setExported(false), 2000);
        });
    }

    // Inline editing state
    const [editId, setEditId] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState({ definition: '', example: '', level: '' });
    const [saving, setSaving] = useState(false);

    const form = useForm({ word: '', definition: '', example: '', level: '' });

    async function handleWordBlur() {
        const word = form.data.word.trim();
        if (!word) return;

        const needsDef     = !form.data.definition;
        const needsExample = !form.data.example;
        const needsLevel   = !form.data.level;

        const tasks: Promise<void>[] = [];

        if (needsDef) {
            setFetchingDef(true);
            tasks.push(
                fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        const def = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition as string | undefined;
                        if (def && !form.data.definition) form.setData('definition', def);
                    })
                    .catch(() => {})
                    .finally(() => setFetchingDef(false))
            );
        }

        if (needsExample || needsLevel) {
            setFetchingSuggest(true);
            tasks.push(
                fetch('/vocabulary/suggest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    },
                    body: JSON.stringify({ word }),
                })
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        if (!data) return;
                        if (needsExample && data.example && !form.data.example) form.setData('example', data.example);
                        if (needsLevel  && data.level  && !form.data.level)   form.setData('level',   data.level);
                    })
                    .catch(() => {})
                    .finally(() => setFetchingSuggest(false))
            );
        }

        await Promise.all(tasks);
    }

    function startEdit(e: VocabularyEntry) {
        setEditId(e.id);
        setEditDraft({ definition: e.definition ?? '', example: e.example ?? '', level: e.level ?? '' });
    }

    function cancelEdit() {
        setEditId(null);
        setSaving(false);
    }

    function saveEdit() {
        if (!editId) return;
        setSaving(true);
        router.put(`/vocabulary/${editId}`, editDraft, {
            preserveScroll: true,
            onSuccess: () => { setEditId(null); setSaving(false); },
            onError: () => setSaving(false),
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/vocabulary', {
            onSuccess: () => { form.reset(); setAdding(false); },
        });
    }

    function remove(id: number) {
        router.delete(`/vocabulary/${id}`, { preserveScroll: true });
    }

    const stats = useMemo(() => {
        const byLevel: Partial<Record<string, number>> = {};
        let srsNew = 0, srsLearning = 0, srsReview = 0, srsDue = 0;
        for (const e of entries) {
            if (e.level) byLevel[e.level] = (byLevel[e.level] ?? 0) + 1;
            if (!e.srs_state || e.srs_state === 'new') srsNew++;
            else if (e.srs_state === 'learning') srsLearning++;
            else srsReview++;
            if (e.srs_due_at && new Date(e.srs_due_at) <= new Date()) srsDue++;
        }
        return { byLevel, srsNew, srsLearning, srsReview, srsDue };
    }, [entries]);

    const filtered = useMemo(() => {
        let list = [...entries];
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(e =>
                e.word.toLowerCase().includes(q) ||
                e.definition?.toLowerCase().includes(q) ||
                e.example?.toLowerCase().includes(q)
            );
        }
        if (levelFilter) list = list.filter(e => e.level === levelFilter);
        if (sort === 'alpha') list.sort((a, b) => a.word.localeCompare(b.word));
        else if (sort === 'due') {
            list.sort((a, b) => {
                if (!a.srs_due_at && !b.srs_due_at) return 0;
                if (!a.srs_due_at) return 1;
                if (!b.srs_due_at) return -1;
                return new Date(a.srs_due_at).getTime() - new Date(b.srs_due_at).getTime();
            });
        }
        return list;
    }, [entries, query, levelFilter, sort]);

    const dueCount = stats.srsDue;

    return (
        <AppShell>
            <Head title="Vocabulary notebook" />
            <Page>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 0 }}>
                    <PageHeader
                        eyebrow="Your vocabulary notebook"
                        title="Words worth keeping"
                        italic="collected from your writing"
                        lead="Every word you save here gets woven into your next writing prompt so you practice it in context — not in isolation."
                    />
                    <Link href="/vocabulary/review" className="btn" style={{ fontSize: 13, flexShrink: 0, marginBottom: 32, alignSelf: 'flex-end' }}>
                        {dueCount > 0 ? `Review ${dueCount} due` : 'Review words'} <Ico.arrow />
                    </Link>
                </div>

                {/* Add word form */}
                <div className="card" style={{ padding: 24, marginBottom: entries.length > 0 ? 20 : 40 }}>
                    {!adding ? (
                        <button onClick={() => setAdding(true)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                            + Add a word
                        </button>
                    ) : (
                        <form onSubmit={submit}>
                            <SectionHeader label="New entry" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px', gap: 20, marginBottom: 16 }}>
                                <div>
                                    <label style={labelStyle}>Word or phrase</label>
                                    <input
                                        value={form.data.word}
                                        onChange={e => form.setData('word', e.target.value)}
                                        onBlur={handleWordBlur}
                                        placeholder="e.g. tenacious"
                                        autoFocus
                                        style={inputStyle}
                                    />
                                    {form.errors.word && <p style={errStyle}>{form.errors.word}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        Definition
                                        {fetchingDef && <span style={{ color: 'var(--ink-4)', fontSize: 11, marginLeft: 6 }}>looking up…</span>}
                                        {!fetchingDef && form.data.definition && <span style={{ color: 'var(--progress)', fontSize: 11, marginLeft: 6 }}>✓</span>}
                                    </label>
                                    <input
                                        value={form.data.definition}
                                        onChange={e => form.setData('definition', e.target.value)}
                                        placeholder="holding firm in the face of difficulty"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        Level
                                        {fetchingSuggest && !form.data.level && <span style={{ color: 'var(--ink-4)', fontSize: 11, marginLeft: 6 }}>detecting…</span>}
                                        {!fetchingSuggest && form.data.level && <span style={{ color: 'var(--progress)', fontSize: 11, marginLeft: 6 }}>✓</span>}
                                    </label>
                                    <select
                                        value={form.data.level}
                                        onChange={e => form.setData('level', e.target.value)}
                                        style={{ ...inputStyle, color: form.data.level ? 'var(--ink)' : 'var(--ink-4)' }}
                                    >
                                        <option value="">—</option>
                                        <option value="a2">A2</option>
                                        <option value="b1">B1</option>
                                        <option value="b2">B2</option>
                                        <option value="c1">C1</option>
                                        <option value="c2">C2</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>
                                    Example sentence
                                    {fetchingSuggest && !form.data.example && <span style={{ color: 'var(--ink-4)', fontSize: 11, marginLeft: 6 }}>generating…</span>}
                                    {!fetchingSuggest && form.data.example && <span style={{ color: 'var(--progress)', fontSize: 11, marginLeft: 6 }}>✓</span>}
                                </label>
                                <input
                                    value={form.data.example}
                                    onChange={e => form.setData('example', e.target.value)}
                                    placeholder="She was tenacious in her pursuit of the promotion."
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setAdding(false)} className="btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={form.processing || !form.data.word} className="btn">Save word</button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Stats bar */}
                {entries.length > 0 && (
                    <div style={{
                        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
                        padding: '12px 16px', marginBottom: 20,
                        background: 'var(--paper-2)', borderRadius: 'var(--r-1)',
                        border: '0.5px solid var(--hairline)',
                    }}>
                        <span className="num" style={{ fontSize: 15 }}>{entries.length}</span>
                        <Marginalia style={{ fontSize: 12 }}>words</Marginalia>

                        <span style={{ color: 'var(--hairline-2)', fontSize: 16 }}>·</span>

                        {/* Level distribution */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {LEVELS.filter(l => stats.byLevel[l]).map(l => (
                                <span key={l} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                                    <span style={{
                                        fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 600,
                                        color: (l === 'c1' || l === 'c2') ? 'var(--signal)' : 'var(--ink-3)',
                                    }}>
                                        {LEVEL_LABEL[l]}
                                    </span>
                                    <span className="num" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{stats.byLevel[l]}</span>
                                </span>
                            ))}
                            {!LEVELS.some(l => stats.byLevel[l]) && (
                                <Marginalia style={{ fontSize: 11 }}>no levels set</Marginalia>
                            )}
                        </div>

                        <span style={{ color: 'var(--hairline-2)', fontSize: 16 }}>·</span>

                        {/* SRS breakdown */}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {stats.srsDue > 0 && (
                                <span style={{ fontSize: 11, fontFamily: 'var(--serif)', color: 'oklch(0.5 0.16 60)' }}>
                                    <span className="num" style={{ fontSize: 13 }}>{stats.srsDue}</span> due
                                </span>
                            )}
                            {stats.srsLearning > 0 && (
                                <span style={{ fontSize: 11, fontFamily: 'var(--serif)', color: 'var(--ink-3)' }}>
                                    <span className="num" style={{ fontSize: 13 }}>{stats.srsLearning}</span> learning
                                </span>
                            )}
                            {stats.srsReview > 0 && (
                                <span style={{ fontSize: 11, fontFamily: 'var(--serif)', color: 'var(--progress)' }}>
                                    <span className="num" style={{ fontSize: 13 }}>{stats.srsReview}</span> mastered
                                </span>
                            )}
                            {stats.srsNew > 0 && (
                                <span style={{ fontSize: 11, fontFamily: 'var(--serif)', color: 'var(--ink-4)' }}>
                                    <span className="num" style={{ fontSize: 13 }}>{stats.srsNew}</span> new
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Search + filter bar */}
                {entries.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                        {/* Search */}
                        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
                            <span style={{
                                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--ink-4)', fontSize: 14, pointerEvents: 'none', lineHeight: 1,
                            }}>⌕</span>
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search words…"
                                style={{ ...inputStyle, paddingLeft: 28, fontSize: 13 }}
                            />
                        </div>

                        {/* Level filter pills */}
                        <div style={{ display: 'flex', gap: 5 }}>
                            {LEVELS.map(l => {
                                const active = levelFilter === l;
                                const isAdv = l === 'c1' || l === 'c2';
                                return (
                                    <button key={l} onClick={() => setLevelFilter(active ? null : l)} style={{
                                        fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
                                        padding: '4px 9px', borderRadius: 99, border: 'none', cursor: 'pointer',
                                        background: active ? (isAdv ? 'var(--signal)' : 'var(--ink)') : 'var(--paper-3)',
                                        color: active ? 'white' : 'var(--ink-3)',
                                        transition: 'background .12s, color .12s',
                                    }}>
                                        {LEVEL_LABEL[l]}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortKey)}
                            style={{ ...inputStyle, width: 'auto', fontSize: 12, padding: '6px 10px', color: 'var(--ink-3)', flexShrink: 0 }}
                        >
                            <option value="newest">Newest first</option>
                            <option value="alpha">A → Z</option>
                            <option value="due">Due first</option>
                        </select>

                        {(query || levelFilter) && (
                            <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>
                                {filtered.length} / {entries.length}
                            </span>
                        )}

                        {/* Export */}
                        <button
                            onClick={exportToClipboard}
                            className="btn btn-ghost"
                            style={{ fontSize: 11, padding: '5px 12px', marginLeft: 'auto', flexShrink: 0 }}
                        >
                            {exported ? 'Copied ✓' : 'Export'}
                        </button>
                    </div>
                )}

                {/* Entry list */}
                {entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <Marginalia style={{ fontSize: 16 }}>Your notebook is empty. Add your first word above.</Marginalia>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <Marginalia style={{ fontSize: 15 }}>No words match your search.</Marginalia>
                        <button onClick={() => { setQuery(''); setLevelFilter(null); }} className="btn btn-ghost" style={{ marginTop: 12, fontSize: 12 }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="col" style={{ gap: 0 }}>
                        {filtered.map((e, i) => {
                            const badge = srsBadge(e);
                            const isEditing = editId === e.id;

                            return (
                                <div
                                    key={e.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '180px 1fr auto',
                                        gap: 24, alignItems: 'flex-start',
                                        padding: '20px 8px',
                                        borderTop: i === 0 ? 'none' : '0.5px solid var(--hairline)',
                                        background: isEditing ? 'var(--paper-2)' : 'transparent',
                                        borderRadius: isEditing ? 8 : 0,
                                        transition: 'background .15s',
                                    }}
                                >
                                    {/* Column 1: word + meta badges */}
                                    <div>
                                        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic' }}>
                                            <Highlight text={e.word} query={query} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{e.created_at}</span>
                                            {isEditing ? (
                                                <select
                                                    value={editDraft.level}
                                                    onChange={ev => setEditDraft(d => ({ ...d, level: ev.target.value }))}
                                                    style={{ ...inputStyle, width: 72, fontSize: 11, padding: '2px 6px', color: editDraft.level ? 'var(--ink)' : 'var(--ink-4)' }}
                                                >
                                                    <option value="">level</option>
                                                    <option value="a2">A2</option>
                                                    <option value="b1">B1</option>
                                                    <option value="b2">B2</option>
                                                    <option value="c1">C1</option>
                                                    <option value="c2">C2</option>
                                                </select>
                                            ) : (
                                                <>
                                                    {e.level && (
                                                        <span style={{
                                                            fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 500,
                                                            color: (e.level === 'c1' || e.level === 'c2') ? 'var(--signal)' : 'var(--ink-3)',
                                                            background: (e.level === 'c1' || e.level === 'c2') ? 'var(--signal-wash)' : 'var(--paper-3)',
                                                            padding: '1px 6px', borderRadius: 99,
                                                        }}>
                                                            {e.level.toUpperCase()}
                                                        </span>
                                                    )}
                                                    {badge && (
                                                        <span style={{
                                                            fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 500,
                                                            color: badge.color, background: badge.bg,
                                                            padding: '1px 6px', borderRadius: 99,
                                                        }}>
                                                            {badge.label}
                                                        </span>
                                                    )}
                                                    {e.used_in_prompt && (
                                                        <span style={{
                                                            fontSize: 9, fontFamily: 'var(--serif)',
                                                            color: 'var(--progress)', background: 'var(--progress-wash)',
                                                            padding: '1px 6px', borderRadius: 99,
                                                        }}>
                                                            used in prompt
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: definition / example — editable when active */}
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <input
                                                value={editDraft.definition}
                                                onChange={ev => setEditDraft(d => ({ ...d, definition: ev.target.value }))}
                                                placeholder="Definition"
                                                autoFocus
                                                style={{ ...inputStyle, fontSize: 13 }}
                                            />
                                            <input
                                                value={editDraft.example}
                                                onChange={ev => setEditDraft(d => ({ ...d, example: ev.target.value }))}
                                                placeholder="Example sentence"
                                                style={{ ...inputStyle, fontSize: 13 }}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            {e.definition && (
                                                <Marginalia style={{ fontSize: 14, marginBottom: 4 }}>
                                                    <Highlight text={e.definition} query={query} />
                                                </Marginalia>
                                            )}
                                            {e.example && (
                                                <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic', color: 'var(--ink-3)' }}>
                                                    "<Highlight text={e.example} query={query} />"
                                                </p>
                                            )}
                                            {!e.definition && !e.example && (
                                                <Marginalia style={{ fontSize: 12, fontStyle: 'italic' }}>no definition yet</Marginalia>
                                            )}
                                        </div>
                                    )}

                                    {/* Column 3: actions */}
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                            <button
                                                onClick={saveEdit}
                                                disabled={saving}
                                                className="btn"
                                                style={{ fontSize: 12, padding: '5px 12px' }}
                                            >
                                                {saving ? '…' : 'Save'}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="btn btn-ghost"
                                                style={{ fontSize: 12, padding: '5px 12px' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            <button
                                                onClick={() => startEdit(e)}
                                                title="Edit"
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--ink-4)', fontSize: 13, padding: '4px 6px', lineHeight: 1,
                                                    transition: 'color .12s',
                                                }}
                                                onMouseEnter={ev => (ev.currentTarget.style.color = 'var(--ink-2)')}
                                                onMouseLeave={ev => (ev.currentTarget.style.color = 'var(--ink-4)')}
                                            >
                                                ✎
                                            </button>
                                            <button
                                                onClick={() => remove(e.id)}
                                                title="Remove"
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--ink-4)', fontSize: 16, padding: '4px 6px', lineHeight: 1,
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Page>
        </AppShell>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, color: 'var(--ink-3)',
    fontFamily: 'var(--serif)', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: 14,
    fontFamily: 'var(--serif)', color: 'var(--ink)',
    background: 'var(--paper)', border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-1)', outline: 'none', boxSizing: 'border-box',
};

const errStyle: React.CSSProperties = {
    margin: '4px 0 0', fontSize: 12, color: 'var(--signal)', fontFamily: 'var(--serif)',
};

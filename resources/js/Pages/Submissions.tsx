import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import { Ico } from '@/Components/Common/icons';

type SubmissionItem = {
    id: number;
    submitted_at: string | null;
    score: { grammar: number; vocabulary: number; coherence: number; task: number; overall: number };
    prompt: { text: string };
    headline: { primary: string; secondary: string } | null;
};

type PaginatedSubmissions = {
    data: SubmissionItem[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = { submissions: PaginatedSubmissions };

type SortKey = 'submitted_at' | 'grammar' | 'vocabulary' | 'coherence' | 'task' | 'overall';

const DIM_COLORS: Record<string, string> = {
    grammar:    'var(--signal)',
    vocabulary: 'oklch(0.56 0.11 230)',
    coherence:  'var(--progress)',
    task:       'oklch(0.54 0.10 290)',
};

const COL_HEADERS: Array<{ key: SortKey; label: string; width: string }> = [
    { key: 'submitted_at', label: 'Date',    width: '130px' },
    { key: 'grammar',      label: 'Gram.',   width: '60px'  },
    { key: 'vocabulary',   label: 'Vocab.',  width: '60px'  },
    { key: 'coherence',    label: 'Coh.',    width: '60px'  },
    { key: 'task',         label: 'Task',    width: '60px'  },
    { key: 'overall',      label: 'Overall', width: '80px'  },
];

function SortArrow({ dir }: { dir: 'asc' | 'desc' }) {
    return (
        <span style={{ fontSize: 8, marginLeft: 3, opacity: 0.7 }}>
            {dir === 'desc' ? '▼' : '▲'}
        </span>
    );
}

export default function Submissions({ submissions }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('submitted_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const sorted = useMemo(() => {
        return [...submissions.data].sort((a, b) => {
            let av: number, bv: number;
            if (sortKey === 'submitted_at') {
                av = new Date(a.submitted_at ?? 0).getTime();
                bv = new Date(b.submitted_at ?? 0).getTime();
            } else {
                av = a.score[sortKey] ?? 0;
                bv = b.score[sortKey] ?? 0;
            }
            return sortDir === 'desc' ? bv - av : av - bv;
        });
    }, [submissions.data, sortKey, sortDir]);

    return (
        <AppShell>
            <Head title="Submission history" />
            <Page>
                <PageHeader
                    eyebrow="Your writing archive"
                    title="Every essay you've sent"
                    italic="graded and waiting"
                    lead={`${submissions.data.length} submission${submissions.data.length === 1 ? '' : 's'} on this page. Click any row to read the full feedback.`}
                />

                {submissions.data.length === 0 ? (
                    <div style={{ padding: '48px 0', textAlign: 'center' }}>
                        <Marginalia style={{ fontSize: 16 }}>No graded submissions yet.</Marginalia>
                        <Link href="/compose" className="btn" style={{ display: 'inline-flex', marginTop: 20 }}>
                            Write your first essay <Ico.arrow />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Header row — sortable */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `${COL_HEADERS.map(h => h.width).join(' ')} 1fr 24px`,
                                gap: 16, padding: '10px 24px',
                                background: 'var(--paper-2)', borderBottom: '0.5px solid var(--hairline)',
                            }}>
                                {COL_HEADERS.map(h => (
                                    <button
                                        key={h.key}
                                        onClick={() => handleSort(h.key)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                            textAlign: 'left', display: 'flex', alignItems: 'center',
                                            fontFamily: 'var(--mono)', fontSize: 9,
                                            letterSpacing: '0.06em', textTransform: 'uppercase',
                                            color: sortKey === h.key ? 'var(--ink)' : 'var(--ink-3)',
                                            fontWeight: sortKey === h.key ? 600 : 400,
                                        }}
                                    >
                                        {h.label}
                                        {sortKey === h.key && <SortArrow dir={sortDir} />}
                                    </button>
                                ))}
                                {/* Prompt column header — not sortable */}
                                <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Prompt</span>
                                <span />
                            </div>

                            {sorted.map((s, i) => (
                                <Link
                                    key={s.id}
                                    href={`/submissions/${s.id}`}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `${COL_HEADERS.map(h => h.width).join(' ')} 1fr 24px`,
                                        gap: 16, alignItems: 'center',
                                        padding: '18px 24px',
                                        borderTop: i === 0 ? 'none' : '0.5px solid var(--hairline)',
                                        textDecoration: 'none', color: 'inherit',
                                        transition: 'background .15s ease',
                                    }}
                                    className="clickable"
                                >
                                    {/* Date */}
                                    <div>
                                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                            {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                                        </div>
                                        <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2 }}>
                                            {s.submitted_at ? new Date(s.submitted_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                                        </div>
                                    </div>

                                    {/* Dimension scores */}
                                    {(['grammar', 'vocabulary', 'coherence', 'task'] as const).map(dim => (
                                        <ScorePill
                                            key={dim}
                                            value={s.score[dim]}
                                            color={DIM_COLORS[dim]}
                                            highlight={sortKey === dim}
                                        />
                                    ))}

                                    {/* Overall */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                        <span className="num" style={{
                                            fontSize: sortKey === 'overall' ? 26 : 24,
                                            letterSpacing: '-0.03em',
                                            color: sortKey === 'overall' ? 'var(--ink)' : undefined,
                                            transition: 'font-size .15s',
                                        }}>
                                            {s.score.overall}
                                        </span>
                                        <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>/100</span>
                                    </div>

                                    {/* Prompt */}
                                    <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)', lineHeight: 1.35 }}>
                                        "{s.prompt.text.length > 72 ? s.prompt.text.slice(0, 72) + '…' : s.prompt.text}"
                                    </div>

                                    <Ico.arrow style={{ color: 'var(--ink-4)' }} />
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {submissions.last_page > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                                {submissions.prev_page_url ? (
                                    <Link href={submissions.prev_page_url} className="btn btn-ghost">← Newer</Link>
                                ) : <span />}
                                <Eyebrow>Page {submissions.current_page} of {submissions.last_page}</Eyebrow>
                                {submissions.next_page_url ? (
                                    <Link href={submissions.next_page_url} className="btn btn-ghost">Older →</Link>
                                ) : <span />}
                            </div>
                        )}
                    </>
                )}
            </Page>
        </AppShell>
    );
}

function ScorePill({ value, color, highlight }: { value: number; color: string; highlight: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span className="num" style={{
                fontSize: highlight ? 18 : 16,
                color: highlight ? color : color,
                fontWeight: highlight ? 600 : 400,
                transition: 'font-size .15s',
            }}>
                {value ?? '—'}
            </span>
        </div>
    );
}

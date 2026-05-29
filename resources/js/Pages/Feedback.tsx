import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Display from '@/Components/Typography/Display';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import ScoreArc from '@/Components/Common/ScoreArc';
import BandBadge from '@/Components/Common/BandBadge';
import Chip from '@/Components/Common/Chip';
import Essay from '@/Components/Feedback/Essay';
import MarginPanel from '@/Components/Feedback/MarginPanel';
import NoticedCallout from '@/Components/Feedback/NoticedCallout';
import DimensionCard from '@/Components/Feedback/DimensionCard';
import { Ico } from '@/Components/Common/icons';
import type { Dimension, FeedbackPageProps } from '@/lib/types';

function getCsrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

type CoachState = 'idle' | 'loading' | 'done' | 'error';

function CoachCard({ submissionId }: { submissionId: number }) {
    const [state, setState] = useState<CoachState>('idle');
    const [priorities, setPriorities] = useState<string[]>([]);

    async function generate() {
        setState('loading');
        try {
            const res = await fetch(`/submissions/${submissionId}/coach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed');
            setPriorities(json.priorities ?? []);
            setState('done');
        } catch {
            setState('error');
        }
    }

    return (
        <div className="card" style={{ padding: '24px 28px', marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: state === 'done' ? 20 : 0 }}>
                <div>
                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 4 }}>
                        Writing coach summary
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)' }}>
                        Three priorities for your next essay
                    </div>
                </div>
                {state === 'idle' && (
                    <button onClick={generate} className="btn btn-ghost" style={{ fontSize: 12 }}>
                        Generate <Ico.arrow />
                    </button>
                )}
                {state === 'loading' && (
                    <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>
                        thinking…
                    </span>
                )}
                {state === 'error' && (
                    <button onClick={generate} className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--signal)' }}>
                        Retry
                    </button>
                )}
            </div>
            {state === 'done' && (
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {priorities.map((p, i) => (
                        <li key={i} style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                            {p}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

const DIMENSIONS: { key: Dimension; label: string }[] = [
    { key: 'grammar', label: 'Grammar' },
    { key: 'vocabulary', label: 'Vocabulary' },
    { key: 'coherence', label: 'Coherence' },
    { key: 'task', label: 'Task' },
];

export default function Feedback({ submission, delta_vs_last_week }: FeedbackPageProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const { score, headline, meta, errors, dimension_notes, recurring_pattern, added_drill_cards, vocab_examples } = submission;

    // Group the new error instances by type for the tally section.
    const tally = Object.values(
        errors.reduce<Record<string, { type: string; dimension: string; count: number }>>((acc, e) => {
            acc[e.type] ??= { type: e.type, dimension: e.dimension, count: 0 };
            acc[e.type].count += 1;
            return acc;
        }, {}),
    );
    const deltaLabel = `${delta_vs_last_week >= 0 ? '+' : ''}${delta_vs_last_week} vs last week avg`;

    return (
        <AppShell>
            <Head title="Feedback" />
            <Page wide>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <Link
                        href="/"
                        style={{
                            textDecoration: 'none',
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 14,
                            color: 'var(--ink-3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Ico.arrowLeft /> back to today
                    </Link>
                    <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        submission #{String(submission.id).padStart(3, '0')} · graded{' '}
                        {submission.graded_at ? new Date(submission.graded_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'} ·{' '}
                        {meta.model} · taxonomy {meta.taxonomy_version}
                    </div>
                </div>

                {/* Section 1 — headline grade */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'flex-start' }}>
                    <div>
                        <Eyebrow style={{ marginBottom: 14 }}>Today's submission</Eyebrow>
                        <Display size="lg" as="h1" style={{ fontSize: 52, lineHeight: 1.05 }}>
                            {withItalicLastWord(headline.primary)}
                            <br />
                            {headline.secondary}
                        </Display>
                        <Marginalia style={{ fontSize: 17, marginTop: 18, maxWidth: 560 }}>
                            Four small things to look at, mostly prepositions. We'll work them in. Don't treat the score
                            as a verdict — it's a temperature reading.
                        </Marginalia>
                    </div>
                    <div style={{ display: 'flex', gap: 18, justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                        <div className="col gap-2 center" style={{ alignItems: 'center', paddingTop: 6 }}>
                            <ScoreArc value={score.overall} label="Overall" size={140} />
                            <BandBadge score={score.overall} label="est. IELTS band" />
                            <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--progress)' }}>
                                {deltaLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 2 — THE WEDGE */}
                {recurring_pattern && (
                    <NoticedCallout
                        code={recurring_pattern.code}
                        headline={renderNoticedHeadline(recurring_pattern.headline)}
                        weeklyCount={recurring_pattern.weekly_count}
                        drillHref="/drill"
                    />
                )}

                {/* Section 3 — essay + margin */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 56, alignItems: 'flex-start', marginTop: 56 }}>
                    <Essay text={submission.text} errors={errors} selected={selected} onSelect={setSelected} />
                    <MarginPanel errors={errors} selected={selected} onSelect={setSelected} />
                </div>

                {/* Section 4 — dimensions */}
                <section style={{ marginTop: 80 }}>
                    <SectionHeader label="The four dimensions" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
                        {DIMENSIONS.map((d) => (
                            <DimensionCard key={d.key} label={d.label} value={score[d.key]} note={dimension_notes[d.key]} />
                        ))}
                    </div>
                </section>

                {/* Section 5 — error tally */}
                <section style={{ marginTop: 64 }}>
                    <SectionHeader label="What this submission added to your profile" />
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {tally.map((t, i) => (
                            <div
                                key={t.type}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 100px 120px 140px',
                                    gap: 24,
                                    alignItems: 'center',
                                    padding: '20px 24px',
                                    borderTop: i === 0 ? 0 : '0.5px solid var(--hairline)',
                                }}
                            >
                                <div>
                                    <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic' }}>
                                        {t.type.replace(/_/g, ' ')}
                                    </div>
                                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', marginTop: 2 }}>
                                        {t.type}
                                    </div>
                                </div>
                                <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                                    {t.dimension}
                                </div>
                                <Chip variant={t.count > 1 ? 'signal' : 'default'} style={{ justifySelf: 'flex-start' }}>
                                    {t.count > 1 ? 'recurring' : 'first time'}
                                </Chip>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                                    <span className="num" style={{ fontSize: 22 }}>
                                        +{t.count}
                                    </span>
                                    <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                                        instances
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div
                            style={{
                                padding: '18px 24px',
                                background: 'var(--paper-2)',
                                borderTop: '0.5px solid var(--hairline)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Marginalia style={{ fontSize: 14 }}>
                                All {added_drill_cards} marks have been added as review cards. They'll surface in
                                tomorrow's drill.
                            </Marginalia>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Link href={`/submissions/${submission.id}/rewrite`} className="btn btn-ghost">
                                    Rewrite a paragraph
                                </Link>
                                <Link href="/drill" className="btn btn-ghost">
                                    Review cards now <Ico.arrow />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Section 6 — vocab examples */}
                {vocab_examples && vocab_examples.length > 0 && (
                    <section style={{ marginTop: 64 }}>
                        <SectionHeader label="Your vocab notebook · example sentences" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                            {vocab_examples.map((v) => (
                                <div key={v.word} className="card" style={{ padding: 22 }}>
                                    <div style={{
                                        fontFamily: 'var(--serif)',
                                        fontSize: 18,
                                        fontStyle: 'italic',
                                        marginBottom: 14,
                                        color: 'var(--ink)',
                                    }}>
                                        {v.word}
                                    </div>
                                    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {v.examples.map((ex, i) => (
                                            <li key={i} style={{
                                                fontFamily: 'var(--serif)',
                                                fontSize: 14,
                                                fontStyle: 'italic',
                                                color: 'var(--ink-2)',
                                                lineHeight: 1.55,
                                            }}>
                                                {ex}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Section 7 — writing coach */}
                <section style={{ marginTop: 64 }}>
                    <SectionHeader label="Writing coach · next session priorities" />
                    <CoachCard submissionId={submission.id} />
                </section>
            </Page>
        </AppShell>
    );
}

/** Italicizes the final word of the primary headline ("thoughtfully"). */
function withItalicLastWord(text: string): React.ReactNode {
    const trimmed = text.replace(/\.$/, '');
    const idx = trimmed.lastIndexOf(' ');
    if (idx === -1) return `${text}`;
    const head = trimmed.slice(0, idx);
    const last = trimmed.slice(idx + 1);
    return (
        <>
            {head} <em style={{ fontWeight: 300, color: 'var(--ink-2)' }}>{last}</em>.
        </>
    );
}

/** Emphasizes the prepositions in the noticed headline, matching the prototype. */
function renderNoticedHeadline(text: string): React.ReactNode {
    const parts = text.split(/\b(at|in|on)\b/g);
    return parts.map((p, i) =>
        p === 'at' || p === 'in' || p === 'on' ? <em key={i}>{p}</em> : <span key={i}>{p}</span>,
    );
}

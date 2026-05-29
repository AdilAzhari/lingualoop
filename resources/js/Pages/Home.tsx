import { Head, Link, usePage } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Display from '@/Components/Typography/Display';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import Chip from '@/Components/Common/Chip';
import ScoreSparkline from '@/Components/Common/ScoreSparkline';
import { Ico } from '@/Components/Common/icons';
import type { HomePageProps, Prompt, SharedProps } from '@/lib/types';

const GREETING: Record<HomePageProps['greeting']['time_of_day'], string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Still up',
};

export default function Home({ greeting, headline, lead, today_prompt, streak, patterns, recent, score_history, written_today, level_up, today_activity }: HomePageProps) {
    const user = usePage<SharedProps>().props.auth.user;

    return (
        <AppShell>
            <Head title="Today" />
            <Page>
                {/* Streak-at-risk banner */}
                {!written_today && streak.current_days > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 20px', marginBottom: 28,
                        background: 'var(--signal-wash)', border: '1px solid var(--signal-soft)',
                        borderRadius: 'var(--r-2)',
                    }}>
                        <Marginalia style={{ fontSize: 14 }}>
                            Your <strong style={{ fontWeight: 500 }}>{streak.current_days}-day streak</strong> continues if you write today.
                        </Marginalia>
                        <Link href="/compose" className="btn" style={{ fontSize: 13, padding: '7px 16px' }}>
                            Write now <Ico.arrow />
                        </Link>
                    </div>
                )}

                {/* Level-up milestone */}
                {level_up && (
                    <div style={{
                        padding: '16px 20px', marginBottom: 28,
                        background: 'var(--progress-wash)', border: '1px solid var(--progress-soft)',
                        borderRadius: 'var(--r-2)',
                    }}>
                        <Eyebrow style={{ color: 'var(--progress)', marginBottom: 6 }}>Milestone</Eyebrow>
                        <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)' }}>
                            Three consecutive essays above 85. You're ready to move from{' '}
                            <strong style={{ fontWeight: 500 }}>{level_up.current.toUpperCase()}</strong> to{' '}
                            <strong style={{ fontWeight: 500 }}>{level_up.suggested.toUpperCase()}</strong>.
                        </p>
                    </div>
                )}

                {/* Greeting */}
                <div style={{ marginBottom: 44 }}>
                    <Eyebrow style={{ marginBottom: 16 }}>{greeting.day_label}</Eyebrow>
                    <Display size="xl" as="h1" style={{ maxWidth: 900 }}>
                        {GREETING[greeting.time_of_day]}, {user.name.split(' ')[0]}.
                        <br />
                        <em style={{ fontWeight: 300, color: 'var(--ink-2)' }}>{headline.primary}</em>
                    </Display>
                    <Marginalia style={{ fontSize: 18, marginTop: 18, maxWidth: 560 }}>{lead}</Marginalia>
                </div>

                {/* Today's focus + side stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 24, marginBottom: 48 }}>
                    <TodaysFocus prompt={today_prompt} />
                    <div className="col gap-3">
                        <StreakCard currentDays={streak.current_days} history={streak.history} />
                        <ScoreCard history={score_history} />
                        <PatternsMini patterns={patterns} />
                    </div>
                </div>

                {/* Today's activity across all skills */}
                <TodayActivity written={written_today} activity={today_activity} />

                {/* Recent */}
                <SectionHeader label="Recent — what you wrote, what I noticed" action="See all" href="/submissions" />
                <div className="col" style={{ gap: 0 }}>
                    {recent.map((r) => (
                        <RecentRow key={r.id} id={r.id} when={r.submitted_at} prompt={r.prompt.text} overall={r.score.overall} flag={r.flag} />
                    ))}
                </div>
            </Page>
        </AppShell>
    );
}

function TodayActivity({ written, activity }: { written: boolean; activity: HomePageProps['today_activity'] }) {
    const items: Array<{ label: string; href: string; done: boolean | number; badge?: string }> = [
        { label: 'Write',   href: '/compose',    done: written,            badge: written ? '✓' : undefined },
        { label: 'Read',    href: '/reading',    done: activity.reading,   badge: activity.reading > 0 ? String(activity.reading) : undefined },
        { label: 'Listen',  href: '/listening',  done: activity.listening, badge: activity.listening > 0 ? String(activity.listening) : undefined },
        { label: 'Speak',   href: '/speaking',   done: activity.speaking,  badge: activity.speaking > 0 ? String(activity.speaking) : undefined },
    ];

    return (
        <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>Today</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {items.map(item => {
                        const isDone = Boolean(item.done);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                style={{
                                    textDecoration: 'none',
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '5px 12px', borderRadius: 99,
                                    background: isDone ? 'var(--progress-wash)' : 'var(--paper-3)',
                                    border: `0.5px solid ${isDone ? 'var(--progress-soft, var(--progress))' : 'var(--hairline)'}`,
                                    transition: 'opacity .12s',
                                }}
                            >
                                <span style={{
                                    fontFamily: 'var(--serif)', fontSize: 13,
                                    color: isDone ? 'var(--progress)' : 'var(--ink-3)',
                                    fontStyle: isDone ? 'italic' : 'normal',
                                }}>
                                    {item.label}
                                </span>
                                {item.badge && (
                                    <span className="num" style={{ fontSize: 11, color: isDone ? 'var(--progress)' : 'var(--ink-3)' }}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    {/* Vocab due chip */}
                    <Link
                        href="/vocabulary/review"
                        style={{
                            textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 99,
                            background: activity.vocab_due > 0 ? 'oklch(0.97 0.07 70)' : 'var(--paper-3)',
                            border: `0.5px solid ${activity.vocab_due > 0 ? 'oklch(0.88 0.09 70)' : 'var(--hairline)'}`,
                        }}
                    >
                        <span style={{
                            fontFamily: 'var(--serif)', fontSize: 13,
                            color: activity.vocab_due > 0 ? 'oklch(0.5 0.16 60)' : 'var(--ink-3)',
                        }}>
                            Vocab
                        </span>
                        <span className="num" style={{ fontSize: 11, color: activity.vocab_due > 0 ? 'oklch(0.5 0.16 60)' : 'var(--ink-4)' }}>
                            {activity.vocab_due > 0 ? `${activity.vocab_due} due` : '—'}
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function TodaysFocus({ prompt }: { prompt: Prompt }) {
    return (
        <Link href="/compose" className="card clickable" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: 28, position: 'relative', overflow: 'hidden' }}>
            <Eyebrow style={{ marginBottom: 12 }}>
                Today's writing · {prompt.duration_minutes} min · {prompt.level}.{prompt.task_type}
            </Eyebrow>
            <Display size="sm" as="h2" style={{ maxWidth: 480, lineHeight: 1.15 }}>
                "{prompt.text}"
            </Display>

            <div style={{ display: 'flex', gap: 24, marginTop: 28, alignItems: 'center' }}>
                <span className="btn" style={{ fontSize: 15 }}>
                    Begin writing <Ico.arrow />
                </span>
                <Marginalia style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.4 }}>
                    We're paying special attention to{' '}
                    <strong style={{ fontWeight: 500, fontStyle: 'normal' }}>prepositions</strong> this session. I'll be
                    quiet otherwise.
                </Marginalia>
            </div>

            <svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                style={{ position: 'absolute', right: -20, bottom: -28, opacity: 0.14, color: 'var(--ink)' }}
            >
                <g stroke="currentColor" strokeWidth=".8" fill="none">
                    <circle cx="90" cy="90" r="58" />
                    <circle cx="90" cy="90" r="44" />
                    <circle cx="90" cy="90" r="30" />
                    <path d="M30 90 L150 90 M90 30 L90 150" strokeDasharray="2 4" />
                </g>
            </svg>
        </Link>
    );
}

function StreakCard({ currentDays, history }: { currentDays: number; history: number[] }) {
    return (
        <div className="card" style={{ padding: 22 }}>
            <div className="row between center" style={{ marginBottom: 14 }}>
                <Eyebrow>Current streak</Eyebrow>
                <Ico.flame style={{ color: 'var(--signal)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="num" style={{ fontSize: 44, letterSpacing: '-0.03em' }}>
                    {currentDays}
                </span>
                <Marginalia style={{ fontSize: 15 }}>days, plus one missed Saturday I'm pretending didn't happen</Marginalia>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${history.length}, 1fr)`, gap: 3, marginTop: 18 }}>
                {history.map((d, i) => (
                    <div
                        key={i}
                        style={{
                            height: 18,
                            borderRadius: 3,
                            background: d ? 'var(--ink-2)' : 'var(--paper-3)',
                            opacity: d ? 0.5 + (i / history.length) * 0.5 : 1,
                            border: d ? 0 : '0.5px solid var(--hairline)',
                        }}
                    />
                ))}
            </div>
            <div
                className="label-mono"
                style={{ fontSize: 9.5, marginTop: 8, color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between' }}
            >
                <span>3 weeks ago</span>
                <span>today</span>
            </div>
        </div>
    );
}

function ScoreCard({ history }: { history: HomePageProps['score_history'] }) {
    return (
        <div className="card" style={{ padding: 22 }}>
            <div className="row between center" style={{ marginBottom: 14 }}>
                <Eyebrow>Score trend</Eyebrow>
                <Link href="/submissions" style={{ fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'var(--serif)', fontStyle: 'italic', textDecoration: 'none' }}>
                    all →
                </Link>
            </div>
            <ScoreSparkline history={history} width={200} height={48} />
        </div>
    );
}

function PatternsMini({ patterns }: { patterns: HomePageProps['patterns'] }) {
    const trendGlyph: Record<HomePageProps['patterns'][number]['trend'], string> = { up: '↑', down: '↓', flat: '·' };
    const trendColor = (t: HomePageProps['patterns'][number]['trend']) =>
        t === 'up' ? 'var(--signal)' : t === 'down' ? 'var(--progress)' : 'var(--ink-3)';

    return (
        <Link href="/profile" className="card clickable" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: 22 }}>
            <div className="row between center" style={{ marginBottom: 14 }}>
                <Eyebrow>Recurring patterns</Eyebrow>
                <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>
                    last 14d
                </span>
            </div>
            <div className="col" style={{ gap: 0 }}>
                {patterns.map((p, i) => (
                    <div
                        key={p.code}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto',
                            gap: 12,
                            alignItems: 'baseline',
                            padding: '10px 0',
                            borderTop: i === 0 ? 0 : '0.5px dashed var(--hairline)',
                        }}
                    >
                        <div>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic' }}>{p.display_name}</div>
                            <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>
                                {p.code}
                            </div>
                        </div>
                        <span className="num" style={{ fontSize: 13, color: trendColor(p.trend) }}>
                            {p.delta > 0 ? `+${p.delta}` : p.delta}
                        </span>
                        <span
                            style={{
                                fontFamily: 'var(--serif)',
                                fontSize: 16,
                                color: trendColor(p.trend),
                                lineHeight: 1,
                                width: 12,
                                textAlign: 'center',
                            }}
                        >
                            {trendGlyph[p.trend]}
                        </span>
                    </div>
                ))}
            </div>
        </Link>
    );
}

function RecentRow({
    id,
    when,
    prompt,
    overall,
    flag,
}: {
    id: number;
    when: string;
    prompt: string;
    overall: number;
    flag: HomePageProps['recent'][number]['flag'];
}) {
    return (
        <Link
            href={`/submissions/${id}`}
            className="clickable"
            style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 280px 80px 30px',
                gap: 24,
                alignItems: 'center',
                padding: '20px 8px',
                borderTop: '0.5px solid var(--hairline)',
                textDecoration: 'none',
                color: 'inherit',
            }}
        >
            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                {when}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.3 }}>
                <em style={{ fontWeight: 300, color: 'var(--ink-2)' }}>"{prompt}"</em>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {flag ? (
                    <Chip variant={flag.kind === 'win' ? 'progress' : 'signal'}>{flag.text}</Chip>
                ) : (
                    <Marginalia style={{ fontSize: 12 }}>no new patterns</Marginalia>
                )}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'baseline', justifyContent: 'flex-end' }}>
                <span className="num" style={{ fontSize: 22 }}>
                    {overall}
                </span>
                <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>
                    /100
                </span>
            </div>
            <Ico.arrow style={{ color: 'var(--ink-3)' }} />
        </Link>
    );
}

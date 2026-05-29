import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Display from '@/Components/Typography/Display';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import Chip from '@/Components/Common/Chip';
import StratiLayer from '@/Components/Profile/StratiLayer';
import ScoreSparkline from '@/Components/Common/ScoreSparkline';
import { Ico } from '@/Components/Common/icons';
import { deep } from '@/lib/tokens';
import { BADGES, computeEarned, findNewBadges } from '@/lib/badges';
import type { Dimension, ProfilePageProps } from '@/lib/types';

const DIM_LABEL: Record<Dimension, string> = {
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    coherence: 'Coherence',
    task: 'Task',
};

function Legend({ swatch, label }: { swatch: string; label: string }) {
    return (
        <div className="row center gap-2">
            <span style={{ width: 14, height: 4, borderRadius: 2, background: swatch }} />
            <Marginalia style={{ fontSize: 12 }}>{label}</Marginalia>
        </div>
    );
}

export default function Profile({ active_focus, layers, by_dimension, score_history, reading_history, speaking_history, listening_history, badge_stats }: ProfilePageProps) {
    const [newBadgeKeys, setNewBadgeKeys] = useState<string[]>([]);
    const earned = computeEarned(badge_stats);

    useEffect(() => {
        const fresh = findNewBadges(badge_stats);
        if (fresh.length > 0) {
            setNewBadgeKeys(fresh.map((b) => b.key));
            setTimeout(() => setNewBadgeKeys([]), 4000);
        }
    }, []);

    return (
        <AppShell>
            <Head title="Profile" />
            <Page>
                <PageHeader
                    eyebrow="Error profile · last 12 weeks"
                    title="What I keep noticing"
                    italic="about your writing"
                    lead="Each row is an error category. Each bar is a week's submissions. The pattern you're working on this week is brightest; resolved categories fade. This is not a leaderboard — it's a memory."
                />

                {/* Active focus banner */}
                {active_focus && (
                    <div
                        className="card"
                        style={{
                            padding: 24,
                            marginBottom: 40,
                            background: 'var(--signal-wash)',
                            borderColor: 'var(--signal-soft)',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: 32,
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <Eyebrow style={{ color: deep.signalEyebrow, marginBottom: 8 }}>Currently working on</Eyebrow>
                            <Display size="sm" as="h3" style={{ fontSize: 24, color: deep.signalText }}>
                                {active_focus.headline}
                            </Display>
                            <Marginalia style={{ fontSize: 14, marginTop: 6, color: deep.signalLead }}>
                                {active_focus.lead}
                            </Marginalia>
                        </div>
                        <Link href="/drill" className="btn" style={{ background: deep.signalButton }}>
                            Drill this pattern <Ico.arrow />
                        </Link>
                    </div>
                )}

                {/* Stratigraphy */}
                <SectionHeader label="Twelve weeks of layers" />
                <div className="card" style={{ padding: '8px 24px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 100px', gap: 20, paddingTop: 14, paddingBottom: 4 }}>
                        <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>
                            category
                        </span>
                        <div style={{ position: 'relative', height: 14 }}>
                            <span className="label-mono" style={{ position: 'absolute', left: 0, fontSize: 9, color: 'var(--ink-3)' }}>
                                12 weeks ago
                            </span>
                            <span className="label-mono" style={{ position: 'absolute', right: 0, fontSize: 9, color: 'var(--ink-3)' }}>
                                this week
                            </span>
                        </div>
                        <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', textAlign: 'right' }}>
                            peak / status
                        </span>
                    </div>
                    {layers.map((l) => (
                        <StratiLayer key={l.code} layer={l} />
                    ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 24, marginTop: 18, marginBottom: 48 }}>
                    <Legend swatch="var(--signal)" label="active — currently flagging" />
                    <Legend swatch="var(--pencil)" label="improving — count shrinking" />
                    <Legend swatch="var(--progress)" label="resolved — gone for 14+ days" />
                    <Legend swatch="var(--ink-4)" label="historical instances" />
                </div>

                {/* Score history — all three skills */}
                {(score_history?.length > 0 || reading_history?.length > 0 || speaking_history?.length > 0 || listening_history?.length > 0) && (
                    <>
                        <SectionHeader label="Score trends · last 10 sessions per skill" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
                            {score_history?.length > 0 && (
                                <div className="card" style={{ padding: '20px 24px' }}>
                                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12 }}>Writing</div>
                                    <ScoreSparkline history={score_history} width={260} height={56} color="var(--ink-2)" />
                                </div>
                            )}
                            {reading_history?.length > 0 && (
                                <div className="card" style={{ padding: '20px 24px' }}>
                                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12 }}>Reading</div>
                                    <ScoreSparkline history={reading_history} width={260} height={56} color="var(--progress)" />
                                </div>
                            )}
                            {speaking_history?.length > 0 && (
                                <div className="card" style={{ padding: '20px 24px' }}>
                                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12 }}>Speaking</div>
                                    <ScoreSparkline history={speaking_history} width={260} height={56} color="var(--signal)" />
                                </div>
                            )}
                            {listening_history?.length > 0 && (
                                <div className="card" style={{ padding: '20px 24px' }}>
                                    <div className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', marginBottom: 12 }}>Listening</div>
                                    <ScoreSparkline history={listening_history} width={260} height={56} color="oklch(0.56 0.11 230)" />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* By dimension */}
                <SectionHeader label="By dimension" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {by_dimension.map((d) => (
                        <div key={d.dimension} className="card" style={{ padding: 22 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic' }}>
                                    {DIM_LABEL[d.dimension]}
                                </span>
                                <span className="num" style={{ fontSize: 16, color: 'var(--ink-3)' }}>
                                    {d.count}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {d.codes.map((t) => (
                                    <Chip key={t} style={{ fontSize: 10 }}>
                                        {t}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Achievements */}
                <div style={{ marginTop: 64 }}>
                    <SectionHeader label={`Achievements · ${earned.length} / ${BADGES.length} unlocked`} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                        {BADGES.map((b) => {
                            const isEarned = earned.includes(b.key);
                            const isNew = newBadgeKeys.includes(b.key);
                            return (
                                <div
                                    key={b.key}
                                    className="card"
                                    style={{
                                        padding: '18px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                        opacity: isEarned ? 1 : 0.35,
                                        outline: isNew ? '2px solid var(--progress)' : 'none',
                                        outlineOffset: 2,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    <span style={{ fontSize: 28 }}>{b.icon}</span>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                                            {b.label}
                                        </div>
                                        <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>
                                            {b.description}
                                        </div>
                                    </div>
                                    {isNew && (
                                        <span className="label-mono" style={{ fontSize: 8.5, color: 'var(--progress)', letterSpacing: '0.05em' }}>
                                            NEW
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* New badge toast */}
                {newBadgeKeys.length > 0 && (
                    <div style={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        borderRadius: 12,
                        padding: '14px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        zIndex: 300,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        maxWidth: 260,
                    }}>
                        <div className="label-mono" style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                            Achievement unlocked
                        </div>
                        {newBadgeKeys.map((key) => {
                            const b = BADGES.find((x) => x.key === key);
                            if (!b) return null;
                            return (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 20 }}>{b.icon}</span>
                                    <div>
                                        <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 500 }}>{b.label}</div>
                                        <div className="label-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{b.description}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Page>
        </AppShell>
    );
}

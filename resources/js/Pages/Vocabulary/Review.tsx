import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import { Ico } from '@/Components/Common/icons';
import type { VocabularyReviewProps, VocabReviewCard } from '@/lib/types';

const LEVEL_LABEL: Record<string, string> = { a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2' };

const RATINGS = [
    { key: 'forgot', label: 'Forgot',  color: 'var(--signal)',   bg: 'var(--signal-wash)' },
    { key: 'hard',   label: 'Hard',    color: 'oklch(0.45 0.14 60)', bg: 'oklch(0.97 0.07 70)' },
    { key: 'good',   label: 'Got it',  color: 'var(--ink)',      bg: 'var(--paper-3)' },
    { key: 'easy',   label: 'Easy',    color: 'var(--progress)', bg: 'var(--progress-wash)' },
] as const;

type Rating = typeof RATINGS[number]['key'];

function FlashCard({ card, onRate }: { card: VocabReviewCard; onRate: (r: Rating) => void }) {
    const [flipped, setFlipped] = useState(false);
    const isAdvanced = card.level === 'c1' || card.level === 'c2';

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(v => !v); }
            if (!flipped) return;
            if (e.key === '1') onRate('forgot');
            if (e.key === '2') onRate('hard');
            if (e.key === '3') onRate('good');
            if (e.key === '4') onRate('easy');
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [flipped, onRate]);

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {/* Card face */}
            <div
                className="card"
                onClick={() => setFlipped((v) => !v)}
                style={{
                    padding: '48px 40px',
                    minHeight: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    textAlign: 'center',
                    borderLeft: isAdvanced ? '3px solid var(--signal)' : undefined,
                    transition: 'box-shadow .15s',
                }}
            >
                {!flipped ? (
                    <>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 500, marginBottom: 12 }}>
                            {card.word}
                        </div>
                        {card.level && (
                            <span className="chip" style={{ fontSize: 10, background: isAdvanced ? 'var(--signal-wash)' : undefined, color: isAdvanced ? 'var(--signal)' : undefined }}>
                                {LEVEL_LABEL[card.level] ?? card.level}
                            </span>
                        )}
                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 20 }}>
                            tap to reveal
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', marginBottom: 12, color: 'var(--ink)' }}>
                            {card.word}
                        </div>
                        {card.definition ? (
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 16px' }}>
                                {card.definition}
                            </p>
                        ) : (
                            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-4)', margin: '0 0 16px' }}>
                                No definition saved.
                            </p>
                        )}
                        {card.example && (
                            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', padding: '10px 16px', background: 'var(--paper-2)', borderRadius: 8, lineHeight: 1.5 }}>
                                "{card.example}"
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Rating buttons — only shown after flip */}
            {flipped && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
                        {RATINGS.map((r, i) => (
                            <button
                                key={r.key}
                                onClick={() => onRate(r.key)}
                                style={{
                                    fontFamily: 'var(--serif)', fontSize: 13, padding: '10px 6px', borderRadius: 8,
                                    border: 'none', cursor: 'pointer',
                                    background: r.bg, color: r.color, fontWeight: 500,
                                    position: 'relative',
                                }}
                            >
                                {r.label}
                                <span style={{
                                    position: 'absolute', top: 4, right: 6,
                                    fontSize: 8, fontFamily: 'var(--mono)', opacity: 0.4,
                                }}>{i + 1}</span>
                            </button>
                        ))}
                    </div>
                    <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', marginTop: 10 }}>
                        Space / Enter to flip · 1–4 to rate
                    </div>
                </>
            )}
            {!flipped && (
                <div className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', marginTop: 12 }}>
                    Space or Enter to reveal
                </div>
            )}
        </div>
    );
}

export default function VocabularyReview({ cards, total_due }: VocabularyReviewProps) {
    const [current, setCurrent] = useState(0);
    const [done, setDone]       = useState(false);
    const [rated, setRated]     = useState(0);

    const card = cards[current];

    const handleRate = (rating: Rating) => {
        router.post(`/vocabulary/review/${card.id}`, { rating }, {
            preserveState: true,
            onSuccess: () => {
                setRated((n) => n + 1);
                if (current + 1 >= cards.length) {
                    setDone(true);
                } else {
                    setCurrent((n) => n + 1);
                }
            },
        });
    };

    if (cards.length === 0) {
        return (
            <AppShell>
                <Head title="Vocab Review" />
                <Page>
                    <PageHeader eyebrow="Vocabulary review" title="All caught up" italic="nothing due" lead="No words are due for review right now. Come back later or add new words to your notebook." />
                    <Link href="/vocabulary" className="btn">Back to notebook <Ico.arrow /></Link>
                </Page>
            </AppShell>
        );
    }

    // card can be undefined when Inertia refreshes cards prop mid-session and current is now out of bounds
    if (done || !card) {
        return (
            <AppShell>
                <Head title="Vocab Review · Done" />
                <Page>
                    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 44, marginBottom: 12 }}>✓</div>
                        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, marginBottom: 12 }}>
                            Session complete
                        </h1>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-3)', marginBottom: 32, lineHeight: 1.6 }}>
                            You reviewed {rated} word{rated !== 1 ? 's' : ''}. Your next review dates have been scheduled automatically.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <Link href="/vocabulary" className="btn btn-ghost">Notebook</Link>
                            <Link href="/compose" className="btn">Write today <Ico.arrow /></Link>
                        </div>
                    </div>
                </Page>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <Head title={`Vocab Review · ${current + 1}/${cards.length}`} />
            <Page>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <Link href="/vocabulary" style={{ textDecoration: 'none', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ico.arrowLeft /> notebook
                    </Link>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                            {current + 1} / {cards.length} · {total_due} due today
                        </span>
                        {/* Progress dots */}
                        <div style={{ display: 'flex', gap: 4 }}>
                            {cards.map((_, i) => (
                                <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: i < current ? 'var(--progress)' : i === current ? 'var(--ink)' : 'var(--hairline-2)' }} />
                            ))}
                        </div>
                    </div>
                </div>

                <FlashCard key={card.id} card={card} onRate={handleRate} />
            </Page>
        </AppShell>
    );
}

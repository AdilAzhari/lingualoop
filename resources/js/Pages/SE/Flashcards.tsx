import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import PageHeader from '@/Components/Layout/PageHeader';
import { Ico } from '@/Components/Common/icons';
import type { SeFlashcardsProps, SeFlashcardItem } from '@/lib/types';

const RATINGS = [
    { key: 'forgot', label: 'Forgot', color: 'var(--signal)',        bg: 'var(--signal-wash)' },
    { key: 'hard',   label: 'Hazy',   color: 'oklch(0.45 0.14 60)', bg: 'oklch(0.97 0.07 70)' },
    { key: 'good',   label: 'Got it', color: 'var(--ink)',           bg: 'var(--paper-3)' },
    { key: 'easy',   label: 'Solid',  color: 'var(--progress)',      bg: 'var(--progress-wash)' },
] as const;

type Rating = typeof RATINGS[number]['key'];

function FlashCard({ card, onRate }: { card: SeFlashcardItem; onRate: (r: Rating) => void }) {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((v) => !v); }
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
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
            <div
                className="card"
                onClick={() => setFlipped((v) => !v)}
                style={{
                    padding: '48px 40px', minHeight: 240,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', userSelect: 'none', textAlign: 'center',
                    transition: 'box-shadow .15s',
                }}
            >
                {!flipped ? (
                    <>
                        <span className="chip" style={{ fontSize: 9.5, marginBottom: 16 }}>
                            {card.category.replace(/-/g, ' ')}
                        </span>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2 }}>
                            {card.concept}
                        </div>
                        <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 20 }}>tap to reveal</div>
                    </>
                ) : (
                    <>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', marginBottom: 16, color: 'var(--ink)' }}>
                            {card.concept}
                        </div>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2)', margin: '0 0 16px' }}>
                            {card.back}
                        </p>
                        {card.example && (
                            <div style={{
                                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14,
                                color: 'var(--ink-3)', padding: '10px 16px',
                                background: 'var(--paper-2)', borderRadius: 8,
                                lineHeight: 1.55, marginBottom: card.gotcha ? 12 : 0,
                                width: '100%', boxSizing: 'border-box',
                            }}>
                                "{card.example}"
                            </div>
                        )}
                        {card.gotcha && (
                            <div style={{ padding: '10px 16px', background: 'var(--signal-wash)', borderRadius: 8, width: '100%', boxSizing: 'border-box' }}>
                                <span className="label-mono" style={{ fontSize: 9, color: 'var(--signal)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Common mistake:{' '}
                                </span>
                                <span style={{ fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                                    {card.gotcha}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {flipped && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
                        {RATINGS.map((r, i) => (
                            <button
                                key={r.key}
                                onClick={() => onRate(r.key)}
                                style={{
                                    fontFamily: 'var(--serif)', fontSize: 13, padding: '10px 6px',
                                    borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: r.bg, color: r.color, fontWeight: 500, position: 'relative',
                                }}
                            >
                                {r.label}
                                <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 8, fontFamily: 'var(--mono)', opacity: 0.4 }}>{i + 1}</span>
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

export default function SeFlashcards({ cards, total_due }: SeFlashcardsProps) {
    const [current, setCurrent] = useState(0);
    const [done, setDone]       = useState(false);
    const [rated, setRated]     = useState(0);

    const card = cards[current];

    const handleRate = (rating: Rating) => {
        router.post(`/software/flashcards/${card.progress_id}/answer`, { rating }, {
            preserveState: true,
            onSuccess: () => {
                setRated((n) => n + 1);
                if (current + 1 >= cards.length) setDone(true);
                else setCurrent((n) => n + 1);
            },
        });
    };

    if (cards.length === 0) {
        return (
            <AppShell>
                <Head title="SE Flashcards" />
                <Page>
                    <PageHeader eyebrow="SE Flashcards" title="All caught up" italic="nothing due" lead="No flashcards are due right now. Come back later or practice some prompts." />
                    <Link href="/software" className="btn">Back to SE practice <Ico.arrow /></Link>
                </Page>
            </AppShell>
        );
    }

    if (done || !card) {
        return (
            <AppShell>
                <Head title="SE Flashcards · Done" />
                <Page>
                    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 44, marginBottom: 12 }}>✓</div>
                        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, marginBottom: 12 }}>
                            Session complete
                        </h1>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-3)', marginBottom: 32, lineHeight: 1.6 }}>
                            You reviewed {rated} concept{rated !== 1 ? 's' : ''}. Next review dates scheduled.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <Link href="/software/flashcards" className="btn btn-ghost">Review again</Link>
                            <Link href="/software" className="btn">SE practice <Ico.arrow /></Link>
                        </div>
                    </div>
                </Page>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <Head title={`SE Flashcards · ${current + 1}/${cards.length}`} />
            <Page>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <Link href="/software" style={{ textDecoration: 'none', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Ico.arrowLeft /> SE practice
                    </Link>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span className="label-mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                            {current + 1} / {cards.length} · {total_due} due today
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {cards.map((_, i) => (
                                <span key={i} style={{
                                    width: 6, height: 6, borderRadius: 999,
                                    background: i < current ? 'var(--progress)' : i === current ? 'var(--ink)' : 'var(--hairline-2)',
                                }} />
                            ))}
                        </div>
                    </div>
                </div>

                <FlashCard key={card.progress_id} card={card} onRate={handleRate} />
            </Page>
        </AppShell>
    );
}

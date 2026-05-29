import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import Marginalia from '@/Components/Typography/Marginalia';
import DrillCard from '@/Components/Drill/DrillCard';
import ProgressDots from '@/Components/Drill/ProgressDots';
import { Ico } from '@/Components/Common/icons';
import type { DrillPageProps } from '@/lib/types';

export default function DrillIndex({ session_id, cards, focus_category }: DrillPageProps) {
    const [idx, setIdx] = useState(0);
    const [picks, setPicks] = useState<Record<string, number>>({});
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    const card = cards[idx];
    const pick = card ? picks[card.id] ?? null : null;
    const isRevealed = card ? revealed[card.id] ?? false : false;

    const states = cards.map((c) => {
        const p = picks[c.id];
        return { answered: p != null, correct: p === c.correct_index };
    });

    function choose(i: number) {
        if (!card || isRevealed) return;
        setPicks((p) => ({ ...p, [card.id]: i }));
        setRevealed((r) => ({ ...r, [card.id]: true }));

        // Record the answer server-side so FSRS can schedule the card.
        router.post(
            `/drill/${card.id}/answer`,
            { session_id, chosen_index: i, correct: i === card.correct_index },
            { preserveScroll: true, preserveState: true, only: [] },
        );
    }

    function next() {
        const isLast = idx === cards.length - 1;
        if (isLast) {
            const correct = cards.filter((c) => picks[c.id] === c.correct_index).length;
            router.get('/drill/summary', { session: session_id, correct, total: cards.length });
            return;
        }
        setIdx((i) => i + 1);
    }

    return (
        <AppShell>
            <Head title="Drill" />
            <Page>
                {/* Toolbar */}
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
                        <Ico.arrowLeft /> exit drill
                    </Link>

                    <ProgressDots total={cards.length} current={idx} states={states} />

                    <div className="label-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        drilling · {focus_category}
                    </div>
                </div>

                {card && (
                    <DrillCard
                        card={card}
                        pick={pick}
                        revealed={isRevealed}
                        isLast={idx === cards.length - 1}
                        onChoose={choose}
                        onNext={next}
                    />
                )}

                <Marginalia style={{ fontSize: 13, marginTop: 16, textAlign: 'center', color: 'var(--ink-3)' }}>
                    {cards.length} cards. All from sentences you've actually written.
                </Marginalia>
            </Page>
        </AppShell>
    );
}

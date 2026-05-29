type CardState = {
    answered: boolean;
    correct: boolean;
};

type Props = {
    total: number;
    current: number;
    states: CardState[];
};

/** Top-center drill progress. Current card = 22px ink pill; answered = 8px
 *  progress/signal dot by correctness; unanswered = paper-3. */
export default function ProgressDots({ total, current, states }: Props) {
    return (
        <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: total }).map((_, i) => {
                const s = states[i];
                const done = s?.answered ?? false;
                const isCurrent = i === current;
                let bg = 'var(--paper-3)';
                if (done) bg = s.correct ? 'var(--progress)' : 'var(--signal)';
                if (isCurrent && !done) bg = 'var(--ink)';
                return (
                    <div
                        key={i}
                        style={{
                            width: isCurrent ? 22 : 8,
                            height: 8,
                            borderRadius: 999,
                            background: bg,
                            transition: 'width .25s ease',
                        }}
                    />
                );
            })}
        </div>
    );
}

import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import { Ico } from '@/Components/Common/icons';
import OptionButton from './OptionButton';
import type { DrillCard as DrillCardData } from '@/lib/types';

type Props = {
    card: DrillCardData;
    pick: number | null;
    revealed: boolean;
    isLast: boolean;
    onChoose: (index: number) => void;
    onNext: () => void;
};

/** Renders the prompt with the fill-in blank, showing the chosen/correct word. */
function FillBlank({ card, pick, revealed }: { card: DrillCardData; pick: number | null; revealed: boolean }) {
    const [before, after] = card.prompt.split('___');
    let fill = '___';
    let color = 'var(--ink-3)';
    if (revealed) {
        fill = card.options[card.correct_index];
        color = 'var(--progress)';
    } else if (pick != null) {
        fill = card.options[pick];
        color = 'var(--ink)';
    }
    return (
        <span>
            {before}
            <span
                style={{
                    display: 'inline-block',
                    minWidth: 76,
                    padding: '0 8px',
                    borderBottom: `2px solid ${revealed ? 'var(--progress)' : 'var(--ink-3)'}`,
                    color,
                    fontStyle: revealed ? 'italic' : 'normal',
                    textAlign: 'center',
                    margin: '0 4px',
                }}
            >
                {fill}
            </span>
            {after}
        </span>
    );
}

/** One drill card: source eyebrow, fill-in prompt, four options, reveal panel.
 *  Cards come from the learner's own writing whenever possible (handoff §11). */
export default function DrillCard({ card, pick, revealed, isLast, onChoose, onNext }: Props) {
    const isCorrect = pick === card.correct_index;
    return (
        <div className="card" style={{ padding: '40px 48px', minHeight: 420 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                <Eyebrow>{card.is_real_source ? 'From your own writing' : 'Synthesized from your patterns'}</Eyebrow>
                <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>
                    {card.source}
                </span>
            </div>

            <div style={{ fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1.35, fontWeight: 400, maxWidth: 760 }}>
                <FillBlank card={card} pick={pick} revealed={revealed} />
            </div>

            <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {card.options.map((opt, i) => (
                    <OptionButton
                        key={`${opt}-${i}`}
                        label={opt}
                        picked={pick === i}
                        correct={i === card.correct_index}
                        revealed={revealed}
                        wasYours={card.yours === opt}
                        onClick={() => onChoose(i)}
                    />
                ))}
            </div>

            {revealed && (
                <div
                    style={{
                        marginTop: 32,
                        paddingTop: 24,
                        borderTop: '0.5px dashed var(--hairline)',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 32,
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <Eyebrow style={{ marginBottom: 8, color: isCorrect ? 'var(--progress)' : 'var(--signal)' }}>
                            {isCorrect ? 'You got it' : 'Not quite'}
                        </Eyebrow>
                        <Marginalia style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 640 }}>
                            {card.note}
                        </Marginalia>
                    </div>
                    <button className="btn" onClick={onNext}>
                        {isLast ? 'Finish' : 'Next'} <Ico.arrow />
                    </button>
                </div>
            )}
        </div>
    );
}

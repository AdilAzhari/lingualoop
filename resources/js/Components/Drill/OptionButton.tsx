import { Ico } from '@/Components/Common/icons';

type Props = {
    label: string;
    picked: boolean;
    correct: boolean;
    revealed: boolean;
    /** True if this option was the learner's original answer in the source. */
    wasYours: boolean;
    onClick: () => void;
};

/** Large italic-serif answer button. After reveal: correct → sage wash,
 *  wrong pick → terracotta wash, others dim. */
export default function OptionButton({ label, picked, correct, revealed, wasYours, onClick }: Props) {
    let bg = 'transparent';
    let border = '0.5px solid var(--hairline)';
    let color = 'var(--ink)';

    if (revealed) {
        if (correct) {
            bg = 'var(--progress-wash)';
            border = '0.5px solid var(--progress-soft)';
            color = 'oklch(0.34 0.09 140)';
        } else if (picked) {
            bg = 'var(--signal-wash)';
            border = '0.5px solid var(--signal-soft)';
            color = 'oklch(0.40 0.13 35)';
        } else {
            color = 'var(--ink-3)';
        }
    }

    return (
        <button
            onClick={onClick}
            disabled={revealed}
            style={{
                appearance: 'none',
                cursor: revealed ? 'default' : 'pointer',
                background: bg,
                border,
                borderRadius: 'var(--r-2)',
                padding: '16px 12px',
                fontFamily: 'var(--serif)',
                fontSize: 22,
                color,
                fontStyle: 'italic',
                transition: 'all .2s ease',
                position: 'relative',
                textAlign: 'center',
            }}
        >
            {label}
            {wasYours && (
                <span
                    className="label-mono"
                    style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 0,
                        right: 0,
                        fontSize: 8.5,
                        color: 'var(--ink-3)',
                        textAlign: 'center',
                    }}
                >
                    your original
                </span>
            )}
            {revealed && correct && (
                <span style={{ position: 'absolute', top: 6, right: 8, color: 'var(--progress)' }}>
                    <Ico.check />
                </span>
            )}
        </button>
    );
}

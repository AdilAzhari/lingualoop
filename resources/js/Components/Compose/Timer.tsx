type Props = {
    mins: number;
    secs: number;
    running: boolean;
    onToggle: () => void;
};

/** Calm countdown. Pulsing dot when running; clicking pauses. Never ends the
 *  session — at 00:00 it just stops pulsing (handoff §6.2, §11). */
export default function Timer({ mins, secs, running, onToggle }: Props) {
    return (
        <button
            onClick={onToggle}
            style={{
                appearance: 'none',
                cursor: 'pointer',
                background: 'transparent',
                padding: '4px 10px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '0.5px solid var(--hairline)',
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: running ? 'var(--signal)' : 'var(--ink-3)',
                    animation: running ? 'pulseDot 2s ease-in-out infinite' : 'none',
                }}
            />
            <span className="num" style={{ fontSize: 14 }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
        </button>
    );
}

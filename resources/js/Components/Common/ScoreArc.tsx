type Props = {
    value: number;
    max?: number;
    label?: string;
    size?: number;
};

/** 4-dimension scoring viz — a single ring with the value at center. */
export default function ScoreArc({ value, max = 100, label, size = 92 }: Props) {
    const r = size / 2 - 4;
    const c = 2 * Math.PI * r;
    const dash = (value / max) * c;
    // Scale the centered numerals with the ring so 56px and 140px both read well.
    const valueSize = Math.max(13, Math.round(size * 0.24));
    const subSize = Math.max(7, Math.round(size * 0.092));

    return (
        <div className="col gap-2 center" style={{ width: size }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline)" strokeWidth="1.5" />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke="var(--ink)"
                        strokeWidth="1.5"
                        strokeDasharray={`${dash} ${c}`}
                        strokeLinecap="round"
                    />
                </svg>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                    }}
                >
                    <span className="num" style={{ fontSize: valueSize, letterSpacing: '-0.02em' }}>
                        {value}
                    </span>
                    <span className="label-mono" style={{ fontSize: subSize, marginTop: -2, opacity: 0.55 }}>
                        / {max}
                    </span>
                </div>
            </div>
            {label ? (
                <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                    {label}
                </div>
            ) : null}
        </div>
    );
}

import type { ScorePoint } from '@/lib/types';

type Props = {
    history: ScorePoint[];
    width?: number;
    height?: number;
    color?: string;
};

/** SVG polyline sparkline. Renders nothing if fewer than 2 data points. */
export default function ScoreSparkline({ history, width = 200, height = 52, color = 'var(--ink-2)' }: Props) {
    if (history.length < 2) {
        return (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                Write two essays to see your score trend.
            </p>
        );
    }

    const scores = history.map((h) => h.score);
    const min = Math.max(0, Math.min(...scores) - 8);
    const max = Math.min(100, Math.max(...scores) + 8);
    const range = max - min || 1;

    const points = history
        .map((h, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - ((h.score - min) / range) * height;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    const last = history[history.length - 1];
    const first = history[0];
    const delta = last.score - first.score;
    const deltaColor = delta > 0 ? 'var(--progress)' : delta < 0 ? 'var(--signal)' : 'var(--ink-3)';

    // Dot at last point
    const lastX = width;
    const lastY = height - ((last.score - min) / range) * height;

    return (
        <div>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ overflow: 'visible', display: 'block' }}
            >
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity="0.6"
                />
                <circle cx={lastX} cy={lastY} r="3" fill={color} opacity="0.9" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 9.5, fontFamily: 'var(--serif)', color: 'var(--ink-4)' }}>
                    {first.date}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--serif)', color: deltaColor, letterSpacing: '-0.01em' }}>
                    {delta > 0 ? '+' : ''}{delta} pts
                </span>
                <span style={{ fontSize: 9.5, fontFamily: 'var(--serif)', color: 'var(--ink-4)' }}>
                    {last.date}
                </span>
            </div>
        </div>
    );
}

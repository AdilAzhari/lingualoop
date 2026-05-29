import type { StratiLayer as StratiLayerData } from '@/lib/types';

const STATUS_COLOR: Record<StratiLayerData['status'], string> = {
    active: 'var(--signal)',
    improving: 'var(--pencil)',
    resolved: 'var(--progress)',
};

type Props = {
    layer: StratiLayerData;
};

/** One row of the stratigraphy: name/code · 12-week SVG histogram · peak/status.
 *  Most-recent bar colored by status; older bars are faint ink-4. */
export default function StratiLayer({ layer }: Props) {
    const { display_name, code, weeks, peak, status } = layer;
    const statusColor = STATUS_COLOR[status];
    const n = weeks.length;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr 100px',
                alignItems: 'center',
                gap: 20,
                padding: '14px 0',
                borderTop: '0.5px solid var(--hairline)',
            }}
        >
            <div className="col gap-1">
                <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic' }}>{display_name}</div>
                <div className="label-mono" style={{ fontSize: 9.5 }}>
                    {code}
                </div>
            </div>

            <div style={{ position: 'relative', height: 36 }}>
                <svg width="100%" height="36" preserveAspectRatio="none" viewBox={`0 0 ${n} 36`}>
                    <line x1="0" y1="35.5" x2={n} y2="35.5" stroke="var(--hairline)" strokeWidth=".5" />
                    {weeks.map((bin, i) => {
                        const h = bin.intensity * 30;
                        const isLast = i === n - 1;
                        return (
                            <rect
                                key={i}
                                x={i + 0.15}
                                y={35 - h}
                                width={0.7}
                                height={h}
                                fill={isLast ? statusColor : 'var(--ink-4)'}
                                opacity={isLast ? 1 : 0.55}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="col gap-1" style={{ alignItems: 'flex-end' }}>
                <div className="num" style={{ fontSize: 13 }}>
                    {peak}
                </div>
                <div className="label-mono" style={{ fontSize: 9.5, color: statusColor }}>
                    {status}
                </div>
            </div>
        </div>
    );
}

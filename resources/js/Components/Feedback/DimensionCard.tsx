import ScoreArc from '@/Components/Common/ScoreArc';

type Props = {
    label: string;
    value: number;
    note: string;
};

/** One of the four dimension cards: italic serif label + 56px arc + coach line. */
export default function DimensionCard({ label, value, note }: Props) {
    return (
        <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic' }}>{label}</span>
                <ScoreArc value={value} size={56} />
            </div>
            <div className="marginalia" style={{ fontSize: 13, lineHeight: 1.45 }}>
                {note}
            </div>
        </div>
    );
}

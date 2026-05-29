import { toBand } from '@/lib/band';

/** Shows a score as "74 · Band 6.5" inline chip. */
export default function BandBadge({ score, label }: { score: number; label?: string }) {
    const band = toBand(score);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="chip" style={{ fontSize: 11, background: 'var(--paper-3)', gap: 6 }}>
                <span className="num" style={{ fontSize: 13 }}>{score}</span>
                <span style={{ color: 'var(--ink-4)' }}>·</span>
                <span style={{ fontWeight: 600 }}>Band {band}</span>
            </div>
            {label && <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{label}</span>}
        </div>
    );
}

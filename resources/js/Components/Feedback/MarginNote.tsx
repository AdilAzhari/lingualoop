import { severityColor } from '@/lib/tokens';
import type { ErrorInstance } from '@/lib/types';

const DIM_LABEL: Record<ErrorInstance['dimension'], string> = {
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    coherence: 'Coherence',
    task: 'Task',
};

type Props = {
    error: ErrorInstance;
    selected: boolean;
    /** True when some OTHER mark is selected — this one dims to 0.45. */
    dimmed: boolean;
    isFirst: boolean;
    onToggle: () => void;
};

/** One pencil mark card in the margin panel: span → fix, code, and the
 *  coach's full-sentence note. Left rule colored by severity. */
export default function MarginNote({ error, dimmed, isFirst, onToggle }: Props) {
    const color = severityColor(error.severity);
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle();
                }
            }}
            style={{
                paddingLeft: 14,
                paddingTop: isFirst ? 0 : 14,
                paddingBottom: 14,
                borderLeft: `1px ${error.severity === 'good' ? 'solid' : 'dotted'} ${color}`,
                opacity: dimmed ? 0.45 : 1,
                cursor: 'pointer',
                transition: 'opacity .2s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic' }}>
                    "{error.span_text}" → <span style={{ color, fontStyle: 'normal' }}>{error.suggested_fix}</span>
                </span>
                <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-3)' }}>
                    {DIM_LABEL[error.dimension]}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="label-mono" style={{ fontSize: 9, color }}>{error.type}</span>
                {error.recent_count && error.recent_count > 1 && (
                    <span style={{
                        fontSize: 9, fontFamily: 'var(--serif)', fontStyle: 'italic',
                        color: 'var(--signal)', background: 'var(--signal-wash)',
                        padding: '1px 6px', borderRadius: 99,
                    }}>
                        {error.recent_count}× in 14 days
                    </span>
                )}
            </div>
            <div className="marginalia" style={{ fontSize: 13, lineHeight: 1.5 }}>
                {error.note}
            </div>
        </div>
    );
}

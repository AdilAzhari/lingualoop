import { severityColor, severityWash } from '@/lib/tokens';
import type { Severity } from '@/lib/types';

type Props = {
    text: string;
    severity: Severity;
    selected: boolean;
    /** True when some OTHER span is selected — this one dims. */
    dimmed: boolean;
    onToggle: () => void;
};

/** An inline error mark inside the essay. Solid underline for `good`, dotted
 *  otherwise. Click toggles selection; selected gets a wash background. */
export default function AnnotatedSpan({ text, severity, selected, dimmed, onToggle }: Props) {
    const color = severityColor(severity);
    const bg = severityWash(severity);
    return (
        <span
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
                background: selected ? bg : 'transparent',
                borderBottom: `1.5px ${severity === 'good' ? 'solid' : 'dotted'} ${color}`,
                cursor: 'pointer',
                padding: '1px 2px',
                borderRadius: 2,
                opacity: dimmed ? 0.45 : 1,
                transition: 'background .15s ease, opacity .2s ease',
                position: 'relative',
            }}
        >
            {text}
        </span>
    );
}

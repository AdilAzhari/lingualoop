import Eyebrow from '@/Components/Typography/Eyebrow';
import MarginNote from './MarginNote';
import type { ErrorInstance } from '@/lib/types';

type Props = {
    errors: ErrorInstance[];
    selected: string | null;
    onSelect: (id: string | null) => void;
};

/** Sticky vertical list of pencil marks. Shares `selected` state with the
 *  essay — clicking a mark focuses its span and vice versa. */
export default function MarginPanel({ errors, selected, onSelect }: Props) {
    return (
        <div style={{ position: 'sticky', top: 100 }}>
            <Eyebrow style={{ marginBottom: 16 }}>Marks in the margin</Eyebrow>
            <div className="col" style={{ gap: 0 }}>
                {errors.map((err, i) => (
                    <MarginNote
                        key={err.id}
                        error={err}
                        isFirst={i === 0}
                        selected={selected === err.id}
                        dimmed={selected !== null && selected !== err.id}
                        onToggle={() => onSelect(selected === err.id ? null : err.id)}
                    />
                ))}
            </div>
        </div>
    );
}

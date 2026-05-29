import { useMemo } from 'react';
import AnnotatedSpan from './AnnotatedSpan';
import type { ErrorInstance } from '@/lib/types';

type Props = {
    text: string;
    errors: ErrorInstance[];
    selected: string | null;
    onSelect: (id: string | null) => void;
};

type Segment =
    | { kind: 'text'; value: string }
    | { kind: 'error'; value: string; error: ErrorInstance };

/** Splits the raw submission text into plain + annotated segments using each
 *  error's character offsets, preserving paragraph breaks. The prototype
 *  hard-coded segments; production slices `text` by span_start/span_end. */
function segmentParagraph(paragraph: string, offset: number, errors: ErrorInstance[]): Segment[] {
    const within = errors
        .filter((e) => e.span_start >= offset && e.span_start < offset + paragraph.length)
        .sort((a, b) => a.span_start - b.span_start);

    const segments: Segment[] = [];
    let cursor = 0; // local index into paragraph
    for (const err of within) {
        const localStart = err.span_start - offset;
        const localEnd = err.span_end - offset;
        if (localStart > cursor) {
            segments.push({ kind: 'text', value: paragraph.slice(cursor, localStart) });
        }
        segments.push({ kind: 'error', value: paragraph.slice(localStart, localEnd), error: err });
        cursor = localEnd;
    }
    if (cursor < paragraph.length) {
        segments.push({ kind: 'text', value: paragraph.slice(cursor) });
    }
    return segments;
}

export default function Essay({ text, errors, selected, onSelect }: Props) {
    const wordCount = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);

    // Split on blank lines into paragraphs, tracking running char offset so
    // error offsets map correctly across paragraph boundaries.
    const paragraphs = useMemo(() => {
        const result: { value: string; offset: number }[] = [];
        let offset = 0;
        const parts = text.split('\n\n');
        parts.forEach((p, i) => {
            result.push({ value: p, offset });
            offset += p.length;
            if (i < parts.length - 1) offset += 2; // the "\n\n" separator
        });
        return result;
    }, [text]);

    return (
        <div
            style={{
                background: 'oklch(0.99 0.008 80 / .5)',
                border: '0.5px solid var(--hairline)',
                borderRadius: 'var(--r-3)',
                padding: '44px 56px',
            }}
        >
            <div className="label-mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 24 }}>
                your text · {wordCount} words · {errors.length} marks
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.7 }}>
                {paragraphs.map((para, pi) => {
                    const segments = segmentParagraph(para.value, para.offset, errors);
                    return (
                        <p key={pi} style={{ margin: '0 0 22px' }}>
                            {segments.map((seg, si) =>
                                seg.kind === 'text' ? (
                                    <span key={si}>{seg.value}</span>
                                ) : (
                                    <AnnotatedSpan
                                        key={si}
                                        text={seg.value}
                                        severity={seg.error.severity}
                                        selected={selected === seg.error.id}
                                        dimmed={selected !== null && selected !== seg.error.id}
                                        onToggle={() => onSelect(selected === seg.error.id ? null : seg.error.id)}
                                    />
                                ),
                            )}
                        </p>
                    );
                })}
            </div>
        </div>
    );
}

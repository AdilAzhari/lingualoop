import { useMemo } from 'react';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';

type ObserveTone = 'ok' | 'warn' | 'neutral';

function Observe({ label, value, note, tone }: { label: string; value: React.ReactNode; note: string; tone: ObserveTone }) {
    const color = tone === 'warn' ? 'var(--signal)' : tone === 'ok' ? 'var(--progress)' : 'var(--ink-3)';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic' }}>{label}</span>
                <span className="num" style={{ fontSize: 12, color }}>{value}</span>
            </div>
            <Marginalia style={{ fontSize: 12, lineHeight: 1.4 }}>{note}</Marginalia>
        </div>
    );
}

/** Mini bar chart of sentence lengths — shows rhythm at a glance. */
function SentenceBars({ lengths }: { lengths: number[] }) {
    if (lengths.length === 0) {
        return <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>—</span>;
    }
    const max = Math.max(...lengths);
    return (
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 18 }}>
            {lengths.map((len, i) => (
                <div
                    key={i}
                    title={`${len} words`}
                    style={{
                        width: 4,
                        flexShrink: 0,
                        height: Math.max(3, Math.round((len / max) * 18)),
                        background: 'var(--ink-3)',
                        borderRadius: '1px 1px 0 0',
                        opacity: 0.65,
                    }}
                />
            ))}
        </div>
    );
}

const PREP_RE    = /\b(at|in|on|to|of|for|with|by|from|about|over|under|into)\b/gi;
const ARTICLE_RE = /\b(a|an|the)\b/gi;

type Props = { text: string; focusLabel: string };

export default function FocusSidebar({ text, focusLabel }: Props) {
    const prepCount    = useMemo(() => (text.match(PREP_RE)    || []).length, [text]);
    const articleCount = useMemo(() => (text.match(ARTICLE_RE) || []).length, [text]);

    const sentences = useMemo(() =>
        text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean),
    [text]);

    const sentenceLengths = useMemo(() =>
        sentences.map(s => s.split(/\s+/).filter(Boolean).length).filter(l => l > 0),
    [sentences]);

    const meanSentence = useMemo(() => {
        if (sentenceLengths.length === 0) return 0;
        return Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length);
    }, [sentenceLengths]);

    const varietyNote = useMemo(() => {
        if (sentenceLengths.length < 3) return 'write more to see the pattern';
        const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        const cv = Math.sqrt(
            sentenceLengths.reduce((acc, l) => acc + (l - mean) ** 2, 0) / sentenceLengths.length
        ) / mean;
        if (cv < 0.2) return 'similar lengths — try varying';
        if (cv < 0.4) return 'decent rhythm';
        return 'strong variety — good mix';
    }, [sentenceLengths]);

    const meanTone = useMemo((): ObserveTone => {
        if (meanSentence === 0) return 'neutral';
        if (meanSentence > 30) return 'warn';
        if (meanSentence < 8)  return 'warn';
        return 'ok';
    }, [meanSentence]);

    const meanNote = useMemo(() => {
        if (meanSentence === 0) return 'write more to measure';
        if (meanSentence > 30) return 'quite long — consider splitting';
        if (meanSentence < 8)  return 'very short — may lack development';
        return 'healthy range for IELTS argument';
    }, [meanSentence]);

    return (
        <div className="col gap-5">
            <div>
                <Eyebrow style={{ marginBottom: 10 }}>Today's focus</Eyebrow>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--signal-wash)',
                    borderRadius: 'var(--r-2)',
                    border: '0.5px solid var(--signal-soft)',
                }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'oklch(0.30 0.13 35)' }}>
                        {focusLabel}
                    </div>
                    <Marginalia style={{ fontSize: 13, marginTop: 4, color: 'oklch(0.30 0.13 35)' }}>
                        You've used <span className="num">{prepCount}</span> so far. I'll flag the ones that need a second
                        look — but only after you're done.
                    </Marginalia>
                </div>
            </div>

            <div>
                <Eyebrow style={{ marginBottom: 10 }}>Quiet observations</Eyebrow>
                <div className="col gap-3">
                    <Observe
                        label="Articles"
                        value={articleCount}
                        note="healthy density for this length"
                        tone="ok"
                    />
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic' }}>
                                Sentence rhythm
                            </span>
                        </div>
                        <SentenceBars lengths={sentenceLengths} />
                        <Marginalia style={{ fontSize: 12, lineHeight: 1.4, marginTop: 4 }}>{varietyNote}</Marginalia>
                    </div>
                    <Observe
                        label="Mean length"
                        value={meanSentence > 0 ? `${meanSentence} words` : '—'}
                        note={meanNote}
                        tone={meanTone}
                    />
                </div>
            </div>

            <Marginalia style={{ fontSize: 13, lineHeight: 1.5, paddingTop: 16, borderTop: '0.5px dashed var(--hairline)' }}>
                Don't let me distract you. I'm here when you submit. Write the thing you actually want to say, even if
                it's untidy — we can polish later.
            </Marginalia>
        </div>
    );
}

import { useState } from 'react';
import { severityColor } from '@/lib/tokens';
import type { ErrorInstance } from '@/lib/types';

type RuleData = { explanation: string; wrong: string; right: string; tip: string };
type RuleState = 'idle' | 'loading' | 'loaded' | 'error';

const ruleCache: Record<string, RuleData> = {};
let ruleLoadPromise: Promise<void> | null = null;

async function loadRules(): Promise<void> {
    if (Object.keys(ruleCache).length > 0) return;
    const res = await fetch('/glossary/json');
    const data: Record<string, RuleData> = await res.json();
    Object.assign(ruleCache, data);
}

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
    const [ruleState, setRuleState] = useState<RuleState>('idle');
    const [rule, setRule] = useState<RuleData | null>(null);
    const [expanded, setExpanded] = useState(false);

    async function toggleRule(e: React.MouseEvent) {
        e.stopPropagation();
        if (expanded) { setExpanded(false); return; }
        if (rule) { setExpanded(true); return; }
        setRuleState('loading');
        try {
            if (!ruleLoadPromise) ruleLoadPromise = loadRules();
            await ruleLoadPromise;
            const found = ruleCache[error.type] ?? null;
            setRule(found);
            setRuleState(found ? 'loaded' : 'error');
            setExpanded(!!found);
        } catch { setRuleState('error'); }
    }
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

            {/* Why? expandable rule */}
            {error.severity !== 'good' && (
                <div style={{ marginTop: 8 }}>
                    <button
                        onClick={toggleRule}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono, monospace)', fontSize: 9.5, color: 'var(--ink-4)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        {ruleState === 'loading' ? '…' : (expanded ? '▾ Hide rule' : '▸ Why?')}
                    </button>
                    {expanded && rule && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--paper-2)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>
                                {rule.explanation}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                <div style={{ background: 'var(--signal-wash)', borderRadius: 4, padding: '6px 8px' }}>
                                    <div className="label-mono" style={{ fontSize: 8.5, color: 'var(--signal)', marginBottom: 3 }}>✗</div>
                                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-2)', margin: 0 }}>{rule.wrong}</p>
                                </div>
                                <div style={{ background: 'var(--progress-wash)', borderRadius: 4, padding: '6px 8px' }}>
                                    <div className="label-mono" style={{ fontSize: 8.5, color: 'var(--progress)', marginBottom: 3 }}>✓</div>
                                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11.5, color: 'var(--ink-2)', margin: 0 }}>{rule.right}</p>
                                </div>
                            </div>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>
                                <strong style={{ fontWeight: 500 }}>Tip:</strong> {rule.tip}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

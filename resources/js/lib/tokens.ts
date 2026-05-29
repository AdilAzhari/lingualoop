// Re-exports of CSS custom-property references, for use in inline styles where
// a Tailwind class doesn't fit (e.g. SVG fills, dynamic severity colors).
// These are strings like "var(--ink)" — they resolve against app.css :root.
import type { Severity } from './types';

export const color = {
    paper: 'var(--paper)',
    paper2: 'var(--paper-2)',
    paper3: 'var(--paper-3)',
    ink: 'var(--ink)',
    ink2: 'var(--ink-2)',
    ink3: 'var(--ink-3)',
    ink4: 'var(--ink-4)',
    hairline: 'var(--hairline)',
    hairline2: 'var(--hairline-2)',
    signal: 'var(--signal)',
    signalSoft: 'var(--signal-soft)',
    signalWash: 'var(--signal-wash)',
    progress: 'var(--progress)',
    progressSoft: 'var(--progress-soft)',
    progressWash: 'var(--progress-wash)',
    pencil: 'var(--pencil)',
    pencilWash: 'var(--pencil-wash)',
} as const;

export const radius = {
    r1: 'var(--r-1)',
    r2: 'var(--r-2)',
    r3: 'var(--r-3)',
    r4: 'var(--r-4)',
    pill: '999px',
} as const;

// Deep, saturated terracotta/sage tones used for text on washed backgrounds.
// These are intentionally darker than --signal/--progress for AA contrast.
export const deep = {
    signalText: 'oklch(0.28 0.13 35)',
    signalEyebrow: 'oklch(0.40 0.13 35)',
    signalLead: 'oklch(0.34 0.13 35)',
    signalChip: 'oklch(0.36 0.13 35)',
    signalButton: 'oklch(0.28 0.13 35)',
    progressText: 'oklch(0.34 0.09 140)',
} as const;

/** Severity → stroke/underline color (CSS var reference). */
export function severityColor(sev: Severity): string {
    if (sev === 'good') return color.progress;
    if (sev === 'high') return color.signal;
    return color.pencil;
}

/** Severity → wash background (CSS var reference). */
export function severityWash(sev: Severity): string {
    if (sev === 'good') return color.progressWash;
    if (sev === 'high') return color.signalWash;
    return color.pencilWash;
}

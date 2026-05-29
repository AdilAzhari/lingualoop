import { usePage } from '@inertiajs/react';
import Topbar from './Topbar';
import type { SharedProps, GeminiUsage } from '@/lib/types';

type Props = {
    chrome?: boolean;
    children: React.ReactNode;
};

function pct(used: number, limit: number) {
    return limit > 0 ? (used / limit) * 100 : 0;
}

function UsageBanner({ usage }: { usage: GeminiUsage }) {
    const reqPct  = pct(usage.requests_today, usage.limit_req_day);
    const tokPct  = pct(usage.tokens_today,   usage.limit_tok_day);
    const minPct  = pct(usage.requests_min,   usage.limit_req_min);
    const worst   = Math.max(reqPct, tokPct, minPct);

    if (worst < 70) return null;

    const danger  = worst >= 90;
    const bg      = danger ? 'oklch(0.96 0.08 25)' : 'oklch(0.97 0.07 70)';
    const color   = danger ? 'oklch(0.42 0.18 25)' : 'oklch(0.45 0.14 60)';

    const parts: string[] = [];
    if (reqPct >= 70) parts.push(`${usage.requests_today}/${usage.limit_req_day} req today`);
    if (tokPct >= 70) parts.push(`${(usage.tokens_today / 1000).toFixed(0)}k/${usage.limit_tok_day / 1000}k tokens`);
    if (minPct >= 70) parts.push(`${usage.requests_min}/${usage.limit_req_min} req/min`);

    const label = danger ? 'Gemini free tier almost full' : 'Gemini free tier high usage';

    return (
        <div style={{
            background: bg,
            borderBottom: `0.5px solid ${color}`,
            padding: '6px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
        }}>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color }}>
                {label}
            </span>
            <span className="label-mono" style={{ fontSize: 10, color, opacity: 0.8 }}>
                {parts.join(' · ')}
            </span>
        </div>
    );
}

export default function AppShell({ chrome = true, children }: Props) {
    const { props } = usePage<SharedProps>();

    return (
        <div className="app">
            {chrome && <Topbar />}
            {chrome && props.gemini_usage && <UsageBanner usage={props.gemini_usage} />}
            {children}
        </div>
    );
}

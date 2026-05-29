import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Pulse from '@/Components/Common/Pulse';
import { Ico } from '@/Components/Common/icons';
import type { GradingPageProps } from '@/lib/types';

const PHASES = [
    { label: 'Reading once through, the way a person would', hint: 'no marks yet' },
    { label: 'Reading again — noticing patterns, weighing structure', hint: 'taxonomy v3.2' },
    { label: 'Cross-referencing with your error profile', hint: '17 prior submissions' },
    { label: 'Drafting feedback in the margin', hint: 'almost ready' },
];

// Window typing for an optional Echo instance (present only when Reverb is set up).
declare global {
    interface Window {
        Echo?: {
            private: (channel: string) => {
                listen: (event: string, cb: (payload: unknown) => void) => unknown;
            };
            leave: (channel: string) => void;
        };
    }
}

export default function Grading({ submission_id, channel }: GradingPageProps) {
    const [phase, setPhase] = useState(0);
    const done = useRef(false);

    function finish() {
        if (done.current) return;
        done.current = true;
        router.visit(`/submissions/${submission_id}`);
    }

    // Realtime via Reverb when available; otherwise poll the status endpoint.
    useEffect(() => {
        const echo = window.Echo;

        if (echo) {
            const ch = echo.private(channel);
            ch.listen('.Grading\\PhaseAdvanced', (e: unknown) => {
                const p = (e as { phase?: number })?.phase;
                if (typeof p === 'number') setPhase(p);
            });
            ch.listen('.Grading\\Completed', () => finish());
            return () => echo.leave(channel);
        }

        // Fallback: poll every 2s (handoff §6.3, §10.5).
        const id = setInterval(async () => {
            try {
                const res = await fetch(`/submissions/${submission_id}/status`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return;
                const data: { status: string; phase?: number } = await res.json();
                if (typeof data.phase === 'number') setPhase(data.phase);
                if (data.status === 'graded') {
                    clearInterval(id);
                    finish();
                }
            } catch {
                /* transient — keep polling */
            }
        }, 2000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submission_id, channel]);

    return (
        <AppShell chrome={false}>
            <Head title="Grading" />
            <Page full style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="col gap-10 center" style={{ maxWidth: 600, padding: '0 32px', textAlign: 'center' }}>
                    <Pulse />

                    <div className="col gap-3 center">
                        <Eyebrow>Now grading</Eyebrow>
                        <h2 className="display" style={{ fontSize: 36, margin: 0, fontWeight: 400, lineHeight: 1.15 }}>
                            <em style={{ fontWeight: 300, color: 'var(--ink-2)' }}>Give me a moment. I want to read this twice.</em>
                        </h2>
                    </div>

                    <div className="col gap-3" style={{ width: '100%', maxWidth: 460, textAlign: 'left' }}>
                        {PHASES.map((p, i) => {
                            const isDone = i < phase;
                            const active = i === phase;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '24px 1fr auto',
                                        gap: 12,
                                        alignItems: 'baseline',
                                        opacity: i > phase ? 0.35 : 1,
                                        transition: 'opacity .4s ease',
                                    }}
                                >
                                    <div style={{ position: 'relative', top: 2 }}>
                                        {isDone ? (
                                            <span style={{ color: 'var(--progress)' }}>
                                                <Ico.check />
                                            </span>
                                        ) : active ? (
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 999,
                                                    background: 'var(--signal)',
                                                    animation: 'pulseDot 1.4s ease-in-out infinite',
                                                    marginLeft: 3,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 999,
                                                    border: '0.5px solid var(--hairline)',
                                                    marginLeft: 3,
                                                }}
                                            />
                                        )}
                                    </div>
                                    <span
                                        style={{
                                            fontFamily: 'var(--serif)',
                                            fontSize: 16,
                                            fontStyle: isDone ? 'normal' : 'italic',
                                            color: isDone ? 'var(--ink-2)' : 'var(--ink)',
                                        }}
                                    >
                                        {p.label}
                                    </span>
                                    <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>
                                        {p.hint}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="marginalia" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                        Usually 8–12 seconds. Feel free to step away.
                    </div>
                </div>
            </Page>
        </AppShell>
    );
}

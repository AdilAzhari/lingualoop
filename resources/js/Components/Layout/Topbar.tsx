import { Link, usePage } from '@inertiajs/react';
import { Ico } from '@/Components/Common/icons';
import { useDarkMode } from '@/lib/useDarkMode';
import type { SharedProps } from '@/lib/types';

const NAV = [
    { label: 'Today',    href: '/' },
    { label: 'Write',    href: '/compose' },
    { label: 'Read',     href: '/reading' },
    { label: 'Listen',   href: '/listening' },
    { label: 'Speak',    href: '/speaking' },
    { label: 'Images',   href: '/images' },
    { label: 'SE',       href: '/software' },
    { label: 'Brand',    href: '/brand' },
    { label: 'Video',    href: '/video' },
    { label: 'Mock',     href: '/mock' },
    { label: 'Drill',    href: '/drill' },
    { label: 'Profile',  href: '/profile' },
    { label: 'Vocab',    href: '/vocabulary' },
    { label: 'Studio',   href: '/dashboard' },
];

function isActive(current: string, href: string): boolean {
    const path = current.split('?')[0];
    if (href === '/') return path === '/';
    return path === href || path.startsWith(href + '/');
}

/** Sticky, paper-translucent topbar with the wordmark, nav, streak + avatar.
 *  No sidebar nav — the topbar nav is intentional (handoff §11). */
function MoonIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
        </svg>
    );
}

export default function Topbar() {
    const page = usePage<SharedProps>();
    const url = page.url;
    const user = page.props.auth?.user;
    const streakDays = page.props.streak?.current_days ?? user?.streak_days ?? 0;
    const [dark, toggleDark] = useDarkMode();

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '0.5px solid var(--hairline)',
                background: 'oklch(0.965 0.012 80 / .82)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            }}
        >
            <div
                style={{
                    maxWidth: 1240,
                    margin: '0 auto',
                    padding: '14px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    minWidth: 0,
                }}
            >
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 21, letterSpacing: '-0.01em' }}>
                        Lingua
                        <span style={{ fontStyle: 'italic', color: 'var(--signal)', fontWeight: 400 }}>loop</span>
                    </span>
                    <span className="label-mono" style={{ fontSize: 9.5, opacity: 0.55 }}>
                        β · {user?.level ?? 'b2'} track
                    </span>
                </Link>

                <nav style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {NAV.map((n) => {
                        const active = isActive(url, n.href);
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                style={{
                                    textDecoration: 'none',
                                    fontFamily: 'var(--serif)',
                                    fontSize: 14.5,
                                    padding: '8px 14px',
                                    borderRadius: 999,
                                    color: active ? 'var(--ink)' : 'var(--ink-3)',
                                    fontWeight: active ? 500 : 400,
                                    fontStyle: active ? 'italic' : 'normal',
                                    position: 'relative',
                                }}
                            >
                                {n.label}
                                {active && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            bottom: 2,
                                            transform: 'translateX(-50%)',
                                            width: 4,
                                            height: 4,
                                            borderRadius: 999,
                                            background: 'var(--signal)',
                                        }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="chip" style={{ gap: 5 }}>
                        <Ico.flame style={{ color: 'var(--signal)' }} /> <span className="num">{streakDays}</span> day streak
                    </span>

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDark}
                        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                        style={{
                            background: 'none',
                            border: '0.5px solid var(--hairline)',
                            borderRadius: 999,
                            cursor: 'pointer',
                            color: 'var(--ink-3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30,
                            padding: 0,
                            transition: 'color .15s, border-color .15s',
                        }}
                    >
                        {dark ? <SunIcon /> : <MoonIcon />}
                    </button>

                    <div
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 999,
                            background: 'var(--paper-3)',
                            border: '0.5px solid var(--hairline)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--serif)',
                            fontSize: 13,
                            fontStyle: 'italic',
                        }}
                    >
                        {user?.initial ?? 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
}

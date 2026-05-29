import { Link } from '@inertiajs/react';
import Eyebrow from '@/Components/Typography/Eyebrow';

type Props = {
    label: React.ReactNode;
    /** Optional right-aligned action link, e.g. "See all". */
    action?: string;
    href?: string;
};

/** Eyebrow section label with an optional right-aligned italic action link. */
export default function SectionHeader({ label, action, href }: Props) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <Eyebrow style={{ margin: 0 }}>{label}</Eyebrow>
            {action && href && (
                <Link
                    href={href}
                    style={{
                        textDecoration: 'none',
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: 'var(--ink-2)',
                    }}
                >
                    {action} →
                </Link>
            )}
        </div>
    );
}

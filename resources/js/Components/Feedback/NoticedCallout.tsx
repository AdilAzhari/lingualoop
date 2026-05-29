import { Link } from '@inertiajs/react';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Display from '@/Components/Typography/Display';
import Marginalia from '@/Components/Typography/Marginalia';
import { Ico } from '@/Components/Common/icons';
import { deep } from '@/lib/tokens';
import type { ErrorCode } from '@/lib/types';

type Props = {
    code: ErrorCode;
    /** The coach's headline, e.g. "You're swapping at, in, and on…". May
     *  contain emphasized words — pass as a node if you need <em>. */
    headline: React.ReactNode;
    weeklyCount: number;
    /** Where the drill button goes. */
    drillHref: string;
};

/** THE WEDGE. The terracotta-washed band where the coach says what it noticed.
 *  Do not shrink it, restyle it, or move it below the fold (handoff §6.4, §11). */
export default function NoticedCallout({ code, headline, weeklyCount, drillHref }: Props) {
    const ordinal = `${weeklyCount}${nth(weeklyCount)}`;
    return (
        <div
            style={{
                marginTop: 48,
                background: 'var(--signal-wash)',
                border: '0.5px solid var(--signal-soft)',
                borderRadius: 'var(--r-3)',
                padding: '24px 28px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
                <div>
                    <Eyebrow style={{ color: deep.signalEyebrow, marginBottom: 10 }}>I noticed something</Eyebrow>
                    <Display size="sm" as="h3" style={{ fontSize: 26, lineHeight: 1.2, color: deep.signalText, maxWidth: 700 }}>
                        {headline} This is the{' '}
                        <span className="num" style={{ fontStyle: 'normal', fontWeight: 500 }}>
                            {ordinal}
                        </span>{' '}
                        time this week — pattern{' '}
                        <span className="label-mono" style={{ fontSize: 13 }}>
                            {code}
                        </span>
                        .
                    </Display>
                    <Marginalia style={{ fontSize: 15, marginTop: 12, color: deep.signalLead, maxWidth: 700 }}>
                        Three sentences below show it. I've made a quick drill from your own examples — five minutes, real
                        sentences from your writing, not textbook ones.
                    </Marginalia>
                </div>
                <Link href={drillHref} className="btn" style={{ background: deep.signalButton }}>
                    Take the 5-minute drill <Ico.arrow />
                </Link>
            </div>
        </div>
    );
}

function nth(n: number): string {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    switch (n % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

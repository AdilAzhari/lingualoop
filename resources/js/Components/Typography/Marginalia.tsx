import { cn } from '@/lib/cn';

type Props = {
    /** Adds a pencil-grey vertical rule on one side, like a margin note. */
    side?: 'left' | 'right' | 'none';
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
};

/** Italic pencil-grey aside — the coach's marginalia voice. */
export default function Marginalia({ side = 'none', className, style, children }: Props) {
    const ruled: React.CSSProperties =
        side === 'left'
            ? { borderLeft: '1px solid var(--pencil)', paddingLeft: 14 }
            : side === 'right'
              ? { borderRight: '1px solid var(--pencil)', paddingRight: 14 }
              : {};
    return (
        <div className={cn('marginalia', className)} style={{ lineHeight: 1.45, ...ruled, ...style }}>
            {children}
        </div>
    );
}

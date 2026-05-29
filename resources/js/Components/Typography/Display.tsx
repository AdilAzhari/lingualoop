import { cn } from '@/lib/cn';

type Size = 'xl' | 'lg' | 'md' | 'sm';

const SIZES: Record<Size, React.CSSProperties> = {
    xl: { fontSize: 64, lineHeight: 1.05 },
    lg: { fontSize: 56, lineHeight: 1.05 },
    md: { fontSize: 36, lineHeight: 1.15 },
    sm: { fontSize: 30, lineHeight: 1.2 },
};

type Props = {
    size?: Size;
    as?: 'h1' | 'h2' | 'h3' | 'p';
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
};

/** Large serif heading. The serif is load-bearing — never swap for sans. */
export default function Display({ size = 'lg', as: Tag = 'h1', className, style, children }: Props) {
    return (
        <Tag className={cn('display', className)} style={{ margin: 0, fontWeight: 400, ...SIZES[size], ...style }}>
            {children}
        </Tag>
    );
}

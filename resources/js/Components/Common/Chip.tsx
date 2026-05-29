import { cn } from '@/lib/cn';

type Variant = 'default' | 'signal' | 'progress';

type Props = {
    variant?: Variant;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
};

const VARIANT_CLASS: Record<Variant, string> = {
    default: '',
    signal: 'chip-signal',
    progress: 'chip-progress',
};

/** Mono pill — pattern/win flags, taxonomy codes, status labels. */
export default function Chip({ variant = 'default', className, style, children }: Props) {
    return (
        <span className={cn('chip', VARIANT_CLASS[variant], className)} style={style}>
            {children}
        </span>
    );
}

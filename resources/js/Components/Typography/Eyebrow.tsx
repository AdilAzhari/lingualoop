import { cn } from '@/lib/cn';

type Props = {
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
};

/** Mono uppercase label with wide letterspacing. */
export default function Eyebrow({ className, style, children }: Props) {
    return (
        <div className={cn('eyebrow', className)} style={style}>
            {children}
        </div>
    );
}

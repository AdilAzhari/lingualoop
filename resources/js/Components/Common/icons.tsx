// Re-exports lucide-react with the project's hairline sizing defaults.
// The prototype used bespoke 16px hairline SVGs; these are the closest lucide
// equivalents, rendered at a thin stroke to keep the editorial feel.
import {
    PenLine,
    Sparkles,
    Layers,
    TrendingUp,
    Flame,
    Clock,
    ArrowRight,
    ArrowLeft,
    Check,
    X,
    type LucideProps,
} from 'lucide-react';

const HAIRLINE = 1.25;

function hairline(Icon: React.ComponentType<LucideProps>, defaultSize: number) {
    return function HairlineIcon({ size = defaultSize, strokeWidth = HAIRLINE, ...rest }: LucideProps) {
        return <Icon size={size} strokeWidth={strokeWidth} {...rest} />;
    };
}

// Names mirror the prototype's `Ico` map so screen code reads the same.
export const Ico = {
    pen: hairline(PenLine, 16),
    spark: hairline(Sparkles, 16),
    stack: hairline(Layers, 16),
    trend: hairline(TrendingUp, 16),
    flame: hairline(Flame, 14),
    clock: hairline(Clock, 14),
    arrow: hairline(ArrowRight, 14),
    arrowLeft: hairline(ArrowLeft, 14),
    check: hairline(Check, 14),
    close: hairline(X, 14),
};

export type IcoName = keyof typeof Ico;

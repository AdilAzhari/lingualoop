type Props = {
    /** 1240px max-width (compose, feedback). Default is 1040px. */
    wide?: boolean;
    /** Full-bleed, no padding (grading screen). */
    full?: boolean;
    style?: React.CSSProperties;
    children: React.ReactNode;
};

/** Centered content column. Page horizontal padding 32px; max-width 1040/1240. */
export default function Page({ wide, full, style, children }: Props) {
    return (
        <main
            style={{
                maxWidth: full ? '100%' : wide ? 1240 : 1040,
                margin: '0 auto',
                padding: full ? 0 : '40px 32px 96px',
                ...style,
            }}
        >
            {children}
        </main>
    );
}

import { forwardRef } from 'react';

type Props = {
    text: string;
    onChange: (value: string) => void;
};

/** Textarea on ruled paper. The lines are a CSS linear-gradient at 32px line
 *  height; the textarea has no border or focus outline. Body-lg 19/32 serif. */
const WritingSurface = forwardRef<HTMLTextAreaElement, Props>(function WritingSurface({ text, onChange }, ref) {
    return (
        <div
            className="writing-surface"
            style={{
                position: 'relative',
                background: 'oklch(0.99 0.008 80 / .5)',
                border: '0.5px solid var(--hairline)',
                borderRadius: 'var(--r-3)',
                padding: '40px 56px',
                minHeight: 560,
                backgroundImage:
                    'linear-gradient(to bottom, transparent 31px, var(--hairline-2) 31px, var(--hairline-2) 32px, transparent 32px)',
                backgroundSize: '100% 32px',
                backgroundPosition: '0 14px',
            }}
        >
            <textarea
                ref={ref}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                style={{
                    width: '100%',
                    border: 0,
                    outline: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--serif)',
                    fontSize: 19,
                    lineHeight: '32px',
                    color: 'var(--ink)',
                    resize: 'none',
                    minHeight: 560,
                    padding: 0,
                    fontFeatureSettings: '"ss01"',
                }}
            />
        </div>
    );
});

export default WritingSurface;

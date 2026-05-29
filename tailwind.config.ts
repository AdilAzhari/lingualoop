import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                paper: 'var(--paper)',
                'paper-2': 'var(--paper-2)',
                'paper-3': 'var(--paper-3)',
                ink: 'var(--ink)',
                'ink-2': 'var(--ink-2)',
                'ink-3': 'var(--ink-3)',
                'ink-4': 'var(--ink-4)',
                hairline: 'var(--hairline)',
                'hairline-2': 'var(--hairline-2)',
                signal: 'var(--signal)',
                'signal-soft': 'var(--signal-soft)',
                'signal-wash': 'var(--signal-wash)',
                progress: 'var(--progress)',
                'progress-soft': 'var(--progress-soft)',
                'progress-wash': 'var(--progress-wash)',
                pencil: 'var(--pencil)',
                'pencil-wash': 'var(--pencil-wash)',
            },
            fontFamily: {
                // Newsreader is the brand. Do NOT swap for a sans-serif.
                serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            borderRadius: {
                1: 'var(--r-1)',
                2: 'var(--r-2)',
                3: 'var(--r-3)',
                4: 'var(--r-4)',
            },
            boxShadow: {
                1: 'var(--shadow-1)',
                2: 'var(--shadow-2)',
            },
            maxWidth: {
                page: '1040px',
                wide: '1240px',
            },
            keyframes: {
                pulseDot: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' },
                },
            },
            animation: {
                pulseDot: 'pulseDot 2s ease-in-out infinite',
            },
        },
    },
    plugins: [],
} satisfies Config;

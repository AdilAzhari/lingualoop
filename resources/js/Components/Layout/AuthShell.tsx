import { Head } from '@inertiajs/react';

type Props = {
    title: string;
    lead?: string;
    children: React.ReactNode;
};

export default function AuthShell({ title, lead, children }: Props) {
    return (
        <>
            <Head title={title} />
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 24px',
                }}
            >
                {/* Wordmark */}
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <div
                        style={{
                            fontFamily: 'var(--serif)',
                            fontSize: 28,
                            fontWeight: 400,
                            letterSpacing: '-0.02em',
                            color: 'var(--ink)',
                        }}
                    >
                        LinguaLoop
                    </div>
                    {lead && (
                        <p
                            style={{
                                margin: '10px 0 0',
                                fontSize: 15,
                                color: 'var(--ink-2)',
                                fontFamily: 'var(--serif)',
                                fontStyle: 'italic',
                            }}
                        >
                            {lead}
                        </p>
                    )}
                </div>

                {/* Card */}
                <div
                    style={{
                        width: '100%',
                        maxWidth: 420,
                        background: 'var(--paper-2)',
                        border: '1px solid var(--hairline)',
                        borderRadius: 'var(--r-3)',
                        padding: '36px 32px',
                        boxShadow: 'var(--shadow-2)',
                    }}
                >
                    <h1
                        style={{
                            margin: '0 0 24px',
                            fontSize: 24,
                            fontWeight: 400,
                            fontFamily: 'var(--serif)',
                            color: 'var(--ink)',
                        }}
                    >
                        {title}
                    </h1>
                    {children}
                </div>
            </div>
        </>
    );
}

import { Link, useForm } from '@inertiajs/react';
import AuthShell from '@/Components/Layout/AuthShell';

type Props = { status?: string };

export default function VerifyEmail({ status }: Props) {
    const { post, processing } = useForm({});

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('verification.send'));
    }

    return (
        <AuthShell title="Verify your email">
            <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--ink-2)', fontFamily: 'var(--serif)', lineHeight: 1.6 }}>
                Thanks for signing up. Before you start, please verify your email address by clicking the link we sent you.
                If you didn't receive it, we can send another.
            </p>

            {status === 'verification-link-sent' && (
                <p style={{ marginBottom: 20, fontSize: 14, color: 'var(--progress)', fontFamily: 'var(--serif)' }}>
                    A fresh verification link has been sent to your email.
                </p>
            )}

            <form onSubmit={submit}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button type="submit" disabled={processing} style={btnStyle}>
                        {processing ? 'Sending…' : 'Resend link'}
                    </button>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        Sign out
                    </Link>
                </div>
            </form>
        </AuthShell>
    );
}

const btnStyle: React.CSSProperties = {
    padding: '9px 22px', fontSize: 15, fontFamily: 'var(--serif)', fontWeight: 400,
    color: 'var(--paper)', background: 'var(--ink)', border: 'none',
    borderRadius: 'var(--r-1)', cursor: 'pointer', letterSpacing: '-0.01em',
};

const linkStyle: React.CSSProperties = {
    fontSize: 14, color: 'var(--ink-2)', fontFamily: 'var(--serif)',
    textDecoration: 'underline', textUnderlineOffset: 3,
};

import { Link, useForm } from '@inertiajs/react';
import AuthShell from '@/Components/Layout/AuthShell';

type Props = { status?: string };

export default function ForgotPassword({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('password.email'));
    }

    return (
        <AuthShell title="Reset password" lead="We'll send a reset link to your email.">
            {status && (
                <p style={{ marginBottom: 20, fontSize: 14, color: 'var(--progress)', fontFamily: 'var(--serif)' }}>
                    {status}
                </p>
            )}

            <form onSubmit={submit}>
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--serif)' }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoFocus
                        style={inputStyle}
                    />
                    {errors.email && (
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--signal)', fontFamily: 'var(--serif)' }}>
                            {errors.email}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href={route('login')} style={linkStyle}>Back to sign in</Link>
                    <button type="submit" disabled={processing} style={btnStyle}>
                        {processing ? 'Sending…' : 'Send link'}
                    </button>
                </div>
            </form>
        </AuthShell>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 15, fontFamily: 'var(--serif)',
    color: 'var(--ink)', background: 'var(--paper)', border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-1)', outline: 'none', boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
    padding: '9px 22px', fontSize: 15, fontFamily: 'var(--serif)', fontWeight: 400,
    color: 'var(--paper)', background: 'var(--ink)', border: 'none',
    borderRadius: 'var(--r-1)', cursor: 'pointer', letterSpacing: '-0.01em',
};

const linkStyle: React.CSSProperties = {
    fontSize: 14, color: 'var(--ink-2)', fontFamily: 'var(--serif)',
    textDecoration: 'underline', textUnderlineOffset: 3,
};

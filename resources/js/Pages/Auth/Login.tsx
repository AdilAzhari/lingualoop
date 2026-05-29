import { Link, useForm } from '@inertiajs/react';
import AuthShell from '@/Components/Layout/AuthShell';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('login'));
    }

    return (
        <AuthShell title="Sign in" lead="Your writing coach is waiting.">
            {status && (
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--progress)', fontFamily: 'var(--serif)' }}>
                    {status}
                </p>
            )}

            <form onSubmit={submit}>
                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoFocus
                        autoComplete="username"
                        style={inputStyle}
                    />
                </Field>

                <Field label="Password" error={errors.password}>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                        style={inputStyle}
                    />
                </Field>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        style={{ accentColor: 'var(--signal)', width: 15, height: 15 }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--ink-2)', fontFamily: 'var(--serif)' }}>Remember me</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    {canResetPassword && (
                        <Link href={route('password.request')} style={linkStyle}>
                            Forgot password?
                        </Link>
                    )}
                    <button type="submit" disabled={processing} style={{ ...btnStyle, marginLeft: 'auto' }}>
                        {processing ? 'Signing in…' : 'Sign in'}
                    </button>
                </div>
            </form>

            <p style={{ margin: '24px 0 0', fontSize: 14, color: 'var(--ink-3)', fontFamily: 'var(--serif)', textAlign: 'center' }}>
                No account?{' '}
                <Link href={route('register')} style={linkStyle}>
                    Register
                </Link>
            </p>
        </AuthShell>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--serif)' }}>
                {label}
            </label>
            {children}
            {error && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--signal)', fontFamily: 'var(--serif)' }}>
                    {error}
                </p>
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: 15,
    fontFamily: 'var(--serif)',
    color: 'var(--ink)',
    background: 'var(--paper)',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--r-1)',
    outline: 'none',
    boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
    padding: '9px 22px',
    fontSize: 15,
    fontFamily: 'var(--serif)',
    fontWeight: 400,
    color: 'var(--paper)',
    background: 'var(--ink)',
    border: 'none',
    borderRadius: 'var(--r-1)',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
};

const linkStyle: React.CSSProperties = {
    fontSize: 14,
    color: 'var(--ink-2)',
    fontFamily: 'var(--serif)',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
};

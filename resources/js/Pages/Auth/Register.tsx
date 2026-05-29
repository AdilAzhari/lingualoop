import { Link, useForm } from '@inertiajs/react';
import AuthShell from '@/Components/Layout/AuthShell';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('register'));
    }

    return (
        <AuthShell title="Create account" lead="Start building your error profile.">
            <form onSubmit={submit}>
                <Field label="Name" error={errors.name}>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoFocus
                        autoComplete="name"
                        style={inputStyle}
                    />
                </Field>

                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        style={inputStyle}
                    />
                </Field>

                <Field label="Password" error={errors.password}>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        style={inputStyle}
                    />
                </Field>

                <Field label="Confirm password" error={errors.password_confirmation}>
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        style={inputStyle}
                    />
                </Field>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Link href={route('login')} style={linkStyle}>
                        Already registered?
                    </Link>
                    <button type="submit" disabled={processing} style={btnStyle}>
                        {processing ? 'Creating…' : 'Create account'}
                    </button>
                </div>
            </form>
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

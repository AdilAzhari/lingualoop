import { useForm } from '@inertiajs/react';
import AuthShell from '@/Components/Layout/AuthShell';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({ password: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('password.confirm'));
    }

    return (
        <AuthShell title="Confirm password">
            <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--ink-2)', fontFamily: 'var(--serif)', lineHeight: 1.6 }}>
                This is a secure area. Please confirm your password before continuing.
            </p>

            <form onSubmit={submit}>
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--serif)' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoFocus
                        autoComplete="current-password"
                        style={inputStyle}
                    />
                    {errors.password && (
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--signal)', fontFamily: 'var(--serif)' }}>
                            {errors.password}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={processing} style={btnStyle}>
                        {processing ? 'Confirming…' : 'Confirm'}
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

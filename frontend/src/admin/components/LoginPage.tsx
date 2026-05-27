import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { login, ApiError } from '../api.js';
import { setToken, setStoredEmail } from '../auth.js';
import { Btn, ErrorMsg, Field } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

export default function LoginPage() {
    const nav = useNavigate();
    const { t } = useTranslation();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await login(email, password);
            setToken(res.token);
            setStoredEmail(res.email);
            nav('/dashboard');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('auth.error'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: T.bg,
        }}>
            <div style={{
                background: T.surface, borderRadius: T.radiusLg,
                padding: '40px 36px', width: 380,
                boxShadow: '0 4px 20px oklch(0% 0 0 / 0.10)',
                border: `1px solid ${T.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h1 style={{ fontSize: T.font2xl, fontWeight: 700, flex: 1 }}>
                        {t('auth.appTitle')}
                    </h1>
                    <span style={{
                        background: T.primary, color: '#fff',
                        padding: '2px 7px', borderRadius: 4,
                        fontSize: T.fontXs, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>Admin</span>
                </div>
                <p style={{ color: T.textMuted, marginBottom: 28, fontSize: T.fontMd }}>
                    {t('auth.subtitle')}
                </p>
                <ErrorMsg msg={error} />
                <form onSubmit={e => { void handleSubmit(e); }}>
                    <Field
                        label={t('auth.emailLabel')} type="email" value={email}
                        onChange={setEmail} required placeholder={t('auth.emailPlaceholder')}
                    />
                    <Field
                        label={t('auth.passwordLabel')} type="password" value={password}
                        onChange={setPassword} required placeholder={t('auth.pwPlaceholder')}
                    />
                    <Btn type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                        {loading ? t('auth.signingIn') : t('auth.signIn')}
                    </Btn>
                </form>
            </div>
        </div>
    );
}

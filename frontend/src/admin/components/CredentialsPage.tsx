import React, { useEffect, useState } from 'react';
import {
    listCredentials, createCredential, deleteCredential,
    CredentialSummary, ApiError,
} from '../api.js';
import { PageTitle, Card, Btn, ErrorMsg, Field, Select, trHover } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

// アダプター固有のセマンティックカラー（ブランドカラーはテーマに含めない）
const ADAPTER_COLORS: Record<string, { bg: string; color: string }> = {
    http:     { bg: '#e0f2fe', color: '#0369a1' },
    email:    { bg: '#fef3c7', color: '#92400e' },
    slack:    { bg: '#f0fdf4', color: '#166534' },
    chatwork: { bg: '#fdf4ff', color: '#7e22ce' },
};

function AdapterBadge({ adapter }: { adapter: string }) {
    const { bg, color } = ADAPTER_COLORS[adapter] ?? { bg: T.badgeDraftBg, color: T.badgeDraftColor };
    return (
        <span style={{
            background: bg, color, padding: '2px 10px',
            borderRadius: T.radiusXl, fontSize: T.fontSm, fontWeight: 600,
        }}>
            {adapter}
        </span>
    );
}

export default function CredentialsPage() {
    const { t } = useTranslation();
    const [creds, setCreds]       = useState<CredentialSummary[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [name, setName]         = useState('');
    const [adapter, setAdapter]   = useState('http');
    const [saving, setSaving]     = useState(false);

    const adapterOptions = [
        { value: 'http',     label: t('credentials.adapter.http')     },
        { value: 'email',    label: t('credentials.adapter.email')    },
        { value: 'slack',    label: t('credentials.adapter.slack')    },
        { value: 'chatwork', label: t('credentials.adapter.chatwork') },
    ];

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listCredentials();
            setCreds(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('credentials.loadError'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await createCredential({ name, adapter });
            setName('');
            setAdapter('http');
            setShowForm(false);
            await load();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('credentials.saveError'));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number, credName: string) {
        if (!confirm(t('credentials.confirmDelete', { name: credName }))) return;
        try {
            await deleteCredential(id);
            setCreds(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert(err instanceof ApiError ? err.message : t('credentials.deleteError'));
        }
    }

    return (
        <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <PageTitle>{t('credentials.pageTitle')}</PageTitle>
                <Btn onClick={() => setShowForm(v => !v)}>
                    {showForm ? t('common.cancel') : t('common.add')}
                </Btn>
            </div>
            <ErrorMsg msg={error} />
            {showForm && (
                <Card style={{ marginBottom:24 }}>
                    <h2 style={{ fontWeight:700, marginBottom:16, fontSize: T.fontLg }}>{t('credentials.newTitle')}</h2>
                    <form onSubmit={e => { void handleCreate(e); }}>
                        <Field
                            label={t('credentials.nameLabel')} value={name} onChange={setName}
                            required placeholder={t('credentials.namePlaceholder')}
                        />
                        <Select
                            label={t('credentials.adapterLabel')} value={adapter}
                            onChange={setAdapter} options={adapterOptions}
                        />
                        <p style={{ color: T.textMuted, fontSize: T.fontSm, marginBottom:16 }}>
                            {t('credentials.secretHint')}
                        </p>
                        <Btn type="submit" disabled={saving}>
                            {saving ? t('common.creating') : t('common.create')}
                        </Btn>
                    </form>
                </Card>
            )}
            {loading ? (
                <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
            ) : creds.length === 0 ? (
                <Card>
                    <p style={{ color: T.textMuted, textAlign:'center', padding:'40px 0' }}>
                        {t('credentials.empty')}
                    </p>
                </Card>
            ) : (
                <Card style={{ padding:0 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.borderLight}`, background: T.tableHeader }}>
                                {[
                                    t('common.id'),
                                    t('common.name'),
                                    t('credentials.adapterLabel'),
                                    t('common.createdAt'),
                                    t('common.actions'),
                                ].map(h => (
                                    <th key={h} style={{
                                        padding:'10px 16px', textAlign:'left',
                                        fontSize: T.fontSm, fontWeight:600, color: T.textMuted,
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {creds.map(c => (
                                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderLight}`, transition: 'background 100ms ease' }} {...trHover}>
                                    <td style={{ padding:'12px 16px', color: T.textMuted, fontSize: T.fontBase }}>{c.id}</td>
                                    <td style={{ padding:'12px 16px', fontWeight:500 }}>{c.name}</td>
                                    <td style={{ padding:'12px 16px' }}><AdapterBadge adapter={c.adapter} /></td>
                                    <td style={{ padding:'12px 16px', color: T.textMuted, fontSize: T.fontBase }}>
                                        {c.created_at ? c.created_at.slice(0, 10) : '—'}
                                    </td>
                                    <td style={{ padding:'12px 16px' }}>
                                        <Btn variant="danger" onClick={() => void handleDelete(c.id, c.name)}>
                                            {t('common.delete')}
                                        </Btn>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}

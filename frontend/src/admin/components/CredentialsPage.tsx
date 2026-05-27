import React, { useEffect, useState } from 'react';
import {
    listCredentials, createCredential, deleteCredential,
    CredentialSummary, ApiError,
} from '../api.js';
import { PageTitle, Card, Btn, ErrorMsg, Field, Select } from './Layout.js';

const ADAPTER_OPTIONS = [
    { value: 'http',     label: 'HTTP（外部 API）' },
    { value: 'email',    label: 'Email' },
    { value: 'slack',    label: 'Slack' },
    { value: 'chatwork', label: 'Chatwork' },
];

function AdapterBadge({ adapter }: { adapter: string }) {
    const colors: Record<string, { bg: string; color: string }> = {
        http:     { bg: '#e0f2fe', color: '#0369a1' },
        email:    { bg: '#fef3c7', color: '#92400e' },
        slack:    { bg: '#f0fdf4', color: '#166534' },
        chatwork: { bg: '#fdf4ff', color: '#7e22ce' },
    };
    const { bg, color } = colors[adapter] ?? { bg: '#f3f4f6', color: '#374151' };
    return (
        <span style={{ background:bg, color, padding:'2px 10px', borderRadius:99, fontSize:12, fontWeight:600 }}>
            {adapter}
        </span>
    );
}

export default function CredentialsPage() {
    const [creds, setCreds]     = useState<CredentialSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [name, setName]       = useState('');
    const [adapter, setAdapter] = useState('http');
    const [saving, setSaving]   = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listCredentials();
            setCreds(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : '取得に失敗しました。');
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
            setError(err instanceof ApiError ? err.message : '作成に失敗しました。');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number, credName: string) {
        if (!confirm(`「${credName}」を削除しますか？`)) return;
        try {
            await deleteCredential(id);
            setCreds(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert(err instanceof ApiError ? err.message : '削除に失敗しました。');
        }
    }

    return (
        <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <PageTitle>アクションクレデンシャル</PageTitle>
                <Btn onClick={() => setShowForm(v => !v)}>
                    {showForm ? 'キャンセル' : '＋ 追加'}
                </Btn>
            </div>
            <ErrorMsg msg={error} />
            {showForm && (
                <Card style={{ marginBottom:24 }}>
                    <h2 style={{ fontWeight:700, marginBottom:16, fontSize:16 }}>新規クレデンシャル</h2>
                    <form onSubmit={e => { void handleCreate(e); }}>
                        <Field label="名前" value={name} onChange={setName} required placeholder="例: Slack 通知 webhook" />
                        <Select label="アダプター" value={adapter} onChange={setAdapter} options={ADAPTER_OPTIONS} />
                        <p style={{ color:'#6b7280', fontSize:12, marginBottom:16 }}>
                            ※ 機密設定（URL・トークン等）は作成後に API で別途更新してください。
                        </p>
                        <Btn type="submit" disabled={saving}>{saving ? '作成中…' : '作成'}</Btn>
                    </form>
                </Card>
            )}
            {loading ? (
                <p style={{ color:'#6b7280' }}>読み込み中…</p>
            ) : creds.length === 0 ? (
                <Card>
                    <p style={{ color:'#6b7280', textAlign:'center', padding:'40px 0' }}>
                        クレデンシャルがありません。
                    </p>
                </Card>
            ) : (
                <Card style={{ padding:0 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom:'1px solid #f3f4f6', background:'#f9fafb' }}>
                                {['ID','名前','アダプター','作成日','操作'].map(h => (
                                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {creds.map(c => (
                                <tr key={c.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                                    <td style={{ padding:'12px 16px', color:'#6b7280', fontSize:13 }}>{c.id}</td>
                                    <td style={{ padding:'12px 16px', fontWeight:500 }}>{c.name}</td>
                                    <td style={{ padding:'12px 16px' }}><AdapterBadge adapter={c.adapter} /></td>
                                    <td style={{ padding:'12px 16px', color:'#6b7280', fontSize:13 }}>
                                        {c.created_at ? c.created_at.slice(0, 10) : '—'}
                                    </td>
                                    <td style={{ padding:'12px 16px' }}>
                                        <Btn variant="danger" onClick={() => void handleDelete(c.id, c.name)}>削除</Btn>
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

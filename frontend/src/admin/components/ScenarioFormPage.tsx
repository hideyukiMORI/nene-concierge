import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    getScenario, createScenario, updateScenario, ApiError,
} from '../api.js';
import { PageTitle, Card, Btn, ErrorMsg, Field, Select } from './Layout.js';

const STATUS_OPTIONS = [
    { value: 'draft',     label: 'ドラフト' },
    { value: 'published', label: '公開中' },
    { value: 'archived',  label: 'アーカイブ' },
];

export default function ScenarioFormPage() {
    const { id } = useParams<{ id?: string }>();
    const isNew   = id === undefined;
    const nav     = useNavigate();

    const [name, setName]               = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus]           = useState('draft');
    const [loading, setLoading]         = useState(!isNew);
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState<string | null>(null);

    useEffect(() => {
        if (isNew) return;
        void (async () => {
            try {
                const s = await getScenario(Number(id));
                setName(s.name);
                setDescription(s.description ?? '');
                setStatus(s.status);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : '取得に失敗しました。');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isNew]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (isNew) {
                const res = await createScenario({
                    name,
                    ...(description ? { description } : {}),
                });
                nav(`/scenarios/${res.id}`);
            } else {
                await updateScenario(Number(id), {
                    name,
                    description: description || null,
                    status,
                });
                nav('/scenarios');
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : '保存に失敗しました。');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p style={{ color:'#6b7280', marginTop:40 }}>読み込み中…</p>;

    return (
        <div style={{ maxWidth: 600 }}>
            <PageTitle>{isNew ? '新規シナリオ' : 'シナリオを編集'}</PageTitle>
            <Card>
                <ErrorMsg msg={error} />
                <form onSubmit={e => { void handleSubmit(e); }}>
                    <Field
                        label="シナリオ名" value={name} onChange={setName}
                        required placeholder="例: 問い合わせ対応フロー"
                    />
                    <label style={{ display:'block', marginBottom:16 }}>
                        <span style={{ display:'block', fontWeight:600, marginBottom:4, fontSize:13 }}>
                            説明（任意）
                        </span>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="このシナリオの概要…"
                            rows={3}
                            style={{
                                width:'100%', padding:'8px 12px', borderRadius:7,
                                border:'1.5px solid #d1d5db', fontSize:14,
                                resize:'vertical', outline:'none',
                            }}
                        />
                    </label>
                    {!isNew && (
                        <Select
                            label="ステータス" value={status}
                            onChange={setStatus} options={STATUS_OPTIONS}
                        />
                    )}
                    <div style={{ display:'flex', gap:12, marginTop:8 }}>
                        <Btn type="submit" disabled={saving}>
                            {saving ? '保存中…' : (isNew ? '作成' : '保存')}
                        </Btn>
                        <Btn variant="ghost" onClick={() => nav('/scenarios')}>
                            キャンセル
                        </Btn>
                    </div>
                </form>
            </Card>
        </div>
    );
}

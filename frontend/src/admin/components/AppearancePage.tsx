import React, { useEffect, useState } from 'react';
import { getAppearance, upsertAppearance, AppearanceData, ApiError } from '../api.js';
import { PageTitle, Card, Btn, ErrorMsg, Field, Select } from './Layout.js';
import { T } from '../theme.js';

const POSITION_OPTIONS = [
    { value: 'bottom-right', label: '右下' },
    { value: 'bottom-left',  label: '左下' },
    { value: 'top-right',    label: '右上' },
    { value: 'top-left',     label: '左上' },
];
const TRIGGER_OPTIONS = [
    { value: 'page_load',   label: 'ページ読み込み時（自動オープン）' },
    { value: 'scroll',      label: 'スクロール時' },
    { value: 'exit_intent', label: '離脱意図' },
    { value: 'manual',      label: '手動（ボタンクリックのみ）' },
];

function ColorSwatch({ color }: { color: string }) {
    return (
        <span style={{
            display: 'inline-block', width: 20, height: 20,
            borderRadius: 4, background: color,
            border: `1px solid ${T.borderInput}`, verticalAlign: 'middle',
            marginRight: 6,
        }} />
    );
}

export default function AppearancePage() {
    const [form, setForm]       = useState<AppearanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState<string | null>(null);
    const [saved, setSaved]     = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                setForm(await getAppearance());
            } catch (err) {
                setError(err instanceof ApiError ? err.message : '取得に失敗しました。');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function set<K extends keyof AppearanceData>(key: K, value: AppearanceData[K]) {
        setForm(prev => prev ? { ...prev, [key]: value } : prev);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const updated = await upsertAppearance(form);
            setForm(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : '保存に失敗しました。');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p style={{ color: T.textMuted, marginTop: 40 }}>読み込み中…</p>;
    if (!form)   return <ErrorMsg msg={error} />;

    return (
        <div style={{ maxWidth: 560 }}>
            <PageTitle>外観設定</PageTitle>
            <Card>
                <ErrorMsg msg={error} />
                {saved && (
                    <div style={{
                        background: T.successBg, border: `1px solid ${T.successBorder}`,
                        color: T.successText, borderRadius: T.radiusMd,
                        padding: '10px 14px', marginBottom: 16, fontSize: T.fontBase,
                    }}>
                        ✓ 保存しました。
                    </div>
                )}
                <form onSubmit={e => { void handleSubmit(e); }}>
                    <label style={{ display:'block', marginBottom:16 }}>
                        <span style={{ display:'block', fontWeight:600, marginBottom:4, fontSize: T.fontBase }}>
                            プライマリカラー
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <ColorSwatch color={form.color_primary} />
                            <input
                                type="color" value={form.color_primary}
                                onChange={e => set('color_primary', e.target.value)}
                                style={{ width:48, height:36, border:'none', cursor:'pointer', borderRadius: T.radiusSm }}
                            />
                            <input
                                type="text" value={form.color_primary}
                                onChange={e => set('color_primary', e.target.value)}
                                maxLength={7} placeholder="#2563eb"
                                style={{
                                    width:100, padding:'6px 10px', borderRadius: T.radiusSm,
                                    border: `1.5px solid ${T.borderInput}`, fontSize: T.fontBase,
                                }}
                            />
                        </div>
                    </label>
                    <label style={{ display:'block', marginBottom:16 }}>
                        <span style={{ display:'block', fontWeight:600, marginBottom:4, fontSize: T.fontBase }}>
                            セカンダリカラー（文字色）
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <ColorSwatch color={form.color_secondary} />
                            <input
                                type="color" value={form.color_secondary}
                                onChange={e => set('color_secondary', e.target.value)}
                                style={{ width:48, height:36, border:'none', cursor:'pointer', borderRadius: T.radiusSm }}
                            />
                            <input
                                type="text" value={form.color_secondary}
                                onChange={e => set('color_secondary', e.target.value)}
                                maxLength={7} placeholder="#ffffff"
                                style={{
                                    width:100, padding:'6px 10px', borderRadius: T.radiusSm,
                                    border: `1.5px solid ${T.borderInput}`, fontSize: T.fontBase,
                                }}
                            />
                        </div>
                    </label>
                    <Select label="表示位置" value={form.position}
                        onChange={v => set('position', v as AppearanceData['position'])}
                        options={POSITION_OPTIONS} />
                    <Select label="トリガー" value={form.trigger_type}
                        onChange={v => set('trigger_type', v as AppearanceData['trigger_type'])}
                        options={TRIGGER_OPTIONS} />
                    <Field
                        label="アイコン URL（任意）"
                        value={form.icon_url ?? ''}
                        onChange={v => set('icon_url', v || null)}
                        placeholder="https://example.com/icon.png"
                    />
                    <Field
                        label="ウェルカムテキスト（任意）"
                        value={form.welcome_text ?? ''}
                        onChange={v => set('welcome_text', v || null)}
                        placeholder="ご用件はありますか？"
                    />
                    <Btn type="submit" disabled={saving}>
                        {saving ? '保存中…' : '保存'}
                    </Btn>
                </form>
            </Card>
        </div>
    );
}

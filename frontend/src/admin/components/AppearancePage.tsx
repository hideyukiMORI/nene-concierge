import React, { useEffect, useState } from 'react';
import { getAppearance, upsertAppearance, ApiError } from '../api.js';
import type { AppearanceData } from '../api.js';
import {
    PageHead, Card, Btn, SectionHead,
    ErrorMsg, SuccessMsg, FIELD_LABEL_STYLE, applyFocus, removeFocus, useLayout,
} from './Layout.js';
import { MobileHeader, MobileSectionHead } from './mobile/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const MONO = T.fontMono;

const COLOR_PRESETS = [
    '#2563EB',
    '#0d9488',
    '#7c3aed',
    '#E95420',
    '#18181B',
];

const POSITION_OPTS: { value: string; label: string; svgWidget: [number, number, number, number] }[] = [
    { value: 'top-left',     label: 'top left',     svgWidget: [4,  3,  9, 6] },
    { value: 'top-right',    label: 'top right',    svgWidget: [19, 3,  9, 6] },
    { value: 'bottom-left',  label: 'bottom left',  svgWidget: [4,  13, 9, 6] },
    { value: 'bottom-right', label: 'bottom right', svgWidget: [19, 13, 9, 6] },
];

const TRIGGER_OPTS = [
    { value: 'page_load',   label: 'ページ読み込み時に自動表示' },
    { value: 'scroll',      label: 'スクロール時 (50% 到達)' },
    { value: 'exit_intent', label: '離脱インテント検知時' },
    { value: 'manual',      label: '手動 — ボタンクリックのみ' },
];

export default function AppearancePage() {
    const { t } = useTranslation();
    const { isMobile } = useLayout();
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
                setError(err instanceof ApiError ? err.message : t('appearance.loadError'));
            } finally {
                setLoading(false);
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            setError(err instanceof ApiError ? err.message : t('appearance.saveError'));
        } finally {
            setSaving(false);
        }
    }

    if (loading || !form) {
        const content = loading
            ? <p style={{ color: T.textMuted, margin: '40px 16px' }}>{t('common.loading')}</p>
            : <ErrorMsg msg={error} />;
        if (isMobile) {
            return (
                <div style={{ minHeight: '100vh', background: T.bg }}>
                    <MobileHeader title="Appearance" subtitle="widget · public" />
                    {content}
                </div>
            );
        }
        return content;
    }

    const primaryColor = form.color_primary || '#2563EB';
    const welcomeText  = form.welcome_text  || 'ご用件はなんでしょうか？';

    const inputBase: React.CSSProperties = {
        width: '100%', height: T.controlHeight, padding: '0 12px',
        boxSizing: 'border-box', borderRadius: T.radiusMd,
        border: `1px solid ${T.borderInput}`,
        fontSize: T.fontSm, outline: 'none',
        background: T.surface, color: T.text,
        transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
    };

    const fieldLabelStyle: React.CSSProperties = {
        ...FIELD_LABEL_STYLE,
        marginBottom: 6,
    };

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Appearance"
                    subtitle="widget · public"
                    trailing={
                        <button
                            disabled={saving}
                            onClick={() => { void handleSubmit({ preventDefault: () => {} } as React.FormEvent); }}
                            style={{
                                height: 32, padding: '0 12px',
                                borderRadius: T.radiusMd, border: 'none',
                                background: 'transparent', color: T.primary,
                                fontSize: 13, fontWeight: 700,
                                cursor: saving ? 'wait' : 'pointer',
                                opacity: saving ? 0.6 : 1,
                            }}>
                            {saving ? t('common.saving') : t('common.save')}
                        </button>
                    }
                />

                {/* Sticky preview chip */}
                <div style={{
                    position: 'sticky', top: 56, zIndex: 20,
                    background: 'linear-gradient(135deg, #fafaf7, #f0eee9)',
                    borderBottom: `1px solid ${T.border}`,
                    padding: '12px 16px',
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '8px 10px 8px 8px',
                        boxShadow: '0 6px 20px -6px rgba(15,23,42,.20)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        maxWidth: 240,
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 99,
                            background: primaryColor,
                            color: form.color_secondary || '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, flexShrink: 0,
                        }}>N</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em',
                                color: '#8c959f', marginBottom: 1,
                            }}>PREVIEW</div>
                            <div style={{
                                fontSize: 12, fontWeight: 600,
                                color: '#18181b',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{welcomeText}</div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0 14px 60px' }}>
                    {error && <ErrorMsg msg={error}/>}
                    {saved && <SuccessMsg msg={t('appearance.saved')}/>}

                    <form onSubmit={e => { void handleSubmit(e); }}>
                        <MobileSectionHead label="colors"/>
                        <div style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: T.radiusMd, padding: 14, marginBottom: 8,
                        }}>
                            <label style={{
                                fontFamily: MONO, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                color: T.textMuted, display: 'block', marginBottom: 8,
                            }}>primary</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: T.radiusMd,
                                    background: primaryColor,
                                    border: `1px solid ${T.border}`, flexShrink: 0,
                                }}/>
                                <input type="text" value={form.color_primary}
                                    onChange={e => set('color_primary', e.target.value)}
                                    maxLength={7} placeholder="#2563EB"
                                    style={{
                                        flex: 1, height: 36, padding: '0 12px',
                                        border: `1px solid ${T.borderInput}`, borderRadius: T.radiusMd,
                                        background: T.surface, fontFamily: MONO, fontSize: 13,
                                        color: T.text, outline: 'none',
                                    }}
                                    onFocus={e => applyFocus(e.currentTarget)}
                                    onBlur={e  => removeFocus(e.currentTarget)}/>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {COLOR_PRESETS.map(c => {
                                    const active = form.color_primary === c;
                                    return (
                                        <button key={c} type="button"
                                            onClick={() => set('color_primary', c)}
                                            style={{
                                                width: 28, height: 28, borderRadius: 99,
                                                background: c, border: `2px solid ${T.surface}`,
                                                outline: active ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                                                cursor: 'pointer', padding: 0,
                                            }}/>
                                    );
                                })}
                            </div>
                        </div>

                        <MobileSectionHead label="position"/>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {POSITION_OPTS.map(opt => {
                                const active = form.position === opt.value;
                                const [rx, ry, rw, rh] = opt.svgWidget;
                                return (
                                    <button key={opt.value} type="button"
                                        onClick={() => set('position', opt.value)}
                                        style={{
                                            padding: 12,
                                            background: active ? T.primaryTint : T.surface,
                                            border: `${active ? 1.5 : 1}px solid ${active ? T.primary : T.border}`,
                                            borderRadius: T.radiusMd,
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            cursor: 'pointer',
                                            color: active ? T.primary : T.text,
                                        }}>
                                        <svg width="40" height="28" viewBox="0 0 32 22" aria-hidden>
                                            <rect x="0.5" y="0.5" width="31" height="21" rx="2" fill="none" stroke="currentColor" opacity={active ? 0.7 : 0.4}/>
                                            <rect x={rx} y={ry} width={rw} height={rh} rx="1" fill="currentColor"/>
                                        </svg>
                                        <span style={{ fontSize: 11, fontWeight: active ? 700 : 400 }}>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <MobileSectionHead label="trigger"/>
                        <select value={form.trigger_type}
                            onChange={e => set('trigger_type', e.target.value)}
                            style={{
                                width: '100%', height: 40, padding: '0 12px',
                                border: `1px solid ${T.border}`, borderRadius: T.radiusMd,
                                background: T.surface, fontSize: 14, color: T.text,
                                outline: 'none', cursor: 'pointer',
                            }}>
                            {TRIGGER_OPTS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <MobileSectionHead label="content"/>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input type="text" value={form.icon_url ?? ''}
                                onChange={e => set('icon_url', e.target.value || null)}
                                placeholder="icon url (optional)"
                                style={{
                                    height: 40, padding: '0 12px',
                                    border: `1px solid ${T.borderInput}`, borderRadius: T.radiusMd,
                                    background: T.surface, fontSize: 14, color: T.text,
                                    outline: 'none',
                                }}
                                onFocus={e => applyFocus(e.currentTarget)}
                                onBlur={e  => removeFocus(e.currentTarget)}/>
                            <input type="text" value={form.welcome_text ?? ''}
                                onChange={e => set('welcome_text', e.target.value || null)}
                                placeholder="ご用件はなんでしょうか？"
                                style={{
                                    height: 40, padding: '0 12px',
                                    border: `1px solid ${T.borderInput}`, borderRadius: T.radiusMd,
                                    background: T.surface, fontSize: 14, color: T.text,
                                    outline: 'none',
                                }}
                                onFocus={e => applyFocus(e.currentTarget)}
                                onBlur={e  => removeFocus(e.currentTarget)}/>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHead title="Appearance" subtitle="widget · public-facing">
                <Btn variant="ghost" onClick={() => {
                    void getAppearance().then(data => setForm(data)).catch(() => {});
                }}>
                    Reset to defaults
                </Btn>
                <Btn onClick={() => {
                    if (!form || saving) return;
                    void handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                }} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                </Btn>
            </PageHead>

            <ErrorMsg msg={error} />
            <SuccessMsg msg={saved ? t('appearance.saved') : null} />

            <form onSubmit={e => { void handleSubmit(e); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                    {/* LEFT: settings */}
                    <div>
                        {/* Colors card */}
                        <Card style={{ marginBottom: 12 }}>
                            <SectionHead label="colors" />
                            {/* Primary */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={fieldLabelStyle}>primary</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: T.radiusMd,
                                        border: `1px solid ${T.borderInput}`,
                                        background: primaryColor, flexShrink: 0,
                                    }} />
                                    <input
                                        type="text"
                                        value={form.color_primary}
                                        onChange={e => set('color_primary', e.target.value)}
                                        maxLength={7}
                                        placeholder="#2563EB"
                                        style={{
                                            width: 110, height: T.controlHeight, padding: '0 10px',
                                            boxSizing: 'border-box',
                                            borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
                                            fontFamily: MONO, fontSize: T.fontSm,
                                            background: T.surface, color: T.text, outline: 'none',
                                        }}
                                        onFocus={e => applyFocus(e.currentTarget)}
                                        onBlur={e  => removeFocus(e.currentTarget)}
                                    />
                                    {/* Preset dots */}
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        {COLOR_PRESETS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                title={c}
                                                onClick={() => set('color_primary', c)}
                                                style={{
                                                    width: 22, height: 22, borderRadius: 99,
                                                    background: c, border: 'none',
                                                    cursor: 'pointer', flexShrink: 0,
                                                    outline: form.color_primary === c
                                                        ? `2px solid ${T.primary}`
                                                        : `1px solid ${T.border}`,
                                                    outlineOffset: 1,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Text on primary */}
                            <div>
                                <label style={fieldLabelStyle}>text on primary</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: T.radiusMd,
                                        border: `1px solid ${T.borderInput}`,
                                        background: form.color_secondary || '#FFFFFF', flexShrink: 0,
                                    }} />
                                    <input
                                        type="text"
                                        value={form.color_secondary}
                                        onChange={e => set('color_secondary', e.target.value)}
                                        maxLength={7}
                                        placeholder="#FFFFFF"
                                        style={{
                                            width: 110, height: T.controlHeight, padding: '0 10px',
                                            boxSizing: 'border-box',
                                            borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
                                            fontFamily: MONO, fontSize: T.fontSm,
                                            background: T.surface, color: T.text, outline: 'none',
                                        }}
                                        onFocus={e => applyFocus(e.currentTarget)}
                                        onBlur={e  => removeFocus(e.currentTarget)}
                                    />
                                    <span style={{ fontSize: T.fontXs, color: T.textMuted }}>
                                        アイコン・タイトルの色 (通常は白)
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Behavior card */}
                        <Card style={{ marginBottom: 12 }}>
                            <SectionHead label="behavior" />
                            {/* Position */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={fieldLabelStyle}>position</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                    {POSITION_OPTS.map(opt => {
                                        const active = form.position === opt.value;
                                        const [rx, ry, rw, rh] = opt.svgWidget;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => set('position', opt.value)}
                                                style={{
                                                    height: 56, display: 'flex',
                                                    flexDirection: 'column', alignItems: 'center',
                                                    justifyContent: 'center', gap: 4,
                                                    borderRadius: T.radiusMd,
                                                    border: `1px solid ${active ? T.primary : T.border}`,
                                                    background: active ? T.primaryTint : 'transparent',
                                                    color: active ? T.primary : T.text,
                                                    cursor: 'pointer',
                                                    fontSize: 10, fontWeight: active ? 700 : 400,
                                                }}
                                            >
                                                <svg width="32" height="22" viewBox="0 0 32 22">
                                                    <rect x="0.5" y="0.5" width="31" height="21" rx="2" fill="none" stroke="currentColor" opacity={active ? 0.7 : 0.4} />
                                                    <rect x={rx} y={ry} width={rw} height={rh} rx="1" fill="currentColor" />
                                                </svg>
                                                <span>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Trigger */}
                            <div>
                                <label style={fieldLabelStyle}>trigger</label>
                                <select
                                    value={form.trigger_type}
                                    onChange={e => set('trigger_type', e.target.value)}
                                    style={{ ...inputBase }}
                                    onFocus={e => applyFocus(e.currentTarget)}
                                    onBlur={e  => removeFocus(e.currentTarget)}
                                >
                                    {TRIGGER_OPTS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: T.fontXs, color: T.textMuted, marginTop: 5, marginBottom: 0 }}>
                                    どのタイミングでウィジェットを開くか
                                </p>
                            </div>
                        </Card>

                        {/* Content card */}
                        <Card>
                            <SectionHead label="content" />
                            <div style={{ marginBottom: 16 }}>
                                <label style={fieldLabelStyle}>
                                    icon url{' '}
                                    <span style={{ fontWeight: 500, letterSpacing: 0, opacity: 0.6, textTransform: 'none' }}>
                                        (optional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={form.icon_url ?? ''}
                                    onChange={e => set('icon_url', e.target.value || null)}
                                    placeholder="https://example.com/icon.png"
                                    style={inputBase}
                                    onFocus={e => applyFocus(e.currentTarget)}
                                    onBlur={e  => removeFocus(e.currentTarget)}
                                />
                            </div>
                            <div>
                                <label style={fieldLabelStyle}>
                                    welcome message{' '}
                                    <span style={{ fontWeight: 500, letterSpacing: 0, opacity: 0.6, textTransform: 'none' }}>
                                        (optional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={form.welcome_text ?? ''}
                                    onChange={e => set('welcome_text', e.target.value || null)}
                                    placeholder="ご用件はなんでしょうか？"
                                    style={inputBase}
                                    onFocus={e => applyFocus(e.currentTarget)}
                                    onBlur={e  => removeFocus(e.currentTarget)}
                                />
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT: Live preview */}
                    <div>
                        <SectionHead label="live preview">
                            <button
                                type="button"
                                style={{
                                    height: T.controlHeightSm, padding: '0 10px',
                                    borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
                                    background: 'transparent', color: T.primary,
                                    fontSize: T.fontXs, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                ↕ 切替
                            </button>
                        </SectionHead>
                        <div style={{
                            height: 360,
                            background: 'linear-gradient(135deg, #fafaf7 0%, #f0eee9 100%)',
                            borderRadius: T.radiusLg,
                            border: `1px solid ${T.border}`,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* PREVIEW label */}
                            <span style={{
                                position: 'absolute', top: 12, left: 16,
                                fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                                letterSpacing: '0.10em', color: T.textFaint,
                                textTransform: 'uppercase',
                            }}>PREVIEW</span>

                            {/* Widget bubble */}
                            <div style={{
                                position: 'absolute', right: 18, bottom: 18,
                                width: 280, maxWidth: '80%',
                                background: '#fff', borderRadius: 12,
                                boxShadow: '0 18px 50px -10px rgba(15,23,42,.18), 0 4px 12px rgba(15,23,42,.06)',
                                overflow: 'hidden',
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '12px 14px',
                                    background: primaryColor,
                                    color: form.color_secondary || '#fff',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 99,
                                        background: 'rgba(255,255,255,.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700,
                                    }}>N</div>
                                    <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>NeNe Concierge</div>
                                    <div style={{ opacity: 0.7 }}>×</div>
                                </div>
                                {/* Body */}
                                <div style={{ padding: 14 }}>
                                    <div style={{
                                        padding: '8px 12px',
                                        borderRadius: '12px 12px 12px 4px',
                                        background: '#f4f3ee', color: '#18181b',
                                        fontSize: 13, lineHeight: 1.5,
                                        maxWidth: '80%',
                                    }}>
                                        {welcomeText}
                                    </div>
                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                        {['配送について', '返品・交換', '商品について', 'その他'].map(c => (
                                            <span key={c} style={{
                                                padding: '5px 11px', borderRadius: 999,
                                                background: `${primaryColor}14`,
                                                color: primaryColor,
                                                border: `1px solid ${primaryColor}40`,
                                                fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                                            }}>{c}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p style={{
                            marginTop: 12, textAlign: 'center',
                            fontSize: T.fontXs, color: T.textMuted,
                        }}>
                            設定変更は保存ボタンを押すまで本番には反映されません。
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}

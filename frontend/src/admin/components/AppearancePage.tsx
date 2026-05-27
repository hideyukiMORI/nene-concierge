import React, { useEffect, useState } from 'react';
import { getAppearance, upsertAppearance, AppearanceData, ApiError } from '../api.js';
import { PageTitle, Card, Btn, ErrorMsg, Field, Select } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

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
    const { t } = useTranslation();
    const [form, setForm]       = useState<AppearanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState<string | null>(null);
    const [saved, setSaved]     = useState(false);

    const positionOptions = [
        { value: 'bottom-right', label: t('appearance.position.bottomRight') },
        { value: 'bottom-left',  label: t('appearance.position.bottomLeft')  },
        { value: 'top-right',    label: t('appearance.position.topRight')    },
        { value: 'top-left',     label: t('appearance.position.topLeft')     },
    ];
    const triggerOptions = [
        { value: 'page_load',   label: t('appearance.trigger.pageLoad')   },
        { value: 'scroll',      label: t('appearance.trigger.scroll')     },
        { value: 'exit_intent', label: t('appearance.trigger.exitIntent') },
        { value: 'manual',      label: t('appearance.trigger.manual')     },
    ];

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
            setError(err instanceof ApiError ? err.message : t('appearance.saveError'));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p style={{ color: T.textMuted, marginTop: 40 }}>{t('common.loading')}</p>;
    if (!form)   return <ErrorMsg msg={error} />;

    return (
        <div style={{ maxWidth: 560 }}>
            <PageTitle>{t('appearance.pageTitle')}</PageTitle>
            <Card>
                <ErrorMsg msg={error} />
                {saved && (
                    <div style={{
                        background: T.successBg, border: `1px solid ${T.successBorder}`,
                        color: T.successText, borderRadius: T.radiusMd,
                        padding: '10px 14px', marginBottom: 16, fontSize: T.fontBase,
                    }}>
                        {t('appearance.saved')}
                    </div>
                )}
                <form onSubmit={e => { void handleSubmit(e); }}>
                    <label style={{ display:'block', marginBottom:16 }}>
                        <span style={{ display:'block', fontWeight:600, marginBottom:4, fontSize: T.fontBase }}>
                            {t('appearance.primaryColor')}
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
                            {t('appearance.secondaryColor')}
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
                    <Select label={t('appearance.position')} value={form.position}
                        onChange={v => set('position', v as AppearanceData['position'])}
                        options={positionOptions} />
                    <Select label={t('appearance.trigger')} value={form.trigger_type}
                        onChange={v => set('trigger_type', v as AppearanceData['trigger_type'])}
                        options={triggerOptions} />
                    <Field
                        label={t('appearance.iconUrl')}
                        value={form.icon_url ?? ''}
                        onChange={v => set('icon_url', v || null)}
                        placeholder={t('appearance.iconPlaceholder')}
                    />
                    <Field
                        label={t('appearance.welcomeText')}
                        value={form.welcome_text ?? ''}
                        onChange={v => set('welcome_text', v || null)}
                        placeholder={t('appearance.welcomePlaceholder')}
                    />
                    <Btn type="submit" disabled={saving}>
                        {saving ? t('common.saving') : t('common.save')}
                    </Btn>
                </form>
            </Card>
        </div>
    );
}

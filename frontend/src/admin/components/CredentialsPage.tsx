import React, { useEffect, useState } from 'react';
import {
    listCredentials, createCredential, deleteCredential,
    ApiError,
} from '../api.js';
import type { CredentialSummary } from '../api.js';
import {
    PageHead, Card, Btn, SectionHead, AdapterTag,
    ErrorMsg, FIELD_LABEL_STYLE, applyFocus, removeFocus, trHover, useLayout,
    TH, TD,
} from './Layout.js';
import {
    MobileHeader, FilterChips, Chip, CardList, ListItem, FAB,
    BottomSheet, SkeletonListItem, MetaDot,
} from './mobile/index.js';
import { useModals } from './modal/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const ADAPTER_ICON: Record<string, string> = {
    http:     '→',
    email:    '✉',
    slack:    '#',
    chatwork: '✎',
};
const ADAPTER_COLOR_KEY: Record<string, 'http' | 'email' | 'slack' | 'chatwork'> = {
    http: 'http', email: 'email', slack: 'slack', chatwork: 'chatwork',
};

const MONO = T.fontMono;

export default function CredentialsPage() {
    const { t } = useTranslation();
    const { isMobile } = useLayout();
    const { confirm, alertDialog } = useModals();
    const [creds, setCreds]       = useState<CredentialSummary[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [name, setName]         = useState('');
    const [adapter, setAdapter]   = useState('http');
    const [saving, setSaving]     = useState(false);
    const [adapterFilter, setAdapterFilter] = useState<string>('');

    const adapterOptions = [
        { value: 'http',     label: 'HTTP — generic external API'   },
        { value: 'email',    label: 'Email — SMTP'                  },
        { value: 'slack',    label: 'Slack — incoming webhook'      },
        { value: 'chatwork', label: 'Chatwork — bot API'            },
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

    useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        const ok = await confirm({
            title: t('credentials.confirmDeleteTitle'),
            description: t('credentials.confirmDelete', { name: credName }),
            tone: 'danger',
            confirmLabel: t('common.delete'),
        });
        if (!ok) return;
        try {
            await deleteCredential(id);
            setCreds(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            void alertDialog({
                title: t('credentials.deleteError'),
                description: err instanceof ApiError ? err.message : undefined,
                tone: 'danger',
            });
        }
    }

    const inputBase: React.CSSProperties = {
        width: '100%', height: T.controlHeight, padding: '0 12px',
        boxSizing: 'border-box', borderRadius: T.radiusMd,
        border: `1px solid ${T.borderInput}`,
        fontSize: T.fontSm, outline: 'none',
        background: T.surface, color: T.text,
        transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
    };

    const filteredMobile = adapterFilter ? creds.filter(c => c.adapter === adapterFilter) : creds;

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        const counts: Record<string, number> = {
            http: 0, email: 0, slack: 0, chatwork: 0,
        };
        creds.forEach(c => { if (counts[c.adapter] !== undefined) counts[c.adapter]++; });

        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Credentials"
                    subtitle={loading ? '…' : `${creds.length} active`}
                />

                <FilterChips>
                    <Chip active={adapterFilter === ''}      onClick={() => setAdapterFilter('')}>all · {creds.length}</Chip>
                    <Chip active={adapterFilter === 'http'}     onClick={() => setAdapterFilter(adapterFilter === 'http' ? '' : 'http')}>http · {counts.http}</Chip>
                    <Chip active={adapterFilter === 'email'}    onClick={() => setAdapterFilter(adapterFilter === 'email' ? '' : 'email')}>email · {counts.email}</Chip>
                    <Chip active={adapterFilter === 'slack'}    onClick={() => setAdapterFilter(adapterFilter === 'slack' ? '' : 'slack')}>slack · {counts.slack}</Chip>
                    <Chip active={adapterFilter === 'chatwork'} onClick={() => setAdapterFilter(adapterFilter === 'chatwork' ? '' : 'chatwork')}>chatwork · {counts.chatwork}</Chip>
                </FilterChips>

                {error && (
                    <div style={{ padding: '12px 12px 0' }}>
                        <ErrorMsg msg={error} />
                    </div>
                )}

                {loading ? (
                    <CardList>
                        <SkeletonListItem />
                        <SkeletonListItem />
                        <SkeletonListItem />
                    </CardList>
                ) : filteredMobile.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted }}>
                        <div style={{ fontSize: T.fontSm }}>{t('credentials.empty')}</div>
                    </div>
                ) : (
                    <CardList>
                        {filteredMobile.map((c, i) => {
                            const colorKey = ADAPTER_COLOR_KEY[c.adapter] ?? 'http';
                            const bg =  T[`adapter${colorKey[0]!.toUpperCase() + colorKey.slice(1)}Bg` as keyof typeof T];
                            const fg =  T[`adapter${colorKey[0]!.toUpperCase() + colorKey.slice(1)}` as keyof typeof T];
                            return (
                                <ListItem
                                    key={c.id}
                                    last={i === filteredMobile.length - 1}
                                    icon={
                                        <div style={{
                                            width: 36, height: 36, borderRadius: T.radiusMd,
                                            background: bg, color: fg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: 14,
                                        }}>{ADAPTER_ICON[c.adapter] ?? '·'}</div>
                                    }
                                    title={c.name}
                                    meta={
                                        <>
                                            <span style={{ color: fg, fontWeight: 600 }}>{c.adapter}</span>
                                            <MetaDot />
                                            <span>#{c.id}</span>
                                        </>
                                    }
                                    onClick={() => void handleDelete(c.id, c.name)}
                                />
                            );
                        })}
                    </CardList>
                )}

                <div style={{ height: 'calc(96px + env(safe-area-inset-bottom))' }}/>

                <FAB ariaLabel={t('common.add' as Parameters<typeof t>[0])} onClick={() => setShowForm(true)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                    </svg>
                </FAB>

                <BottomSheet
                    open={showForm}
                    onClose={() => setShowForm(false)}
                    title={t('credentials.newCredential' as Parameters<typeof t>[0]) || 'New credential'}>
                    <form onSubmit={e => { void handleCreate(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label style={FIELD_LABEL_STYLE}>name *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            required placeholder={t('credentials.namePlaceholder')}
                            style={inputBase}
                            onFocus={e => applyFocus(e.currentTarget)}
                            onBlur={e  => removeFocus(e.currentTarget)}/>
                        <label style={FIELD_LABEL_STYLE}>adapter</label>
                        <select value={adapter} onChange={e => setAdapter(e.target.value)}
                            style={{ ...inputBase, cursor: 'pointer' }}>
                            {adapterOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <Btn type="submit" disabled={saving || !name.trim()} style={{ flex: 1 }}>
                                {saving ? t('common.saving') : t('common.create')}
                            </Btn>
                            <Btn variant="ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                                {t('common.cancel')}
                            </Btn>
                        </div>
                    </form>
                </BottomSheet>
            </div>
        );
    }

    return (
        <div>
            <PageHead
                title="Action Credentials"
                subtitle={loading ? '…' : `${creds.length} active · external connections`}
            >
                <Btn onClick={() => setShowForm(v => !v)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                    </svg>
                    追加
                </Btn>
            </PageHead>

            <ErrorMsg msg={error} />

            {/* New credential form */}
            {showForm && (
                <Card style={{ marginBottom: 20 }}>
                    <SectionHead label="new credential">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: T.textMuted, fontSize: 14, lineHeight: 1,
                                padding: '2px 6px',
                            }}
                        >
                            ✕
                        </button>
                    </SectionHead>
                    <form onSubmit={e => { void handleCreate(e); }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', ...FIELD_LABEL_STYLE, marginBottom: 5 }}>
                                    name <span style={{ color: T.danger }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder={t('credentials.namePlaceholder')}
                                    style={inputBase}
                                    onFocus={e => applyFocus(e.currentTarget)}
                                    onBlur={e  => removeFocus(e.currentTarget)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', ...FIELD_LABEL_STYLE, marginBottom: 5 }}>
                                    adapter
                                </label>
                                <select
                                    value={adapter}
                                    onChange={e => setAdapter(e.target.value)}
                                    style={{ ...inputBase, cursor: 'pointer' }}
                                    onFocus={e => applyFocus(e.currentTarget)}
                                    onBlur={e  => removeFocus(e.currentTarget)}
                                >
                                    {adapterOptions.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p style={{ color: T.textMuted, fontSize: T.fontXs, marginTop: 8, marginBottom: 12 }}>
                            URL・トークン等の機密設定は作成後、シナリオエディタ側で個別に紐付けます。
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Btn type="submit" disabled={saving}>
                                {saving ? t('common.creating') : t('common.create')}
                            </Btn>
                            <Btn variant="ghost" onClick={() => setShowForm(false)}>
                                キャンセル
                            </Btn>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
            ) : creds.length === 0 ? (
                <Card>
                    <p style={{ color: T.textMuted, textAlign: 'center', padding: '40px 0' }}>
                        {t('credentials.empty')}
                    </p>
                </Card>
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ ...TH, width: 44 }}>id</th>
                                <th style={TH}>name</th>
                                <th style={{ ...TH, width: 130 }}>adapter</th>
                                <th style={{ ...TH, width: 140 }}>created</th>
                                <th style={{ ...TH, width: 140 }}>last used</th>
                                <th style={{ ...TH, width: 90, textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {creds.map((c, i) => (
                                <tr
                                    key={c.id}
                                    style={{
                                        borderBottom: i < creds.length - 1 ? `1px solid ${T.border}` : 'none',
                                        transition: 'background 100ms ease',
                                    }}
                                    {...trHover}
                                >
                                    {/* id */}
                                    <td style={{
                                        ...TD,
                                        fontFamily: MONO, fontSize: T.fontXs, color: T.textFaint,
                                        width: 40,
                                    }}>
                                        {String(c.id).padStart(2, '0')}
                                    </td>
                                    {/* name */}
                                    <td style={{ ...TD, fontWeight: 600 }}>{c.name}</td>
                                    {/* adapter */}
                                    <td style={TD}>
                                        <AdapterTag adapter={c.adapter} />
                                    </td>
                                    {/* created */}
                                    <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted }}>
                                        {c.created_at?.slice(5, 10) ?? '—'}
                                    </td>
                                    {/* last used (updated_at) */}
                                    <td style={{
                                        ...TD,
                                        fontFamily: MONO, fontSize: T.fontSm,
                                        color: c.updated_at ? T.successFg : T.textFaint,
                                    }}>
                                        {c.updated_at?.slice(5, 16) ?? '—'}
                                    </td>
                                    {/* actions */}
                                    <td style={{ ...TD, textAlign: 'right' }}>
                                        <Btn
                                            variant="danger"
                                            style={{ height: T.controlHeightSm, padding: '0 10px', fontSize: T.fontXs }}
                                            onClick={() => void handleDelete(c.id, c.name)}
                                        >
                                            削除
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

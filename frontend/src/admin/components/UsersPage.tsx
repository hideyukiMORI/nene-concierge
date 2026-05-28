import { useEffect, useState } from 'react';
import {
    listUsers, createUser, updateUser, deleteUser, ApiError,
} from '../api.js';
import type { UserSummary, UserRole, UserStatus, CreateUserPayload, UpdateUserPayload } from '../api.js';
import {
    PageHead, Btn, ErrorMsg, SuccessMsg,
    FIELD_LABEL_STYLE, applyFocus, removeFocus,
    Card, useLayout,
} from './Layout.js';
import {
    MobileHeader, FilterChips, Chip, CardList, ListItem, FAB,
    BottomSheet, SkeletonListItem, MetaDot, Pill,
} from './mobile/index.js';
import type { PillVariant } from './mobile/index.js';
import { useModals } from './modal/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import { getStoredEmail } from '../auth.js';

const MONO = T.fontMono;

const TH: React.CSSProperties = {
    padding: '8px 14px', textAlign: 'left',
    fontSize: T.fontXs, fontWeight: 700, color: T.textMuted,
    fontFamily: MONO, letterSpacing: '0.05em', textTransform: 'uppercase',
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
};
const TD: React.CSSProperties = {
    padding: '9px 14px', fontSize: T.fontSm, color: T.text,
};

const ROLE_TO_PILL: Record<UserRole, PillVariant> = {
    superadmin: 'active',
    owner:      'active',
    editor:     'success',
    viewer:     'neutral',
};

function formatDate(ts: number | null): string {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    return d.toISOString().slice(0, 10);
}

// ── User form (shared between create + edit) ──────────────────────────────────

interface FormState {
    email:    string;
    password: string;
    role:     UserRole;
    status:   UserStatus;
}

function UserForm({
    initial, mode, onSubmit, onCancel, saving, error,
}: {
    initial?: UserSummary;
    mode:     'create' | 'edit';
    onSubmit: (form: FormState) => void;
    onCancel: () => void;
    saving:   boolean;
    error:    string | null;
}) {
    const { t } = useTranslation();
    const [form, setForm] = useState<FormState>({
        email:    initial?.email  ?? '',
        password: '',
        role:     initial?.role   ?? 'editor',
        status:   initial?.status ?? 'active',
    });

    const inputBase: React.CSSProperties = {
        width: '100%', height: T.controlHeight, padding: '0 12px',
        boxSizing: 'border-box', borderRadius: T.radiusMd,
        border: `1px solid ${T.borderInput}`,
        fontSize: T.fontSm, outline: 'none',
        background: T.surface, color: T.text,
    };

    function submit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && <ErrorMsg msg={error} />}

            <label>
                <span style={FIELD_LABEL_STYLE}>{t('users.field.email')} *</span>
                <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    disabled={mode === 'edit'}
                    required
                    style={{ ...inputBase, opacity: mode === 'edit' ? 0.6 : 1 }}
                    onFocus={e => applyFocus(e.currentTarget)}
                    onBlur={e  => removeFocus(e.currentTarget)}
                />
            </label>

            <label>
                <span style={FIELD_LABEL_STYLE}>
                    {t('users.field.password')}{mode === 'create' && ' *'}
                </span>
                <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required={mode === 'create'}
                    minLength={mode === 'create' ? 8 : 0}
                    placeholder={mode === 'edit' ? '••••••••' : ''}
                    style={inputBase}
                    onFocus={e => applyFocus(e.currentTarget)}
                    onBlur={e  => removeFocus(e.currentTarget)}
                />
                <p style={{ margin: '4px 2px 0', fontSize: T.fontXs, color: T.textFaint, lineHeight: 1.4 }}>
                    {t('users.field.passwordHint')}
                </p>
            </label>

            <label>
                <span style={FIELD_LABEL_STYLE}>{t('users.field.role')}</span>
                <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                    style={{ ...inputBase, cursor: 'pointer' }}
                    onFocus={e => applyFocus(e.currentTarget)}
                    onBlur={e  => removeFocus(e.currentTarget)}
                >
                    <option value="viewer">{t('users.role.viewer')}</option>
                    <option value="editor">{t('users.role.editor')}</option>
                    <option value="owner">{t('users.role.owner')}</option>
                    <option value="superadmin">{t('users.role.superadmin')}</option>
                </select>
            </label>

            {mode === 'edit' && (
                <label>
                    <span style={FIELD_LABEL_STYLE}>{t('users.field.status')}</span>
                    <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value as UserStatus })}
                        style={{ ...inputBase, cursor: 'pointer' }}
                        onFocus={e => applyFocus(e.currentTarget)}
                        onBlur={e  => removeFocus(e.currentTarget)}
                    >
                        <option value="active">{t('users.status.active')}</option>
                        <option value="disabled">{t('users.status.disabled')}</option>
                    </select>
                </label>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Btn type="submit" disabled={saving || (mode === 'create' && (!form.email || !form.password))} style={{ flex: 1 }}>
                    {saving ? t('common.saving') : (mode === 'create' ? t('common.create') : t('common.save'))}
                </Btn>
                <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>
                    {t('common.cancel')}
                </Btn>
            </div>
        </form>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
    const { t } = useTranslation();
    const { isMobile } = useLayout();
    const { confirm, alertDialog } = useModals();
    const myEmail = getStoredEmail();

    const [users, setUsers]       = useState<UserSummary[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [saved, setSaved]       = useState<string | null>(null);

    // editor sheet state
    const [editing, setEditing]   = useState<UserSummary | null>(null);  // null + sheetOpen=true → create
    const [sheetOpen, setSheetOpen] = useState(false);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError]   = useState<string | null>(null);

    const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listUsers();
            setUsers(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('users.loadError'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function openCreate() {
        setEditing(null);
        setFormError(null);
        setSheetOpen(true);
    }
    function openEdit(u: UserSummary) {
        setEditing(u);
        setFormError(null);
        setSheetOpen(true);
    }
    function closeSheet() {
        setSheetOpen(false);
        setFormError(null);
    }

    async function handleSubmit(form: FormState) {
        setFormSaving(true);
        setFormError(null);
        try {
            if (editing === null) {
                const payload: CreateUserPayload = {
                    email:    form.email,
                    password: form.password,
                    role:     form.role,
                };
                await createUser(payload);
            } else {
                const payload: UpdateUserPayload = { role: form.role, status: form.status };
                if (form.password.length > 0) payload.password = form.password;
                await updateUser(editing.id, payload);
            }
            setSaved('✓');
            setTimeout(() => setSaved(null), 1500);
            closeSheet();
            await load();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : t('users.saveError'));
        } finally {
            setFormSaving(false);
        }
    }

    async function handleDelete(u: UserSummary) {
        const ok = await confirm({
            title:        t('users.confirmDeleteTitle'),
            description:  t('users.confirmDelete', { email: u.email }),
            tone:         'danger',
            confirmLabel: t('common.delete'),
        });
        if (!ok) return;
        try {
            await deleteUser(u.id);
            await load();
        } catch (err) {
            void alertDialog({
                title:       t('users.deleteError'),
                description: err instanceof ApiError ? err.message : undefined,
                tone:        'danger',
            });
        }
    }

    const filtered = roleFilter ? users.filter(u => u.role === roleFilter) : users;
    const active = users.filter(u => u.status === 'active').length;
    const subtitle = loading
        ? '…'
        : t('users.subtitle', { total: String(users.length), active: String(active) });

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        const countAll        = users.length;
        const countSuperadmin = users.filter(u => u.role === 'superadmin').length;
        const countOwner      = users.filter(u => u.role === 'owner').length;
        const countEditor     = users.filter(u => u.role === 'editor').length;
        const countViewer     = users.filter(u => u.role === 'viewer').length;

        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title={t('users.pageTitle')}
                    subtitle={subtitle}
                />

                <FilterChips>
                    <Chip active={roleFilter === ''}            onClick={() => setRoleFilter('')}>all · {countAll}</Chip>
                    <Chip active={roleFilter === 'superadmin'}  onClick={() => setRoleFilter(roleFilter === 'superadmin' ? '' : 'superadmin')}>superadmin · {countSuperadmin}</Chip>
                    <Chip active={roleFilter === 'owner'}       onClick={() => setRoleFilter(roleFilter === 'owner' ? '' : 'owner')}>owner · {countOwner}</Chip>
                    <Chip active={roleFilter === 'editor'}      onClick={() => setRoleFilter(roleFilter === 'editor' ? '' : 'editor')}>editor · {countEditor}</Chip>
                    <Chip active={roleFilter === 'viewer'}      onClick={() => setRoleFilter(roleFilter === 'viewer' ? '' : 'viewer')}>viewer · {countViewer}</Chip>
                </FilterChips>

                {error && (
                    <div style={{ padding: '12px 12px 0' }}>
                        <ErrorMsg msg={error}/>
                    </div>
                )}

                {loading ? (
                    <CardList>
                        <SkeletonListItem/><SkeletonListItem/><SkeletonListItem/>
                    </CardList>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted, fontSize: T.fontSm }}>
                        {t('users.empty')}
                    </div>
                ) : (
                    <CardList>
                        {filtered.map((u, i) => (
                            <ListItem
                                key={u.id}
                                last={i === filtered.length - 1}
                                icon={u.email[0]?.toUpperCase() ?? '?'}
                                title={u.email}
                                meta={
                                    <>
                                        <Pill variant={ROLE_TO_PILL[u.role]} label={u.role}/>
                                        {u.status === 'disabled' && (
                                            <>
                                                <MetaDot/>
                                                <span style={{ color: T.textFaint }}>{t('users.status.disabled')}</span>
                                            </>
                                        )}
                                    </>
                                }
                                onClick={() => openEdit(u)}
                            />
                        ))}
                    </CardList>
                )}

                <div style={{ height: 'calc(96px + env(safe-area-inset-bottom))' }}/>

                <FAB ariaLabel={t('users.new')} onClick={openCreate}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                    </svg>
                </FAB>

                <BottomSheet
                    open={sheetOpen}
                    onClose={closeSheet}
                    title={editing ? t('users.edit.title') : t('users.create.title')}
                    {...(editing ? { subtitle: editing.email } : {})}
                >
                    {(sheetOpen) && (
                        <UserForm
                            mode={editing === null ? 'create' : 'edit'}
                            {...(editing ? { initial: editing } : {})}
                            onSubmit={form => void handleSubmit(form)}
                            onCancel={closeSheet}
                            saving={formSaving}
                            error={formError}
                        />
                    )}
                </BottomSheet>
            </div>
        );
    }

    // ─────────── Desktop / Tablet layout ───────────
    return (
        <div>
            <PageHead title={t('users.pageTitle')} subtitle={subtitle}>
                <Btn onClick={openCreate}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                    </svg>
                    {t('users.new')}
                </Btn>
            </PageHead>

            <ErrorMsg msg={error}/>
            <SuccessMsg msg={saved}/>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('common.loading')}</p>
                ) : users.length === 0 ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('users.empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={TH}>{t('users.colEmail')}</th>
                                    <th style={{ ...TH, width: 120 }}>{t('users.colRole')}</th>
                                    <th style={{ ...TH, width: 100 }}>{t('users.colStatus')}</th>
                                    <th style={{ ...TH, width: 120 }}>{t('users.colCreated')}</th>
                                    <th style={{ ...TH, width: 160, textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => {
                                    const isMe = myEmail !== null && myEmail === u.email;
                                    return (
                                        <tr
                                            key={u.id}
                                            style={{
                                                borderBottom: i < users.length - 1 ? `1px solid ${T.border}` : 'none',
                                                background: isMe ? T.primaryTint : 'transparent',
                                            }}
                                        >
                                            <td style={{ ...TD, fontWeight: 600 }}>
                                                {u.email}
                                                {isMe && (
                                                    <span style={{
                                                        marginLeft: 8, fontFamily: MONO, fontSize: T.fontXs,
                                                        color: T.primary, fontWeight: 700,
                                                    }}>(you)</span>
                                                )}
                                            </td>
                                            <td style={TD}>
                                                <Pill variant={ROLE_TO_PILL[u.role]} label={u.role}/>
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontXs, color: u.status === 'active' ? T.successFg : T.textFaint }}>
                                                {u.status === 'active' ? t('users.status.active') : t('users.status.disabled')}
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted }}>
                                                {formatDate(u.created_at)}
                                            </td>
                                            <td style={{ ...TD, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                    <Btn variant="ghost" onClick={() => openEdit(u)}
                                                        style={{ height: T.controlHeightSm, padding: '0 10px', fontSize: T.fontXs }}>
                                                        {t('common.edit')}
                                                    </Btn>
                                                    <Btn variant="danger" onClick={() => void handleDelete(u)}
                                                        disabled={isMe}
                                                        style={{ height: T.controlHeightSm, padding: '0 10px', fontSize: T.fontXs }}>
                                                        {t('common.delete')}
                                                    </Btn>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal-style sheet (desktop): use BottomSheet for both PC + mobile — clean UX */}
            <BottomSheet
                open={sheetOpen}
                onClose={closeSheet}
                title={editing ? t('users.edit.title') : t('users.create.title')}
                {...(editing ? { subtitle: editing.email } : {})}
            >
                {sheetOpen && (
                    <UserForm
                        mode={editing === null ? 'create' : 'edit'}
                        {...(editing ? { initial: editing } : {})}
                        onSubmit={form => void handleSubmit(form)}
                        onCancel={closeSheet}
                        saving={formSaving}
                        error={formError}
                    />
                )}
            </BottomSheet>
        </div>
    );
}

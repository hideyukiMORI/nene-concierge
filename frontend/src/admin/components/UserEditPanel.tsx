import { useState } from 'react';
import type { UserSummary, UserRole, UserStatus } from '../api.js';
import { Btn, ErrorMsg, FIELD_LABEL_STYLE, applyFocus, removeFocus, CloseIcon, RightPane } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const MONO = T.fontMono;

type EditMode = 'pane' | 'overlay';

export interface UserFormState {
    email:    string;
    password: string;
    role:     UserRole;
    status:   UserStatus;
}

interface Props {
    /** null = create, UserSummary = edit, undefined = no selection (pane only) */
    editing:  UserSummary | null | undefined;
    open:     boolean;
    onClose:  () => void;
    onSubmit: (form: UserFormState) => void;
    onDelete?: () => void;
    saving:   boolean;
    error:    string | null;
    mode:     EditMode;
    deleteDisabled?: boolean;
}

export default function UserEditPanel({
    editing, open, onClose, onSubmit, onDelete, saving, error, mode, deleteDisabled,
}: Props) {
    const { t } = useTranslation();

    if (mode === 'overlay' && !open) return null;

    const isCreate = editing === null;
    const isEdit   = editing !== null && editing !== undefined;
    const hasSelection = isCreate || isEdit;

    const inner = (
        <>
            <div style={{ height: 3, background: T.primary, flexShrink: 0 }} />
            <header style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 18px',
                borderBottom: `1px solid ${T.border}`,
                flexShrink: 0,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 5,
                    background: T.primaryTint, color: T.primary,
                    border: `1px solid ${T.primaryBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 13, fontWeight: 700,
                    flexShrink: 0,
                }}>
                    {isEdit && editing
                        ? (editing.email[0]?.toUpperCase() ?? '?')
                        : isCreate ? '+' : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: T.fontMd, color: T.textStrong }}>
                        {isCreate
                            ? t('users.create.title')
                            : isEdit ? t('users.edit.title') : t('users.pageTitle')}
                    </div>
                    {isEdit && editing && (
                        <div style={{
                            fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{editing.email}</div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    aria-label={t('common.close')}
                    style={{
                        width: 26, height: 26, borderRadius: T.radiusSm,
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.textMuted, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <CloseIcon />
                </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 20px' }}>
                {!hasSelection && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', color: T.textFaint, fontSize: T.fontSm,
                        height: '100%', padding: 24, minHeight: 200,
                    }}>
                        <div style={{
                            fontFamily: MONO, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.10em', textTransform: 'uppercase',
                            marginBottom: 6,
                        }}>{t('users.noSelection.title')}</div>
                        <div>{t('users.noSelection.hint')}</div>
                    </div>
                )}

                {hasSelection && (
                    <UserFormInner
                        key={isEdit && editing ? editing.id : 'new'}
                        mode={isCreate ? 'create' : 'edit'}
                        {...(isEdit && editing ? { initial: editing } : {})}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        saving={saving}
                        error={error}
                        {...(isEdit && onDelete ? { onDelete, deleteDisabled: !!deleteDisabled } : {})}
                    />
                )}
            </div>
        </>
    );

    return <RightPane mode={mode} onClose={onClose} zIndex={900}>{inner}</RightPane>;
}

function UserFormInner({
    initial, mode, onSubmit, onCancel, saving, error, onDelete, deleteDisabled,
}: {
    initial?:        UserSummary;
    mode:            'create' | 'edit';
    onSubmit:        (form: UserFormState) => void;
    onCancel:        () => void;
    saving:          boolean;
    error:           string | null;
    onDelete?:       () => void;
    deleteDisabled?: boolean;
}) {
    const { t } = useTranslation();
    const [form, setForm] = useState<UserFormState>({
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
            {error && <ErrorMsg msg={error}/>}

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

            {mode === 'edit' && onDelete && (
                <div style={{
                    marginTop: 8, paddingTop: 12,
                    borderTop: `1px solid ${T.borderLight}`,
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <Btn variant="danger"
                        onClick={onDelete}
                        disabled={!!deleteDisabled}
                        style={{ height: T.controlHeightSm, padding: '0 12px', fontSize: T.fontXs }}>
                        {t('common.delete')}
                    </Btn>
                </div>
            )}
        </form>
    );
}

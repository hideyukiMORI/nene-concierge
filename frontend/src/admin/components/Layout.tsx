import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken } from '../auth.js';
import { T } from '../theme.js';
import { useTranslation, LOCALES, SUPPORTED_LOCALE_IDS } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';

// ── Shared focus/blur helpers (DOM mutation — no re-render) ───────────────────

export function applyFocus(el: HTMLElement) {
    el.style.borderColor = T.primary;
    el.style.boxShadow   = T.shadowFocus;
}
export function removeFocus(el: HTMLElement) {
    el.style.borderColor = T.borderInput;
    el.style.boxShadow   = 'none';
}

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({ to, label }: { to: string; label: string }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link
            to={to}
            style={{
                display: 'flex', alignItems: 'center',
                // 9px left-pad + 3px left-border = 12px visual indent (avoids layout-shift on activation)
                padding: '8px 12px 8px 9px', margin: '1px 0',
                color: active ? T.sidebarTitle : T.sidebarText,
                textDecoration: 'none',
                borderRadius: T.radiusMd,
                background: active ? T.sidebarActive : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: T.fontBase,
                transition: 'background 120ms ease, color 120ms ease',
                borderLeft: active ? `3px solid ${T.primary}` : '3px solid transparent',
            }}
            onMouseEnter={e => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = T.sidebarHover;
                    (e.currentTarget as HTMLElement).style.color = T.sidebarTitle;
                }
            }}
            onMouseLeave={e => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = T.sidebarText;
                }
            }}
        >
            {label}
        </Link>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function Layout() {
    const nav = useNavigate();
    const { t, locale, setLocale } = useTranslation();
    const { themeVariant, toggleVariant, canToggleVariant } = useTheme();

    function logout() {
        clearToken();
        nav('/');
    }

    // Sidebar utility button base style (compact — 28px)
    const sidebarBtnStyle: React.CSSProperties = {
        flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: '28px', padding: '0 9px',
        background: T.sidebarActive, border: `1px solid ${T.sidebarBorder}`,
        color: T.sidebarText, borderRadius: T.radiusMd,
        cursor: 'pointer', fontSize: T.fontSm, lineHeight: 1,
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ── Sidebar ── */}
            <aside style={{
                width: T.sidebarWidth, flexShrink: 0,
                background: T.sidebar, color: T.sidebarText,
                display: 'flex', flexDirection: 'column',
                borderRight: `1px solid ${T.sidebarBorder}`,
                position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
            }}>
                {/* Brand header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 56, padding: '0 16px',
                    borderBottom: `1px solid ${T.sidebarBorder}`,
                    flexShrink: 0,
                }}>
                    <span style={{
                        flex: 1, fontWeight: 700, fontSize: T.fontMd,
                        color: T.sidebarTitle, letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {t('nav.brand')}
                    </span>
                    <span style={{
                        background: T.primary, color: '#fff',
                        padding: '2px 7px', borderRadius: 4,
                        fontSize: T.fontXs, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        flexShrink: 0,
                    }}>
                        Admin
                    </span>
                </div>

                {/* Nav links */}
                <nav style={{ flex: 1, padding: '10px 8px' }} aria-label="Main">
                    <NavItem to="/dashboard"   label={t('nav.dashboard')} />
                    <NavItem to="/scenarios"   label={t('nav.scenarios')} />
                    <NavItem to="/appearance"  label={t('nav.appearance')} />
                    <NavItem to="/credentials" label={t('nav.credentials')} />
                    <NavItem to="/action-logs" label={t('nav.actionLogs')} />
                    <NavItem to="/sessions"    label={t('nav.sessions')} />
                    <NavItem to="/settings"    label={t('nav.settings')} />
                </nav>

                {/* Footer: locale + light/dark + logout */}
                <div style={{
                    flexShrink: 0, padding: '8px 10px 12px',
                    borderTop: `1px solid ${T.sidebarBorder}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <select
                        value={locale}
                        onChange={e => setLocale(e.target.value as SupportedLocale)}
                        aria-label="Language"
                        style={{
                            flex: 1, minWidth: 0,
                            height: '28px', padding: '0 8px',
                            borderRadius: T.radiusMd,
                            border: `1px solid ${T.sidebarBorder}`,
                            background: T.sidebarActive, color: T.sidebarText,
                            fontSize: T.fontSm, cursor: 'pointer', outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    >
                        {SUPPORTED_LOCALE_IDS.map(id => (
                            <option key={id} value={id}>{LOCALES[id].label}</option>
                        ))}
                    </select>
                    {canToggleVariant && (
                        <button
                            onClick={toggleVariant}
                            aria-label={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                            title={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                            style={sidebarBtnStyle}
                            onMouseEnter={e => {
                                (e.currentTarget).style.background = T.sidebarHover;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget).style.background = T.sidebarActive;
                            }}
                        >
                            {themeVariant === 'dark' ? '☀' : '🌙'}
                        </button>
                    )}
                    <button
                        onClick={logout}
                        title={t('nav.logout')}
                        aria-label={t('nav.logout')}
                        style={sidebarBtnStyle}
                        onMouseEnter={e => {
                            (e.currentTarget).style.background = 'oklch(15% 0.05 25 / 0.8)';
                            (e.currentTarget).style.color = 'oklch(75% 0.08 25)';
                            (e.currentTarget).style.borderColor = 'oklch(30% 0.08 25)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget).style.background = T.sidebarActive;
                            (e.currentTarget).style.color = T.sidebarText;
                            (e.currentTarget).style.borderColor = T.sidebarBorder;
                        }}
                    >
                        {t('nav.logout')}
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main style={{
                flex: 1, minWidth: 0, overflowY: 'auto',
                background: T.bg, padding: '32px 40px',
            }}>
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

export function PageTitle({
    children, style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <h1 style={{
            fontSize: T.font2xl, fontWeight: 700, marginBottom: 24,
            color: T.textStrong, letterSpacing: '-0.02em', lineHeight: 1.2,
            ...style,
        }}>
            {children}
        </h1>
    );
}

export function Card({
    children, style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            padding: '24px',
            boxShadow: T.shadowCard,
            ...style,
        }}>
            {children}
        </div>
    );
}

/**
 * Primary action button. All variants share the same 36px height so they
 * align perfectly with <Field> and <Select> in the same row.
 */
export function Btn({
    children, onClick, variant = 'primary', disabled, type = 'button', style,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'danger' | 'ghost';
    disabled?: boolean;
    type?: 'button' | 'submit';
    style?: React.CSSProperties;
}) {
    // 1.5px border on all variants → consistent height (primary/danger use same
    // color as background so the border is invisible; ghost uses it as stroke).
    const base: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: '36px', padding: '0 16px', gap: 6,
        borderRadius: T.radiusMd, fontWeight: 600, fontSize: T.fontBase,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1.5px solid transparent',
        boxSizing: 'border-box', lineHeight: 1, whiteSpace: 'nowrap',
        opacity: disabled ? 0.55 : 1,
        transition: 'filter 150ms ease, opacity 150ms ease',
        textDecoration: 'none',
    };
    const variants: Record<string, React.CSSProperties> = {
        primary: { background: T.primary, color: '#fff', borderColor: T.primary  },
        danger:  { background: T.danger,  color: '#fff', borderColor: T.danger   },
        ghost:   { background: 'transparent', color: T.primary, borderColor: T.primary },
    };
    return (
        <button
            type={type} onClick={onClick} disabled={disabled}
            style={{ ...base, ...variants[variant], ...style }}
            onMouseEnter={e => {
                if (!disabled) e.currentTarget.style.filter = 'brightness(0.90)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.filter = '';
            }}
            onMouseDown={e => {
                if (!disabled) e.currentTarget.style.filter = 'brightness(0.83)';
            }}
            onMouseUp={e => {
                if (!disabled) e.currentTarget.style.filter = 'brightness(0.90)';
            }}
        >
            {children}
        </button>
    );
}

export function Badge({ status }: { status: 'draft' | 'published' | 'archived' }) {
    const cfg = {
        draft:     { bg: T.badgeDraftBg, color: T.badgeDraftColor },
        published: { bg: T.badgePubBg,   color: T.badgePubColor   },
        archived:  { bg: T.badgeArchBg,  color: T.badgeArchColor  },
    } as const;
    const { t } = useTranslation();
    const labels = {
        draft:     t('scenario.status.draft'),
        published: t('scenario.status.published'),
        archived:  t('scenario.status.archived'),
    };
    const { bg, color } = cfg[status];
    return (
        <span style={{
            background: bg, color, padding: '3px 10px',
            borderRadius: T.radiusXl, fontSize: T.fontSm, fontWeight: 600,
            display: 'inline-block',
        }}>
            {labels[status]}
        </span>
    );
}

export function ErrorMsg({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return (
        <div style={{
            background: T.dangerBg, border: `1px solid ${T.dangerBorder}`,
            color: T.dangerText, borderRadius: T.radiusMd,
            padding: '10px 14px', marginBottom: 16, fontSize: T.fontBase,
            lineHeight: '1.5',
        }}>
            {msg}
        </div>
    );
}

export function SuccessMsg({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return (
        <div style={{
            background: T.successBg, border: `1px solid ${T.successBorder}`,
            color: T.successText, borderRadius: T.radiusMd,
            padding: '10px 14px', marginBottom: 16, fontSize: T.fontBase,
            lineHeight: '1.5',
        }}>
            {msg}
        </div>
    );
}

// ── Form field styles (shared constants) ─────────────────────────────────────
// Used by Field, Select, Textarea and imported by NodeConfigPanel.

export const FIELD_INPUT_STYLE: React.CSSProperties = {
    width: '100%', height: '36px', padding: '0 12px',
    boxSizing: 'border-box',
    borderRadius: T.radiusMd, border: `1.5px solid ${T.borderInput}`,
    fontSize: T.fontMd, outline: 'none',
    background: T.surface, color: T.text,
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

export const FIELD_LABEL_STYLE: React.CSSProperties = {
    display: 'block', fontWeight: 600, marginBottom: 5,
    fontSize: T.fontSm, color: T.textStrong, lineHeight: '1.4',
};

export function Field({
    label, value, onChange, type = 'text', placeholder, required,
}: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; required?: boolean;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={FIELD_LABEL_STYLE}>
                {label}{required && <span style={{ color: T.danger }}> *</span>}
            </span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required}
                style={FIELD_INPUT_STYLE}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}
            />
        </label>
    );
}

export function Select({
    label, value, onChange, options,
}: {
    label: string; value: string; onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={FIELD_LABEL_STYLE}>{label}</span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    ...FIELD_INPUT_STYLE,
                    cursor: 'pointer',
                    // padding adjustment: select needs extra-right room for arrow
                    padding: '0 12px',
                }}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

export function Textarea({
    label, value, onChange, placeholder, required, rows = 4,
}: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; required?: boolean; rows?: number;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={FIELD_LABEL_STYLE}>
                {label}{required && <span style={{ color: T.danger }}> *</span>}
            </span>
            <textarea
                value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required} rows={rows}
                style={{
                    width: '100%', padding: '8px 12px',
                    boxSizing: 'border-box',
                    borderRadius: T.radiusMd, border: `1.5px solid ${T.borderInput}`,
                    fontSize: T.fontMd, outline: 'none',
                    background: T.surface, color: T.text,
                    resize: 'vertical', lineHeight: '1.5',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}
            />
        </label>
    );
}

// ── Shared table-row hover handler ─────────────────────────────────────────

export const trHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = T.surfaceHover;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = '';
    },
};

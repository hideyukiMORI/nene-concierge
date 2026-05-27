import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken, getStoredEmail } from '../auth.js';
import { T } from '../theme.js';
import { useTranslation, LOCALES, SUPPORTED_LOCALE_IDS } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';

const SIDEBAR_OPEN_KEY = 'nene_admin_sidebar_open';

// ── Shared focus/blur helpers (DOM mutation — no re-render) ───────────────────

export function applyFocus(el: HTMLElement) {
    el.style.borderColor = T.primary;
    el.style.boxShadow   = T.shadowFocus;
}
export function removeFocus(el: HTMLElement) {
    el.style.borderColor = T.borderInput;
    el.style.boxShadow   = 'none';
}

// ── NavItem — nene-records AppShell の NavItem と同構造 ──────────────────────

const NAV_ICONS: Record<string, string> = {
    '/dashboard':   '⊞',
    '/scenarios':   '≡',
    '/appearance':  '◎',
    '/credentials': '◆',
    '/action-logs': '≣',
    '/sessions':    '○',
    '/settings':    '⚙',
};

function NavItem({ to, label, open }: { to: string; label: string; open: boolean }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    const icon   = NAV_ICONS[to] ?? '·';

    return (
        <Link
            to={to}
            title={open ? undefined : label}
            style={{
                display: 'flex', alignItems: 'center',
                justifyContent: open ? 'flex-start' : 'center',
                gap: open ? 10 : 0,
                padding: open ? '7px 12px' : '7px 0',
                margin: '1px 0',
                color: active ? T.sidebarTitle : T.sidebarText,
                textDecoration: 'none',
                borderRadius: T.radiusMd,
                background: active ? T.sidebarActive : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: T.fontBase,
                overflow: 'hidden', whiteSpace: 'nowrap',
                transition: `background ${T.transitionFast}, color ${T.transitionFast}`,
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
            <span style={{ opacity: 0.75, fontSize: 13, lineHeight: 1, flexShrink: 0 }}>
                {icon}
            </span>
            {open && <span>{label}</span>}
        </Link>
    );
}

function NavDivider() {
    return (
        <div style={{
            margin: '10px 0',
            borderTop: `1px solid ${T.sidebarBorder}`,
            opacity: 0.5,
        }} />
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function Layout() {
    const nav = useNavigate();
    const { t, locale, setLocale } = useTranslation();
    const { themeVariant, toggleVariant, canToggleVariant } = useTheme();
    const email = getStoredEmail();

    // ── Sidebar open/close (persisted) ────────────────────────────────────────
    const [open, setOpen] = useState(() =>
        localStorage.getItem(SIDEBAR_OPEN_KEY) !== 'false',
    );
    function toggleSidebar() {
        const next = !open;
        setOpen(next);
        localStorage.setItem(SIDEBAR_OPEN_KEY, String(next));
    }

    function logout() {
        clearToken();
        nav('/');
    }

    // Sidebar utility button — square, xs height (nene-records p-1.5 icon button)
    const sidebarIconBtn: React.CSSProperties = {
        flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: T.controlHeightXs, height: T.controlHeightXs,
        background: T.sidebarActive, border: `1px solid ${T.sidebarBorder}`,
        color: T.sidebarText, borderRadius: T.radiusMd,
        cursor: 'pointer', fontSize: 14, lineHeight: 1,
        transition: `background ${T.transitionFast}, color ${T.transitionFast}, border-color ${T.transitionFast}`,
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ── Sidebar ── */}
            <aside style={{
                width: open ? T.sidebarWidth : '52px',
                flexShrink: 0,
                background: T.sidebar, color: T.sidebarText,
                display: 'flex', flexDirection: 'column',
                borderRight: `1px solid ${T.sidebarBorder}`,
                position: 'sticky', top: 0, height: '100vh',
                overflow: 'hidden',
                transition: 'width 200ms ease',
            }}>
                {/* Brand header */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    height: 56, flexShrink: 0,
                    padding: open ? '0 8px 0 16px' : '0',
                    justifyContent: open ? 'flex-start' : 'center',
                    borderBottom: `1px solid ${T.sidebarBorder}`,
                    gap: 8,
                }}>
                    {open && (
                        <>
                            <span style={{
                                flex: 1, fontWeight: 600, fontSize: T.fontBase,
                                color: T.sidebarTitle, letterSpacing: '0.01em',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {t('nav.brand')}
                            </span>
                            <span style={{
                                background: T.primary, color: '#fff',
                                padding: '2px 7px', borderRadius: T.radiusSm,
                                fontSize: T.fontXs, fontWeight: 700,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                flexShrink: 0,
                            }}>
                                Admin
                            </span>
                        </>
                    )}
                    {/* Toggle button */}
                    <button
                        onClick={toggleSidebar}
                        title={open ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                        aria-label={open ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                        style={{
                            ...sidebarIconBtn,
                            background: 'transparent',
                            border: 'none',
                            fontSize: 16,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.sidebarHover; e.currentTarget.style.color = T.sidebarTitle; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sidebarText; }}
                    >
                        {open ? '‹' : '›'}
                    </button>
                </div>

                {/* Nav links */}
                <nav style={{
                    flex: 1,
                    padding: open ? '12px 8px' : '12px 4px',
                    overflowY: 'auto', overflowX: 'hidden',
                }} aria-label="Main">
                    <NavItem to="/dashboard"   label={t('nav.dashboard')}   open={open} />
                    <NavItem to="/scenarios"   label={t('nav.scenarios')}   open={open} />

                    <NavDivider />

                    <NavItem to="/appearance"  label={t('nav.appearance')}  open={open} />
                    <NavItem to="/credentials" label={t('nav.credentials')} open={open} />
                    <NavItem to="/action-logs" label={t('nav.actionLogs')}  open={open} />
                    <NavItem to="/sessions"    label={t('nav.sessions')}    open={open} />

                    <NavDivider />

                    <NavItem to="/settings"    label={t('nav.settings')}    open={open} />
                </nav>

                {/* Bottom: email + lang + theme + logout */}
                <div style={{
                    flexShrink: 0,
                    padding: open ? '10px 12px 12px' : '8px 4px',
                    borderTop: `1px solid ${T.sidebarBorder}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: open ? 'stretch' : 'center',
                    gap: open ? 0 : 6,
                }}>
                    {open && (
                        <>
                            {/* User email */}
                            {email && (
                                <div style={{
                                    fontSize: T.fontXs, color: T.sidebarMuted,
                                    padding: '0 2px', marginBottom: 8,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }} title={email}>
                                    {email}
                                </div>
                            )}

                            {/* Controls row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {/* Language selector */}
                                <select
                                    value={locale}
                                    onChange={e => setLocale(e.target.value as SupportedLocale)}
                                    aria-label="Language"
                                    style={{
                                        flex: 1, minWidth: 0,
                                        height: T.controlHeightXs, padding: '0 8px',
                                        boxSizing: 'border-box',
                                        borderRadius: T.radiusMd,
                                        border: `1px solid ${T.sidebarBorder}`,
                                        background: T.sidebarActive, color: T.sidebarText,
                                        fontSize: T.fontXs, cursor: 'pointer', outline: 'none',
                                    }}
                                >
                                    {SUPPORTED_LOCALE_IDS.map(id => (
                                        <option key={id} value={id}>{LOCALES[id].label}</option>
                                    ))}
                                </select>

                                {/* Theme toggle */}
                                {canToggleVariant && (
                                    <button
                                        onClick={toggleVariant}
                                        aria-label={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                                        title={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                                        style={sidebarIconBtn}
                                        onMouseEnter={e => { e.currentTarget.style.background = T.sidebarHover; e.currentTarget.style.color = T.sidebarTitle; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = T.sidebarActive; e.currentTarget.style.color = T.sidebarText; }}
                                    >
                                        {themeVariant === 'dark' ? '☀' : '🌙'}
                                    </button>
                                )}

                                {/* Logout */}
                                <button
                                    onClick={logout}
                                    title={t('nav.logout')}
                                    aria-label={t('nav.logout')}
                                    style={sidebarIconBtn}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'oklch(15% 0.05 25 / 0.8)';
                                        e.currentTarget.style.color = 'oklch(75% 0.08 25)';
                                        e.currentTarget.style.borderColor = 'oklch(30% 0.08 25)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = T.sidebarActive;
                                        e.currentTarget.style.color = T.sidebarText;
                                        e.currentTarget.style.borderColor = T.sidebarBorder;
                                    }}
                                >
                                    ↪
                                </button>
                            </div>
                        </>
                    )}

                    {/* Collapsed: show only logout */}
                    {!open && (
                        <button
                            onClick={logout}
                            title={t('nav.logout')}
                            aria-label={t('nav.logout')}
                            style={sidebarIconBtn}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'oklch(15% 0.05 25 / 0.8)';
                                e.currentTarget.style.color = 'oklch(75% 0.08 25)';
                                e.currentTarget.style.borderColor = 'oklch(30% 0.08 25)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = T.sidebarActive;
                                e.currentTarget.style.color = T.sidebarText;
                                e.currentTarget.style.borderColor = T.sidebarBorder;
                            }}
                        >
                            ↪
                        </button>
                    )}
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
 * Primary action button.
 * height は T.controlHeight (= var(--nca-control-height)) で一元管理。
 * index.html の --nca-control-height を変えるだけで全ボタンに反映される。
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
    const base: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: T.controlHeight,   // ← CSS 変数 — 直書き禁止
        padding: '0 16px', gap: 6,
        borderRadius: T.radiusMd, fontWeight: 600, fontSize: T.fontBase,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1.5px solid transparent',
        boxSizing: 'border-box', lineHeight: 1, whiteSpace: 'nowrap',
        opacity: disabled ? 0.55 : 1,
        transition: `filter ${T.transitionFast}, opacity ${T.transitionFast}`,
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
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.90)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
            onMouseDown={e  => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.83)'; }}
            onMouseUp={e    => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.90)'; }}
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

// ── Form field constants ──────────────────────────────────────────────────────
// height は T.controlHeight で参照 — CSS 変数一元管理のため直書き禁止。

export const FIELD_LABEL_STYLE: React.CSSProperties = {
    display: 'block', fontWeight: 600, marginBottom: 5,
    fontSize: T.fontSm, color: T.textStrong, lineHeight: '1.4',
};

const FIELD_INPUT_BASE: React.CSSProperties = {
    width: '100%',
    height: T.controlHeight,    // ← CSS 変数
    padding: '0 12px',
    boxSizing: 'border-box',
    borderRadius: T.radiusMd,
    border: `1.5px solid ${T.borderInput}`,
    fontSize: T.fontMd,
    outline: 'none',
    background: T.surface,
    color: T.text,
    transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
};

export { FIELD_INPUT_BASE as FIELD_INPUT_STYLE };

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
                style={FIELD_INPUT_BASE}
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
                style={{ ...FIELD_INPUT_BASE, cursor: 'pointer' }}
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
                    transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
                }}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}
            />
        </label>
    );
}

// ── Table row hover helper ────────────────────────────────────────────────────

export const trHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = T.surfaceHover;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = '';
    },
};

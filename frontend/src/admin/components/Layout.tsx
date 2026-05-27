import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken } from '../auth.js';
import { T } from '../theme.js';
import { useTranslation, LOCALES, SUPPORTED_LOCALE_IDS } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({ to, label }: { to: string; label: string }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link to={to} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', margin: '1px 0',
            color: active ? T.sidebarTitle : T.sidebarText,
            textDecoration: 'none',
            borderRadius: T.radiusMd,
            background: active ? T.sidebarActive : 'transparent',
            fontWeight: active ? 600 : 400,
            fontSize: T.fontBase,
            transition: 'background 0.12s, color 0.12s',
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
        }}>
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
                        flex: 1, fontWeight: 700, fontSize: T.fontBase,
                        color: T.sidebarTitle, letterSpacing: '0.01em',
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
                <nav style={{ flex: 1, padding: '12px 8px' }} aria-label="Main">
                    <NavItem to="/scenarios"    label={t('nav.scenarios')} />
                    <NavItem to="/appearance"   label={t('nav.appearance')} />
                    <NavItem to="/credentials"  label={t('nav.credentials')} />
                    <NavItem to="/action-logs"  label={t('nav.actionLogs')} />
                    <NavItem to="/settings"     label={t('nav.settings')} />
                </nav>

                {/* Footer: locale + light/dark toggle + logout */}
                <div style={{
                    flexShrink: 0, padding: '10px 10px 12px',
                    borderTop: `1px solid ${T.sidebarBorder}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <select
                        value={locale}
                        onChange={e => setLocale(e.target.value as SupportedLocale)}
                        aria-label="Language"
                        style={{
                            flex: 1, minWidth: 0,
                            padding: '6px 8px', borderRadius: T.radiusMd,
                            border: `1px solid ${T.sidebarBorder}`,
                            background: T.sidebarActive, color: T.sidebarText,
                            fontSize: T.fontSm, cursor: 'pointer', outline: 'none',
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
                            style={{
                                flexShrink: 0,
                                background: T.sidebarActive,
                                border: `1px solid ${T.sidebarBorder}`,
                                color: T.sidebarText,
                                padding: '6px 8px', borderRadius: T.radiusMd,
                                cursor: 'pointer', fontSize: 14,
                                lineHeight: 1, transition: 'background 0.12s',
                            }}
                        >
                            {themeVariant === 'dark' ? '☀' : '🌙'}
                        </button>
                    )}
                    <button
                        onClick={logout}
                        title={t('nav.logout')}
                        aria-label={t('nav.logout')}
                        style={{
                            flexShrink: 0,
                            background: T.sidebarActive,
                            border: `1px solid ${T.sidebarBorder}`,
                            color: T.sidebarText,
                            padding: '6px 10px',
                            borderRadius: T.radiusMd,
                            cursor: 'pointer',
                            fontSize: T.fontSm,
                            transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'oklch(15% 0.05 25 / 0.8)';
                            (e.currentTarget as HTMLElement).style.color = 'oklch(75% 0.08 25)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'oklch(30% 0.08 25)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = T.sidebarActive;
                            (e.currentTarget as HTMLElement).style.color = T.sidebarText;
                            (e.currentTarget as HTMLElement).style.borderColor = T.sidebarBorder;
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

export function PageTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <h1 style={{ fontSize: T.font2xl, fontWeight: 700, marginBottom: 24, color: T.textStrong, ...style }}>{children}</h1>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg, padding: '20px 24px',
            boxShadow: T.shadowCard, ...style,
        }}>
            {children}
        </div>
    );
}

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
        padding: '7px 16px', borderRadius: T.radiusMd, fontWeight: 600,
        fontSize: T.fontBase, cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none', opacity: disabled ? 0.55 : 1,
        transition: 'opacity 0.12s, filter 0.12s',
    };
    const variants: Record<string, React.CSSProperties> = {
        primary: { background: T.primary,  color: '#fff' },
        danger:  { background: T.danger,   color: '#fff' },
        ghost:   { background: 'transparent', color: T.primary, border: `1.5px solid ${T.primary}` },
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            style={{ ...base, ...variants[variant], ...style }}>
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
            background: bg, color, padding: '2px 10px',
            borderRadius: T.radiusXl, fontSize: T.fontSm, fontWeight: 600,
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
            color: T.dangerText, borderRadius: T.radiusMd, padding: '10px 14px',
            marginBottom: 16, fontSize: T.fontBase,
        }}>
            {msg}
        </div>
    );
}

export function Field({
    label, value, onChange, type = 'text', placeholder, required,
}: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; required?: boolean;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: T.fontBase, color: T.textStrong }}>
                {label}{required && <span style={{ color: T.danger }}> *</span>}
            </span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: T.radiusMd,
                    border: `1.5px solid ${T.borderInput}`, fontSize: T.fontMd,
                    outline: 'none', background: T.surface, color: T.text,
                    transition: 'border-color 0.12s',
                }}
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
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: T.fontBase, color: T.textStrong }}>
                {label}
            </span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: T.radiusMd,
                    border: `1.5px solid ${T.borderInput}`, fontSize: T.fontMd,
                    background: T.surface, color: T.text,
                }}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

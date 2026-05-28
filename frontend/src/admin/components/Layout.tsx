import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken, getStoredEmail } from '../auth.js';
import { T } from '../theme.js';
import { useTranslation, LOCALES, SUPPORTED_LOCALE_IDS } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';

const SIDEBAR_OPEN_KEY = 'nene_admin_sidebar_open';

// ─────────────────────────────────────────────────────────────────────────────
// v2 (2026-05-28) — エディタ画面 (variant="editor") は slim 54px サイドバー固定。
// 通常画面は従来の 240px/52px トグル可能サイドバーを維持。
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared focus/blur helpers (DOM mutation — no re-render) ───────────────────
export function applyFocus(el: HTMLElement) {
    el.style.borderColor = T.primary;
    el.style.boxShadow   = T.shadowFocus;
}
export function removeFocus(el: HTMLElement) {
    el.style.borderColor = T.borderInput;
    el.style.boxShadow   = 'none';
}

// ── Lucide-ish line icons (1.7px stroke) ─────────────────────────────────────
const I = {
    dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    flow:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
    palette:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="8" r="1.2" fill="currentColor"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor"/></svg>,
    key:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>,
    logs:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>,
    sessions:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>,
    settings:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    sun:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
    moon:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
};

const NAV_ITEMS = [
    { to: '/dashboard',   icon: I.dashboard, key: 'nav.dashboard' },
    { to: '/scenarios',   icon: I.flow,      key: 'nav.scenarios', divider: true },
    { to: '/appearance',  icon: I.palette,   key: 'nav.appearance' },
    { to: '/credentials', icon: I.key,       key: 'nav.credentials' },
    { to: '/action-logs', icon: I.logs,      key: 'nav.actionLogs' },
    { to: '/sessions',    icon: I.sessions,  key: 'nav.sessions', divider: true },
    { to: '/settings',    icon: I.settings,  key: 'nav.settings' },
] as const;

// ── NavItem (default sidebar) ────────────────────────────────────────────────
function NavItem({ to, icon, label, open }: { to: string; icon: React.ReactNode; label: string; open: boolean }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link to={to} title={open ? undefined : label}
            style={{
                display: 'flex', alignItems: 'center',
                justifyContent: open ? 'flex-start' : 'center',
                gap: open ? 10 : 0,
                padding: open ? '7px 12px' : '7px 0',
                margin: '1px 8px',
                color: active ? T.sidebarTitle : T.sidebarText,
                textDecoration: 'none',
                borderRadius: T.radiusLg,
                background: active ? T.sidebarActive : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: T.fontBase,
                overflow: 'hidden', whiteSpace: 'nowrap',
                position: 'relative',
                transition: `background ${T.transitionFast}, color ${T.transitionFast}`,
            }}
            onMouseEnter={e => { if (!active) {
                (e.currentTarget as HTMLElement).style.background = T.sidebarHover;
                (e.currentTarget as HTMLElement).style.color = T.sidebarTitle;
            }}}
            onMouseLeave={e => { if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = T.sidebarText;
            }}}>
            {active && (
                <span style={{
                    position: 'absolute', left: -8, top: 5, bottom: 5,
                    width: 2, background: T.primary, borderRadius: 2,
                }}/>
            )}
            <span style={{ display: 'inline-flex', flexShrink: 0,
                color: active ? T.primary : 'currentColor',
                opacity: active ? 1 : 0.75 }}>{icon}</span>
            {open && <span>{label}</span>}
        </Link>
    );
}

// ── SlimNavItem (editor variant) ─────────────────────────────────────────────
function SlimNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link to={to} title={label} aria-label={label}
            style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 7, position: 'relative',
                background: active ? T.sidebarActive : 'transparent',
                color: active ? T.primary : T.sidebarText,
                textDecoration: 'none',
                transition: `background ${T.transitionFast}, color ${T.transitionFast}`,
            }}>
            {active && (
                <span style={{
                    position: 'absolute', left: -10, top: 9, bottom: 9, width: 2.5,
                    background: T.primary, borderRadius: 2,
                }}/>
            )}
            {icon}
        </Link>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ variant = 'default' }: { variant?: 'default' | 'editor' }) {
    const nav = useNavigate();
    const { t, locale, setLocale } = useTranslation();
    const { themeVariant, toggleVariant, canToggleVariant } = useTheme();
    const email = getStoredEmail();

    const [open, setOpen] = useState(() =>
        localStorage.getItem(SIDEBAR_OPEN_KEY) !== 'false',
    );
    function toggleSidebar() {
        const next = !open;
        setOpen(next);
        localStorage.setItem(SIDEBAR_OPEN_KEY, String(next));
    }

    function logout() { clearToken(); nav('/'); }

    // ── Brand mark: Bracket "[n]" — モノスペース + 点滅カーソル ──────────
    // open=true でワードマーク表示、false でマークのみ
    function BrandMark({ open }: { open: boolean }) {
        const mono = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';
        const dim  = `${T.primary}88`; // 半透明アクセント色 (ブラケット部)
        return (
            <div title={t('nav.brand')} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: mono, fontWeight: 700, color: T.primary,
                lineHeight: 1,
            }}>
                {/* [n] */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1,
                    fontSize: open ? 15 : 17 }}>
                    <span style={{ color: dim, fontWeight: 500 }}>[</span>
                    <span>n</span>
                    <span style={{ color: dim, fontWeight: 500 }}>]</span>
                    <span className="nca-brand-cursor" style={{
                        display: 'inline-block', width: open ? 6 : 7, height: open ? 12 : 14,
                        background: T.primary, marginLeft: 3,
                        verticalAlign: 'middle',
                    }}/>
                </span>
                {/* wordmark — open のみ */}
                {open && (
                    <span style={{
                        marginLeft: 2, fontSize: T.fontBase, color: T.sidebarTitle,
                        fontWeight: 600, letterSpacing: '-0.005em',
                        flex: 1, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>nene<span style={{ color: T.sidebarMuted }}>.concierge</span></span>
                )}
            </div>
        );
    }

    // ── Slim editor sidebar ──────────────────────────────────────────────────
    if (variant === 'editor') {
        return (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <aside style={{
                    width: T.sidebarWidthSlim, flexShrink: 0,
                    background: T.sidebar, color: T.sidebarText,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    borderRight: `1px solid ${T.sidebarBorder}`,
                    position: 'sticky', top: 0, height: '100vh',
                    padding: '12px 0',
                    gap: 4,
                }}>
                    {/* Brand mark — Bracket */}
                    <div style={{ marginBottom: 6 }}>
                        <BrandMark open={false}/>
                    </div>
                    <div style={{ width: 28, height: 1, background: T.sidebarBorder, marginBottom: 6 }}/>

                    {/* Nav icons */}
                    {NAV_ITEMS.map((n, i) => (
                        <span key={i} style={{ display: 'contents' }}>
                            <SlimNavItem to={n.to} icon={n.icon} label={t(n.key as Parameters<typeof t>[0])}/>
                            {'divider' in n && n.divider && (
                                <div style={{ width: 28, height: 1, background: T.sidebarBorder, margin: '4px 0' }}/>
                            )}
                        </span>
                    ))}

                    <div style={{ flex: 1 }}/>

                    {/* Theme toggle */}
                    {canToggleVariant && (
                        <button onClick={toggleVariant}
                            title={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                            aria-label={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                            style={{
                                width: 36, height: 36, borderRadius: 7,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: themeVariant === 'dark' ? '#FBBF24' : T.sidebarText,
                            }}>
                            {themeVariant === 'dark' ? I.sun : I.moon}
                        </button>
                    )}

                    {/* Logout */}
                    <button onClick={logout}
                        title={t('nav.logout')} aria-label={t('nav.logout')}
                        style={{
                            width: 36, height: 36, borderRadius: 7,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: T.sidebarText,
                        }}>
                        {I.logout}
                    </button>

                    {/* Avatar (email initial) */}
                    {email && (
                        <div title={email} style={{
                            width: 30, height: 30, borderRadius: 99,
                            background: 'linear-gradient(135deg, #F97316, #DB2777)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 11,
                            marginTop: 4,
                        }}>{email[0]?.toUpperCase() ?? '?'}</div>
                    )}
                </aside>

                <main style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', background: T.bg,
                }}>
                    <Outlet />
                </main>
            </div>
        );
    }

    // ── Default sidebar (従来通り) ────────────────────────────────────────────
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
                <div style={{
                    display: 'flex', alignItems: 'center',
                    height: 56, flexShrink: 0,
                    padding: open ? '0 8px 0 16px' : '0',
                    justifyContent: open ? 'flex-start' : 'center',
                    borderBottom: `1px solid ${T.sidebarBorder}`,
                    gap: 8,
                }}>
                    {open ? (
                        <>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <BrandMark open={true}/>
                            </div>
                            <span style={{
                                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                                fontSize: 9, fontWeight: 700,
                                color: T.primary,
                                padding: '2px 0',
                                borderTop: `1px solid ${T.primary}66`,
                                borderBottom: `1px solid ${T.primary}66`,
                                letterSpacing: '0.14em', textTransform: 'uppercase',
                                lineHeight: 1, flexShrink: 0,
                            }}>admin</span>
                        </>
                    ) : (
                        <BrandMark open={false}/>
                    )}
                    <button onClick={toggleSidebar}
                        title={open ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                        aria-label={open ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                        style={{ ...sidebarIconBtn, background: 'transparent', border: 'none', fontSize: 16 }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.sidebarHover; e.currentTarget.style.color = T.sidebarTitle; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sidebarText; }}>
                        {open ? '‹' : '›'}
                    </button>
                </div>

                <nav style={{
                    flex: 1,
                    padding: open ? '12px 0' : '12px 4px',
                    overflowY: 'auto', overflowX: 'hidden',
                }} aria-label="Main">
                    {NAV_ITEMS.map((n, i) => (
                        <span key={i} style={{ display: 'contents' }}>
                            <NavItem to={n.to} icon={n.icon} label={t(n.key as Parameters<typeof t>[0])} open={open}/>
                            {'divider' in n && n.divider && (
                                <div style={{ margin: '10px 0', borderTop: `1px solid ${T.sidebarBorder}`, opacity: 0.5 }}/>
                            )}
                        </span>
                    ))}
                </nav>

                <div style={{
                    flexShrink: 0,
                    padding: open ? '10px 12px 12px' : '8px 4px',
                    borderTop: `1px solid ${T.sidebarBorder}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: open ? 'stretch' : 'center', gap: open ? 0 : 6,
                }}>
                    {open && (
                        <>
                            {email && (
                                <div title={email} style={{
                                    fontSize: T.fontXs, color: T.sidebarMuted,
                                    padding: '0 2px', marginBottom: 8,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{email}</div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <select value={locale} onChange={e => setLocale(e.target.value as SupportedLocale)}
                                    aria-label="Language"
                                    style={{
                                        flex: 1, minWidth: 0,
                                        height: T.controlHeightXs, padding: '0 8px',
                                        boxSizing: 'border-box', borderRadius: T.radiusMd,
                                        border: `1px solid ${T.sidebarBorder}`,
                                        background: T.sidebarActive, color: T.sidebarText,
                                        fontSize: T.fontXs, cursor: 'pointer', outline: 'none',
                                    }}>
                                    {SUPPORTED_LOCALE_IDS.map(id => (
                                        <option key={id} value={id}>{LOCALES[id].label}</option>
                                    ))}
                                </select>
                                {canToggleVariant && (
                                    <button onClick={toggleVariant}
                                        aria-label={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                                        title={themeVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                                        style={sidebarIconBtn}>
                                        {themeVariant === 'dark' ? I.sun : I.moon}
                                    </button>
                                )}
                                <button onClick={logout} title={t('nav.logout')} aria-label={t('nav.logout')}
                                    style={sidebarIconBtn}>
                                    {I.logout}
                                </button>
                            </div>
                        </>
                    )}
                    {!open && (
                        <button onClick={logout} title={t('nav.logout')} aria-label={t('nav.logout')}
                            style={sidebarIconBtn}>
                            {I.logout}
                        </button>
                    )}
                </div>
            </aside>

            <main style={{
                flex: 1, minWidth: 0, overflowY: 'auto',
                background: T.bg, padding: '28px 36px 48px',
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives (Btn / Badge / PageTitle / Card / ErrorMsg / SuccessMsg /
// Field / Select / Textarea / FIELD_LABEL_STYLE / FIELD_INPUT_STYLE / trHover)
// は既存の Layout.tsx と同じものを引き続き使用。差し替え不要。
// ─────────────────────────────────────────────────────────────────────────────

export function PageTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <h1 style={{
            fontSize: T.font2xl, fontWeight: 700, marginBottom: 24,
            color: T.textStrong, letterSpacing: '-0.02em', lineHeight: 1.2,
            ...style,
        }}>{children}</h1>
    );
}

// ── PageHead — title + subtitle (mono) + actions ──────────────────────────────
export function PageHead({ title, subtitle, children }: {
    title:     string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 12, marginBottom: 18,
        }}>
            <div>
                <h1 style={{
                    fontSize: T.font2xl, fontWeight: 700, marginBottom: 2,
                    color: T.textStrong, letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>{title}</h1>
                {subtitle && (
                    <div style={{
                        fontSize: T.fontSm, color: T.textMuted,
                        fontFamily: T.fontMono, letterSpacing: '0.02em',
                    }}>{subtitle}</div>
                )}
            </div>
            {children && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {children}
                </div>
            )}
        </div>
    );
}

// ── StatusPill — dot + uppercase mono label ───────────────────────────────────
type PillVariant = 'published' | 'draft' | 'archived' | 'success' | 'failure' | 'active' | 'completed' | 'converted' | 'abandoned' | 'dropped';
const PILL_STYLES: Record<PillVariant, React.CSSProperties> = {
    published:  { background: T.badgePubBg,    color: T.badgePubColor },
    completed:  { background: T.badgePubBg,    color: T.badgePubColor },
    converted:  { background: T.successPillBg, color: T.successFg },
    success:    { background: T.successPillBg, color: T.successFg },
    draft:      { background: T.badgeDraftBg,  color: T.badgeDraftColor },
    archived:   { background: T.badgeArchBg,   color: T.badgeArchColor },
    abandoned:  { background: T.badgeArchBg,   color: T.badgeArchColor },
    dropped:    { background: T.badgeArchBg,   color: T.badgeArchColor },
    failure:    { background: T.dangerBg, color: T.dangerFg, border: `1px solid ${T.dangerBorder}` },
    active:     { background: T.primaryTint, color: T.primary },
};
export function StatusPill({ variant, label }: { variant: PillVariant; label?: string }) {
    const s = PILL_STYLES[variant] ?? PILL_STYLES.draft;
    const text = label ?? variant;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 22, padding: '0 9px', borderRadius: T.radiusXl,
            fontSize: T.fontXs, fontWeight: 700, fontFamily: T.fontMono,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            ...s,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: 'currentColor', flexShrink: 0 }} />
            {text}
        </span>
    );
}

// ── AdapterTag — muted brand color ────────────────────────────────────────────
const ADAPTER_STYLES: Record<string, React.CSSProperties> = {
    http:     { color: T.adapterHttp,     background: T.adapterHttpBg },
    email:    { color: T.adapterEmail,    background: T.adapterEmailBg },
    slack:    { color: T.adapterSlack,    background: T.adapterSlackBg },
    chatwork: { color: T.adapterChatwork, background: T.adapterChatworkBg },
};
export function AdapterTag({ adapter }: { adapter: string }) {
    const s = ADAPTER_STYLES[adapter] ?? { color: T.textMuted, background: T.surfaceAlt };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: T.fontMono, fontSize: T.fontXs, fontWeight: 700,
            letterSpacing: '0.02em', padding: '2px 8px', borderRadius: T.radiusXl,
            ...s,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: 'currentColor', flexShrink: 0 }} />
            {adapter}
        </span>
    );
}

// ── SectionHead — mono uppercase label + horizontal rule ─────────────────────
export function SectionHead({ label, children }: { label: string; children?: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 14,
        }}>
            <span style={{
                fontSize: T.fontXs, fontWeight: 700, color: T.textMuted,
                fontFamily: T.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase',
                flexShrink: 0,
            }}>{label}</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            {children}
        </div>
    );
}

// ── CardSub — mono label above card title ─────────────────────────────────────
export function CardSub({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: T.fontXs, fontWeight: 600, color: T.textMuted,
            fontFamily: T.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 4,
        }}>{children}</div>
    );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg, padding: '16px 18px',
            boxShadow: T.shadowCard, ...style,
        }}>{children}</div>
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
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: T.controlHeight, padding: '0 12px', gap: 6,
        borderRadius: T.radiusMd, fontWeight: 600, fontSize: T.fontBase,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid transparent',
        boxSizing: 'border-box', lineHeight: 1, whiteSpace: 'nowrap',
        opacity: disabled ? 0.55 : 1,
        transition: `filter ${T.transitionFast}, opacity ${T.transitionFast}`,
        textDecoration: 'none',
    };
    const variants: Record<string, React.CSSProperties> = {
        primary: { background: T.primary,     color: T.primaryFg, borderColor: T.primary },
        danger:  { background: T.danger,      color: '#fff',      borderColor: T.danger },
        ghost:   { background: 'transparent', color: T.primary,   borderColor: T.primary },
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            style={{ ...base, ...variants[variant], ...style }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.90)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ''; }}>
            {children}
        </button>
    );
}

export function Badge({ status }: { status: 'draft' | 'published' | 'archived' }) {
    const colors = {
        draft:     T.badgeDraftColor,
        published: T.badgePubColor,
        archived:  T.badgeArchColor,
    } as const;
    const { t } = useTranslation();
    const labels = {
        draft:     t('scenario.status.draft'),
        published: t('scenario.status.published'),
        archived:  t('scenario.status.archived'),
    };
    return (
        <span style={{ color: colors[status], fontSize: T.fontSm, fontWeight: 600 }}>
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
            padding: '10px 14px', marginBottom: 16, fontSize: T.fontBase, lineHeight: '1.5',
        }}>{msg}</div>
    );
}

export function SuccessMsg({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return (
        <div style={{
            background: T.successBg, border: `1px solid ${T.successBorder}`,
            color: T.successText, borderRadius: T.radiusMd,
            padding: '10px 14px', marginBottom: 16, fontSize: T.fontBase, lineHeight: '1.5',
        }}>{msg}</div>
    );
}

// ── Form field constants ──────────────────────────────────────────────────────
export const FIELD_LABEL_STYLE: React.CSSProperties = {
    display: 'block', fontWeight: 600, marginBottom: 5,
    fontSize: T.fontSm, color: T.textStrong, lineHeight: '1.4',
};

const FIELD_INPUT_BASE: React.CSSProperties = {
    width: '100%',
    height: T.controlHeight, padding: '0 12px', boxSizing: 'border-box',
    borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
    fontSize: T.fontMd, outline: 'none',
    background: T.surface, color: T.text,
    transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
};

export { FIELD_INPUT_BASE as FIELD_INPUT_STYLE };

export function Field({ label, value, onChange, type = 'text', placeholder, required }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; required?: boolean;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={FIELD_LABEL_STYLE}>
                {label}{required && <span style={{ color: T.danger }}> *</span>}
            </span>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required}
                style={FIELD_INPUT_BASE}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}/>
        </label>
    );
}

export function Select({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={FIELD_LABEL_STYLE}>{label}</span>
            <select value={value} onChange={e => onChange(e.target.value)}
                style={{ ...FIELD_INPUT_BASE, cursor: 'pointer' }}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

export function Textarea({ label, value, onChange, placeholder, required, rows = 4 }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; required?: boolean; rows?: number;
}) {
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={FIELD_LABEL_STYLE}>
                {label}{required && <span style={{ color: T.danger }}> *</span>}
            </span>
            <textarea value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required} rows={rows}
                style={{
                    width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                    borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
                    fontSize: T.fontMd, outline: 'none',
                    background: T.surface, color: T.text,
                    resize: 'vertical', lineHeight: '1.5',
                    transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
                }}
                onFocus={e => applyFocus(e.currentTarget)}
                onBlur={e  => removeFocus(e.currentTarget)}/>
        </label>
    );
}

export const trHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = T.surfaceHover;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.background = '';
    },
};

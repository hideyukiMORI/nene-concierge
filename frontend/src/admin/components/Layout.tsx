import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken, getStoredEmail } from '../auth.js';
import { getMe, type MeResponse } from '../api.js';
import { T } from '../theme.js';
import { useTranslation, LOCALES, SUPPORTED_LOCALE_IDS } from '../i18n/index.js';
import type { SupportedLocale } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';

// ── LayoutContext ─────────────────────────────────────────────────────────────
// モバイル対応のページが Layout 側のヘッダー/パディングを抑止し、自前で MobileHeader
// を描画するためのコンテキスト。Mobile.tsx の <MobileHeader> がマウント時に
// providesHeader=true を立てる → Layout の fixed hamburger を隠し、main の上下左右
// padding と maxWidth ラッパーを外す。

export interface LayoutCtx {
    isMobile:         boolean;
    bp:               Breakpoint;
    openMobileMenu:   () => void;
    setProvidesHeader:(v: boolean) => void;
    /** Wide+ (≥1441px) で page を full-width / padding 0 にする。
     *  Sessions / ActionLogs の 2-pane や Appearance の full-width で使う。 */
    setFullWidth:     (v: boolean) => void;
}
const LayoutContext = createContext<LayoutCtx | null>(null);
export function useLayout(): LayoutCtx {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error('useLayout must be used within Layout');
    return ctx;
}

const SIDEBAR_OPEN_KEY = 'nene_admin_sidebar_open';

// ── Breakpoint hook ───────────────────────────────────────────────────────────
//   mobile     <640
//   tablet     640-1023
//   desktop    1024-1440
//   wide       1441-1599   (Sessions / ActionLogs 2-pane / Appearance full-width / Dashboard max 1480)
//   ultraWide  1600+       (Dashboard 下段 3-col; max-width up to 1720 at 1800+)
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultraWide';

export function useBreakpoint(): Breakpoint {
    const getbp = (): Breakpoint => {
        const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
        if (w < 640)  return 'mobile';
        if (w < 1024) return 'tablet';
        if (w < 1441) return 'desktop';
        if (w < 1600) return 'wide';
        return 'ultraWide';
    };
    const [bp, setBp] = useState<Breakpoint>(getbp);
    useEffect(() => {
        let raf = 0;
        const handler = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setBp(getbp())); };
        window.addEventListener('resize', handler);
        return () => { window.removeEventListener('resize', handler); cancelAnimationFrame(raf); };
    }, []);
    return bp;
}

/** ≥1441px? (wide or ultraWide) */
export function isWideBp(bp: Breakpoint): boolean {
    return bp === 'wide' || bp === 'ultraWide';
}
/** ≥1600px? */
export function isUltraWideBp(bp: Breakpoint): boolean {
    return bp === 'ultraWide';
}

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
    users:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

const NAV_ITEMS = [
    { to: '/dashboard',   icon: I.dashboard, key: 'nav.dashboard' },
    { to: '/scenarios',   icon: I.flow,      key: 'nav.scenarios', divider: true },
    { to: '/appearance',  icon: I.palette,   key: 'nav.appearance' },
    { to: '/credentials', icon: I.key,       key: 'nav.credentials' },
    { to: '/action-logs', icon: I.logs,      key: 'nav.actionLogs' },
    { to: '/sessions',    icon: I.sessions,  key: 'nav.sessions', divider: true },
    { to: '/users',       icon: I.users,     key: 'nav.users' },
    { to: '/settings',    icon: I.settings,  key: 'nav.settings' },
] as const;

// ── NavItem (default sidebar) ────────────────────────────────────────────────
function NavItem({ to, icon, label, open, onClick }: { to: string; icon: React.ReactNode; label: string; open: boolean; onClick?: () => void }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link to={to} title={open ? undefined : label} onClick={onClick}
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

// ── OrgIndicator ─────────────────────────────────────────────────────────────
// 現在の組織名 + 所属組織数を表示する read-only バッジ。サイドバー上部に配置。
const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

type TFn = ReturnType<typeof useTranslation>['t'];

function OrgIndicator({
    me, showLabels, t,
}: { me: MeResponse | null; showLabels: boolean; t: TFn }) {
    if (!me) return null;
    const current = me.current_organization;
    const others  = current ? me.organizations.filter(o => o.id !== current.id) : me.organizations;

    if (!showLabels) {
        // Slim 表示: 円形イニシャル
        const initial = (current?.name ?? '?').trim().slice(0, 1).toUpperCase();
        return (
            <div title={current?.name ?? ''}
                style={{
                    margin: '8px auto', width: 24, height: 24, borderRadius: 99,
                    background: T.primaryTint, color: T.primary,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    flexShrink: 0,
                }}>{initial}</div>
        );
    }

    return (
        <div style={{
            margin: '8px 10px',
            padding: '8px 10px',
            borderRadius: T.radiusMd,
            background: T.surfaceAlt,
            border: `1px solid ${T.sidebarBorder}`,
            display: 'flex', flexDirection: 'column', gap: 4,
        }}>
            <div style={{
                fontFamily: MONO, fontSize: 9, color: T.sidebarMuted,
                letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{t('me.currentOrg')}</div>
            <div style={{
                fontSize: T.fontSm, fontWeight: 600, color: T.sidebarTitle,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{current?.name ?? t('me.noOrg')}</div>
            {others.length > 0 && (
                <div style={{
                    fontFamily: MONO, fontSize: 10, color: T.sidebarMuted,
                    marginTop: 2,
                }}>
                    + {others.length} {t('me.moreOrgs')}
                </div>
            )}
        </div>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ variant = 'default' }: { variant?: 'default' | 'editor' }) {
    const nav = useNavigate();
    const { t, locale, setLocale } = useTranslation();
    const { themeVariant, toggleVariant, canToggleVariant } = useTheme();
    const email = getStoredEmail();
    const bp    = useBreakpoint();

    const [open, setOpen] = useState(() =>
        localStorage.getItem(SIDEBAR_OPEN_KEY) !== 'false',
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const [providesHeader, setProvidesHeader] = useState(false);
    const [fullWidth, setFullWidth] = useState(false);
    const [me, setMe] = useState<MeResponse | null>(null);

    useEffect(() => {
        let cancelled = false;
        getMe()
            .then(res => { if (!cancelled) setMe(res); })
            .catch(() => { /* ignore — sidebar gracefully degrades */ });
        return () => { cancelled = true; };
    }, []);

    // タブレット時はサイドバーを強制 slim / モバイル時は開閉状態を管理
    const isTablet = bp === 'tablet';
    const isMobile = bp === 'mobile';
    const wide     = isWideBp(bp);

    // モバイルメニューを閉じるとき body class も除去
    useEffect(() => {
        if (!isMobile) setMobileOpen(false);
    }, [isMobile]);

    const layoutCtx = useMemo<LayoutCtx>(() => ({
        isMobile,
        bp,
        openMobileMenu: () => setMobileOpen(true),
        setProvidesHeader,
        setFullWidth,
    }), [isMobile, bp]);

    function toggleSidebar() {
        if (isMobile) { setMobileOpen(v => !v); return; }
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
            <LayoutContext.Provider value={layoutCtx}>
            <div style={{ display: 'flex', minHeight: '100vh' }}>

                {/* Mobile drawer backdrop + drawer (reuse the default Layout の lookup) */}
                {isMobile && mobileOpen && (
                    <div
                        onClick={() => setMobileOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 140,
                            background: 'rgba(15,23,42,.40)',
                            backdropFilter: 'blur(2px)',
                        }}
                    />
                )}
                {/* Mobile slide-in drawer (240px) */}
                {isMobile && (
                    <aside style={{
                        position: 'fixed', top: 0,
                        left: mobileOpen ? 0 : -240,
                        width: 240, height: '100vh', zIndex: 145,
                        background: T.sidebar, color: T.sidebarText,
                        borderRight: `1px solid ${T.sidebarBorder}`,
                        transition: 'left 220ms ease',
                        display: 'flex', flexDirection: 'column',
                        paddingTop: 'env(safe-area-inset-top)',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            height: 56, flexShrink: 0, padding: '0 8px 0 16px',
                            borderBottom: `1px solid ${T.sidebarBorder}`,
                            gap: 8,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <BrandMark open={true}/>
                            </div>
                            <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                                style={{
                                    width: T.controlHeightXs, height: T.controlHeightXs,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'transparent', border: 'none',
                                    color: T.sidebarText, fontSize: 16, cursor: 'pointer',
                                    borderRadius: T.radiusMd,
                                }}>✕</button>
                        </div>
                        <OrgIndicator me={me} showLabels={true} t={t}/>
                        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }} aria-label="Main">
                            {NAV_ITEMS.map((n, i) => (
                                <span key={i} style={{ display: 'contents' }}>
                                    <NavItem to={n.to} icon={n.icon}
                                        label={t(n.key as Parameters<typeof t>[0])}
                                        open={true}
                                        onClick={() => setMobileOpen(false)}/>
                                    {'divider' in n && n.divider && (
                                        <div style={{ margin: '10px 0', borderTop: `1px solid ${T.sidebarBorder}`, opacity: 0.5 }}/>
                                    )}
                                </span>
                            ))}
                        </nav>
                    </aside>
                )}

                {/* Slim editor sidebar (desktop / tablet のみ — モバイルは非表示) */}
                {!isMobile && <aside style={{
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
                </aside>}

                <main style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', background: T.bg,
                }}>
                    <Outlet />
                </main>
            </div>
            </LayoutContext.Provider>
        );
    }

    // ── Responsive sidebar state ─────────────────────────────────────────────
    // desktop: open/closed toggle (240px / 52px)
    // tablet:  always slim icon-only (56px)
    // mobile:  fixed, off-screen; hamburger slides it in (240px)
    const showLabels  = isMobile ? true  : isTablet ? false : open;
    const sidebarW    = isMobile ? 240   : isTablet ? 56    : open ? 240 : 52;
    const sidebarPos  = isMobile
        ? { position: 'fixed' as const, top: 0, left: mobileOpen ? 0 : -240, zIndex: 145, height: '100vh', transition: 'left 220ms ease' }
        : { position: 'sticky' as const, top: 0, height: '100vh' };

    const mainPadding = isMobile
        ? (providesHeader ? '0' : '60px 16px 40px')
        : isTablet ? '24px 24px 48px'
        : (wide && fullWidth) ? '0'
        : '28px 36px 48px';

    const sidebarIconBtn: React.CSSProperties = {
        flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: T.controlHeightXs, height: T.controlHeightXs,
        background: T.sidebarActive, border: `1px solid ${T.sidebarBorder}`,
        color: T.sidebarText, borderRadius: T.radiusMd,
        cursor: 'pointer', fontSize: 14, lineHeight: 1,
        transition: `background ${T.transitionFast}, color ${T.transitionFast}, border-color ${T.transitionFast}`,
    };

    // SVG hamburger icon
    const HamburgerIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );

    return (
        <LayoutContext.Provider value={layoutCtx}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* Mobile overlay */}
            {isMobile && mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 140,
                        background: 'rgba(15,23,42,.40)',
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* Mobile hamburger button — ページが自前で MobileHeader を出している時は隠す */}
            {isMobile && !providesHeader && (
                <button
                    onClick={() => setMobileOpen(v => !v)}
                    aria-label="Open menu"
                    className="nca-mobile-menu visible"
                    style={{}}
                >
                    <HamburgerIcon />
                </button>
            )}

            <aside style={{
                width: sidebarW,
                flexShrink: 0,
                background: T.sidebar, color: T.sidebarText,
                display: 'flex', flexDirection: 'column',
                borderRight: `1px solid ${T.sidebarBorder}`,
                overflow: 'hidden',
                transition: 'width 200ms ease',
                ...sidebarPos,
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center',
                    height: 56, flexShrink: 0,
                    padding: showLabels ? '0 8px 0 16px' : '0',
                    justifyContent: showLabels ? 'flex-start' : 'center',
                    borderBottom: `1px solid ${T.sidebarBorder}`,
                    gap: 8,
                }}>
                    {showLabels ? (
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
                    {/* Toggle button — desktop only */}
                    {!isTablet && !isMobile && (
                        <button onClick={toggleSidebar}
                            title={open ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                            aria-label={open ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
                            style={{ ...sidebarIconBtn, background: 'transparent', border: 'none', fontSize: 16 }}
                            onMouseEnter={e => { e.currentTarget.style.background = T.sidebarHover; e.currentTarget.style.color = T.sidebarTitle; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sidebarText; }}>
                            {open ? '‹' : '›'}
                        </button>
                    )}
                    {/* Mobile close button */}
                    {isMobile && (
                        <button onClick={() => setMobileOpen(false)}
                            aria-label="Close menu"
                            style={{ ...sidebarIconBtn, background: 'transparent', border: 'none', fontSize: 16 }}>
                            ✕
                        </button>
                    )}
                </div>

                <OrgIndicator me={me} showLabels={showLabels} t={t}/>

                <nav style={{
                    flex: 1,
                    padding: showLabels ? '12px 0' : '12px 4px',
                    overflowY: 'auto', overflowX: 'hidden',
                }} aria-label="Main">
                    {NAV_ITEMS.map((n, i) => (
                        <span key={i} style={{ display: 'contents' }}>
                            <NavItem
                                to={n.to}
                                icon={n.icon}
                                label={t(n.key as Parameters<typeof t>[0])}
                                open={showLabels}
                                {...(isMobile ? { onClick: () => setMobileOpen(false) } : {})}
                            />
                            {'divider' in n && n.divider && (
                                <div style={{ margin: '10px 0', borderTop: `1px solid ${T.sidebarBorder}`, opacity: 0.5 }}/>
                            )}
                        </span>
                    ))}
                </nav>

                <div style={{
                    flexShrink: 0,
                    padding: showLabels ? '10px 12px 12px' : '8px 4px',
                    borderTop: `1px solid ${T.sidebarBorder}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: showLabels ? 'stretch' : 'center', gap: showLabels ? 0 : 6,
                }}>
                    {showLabels && (
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
                    {!showLabels && (
                        <button onClick={logout} title={t('nav.logout')} aria-label={t('nav.logout')}
                            style={sidebarIconBtn}>
                            {I.logout}
                        </button>
                    )}
                </div>
            </aside>

            <main style={{
                flex: 1, minWidth: 0, overflowY: 'auto',
                background: T.bg, padding: mainPadding,
                // mobile: sidebar is fixed so main takes full width
                width: isMobile ? '100%' : undefined,
            }}>
                {/* ラッパー <div> は常に描画する。
                    providesHeader / fullWidth 切替で wrapper を出し入れすると React が Outlet を
                    unmount/remount し、ページ state が毎回リセットされる → useEffect の
                    再発火による無限フェッチループの原因になる。 */}
                <div style={{
                    maxWidth: (isMobile && providesHeader) || (wide && fullWidth) ? 'none' : 1100,
                    margin:   '0 auto',
                    width:    (isMobile && providesHeader) || (wide && fullWidth) ? '100%' : undefined,
                }}>
                    <Outlet />
                </div>
            </main>
        </div>
        </LayoutContext.Provider>
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
        primary: { background: T.primary,      color: T.primaryFg, borderColor: T.primary },
        danger:  { background: 'transparent',  color: T.dangerFg,  borderColor: T.border },
        ghost:   { background: 'transparent',  color: T.text,      borderColor: T.border },
    };
    const hoverStyles: Record<string, { bg: string; border?: string }> = {
        primary: { bg: T.primary },
        danger:  { bg: T.dangerBg, border: T.dangerBorder },
        ghost:   { bg: T.surfaceHover },
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            style={{ ...base, ...variants[variant], ...style }}
            onMouseEnter={e => {
                if (disabled) return;
                const h = hoverStyles[variant];
                e.currentTarget.style.background = h.bg;
                if (h.border) e.currentTarget.style.borderColor = h.border;
                if (variant === 'primary') e.currentTarget.style.filter = 'brightness(0.92)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = variants[variant].background as string;
                e.currentTarget.style.borderColor = variants[variant].borderColor as string;
                e.currentTarget.style.filter = '';
            }}>
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

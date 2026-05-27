import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken } from '../auth.js';
import { T } from '../theme.js';

const S = {
    shell:   { display:'flex', minHeight:'100vh' },
    sidebar: {
        width: T.sidebarWidth, background: T.sidebar, color: T.sidebarText,
        display: 'flex', flexDirection: 'column' as const,
        flexShrink: 0,
    },
    logo: {
        padding: '20px 16px 16px', fontWeight: 700, fontSize: T.fontLg,
        borderBottom: `1px solid ${T.sidebarBorder}`, color: T.sidebarTitle,
    },
    nav:    { flex: 1, padding: '12px 0' },
    main:   { flex: 1, padding: '32px 40px', overflowY: 'auto' as const },
    footer: { padding: '16px', borderTop: `1px solid ${T.sidebarBorder}` },
};

const navItems = [
    { to: '/scenarios',    label: 'シナリオ' },
    { to: '/appearance',   label: '外観設定' },
    { to: '/credentials',  label: 'アクションクレデンシャル' },
];

function NavLink({ to, label }: { to: string; label: string }) {
    const loc    = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link to={to} style={{
            display: 'block', padding: '9px 16px',
            color: active ? T.sidebarTitle : T.sidebarMuted,
            textDecoration: 'none', borderRadius: T.radiusSm, margin: '2px 8px',
            background: active ? T.sidebarActive : 'transparent',
            fontWeight: active ? 600 : 400,
            transition: 'background 0.12s, color 0.12s',
        }}>
            {label}
        </Link>
    );
}

export default function Layout() {
    const nav = useNavigate();
    function logout() {
        clearToken();
        nav('/');
    }
    return (
        <div style={S.shell}>
            <aside style={S.sidebar}>
                <div style={S.logo}>NeNe Concierge</div>
                <nav style={S.nav}>
                    {navItems.map(i => <NavLink key={i.to} {...i} />)}
                </nav>
                <div style={S.footer}>
                    <button onClick={logout} style={{
                        background: 'none', border: `1px solid ${T.sidebarBorder}`,
                        color: T.sidebarMuted, padding: '6px 12px',
                        borderRadius: T.radiusSm, cursor: 'pointer',
                        fontSize: T.fontBase, width: '100%',
                    }}>
                        ログアウト
                    </button>
                </div>
            </aside>
            <main style={S.main}><Outlet /></main>
        </div>
    );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

export function PageTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <h1 style={{ fontSize: T.font2xl, fontWeight: 700, marginBottom: 24, ...style }}>{children}</h1>;
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
        padding: '8px 16px', borderRadius: T.radiusMd, fontWeight: 600,
        fontSize: T.fontBase, cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none', opacity: disabled ? 0.55 : 1, transition: 'opacity 0.12s',
    };
    const variants: Record<string, React.CSSProperties> = {
        primary: { background: T.primary, color: '#fff' },
        danger:  { background: T.danger,  color: '#fff' },
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
        draft:     { bg: T.badgeDraftBg, color: T.badgeDraftColor, label: 'ドラフト' },
        published: { bg: T.badgePubBg,   color: T.badgePubColor,   label: '公開中' },
        archived:  { bg: T.badgeArchBg,  color: T.badgeArchColor,  label: 'アーカイブ' },
    } as const;
    const { bg, color, label } = cfg[status];
    return (
        <span style={{
            background: bg, color, padding: '2px 10px',
            borderRadius: T.radiusXl, fontSize: T.fontSm, fontWeight: 600,
        }}>
            {label}
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
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: T.fontBase }}>
                {label}{required && <span style={{ color: T.danger }}> *</span>}
            </span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: T.radiusMd,
                    border: `1.5px solid ${T.borderInput}`, fontSize: T.fontMd,
                    outline: 'none', background: T.surface,
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
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: T.fontBase }}>
                {label}
            </span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: T.radiusMd,
                    border: `1.5px solid ${T.borderInput}`, fontSize: T.fontMd,
                    background: T.surface,
                }}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

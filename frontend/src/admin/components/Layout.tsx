import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { clearToken } from '../auth.js';

const S = {
    shell:   { display:'flex', minHeight:'100vh' } as const,
    sidebar: {
        width: 220, background: '#1e293b', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column' as const,
        flexShrink: 0,
    },
    logo: {
        padding: '20px 16px 16px', fontWeight: 700, fontSize: 16,
        borderBottom: '1px solid #334155', color: '#f8fafc',
    },
    nav:  { flex: 1, padding: '12px 0' },
    main: { flex: 1, padding: '32px 40px', overflowY: 'auto' as const },
    footer: { padding: '16px', borderTop: '1px solid #334155' },
};

const navItems = [
    { to: '/scenarios',    label: 'シナリオ' },
    { to: '/appearance',   label: '外観設定' },
    { to: '/credentials',  label: 'アクションクレデンシャル' },
];

function NavLink({ to, label }: { to: string; label: string }) {
    const loc = useLocation();
    const active = loc.pathname.startsWith(to);
    return (
        <Link to={to} style={{
            display: 'block', padding: '9px 16px', color: active ? '#f8fafc' : '#94a3b8',
            textDecoration: 'none', borderRadius: 6, margin: '2px 8px',
            background: active ? '#334155' : 'transparent',
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
                        background: 'none', border: '1px solid #475569',
                        color: '#94a3b8', padding: '6px 12px',
                        borderRadius: 6, cursor: 'pointer', fontSize: 13, width: '100%',
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
    return <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, ...style }}>{children}</h1>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '20px 24px', ...style,
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
        padding: '8px 16px', borderRadius: 7, fontWeight: 600, fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
        opacity: disabled ? 0.55 : 1, transition: 'opacity 0.12s',
    };
    const variants = {
        primary: { background: '#2563eb', color: '#fff' },
        danger:  { background: '#ef4444', color: '#fff' },
        ghost:   { background: 'transparent', color: '#2563eb', border: '1.5px solid #2563eb' },
    } as const;
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            style={{ ...base, ...variants[variant], ...style }}>
            {children}
        </button>
    );
}

export function Badge({ status }: { status: 'draft' | 'published' | 'archived' }) {
    const cfg = {
        draft:     { bg: '#f3f4f6', color: '#374151', label: 'ドラフト' },
        published: { bg: '#dcfce7', color: '#166534', label: '公開中' },
        archived:  { bg: '#fee2e2', color: '#991b1b', label: 'アーカイブ' },
    } as const;
    const { bg, color, label } = cfg[status];
    return (
        <span style={{
            background: bg, color, padding: '2px 10px',
            borderRadius: 99, fontSize: 12, fontWeight: 600,
        }}>
            {label}
        </span>
    );
}

export function ErrorMsg({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return (
        <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            color: '#b91c1c', borderRadius: 7, padding: '10px 14px',
            marginBottom: 16, fontSize: 13,
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
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
            </span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} required={required}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: 7,
                    border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
                    background: '#fff',
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
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                {label}
            </span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: 7,
                    border: '1.5px solid #d1d5db', fontSize: 14, background: '#fff',
                }}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

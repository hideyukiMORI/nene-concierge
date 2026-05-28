import { useEffect, useRef, useState } from 'react';
import { ADMIN_THEME_DEFS } from '../theme/index.js';
import type { AdminThemeId, ThemeVariant } from '../theme/index.js';
import { useTheme } from '../theme/index.js';
import { useBreakpoint } from './Layout.js';
import { T } from '../theme.js';

const MONO = T.fontMono;

// ── ThemeSwitcher — fixed bottom-right floating widget ────────────────────────

export default function ThemeSwitcher() {
    const { adminThemeId, themeVariant, setAdminTheme, toggleVariant } = useTheme();
    const bp = useBreakpoint();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    // NOTE: hooks は早期 return より前に呼び出すこと。React のフック呼び出し回数が
    //   レンダー間で変わると "Rendered fewer hooks than expected" エラーになる。
    //   モバイル⇔PC リサイズで bp が切替わると即座に発火するため。
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [open]);

    // Current theme def & accent dot color
    const currentDef = ADMIN_THEME_DEFS.find(d => d.id === adminThemeId) ?? ADMIN_THEME_DEFS[0];
    const currentPreview = currentDef.preview[themeVariant] ?? currentDef.preview[currentDef.variants[0] as ThemeVariant];
    const dotColor = currentPreview?.accent ?? T.primary;

    // Hide on mobile — 全 hooks の呼び出し完了後に早期 return
    if (bp === 'mobile') return null;

    return (
        <div
            ref={containerRef}
            style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 200 }}
        >
            {/* Dropdown menu — opens above trigger */}
            {open && (
                <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                    minWidth: 260,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    boxShadow: T.shadowElevated,
                    padding: 6,
                }}>
                    {/* Header label */}
                    <div style={{
                        fontFamily: MONO,
                        fontSize: 9.5, fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: T.textFaint,
                        padding: '8px 10px 4px',
                    }}>
                        choose admin theme
                    </div>

                    {/* Theme rows */}
                    {ADMIN_THEME_DEFS.map(def => {
                        const isCurrent = def.id === adminThemeId;
                        const darkOnly  = def.variants.length === 1 && def.variants[0] === 'dark';

                        // Swatch preview: show current variant for selected, first variant for others
                        const displayVariant: ThemeVariant = isCurrent
                            ? themeVariant
                            : (def.variants[0] as ThemeVariant);
                        const swatchPreview = def.preview[displayVariant] ?? def.preview[def.variants[0] as ThemeVariant];
                        if (!swatchPreview) return null;

                        return (
                            <div
                                key={def.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '7px 10px',
                                    borderRadius: 5,
                                    cursor: 'pointer',
                                    background: isCurrent ? T.primaryTint : 'transparent',
                                    transition: 'background 100ms ease',
                                }}
                                onMouseEnter={e => {
                                    if (!isCurrent) (e.currentTarget as HTMLElement).style.background = T.surfaceHover;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = isCurrent ? T.primaryTint : 'transparent';
                                }}
                                onClick={() => {
                                    if (!isCurrent) {
                                        setAdminTheme(def.id as AdminThemeId);
                                    }
                                }}
                            >
                                {/* Swatch: sidebar strip + content area */}
                                <span style={{
                                    width: 28, height: 18, borderRadius: 3,
                                    border: `1px solid ${T.borderLight}`,
                                    flexShrink: 0,
                                    display: 'grid', gridTemplateColumns: '8px 1fr',
                                    overflow: 'hidden',
                                }}>
                                    <span style={{ height: '100%', background: swatchPreview.sidebar }} />
                                    <span style={{
                                        height: '100%',
                                        background: swatchPreview.surface,
                                        position: 'relative',
                                    }}>
                                        {/* Tiny line accent */}
                                        <span style={{
                                            position: 'absolute', left: 3, top: 4,
                                            width: 9, height: 2, borderRadius: 1,
                                            background: swatchPreview.accent, opacity: 0.7,
                                        }} />
                                    </span>
                                </span>

                                {/* Theme name */}
                                <span style={{
                                    flex: 1,
                                    fontSize: 12.5, fontWeight: isCurrent ? 700 : 500,
                                    color: isCurrent ? T.textStrong : T.text,
                                }}>
                                    {def.name}
                                    {darkOnly && (
                                        <span style={{
                                            fontFamily: MONO, fontSize: 9.5,
                                            color: T.textFaint, marginLeft: 5,
                                        }}>dark only</span>
                                    )}
                                </span>

                                {/* Light/dark toggle segments */}
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        padding: 2,
                                        background: T.surfaceAlt,
                                        borderRadius: 99,
                                        border: `1px solid ${T.borderLight}`,
                                    }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Light segment */}
                                    <span
                                        title="Light"
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (darkOnly) return;
                                            if (isCurrent && themeVariant !== 'light') {
                                                toggleVariant();
                                            } else if (!isCurrent) {
                                                setAdminTheme(def.id as AdminThemeId, 'light');
                                            }
                                        }}
                                        style={{
                                            width: 22, height: 18, borderRadius: 99,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11,
                                            cursor: darkOnly ? 'not-allowed' : 'pointer',
                                            opacity: darkOnly ? 0.25 : 1,
                                            background: (isCurrent && themeVariant === 'light') ? T.surface : 'transparent',
                                            color: (isCurrent && themeVariant === 'light') ? T.textStrong : T.textFaint,
                                            boxShadow: (isCurrent && themeVariant === 'light') ? '0 1px 2px rgba(15,23,42,.08)' : 'none',
                                        }}
                                    >
                                        ☀
                                    </span>
                                    {/* Dark segment */}
                                    <span
                                        title="Dark"
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (isCurrent && themeVariant !== 'dark') {
                                                toggleVariant();
                                            } else if (!isCurrent) {
                                                setAdminTheme(def.id as AdminThemeId, 'dark');
                                            }
                                        }}
                                        style={{
                                            width: 22, height: 18, borderRadius: 99,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11,
                                            cursor: 'pointer',
                                            background: (isCurrent && themeVariant === 'dark') ? T.surface : 'transparent',
                                            color: (isCurrent && themeVariant === 'dark') ? T.textStrong : T.textFaint,
                                            boxShadow: (isCurrent && themeVariant === 'dark') ? '0 1px 2px rgba(15,23,42,.08)' : 'none',
                                        }}
                                    >
                                        🌙
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer */}
                    <div style={{
                        marginTop: 4, padding: '8px 10px 4px',
                        fontFamily: MONO,
                        fontSize: 9.5, color: T.textFaint,
                        letterSpacing: '0.04em',
                        borderTop: `1px solid ${T.borderLight}`,
                    }}>
                        Persists to localStorage · live preview only
                    </div>
                </div>
            )}

            {/* Trigger pill button */}
            <button
                onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    height: 32, padding: '0 12px',
                    borderRadius: 99,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.shadowElevated,
                    cursor: 'pointer', outline: 'none',
                    color: T.text,
                    fontSize: 12,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.surface; }}
            >
                {/* Accent dot */}
                <span style={{
                    width: 9, height: 9, borderRadius: 99,
                    background: dotColor,
                    border: `1.5px solid ${T.surface}`,
                    boxShadow: `0 0 0 1px ${T.border}`,
                    flexShrink: 0,
                }} />
                {/* "theme:" mono label */}
                <span style={{
                    fontFamily: MONO,
                    fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: T.textMuted,
                }}>
                    theme:
                </span>
                {/* Theme name · variant */}
                <span style={{
                    color: T.text,
                    fontWeight: 700,
                    fontSize: 12,
                }}>
                    {currentDef.name} · {themeVariant}
                </span>
                {/* Chevron */}
                <span style={{
                    color: T.textFaint,
                    fontSize: 10,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms ease',
                }}>
                    ▴
                </span>
            </button>
        </div>
    );
}

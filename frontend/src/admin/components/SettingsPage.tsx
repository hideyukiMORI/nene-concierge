import { useEffect, useState } from 'react';
import { PageHead, Card, SectionHead, useLayout } from './Layout.js';
import { MobileHeader, MobileSectionHead } from './mobile/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import { useTheme, ADMIN_THEME_DEFS } from '../theme/index.js';
import type { AdminThemeId, ThemeVariant } from '../theme/index.js';

const MONO = T.fontMono;

// ── ThemeCard ─────────────────────────────────────────────────────────────────

function ThemeCard({ def, isSelected, currentVariant, onSelect, onToggle }: {
    def:            typeof ADMIN_THEME_DEFS[number];
    isSelected:     boolean;
    currentVariant: ThemeVariant;
    onSelect:       (id: typeof def.id) => void;
    onToggle:       () => void;
}) {
    const { t } = useTranslation();

    // For non-selected cards show first variant preview; for selected use current variant
    const displayVariant: ThemeVariant = isSelected
        ? currentVariant
        : (def.variants[0] as ThemeVariant);
    const preview = def.preview[displayVariant];
    if (!preview) return null;

    const darkOnly = def.variants.length === 1 && def.variants[0] === 'dark';
    const canToggle = !darkOnly && isSelected;

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => onSelect(def.id)}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(def.id); }
            }}
            style={{
                border: isSelected
                    ? `2px solid ${T.primary}`
                    : `1px solid ${T.border}`,
                borderRadius: T.radiusLg,
                overflow: 'hidden',
                cursor: 'pointer',
                background: T.surface,
                transition: 'border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease',
                boxShadow: isSelected ? `0 0 0 2px ${T.primaryTint}` : 'none',
                outline: 'none',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.boxShadow = T.shadowCard;
                }
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }
            }}
        >
            {/* Preview area */}
            <div style={{ height: 100, display: 'grid', gridTemplateColumns: '36px 1fr', overflow: 'hidden' }}>
                {/* Sidebar strip */}
                <div style={{
                    background: preview.sidebar,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'stretch', padding: '8px 6px', gap: 4,
                }}>
                    {/* Brand "[n]" */}
                    <div style={{
                        fontFamily: MONO, fontSize: 9, fontWeight: 700,
                        textAlign: 'center', color: preview.accent, opacity: 0.9,
                        lineHeight: 1, padding: '1px 0 3px',
                    }}>[n]</div>
                    {/* Nav rows */}
                    {[true, false, false, false].map((active, i) => (
                        <div key={i} style={{
                            height: 4, borderRadius: 2,
                            background: active ? preview.accent : preview.accent,
                            opacity: active ? 0.95 : 0.35,
                        }} />
                    ))}
                </div>
                {/* Content area */}
                <div style={{
                    background: preview.surface,
                    padding: '10px 10px',
                    display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                    {/* Title bar */}
                    <div style={{ height: 6, width: '60%', borderRadius: 2, background: preview.accent }} />
                    {/* Text lines */}
                    <div style={{ height: 4, width: '100%', borderRadius: 2, background: preview.sidebar, opacity: 0.5 }} />
                    <div style={{ height: 4, width: '70%', borderRadius: 2, background: preview.sidebar, opacity: 0.3 }} />
                    {/* Pill */}
                    <div style={{
                        alignSelf: 'flex-start',
                        height: 10, width: 36, borderRadius: 99,
                        background: `${preview.accent}28`,
                        marginTop: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: preview.accent, fontSize: 7, fontFamily: MONO,
                    }}>
                        save
                    </div>
                </div>
            </div>

            {/* Name row */}
            <div style={{
                borderTop: `1px solid ${T.border}`,
                padding: '9px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: T.surface,
            }}>
                <span style={{
                    fontSize: T.fontSm,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? T.textStrong : T.text,
                }}>
                    {def.name}
                </span>

                {/* Light/dark toggle or dark-only indicator */}
                {darkOnly ? (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontFamily: MONO, fontSize: 9.5, color: T.textFaint,
                    }}>
                        🌙 <span>dark only</span>
                    </span>
                ) : canToggle ? (
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', gap: 3, padding: 2,
                            background: T.surfaceAlt, border: `1px solid ${T.borderLight}`,
                            borderRadius: 99,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {(['light', 'dark'] as ThemeVariant[]).map(v => (
                            <button
                                key={v}
                                type="button"
                                title={v === 'light' ? t('theme.toggleLight') : t('theme.toggleDark')}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (currentVariant !== v) onToggle();
                                }}
                                style={{
                                    width: 22, height: 18, borderRadius: 99,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', cursor: 'pointer',
                                    background: currentVariant === v ? T.surface : 'transparent',
                                    color: currentVariant === v ? T.textStrong : T.textFaint,
                                    boxShadow: currentVariant === v ? '0 1px 2px rgba(15,23,42,.10)' : 'none',
                                    fontSize: 12,
                                    transition: 'background 100ms ease',
                                }}
                            >
                                {v === 'light' ? '☀' : '🌙'}
                            </button>
                        ))}
                    </div>
                ) : (
                    // non-selected card with both variants: show toggle pills (inactive)
                    !darkOnly && !isSelected && def.variants.length > 1 ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 3, padding: 2,
                            background: T.surfaceAlt, border: `1px solid ${T.borderLight}`,
                            borderRadius: 99, opacity: 0.6,
                        }}>
                            <span style={{
                                width: 22, height: 18, borderRadius: 99,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: T.surface, color: T.textFaint, fontSize: 12,
                            }}>☀</span>
                            <span style={{
                                width: 22, height: 18, borderRadius: 99,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: T.textFaint, fontSize: 12,
                            }}>🌙</span>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
}

// ── Theme terminal lines per theme ───────────────────────────────────────────

const THEME_LINES: Record<string, readonly string[]> = {
    default:   ['> theme: default',       '# nene-concierge original palette',          '# accent: teal — oklch(62% 0.14 192)', '> sidebar: always dark',              '> variants: light  dark'],
    github:    ['> theme: github',        '# based on github primer design system',     '# launched on github.com  2020',       '> accent: blue — interactive ui',     '> variants: light  dark'],
    solarized: ['> theme: solarized',     '# by ethan schoonover — 2011',               '# cielab-calibrated contrast ratios',  '> 8 accents — same both variants',    '> variants: light  dark'],
    dracula:   ['> theme: dracula',       '# by zeno rocha — 2013',                     '# 200k+ installs across editors',      '> accent: purple — #bd93f9',          '> variants: dark only'],
    monokai:   ['> theme: monokai',       '# by wimer hazenberg — 2006',                '# born in textmate, ported everywhere','> accent: lime green — #a6e22e',      '> variants: dark only'],
    ubuntu:    ['> theme: ubuntu  (yaru)','# canonical official gtk theme — 2018',      '# default on ubuntu 18.10 and later',  '> sidebar: aubergine — #2C001E',      '> accent: canonical orange — #E95420', '> variants: light  dark'],
};

// ── 点滅カーソル ──────────────────────────────────────────────────────────────
function Cursor({ accent }: { accent: string }) {
    const [on, setOn] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setOn(v => !v), 530);
        return () => clearInterval(t);
    }, []);
    return <span style={{ opacity: on ? 1 : 0, color: accent, fontWeight: 700 }}>█</span>;
}

// ── ThemeTerminal — 55ms 間隔でぱらぱら出現 ────────────────────────────────────
function ThemeTerminal({ themeId, accent }: { themeId: AdminThemeId; accent: string }) {
    const lines = THEME_LINES[themeId] ?? ['> theme: ' + themeId];
    const [count, setCount] = useState(0);

    useEffect(() => {
        setCount(0);
        let i = 0;
        const iv = setInterval(() => {
            i += 1;
            setCount(i);
            if (i >= lines.length) clearInterval(iv);
        }, 55);
        return () => clearInterval(iv);
    }, [themeId, lines.length]);

    return (
        <div style={{
            background: 'oklch(11% 0.010 265)',
            borderRadius: T.radiusMd,
            border: `1px solid oklch(22% 0.010 265)`,
            padding: '12px 16px',
            fontFamily: MONO,
            fontSize: T.fontSm,
            lineHeight: 1.8,
            minHeight: 128,
            marginTop: 16,
        }}>
            {lines.slice(0, count).map((line, i) => (
                <div key={i} style={{
                    color: line.startsWith('>') ? accent : 'oklch(52% 0.012 265)',
                    display: 'flex', alignItems: 'baseline',
                }}>
                    {line}
                    {i === count - 1 && (
                        <span style={{ marginLeft: 4 }}><Cursor accent={accent} /></span>
                    )}
                </div>
            ))}
        </div>
    );
}
// ── SettingsPage ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { adminThemeId, themeVariant, setAdminTheme, toggleVariant } = useTheme();
    const { isMobile } = useLayout();

    const selectedDef = ADMIN_THEME_DEFS.find(d => d.id === adminThemeId);
    const accentColor = selectedDef?.preview[themeVariant]?.accent
        ?? selectedDef?.preview[selectedDef.variants[0] as ThemeVariant]?.accent
        ?? T.primary;

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Settings"
                    subtitle={`${ADMIN_THEME_DEFS.length} themes`}
                />

                <MobileSectionHead label="admin theme"/>
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 8, padding: '0 12px',
                }}>
                    {ADMIN_THEME_DEFS.map(def => (
                        <ThemeCard
                            key={def.id}
                            def={def}
                            isSelected={def.id === adminThemeId}
                            currentVariant={themeVariant}
                            onSelect={id => setAdminTheme(id)}
                            onToggle={toggleVariant}
                        />
                    ))}
                </div>

                <p style={{
                    margin: '12px 12px 0',
                    fontSize: T.fontXs, color: T.textMuted, lineHeight: 1.5,
                }}>
                    選択するとブラウザに即時反映され、ログアウト後も維持されます (localStorage)。
                </p>

                <div style={{ padding: '12px' }}>
                    <ThemeTerminal themeId={adminThemeId} accent={accentColor}/>
                </div>

                <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }}/>
            </div>
        );
    }

    return (
        <div>
            <PageHead title="Settings" subtitle={`admin theme · ${ADMIN_THEME_DEFS.length} options`} />

            <Card>
                <SectionHead label="admin theme">
                    <span style={{ fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                        applied immediately
                    </span>
                </SectionHead>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 14,
                }}>
                    {ADMIN_THEME_DEFS.map(def => (
                        <ThemeCard
                            key={def.id}
                            def={def}
                            isSelected={def.id === adminThemeId}
                            currentVariant={themeVariant}
                            onSelect={id => setAdminTheme(id)}
                            onToggle={toggleVariant}
                        />
                    ))}
                </div>

                <p style={{ marginTop: 16, fontSize: T.fontXs, color: T.textMuted }}>
                    選択するとブラウザに即時反映され、ログアウト後も維持されます (localStorage)。
                </p>

                <ThemeTerminal themeId={adminThemeId} accent={accentColor} />
            </Card>
        </div>
    );
}

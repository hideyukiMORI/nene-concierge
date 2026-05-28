import { PageHead, Card, SectionHead } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import { useTheme, ADMIN_THEME_DEFS } from '../theme/index.js';
import type { ThemeVariant } from '../theme/index.js';

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

// ── ThemeTerminal (inline) ────────────────────────────────────────────────────
// Preserved from original SettingsPage — shows current theme in terminal style

function ThemeTerminal() {
    const { adminThemeId, themeVariant } = useTheme();
    const lines = [
        `$ nene-concierge theme`,
        `> id:      ${adminThemeId}`,
        `> variant: ${themeVariant}`,
        `> token:   --nca-color-primary`,
        ``,
        `// changes saved to localStorage`,
    ];
    return (
        <div style={{
            background: '#0E1116', borderRadius: T.radiusMd,
            padding: '14px 16px', fontFamily: MONO, fontSize: T.fontXs,
            color: '#7EB8D0', lineHeight: 1.7, marginTop: 16,
            border: `1px solid ${T.border}`,
        }}>
            {lines.map((l, i) => (
                <div key={i} style={{
                    color: l.startsWith('$') ? '#2DD4BF'
                         : l.startsWith('>') ? '#A8D8A8'
                         : l.startsWith('//') ? '#5E6472'
                         : '#7EB8D0',
                }}>{l || ' '}</div>
            ))}
        </div>
    );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { adminThemeId, themeVariant, setAdminTheme, toggleVariant } = useTheme();

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

                <ThemeTerminal />
            </Card>
        </div>
    );
}

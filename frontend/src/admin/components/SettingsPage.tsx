import { PageTitle, Card } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import { useTheme, ADMIN_THEME_DEFS } from '../theme/index.js';
import type { ThemeVariant } from '../theme/index.js';

// ── ThemeCard ─────────────────────────────────────────────────────────────────

function ThemeCard({ def, isSelected, currentVariant, onSelect, onToggle }: {
    def:            typeof ADMIN_THEME_DEFS[number];
    isSelected:     boolean;
    currentVariant: ThemeVariant;
    onSelect:       (id: typeof def.id) => void;
    onToggle:       () => void;
}) {
    const { t } = useTranslation();
    const displayVariant: ThemeVariant = isSelected
        ? currentVariant
        : (def.variants[0] as ThemeVariant);
    const preview = def.preview[displayVariant];
    if (!preview) return null;

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
                borderRadius: T.radiusMd,
                border: `2px solid ${isSelected ? T.primary : T.border}`,
                cursor: 'pointer', overflow: 'hidden',
                transition: 'border-color 0.12s',
                outline: 'none',
            }}
            onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = T.primaryMuted;
            }}
            onMouseLeave={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = T.border;
            }}
        >
            {/* ミニプレビュー (nene-records ThemePreview 準拠) */}
            <div style={{
                display: 'flex', height: 56,
                borderBottom: `1px solid ${T.border}`, overflow: 'hidden',
            }}>
                {/* Sidebar strip */}
                <div style={{
                    width: 28, background: preview.sidebar, flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', paddingTop: 8, gap: 3,
                }}>
                    <span style={{ width: 14, height: 2, borderRadius: 2, background: preview.accent, opacity: 0.9 }} />
                    <span style={{ width: 14, height: 2, borderRadius: 2, background: preview.accent, opacity: 0.35 }} />
                    <span style={{ width: 14, height: 2, borderRadius: 2, background: preview.accent, opacity: 0.35 }} />
                </div>
                {/* Content area */}
                <div style={{
                    flex: 1, background: preview.surface,
                    padding: '8px 10px',
                }}>
                    <div style={{ width: '60%', height: 3, borderRadius: 2, background: preview.accent, marginBottom: 6 }} />
                    <div style={{ width: '100%', height: 2, borderRadius: 2, background: preview.sidebar, opacity: 0.12, marginBottom: 3 }} />
                    <div style={{ width: '75%',  height: 2, borderRadius: 2, background: preview.sidebar, opacity: 0.12 }} />
                </div>
            </div>

            {/* テーマ名 + light/dark トグル */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px',
                background: T.surface,
            }}>
                <span style={{ fontSize: T.fontSm, fontWeight: isSelected ? 600 : 400, color: T.text }}>
                    {def.name}
                </span>
                {isSelected && def.variants.length > 1 && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onToggle(); }}
                        aria-label={currentVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                        title={currentVariant === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: T.controlHeightXs, height: T.controlHeightXs,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: T.textMuted, padding: 0, borderRadius: T.radiusSm,
                            fontSize: 14, lineHeight: 1, transition: 'color 0.12s',
                        }}
                    >
                        {currentVariant === 'dark' ? '☀' : '🌙'}
                    </button>
                )}
            </div>
        </div>
    );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { t } = useTranslation();
    const { adminThemeId, themeVariant, setAdminTheme, toggleVariant } = useTheme();

    return (
        <div>
            <PageTitle>{t('settings.pageTitle')}</PageTitle>

            <Card>
                <h2 style={{ fontSize: T.fontLg, fontWeight: 700, marginBottom: 16, color: T.textStrong }}>
                    {t('settings.adminTheme')}
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 12,
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
            </Card>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { PageTitle, Card } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import { useTheme, ADMIN_THEME_DEFS } from '../theme/index.js';
import type { AdminThemeId, ThemeVariant } from '../theme/index.js';

// ── テーマ情報 (ターミナル表示用) ──────────────────────────────────────────────
// > 行: アクセント色 (コマンド / プロパティ)
// # 行: グレー (コメント / 注釈)

const THEME_LINES: Record<string, readonly string[]> = {
    default: [
        '> theme: default',
        '# nene-concierge original palette',
        '# accent: teal — oklch(62% 0.14 192)',
        '> sidebar: always dark',
        '> variants: light  dark',
    ],
    github: [
        '> theme: github',
        '# based on github primer design system',
        '# launched on github.com  2020',
        '> accent: blue — interactive ui',
        '> variants: light  dark',
    ],
    solarized: [
        '> theme: solarized',
        '# by ethan schoonover — 2011',
        '# cielab-calibrated contrast ratios',
        '> 8 accents — same across both variants',
        '> variants: light  dark',
    ],
    dracula: [
        '> theme: dracula',
        '# by zeno rocha — 2013',
        '# 200k+ installs across editors',
        '> accent: purple — #bd93f9',
        '> variants: dark only',
    ],
    monokai: [
        '> theme: monokai',
        '# by wimer hazenberg — 2006',
        '# born in textmate, ported everywhere',
        '> accent: lime green — #a6e22e',
        '> variants: dark only',
    ],
    ubuntu: [
        '> theme: ubuntu  (yaru)',
        '# canonical official gtk theme — 2018',
        '# default on ubuntu 18.10 and later',
        '> sidebar: aubergine — #2C001E',
        '> accent: canonical orange — #E95420',
        '> variants: light  dark',
    ],
};

// ── Cursor — JS ベースの点滅（CSS keyframe 不要）────────────────────────────
function Cursor({ accent }: { accent: string }) {
    const [on, setOn] = useState(true);
    useEffect(() => {
        const t = setInterval(() => setOn(v => !v), 530);
        return () => clearInterval(t);
    }, []);
    return (
        <span style={{ opacity: on ? 1 : 0, color: accent, fontWeight: 700 }}>█</span>
    );
}

// ── ThemeTerminal ─────────────────────────────────────────────────────────────
function ThemeTerminal({ themeId, accent }: { themeId: AdminThemeId; accent: string }) {
    const lines = THEME_LINES[themeId] ?? ['> theme: ' + themeId];
    const [count, setCount] = useState(0);

    // テーマ切替でリセット → 55ms 間隔で行を順次表示
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

    const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

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
        }}>
            {lines.slice(0, count).map((line, i) => {
                const isCmd = line.startsWith('>');
                return (
                    <div key={i} style={{
                        color: isCmd ? accent : 'oklch(52% 0.012 265)',
                        display: 'flex', alignItems: 'baseline', gap: 0,
                    }}>
                        {line}
                        {/* 最終行の末尾にカーソル */}
                        {i === count - 1 && (
                            <span style={{ marginLeft: 4 }}>
                                <Cursor accent={accent} />
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

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
            {/* ミニプレビュー */}
            <div style={{
                display: 'flex', height: 56,
                borderBottom: `1px solid ${T.border}`, overflow: 'hidden',
            }}>
                <div style={{
                    width: 28, background: preview.sidebar, flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', paddingTop: 8, gap: 3,
                }}>
                    <span style={{ width: 14, height: 2, borderRadius: 2, background: preview.accent, opacity: 0.9 }} />
                    <span style={{ width: 14, height: 2, borderRadius: 2, background: preview.accent, opacity: 0.35 }} />
                    <span style={{ width: 14, height: 2, borderRadius: 2, background: preview.accent, opacity: 0.35 }} />
                </div>
                <div style={{ flex: 1, background: preview.surface, padding: '8px 10px' }}>
                    <div style={{ width: '60%', height: 3, borderRadius: 2, background: preview.accent, marginBottom: 6 }} />
                    <div style={{ width: '100%', height: 2, borderRadius: 2, background: preview.sidebar, opacity: 0.12, marginBottom: 3 }} />
                    <div style={{ width: '75%',  height: 2, borderRadius: 2, background: preview.sidebar, opacity: 0.12 }} />
                </div>
            </div>

            {/* テーマ名 + light/dark トグル */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', background: T.surface,
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
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: T.textMuted, padding: '2px 4px', borderRadius: T.radiusSm,
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

    const selectedDef = ADMIN_THEME_DEFS.find(d => d.id === adminThemeId);
    const displayVariant: ThemeVariant = themeVariant;
    const accentColor = selectedDef?.preview[displayVariant]?.accent
        ?? selectedDef?.preview[selectedDef.variants[0] as ThemeVariant]?.accent
        ?? T.primary;

    return (
        <div>
            <PageTitle>{t('settings.pageTitle')}</PageTitle>

            <Card>
                <h2 style={{ fontSize: T.fontLg, fontWeight: 700, marginBottom: 16, color: T.textStrong }}>
                    {t('settings.adminTheme')}
                </h2>

                {/* テーマカードグリッド */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 12,
                    marginBottom: 16,
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

                {/* ターミナル風テーマ説明 */}
                <ThemeTerminal themeId={adminThemeId} accent={accentColor} />
            </Card>
        </div>
    );
}

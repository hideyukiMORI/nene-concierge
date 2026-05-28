/** nene-records admin-theme-config.ts と同パターン。 */

export type AdminThemeId = 'default' | 'github' | 'solarized' | 'dracula' | 'monokai' | 'ubuntu'
export type ThemeVariant  = 'light' | 'dark'

export interface ThemePreviewColors {
    surface: string
    sidebar: string
    accent:  string
}

export interface AdminThemeDef {
    readonly id:       AdminThemeId
    readonly name:     string
    readonly variants: readonly ThemeVariant[]
    readonly preview:  Partial<Record<ThemeVariant, ThemePreviewColors>>
}

export const ADMIN_THEME_DEFS: readonly AdminThemeDef[] = [
    {
        id: 'default',
        name: 'Default',
        variants: ['light', 'dark'],
        preview: {
            light: { surface: '#f8f8f5', sidebar: '#2e3044', accent: '#0d9488' },
            dark:  { surface: '#1a1d27', sidebar: '#10121e', accent: '#2dd4bf' },
        },
    },
    {
        id: 'github',
        name: 'GitHub',
        variants: ['light', 'dark'],
        preview: {
            light: { surface: '#ffffff', sidebar: '#24292f', accent: '#0969da' },
            dark:  { surface: '#0d1117', sidebar: '#010409', accent: '#58a6ff' },
        },
    },
    {
        id: 'solarized',
        name: 'Solarized',
        variants: ['light', 'dark'],
        preview: {
            light: { surface: '#fdf6e3', sidebar: '#073642', accent: '#2aa198' },
            dark:  { surface: '#002b36', sidebar: '#001f29', accent: '#2aa198' },
        },
    },
    {
        id: 'dracula',
        name: 'Dracula',
        variants: ['dark'],
        preview: {
            dark: { surface: '#282a36', sidebar: '#21222c', accent: '#bd93f9' },
        },
    },
    {
        id: 'monokai',
        name: 'Monokai',
        variants: ['dark'],
        preview: {
            dark: { surface: '#272822', sidebar: '#1e1e1c', accent: '#a6e22e' },
        },
    },
    {
        id: 'ubuntu',
        name: 'Ubuntu',
        variants: ['light', 'dark'],
        preview: {
            light: { surface: '#faf9f7', sidebar: '#2c001e', accent: '#e95420' },
            dark:  { surface: '#2d2d2d', sidebar: '#1a0011', accent: '#ff6d35' },
        },
    },
] as const

/** `data-nca-theme` 属性値を返す。例: "github-dark" */
export function getDataAttr(id: AdminThemeId, variant: ThemeVariant): string {
    return `${id}-${variant}`
}

/** テーマのデフォルトバリアントを返す（light 優先）。 */
export function getDefaultVariant(id: AdminThemeId): ThemeVariant {
    const def = ADMIN_THEME_DEFS.find(t => t.id === id)
    if (def?.variants.includes('light')) return 'light'
    return 'dark'
}

/** ライト・ダーク切り替えが可能かどうか。 */
export function canToggleVariant(id: AdminThemeId): boolean {
    return (ADMIN_THEME_DEFS.find(t => t.id === id)?.variants.length ?? 0) > 1
}

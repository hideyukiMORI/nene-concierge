import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
    ADMIN_THEME_DEFS,
    canToggleVariant,
    getDataAttr,
    getDefaultVariant,
    type AdminThemeId,
    type ThemeVariant,
} from './admin-theme-config'

export type { AdminThemeId, ThemeVariant }

export interface ThemeContextValue {
    adminThemeId:     AdminThemeId
    themeVariant:     ThemeVariant
    setAdminTheme:    (id: AdminThemeId, variant?: ThemeVariant) => void
    toggleVariant:    () => void
    canToggleVariant: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'nca-admin-theme'

export function detectAdminTheme(): { id: AdminThemeId; variant: ThemeVariant } {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored !== null) {
            const lastDash = stored.lastIndexOf('-')
            if (lastDash > 0) {
                const id      = stored.slice(0, lastDash) as AdminThemeId
                const variant = stored.slice(lastDash + 1) as ThemeVariant
                const def     = ADMIN_THEME_DEFS.find(t => t.id === id)
                if (def !== undefined && (def.variants as readonly string[]).includes(variant)) {
                    return { id, variant }
                }
            }
        }
    } catch {
        // localStorage blocked
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return { id: 'default', variant: prefersDark ? 'dark' : 'light' }
}

export function applyAdminTheme(id: AdminThemeId, variant: ThemeVariant): void {
    document.documentElement.setAttribute('data-nca-theme', getDataAttr(id, variant))
}

function saveAdminTheme(id: AdminThemeId, variant: ThemeVariant): void {
    try {
        localStorage.setItem(STORAGE_KEY, getDataAttr(id, variant))
    } catch {
        // ignore
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [{ id, variant }, setState] = useState<{ id: AdminThemeId; variant: ThemeVariant }>(
        detectAdminTheme,
    )

    const setAdminTheme = useCallback((newId: AdminThemeId, newVariant?: ThemeVariant) => {
        const def = ADMIN_THEME_DEFS.find(t => t.id === newId)
        const resolvedVariant: ThemeVariant =
            def !== undefined &&
            newVariant !== undefined &&
            (def.variants as readonly string[]).includes(newVariant)
                ? newVariant
                : getDefaultVariant(newId)
        setState({ id: newId, variant: resolvedVariant })
        applyAdminTheme(newId, resolvedVariant)
        saveAdminTheme(newId, resolvedVariant)
    }, [])

    const toggleVariant = useCallback(() => {
        if (!canToggleVariant(id)) return
        const next: ThemeVariant = variant === 'light' ? 'dark' : 'light'
        setState({ id, variant: next })
        applyAdminTheme(id, next)
        saveAdminTheme(id, next)
    }, [id, variant])

    useEffect(() => {
        applyAdminTheme(id, variant)
    }, [id, variant])

    return (
        <ThemeContext.Provider value={{
            adminThemeId:     id,
            themeVariant:     variant,
            setAdminTheme,
            toggleVariant,
            canToggleVariant: canToggleVariant(id),
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext)
    if (ctx === null) throw new Error('useTheme must be used inside <ThemeProvider>')
    return ctx
}

export { ThemeContext }

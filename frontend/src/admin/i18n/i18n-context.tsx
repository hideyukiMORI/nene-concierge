import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { LOCALES, resolveLocale, type SupportedLocale } from './locales'
import { applyLocaleFontFamily } from './locale-fonts'
import { getMessages } from './messages/index'
import { translate, type MessageKey, type MessageParams } from './translate'

// ── Context value type ────────────────────────────────────────────────────────

export interface I18nContextValue {
    locale:    SupportedLocale
    setLocale: (locale: SupportedLocale) => void
    t:         (key: MessageKey, params?: MessageParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// ── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nca-locale'

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectLocale(): SupportedLocale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored !== null) return resolveLocale(stored)
    } catch {
        // localStorage blocked (private mode, etc.)
    }
    return resolveLocale(navigator.language)
}

function applyLocaleToDocument(locale: SupportedLocale): void {
    document.documentElement.lang = locale
    document.documentElement.dir  = LOCALES[locale].dir
    applyLocaleFontFamily(locale)
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<SupportedLocale>(detectLocale)

    const setLocale = useCallback((next: SupportedLocale) => {
        try {
            localStorage.setItem(STORAGE_KEY, next)
        } catch {
            // ignore storage errors
        }
        setLocaleState(next)
        applyLocaleToDocument(next)
    }, [])

    useEffect(() => {
        applyLocaleToDocument(locale)
    }, [locale])

    const messages = getMessages(locale)

    const t = useCallback(
        (key: MessageKey, params?: MessageParams): string => translate(messages, key, params),
        [messages],
    )

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Primary i18n hook for Admin UI components.
 *
 * @example
 * const { t, locale, setLocale } = useTranslation()
 * return <h1>{t('scenarios.pageTitle')}</h1>
 *
 * @example with params
 * t('scenarios.confirmDelete', { name: scenario.name })
 */
export function useTranslation(): I18nContextValue {
    const ctx = useContext(I18nContext)
    if (ctx === null) {
        throw new Error('useTranslation must be called inside <I18nProvider>')
    }
    return ctx
}

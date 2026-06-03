import { describe, it, expect } from 'vitest'
import {
    getDataAttr,
    getDefaultVariant,
    canToggleVariant,
    ADMIN_THEME_DEFS,
    type AdminThemeId,
} from '../admin-theme-config.js'

describe('getDataAttr', () => {
    it('id と variant を "-" で連結する', () => {
        expect(getDataAttr('github', 'dark')).toBe('github-dark')
        expect(getDataAttr('default', 'light')).toBe('default-light')
    })

    it('すべてのテーマ定義で正しい属性文字列を生成する', () => {
        for (const def of ADMIN_THEME_DEFS) {
            for (const variant of def.variants) {
                expect(getDataAttr(def.id, variant)).toBe(`${def.id}-${variant}`)
            }
        }
    })
})

describe('getDefaultVariant', () => {
    it('light と dark 両方あるテーマは light を返す', () => {
        const lightDarkThemes = ADMIN_THEME_DEFS
            .filter(d => d.variants.includes('light') && d.variants.includes('dark'))
            .map(d => d.id)

        for (const id of lightDarkThemes) {
            expect(getDefaultVariant(id)).toBe('light')
        }
    })

    it('dark のみのテーマは dark を返す', () => {
        const darkOnlyThemes = ADMIN_THEME_DEFS
            .filter(d => !d.variants.includes('light'))
            .map(d => d.id)

        for (const id of darkOnlyThemes) {
            expect(getDefaultVariant(id)).toBe('dark')
        }
    })

    it('dracula は dark のみ → dark', () => {
        expect(getDefaultVariant('dracula')).toBe('dark')
    })

    it('monokai は dark のみ → dark', () => {
        expect(getDefaultVariant('monokai')).toBe('dark')
    })

    it('default は light を持つ → light', () => {
        expect(getDefaultVariant('default')).toBe('light')
    })

    it('存在しない id (型エラー回避) は dark にフォールバック', () => {
        expect(getDefaultVariant('nonexistent' as AdminThemeId)).toBe('dark')
    })
})

describe('canToggleVariant', () => {
    it('light + dark 両方あるテーマは true', () => {
        const toggleable = ADMIN_THEME_DEFS
            .filter(d => d.variants.length > 1)
            .map(d => d.id)

        for (const id of toggleable) {
            expect(canToggleVariant(id)).toBe(true)
        }
    })

    it('dark のみのテーマは false', () => {
        expect(canToggleVariant('dracula')).toBe(false)
        expect(canToggleVariant('monokai')).toBe(false)
    })

    it('存在しない id は false', () => {
        expect(canToggleVariant('ghost' as AdminThemeId)).toBe(false)
    })

    it('すべてのテーマで返り値は boolean', () => {
        for (const def of ADMIN_THEME_DEFS) {
            expect(typeof canToggleVariant(def.id)).toBe('boolean')
        }
    })
})

import { describe, it, expect } from 'vitest'
import { buildCss } from '../style.js'
import type { WidgetPosition } from '../types.js'

const PRIMARY   = '#0d9488'
const SECONDARY = '#ffffff'

describe('buildCss', () => {
    // ── 4 位置パターン ────────────────────────────────────────────────────────

    it('bottom-right: bottom + right プロパティが使われる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-right')
        expect(css).toContain('bottom: 24px')
        expect(css).toContain('right: 24px')
        expect(css).not.toContain('top: 24px')
        expect(css).not.toContain('left: 24px')
    })

    it('bottom-left: bottom + left プロパティが使われる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-left')
        expect(css).toContain('bottom: 24px')
        expect(css).toContain('left: 24px')
        expect(css).not.toContain('top: 24px')
        expect(css).not.toContain('right: 24px')
    })

    it('top-right: top + right プロパティが使われる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'top-right')
        expect(css).toContain('top: 24px')
        expect(css).toContain('right: 24px')
        expect(css).not.toContain('bottom: 24px')
        expect(css).not.toContain('left: 24px')
    })

    it('top-left: top + left プロパティが使われる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'top-left')
        expect(css).toContain('top: 24px')
        expect(css).toContain('left: 24px')
        expect(css).not.toContain('bottom: 24px')
        expect(css).not.toContain('right: 24px')
    })

    // ── カラー補間 ─────────────────────────────────────────────────────────────

    it('primary カラーが CSS に埋め込まれる', () => {
        const css = buildCss('#123456', SECONDARY, 'bottom-right')
        expect(css).toContain('#123456')
    })

    it('secondary カラーが CSS に埋め込まれる', () => {
        const css = buildCss(PRIMARY, '#abcdef', 'bottom-right')
        expect(css).toContain('#abcdef')
    })

    it('異なるカラーでは異なる CSS を生成する', () => {
        const css1 = buildCss('#ff0000', SECONDARY, 'bottom-right')
        const css2 = buildCss('#0000ff', SECONDARY, 'bottom-right')
        expect(css1).not.toBe(css2)
    })

    // ── 出力形式 ──────────────────────────────────────────────────────────────

    it('文字列を返す', () => {
        expect(typeof buildCss(PRIMARY, SECONDARY, 'bottom-right')).toBe('string')
    })

    it(':host セレクタが含まれる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-right')
        expect(css).toContain(':host')
    })

    it('.launcher-btn セレクタが含まれる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-right')
        expect(css).toContain('.launcher-btn')
    })

    it('.choice-btn セレクタが含まれる', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-right')
        expect(css).toContain('.choice-btn')
    })

    // ── align-items: ランチャーの水平方向 ────────────────────────────────────

    it('right 系は align-items: flex-end', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-right')
        expect(css).toContain('flex-end')
    })

    it('left 系は align-items: flex-start', () => {
        const css = buildCss(PRIMARY, SECONDARY, 'bottom-left')
        expect(css).toContain('flex-start')
    })

    it('全 4 位置でそれぞれ一意の CSS を生成する', () => {
        const positions: WidgetPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
        const results = positions.map(p => buildCss(PRIMARY, SECONDARY, p))
        const unique = new Set(results)
        expect(unique.size).toBe(4)
    })
})

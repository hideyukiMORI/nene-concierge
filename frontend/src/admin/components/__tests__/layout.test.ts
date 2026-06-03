import { describe, it, expect } from 'vitest'
import { isWideBp, isUltraWideBp, type Breakpoint } from '../Layout.js'

describe('isWideBp', () => {
    it('wide は true', () => {
        expect(isWideBp('wide')).toBe(true)
    })

    it('ultraWide は true', () => {
        expect(isWideBp('ultraWide')).toBe(true)
    })

    it('desktop は false', () => {
        expect(isWideBp('desktop')).toBe(false)
    })

    it('tablet は false', () => {
        expect(isWideBp('tablet')).toBe(false)
    })

    it('mobile は false', () => {
        expect(isWideBp('mobile')).toBe(false)
    })

    it('全 5 ブレークポイントで正しい値を返す', () => {
        const cases: [Breakpoint, boolean][] = [
            ['mobile',    false],
            ['tablet',    false],
            ['desktop',   false],
            ['wide',      true ],
            ['ultraWide', true ],
        ]
        for (const [bp, expected] of cases) {
            expect(isWideBp(bp)).toBe(expected)
        }
    })
})

describe('isUltraWideBp', () => {
    it('ultraWide は true', () => {
        expect(isUltraWideBp('ultraWide')).toBe(true)
    })

    it('wide は false', () => {
        expect(isUltraWideBp('wide')).toBe(false)
    })

    it('desktop は false', () => {
        expect(isUltraWideBp('desktop')).toBe(false)
    })

    it('tablet は false', () => {
        expect(isUltraWideBp('tablet')).toBe(false)
    })

    it('mobile は false', () => {
        expect(isUltraWideBp('mobile')).toBe(false)
    })

    it('全 5 ブレークポイントで正しい値を返す', () => {
        const cases: [Breakpoint, boolean][] = [
            ['mobile',    false],
            ['tablet',    false],
            ['desktop',   false],
            ['wide',      false],
            ['ultraWide', true ],
        ]
        for (const [bp, expected] of cases) {
            expect(isUltraWideBp(bp)).toBe(expected)
        }
    })
})

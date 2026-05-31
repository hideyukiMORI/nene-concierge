import { describe, it, expect } from 'vitest'
import { dropOffColor } from '../NodeTypes.js'

describe('dropOffColor', () => {
    // ── 閾値境界値 ────────────────────────────────────────────────────────────

    it('rate = 0.0 → 緑 (oklch 56%)', () => {
        expect(dropOffColor(0.0)).toContain('oklch(56%')
    })

    it('rate = 0.19 → 緑 (0.2 未満)', () => {
        expect(dropOffColor(0.19)).toContain('oklch(56%')
    })

    it('rate = 0.2 → 橙 (ちょうど閾値)', () => {
        expect(dropOffColor(0.2)).toContain('oklch(62%')
    })

    it('rate = 0.49 → 橙 (0.5 未満)', () => {
        expect(dropOffColor(0.49)).toContain('oklch(62%')
    })

    it('rate = 0.5 → 赤 (ちょうど閾値)', () => {
        expect(dropOffColor(0.5)).toContain('oklch(58%')
    })

    it('rate = 1.0 → 赤 (最大値)', () => {
        expect(dropOffColor(1.0)).toContain('oklch(58%')
    })

    // ── 色が 3 種類のいずれかであることを確認 ─────────────────────────────────

    const GREEN  = 'oklch(56% 0.16 145)'
    const ORANGE = 'oklch(62% 0.16 65)'
    const RED    = 'oklch(58% 0.20 25)'

    it.each([
        [0.0,  GREEN ],
        [0.1,  GREEN ],
        [0.19, GREEN ],
        [0.2,  ORANGE],
        [0.35, ORANGE],
        [0.49, ORANGE],
        [0.5,  RED   ],
        [0.75, RED   ],
        [1.0,  RED   ],
    ] as [number, string][])('rate=%s → %s', (rate, expected) => {
        expect(dropOffColor(rate)).toBe(expected)
    })
})

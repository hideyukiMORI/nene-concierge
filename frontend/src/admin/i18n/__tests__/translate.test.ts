import { describe, it, expect } from 'vitest'
import { translate, type MessageKey, type MessageParams } from '../translate.js'
import { en } from '../messages/en.js'
import type { MessageCatalog } from '../messages/en.js'

// カスタムメッセージカタログをテスト内で使う際のキャストヘルパー
function catalog(obj: Record<string, string>): Partial<MessageCatalog> {
    return obj as unknown as Partial<MessageCatalog>
}
function key(k: string): MessageKey {
    return k as MessageKey
}

describe('translate', () => {
    // ── フォールバック ─────────────────────────────────────────────────────────

    it('en カタログから既知キーを返す', () => {
        const result = translate(en, 'nav.scenarios')
        expect(result).toBe(en['nav.scenarios'])
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('部分カタログで未定義キーは英語にフォールバック', () => {
        const partial: Partial<MessageCatalog> = {}
        const result = translate(partial, 'nav.dashboard')
        expect(result).toBe(en['nav.dashboard'])
    })

    // ── プレースホルダー補間 (実在キーを使用) ─────────────────────────────────

    it('実在キー scenarios.confirmDelete の {{name}} を補間する', () => {
        const result = translate(en, 'scenarios.confirmDelete', { name: 'My Flow' })
        expect(result).toContain('My Flow')
        expect(result).not.toContain('{{name}}')
    })

    it('実在キー canvas.analytics.visits の {{count}} を補間する', () => {
        const result = translate(en, 'canvas.analytics.visits', { count: 99 })
        expect(result).toContain('99')
        expect(result).not.toContain('{{count}}')
    })

    // ── プレースホルダー補間 (カスタムメッセージで補間ロジックをテスト) ──────────

    it('単一プレースホルダーを補間する', () => {
        const msg = catalog({ hello: 'Hello, {{name}}!' })
        expect(translate(msg, key('hello'), { name: 'Alice' })).toBe('Hello, Alice!')
    })

    it('複数プレースホルダーをそれぞれ補間する', () => {
        const msg = catalog({ greeting: '{{greeting}}, {{name}}! Count: {{count}}' })
        expect(translate(msg, key('greeting'), { greeting: 'Hi', name: 'Bob', count: 3 }))
            .toBe('Hi, Bob! Count: 3')
    })

    it('同じプレースホルダーが複数回現れる場合すべて置換する', () => {
        const msg = catalog({ dup: '{{x}} + {{x}} = double {{x}}' })
        expect(translate(msg, key('dup'), { x: '5' })).toBe('5 + 5 = double 5')
    })

    it('存在しないプレースホルダーは {{}} 形式のまま残す', () => {
        const msg = catalog({ hello: 'Hello, {{name}}!' })
        expect(translate(msg, key('hello'), { other: 'x' })).toBe('Hello, {{name}}!')
    })

    it('params が空オブジェクトの場合は補間しない', () => {
        const msg = catalog({ hello: 'Hello, {{name}}!' })
        expect(translate(msg, key('hello'), {})).toBe('Hello, {{name}}!')
    })

    it('params が undefined の場合は補間しない', () => {
        const msg = catalog({ hello: 'Hello, {{name}}!' })
        expect(translate(msg, key('hello'))).toBe('Hello, {{name}}!')
    })

    it('数値パラメータを文字列として補間する', () => {
        const msg = catalog({ count: 'Count: {{count}}' })
        expect(translate(msg, key('count'), { count: 42 })).toBe('Count: 42')
    })

    it('0 を数値パラメータとして補間する (falsy 境界)', () => {
        const msg = catalog({ val: 'Value: {{n}}' })
        expect(translate(msg, key('val'), { n: 0 })).toBe('Value: 0')
    })

    it('プレースホルダーのないメッセージはそのまま返す', () => {
        const msg = catalog({ plain: 'No placeholders here.' })
        expect(translate(msg, key('plain'), { x: 'y' })).toBe('No placeholders here.')
    })

    it('空文字列メッセージは空文字列を返す', () => {
        const msg = catalog({ empty: '' })
        expect(translate(msg, key('empty'))).toBe('')
    })

    // ── 境界値 ────────────────────────────────────────────────────────────────

    it('スペースを含む変数名は補間されない (正規表現 \\w+ のみ)', () => {
        // {{first name}} はマッチしない
        const msg = catalog({ hello: 'Hello, {{first name}}!' })
        const result = translate(msg, key('hello'), { 'first name': 'Alice' } as MessageParams)
        // 補間されずそのまま
        expect(result).toBe('Hello, {{first name}}!')
    })
})

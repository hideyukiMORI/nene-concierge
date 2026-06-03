import { describe, it, expect } from 'vitest'
import { getMessages } from '../messages/index.js'
import { SUPPORTED_LOCALE_IDS } from '../locales.js'

describe('getMessages', () => {
    it.each(SUPPORTED_LOCALE_IDS)('%s カタログが取得できる', (locale) => {
        const catalog = getMessages(locale)
        expect(catalog).toBeDefined()
        expect(typeof catalog).toBe('object')
    })

    it('en カタログは nav.dashboard キーを持つ', () => {
        const catalog = getMessages('en')
        expect(catalog['nav.dashboard']).toBeDefined()
        expect(typeof catalog['nav.dashboard']).toBe('string')
    })

    it('ja カタログは英語と異なる文字列を持つ', () => {
        const en = getMessages('en')
        const ja = getMessages('ja')
        expect(ja['nav.scenarios']).not.toBe(en['nav.scenarios'])
    })

    it('各ロケールで異なるオブジェクトを返す', () => {
        const en = getMessages('en')
        const ja = getMessages('ja')
        expect(en).not.toBe(ja)
    })

    it('同じロケールは同じオブジェクト参照を返す', () => {
        expect(getMessages('en')).toBe(getMessages('en'))
    })
})

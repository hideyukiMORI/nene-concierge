import { describe, it, expect, beforeEach } from 'vitest'
import { renderMessageContent } from '../ui.js'

// jsdom 環境で動作する

describe('renderMessageContent', () => {
    let bubble: HTMLDivElement

    beforeEach(() => {
        bubble = document.createElement('div')
    })

    // ── プレーンテキスト ────────────────────────────────────────────────────────

    it('プレーンテキストを TextNode として追加する', () => {
        renderMessageContent(bubble, 'Hello, world!')
        expect(bubble.textContent).toBe('Hello, world!')
    })

    it('空文字列では何も追加しない', () => {
        renderMessageContent(bubble, '')
        expect(bubble.childNodes).toHaveLength(0)
    })

    // ── data:image URI 検出 ───────────────────────────────────────────────────

    it('data:image URI を img タグとして追加する', () => {
        const dataUri = 'data:image/png;base64,AAAA'
        renderMessageContent(bubble, dataUri)
        const img = bubble.querySelector('img')
        expect(img).not.toBeNull()
        expect(img?.src).toContain('data:image/png;base64,AAAA')
        expect(img?.alt).toBe('QR code')
    })

    it('テキスト + data:image + テキスト を分割して追加する', () => {
        const text = `Before image data:image/png;base64,BBBB after image`
        renderMessageContent(bubble, text)

        // img と textNode が混在する
        const img = bubble.querySelector('img')
        expect(img).not.toBeNull()
        expect(bubble.textContent).toContain('Before image')
        expect(bubble.textContent).toContain('after image')
    })

    it('複数の data:image URI を全て img タグに変換する', () => {
        const text = 'data:image/png;base64,FIRST text data:image/png;base64,SECOND'
        renderMessageContent(bubble, text)
        const imgs = bubble.querySelectorAll('img')
        expect(imgs).toHaveLength(2)
        expect(imgs[0].src).toContain('FIRST')
        expect(imgs[1].src).toContain('SECOND')
    })

    // ── img タグのスタイル ────────────────────────────────────────────────────

    it('img タグに max-width:200px スタイルが設定される', () => {
        renderMessageContent(bubble, 'data:image/png;base64,TEST')
        const img = bubble.querySelector('img')
        expect(img?.style.maxWidth).toBe('200px')
    })

    it('data:image/jpeg も img タグとして処理される', () => {
        renderMessageContent(bubble, 'data:image/jpeg;base64,JPEG')
        const img = bubble.querySelector('img')
        expect(img).not.toBeNull()
        expect(img?.src).toContain('data:image/jpeg')
    })

    // ── 境界値 ────────────────────────────────────────────────────────────────

    it('data:image/ で始まらないテキストは img にならない', () => {
        renderMessageContent(bubble, 'https://example.com/image.png')
        const img = bubble.querySelector('img')
        expect(img).toBeNull()
        expect(bubble.textContent).toBe('https://example.com/image.png')
    })

    it('先頭が data:image の場合もテキスト部分が消えない', () => {
        renderMessageContent(bubble, 'data:image/png;base64,TEST suffix')
        // 'data:image/png;base64,TEST' が img になり、' suffix' がテキストノードに
        expect(bubble.textContent).toContain('suffix')
    })
})

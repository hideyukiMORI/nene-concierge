import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AppearanceConfig, NodeView } from '../types.js'

// T1-lite ② (#195): widget/index.ts = embed bootstrap ＋ session step ループ。
// index.ts は import 時に document.currentScript を読んで起動する副作用モジュール
// なので、vi.resetModules ＋動的 import で毎テスト初期化し直す。
// fetch は素 stub の既存慣行（admin/widget 両 api.test と同じ・msw なし）。

const WIDGET_ORIGIN = 'https://widget.example.com'

const mockFetch = vi.fn()

const defaultAppearance: AppearanceConfig = {
    color_primary:   '#123456',
    color_secondary: '#ffffff',
    position:        'bottom-right',
    trigger_type:    'manual',
    icon_url:        null,
    welcome_text:    null,
}

function jsonResponse(status: number, body: unknown, contentType = 'application/json'): Response {
    return {
        ok:      status >= 200 && status < 300,
        status,
        headers: new Headers({ 'content-type': contentType }),
        json:    () => Promise.resolve(body),
        text:    () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response
}

function messageNode(id: string, label: string, choices: NodeView['choices']): NodeView {
    return { node_id: id, type: 'message', label, choices, is_terminal: false }
}

function terminalNode(id: string, label: string): NodeView {
    return { node_id: id, type: 'end', label, choices: [], is_terminal: true }
}

interface Routes {
    appearance?: Response
    start?:      Response
    step?:       Response | ((body: { target_node_id: string }) => Response)
}

/** URL パスで応答を振り分ける fetch stub を張る */
function stubRoutes(routes: Routes): void {
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
        if (url === `${WIDGET_ORIGIN}/api/v1/public/appearance`) {
            return Promise.resolve(routes.appearance ?? jsonResponse(200, defaultAppearance))
        }
        if (url === `${WIDGET_ORIGIN}/api/v1/public/sessions`) {
            return Promise.resolve(routes.start ?? jsonResponse(500, {}))
        }
        if (/\/api\/v1\/public\/sessions\/[^/]+\/step$/.test(url)) {
            const step = routes.step ?? jsonResponse(500, {})
            if (typeof step === 'function') {
                return Promise.resolve(step(JSON.parse(init?.body as string) as { target_node_id: string }))
            }
            return Promise.resolve(step)
        }
        return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
}

/** <script data-scenario-id=...> を currentScript として見せた状態で index.ts を import する */
async function importWidget(dataset: Record<string, string>): Promise<void> {
    const script = document.createElement('script')
    script.src = `${WIDGET_ORIGIN}/widget.js`
    for (const [key, value] of Object.entries(dataset)) {
        script.dataset[key] = value
    }
    Object.defineProperty(document, 'currentScript', {
        value:        script,
        configurable: true,
    })

    vi.resetModules()
    await import('../index.js')
    // initWidget は fire-and-forget の async。microtask を流し切る
    await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
    })
    await Promise.resolve()
}

function shadow(): ShadowRoot {
    const host = document.body.lastElementChild
    if (host?.shadowRoot == null) {
        throw new Error('widget host (shadow root) not mounted')
    }
    return host.shadowRoot
}

async function clickLauncher(): Promise<void> {
    const btn = shadow().querySelector<HTMLButtonElement>('.launcher-btn')
    expect(btn).not.toBeNull()
    btn?.click()
    await Promise.resolve()
}

function bubbleTexts(): string[] {
    return Array.from(shadow().querySelectorAll('.message-bubble')).map(el => el.textContent)
}

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    // jsdom に scrollIntoView が無い（addMessage / addStatus が呼ぶ）
    Element.prototype.scrollIntoView = vi.fn()
    document.body.innerHTML = ''
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    delete (document as { currentScript?: unknown }).currentScript
})

describe('widget/index.ts — bootstrap (#195)', () => {
    it('data-scenario-id が無いと警告して DOM をマウントしない', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const script = document.createElement('script')
        script.src = `${WIDGET_ORIGIN}/widget.js`
        Object.defineProperty(document, 'currentScript', { value: script, configurable: true })

        vi.resetModules()
        await import('../index.js')
        await Promise.resolve()

        expect(warn).toHaveBeenCalledWith('[NeNe Widget] data-scenario-id is required. Widget not initialized.')
        expect(mockFetch).not.toHaveBeenCalled()
        expect(document.body.children).toHaveLength(0)
    })

    it('script.src の origin を baseUrl にして appearance を取得しマウントする', async () => {
        stubRoutes({})
        await importWidget({ scenarioId: '1', title: 'ご相談窓口' })

        expect(mockFetch.mock.calls[0]?.[0]).toBe(`${WIDGET_ORIGIN}/api/v1/public/appearance`)
        expect(shadow().querySelector('.launcher-btn')).not.toBeNull()
        expect(shadow().querySelector('.chat-header span')?.textContent).toBe('ご相談窓口')
        // manual トリガーでは overlay は閉じたまま・セッションも始まらない
        expect(shadow().querySelector<HTMLElement>('.chat-overlay')?.hidden).toBe(true)
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('appearance 取得失敗時はデフォルト外観へフォールバックして描画を続ける', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        stubRoutes({ appearance: jsonResponse(500, { type: 'x', title: 'boom', status: 500 }, 'application/problem+json') })

        await importWidget({ scenarioId: '1' })
        await vi.waitFor(() => {
            expect(shadow().querySelector('.launcher-btn')).not.toBeNull()
        })

        expect(error).toHaveBeenCalled()
        expect(shadow().querySelector('.chat-header span')?.textContent).toBe('チャット')
    })

    it('launcher クリックでセッションを開始しノードと choices を描画する', async () => {
        stubRoutes({
            start: jsonResponse(200, {
                session_id: 's1',
                node:       messageNode('n1', 'ようこそ！', [
                    { target_node_id: 'n2', label: '資料がほしい' },
                    { target_node_id: 'n3', label: null },
                ]),
            }),
        })
        await importWidget({ scenarioId: '7' })
        await clickLauncher()

        await vi.waitFor(() => {
            expect(bubbleTexts()).toContain('ようこそ！')
        })
        const startCall = mockFetch.mock.calls.find(c => (c as [string])[0] === `${WIDGET_ORIGIN}/api/v1/public/sessions`)
        expect(startCall).toBeDefined()
        expect(JSON.parse((startCall as [string, RequestInit])[1].body as string)).toEqual({ scenario_id: 7 })
        expect(shadow().querySelector<HTMLElement>('.chat-overlay')?.hidden).toBe(false)
        const btns = Array.from(shadow().querySelectorAll<HTMLButtonElement>('.choice-btn'))
        expect(btns.map(b => b.textContent)).toEqual(['資料がほしい', '次へ'])
    })

    it('choice クリックで step を送り、terminal ノードで終了表示する', async () => {
        stubRoutes({
            start: jsonResponse(200, {
                session_id: 's1',
                node:       messageNode('n1', '質問です', [{ target_node_id: 'n2', label: 'はい' }]),
            }),
            step: jsonResponse(200, { outcome: 'completed', node: terminalNode('n2', 'ありがとうございました') }),
        })
        await importWidget({ scenarioId: '1' })
        await clickLauncher()
        await vi.waitFor(() => {
            expect(shadow().querySelector('.choice-btn')).not.toBeNull()
        })

        shadow().querySelector<HTMLButtonElement>('.choice-btn')?.click()

        await vi.waitFor(() => {
            expect(bubbleTexts()).toContain('ありがとうございました')
        })
        const stepCall = mockFetch.mock.calls.find(c => /\/step$/.test((c as [string])[0]))
        expect((stepCall as [string])[0]).toBe(`${WIDGET_ORIGIN}/api/v1/public/sessions/s1/step`)
        expect(JSON.parse((stepCall as [string, RequestInit])[1].body as string)).toEqual({ target_node_id: 'n2' })
        expect(shadow().querySelector('.status-msg')?.textContent).toBe('セッションが終了しました。')
        expect(shadow().querySelectorAll('.choice-btn')).toHaveLength(0)
    })

    it('choices 0 の非 terminal ノードは空 target で auto-step する', async () => {
        stubRoutes({
            start: jsonResponse(200, {
                session_id: 's1',
                node:       messageNode('n1', 'アクション実行中…', []),
            }),
            step: jsonResponse(200, { outcome: 'completed', node: terminalNode('n2', '完了しました') }),
        })
        await importWidget({ scenarioId: '1' })
        await clickLauncher()

        await vi.waitFor(() => {
            expect(bubbleTexts()).toContain('完了しました')
        })
        const stepCall = mockFetch.mock.calls.find(c => /\/step$/.test((c as [string])[0]))
        expect(JSON.parse((stepCall as [string, RequestInit])[1].body as string)).toEqual({ target_node_id: '' })
    })

    it('trigger_type=page_load はクリックなしで自動オープンする', async () => {
        stubRoutes({
            appearance: jsonResponse(200, { ...defaultAppearance, trigger_type: 'page_load' }),
            start:      jsonResponse(200, {
                session_id: 's1',
                node:       messageNode('n1', '自動オープン', [{ target_node_id: 'n2', label: '次へ' }]),
            }),
        })
        await importWidget({ scenarioId: '1' })

        await vi.waitFor(() => {
            expect(bubbleTexts()).toContain('自動オープン')
        })
        expect(shadow().querySelector<HTMLElement>('.chat-overlay')?.hidden).toBe(false)
    })

    it('launcher 再クリックは overlay を閉じ、開き直してもセッションを再開始しない', async () => {
        stubRoutes({
            start: jsonResponse(200, {
                session_id: 's1',
                node:       messageNode('n1', 'こんにちは', [{ target_node_id: 'n2', label: '次へ' }]),
            }),
        })
        await importWidget({ scenarioId: '1' })
        await clickLauncher()
        await vi.waitFor(() => {
            expect(bubbleTexts()).toContain('こんにちは')
        })

        await clickLauncher() // 閉じる
        expect(shadow().querySelector<HTMLElement>('.chat-overlay')?.hidden).toBe(true)

        await clickLauncher() // 開き直す
        expect(shadow().querySelector<HTMLElement>('.chat-overlay')?.hidden).toBe(false)

        const startCalls = mockFetch.mock.calls.filter(c => (c as [string])[0] === `${WIDGET_ORIGIN}/api/v1/public/sessions`)
        expect(startCalls).toHaveLength(1)
        // 会話履歴も二重描画されない
        expect(bubbleTexts().filter(t => t === 'こんにちは')).toHaveLength(1)
    })

    it('セッション開始失敗時はエラーステータスを表示する', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        stubRoutes({
            start: jsonResponse(503, { type: 'x', title: 'Service Unavailable', status: 503 }, 'application/problem+json'),
        })
        await importWidget({ scenarioId: '1' })
        await clickLauncher()

        await vi.waitFor(() => {
            expect(shadow().querySelector('.status-msg')?.textContent).toBe('セッションを開始できませんでした。')
        })
        expect(error).toHaveBeenCalled()
    })
})

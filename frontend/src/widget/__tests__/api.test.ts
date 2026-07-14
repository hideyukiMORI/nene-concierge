import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchAppearance, startSession, stepSession } from '../api.js'

// fetch をモック（このリポの既存慣行 — msw なし。admin/__tests__/api.test.ts と同型）。
// 匿名 transport は fetch を生成時に一度束縛するが、api.ts が (...args) => fetch(...args)
// の間接参照を渡すため、この stubGlobal が呼び出し時に効く。
const mockFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    // 万一のリークを避けるため保管系もクリア（匿名 transport は本来これを読まない）。
    sessionStorage.clear()
    localStorage.clear()
})

// nene2-client transport は成功時 response.text() → JSON.parse で読む。
function jsonOk<T>(data: T): Response {
    return {
        ok:         true,
        status:     200,
        statusText: 'OK',
        headers:    new Headers({ 'content-type': 'application/json' }),
        text:       () => Promise.resolve(JSON.stringify(data)),
        json:       () => Promise.resolve(data),
    } as unknown as Response
}

// RFC 9457 Problem Details を返すエラー応答（transport はここから title を取る）。
function problemError(status: number, title: string): Response {
    const body = { type: 'about:blank', title, status }
    return {
        ok:         false,
        status,
        statusText: title,
        headers:    new Headers({ 'content-type': 'application/problem+json' }),
        json:       () => Promise.resolve(body),
        text:       () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response
}

// Problem Details を持たない素の HTTP エラー（前段プロキシ・静的 404 等）。
function plainError(status: number, statusText: string): Response {
    return {
        ok:         false,
        status,
        statusText,
        headers:    new Headers({ 'content-type': 'text/html' }),
        json:       () => Promise.reject(new Error('not json')),
        text:       () => Promise.resolve('<html>error</html>'),
    } as unknown as Response
}

/** 直近の fetch 呼び出しの [url, init] を取り出す。 */
function lastCall(): [string, RequestInit] {
    const calls = mockFetch.mock.calls
    return calls[calls.length - 1] as [string, RequestInit]
}

const BASE = 'https://example.com'

describe('fetchAppearance', () => {
    it('GET /api/v1/public/appearance を呼ぶ', async () => {
        const payload = { color_primary: '#fff', color_secondary: '#000', position: 'bottom-right', trigger_type: 'page_load', icon_url: null, welcome_text: null }
        mockFetch.mockResolvedValue(jsonOk(payload))

        const result = await fetchAppearance(BASE)

        const [url, init] = lastCall()
        expect(url).toBe(`${BASE}/api/v1/public/appearance`)
        expect((init.method ?? 'GET').toUpperCase()).toBe('GET')
        expect(result.color_primary).toBe('#fff')
    })

    it('匿名 transport — どのリクエストにも Authorization / X-Authorization を付けない (W2a)', async () => {
        // ストレージに token が居ても匿名 transport は tokenStore を持たないので無視する。
        sessionStorage.setItem('nene_admin_token', 'leaked-token')
        mockFetch.mockResolvedValue(jsonOk({}))

        await fetchAppearance(BASE)

        const [, init] = lastCall()
        const headers = init.headers as Headers
        expect(headers.get('Authorization')).toBeNull()
        expect(headers.get('X-Authorization')).toBeNull()
        // 公開経路の JSON ヘッダは不変。
        expect(headers.get('Accept')).toBe('application/json')
    })

    it('Cookie-less 不変 — credentials を include にしない（同一オリジン既定）', async () => {
        mockFetch.mockResolvedValue(jsonOk({}))

        await fetchAppearance(BASE)

        const [, init] = lastCall()
        // 旧実装は credentials 未指定＝ same-origin 既定。transport も未指定のまま。
        expect(init.credentials).toBeUndefined()
    })

    it('HTTP エラーで例外を投げる', async () => {
        mockFetch.mockResolvedValue(plainError(404, 'Not Found'))
        await expect(fetchAppearance(BASE)).rejects.toThrow('API error: 404')
    })
})

describe('startSession', () => {
    it('POST /api/v1/public/sessions に scenario_id を送る', async () => {
        const payload = { session_id: 'sess-abc', node: { node_id: 'n1', type: 'message', label: 'Hi', data: {}, choices: [], is_terminal: false } }
        mockFetch.mockResolvedValue(jsonOk(payload))

        const result = await startSession(BASE, 42)

        const [url, init] = lastCall()
        expect(url).toBe(`${BASE}/api/v1/public/sessions`)
        expect((init.method ?? '').toUpperCase()).toBe('POST')
        expect(init.body).toBe(JSON.stringify({ scenario_id: 42 }))
        // bodied POST は Content-Type: application/json（公開経路の不変ヘッダ）。
        expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
        expect(result.session_id).toBe('sess-abc')
    })

    it('HTTP エラーで例外を投げる（Problem Details の title 付き）', async () => {
        mockFetch.mockResolvedValue(problemError(422, 'Unprocessable Entity'))
        await expect(startSession(BASE, 0)).rejects.toThrow('API error: 422 Unprocessable Entity')
    })

    it('fetch 自体が失敗した場合もエラーを投げる（ネットワーク: status 0 は素通し）', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'))
        await expect(startSession(BASE, 1)).rejects.toThrow('Network error')
    })
})

describe('stepSession', () => {
    it('POST /api/v1/public/sessions/:id/step に target_node_id を送る', async () => {
        const payload = { outcome: 'active', node: { node_id: 'n2', type: 'end', label: 'Bye', data: {}, choices: [], is_terminal: true } }
        mockFetch.mockResolvedValue(jsonOk(payload))

        const result = await stepSession(BASE, 'sess-abc', 'node-2')

        const [url, init] = lastCall()
        expect(url).toBe(`${BASE}/api/v1/public/sessions/sess-abc/step`)
        expect((init.method ?? '').toUpperCase()).toBe('POST')
        expect(init.body).toBe(JSON.stringify({ target_node_id: 'node-2' }))
        expect(result.outcome).toBe('active')
    })

    it('空の target_node_id でも呼び出せる (condition ノード用)', async () => {
        const payload = { outcome: 'completed', node: { node_id: 'end', type: 'end', label: 'Done', data: {}, choices: [], is_terminal: true } }
        mockFetch.mockResolvedValue(jsonOk(payload))

        await stepSession(BASE, 'sess-xyz', '')

        const [, init] = lastCall()
        expect(init.body).toBe(JSON.stringify({ target_node_id: '' }))
    })

    it('HTTP エラーで例外を投げる', async () => {
        mockFetch.mockResolvedValue(plainError(500, 'Internal Server Error'))
        await expect(stepSession(BASE, 'sess-1', 'node-1')).rejects.toThrow('API error: 500')
    })
})

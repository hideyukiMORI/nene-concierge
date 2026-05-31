import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchAppearance, startSession, stepSession } from '../api.js'

// fetch をモック
const mockFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
})

function mockOk<T>(data: T): Response {
    return {
        ok:   true,
        json: () => Promise.resolve(data),
    } as unknown as Response
}

function mockError(status: number, statusText: string): Response {
    return {
        ok:         false,
        status,
        statusText,
        url:        'https://example.com/api',
    } as unknown as Response
}

const BASE = 'https://example.com'

describe('fetchAppearance', () => {
    it('GET /api/v1/public/appearance を呼ぶ', async () => {
        const payload = { color_primary: '#fff', color_secondary: '#000', position: 'bottom-right', trigger_type: 'page_load', icon_url: null, welcome_text: null }
        mockFetch.mockResolvedValue(mockOk(payload))

        const result = await fetchAppearance(BASE)
        expect(mockFetch).toHaveBeenCalledWith(
            `${BASE}/api/v1/public/appearance`,
            expect.objectContaining({ headers: expect.any(Object) }),
        )
        expect(result.color_primary).toBe('#fff')
    })

    it('HTTP エラーで例外を投げる', async () => {
        mockFetch.mockResolvedValue(mockError(404, 'Not Found'))
        await expect(fetchAppearance(BASE)).rejects.toThrow('API error: 404')
    })
})

describe('startSession', () => {
    it('POST /api/v1/public/sessions に scenario_id を送る', async () => {
        const payload = { session_id: 'sess-abc', node: { node_id: 'n1', type: 'message', label: 'Hi', data: {}, choices: [], is_terminal: false } }
        mockFetch.mockResolvedValue(mockOk(payload))

        const result = await startSession(BASE, 42)
        expect(mockFetch).toHaveBeenCalledWith(
            `${BASE}/api/v1/public/sessions`,
            expect.objectContaining({
                method: 'POST',
                body:   JSON.stringify({ scenario_id: 42 }),
            }),
        )
        expect(result.session_id).toBe('sess-abc')
    })

    it('HTTP エラーで例外を投げる', async () => {
        mockFetch.mockResolvedValue(mockError(422, 'Unprocessable Entity'))
        await expect(startSession(BASE, 0)).rejects.toThrow('API error: 422')
    })

    it('fetch 自体が失敗した場合もエラーを投げる', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'))
        await expect(startSession(BASE, 1)).rejects.toThrow('Network error')
    })
})

describe('stepSession', () => {
    it('POST /api/v1/public/sessions/:id/step に target_node_id を送る', async () => {
        const payload = { outcome: 'active', node: { node_id: 'n2', type: 'end', label: 'Bye', data: {}, choices: [], is_terminal: true } }
        mockFetch.mockResolvedValue(mockOk(payload))

        const result = await stepSession(BASE, 'sess-abc', 'node-2')
        expect(mockFetch).toHaveBeenCalledWith(
            `${BASE}/api/v1/public/sessions/sess-abc/step`,
            expect.objectContaining({
                method: 'POST',
                body:   JSON.stringify({ target_node_id: 'node-2' }),
            }),
        )
        expect(result.outcome).toBe('active')
    })

    it('空の target_node_id でも呼び出せる (condition ノード用)', async () => {
        const payload = { outcome: 'completed', node: { node_id: 'end', type: 'end', label: 'Done', data: {}, choices: [], is_terminal: true } }
        mockFetch.mockResolvedValue(mockOk(payload))

        await stepSession(BASE, 'sess-xyz', '')
        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ body: JSON.stringify({ target_node_id: '' }) }),
        )
    })

    it('HTTP エラーで例外を投げる', async () => {
        mockFetch.mockResolvedValue(mockError(500, 'Internal Server Error'))
        await expect(stepSession(BASE, 'sess-1', 'node-1')).rejects.toThrow('API error: 500')
    })
})

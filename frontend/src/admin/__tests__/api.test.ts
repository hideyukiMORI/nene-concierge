import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getDashboard, ApiError } from '../api.js'
import { setToken, getToken, clearToken } from '../auth.js'

// fetch をモック (widget/__tests__/api.test.ts と同じ既存慣行 — このリポに msw はない)
const mockFetch = vi.fn()

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    sessionStorage.clear()
    // onUnauthorized の window.location.href 代入で jsdom の
    // "Not implemented: navigation" ノイズが出ないよう固定オブジェクトに差し替える。
    Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
    })
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
})

function mockJsonOk<T>(data: T): Response {
    return {
        ok:      true,
        status:  200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json:    () => Promise.resolve(data),
        text:    () => Promise.resolve(JSON.stringify(data)),
    } as unknown as Response
}

function mockProblem(status: number, title: string, detail?: string): Response {
    const body = { type: 'https://nene2.dev/problems/x', title, status, instance: '/api/v1/dashboard', ...(detail ? { detail } : {}) }
    return {
        ok:      false,
        status,
        headers: new Headers({ 'content-type': 'application/problem+json' }),
        json:    () => Promise.resolve(body),
        text:    () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response
}

describe('admin/api.ts — nene2-client transport 採用 (#164)', () => {
    it('Authorization と X-Authorization の両方をミラーして送る', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockJsonOk({ data: { sessions_7d: 1, converted_7d: 0, conversion_rate_7d: 0, active_sessions: 0, published_scenarios: 0, action_failures_24h: 0, daily_sessions: [] } }))

        await getDashboard()

        expect(mockFetch).toHaveBeenCalledTimes(1)
        const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
        expect(url).toBe('/api/v1/dashboard')
        const headers = init.headers as Headers
        expect(headers.get('Authorization')).toBe('Bearer jwt-abc')
        expect(headers.get('X-Authorization')).toBe('Bearer jwt-abc')
    })

    it('エラー応答時に problem.title を message にした ApiError を投げる', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockProblem(404, 'Not Found', 'no dashboard'))

        let caught: unknown
        try {
            await getDashboard()
        } catch (err) {
            caught = err
        }
        expect(caught).toBeInstanceOf(ApiError)
        expect((caught as ApiError).status).toBe(404)
        expect((caught as ApiError).message).toBe('Not Found')
    })

    it('トークンを保持した認証済みリクエストが 401 を受けるとトークンをクリアする', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockProblem(401, 'Unauthorized', 'token expired'))

        await expect(getDashboard()).rejects.toBeInstanceOf(ApiError)
        expect(getToken()).toBeNull()

        clearToken()
    })
})

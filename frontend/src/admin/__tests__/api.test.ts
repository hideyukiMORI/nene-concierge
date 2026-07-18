import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    getDashboard,
    login,
    saveScenarioGraph,
    updateUser,
    deleteScenario,
    searchScenarioRevisions,
    listSessions,
    listActionLogs,
    getSessionDetail,
    ApiError,
    type ScenarioNode,
    type ScenarioEdge,
} from '../api.js'
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

// ここから T1-lite ① (#193): request 層の未カバー領域。
// PD エラーマッピングのフォールバック・401 の token 有無での挙動差・
// 各 HTTP メソッド経路・クエリ構築を、既存慣行どおり素 fetch stub で検証する。

function mockNonProblemError(status: number, body: string, contentType: string): Response {
    return {
        ok:      false,
        status,
        headers: new Headers({ 'content-type': contentType }),
        json:    () => (contentType.includes('json') ? Promise.resolve(JSON.parse(body)) : Promise.reject(new Error('not json'))),
        text:    () => Promise.resolve(body),
    } as unknown as Response
}

function mockNoContent(): Response {
    return {
        ok:      true,
        status:  204,
        headers: new Headers(),
        json:    () => Promise.reject(new Error('no body')),
        text:    () => Promise.resolve(''),
    } as unknown as Response
}

function lastCall(): [string, RequestInit] {
    return mockFetch.mock.calls[mockFetch.mock.calls.length - 1] as [string, RequestInit]
}

describe('admin/api.ts — PD エラーマッピングのフォールバック (#193)', () => {
    it('problem 形でない JSON エラー応答は HTTP <status> を message にする', async () => {
        setToken('jwt-abc')
        // title/type/status を欠く=isProblemDetails が拒否する形
        mockFetch.mockResolvedValue(mockNonProblemError(500, '{"message":"boom"}', 'application/json'))

        let caught: unknown
        try {
            await getDashboard()
        } catch (err) {
            caught = err
        }
        expect(caught).toBeInstanceOf(ApiError)
        expect((caught as ApiError).status).toBe(500)
        expect((caught as ApiError).message).toBe('HTTP 500')
    })

    it('text/html エラー応答 (プロキシ由来等) も HTTP <status> を message にする', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockNonProblemError(502, '<html>Bad Gateway</html>', 'text/html'))

        let caught: unknown
        try {
            await getDashboard()
        } catch (err) {
            caught = err
        }
        expect(caught).toBeInstanceOf(ApiError)
        expect((caught as ApiError).status).toBe(502)
        expect((caught as ApiError).message).toBe('HTTP 502')
    })
})

describe('admin/api.ts — 401 の token 有無での挙動差 (#164 の挙動変化の回帰)', () => {
    it('token を保持した 401 は /admin/ へリダイレクトする', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockProblem(401, 'Unauthorized', 'token expired'))

        await expect(getDashboard()).rejects.toBeInstanceOf(ApiError)
        expect(window.location.href).toBe('/admin/')
    })

    it('token なしの 401 (ログイン失敗) はリダイレクトしない', async () => {
        mockFetch.mockResolvedValue(mockProblem(401, 'Unauthorized', 'bad credentials'))

        let caught: unknown
        try {
            await login('a@example.com', 'wrong-password')
        } catch (err) {
            caught = err
        }
        expect(caught).toBeInstanceOf(ApiError)
        expect((caught as ApiError).status).toBe(401)
        expect(window.location.href).toBe('')
        expect(getToken()).toBeNull()
    })
})

describe('admin/api.ts — HTTP メソッド経路と body 往復', () => {
    it('login は POST + application/json で email/password を送る', async () => {
        mockFetch.mockResolvedValue(mockJsonOk({ token: 't', expires_at: 'x', email: 'a@example.com', role: 'owner' }))

        await login('a@example.com', 'secret')

        const [url, init] = lastCall()
        expect(url).toBe('/api/v1/auth/login')
        expect(init.method).toBe('POST')
        expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
        expect(JSON.parse(init.body as string)).toEqual({ email: 'a@example.com', password: 'secret' })
    })

    it('saveScenarioGraph は PUT で nodes/edges を往復無損失で送る', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockNoContent())
        const nodes: ScenarioNode[] = [
            { node_id: 'n1', type: 'message', label: 'こんにちは', data: { text: 'hi' }, position_x: 10, position_y: 20 },
        ]
        const edges: ScenarioEdge[] = [
            { source_node_id: 'n1', target_node_id: 'n2', label: null },
        ]

        await saveScenarioGraph(7, nodes, edges)

        const [url, init] = lastCall()
        expect(url).toBe('/api/v1/scenarios/7/graph')
        expect(init.method).toBe('PUT')
        expect(JSON.parse(init.body as string)).toEqual({ nodes, edges })
    })

    it('updateUser は PATCH で部分 payload のみ送る', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockJsonOk({ id: 3, email: 'b@example.com', role: 'viewer', status: 'active', created_at: null, updated_at: null }))

        await updateUser(3, { role: 'viewer' })

        const [url, init] = lastCall()
        expect(url).toBe('/api/v1/users/3')
        expect(init.method).toBe('PATCH')
        expect(JSON.parse(init.body as string)).toEqual({ role: 'viewer' })
    })

    it('deleteScenario は DELETE を body なしで送り 204 空応答で解決する', async () => {
        setToken('jwt-abc')
        mockFetch.mockResolvedValue(mockNoContent())

        await expect(deleteScenario(9)).resolves.toBeUndefined()

        const [url, init] = lastCall()
        expect(url).toBe('/api/v1/scenarios/9')
        expect(init.method).toBe('DELETE')
        expect(init.body).toBeUndefined()
    })
})

describe('admin/api.ts — クエリ構築', () => {
    beforeEach(() => {
        setToken('jwt-abc')
    })

    it('searchScenarioRevisions は指定フィルタのみ + limit/offset をクエリにする', async () => {
        mockFetch.mockResolvedValue(mockJsonOk({ data: [], meta: { total: 0, limit: 10, offset: 5 } }))

        await searchScenarioRevisions({ scenario_id: 12, operation: 'graph_save', q: 'メール 送信' }, 10, 5)

        const [url] = lastCall()
        const [path, qs] = url.split('?')
        expect(path).toBe('/api/v1/scenario-revisions')
        const params = new URLSearchParams(qs)
        expect(params.get('scenario_id')).toBe('12')
        expect(params.get('operation')).toBe('graph_save')
        expect(params.get('q')).toBe('メール 送信')
        expect(params.get('limit')).toBe('10')
        expect(params.get('offset')).toBe('5')
        expect(params.has('user_id')).toBe(false)
        expect(params.has('date_from')).toBe(false)
    })

    it('searchScenarioRevisions はデフォルトで limit=50/offset=0 を付ける', async () => {
        mockFetch.mockResolvedValue(mockJsonOk({ data: [], meta: { total: 0, limit: 50, offset: 0 } }))

        await searchScenarioRevisions({})

        const params = new URLSearchParams(lastCall()[0].split('?')[1])
        expect(params.get('limit')).toBe('50')
        expect(params.get('offset')).toBe('0')
    })

    it('listSessions は has_conversion=0 (falsy) も落とさずクエリにする', async () => {
        mockFetch.mockResolvedValue(mockJsonOk({ data: [], meta: { total: 0, limit: 20, offset: 0 } }))

        await listSessions({ has_conversion: 0, outcome: 'dropped' })

        const params = new URLSearchParams(lastCall()[0].split('?')[1])
        expect(params.get('has_conversion')).toBe('0')
        expect(params.get('outcome')).toBe('dropped')
    })

    it('listActionLogs はフィルタなしのときクエリ文字列を付けない', async () => {
        mockFetch.mockResolvedValue(mockJsonOk({ data: [], meta: { total: 0, limit: 20, offset: 0 } }))

        await listActionLogs()

        expect(lastCall()[0]).toBe('/api/v1/action-logs')
    })

    it('getSessionDetail は sessionId を URL エンコードする', async () => {
        mockFetch.mockResolvedValue(mockJsonOk({ data: { id: 'a/b', scenario_id: 1, outcome: 'active', has_conversion: false, started_at: 'x', ended_at: null, variables: {}, messages: [] } }))

        await getSessionDetail('a/b#c')

        expect(lastCall()[0]).toBe('/api/v1/sessions/a%2Fb%23c')
    })
})

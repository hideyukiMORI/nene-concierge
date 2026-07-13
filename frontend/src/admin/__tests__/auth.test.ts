import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, getStoredEmail, setStoredEmail, clearToken, isAuthenticated } from '../auth.js'

// jsdom が sessionStorage / localStorage を提供する
beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
})

describe('token', () => {
    it('初期状態では getToken は null', () => {
        expect(getToken()).toBeNull()
    })

    it('setToken でトークンを保存し getToken で取得できる', () => {
        setToken('test-jwt-token')
        expect(getToken()).toBe('test-jwt-token')
    })

    it('上書きすると最新のトークンが返る', () => {
        setToken('first-token')
        setToken('second-token')
        expect(getToken()).toBe('second-token')
    })

    it('clearToken 後は getToken が null', () => {
        setToken('my-token')
        clearToken()
        expect(getToken()).toBeNull()
    })
})

describe('email', () => {
    it('初期状態では getStoredEmail は null', () => {
        expect(getStoredEmail()).toBeNull()
    })

    it('setStoredEmail で保存し getStoredEmail で取得できる', () => {
        setStoredEmail('user@example.com')
        expect(getStoredEmail()).toBe('user@example.com')
    })

    it('clearToken でメールアドレスも削除される', () => {
        setStoredEmail('user@example.com')
        clearToken()
        expect(getStoredEmail()).toBeNull()
    })
})

describe('isAuthenticated', () => {
    it('トークンなし → false', () => {
        expect(isAuthenticated()).toBe(false)
    })

    it('トークンあり → true', () => {
        setToken('valid-token')
        expect(isAuthenticated()).toBe(true)
    })

    it('clearToken 後は false', () => {
        setToken('valid-token')
        clearToken()
        expect(isAuthenticated()).toBe(false)
    })

    it('空文字列トークンは falsy だが setToken が呼ばれると true になる', () => {
        // sessionStorage は空文字列もそのまま保存する
        setToken('')
        expect(getToken()).toBe('')
        // isAuthenticated は getToken() !== null をチェック
        expect(isAuthenticated()).toBe(true)
    })
})

describe('storage backend', () => {
    it('setToken / setStoredEmail は localStorage に書き込まない (XSS 時の窃取面を localStorage 経由に広げない)', () => {
        setToken('secret-token')
        setStoredEmail('user@example.com')
        expect(localStorage.getItem('nene_admin_token')).toBeNull()
        expect(localStorage.getItem('nene_admin_email')).toBeNull()
        // sessionStorage には保存されている
        expect(sessionStorage.getItem('nene_admin_token')).toBe('secret-token')
        expect(sessionStorage.getItem('nene_admin_email')).toBe('user@example.com')
    })
})

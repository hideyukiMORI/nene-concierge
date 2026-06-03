import { describe, it, expect } from 'vitest'
import { resolveLocale, SUPPORTED_LOCALE_IDS, DEFAULT_LOCALE } from '../locales.js'

describe('resolveLocale', () => {
    // ── 完全一致 ──────────────────────────────────────────────────────────────

    it.each(SUPPORTED_LOCALE_IDS)('完全一致: %s', (locale) => {
        expect(resolveLocale(locale)).toBe(locale)
    })

    // ── 2 セグメントプレフィックス ─────────────────────────────────────────────

    it('pt-BR-extra → pt-BR', () => {
        expect(resolveLocale('pt-BR-extra')).toBe('pt-BR')
    })

    it('zh-Hans-CN → zh-Hans', () => {
        expect(resolveLocale('zh-Hans-CN')).toBe('zh-Hans')
    })

    // ── 1 セグメントプレフィックス ─────────────────────────────────────────────

    it('ja-JP → ja', () => {
        expect(resolveLocale('ja-JP')).toBe('ja')
    })

    it('fr-FR → fr', () => {
        expect(resolveLocale('fr-FR')).toBe('fr')
    })

    it('de-DE → de', () => {
        expect(resolveLocale('de-DE')).toBe('de')
    })

    it('en-US → en', () => {
        expect(resolveLocale('en-US')).toBe('en')
    })

    it('en-GB → en', () => {
        expect(resolveLocale('en-GB')).toBe('en')
    })

    // ── フォールバック ────────────────────────────────────────────────────────

    it('未知のロケールは en にフォールバック', () => {
        expect(resolveLocale('xx-XX')).toBe(DEFAULT_LOCALE)
    })

    it('空文字列は en にフォールバック', () => {
        expect(resolveLocale('')).toBe(DEFAULT_LOCALE)
    })

    it('全く無関係な文字列は en にフォールバック', () => {
        expect(resolveLocale('not-a-locale')).toBe(DEFAULT_LOCALE)
    })

    it('zh のみ (zh-Hans は 2 セグメント) → en にフォールバック', () => {
        // 'zh' は SUPPORTED_LOCALE_IDS にない ('zh-Hans' のみ)
        expect(resolveLocale('zh')).toBe(DEFAULT_LOCALE)
    })

    it('zh-TW → zh-Hans には解決されない → en にフォールバック', () => {
        // 2 セグメントプレフィックス 'zh-TW' は 'zh-Hans' と一致しない
        // 1 セグメント 'zh' も存在しない
        expect(resolveLocale('zh-TW')).toBe(DEFAULT_LOCALE)
    })

    // ── 境界値: BCP 47 ─────────────────────────────────────────────────────

    it('pt のみ → pt-BR には解決されない → en にフォールバック', () => {
        expect(resolveLocale('pt')).toBe(DEFAULT_LOCALE)
    })

    it('pt-BR は完全一致で解決', () => {
        expect(resolveLocale('pt-BR')).toBe('pt-BR')
    })
})

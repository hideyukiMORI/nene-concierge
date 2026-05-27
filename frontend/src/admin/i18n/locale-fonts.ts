import type { SupportedLocale } from './locales'

/**
 * CSS カスタムプロパティ名。
 * index.html の body { font-family: var(--nca-font-body, ...) } で参照される。
 * document.documentElement に inline style で設定すると @media / :root 宣言を上書きできる。
 */
export const LOCALE_FONT_BODY_VAR = '--nca-font-body'

/**
 * ロケール別 UI フォントスタック。
 * Latin 系: Inter（ビジネス向け欧文サンセリフ、@fontsource 同梱）
 * 日本語:   Noto Sans JP（Google 推奨、視認性の高いゴシック体）
 * 中国語:   Noto Sans SC（CJK 統一デザイン）
 *
 * @fontsource が読み込まれていない環境ではシステムフォントにフォールバックする。
 */
export const LOCALE_FONT_STACKS: Record<SupportedLocale, string> = {
    en:        '"Inter", ui-sans-serif, system-ui, sans-serif',
    ja:        '"Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif',
    fr:        '"Inter", ui-sans-serif, system-ui, sans-serif',
    'zh-Hans': '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    'pt-BR':   '"Inter", ui-sans-serif, system-ui, sans-serif',
    de:        '"Inter", ui-sans-serif, system-ui, sans-serif',
}

export function getLocaleFontStack(locale: SupportedLocale): string {
    return LOCALE_FONT_STACKS[locale]
}

/**
 * `document.documentElement` の CSS 変数を更新してフォントを切り替える。
 * インラインスタイルはシートより優先されるため body font-family を実質上書きできる。
 *
 * nene-records の applyLocaleFontFamily() と同パターン。
 */
export function applyLocaleFontFamily(
    locale: SupportedLocale,
    root: HTMLElement = document.documentElement,
): void {
    root.style.setProperty(LOCALE_FONT_BODY_VAR, getLocaleFontStack(locale))
}

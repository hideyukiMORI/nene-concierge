/**
 * Admin UI フォント (@fontsource 同梱)。
 * widget / public サイトには含めない — admin/index.tsx からのみインポートする。
 *
 * Latin 系: Inter (en, fr, de, pt-BR)
 * 日本語:   Noto Sans JP (ja)
 * 中国語:   Noto Sans SC (zh-Hans)
 *
 * weight: 400 (Regular) / 500 (Medium) / 600 (SemiBold)
 * font-display: swap（@fontsource デフォルト）
 */

/* ── Inter (Latin + Latin-ext for fr/de/pt-BR accented chars) ─────────────── */
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-ext-600.css'

/* ── Noto Sans JP (ja) ────────────────────────────────────────────────────── */
import '@fontsource/noto-sans-jp/japanese-400.css'
import '@fontsource/noto-sans-jp/japanese-500.css'
import '@fontsource/noto-sans-jp/japanese-600.css'

/* ── Noto Sans SC (zh-Hans) ───────────────────────────────────────────────── */
import '@fontsource/noto-sans-sc/chinese-simplified-400.css'
import '@fontsource/noto-sans-sc/chinese-simplified-500.css'
import '@fontsource/noto-sans-sc/chinese-simplified-600.css'

import {
  API_FETCH_SYNTAX,
  I18N_RUNTIME_SYNTAX,
  STYLING_SYNTAX,
} from '@hideyukimori/nene2-standards'
import nene2 from '@hideyukimori/nene2-standards'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// concierge の locale 定義ファイルの実パス（非FSD）。canonical の免除は FSD パス
// `src/shared/i18n/messages/**` 固定なので、それを concierge 実パスへ写す（下記 transition override）。
const CONCIERGE_MESSAGES_GLOB = 'src/admin/i18n/messages/**/*.{ts,tsx}'

/**
 * NeNe Concierge — ESLint ゲート（C1・Issue #178）。
 *
 * フリート唯一の ESLint 欠落を埋める。既存違反は ESLint native bulk-suppressions
 * （`eslint-suppressions.json` — `--suppress-all` で凍結・`--prune-suppressions` で shrink-only）で
 * 凍結し、CI は `eslint`（`--suppress-all` 無し）で「既存 suppress・新規のみ error」を強制する。
 * fleet-tooling が「既存負債リポの公式凍結パターン」として sanction・concierge を pilot（G-7）。
 *
 * 採用断片: base + fsd + api + i18n + testing。
 *
 * ── styling 段は意図的に除外（hub 裁定 A案・fleet-tooling sanction 済み） ──
 * concierge は非Tailwind（依存無し・@theme 無し）。`nene2.styling` の
 * `better-tailwindcss/no-unknown-classes` は Tailwind entry を要求し、非Tailwind では throw か
 * silent fallback による偽陽性洪水になる（payout#161 で 218 件実測の型）。唯一の実効ルール
 * `nene2/style-prop-css-vars-only`（inline style 禁止）が測る inline 負債（838件）は本ゲートの
 * スコープ外（A2 再建 / fleet#56 未計測層の領域）。→ A2 で再評価。
 *
 * ── concierge の CSS 実負債について（no-silent-caps） ──
 * concierge の CSS 実負債は CSS-in-JS（`src/widget/style.ts` 等のテンプレートリテラル）＋inline で、
 * stylelint 2枚組（`.css` 前提）では customSyntax 無しに測定不能。唯一の `.css` は git 追跡された
 * esbuild 生成物 `public_html/admin/app.css`（凍結はリビルドで揺れるゲートの嘘になる）。
 * → Wave G stylelint は concierge では park。計測・是正は fleet#56（未計測層・concierge 優先）と A2 の領域。
 */
export default tseslint.config(
  // node_modules / ビルド生成物に加え、tsconfig project（src/** のみ）外の tooling 設定ファイルを
  // 除外する。これらは型情報を持たず type-aware パーサで parse error になり（bulk-suppressions で
  // 凍結不能）、ゲート対象は製品ソース（src/**）なので lint スコープから外すのが正。
  {
    ignores: [
      'node_modules',
      '../public_html/**',
      'dist',
      'coverage',
      'eslint.config.js',
      'esbuild.mjs',
      'vitest.config.ts',
    ],
  },
  ...nene2.base,
  ...nene2.fsd,
  ...nene2.api,
  ...nene2.i18n,
  ...nene2.testing,
  {
    name: 'concierge/language-options',
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
  },
  // ── 条件付き公認差異（非FSD 経過措置・registries transition kind・A2 で canonical へ戻す） ──
  // canonical の `nene2/restrictions/syntax-messages` は JP literal 免除を FSD パス
  // `src/shared/i18n/messages/**` に限定する。concierge の locale table は非FSD の
  // `src/admin/i18n/messages/**` にあり、当該言語の文字列を正当に持つため、免除が mismatch して
  // 誤検知する。canonical と同一の縮約セレクタ集合（JP 除外・Intl/style/fetch は適用継続）を
  // concierge 実パスへ再適用して等価にする（`off` による除外ではなく canonical 機構の写像）。
  {
    name: 'concierge/transition/syntax-messages',
    files: [CONCIERGE_MESSAGES_GLOB],
    ignores: ['**/*.test.*', '**/*.stories.*'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...[...API_FETCH_SYNTAX, ...STYLING_SYNTAX, ...I18N_RUNTIME_SYNTAX].map((s) => ({
          selector: s.selector,
          message: s.message,
        })),
      ],
    },
  },
)

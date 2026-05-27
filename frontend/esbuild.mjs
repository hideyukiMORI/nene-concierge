// @ts-check
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const baseConfig = {
    bundle:    true,
    format:    /** @type {'iife'} */ ('iife'),
    minify:    isProd,
    sourcemap: !isProd,
    logLevel:  /** @type {'info'} */ ('info'),
};

// ── embed widget ──────────────────────────────────────────────────────────────
await build({
    ...baseConfig,
    target:      ['es2020', 'chrome90', 'firefox90', 'safari14'],
    entryPoints: [resolve(__dirname, 'src/widget/index.ts')],
    outfile:     resolve(__dirname, '../public_html/widget.js'),
    globalName:  'NeNeWidget',
});

// ── admin SPA (modern browsers only) ─────────────────────────────────────────
// outdir 方式で @fontsource フォントファイル (woff2/woff) を assets/ に出力する。
await build({
    ...baseConfig,
    target:      ['esnext'],   // admin は常にモダンブラウザ
    entryPoints: [resolve(__dirname, 'src/admin/index.tsx')],
    outdir:      resolve(__dirname, '../public_html/admin/'),
    entryNames:  'app',        // → app.js / app.css (従来と同じ出力ファイル名)
    globalName:  'NeNeAdmin',
    external:    [],           // bundle everything including React
    // @fontsource woff2/woff ファイルをコピーし CSS の url() を /admin/assets/... に書き換える
    loader: /** @type {Record<string, import('esbuild').Loader>} */ ({
        '.woff':  'file',
        '.woff2': 'file',
    }),
    assetNames:  'assets/[name]-[hash]',
    publicPath:  '/admin/',
});

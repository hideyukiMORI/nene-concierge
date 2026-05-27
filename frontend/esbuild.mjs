// @ts-check
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const common = {
    bundle:    true,
    format:    /** @type {'iife'} */ ('iife'),
    target:    ['es2020', 'chrome90', 'firefox90', 'safari14'],
    minify:    isProd,
    sourcemap: !isProd,
    logLevel:  /** @type {'info'} */ ('info'),
};

// ── embed widget ──────────────────────────────────────────────────────────────
await build({
    ...common,
    entryPoints: [resolve(__dirname, 'src/widget/index.ts')],
    outfile:     resolve(__dirname, '../public_html/widget.js'),
    globalName:  'NeNeWidget',
});

// ── admin SPA (modern browsers only — no transpilation needed) ────────────────
await build({
    ...common,
    target:      ['esnext'],   // admin served from own server, always modern browser
    entryPoints: [resolve(__dirname, 'src/admin/index.tsx')],
    outfile:     resolve(__dirname, '../public_html/admin/app.js'),
    globalName:  'NeNeAdmin',
    external:    [],  // bundle everything including React
});

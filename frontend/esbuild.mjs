// @ts-check
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
    entryPoints: [resolve(__dirname, 'src/widget/index.ts')],
    bundle: true,
    outfile: resolve(__dirname, '../public_html/widget.js'),
    format: 'iife',
    globalName: 'NeNeWidget',
    target: ['es2020', 'chrome90', 'firefox90', 'safari14'],
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
    logLevel: 'info',
});

#!/usr/bin/env node
// 生成物ドリフト検知ゲート (#163)。
//
// 目的は2つ。**クリーンビルドの出力とコミット済み `public_html/` が一致すること**（#185 の再発防止）と、
// **2つのビルドが互いの成果物を壊していないこと**（widget ビルドと admin ビルドが同じ `public_html/` へ
// 書くため）。前者は `git status` で、後者は配信の要である 2 ファイルの構造検査で見る。
//
// 🔴 使い方: **ビルドの後に走らせる**。CI では `npm run check`（末尾が build）の直後。
// 依存ゼロ（node 組込みのみ）。
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * 配信の骨格。ここが壊れると「ビルドは通るがサイトが動かない」状態になる。
 *
 * 🔴 判別条件を「ファイルに index.php という文字列が含まれるか」で書いてはいけない。
 * corpus が 2026-08-05 に踏んだ罠がそれで、admin 版の `.htaccess` にも（API を親へ回す行として）
 * `index.php` が現れるため、**わざと上書きしても検査が素通りした**。見るべきは
 * 「**どこへ catch-all しているか**」であって、文字列の出現ではない。
 */
const STRUCTURE = [
  {
    path:        'public_html/.htaccess',
    // 実ファイル・実ディレクトリ以外をすべて index.php へ流す = API フロントコントローラ
    expect:      /^RewriteRule\s+\^\s+index\.php\b/m,
    description: 'API フロントコントローラへの catch-all（RewriteRule ^ index.php）',
    brokenBy:    'admin 用の SPA fallback 版で上書きされた可能性があります',
  },
  {
    path:        'public_html/admin/.htaccess',
    // 実ファイル以外を index.html へ流す = SPA fallback
    expect:      /^RewriteRule\s+\^\s+index\.html\b/m,
    description: '管理 SPA の fallback（RewriteRule ^ index.html）',
    brokenBy:    'ルート用の API 版で上書きされた可能性があります',
  },
];

/** SPA のエントリ。ビルドが outdir を掃除すると消える。 */
const REQUIRED_FILES = ['public_html/admin/index.html'];

let failed = false;

function fail(message, ...detail) {
  failed = true;
  console.error(`✗ ${message}`);
  for (const line of detail) console.error(`    ${line}`);
}

// ── 1. 配信の骨格が壊れていないか ────────────────────────────────────────────
for (const file of REQUIRED_FILES) {
  if (!existsSync(join(repoRoot, file))) {
    fail(`${file} がありません`, 'ビルドが出力先を掃除した可能性があります（emptyOutDir 相当の挙動）');
  }
}

for (const { path, expect, description, brokenBy } of STRUCTURE) {
  const full = join(repoRoot, path);

  if (!existsSync(full)) {
    fail(`${path} がありません`, brokenBy);
    continue;
  }

  if (!expect.test(readFileSync(full, 'utf8'))) {
    fail(`${path} に${description}がありません`, brokenBy);
  }
}

// ── 2. コミット済み生成物がクリーンビルドの出力と一致するか ──────────────────
const status = execFileSync('git', ['status', '--porcelain', '--', 'public_html'], {
  cwd:      repoRoot,
  encoding: 'utf8',
}).trim();

if (status !== '') {
  fail(
    'ビルド後の public_html/ がコミット済みの内容と一致しません（生成物ドリフト）',
    'ソースだけ変更して生成物を再ビルドしていない、',
    'または生成物だけ手で編集した可能性があります（#185 の再発）。',
    '`npm run build --prefix frontend` の結果をコミットしてください。',
    '',
    ...status.split('\n').map((line) => `  ${line}`),
  );
}

if (failed) {
  console.error('\n[artifact-drift] FAIL');
  process.exit(1);
}

console.log('[artifact-drift] OK — 配信の骨格が健在で、生成物はコミット済みの内容と一致します。');

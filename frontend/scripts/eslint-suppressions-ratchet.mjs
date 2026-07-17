#!/usr/bin/env node
// eslint-suppressions.json の増量防止 ratchet (#182)。
// origin/main の suppressions と比較し、エントリ追加・件数増を FAIL にする（削除・減少のみ PASS）。
// 依存ゼロ（node 組込みのみ）。CI の shallow checkout では origin/main を fetch してから比較する。
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPPRESSIONS_REPO_PATH = 'frontend/eslint-suppressions.json';
const BASELINE_REF = process.env.RATCHET_BASELINE_REF ?? 'origin/main';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(...args) {
  return execFileSync('git', args, { cwd: frontendDir, encoding: 'utf8' });
}

function refExists(ref) {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

function loadBaseline() {
  if (!refExists(BASELINE_REF)) {
    // CI の shallow checkout（fetch-depth: 1）では origin/main が無いので取得する。
    try {
      git('fetch', '--no-tags', '--depth=1', 'origin', '+refs/heads/main:refs/remotes/origin/main');
    } catch {
      /* fetch 失敗は下の rev-parse エラーで報告する */
    }
    if (!refExists(BASELINE_REF)) {
      console.error(`[suppressions-ratchet] ベースライン ref '${BASELINE_REF}' を解決できません。`);
      console.error('  ローカルなら `git fetch origin main` を実行してください。');
      process.exit(2);
    }
  }
  try {
    return JSON.parse(git('show', `${BASELINE_REF}:${SUPPRESSIONS_REPO_PATH}`));
  } catch {
    console.error(`[suppressions-ratchet] ${BASELINE_REF} から ${SUPPRESSIONS_REPO_PATH} を読めません。`);
    process.exit(2);
  }
}

function totals(suppressions) {
  let entries = 0;
  let count = 0;
  for (const rules of Object.values(suppressions)) {
    entries += Object.keys(rules).length;
    for (const { count: c } of Object.values(rules)) count += c;
  }
  return { files: Object.keys(suppressions).length, entries, count };
}

const current = JSON.parse(readFileSync(resolve(frontendDir, 'eslint-suppressions.json'), 'utf8'));
const baseline = loadBaseline();

const violations = [];
for (const [file, rules] of Object.entries(current)) {
  for (const [rule, { count }] of Object.entries(rules)) {
    const baseCount = baseline[file]?.[rule]?.count ?? 0;
    if (count > baseCount) {
      violations.push({ file, rule, baseCount, count });
    }
  }
}

const base = totals(baseline);
const cur = totals(current);

if (violations.length > 0) {
  console.error(`[suppressions-ratchet] FAIL: eslint-suppressions.json が ${BASELINE_REF} より増えています。`);
  console.error('  suppressions は shrink-only です。新規違反はコードを修正してください（凍結への追加は不可）。');
  for (const v of violations) {
    const kind = v.baseCount === 0 ? '新規エントリ' : '件数増';
    console.error(`  - ${v.file} / ${v.rule}: ${v.baseCount} → ${v.count} (${kind})`);
  }
  process.exit(1);
}

console.log(
  `[suppressions-ratchet] OK: ${base.count} → ${cur.count} 件` +
    ` (${base.files} → ${cur.files} files, ${base.entries} → ${cur.entries} entries, baseline: ${BASELINE_REF})`,
);

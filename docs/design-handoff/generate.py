#!/usr/bin/env python3
"""
NeNe Concierge Admin — Design Handoff Generator
Generates self-contained HTML snapshots for Claude Design.
"""
import os, zipfile, textwrap

OUT = os.path.dirname(__file__)

# ── Shared CSS (tokens + primitives) ─────────────────────────────────────────

TOKENS_CSS = """
:root {
  /* ── Primary / Accent (teal) ──────────────────────────────────────── */
  --primary:          #0d9488;  /* oklch(62% 0.14 192) */
  --primary-hover:    #0b7873;
  --primary-light:    #f0fdfb;
  --primary-border:   #99d4cf;
  --primary-muted:    #b2ddd9;
  --primary-text:     #115e59;
  --primary-bg:       #e6faf8;
  --primary-fg:       #ffffff;

  /* ── Danger ──────────────────────────────────────────────────────── */
  --danger:           #dc2626;  /* oklch(52% 0.20 25) */
  --danger-bg:        #fef9f9;
  --danger-border:    #fca5a5;
  --danger-text:      #7f1d1d;

  /* ── Success ─────────────────────────────────────────────────────── */
  --success-bg:       #f0fdf4;
  --success-border:   #86efac;
  --success-text:     #14532d;

  /* ── Surface & Background ─────────────────────────────────────────── */
  --bg:               #f8f7f5;  /* oklch(97% 0.006 75) */
  --surface:          #ffffff;
  --surface-hover:    #f8f7f5;

  /* ── Sidebar ─────────────────────────────────────────────────────── */
  --sidebar:          #1e2130;  /* oklch(19% 0.015 265) */
  --sidebar-hover:    #262d3d;
  --sidebar-active:   #2f3850;
  --sidebar-border:   #2d3345;
  --sidebar-text:     #c4c9d4;  /* oklch(80% 0.010 265) */
  --sidebar-muted:    #838899;
  --sidebar-title:    #f0f0ed;

  /* ── Text ────────────────────────────────────────────────────────── */
  --text:             #1a1916;  /* oklch(18% 0.02 75) */
  --text-strong:      #242220;
  --text-muted:       #7a7772;

  /* ── Border ──────────────────────────────────────────────────────── */
  --border:           #dedbd6;  /* oklch(88% 0.010 75) */
  --border-input:     #cfccc6;
  --border-light:     #eceae7;

  /* ── Table ───────────────────────────────────────────────────────── */
  --table-header:     #f8f7f5;
  --table-row:        #fcfcfb;

  /* ── Badge ───────────────────────────────────────────────────────── */
  --badge-draft-bg:   #e8e7f0;
  --badge-draft-fg:   #3b3963;
  --badge-pub-bg:     #e6faf8;
  --badge-pub-fg:     #115e59;
  --badge-arch-bg:    #fef2e8;
  --badge-arch-fg:    #7c3516;

  /* ── Typography ──────────────────────────────────────────────────── */
  --font-xs:    11px;
  --font-sm:    12px;
  --font-base:  13px;
  --font-md:    14px;
  --font-lg:    16px;
  --font-xl:    18px;
  --font-2xl:   22px;

  /* ── Controls ────────────────────────────────────────────────────── */
  --ctrl-h:     28px;
  --ctrl-h-sm:  24px;
  --ctrl-h-xs:  20px;

  /* ── Radius ──────────────────────────────────────────────────────── */
  --r-sm:   2px;
  --r-md:   3px;
  --r-lg:   4px;
  --r-xl:   9999px;

  /* ── Shadow ──────────────────────────────────────────────────────── */
  --shadow-card:  0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
  --shadow-focus: 0 0 0 3px rgba(13,148,136,.30);

  /* ── Layout ──────────────────────────────────────────────────────── */
  --sidebar-w:  240px;
}
"""

BASE_CSS = """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: var(--font-md);
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
}

/* ── Layout shell ─────────────────────────────────────────────────────────── */
.layout { display: flex; min-height: 100vh; }

.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--sidebar);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sidebar-border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 16px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}
.sidebar-brand {
  font-weight: 600; font-size: var(--font-base);
  color: var(--sidebar-title); letter-spacing: .01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-badge {
  background: var(--primary); color: var(--primary-fg);
  padding: 2px 7px; border-radius: var(--r-sm);
  font-size: var(--font-xs); font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; flex-shrink: 0;
}
.sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 12px; margin: 1px 8px;
  color: var(--sidebar-text); text-decoration: none;
  border-radius: var(--r-lg); font-size: var(--font-base);
  position: relative;
}
.nav-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-title); font-weight: 600;
}
.nav-item.active::before {
  content: ''; position: absolute; left: -8px; top: 5px; bottom: 5px;
  width: 2px; background: var(--primary); border-radius: 2px;
}
.nav-item .icon { opacity: .75; display: inline-flex; flex-shrink: 0; }
.nav-item.active .icon { opacity: 1; color: var(--primary); }
.nav-divider { margin: 10px 0; border-top: 1px solid var(--sidebar-border); opacity: .5; }
.sidebar-footer {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--sidebar-border);
  font-size: var(--font-xs); color: var(--sidebar-muted);
}

.main-content {
  flex: 1; min-width: 0;
  overflow-y: auto;
  background: var(--bg);
  padding: 32px 40px;
}
.main-inner { max-width: 960px; margin: 0 auto; }

/* ── Common primitives ───────────────────────────────────────────────────────*/
.page-title {
  font-size: var(--font-2xl); font-weight: 700; margin-bottom: 24px;
  color: var(--text-strong); letter-spacing: -.02em; line-height: 1.2;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
}
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: var(--ctrl-h); padding: 0 12px; gap: 6px;
  border-radius: var(--r-md); font-weight: 600; font-size: var(--font-base);
  cursor: pointer; border: 1px solid transparent;
  white-space: nowrap; text-decoration: none;
}
.btn-primary { background: var(--primary); color: var(--primary-fg); border-color: var(--primary); }
.btn-danger  { background: var(--danger);  color: #fff; border-color: var(--danger); }
.btn-ghost   { background: transparent; color: var(--primary); border-color: var(--primary); }

.badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: var(--r-xl);
  font-size: var(--font-xs); font-weight: 700;
}
.badge-draft     { background: var(--badge-draft-bg); color: var(--badge-draft-fg); }
.badge-published { background: var(--badge-pub-bg);   color: var(--badge-pub-fg); }
.badge-archived  { background: var(--badge-arch-bg);  color: var(--badge-arch-fg); }

.error-msg {
  background: var(--danger-bg); border: 1px solid var(--danger-border);
  color: var(--danger-text); border-radius: var(--r-md);
  padding: 10px 14px; margin-bottom: 16px; font-size: var(--font-base); line-height: 1.5;
}
.success-msg {
  background: var(--success-bg); border: 1px solid var(--success-border);
  color: var(--success-text); border-radius: var(--r-md);
  padding: 10px 14px; margin-bottom: 16px; font-size: var(--font-base); line-height: 1.5;
}

.field-label {
  display: block; font-weight: 600; margin-bottom: 5px;
  font-size: var(--font-sm); color: var(--text-strong); line-height: 1.4;
}
.field-input {
  width: 100%; height: var(--ctrl-h); padding: 0 12px;
  box-sizing: border-box; border-radius: var(--r-md);
  border: 1px solid var(--border-input); font-size: var(--font-md);
  background: var(--surface); color: var(--text); outline: none;
}
.field-input:focus { border-color: var(--primary); box-shadow: var(--shadow-focus); }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--table-header); border-bottom: 1px solid var(--border-light); }
th {
  padding: 10px 16px; text-align: left;
  font-size: var(--font-sm); font-weight: 600; color: var(--text-muted);
}
tbody tr { border-bottom: 1px solid var(--border-light); }
tbody tr:hover { background: var(--surface-hover); }
td { padding: 12px 16px; font-size: var(--font-base); }

.filter-bar {
  display: flex; gap: 10px; margin-bottom: 16px;
  flex-wrap: wrap; align-items: center;
}
.filter-select {
  height: var(--ctrl-h-sm); padding: 0 8px;
  border-radius: var(--r-md); border: 1px solid var(--border-input);
  background: var(--surface); color: var(--text);
  font-size: var(--font-sm); cursor: pointer; outline: none;
}
.pagination {
  display: flex; justify-content: center; gap: 8px;
  margin-top: 16px; align-items: center;
}
.pag-btn {
  height: var(--ctrl-h-sm); padding: 0 14px;
  border-radius: var(--r-md); border: 1px solid var(--border);
  background: var(--surface); color: var(--text);
  font-size: var(--font-sm); font-weight: 500; cursor: pointer;
}
.pag-btn:disabled { opacity: .45; cursor: not-allowed; }

/* ── Alert banner ────────────────────────────────────────────────────────── */
.alert-warn {
  margin-bottom: 20px; padding: 12px 16px;
  border-radius: var(--r-md);
  background: oklch(97% 0.04 25);
  border: 1px solid oklch(87% 0.08 25);
  color: oklch(35% 0.14 25);
  font-size: var(--font-sm);
  display: flex; align-items: center; gap: 8px;
}
"""

# ── SVG nav icons ─────────────────────────────────────────────────────────────
ICON = {
    "dashboard": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    "flow":      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
    "palette":   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="8" r="1.2" fill="currentColor"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor"/></svg>',
    "key":       '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    "logs":      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    "sessions":  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    "settings":  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
}

NAV_ITEMS = [
    ("dashboard",  "icon-dashboard", "ダッシュボード",            "/admin/dashboard"),
    ("flow",       "icon-flow",      "シナリオ",                 "/admin/scenarios"),
    None,  # divider
    ("palette",    "icon-palette",   "外観設定",                 "/admin/appearance"),
    ("key",        "icon-key",       "アクションクレデンシャル",  "/admin/credentials"),
    ("logs",       "icon-logs",      "アクションログ",           "/admin/action-logs"),
    ("sessions",   "icon-sessions",  "セッション",               "/admin/sessions"),
    None,  # divider
    ("settings",   "icon-settings",  "設定",                    "/admin/settings"),
]

def sidebar_nav(active_key):
    html = ['<nav class="sidebar-nav">']
    for item in NAV_ITEMS:
        if item is None:
            html.append('<div class="nav-divider"></div>')
        else:
            icon_key, _, label, href = item
            is_active = icon_key == active_key
            cls = "nav-item active" if is_active else "nav-item"
            html.append(f'<a href="{href}" class="{cls}">'
                        f'<span class="icon">{ICON[icon_key]}</span>'
                        f'<span>{label}</span>'
                        f'</a>')
    html.append('</nav>')
    return "\n".join(html)

def sidebar(active_key):
    return f"""
<aside class="sidebar">
  <div class="sidebar-header">
    <span class="sidebar-brand">NeNe Concierge</span>
    <span class="sidebar-badge">Admin</span>
  </div>
  {sidebar_nav(active_key)}
  <div class="sidebar-footer">admin@example.com</div>
</aside>"""

def page_wrap(title, active_key, body, extra_css=""):
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — NeNe Concierge Admin</title>
  <style>
{TOKENS_CSS}
{BASE_CSS}
{extra_css}
  </style>
</head>
<body>
<div class="layout">
  {sidebar(active_key)}
  <main class="main-content">
    <div class="main-inner">
{body}
    </div>
  </main>
</div>
</body>
</html>"""


# ═══════════════════════════════════════════════════════════════════════════════
# 01 — README
# ═══════════════════════════════════════════════════════════════════════════════

README = """\
# NeNe Concierge Admin — Design Handoff

**日付:** 2026-05-28
**対象:** 管理画面 SPA (React + React Router)
**用途:** Claude Design へのデザイン現状渡し

---

## ファイル一覧

| ファイル | ページ | URL |
|---|---|---|
| `01_dashboard.html` | ダッシュボード | `/admin/dashboard` |
| `02_scenarios.html` | シナリオ一覧 | `/admin/scenarios` |
| `03_appearance.html` | 外観設定 | `/admin/appearance` |
| `04_credentials.html` | アクションクレデンシャル | `/admin/credentials` |
| `05_action-logs.html` | アクションログ | `/admin/action-logs` |
| `06_sessions.html` | セッション | `/admin/sessions` |
| `07_settings.html` | 設定 | `/admin/settings` |
| `tokens.css` | デザイントークン参照 | — |

## 共通レイアウト

```
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px)  │  MAIN CONTENT (max-width: 960px)          │
│ bg: #1e2130      │  bg: #f8f7f5                              │
│                  │  padding: 32px 40px                       │
│  [N] NeNe  Admin │                                           │
│  ─────────────   │  H1 (22px bold)                           │
│  ○ ダッシュボード│                                           │
│  ○ シナリオ      │  Card                                     │
│  ─────────────   │  └─ content                               │
│  ○ 外観設定      │                                           │
│  ○ クレデンシャル│                                           │
│  ○ アクションログ│                                           │
│  ○ セッション    │                                           │
│  ─────────────   │                                           │
│  ○ 設定          │                                           │
└──────────────────────────────────────────────────────────────┘
```

## デザイントークン（Default Light）

### プライマリカラー
- Primary:       `#0d9488` (teal — oklch 62% 0.14 192)
- Primary hover: `#0b7873`
- Primary bg:    `#e6faf8`
- Primary text:  `#115e59`

### サイドバー
- Background:    `#1e2130`
- Active:        `#2f3850`
- Border:        `#2d3345`
- Text:          `#c4c9d4`
- Title:         `#f0f0ed`

### コンテンツ
- Page bg:       `#f8f7f5`
- Surface:       `#ffffff`
- Border:        `#dedbd6`
- Text:          `#1a1916`
- Text muted:    `#7a7772`

### コントロール
- Height:        `28px`
- Height sm:     `24px`
- Radius md:     `3px`
- Font base:     `13px`
- Font md:       `14px`

## 状態パターン

### シナリオステータス Badge
| Status | bg | color |
|---|---|---|
| draft | `#e8e7f0` | `#3b3963` |
| published | `#e6faf8` | `#115e59` |
| archived | `#fef2e8` | `#7c3516` |

### ボタンバリアント
| Variant | bg | color |
|---|---|---|
| primary | `#0d9488` | `#fff` |
| danger | `#dc2626` | `#fff` |
| ghost | transparent | `#0d9488` |

### アダプターバッジ（クレデンシャル）
| Adapter | bg | color |
|---|---|---|
| http | `#e0f2fe` | `#0369a1` |
| email | `#fef3c7` | `#92400e` |
| slack | `#f0fdf4` | `#166534` |
| chatwork | `#fdf4ff` | `#7e22ce` |

## コンポーネント構成

```
Layout (全ページ共通)
├── Sidebar
│   ├── Brand + Admin badge
│   ├── NavItem[] (icon + label + active indicator)
│   └── User email
└── Main (padding 32px 40px, max-width 960px)
    ├── PageTitle (h1, 22px, bold)
    ├── ErrorMsg (danger banner, hidden if null)
    └── [page-specific content]

共通 UI プリミティブ:
  Card       — white surface, border, shadow-card, radius 4px, padding 24px
  Btn        — 28px height, primary/danger/ghost variant
  Badge      — status pill (draft/published/archived)
  Field      — label + text input, 28px height
  Select     — label + <select>, 28px height
  ErrorMsg   — danger alert
  SuccessMsg — success alert
  trHover    — table row hover effect
```
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 02 — Dashboard
# ═══════════════════════════════════════════════════════════════════════════════

DASHBOARD_CSS = """
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.kpi-card {
  padding: 20px 24px;
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 6px;
}
.kpi-card.alert {
  background: oklch(97% 0.04 25);
  border-color: oklch(87% 0.08 25);
}
.kpi-label {
  font-size: var(--font-xs);
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.kpi-value {
  font-size: 2rem; font-weight: 800; line-height: 1;
  color: var(--text);
}
.kpi-value.teal    { color: var(--primary); }
.kpi-value.purple  { color: oklch(40% 0.18 290); }
.kpi-value.green   { color: oklch(40% 0.14 150); }
.kpi-value.danger  { color: oklch(40% 0.14 25); }
.kpi-unit          { font-size: var(--font-sm); font-weight: 400; color: var(--text-muted); margin-left: 4px; }

.sparkline-card { }
.sparkline-title { margin-bottom: 12px; font-weight: 600; font-size: var(--font-sm); color: var(--text); }
.sparkline-svg   { width: 100%; height: 80px; display: block; }
.sparkline-dates {
  display: flex; justify-content: space-between;
  margin-top: 6px; font-size: var(--font-xs); color: var(--text-muted);
}
"""

DASHBOARD_BODY = """
<!-- ページタイトル -->
<h1 class="page-title">ダッシュボード</h1>

<!-- アクション失敗アラート (action_failures_24h > 0 のとき表示) -->
<div class="alert-warn">
  ⚠️ 直近24時間に 3 件のアクション失敗があります。
</div>

<!-- KPI カードグリッド (auto-fill minmax 180px) -->
<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-label">セッション数（7日）</div>
    <div class="kpi-value">248</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">コンバージョン数（7日）</div>
    <div class="kpi-value purple">31</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">CV 率</div>
    <div class="kpi-value green">12.5<span class="kpi-unit">%</span></div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">アクティブセッション</div>
    <div class="kpi-value teal">5</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">公開中シナリオ</div>
    <div class="kpi-value">3</div>
  </div>
  <div class="kpi-card alert">
    <div class="kpi-label">アクション失敗（24時間）</div>
    <div class="kpi-value danger">3</div>
  </div>
</div>

<!-- 日別セッション折れ線グラフカード -->
<div class="card sparkline-card">
  <div class="sparkline-title">日別セッション数（7日）</div>
  <!-- SVG折れ線グラフ: primary色でグラデーション塗り + ライン + ドット -->
  <svg class="sparkline-svg" viewBox="0 0 480 80" aria-label="日別セッション推移">
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#0d9488" stop-opacity=".25"/>
        <stop offset="100%" stop-color="#0d9488" stop-opacity=".02"/>
      </linearGradient>
    </defs>
    <polygon points="4,76 4,52 84,44 164,60 244,28 324,36 404,20 476,16 476,76" fill="url(#sg)"/>
    <polyline points="4,52 84,44 164,60 244,28 324,36 404,20 476,16"
      fill="none" stroke="#0d9488" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="4"   cy="52" r="3" fill="#0d9488"/>
    <circle cx="84"  cy="44" r="3" fill="#0d9488"/>
    <circle cx="164" cy="60" r="3" fill="#0d9488"/>
    <circle cx="244" cy="28" r="3" fill="#0d9488"/>
    <circle cx="324" cy="36" r="3" fill="#0d9488"/>
    <circle cx="404" cy="20" r="3" fill="#0d9488"/>
    <circle cx="476" cy="16" r="3" fill="#0d9488"/>
  </svg>
  <div class="sparkline-dates">
    <span>2026-05-22</span>
    <span>2026-05-28</span>
  </div>
</div>
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 03 — Scenarios
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS_BODY = """
<!-- ヘッダー行: タイトル + 新規作成ボタン -->
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
  <h1 class="page-title" style="margin-bottom:0">シナリオ</h1>
  <a href="/admin/scenarios/new" class="btn btn-primary">＋ 新規作成</a>
</div>

<!-- シナリオテーブル (Card padding:0) -->
<div class="card" style="padding:0; overflow:hidden;">
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>名前</th>
        <th>説明</th>
        <th>ステータス</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color:var(--text-muted)">1</td>
        <td><a href="/admin/scenarios/1" style="color:var(--primary);text-decoration:none;font-weight:500">
          お問い合わせフロー</a></td>
        <td style="color:var(--text-muted);max-width:200px">問い合わせ受付シナリオ</td>
        <td><span class="badge badge-published">Published</span></td>
        <td>
          <div style="display:flex;gap:8px;">
            <a href="/admin/scenarios/1" class="btn btn-ghost">編集</a>
            <button class="btn btn-danger">削除</button>
          </div>
        </td>
      </tr>
      <tr>
        <td style="color:var(--text-muted)">2</td>
        <td><a href="/admin/scenarios/2" style="color:var(--primary);text-decoration:none;font-weight:500">
          採用情報フロー</a></td>
        <td style="color:var(--text-muted);max-width:200px">—</td>
        <td><span class="badge badge-draft">Draft</span></td>
        <td>
          <div style="display:flex;gap:8px;">
            <a href="/admin/scenarios/2" class="btn btn-ghost">編集</a>
            <button class="btn btn-danger">削除</button>
          </div>
        </td>
      </tr>
      <tr>
        <td style="color:var(--text-muted)">3</td>
        <td><a href="/admin/scenarios/3" style="color:var(--primary);text-decoration:none;font-weight:500">
          旧キャンペーン</a></td>
        <td style="color:var(--text-muted);max-width:200px">2026年春キャンペーン用</td>
        <td><span class="badge badge-archived">Archived</span></td>
        <td>
          <div style="display:flex;gap:8px;">
            <a href="/admin/scenarios/3" class="btn btn-ghost">編集</a>
            <button class="btn btn-danger">削除</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!--
EMPTY STATE (シナリオ0件のとき):
<div class="card">
  <p style="color:var(--text-muted);text-align:center;padding:40px 0;">
    シナリオはまだありません。<br>
    <span style="font-size:var(--font-sm)">「＋ 新規作成」をクリックして作成してください。</span>
  </p>
</div>
-->
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 04 — Appearance
# ═══════════════════════════════════════════════════════════════════════════════

APPEARANCE_CSS = """
.color-row { display:flex; align-items:center; gap:8px; margin-bottom:16px; }
.swatch {
  display: inline-block; width: 20px; height: 20px;
  border-radius: 4px; border: 1px solid var(--border-input); vertical-align: middle;
}
input[type=color] { width:48px; height:36px; border:none; cursor:pointer; border-radius:2px; }
.hex-input {
  width:100px; height:var(--ctrl-h); padding:0 10px;
  border-radius:var(--r-md); border:1px solid var(--border-input);
  font-size:var(--font-base); background:var(--surface); color:var(--text); outline:none;
}
.form-section { margin-bottom:16px; }
.form-section label { display:block; }
.form-section .form-label {
  display:block; font-weight:600; margin-bottom:4px; font-size:var(--font-base);
}
select.field-select {
  width:100%; height:var(--ctrl-h); padding:0 12px;
  border-radius:var(--r-md); border:1px solid var(--border-input);
  font-size:var(--font-md); background:var(--surface); color:var(--text); outline:none;
}
"""

APPEARANCE_BODY = """
<h1 class="page-title">外観設定</h1>

<!-- フォームカード (max-width: 560px) -->
<div style="max-width:560px;">
  <div class="card">

    <!-- プライマリカラー -->
    <div class="form-section">
      <span class="form-label">プライマリカラー</span>
      <div class="color-row">
        <span class="swatch" style="background:#2563eb;"></span>
        <input type="color" value="#2563eb">
        <input class="hex-input" type="text" value="#2563eb" maxlength="7" placeholder="#2563eb">
      </div>
    </div>

    <!-- セカンダリカラー -->
    <div class="form-section">
      <span class="form-label">セカンダリカラー（テキスト）</span>
      <div class="color-row">
        <span class="swatch" style="background:#ffffff;"></span>
        <input type="color" value="#ffffff">
        <input class="hex-input" type="text" value="#ffffff" maxlength="7" placeholder="#ffffff">
      </div>
    </div>

    <!-- 表示位置 -->
    <div class="form-section">
      <label>
        <span class="form-label">位置</span>
        <select class="field-select">
          <option selected>右下</option>
          <option>左下</option>
          <option>右上</option>
          <option>左上</option>
        </select>
      </label>
    </div>

    <!-- トリガー -->
    <div class="form-section">
      <label>
        <span class="form-label">トリガー</span>
        <select class="field-select">
          <option selected>ページロード時（自動表示）</option>
          <option>スクロール時</option>
          <option>離脱インテント</option>
          <option>手動（ボタンクリックのみ）</option>
        </select>
      </label>
    </div>

    <!-- アイコン URL -->
    <div class="form-section" style="margin-bottom:16px;">
      <label>
        <span class="form-label" style="font-size:var(--font-sm);color:var(--text-strong);">アイコン URL（任意）</span>
        <input class="field-input" type="text" placeholder="https://example.com/icon.png" value="">
      </label>
    </div>

    <!-- ウェルカムテキスト -->
    <div class="form-section" style="margin-bottom:16px;">
      <label>
        <span class="form-label" style="font-size:var(--font-sm);color:var(--text-strong);">ウェルカムテキスト（任意）</span>
        <input class="field-input" type="text" placeholder="ご用件はなんでしょうか？" value="">
      </label>
    </div>

    <button class="btn btn-primary">保存</button>
  </div>
</div>
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 05 — Credentials
# ═══════════════════════════════════════════════════════════════════════════════

CREDENTIALS_CSS = """
.adapter-badge {
  padding: 2px 10px; border-radius: var(--r-xl);
  font-size: var(--font-sm); font-weight: 600;
  display: inline-block;
}
.adapter-http     { background:#e0f2fe; color:#0369a1; }
.adapter-email    { background:#fef3c7; color:#92400e; }
.adapter-slack    { background:#f0fdf4; color:#166534; }
.adapter-chatwork { background:#fdf4ff; color:#7e22ce; }

/* 新規作成フォームカード */
.create-card { margin-bottom: 24px; }
.create-card h2 { font-weight: 700; margin-bottom: 16px; font-size: var(--font-lg); }
.hint-text { color:var(--text-muted); font-size:var(--font-sm); margin-bottom:16px; }
"""

CREDENTIALS_BODY = """
<!-- ヘッダー行 -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
  <h1 class="page-title" style="margin-bottom:0">アクションクレデンシャル</h1>
  <button class="btn btn-primary">＋ 追加</button>
</div>

<!-- 新規作成フォーム (＋追加ボタンでトグル表示) -->
<div class="card create-card">
  <h2>新規クレデンシャル</h2>
  <div style="margin-bottom:16px;">
    <label>
      <span class="field-label">名前 <span style="color:var(--danger)">*</span></span>
      <input class="field-input" type="text" placeholder="例: Slack 通知 webhook" required>
    </label>
  </div>
  <div style="margin-bottom:16px;">
    <label>
      <span class="field-label">アダプター</span>
      <select class="field-input" style="cursor:pointer;">
        <option>HTTP（外部 API）</option>
        <option>Email</option>
        <option>Slack</option>
        <option>Chatwork</option>
      </select>
    </label>
  </div>
  <p class="hint-text">* URL、トークン等の機密設定は作成後 API 経由で更新できます。</p>
  <button class="btn btn-primary">作成</button>
</div>

<!-- クレデンシャルテーブル -->
<div class="card" style="padding:0;overflow:hidden;">
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>名前</th>
        <th>アダプター</th>
        <th>作成日</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color:var(--text-muted)">1</td>
        <td style="font-weight:500">Slack #通知チャンネル</td>
        <td><span class="adapter-badge adapter-slack">slack</span></td>
        <td style="color:var(--text-muted)">2026-04-10</td>
        <td><button class="btn btn-danger">削除</button></td>
      </tr>
      <tr>
        <td style="color:var(--text-muted)">2</td>
        <td style="font-weight:500">問い合わせ受信メール</td>
        <td><span class="adapter-badge adapter-email">email</span></td>
        <td style="color:var(--text-muted)">2026-04-15</td>
        <td><button class="btn btn-danger">削除</button></td>
      </tr>
      <tr>
        <td style="color:var(--text-muted)">3</td>
        <td style="font-weight:500">社内 Webhook</td>
        <td><span class="adapter-badge adapter-http">http</span></td>
        <td style="color:var(--text-muted)">2026-05-01</td>
        <td><button class="btn btn-danger">削除</button></td>
      </tr>
      <tr>
        <td style="color:var(--text-muted)">4</td>
        <td style="font-weight:500">Chatwork 通知</td>
        <td><span class="adapter-badge adapter-chatwork">chatwork</span></td>
        <td style="color:var(--text-muted)">2026-05-12</td>
        <td><button class="btn btn-danger">削除</button></td>
      </tr>
    </tbody>
  </table>
</div>
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 06 — Action Logs
# ═══════════════════════════════════════════════════════════════════════════════

ACTIONLOGS_CSS = """
.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 9px; border-radius: 99px;
  font-size: var(--font-xs); font-weight: 700;
}
.status-success { background: oklch(96% 0.04 150); color: oklch(40% 0.14 150); border: 1px solid oklch(85% 0.09 150); }
.status-failure { background: oklch(97% 0.04 25);  color: oklch(40% 0.14 25);  border: 1px solid oklch(87% 0.08 25); }
td.mono { font-family: monospace; font-size: var(--font-xs); color: var(--text-muted); }
td.error-cell { color: var(--danger-text); font-size: var(--font-xs); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
"""

ACTIONLOGS_BODY = """
<h1 class="page-title">アクションログ</h1>

<!-- フィルターバー -->
<div class="filter-bar">
  <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-sm);color:var(--text-muted);">
    アダプター:
    <select class="filter-select">
      <option value="">すべて</option>
      <option>🌐 HTTP</option>
      <option>📧 Email</option>
      <option>💬 Slack</option>
      <option>🗨️ Chatwork</option>
    </select>
  </label>
  <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-sm);color:var(--text-muted);">
    ステータス:
    <select class="filter-select">
      <option value="">すべて</option>
      <option>✓ success</option>
      <option>✗ failure</option>
    </select>
  </label>
  <span style="margin-left:auto;font-size:var(--font-sm);color:var(--text-muted);">128 records</span>
</div>

<!-- ログテーブル -->
<div class="card" style="padding:0;overflow:hidden;">
  <div class="table-wrap">
    <table style="font-size:var(--font-sm);">
      <thead>
        <tr>
          <th>ステータス</th>
          <th>アダプター</th>
          <th>セッション</th>
          <th>シナリオ</th>
          <th>実行日時</th>
          <th>エラー</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="status-badge status-success">✓ success</span></td>
          <td>💬 slack</td>
          <td class="mono">a3f9c2d1…</td>
          <td style="color:var(--text-muted)">#1</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:32</td>
          <td class="error-cell">—</td>
        </tr>
        <tr style="background:var(--table-row)">
          <td><span class="status-badge status-failure">✗ failure</span></td>
          <td>📧 email</td>
          <td class="mono">b7e12f4a…</td>
          <td style="color:var(--text-muted)">#1</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:28</td>
          <td class="error-cell">SMTP connection timeout: server not responding</td>
        </tr>
        <tr>
          <td><span class="status-badge status-success">✓ success</span></td>
          <td>🌐 http</td>
          <td class="mono">c9d3a5b8…</td>
          <td style="color:var(--text-muted)">#2</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 13:55</td>
          <td class="error-cell">—</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ページネーション -->
<div class="pagination">
  <button class="pag-btn" disabled>← Prev</button>
  <span style="font-size:var(--font-sm);color:var(--text-muted);">1 / 3</span>
  <button class="pag-btn">Next →</button>
</div>
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 07 — Sessions
# ═══════════════════════════════════════════════════════════════════════════════

SESSIONS_CSS = """
.outcome-badge {
  display: inline-block; padding: 2px 9px; border-radius: 99px;
  font-size: var(--font-xs); font-weight: 700;
}
.outcome-active    { background:oklch(96% 0.05 220); color:oklch(38% 0.15 220); border:1px solid oklch(83% 0.10 220); }
.outcome-completed { background:oklch(96% 0.04 150); color:oklch(40% 0.14 150); border:1px solid oklch(85% 0.09 150); }
.outcome-dropped   { background:oklch(97% 0.04 25);  color:oklch(40% 0.14 25);  border:1px solid oklch(87% 0.08 25); }
.outcome-converted { background:oklch(96% 0.06 290); color:oklch(38% 0.18 290); border:1px solid oklch(83% 0.12 290); }

/* 右ドロワー (セッション詳細パネル) */
.detail-overlay {
  position:fixed; inset:0; z-index:100;
  display:flex; align-items:flex-start; justify-content:flex-end;
}
.detail-overlay-bg { position:absolute; inset:0; background:rgba(0,0,0,.35); }
.detail-panel {
  position:relative; z-index:1;
  width:480px; max-width:95vw; height:100vh;
  background:var(--surface);
  box-shadow:-4px 0 24px rgba(0,0,0,.12);
  overflow-y:auto; display:flex; flex-direction:column;
}
.detail-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px; border-bottom:1px solid var(--border);
  position:sticky; top:0; background:var(--surface); z-index:1;
}
.detail-header-title { font-weight:700; font-size:var(--font-md); }
.detail-close-btn {
  background:none; border:none; cursor:pointer;
  font-size:20px; color:var(--text-muted); line-height:1;
  padding:2px 6px; border-radius:var(--r-sm);
}
.detail-body { padding:16px 20px; flex:1; }
.detail-meta {
  display:grid; grid-template-columns:1fr 1fr;
  gap:8px 16px; margin-bottom:20px; font-size:var(--font-sm);
}
.detail-meta-key { color:var(--text-muted); margin-bottom:2px; }
.detail-meta-val { color:var(--text); }
.chat-bubble-wrap {
  display:flex; flex-direction:column; gap:8px;
}
.chat-row { display:flex; gap:8px; align-items:flex-end; }
.chat-row.user { flex-direction:row-reverse; }
.chat-icon { font-size:var(--font-xs); color:var(--text-muted); flex-shrink:0; padding-bottom:4px; }
.chat-bubble {
  max-width:80%; padding:8px 12px; border-radius:var(--r-md);
  border:1px solid var(--border); font-size:var(--font-sm); color:var(--text); line-height:1.5;
}
.chat-bubble.bot  { background:var(--bg); }
.chat-bubble.user { background:oklch(92% 0.08 250); }
.chat-time { margin-top:4px; font-size:var(--font-xs); color:var(--text-muted); }
"""

SESSIONS_BODY = """
<h1 class="page-title">セッション</h1>

<!-- フィルターバー -->
<div class="filter-bar">
  <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-sm);color:var(--text-muted);">
    結果:
    <select class="filter-select">
      <option>すべて</option>
      <option>アクティブ</option>
      <option>完了</option>
      <option>離脱</option>
      <option>コンバージョン済み</option>
    </select>
  </label>
  <label style="display:flex;align-items:center;gap:6px;font-size:var(--font-sm);color:var(--text-muted);">
    コンバージョン:
    <select class="filter-select">
      <option>すべて</option>
      <option>✓ あり</option>
      <option>— なし</option>
    </select>
  </label>
  <span style="margin-left:auto;font-size:var(--font-sm);color:var(--text-muted);">248 records</span>
</div>

<!-- セッションテーブル (行クリックで右ドロワー表示) -->
<div class="card" style="padding:0;overflow:hidden;">
  <div class="table-wrap">
    <table style="font-size:var(--font-sm);">
      <thead>
        <tr>
          <th>結果</th>
          <th>シナリオ</th>
          <th>コンバージョン</th>
          <th>開始日時</th>
          <th>終了日時</th>
        </tr>
      </thead>
      <tbody>
        <tr style="cursor:pointer;">
          <td><span class="outcome-badge outcome-converted">コンバージョン済み</span></td>
          <td style="color:var(--text-muted)">#1</td>
          <td style="color:oklch(40% 0.14 150)">✓ あり</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:30</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:35</td>
        </tr>
        <tr style="background:var(--table-row);cursor:pointer;">
          <td><span class="outcome-badge outcome-completed">完了</span></td>
          <td style="color:var(--text-muted)">#1</td>
          <td style="color:var(--text-muted)">— なし</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:10</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:18</td>
        </tr>
        <tr style="cursor:pointer;">
          <td><span class="outcome-badge outcome-active">アクティブ</span></td>
          <td style="color:var(--text-muted)">#2</td>
          <td style="color:var(--text-muted)">— なし</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 14:38</td>
          <td style="color:var(--text-muted);white-space:nowrap">—</td>
        </tr>
        <tr style="background:var(--table-row);cursor:pointer;">
          <td><span class="outcome-badge outcome-dropped">離脱</span></td>
          <td style="color:var(--text-muted)">#1</td>
          <td style="color:var(--text-muted)">— なし</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 13:50</td>
          <td style="color:var(--text-muted);white-space:nowrap">2026-05-28 13:52</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ページネーション -->
<div class="pagination">
  <button class="pag-btn" disabled>← Prev</button>
  <span style="font-size:var(--font-sm);color:var(--text-muted);">1 / 5</span>
  <button class="pag-btn">Next →</button>
</div>

<!--
右ドロワー (セッション詳細): 行クリックで表示
  - overlay (背景: rgba(0,0,0,.35)) + 右寄せパネル (width:480px)
  - スティッキーヘッダー: "セッション詳細" + ✕ボタン
  - メタ情報グリッド (2col): 結果/コンバージョン/シナリオID/開始日時/終了日時
  - セッションID (monospace, break-all)
  - 収集変数テーブル (key/value)
  - チャットバブル: 🤖=左(bg), 👤=右(blue tint)
-->
<div class="detail-overlay" style="display:none;"><!-- hidden by default -->
  <div class="detail-overlay-bg"></div>
  <div class="detail-panel">
    <div class="detail-header">
      <span class="detail-header-title">セッション詳細</span>
      <button class="detail-close-btn">✕</button>
    </div>
    <div class="detail-body">
      <div class="detail-meta">
        <div><div class="detail-meta-key">結果</div>
          <div class="detail-meta-val"><span class="outcome-badge outcome-converted">コンバージョン済み</span></div></div>
        <div><div class="detail-meta-key">コンバージョン</div>
          <div class="detail-meta-val">✓ あり</div></div>
        <div><div class="detail-meta-key">シナリオ</div>
          <div class="detail-meta-val">#1</div></div>
        <div><div class="detail-meta-key">開始日時</div>
          <div class="detail-meta-val">2026-05-28 14:30</div></div>
        <div><div class="detail-meta-key">終了日時</div>
          <div class="detail-meta-val">2026-05-28 14:35</div></div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:var(--font-xs);color:var(--text-muted);margin-bottom:4px;">ID</div>
        <code style="font-size:var(--font-xs);color:var(--text-muted);word-break:break-all;">
          a3f9c2d1-4e5b-4c3a-8d1f-b2c9e7f1a3d4
        </code>
      </div>
      <section style="margin-bottom:20px;">
        <h3 style="font-size:var(--font-sm);font-weight:700;margin-bottom:8px;color:var(--text);">収集変数</h3>
        <div style="background:var(--bg);border-radius:var(--r-md);border:1px solid var(--border);overflow:hidden;">
          <div style="display:flex;gap:12px;padding:7px 12px;font-size:var(--font-sm);">
            <span style="color:var(--text-muted);min-width:100px;">user_name</span>
            <span style="color:var(--text);">山田 太郎</span>
          </div>
          <div style="display:flex;gap:12px;padding:7px 12px;font-size:var(--font-sm);background:var(--table-row);border-top:1px solid var(--border);">
            <span style="color:var(--text-muted);min-width:100px;">contact_type</span>
            <span style="color:var(--text);">商品について</span>
          </div>
        </div>
      </section>
      <section>
        <h3 style="font-size:var(--font-sm);font-weight:700;margin-bottom:10px;color:var(--text);">メッセージ (4)</h3>
        <div class="chat-bubble-wrap">
          <div class="chat-row">
            <div class="chat-icon">🤖</div>
            <div class="chat-bubble bot">
              こんにちは！どのようなご用件でしょうか？
              <div class="chat-time">14:30</div>
            </div>
          </div>
          <div class="chat-row user">
            <div class="chat-icon">👤</div>
            <div class="chat-bubble user">
              商品について聞きたいです
              <div class="chat-time" style="text-align:right;">14:31</div>
            </div>
          </div>
          <div class="chat-row">
            <div class="chat-icon">🤖</div>
            <div class="chat-bubble bot">
              お名前を教えていただけますか？
              <div class="chat-time">14:32</div>
            </div>
          </div>
          <div class="chat-row user">
            <div class="chat-icon">👤</div>
            <div class="chat-bubble user">
              山田 太郎
              <div class="chat-time" style="text-align:right;">14:33</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</div>
"""

# ═══════════════════════════════════════════════════════════════════════════════
# 08 — Settings
# ═══════════════════════════════════════════════════════════════════════════════

SETTINGS_CSS = """
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.theme-card {
  border-radius: var(--r-md);
  border: 2px solid var(--border);
  cursor: pointer;
  overflow: hidden;
}
.theme-card.selected { border-color: var(--primary); }
.theme-preview {
  display: flex; height: 56px;
  border-bottom: 1px solid var(--border); overflow: hidden;
}
.theme-preview-sidebar {
  width: 28px; flex-shrink: 0;
  display: flex; flex-direction: column;
  align-items: center; padding-top: 8px; gap: 3px;
}
.theme-preview-content {
  flex: 1; padding: 8px 10px;
}
.theme-name-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; background: var(--surface);
}
.theme-name { font-size: var(--font-sm); color: var(--text); }
.theme-name.selected { font-weight: 600; }
.theme-toggle { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:2px 4px; border-radius:var(--r-sm); font-size:14px; }
"""

# Theme preview data: (name, sidebar_bg, surface_bg, accent, is_selected, variant_toggle)
THEMES = [
    ("Default",    "#1e2130", "#f8f7f5", "#0d9488", True,  "🌙"),
    ("GitHub",     "#24292f", "#ffffff", "#0969da", False, None),
    ("Solarized",  "#073642", "#fdf6e3", "#2aa198", False, None),
    ("Dracula",    "#21222c", "#282a36", "#bd93f9", False, None),
    ("Monokai",    "#1e1e1c", "#272822", "#a6e22e", False, None),
    ("Ubuntu",     "#2c001e", "#faf9f7", "#e95420", False, None),
]

def theme_card(name, sidebar, surface, accent, selected, variant_toggle):
    sel_cls = " selected" if selected else ""
    name_cls = " selected" if selected else ""
    toggle_html = ""
    if selected and variant_toggle:
        toggle_html = f'<button class="theme-toggle">{variant_toggle}</button>'
    return f"""
  <div class="theme-card{sel_cls}">
    <div class="theme-preview">
      <div class="theme-preview-sidebar" style="background:{sidebar};">
        <span style="width:14px;height:2px;border-radius:2px;background:{accent};opacity:.9;display:block;"></span>
        <span style="width:14px;height:2px;border-radius:2px;background:{accent};opacity:.35;display:block;"></span>
        <span style="width:14px;height:2px;border-radius:2px;background:{accent};opacity:.35;display:block;"></span>
      </div>
      <div class="theme-preview-content" style="background:{surface};">
        <div style="width:60%;height:3px;border-radius:2px;background:{accent};margin-bottom:6px;"></div>
        <div style="width:100%;height:2px;border-radius:2px;background:{sidebar};opacity:.12;margin-bottom:3px;"></div>
        <div style="width:75%;height:2px;border-radius:2px;background:{sidebar};opacity:.12;"></div>
      </div>
    </div>
    <div class="theme-name-row">
      <span class="theme-name{name_cls}">{name}</span>
      {toggle_html}
    </div>
  </div>"""

SETTINGS_BODY = f"""
<h1 class="page-title">設定</h1>

<div class="card">
  <h2 style="font-size:var(--font-lg);font-weight:700;margin-bottom:16px;color:var(--text-strong);">
    管理画面テーマ
  </h2>
  <!-- テーマカードグリッド: auto-fill minmax(120px) -->
  <!-- 選択中: border: 2px solid primary / テーマ名 font-weight:600 / ライトダーク切替ボタン表示 -->
  <div class="theme-grid">
    {"".join(theme_card(*t) for t in THEMES)}
  </div>
</div>
"""

# ═══════════════════════════════════════════════════════════════════════════════
# tokens.css
# ═══════════════════════════════════════════════════════════════════════════════

TOKENS_FILE = f"""\
/*
 * NeNe Concierge Admin — Design Tokens (Default Light)
 * Generated: 2026-05-28
 *
 * These are resolved hex/oklch values for Claude Design reference.
 * Source: public_html/admin/index.html :root block
 *
 * Additional themes: default-dark, github-light, github-dark,
 *   solarized-light, solarized-dark, dracula-dark, monokai-dark, ubuntu-light, ubuntu-dark
 */
{TOKENS_CSS}
/*
 * ── Adapter brand colors (not in theme tokens, hardcoded per component) ──────
 * http     bg:#e0f2fe  color:#0369a1
 * email    bg:#fef3c7  color:#92400e
 * slack    bg:#f0fdf4  color:#166534
 * chatwork bg:#fdf4ff  color:#7e22ce
 *
 * ── Outcome badge colors (SessionsPage) ──────────────────────────────────────
 * active    bg:oklch(96% 0.05 220) fg:oklch(38% 0.15 220)
 * completed bg:oklch(96% 0.04 150) fg:oklch(40% 0.14 150)
 * dropped   bg:oklch(97% 0.04 25)  fg:oklch(40% 0.14 25)
 * converted bg:oklch(96% 0.06 290) fg:oklch(38% 0.18 290)
 *
 * ── Status badge colors (ActionLogsPage) ─────────────────────────────────────
 * success  bg:oklch(96% 0.04 150)  color:oklch(40% 0.14 150)
 * failure  bg:oklch(97% 0.04 25)   color:oklch(40% 0.14 25)
 */
"""

# ═══════════════════════════════════════════════════════════════════════════════
# Write files
# ═══════════════════════════════════════════════════════════════════════════════

files = {
    "00_README.md":       README,
    "tokens.css":         TOKENS_FILE,
    "01_dashboard.html":  page_wrap("ダッシュボード",          "dashboard", DASHBOARD_BODY,  DASHBOARD_CSS),
    "02_scenarios.html":  page_wrap("シナリオ",               "flow",      SCENARIOS_BODY),
    "03_appearance.html": page_wrap("外観設定",               "palette",   APPEARANCE_BODY,  APPEARANCE_CSS),
    "04_credentials.html":page_wrap("アクションクレデンシャル","key",       CREDENTIALS_BODY, CREDENTIALS_CSS),
    "05_action-logs.html":page_wrap("アクションログ",          "logs",      ACTIONLOGS_BODY,  ACTIONLOGS_CSS),
    "06_sessions.html":   page_wrap("セッション",             "sessions",  SESSIONS_BODY,    SESSIONS_CSS),
    "07_settings.html":   page_wrap("設定",                  "settings",  SETTINGS_BODY,    SETTINGS_CSS),
}

for fname, content in files.items():
    path = os.path.join(OUT, fname)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote {fname}")

# ZIP
zip_path = os.path.join(OUT, "admin-pages-design-handoff.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for fname in files:
        zf.write(os.path.join(OUT, fname), fname)

print(f"\nZIP: {zip_path}")
print(f"Size: {os.path.getsize(zip_path):,} bytes")

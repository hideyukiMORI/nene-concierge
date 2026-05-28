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

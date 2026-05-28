/**
 * NeNe Concierge Admin — Design Token References
 *
 * CSS カスタムプロパティ名の定数。実際の値は
 * public_html/admin/index.html の :root / [data-nca-theme='*'] で定義。
 *
 * v2 (2026-05-28): エディタ用に node/glass/minimap/dock トークン追加
 */
export const T = {
    // ── Primary ──────────────────────────────────────────────────────────────
    primary:        'var(--nca-color-primary)',
    primaryHover:   'var(--nca-color-primary-hover)',
    primaryLight:   'var(--nca-color-primary-light)',
    primaryBorder:  'var(--nca-color-primary-border)',
    primaryMuted:   'var(--nca-color-primary-muted)',
    primaryText:    'var(--nca-color-primary-text)',
    primaryBg:      'var(--nca-color-primary-bg)',
    primaryFg:      'var(--nca-color-primary-fg)',
    primaryTint:    'var(--nca-color-primary-tint)',
    primaryRing:    'var(--nca-color-primary-ring)',

    // ── Danger ───────────────────────────────────────────────────────────────
    danger:         'var(--nca-color-danger)',
    dangerBg:       'var(--nca-color-danger-bg)',
    dangerBorder:   'var(--nca-color-danger-border)',
    dangerText:     'var(--nca-color-danger-text)',
    dangerFg:       'var(--nca-color-danger-fg)',

    // ── Success ──────────────────────────────────────────────────────────────
    successBg:      'var(--nca-color-success-bg)',
    successBorder:  'var(--nca-color-success-border)',
    successText:    'var(--nca-color-success-text)',
    successFg:      'var(--nca-color-success-fg)',
    successPillBg:  'var(--nca-color-success-pill-bg)',

    // ── Surface & Background ─────────────────────────────────────────────────
    bg:             'var(--nca-color-bg)',
    surface:        'var(--nca-color-surface)',
    surfaceAlt:     'var(--nca-color-surface-alt)',

    // ── Sidebar ──────────────────────────────────────────────────────────────
    sidebar:        'var(--nca-color-sidebar)',
    sidebarHover:   'var(--nca-color-sidebar-hover)',
    sidebarActive:  'var(--nca-color-sidebar-active)',
    sidebarBorder:  'var(--nca-color-sidebar-border)',
    sidebarText:    'var(--nca-color-sidebar-text)',
    sidebarMuted:   'var(--nca-color-sidebar-muted)',
    sidebarTitle:   'var(--nca-color-sidebar-title)',

    // ── Text ─────────────────────────────────────────────────────────────────
    text:           'var(--nca-color-text)',
    textStrong:     'var(--nca-color-text-strong)',
    textMuted:      'var(--nca-color-text-muted)',
    textFaint:      'var(--nca-color-text-faint)',

    // ── Border ───────────────────────────────────────────────────────────────
    border:         'var(--nca-color-border)',
    borderInput:    'var(--nca-color-border-input)',
    borderLight:    'var(--nca-color-border-light)',

    // ── Table ────────────────────────────────────────────────────────────────
    tableHeader:    'var(--nca-color-table-header)',
    tableRow:       'var(--nca-color-table-row)',
    surfaceHover:   'var(--nca-color-surface-hover)',

    // ── Badge ────────────────────────────────────────────────────────────────
    badgeDraftBg:    'var(--nca-badge-draft-bg)',
    badgeDraftColor: 'var(--nca-badge-draft-color)',
    badgePubBg:      'var(--nca-badge-pub-bg)',
    badgePubColor:   'var(--nca-badge-pub-color)',
    badgeArchBg:     'var(--nca-badge-arch-bg)',
    badgeArchColor:  'var(--nca-badge-arch-color)',

    // ── Border radius ────────────────────────────────────────────────────────
    radiusSm:   'var(--nca-radius-sm)',
    radiusMd:   'var(--nca-radius-md)',
    radiusLg:   'var(--nca-radius-lg)',
    radiusXl:   'var(--nca-radius-xl)',
    radiusNode: 'var(--nca-radius-node)',

    // ── Font size ────────────────────────────────────────────────────────────
    fontXs:   'var(--nca-font-xs)',
    fontSm:   'var(--nca-font-sm)',
    fontBase: 'var(--nca-font-base)',
    fontMd:   'var(--nca-font-md)',
    fontLg:   'var(--nca-font-lg)',
    fontXl:   'var(--nca-font-xl)',
    font2xl:  'var(--nca-font-2xl)',

    // ── Sidebar width ────────────────────────────────────────────────────────
    sidebarWidth:     'var(--nca-sidebar-width)',
    sidebarWidthSlim: 'var(--nca-sidebar-width-slim)',
    editorHeaderH:    'var(--nca-editor-header-height)',
    editorDrawerW:    'var(--nca-editor-drawer-width)',

    // ── Shadow ───────────────────────────────────────────────────────────────
    shadowCard:     'var(--nca-shadow-card)',
    shadowElevated: 'var(--nca-shadow-elevated)',
    shadowFocus:    'var(--nca-shadow-focus)',

    // ── Glass / Dock / Minimap (v2 editor) ───────────────────────────────────
    glassBg:      'var(--nca-glass-bg)',
    glassDockBg:  'var(--nca-glass-dock-bg)',
    minimapBg:    'var(--nca-minimap-bg)',

    // ── Canvas (v2 editor) ───────────────────────────────────────────────────
    canvasBg:   'var(--nca-canvas-bg)',
    canvasDot:  'var(--nca-canvas-dot)',
    edgeStroke: 'var(--nca-edge-stroke)',

    // ── Control heights ──────────────────────────────────────────────────────
    controlHeight:   'var(--nca-control-height)',
    controlHeightSm: 'var(--nca-control-height-sm)',
    controlHeightXs: 'var(--nca-control-height-xs)',

    // ── Font mono ─────────────────────────────────────────────────────────────
    fontMono: 'var(--nca-font-mono)',

    // ── Adapter tag accents ───────────────────────────────────────────────────
    adapterHttp:        'var(--nca-adapter-http)',
    adapterHttpBg:      'var(--nca-adapter-http-bg)',
    adapterEmail:       'var(--nca-adapter-email)',
    adapterEmailBg:     'var(--nca-adapter-email-bg)',
    adapterSlack:       'var(--nca-adapter-slack)',
    adapterSlackBg:     'var(--nca-adapter-slack-bg)',
    adapterChatwork:    'var(--nca-adapter-chatwork)',
    adapterChatworkBg:  'var(--nca-adapter-chatwork-bg)',

    // ── Motion ───────────────────────────────────────────────────────────────
    transitionFast:   'var(--nca-transition-fast)',
    transitionNormal: 'var(--nca-transition-normal)',
} as const;

export type ThemeKey = keyof typeof T;

// ── Node tokens (v2 editor) ──────────────────────────────────────────────────
// 4 ノードタイプ × { stripe, body, edge, chip, chipEdge }
// CSS 変数で各テーマに対応 — テーマ切替時に自動同期
export const NODE_TOKENS = {
    message: {
        stripe:   'var(--nca-node-message-stripe)',
        body:     'var(--nca-node-message-body)',
        edge:     'var(--nca-node-message-edge)',
        chip:     'var(--nca-node-message-chip)',
        chipEdge: 'var(--nca-node-message-chip-edge)',
    },
    condition: {
        stripe:   'var(--nca-node-condition-stripe)',
        body:     'var(--nca-node-condition-body)',
        edge:     'var(--nca-node-condition-edge)',
        chip:     'var(--nca-node-condition-chip)',
        chipEdge: 'var(--nca-node-condition-chip-edge)',
    },
    action: {
        stripe:   'var(--nca-node-action-stripe)',
        body:     'var(--nca-node-action-body)',
        edge:     'var(--nca-node-action-edge)',
        chip:     'var(--nca-node-action-chip)',
        chipEdge: 'var(--nca-node-action-chip-edge)',
    },
    end: {
        stripe:   'var(--nca-node-end-stripe)',
        body:     'var(--nca-node-end-body)',
        edge:     'var(--nca-node-end-edge)',
        chip:     'var(--nca-node-end-chip)',
        chipEdge: 'var(--nca-node-end-chip-edge)',
    },
} as const;

/**
 * NeNe Concierge Admin — Design Token References
 *
 * CSS カスタムプロパティ名の定数。実際の値は
 * public_html/admin/index.html の :root ブロックで定義されています。
 * テーマを変更するには index.html の :root を編集してください。
 *
 * nene-corpus の cssVars パターンに準拠（--nca-* 名前空間）。
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
    /** primary ボタン/バッジの前景色 — 明るいテーマでは暗色に上書きされる */
    primaryFg:      'var(--nca-color-primary-fg)',

    // ── Danger ───────────────────────────────────────────────────────────────
    danger:         'var(--nca-color-danger)',
    dangerBg:       'var(--nca-color-danger-bg)',
    dangerBorder:   'var(--nca-color-danger-border)',
    dangerText:     'var(--nca-color-danger-text)',

    // ── Success ──────────────────────────────────────────────────────────────
    successBg:      'var(--nca-color-success-bg)',
    successBorder:  'var(--nca-color-success-border)',
    successText:    'var(--nca-color-success-text)',

    // ── Surface & Background ─────────────────────────────────────────────────
    bg:             'var(--nca-color-bg)',
    surface:        'var(--nca-color-surface)',

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
    radiusSm: 'var(--nca-radius-sm)',
    radiusMd: 'var(--nca-radius-md)',
    radiusLg: 'var(--nca-radius-lg)',
    radiusXl: 'var(--nca-radius-xl)',

    // ── Font size ────────────────────────────────────────────────────────────
    fontXs:   'var(--nca-font-xs)',
    fontSm:   'var(--nca-font-sm)',
    fontBase: 'var(--nca-font-base)',
    fontMd:   'var(--nca-font-md)',
    fontLg:   'var(--nca-font-lg)',
    fontXl:   'var(--nca-font-xl)',
    font2xl:  'var(--nca-font-2xl)',

    // ── Sidebar width ────────────────────────────────────────────────────────
    sidebarWidth: 'var(--nca-sidebar-width)',

    // ── Shadow ───────────────────────────────────────────────────────────────
    shadowCard:  'var(--nca-shadow-card)',
    shadowFocus: 'var(--nca-shadow-focus)',

    // ── Control heights ──────────────────────────────────────────────────────
    // :root の --nca-control-height* を変えるだけでサイト全体に反映される
    controlHeight:   'var(--nca-control-height)',
    controlHeightSm: 'var(--nca-control-height-sm)',
    controlHeightXs: 'var(--nca-control-height-xs)',

    // ── Motion ───────────────────────────────────────────────────────────────
    transitionFast:   'var(--nca-transition-fast)',
    transitionNormal: 'var(--nca-transition-normal)',
} as const;

export type ThemeKey = keyof typeof T;

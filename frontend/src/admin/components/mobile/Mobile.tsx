/**
 * NeNe Concierge Admin — Mobile UI Primitives (Issue #81)
 *
 * モバイル幅 (< 640px) で使う再利用可能 UI コンポーネント群。
 * デザイン参照: docs/designs/mobile_2026-05-28_01/redesign-final/_mobile.css
 *
 * 提供:
 *   MobileHeader / BottomSheet / FAB
 *   CardList / ListItem / SwipeRow
 *   Pill (mobile 20px 高)
 *   FilterChips / Chip
 *   KpiGrid / KpiCard
 *   AlertCard
 *   Skeleton
 *   MobileSectionHead
 *   PullToRefreshHint
 *   MetaGrid
 */

import { useEffect, useRef } from 'react';
import { T } from '../../theme.js';

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

// ── MobileHeader ─────────────────────────────────────────────────────────────
// sticky 上部ヘッダー (戻る / タイトル + sub / 末尾アクション)

export function MobileHeader({
    title, subtitle, onBack, trailing, leading,
}: {
    title:     string;
    subtitle?: string;
    onBack?:   () => void;
    leading?:  React.ReactNode;
    trailing?: React.ReactNode;
}) {
    return (
        <header style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px 10px',
            paddingTop: 'calc(8px + env(safe-area-inset-top))',
            background: T.bg,
            borderBottom: `1px solid ${T.borderLight}`,
            position: 'sticky', top: 0, zIndex: 30,
        }}>
            {onBack && (
                <button onClick={onBack}
                    aria-label="Back"
                    style={mIconBtnStyle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
            )}
            {leading}
            <div style={{
                flex: 1, minWidth: 0,
                fontSize: 17, fontWeight: 700,
                color: T.textStrong, letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: subtitle ? 1.15 : undefined,
            }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title}
                </span>
                {subtitle && (
                    <span style={{
                        display: 'block',
                        fontSize: 11, fontWeight: 400,
                        fontFamily: MONO, color: T.textMuted,
                        letterSpacing: '0.04em', marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{subtitle}</span>
                )}
            </div>
            {trailing}
        </header>
    );
}

const mIconBtnStyle: React.CSSProperties = {
    width: 38, height: 38, flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: T.radiusMd,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: T.text,
};
export function MobileIconBtn({ onClick, ariaLabel, children }: {
    onClick?:   () => void;
    ariaLabel:  string;
    children:   React.ReactNode;
}) {
    return (
        <button onClick={onClick} aria-label={ariaLabel}
            style={mIconBtnStyle}
            onTouchStart={e => { e.currentTarget.style.background = T.surfaceAlt; }}
            onTouchEnd={e   => { e.currentTarget.style.background = 'transparent'; }}>
            {children}
        </button>
    );
}

// ── BottomSheet ──────────────────────────────────────────────────────────────
// 下からスライドアップする全幅シート。open 状態は親が管理。
// open=true でレンダリング + body スクロールロック。

export function BottomSheet({
    open, onClose, title, subtitle, trailing, children, height,
}: {
    open:      boolean;
    onClose:   () => void;
    title?:    string;
    subtitle?: string;
    trailing?: React.ReactNode;
    children:  React.ReactNode;
    height?:   string | number;  // default: max-content (max 86vh)
}) {
    useEffect(() => {
        if (!open) return;
        document.body.classList.add('nca-no-scroll');
        return () => { document.body.classList.remove('nca-no-scroll'); };
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                aria-hidden={!open}
                style={{
                    position: 'fixed', inset: 0, zIndex: 70,
                    background: 'rgba(15,23,42,.40)',
                    backdropFilter: 'blur(2px)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'opacity 220ms ease',
                }}/>
            {/* Sheet */}
            <div
                role="dialog" aria-modal="true"
                aria-hidden={!open}
                style={{
                    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 71,
                    background: T.surface,
                    borderRadius: '18px 18px 0 0',
                    maxHeight: '86vh',
                    height: height,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 -20px 60px -20px rgba(15,23,42,.30)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
                    pointerEvents: open ? 'auto' : 'none',
                }}>
                {/* Drag handle */}
                <div style={{
                    width: 36, height: 4, borderRadius: 99,
                    background: T.borderLight,
                    margin: '8px auto 4px', flexShrink: 0,
                }}/>
                {/* Head */}
                {(title || trailing) && (
                    <div style={{
                        padding: '8px 18px 12px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderBottom: `1px solid ${T.borderLight}`,
                        flexShrink: 0,
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {title && (
                                <h2 style={{
                                    fontSize: 17, fontWeight: 700, margin: 0,
                                    color: T.textStrong, letterSpacing: '-0.01em',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{title}</h2>
                            )}
                            {subtitle && (
                                <div style={{
                                    fontFamily: MONO, fontSize: 11,
                                    color: T.textMuted, marginTop: 1,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{subtitle}</div>
                            )}
                        </div>
                        {trailing}
                        <button onClick={onClose} aria-label="Close"
                            style={{
                                width: 32, height: 32, borderRadius: 99,
                                background: T.surfaceAlt, color: T.textMuted,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, border: 'none', cursor: 'pointer',
                            }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                )}
                {/* Body */}
                <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '14px 18px 32px',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {children}
                </div>
            </div>
        </>
    );
}

// ── FAB (Floating Action Button) ─────────────────────────────────────────────

export function FAB({
    onClick, ariaLabel, children, color,
}: {
    onClick:    () => void;
    ariaLabel:  string;
    children:   React.ReactNode;
    color?:     string;   // override (defaults to primary)
}) {
    const bg = color ?? T.primary;
    return (
        <button onClick={onClick} aria-label={ariaLabel} title={ariaLabel}
            style={{
                position: 'fixed', right: 16,
                bottom: 'calc(16px + env(safe-area-inset-bottom))',
                width: 56, height: 56, borderRadius: 99,
                background: bg, color: T.primaryFg,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 10px 24px -6px ${T.primaryTint}, 0 10px 24px -6px rgba(15,23,42,.25)`,
                zIndex: 40,
            }}>
            {children}
        </button>
    );
}

// ── CardList + ListItem ──────────────────────────────────────────────────────

export function CardList({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: T.surface,
            margin: '0 12px 12px',
            borderRadius: T.radiusLg,
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
            ...style,
        }}>{children}</div>
    );
}

export function ListItem({
    icon, title, meta, trailing, failure, onClick, last,
}: {
    icon?:     React.ReactNode;
    title:     React.ReactNode;
    meta?:     React.ReactNode;
    trailing?: React.ReactNode;
    failure?:  boolean;
    last?:     boolean;
    onClick?:  () => void;
}) {
    const interactive = !!onClick;
    return (
        <div
            onClick={onClick}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: failure ? '12px 14px 12px 11px' : '12px 14px',
                borderLeft: failure ? `3px solid ${T.dangerFg}` : undefined,
                borderBottom: last ? 'none' : `1px solid ${T.borderLight}`,
                background: T.surface,
                position: 'relative',
                cursor: interactive ? 'pointer' : undefined,
                WebkitTapHighlightColor: 'transparent',
            }}
            onTouchStart={interactive ? (e => { e.currentTarget.style.background = T.surfaceHover; }) : undefined}
            onTouchEnd={interactive ? (e => { e.currentTarget.style.background = T.surface; }) : undefined}>
            {icon !== undefined && (
                <div style={{
                    width: 36, height: 36, borderRadius: T.radiusMd,
                    background: T.surfaceAlt,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontFamily: MONO,
                    fontWeight: 700, fontSize: 12,
                    color: T.textMuted,
                }}>{icon}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 15, fontWeight: 600, color: T.textStrong,
                    letterSpacing: '-0.005em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{title}</div>
                {meta && (
                    <div style={{
                        fontSize: 12, color: T.textMuted,
                        fontFamily: MONO, marginTop: 2,
                        display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
                    }}>{meta}</div>
                )}
            </div>
            {trailing !== undefined ? trailing : (interactive ? (
                <span style={{ color: T.textFaint, flexShrink: 0, display: 'inline-flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </span>
            ) : null)}
        </div>
    );
}

// Meta separator dot
export function MetaDot() {
    return <span style={{ color: T.textFaint }}>·</span>;
}

// ── Pill (mobile 20px 高 — Layout.tsx の StatusPill より小型) ──────────────────

export type PillVariant = 'success' | 'failure' | 'active' | 'draft' | 'archived' | 'neutral';
const PILL_STYLES: Record<PillVariant, React.CSSProperties> = {
    success:  { background: T.successPillBg, color: T.successFg },
    failure:  { background: T.dangerBg, color: T.dangerFg, border: `1px solid ${T.dangerBorder}` },
    active:   { background: T.primaryTint, color: T.primary },
    draft:    { background: T.badgeDraftBg, color: T.badgeDraftColor },
    archived: { background: T.badgeArchBg, color: T.badgeArchColor },
    neutral:  { background: T.surfaceAlt, color: T.textMuted },
};
export function Pill({ variant, label, dot = true }: { variant: PillVariant; label: string; dot?: boolean }) {
    const s = PILL_STYLES[variant] ?? PILL_STYLES.neutral;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            height: 20, padding: '0 8px',
            borderRadius: T.radiusXl,
            fontFamily: MONO, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            ...s,
        }}>
            {dot && <span style={{ width: 5, height: 5, borderRadius: 99, background: 'currentColor' }}/>}
            {label}
        </span>
    );
}

// ── FilterChips ──────────────────────────────────────────────────────────────
// 横スクロール sticky フィルター。top は親側で調整 (mobile header 高さ依存)

export function FilterChips({ children, stickyTop, style }: {
    children:   React.ReactNode;
    stickyTop?: number | string;
    style?:     React.CSSProperties;
}) {
    return (
        <div className="nca-h-scroll" style={{
            display: 'flex', gap: 6, alignItems: 'center',
            padding: '8px 14px',
            background: T.bg,
            borderBottom: `1px solid ${T.borderLight}`,
            position: 'sticky', top: stickyTop ?? 0, zIndex: 25,
            overflowX: 'auto',
            ...style,
        }}>{children}</div>
    );
}

export function Chip({
    active, danger, onClick, children,
}: {
    active?: boolean;
    danger?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    const variant: React.CSSProperties =
        danger ? { background: T.danger, color: '#fff', borderColor: T.danger } :
        active ? { background: T.textStrong, color: T.surface, borderColor: T.textStrong } :
                 { background: T.surface, color: T.text, borderColor: T.border };
    return (
        <button onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 30, padding: '0 12px', flexShrink: 0,
                borderRadius: 99,
                border: '1px solid',
                fontSize: 13, fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                ...variant,
            }}>
            {children}
        </button>
    );
}

// ── KpiGrid + KpiCard ────────────────────────────────────────────────────────

export function KpiGrid({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            padding: '0 12px 12px',
            ...style,
        }}>{children}</div>
    );
}

export function KpiCard({
    label, value, unit, meta, valueColor, alert,
}: {
    label:       string;
    value:       React.ReactNode;
    unit?:       string;
    meta?:       string;
    valueColor?: 'danger' | 'success' | 'accent' | 'default';
    alert?:      boolean;
}) {
    const valColor =
        valueColor === 'danger'  ? T.dangerFg :
        valueColor === 'success' ? T.successFg :
        valueColor === 'accent'  ? T.primary :
                                   T.textStrong;
    return (
        <div style={{
            background: alert ? T.dangerBg : T.surface,
            border: `1px solid ${alert ? T.dangerBorder : T.border}`,
            borderRadius: T.radiusMd,
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
        }}>
            <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: T.textMuted,
            }}>{label}</span>
            <div style={{
                fontSize: 24, fontWeight: 700, lineHeight: 1,
                color: valColor, letterSpacing: '-0.02em',
                fontFeatureSettings: '"tnum"', marginTop: 2,
                display: 'flex', alignItems: 'baseline', gap: 2,
            }}>
                {value}
                {unit && <span style={{ fontSize: 12, fontWeight: 500, color: T.textMuted }}>{unit}</span>}
            </div>
            {meta && (
                <span style={{
                    fontFamily: MONO, fontSize: 10, color: T.textFaint,
                }}>{meta}</span>
            )}
        </div>
    );
}

// ── AlertCard ────────────────────────────────────────────────────────────────

export function AlertCard({
    icon, title, desc, onClick,
}: {
    icon?:    React.ReactNode;
    title:    string;
    desc?:    string;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            style={{
                margin: '4px 12px 14px',
                padding: '12px 14px',
                background: T.dangerBg,
                border: `1px solid ${T.dangerBorder}`,
                borderRadius: T.radiusMd,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                cursor: onClick ? 'pointer' : undefined,
                WebkitTapHighlightColor: 'transparent',
            }}>
            <span style={{
                width: 24, height: 24, flexShrink: 0, borderRadius: 99,
                background: T.dangerFg, color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontWeight: 700, fontSize: 14,
            }}>{icon ?? '!'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.dangerText }}>{title}</div>
                {desc && (
                    <div style={{
                        fontSize: 11, fontFamily: MONO,
                        color: T.dangerText, opacity: 0.85, marginTop: 2,
                    }}>{desc}</div>
                )}
            </div>
        </div>
    );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
// クラスで shimmer animation を当てる (keyframes は index.html 側)

export function Skeleton({
    width, height, style, radius,
}: {
    width?:  number | string;
    height?: number | string;
    radius?: number | string;
    style?:  React.CSSProperties;
}) {
    return (
        <div className="nca-skeleton" style={{
            width: width ?? '100%',
            height: height ?? 12,
            borderRadius: radius,
            ...style,
        }}/>
    );
}

export function SkeletonListItem() {
    return (
        <div style={{
            display: 'flex', gap: 12, padding: '12px 14px',
            borderBottom: `1px solid ${T.borderLight}`,
        }}>
            <Skeleton width={36} height={36} radius={T.radiusMd} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                <Skeleton width="80%" height={10} />
                <Skeleton width="50%" height={8} />
            </div>
        </div>
    );
}

// ── MobileSectionHead ────────────────────────────────────────────────────────

export function MobileSectionHead({
    label, action,
}: {
    label:   string;
    action?: React.ReactNode;
}) {
    return (
        <div style={{
            padding: '16px 14px 8px',
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
            <span style={{
                fontFamily: MONO, fontSize: 10,
                fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
                color: T.textFaint,
            }}>{label}</span>
            {action}
        </div>
    );
}

// ── PullToRefreshHint (簡易: 上端に手動表示) ─────────────────────────────────

export function PullToRefreshHint({ refreshing, label }: { refreshing: boolean; label?: string }) {
    if (!refreshing) return null;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7, height: 36,
            fontFamily: MONO, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.10em', textTransform: 'uppercase',
            color: T.textFaint,
        }}>
            <span className="nca-ptr-spinner"/>
            <span>{label ?? 'Refreshing'}</span>
        </div>
    );
}

// ── MetaGrid (key/value 縦並び — 100px ラベル列 / 1fr 値列) ────────────────────

export function MetaGrid({ rows }: { rows: Array<{ label: string; value: React.ReactNode }> }) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '100px 1fr',
            gap: '8px 14px', fontSize: 13, marginBottom: 16,
        }}>
            {rows.map((r, i) => (
                <span key={i} style={{ display: 'contents' }}>
                    <span style={{
                        fontFamily: MONO, fontSize: 10,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: T.textMuted, alignSelf: 'center',
                    }}>{r.label}</span>
                    <span style={{ color: T.textStrong, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.value}
                    </span>
                </span>
            ))}
        </div>
    );
}

// ── SwipeRow ─────────────────────────────────────────────────────────────────
// 左スワイプで右側にアクション (削除など) を露出する。
// touch / pointer イベントで translateX を変動させ、しきい値超で固定。

export function SwipeRow({
    children, actionLabel, actionColor, onAction, revealWidth = 72,
}: {
    children:     React.ReactNode;
    actionLabel:  string;
    actionColor?: string;
    onAction:     () => void;
    revealWidth?: number;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const rowRef  = useRef<HTMLDivElement>(null);
    const stateRef = useRef({ startX: 0, dx: 0, open: false, dragging: false });

    function setTransform(x: number, withTransition: boolean) {
        const row = rowRef.current;
        if (!row) return;
        row.style.transition = withTransition ? 'transform 200ms ease' : 'none';
        row.style.transform  = `translateX(${x}px)`;
    }

    function onPointerDown(e: React.PointerEvent) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stateRef.current.startX   = e.clientX;
        stateRef.current.dragging = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: React.PointerEvent) {
        const s = stateRef.current;
        if (!s.dragging) return;
        const dxRaw = e.clientX - s.startX + (s.open ? -revealWidth : 0);
        // 左スワイプのみ (右にはオープンから 0 まで戻すのを許可)
        const dx = Math.min(0, Math.max(-revealWidth, dxRaw));
        s.dx = dx;
        setTransform(dx, false);
    }

    function onPointerUp() {
        const s = stateRef.current;
        if (!s.dragging) return;
        s.dragging = false;
        const open = s.dx < -revealWidth / 2;
        s.open     = open;
        setTransform(open ? -revealWidth : 0, true);
    }

    return (
        <div ref={wrapRef} style={{
            position: 'relative', overflow: 'hidden',
            background: actionColor ?? T.dangerFg,
        }}>
            {/* Revealed action background */}
            <button
                onClick={() => { stateRef.current.open = false; setTransform(0, true); onAction(); }}
                aria-label={actionLabel}
                style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: revealWidth,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 2,
                    color: '#fff', fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                </svg>
                {actionLabel}
            </button>
            {/* Foreground row (slides) */}
            <div ref={rowRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{ touchAction: 'pan-y', willChange: 'transform' }}>
                {children}
            </div>
        </div>
    );
}

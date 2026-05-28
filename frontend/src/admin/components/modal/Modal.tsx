/**
 * NeNe Concierge Admin — 共通 Modal コンポーネント (Issue #103)
 *
 * 要件: docs/designs/modal_2026-05-28_01/redesign-final/showcase/Modals.html
 *
 * PC (desktop/tablet): 中央モーダル (max-width 420px) + backdrop
 * Mobile (<640px): 下からシート (action sheet) + backdrop
 *
 * tone (icon + 主要ボタン色): danger / warning / primary
 *
 * 5 パターンを 1 コンポーネントで:
 *   1. Simple delete         — { tone:'danger' }
 *   2. Verified delete       — { tone:'danger', confirmText:'<name>' }
 *   3. (Unsaved changes は 3 ボタンなので別 API — 今回は実装スコープ外)
 *   4. Bulk delete           — { count, metaInfo, footerNote }
 *   5. Session terminate     — { tone:'primary' }
 *
 * 単一ボタン alert は ConfirmModal を kind='alert' で描画する内部実装。
 */

import { useEffect, useRef, useState } from 'react';
import { T } from '../../theme.js';
import { useBreakpoint } from '../Layout.js';
import { useTranslation } from '../../i18n/index.js';

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

export type ModalTone = 'danger' | 'warning' | 'primary';

export interface ConfirmOptions {
    title:           string;
    description?:    React.ReactNode;
    tone?:           ModalTone;                  // default 'danger'
    confirmLabel?:   string;
    cancelLabel?:    string;
    icon?:           React.ReactNode;            // override icon
    /** Verified delete: 入力値がこの文字列に一致するまで confirm 不可 */
    confirmText?:    string;
    confirmTextHint?: React.ReactNode;
    /** Bulk delete: 件数強調 + メタ情報 */
    count?:          number;
    metaInfo?:       React.ReactNode;
    /** Footer 左端の補足 (e.g., undo 可能 (30s)) */
    footerNote?:     React.ReactNode;
    /** 追加ボディ slot (modal-warn など) */
    body?:           React.ReactNode;
}

export interface AlertOptions {
    title:        string;
    description?: React.ReactNode;
    tone?:        ModalTone;
    okLabel?:     string;
    icon?:        React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Modal state
// ─────────────────────────────────────────────────────────────────────────────

export type ModalState =
    | (ConfirmOptions & { id: string; kind: 'confirm'; resolve: (v: boolean) => void })
    | (AlertOptions   & { id: string; kind: 'alert';   resolve: () => void });

// ─────────────────────────────────────────────────────────────────────────────
// Icons (defaults per tone)
// ─────────────────────────────────────────────────────────────────────────────

const IconTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
    </svg>
);
const IconAlertTri = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);
const IconInfo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);

function defaultIcon(tone: ModalTone, kind: 'confirm' | 'alert'): React.ReactNode {
    if (kind === 'alert') return <IconAlertTri/>;
    if (tone === 'primary') return <IconInfo/>;
    if (tone === 'warning') return <IconAlertTri/>;
    return <IconTrash/>;  // danger default
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal renderer — PC 中央モーダル or モバイル下シート
// ─────────────────────────────────────────────────────────────────────────────

export function Modal({ state }: { state: ModalState }) {
    const { t } = useTranslation();
    const bp = useBreakpoint();
    const isMobile = bp === 'mobile';
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const ref      = useRef<HTMLDivElement>(null);

    // open animation
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // 入力フォーカス
    useEffect(() => {
        if (state.kind === 'confirm' && state.confirmText) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [state]);

    // ESC で cancel
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                if (state.kind === 'confirm') state.resolve(false);
                else state.resolve();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [state]);

    // body スクロールロック
    useEffect(() => {
        document.body.classList.add('nca-no-scroll');
        return () => { document.body.classList.remove('nca-no-scroll'); };
    }, []);

    const tone: ModalTone = state.tone ?? 'danger';
    const icon = state.icon ?? defaultIcon(tone, state.kind);

    // 確認文字列マッチング (verified-delete)
    const needsTextMatch = state.kind === 'confirm' && !!state.confirmText;
    const matched        = !needsTextMatch || text === state.confirmText;
    const confirmEnabled = matched;

    function handleConfirm() {
        if (state.kind === 'confirm') {
            if (!confirmEnabled) return;
            state.resolve(true);
        } else {
            state.resolve();
        }
    }
    function handleCancel() {
        if (state.kind === 'confirm') state.resolve(false);
        else state.resolve();
    }

    // ── 色トークンマッピング ──
    const iconBg  = tone === 'primary' ? T.primaryTint : tone === 'warning' ? T.surfaceAlt : T.dangerBg;
    const iconFg  = tone === 'primary' ? T.primary     : tone === 'warning' ? T.text       : T.dangerFg;
    const iconBd  = tone === 'primary' ? T.primaryBorder : tone === 'warning' ? T.borderInput : T.dangerBorder;
    const confirmBg = tone === 'primary' ? T.primary   : tone === 'warning' ? T.dangerFg  : T.dangerFg;
    const confirmFg = tone === 'primary' ? T.primaryFg : '#fff';

    // Backdrop: クリックでキャンセル (verified delete は誤クリック防止のため backdrop click を吸収)
    function onBackdropClick(e: React.MouseEvent) {
        if (e.target !== e.currentTarget) return;
        if (needsTextMatch) return;
        handleCancel();
    }

    // ─────────── Mobile sheet ───────────
    if (isMobile) {
        return (
            <>
                <div onClick={onBackdropClick}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        background: 'rgba(15,23,42,.40)',
                        backdropFilter: 'blur(2px)',
                        opacity: mounted ? 1 : 0,
                        transition: 'opacity 200ms ease',
                    }}/>
                <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`m-title-${state.id}`}
                    style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0,
                        zIndex: 201,
                        background: T.surface,
                        borderRadius: '16px 16px 0 0',
                        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 -20px 60px -20px rgba(15,23,42,.30)',
                        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
                        transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
                        maxHeight: '90vh',
                    }}>
                    {/* handle */}
                    <div style={{
                        width: 32, height: 4, borderRadius: 99,
                        background: T.borderLight,
                        margin: '6px auto 4px', flexShrink: 0,
                    }}/>
                    {/* head */}
                    <div style={{
                        padding: '8px 16px 12px',
                        display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0,
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 99,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            background: iconBg, color: iconFg,
                            border: `1px solid ${iconBd}`,
                        }}>{icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div id={`m-title-${state.id}`} style={{
                                fontSize: 14, fontWeight: 700, color: T.textStrong,
                                marginBottom: 3, lineHeight: 1.3,
                            }}>
                                {state.kind === 'confirm' && state.count !== undefined && (
                                    <span style={{ color: confirmBg, fontFamily: MONO, fontSize: 14, marginRight: 4 }}>
                                        {state.count}
                                    </span>
                                )}
                                {state.title}
                            </div>
                            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
                                {state.description}
                            </div>
                        </div>
                    </div>
                    {/* body (verified delete / bulk meta) */}
                    {(state.kind === 'confirm' && (state.confirmText || state.metaInfo || state.body)) && (
                        <div style={{ padding: '0 16px 8px', fontSize: 12, flexShrink: 0, overflowY: 'auto' }}>
                            {state.metaInfo && (
                                <div style={{
                                    fontFamily: MONO, fontSize: 11, color: T.textMuted,
                                    padding: '8px 12px',
                                    background: T.surfaceAlt,
                                    borderRadius: T.radiusSm,
                                    lineHeight: 1.5, marginBottom: 8,
                                }}>{state.metaInfo}</div>
                            )}
                            {state.confirmText && (
                                <>
                                    <div style={{
                                        fontFamily: MONO, fontSize: 9, fontWeight: 700,
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        color: T.textMuted, margin: '8px 0 5px',
                                    }}>
                                        {state.confirmTextHint ?? '確認: 名称を入力'}
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        placeholder={state.confirmText}
                                        style={{
                                            width: '100%', height: 32, padding: '0 10px',
                                            border: `1px solid ${matched ? T.successBorder : T.dangerBorder}`,
                                            borderRadius: T.radiusSm,
                                            background: matched ? T.successBg : T.dangerBg,
                                            color: T.text, fontFamily: MONO, fontSize: 11,
                                            outline: 'none',
                                        }}/>
                                </>
                            )}
                            {state.body}
                        </div>
                    )}
                    {state.kind === 'confirm' && state.footerNote && (
                        <div style={{
                            textAlign: 'center', fontFamily: MONO, fontSize: 9.5,
                            color: T.textFaint, paddingBottom: 8,
                        }}>{state.footerNote}</div>
                    )}
                    {/* foot */}
                    <div style={{
                        padding: '12px 14px 0',
                        borderTop: `1px solid ${T.borderLight}`,
                        marginTop: 6,
                        display: 'flex', flexDirection: 'column', gap: 6,
                        flexShrink: 0,
                    }}>
                        <button onClick={handleConfirm} disabled={!confirmEnabled}
                            style={{
                                width: '100%', height: 40,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                background: confirmBg, color: confirmFg,
                                border: `1px solid ${confirmBg}`,
                                borderRadius: 8, cursor: confirmEnabled ? 'pointer' : 'not-allowed',
                                fontSize: 14, fontWeight: 700,
                                opacity: confirmEnabled ? 1 : 0.4,
                            }}>
                            {state.kind === 'confirm'
                                ? (state.confirmLabel ?? t('common.delete'))
                                : (state.okLabel ?? 'OK')}
                        </button>
                        {state.kind === 'confirm' && (
                            <button onClick={handleCancel}
                                style={{
                                    width: '100%', height: 40,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    background: T.surfaceAlt, color: T.text,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 8, cursor: 'pointer',
                                    fontSize: 14, fontWeight: 700,
                                }}>
                                {state.cancelLabel ?? t('common.cancel')}
                            </button>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // ─────────── PC: 中央モーダル ───────────
    return (
        <div onClick={onBackdropClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(15,23,42,.40)',
                backdropFilter: 'blur(2px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
                opacity: mounted ? 1 : 0,
                transition: 'opacity 200ms ease',
            }}>
            <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`m-title-${state.id}`}
                onClick={e => e.stopPropagation()}
                style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    width: '92%', maxWidth: 420,
                    boxShadow: '0 20px 60px -20px rgba(15,23,42,.30), 0 4px 12px rgba(15,23,42,.10)',
                    overflow: 'hidden',
                    transform: mounted ? 'scale(1)' : 'scale(0.96)',
                    transition: 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)',
                }}>
                {/* head */}
                <div style={{
                    padding: '18px 22px 12px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 99,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        background: iconBg, color: iconFg,
                        border: `1px solid ${iconBd}`,
                    }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div id={`m-title-${state.id}`} style={{
                            fontSize: 15, fontWeight: 700,
                            color: T.textStrong, letterSpacing: '-0.005em',
                            marginBottom: 4, lineHeight: 1.3,
                        }}>
                            {state.kind === 'confirm' && state.count !== undefined && (
                                <span style={{ color: confirmBg, fontFamily: MONO, fontSize: 17, marginRight: 6 }}>
                                    {state.count}
                                </span>
                            )}
                            {state.title}
                        </div>
                        <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
                            {state.description}
                        </div>
                    </div>
                </div>
                {/* body */}
                {(state.kind === 'confirm' && (state.confirmText || state.metaInfo || state.body)) && (
                    <div style={{ padding: '0 22px 12px' }}>
                        {state.metaInfo && (
                            <div style={{
                                fontFamily: MONO, fontSize: 11, color: T.textMuted,
                                padding: '8px 12px',
                                background: T.surfaceAlt,
                                borderRadius: T.radiusSm,
                                lineHeight: 1.5, marginBottom: 10,
                            }}>{state.metaInfo}</div>
                        )}
                        {state.confirmText && (
                            <>
                                <div style={{
                                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                    color: T.textMuted, margin: '8px 0 5px',
                                }}>
                                    {state.confirmTextHint ?? <>確認のため <span style={{
                                        textTransform: 'none', letterSpacing: 0,
                                        fontFamily: MONO, fontWeight: 600, color: T.text,
                                    }}>{state.confirmText}</span> と入力してください</>}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder={state.confirmText}
                                    style={{
                                        width: '100%', height: 32, padding: '0 10px',
                                        border: `1px solid ${matched ? T.successBorder : T.dangerBorder}`,
                                        borderRadius: 4,
                                        background: matched ? T.successBg : T.dangerBg,
                                        color: T.text, fontFamily: MONO, fontSize: 12.5,
                                        outline: 'none',
                                    }}/>
                            </>
                        )}
                        {state.body}
                    </div>
                )}
                {/* foot */}
                <div style={{
                    padding: '12px 18px',
                    background: T.surfaceAlt,
                    borderTop: `1px solid ${T.borderLight}`,
                    display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center',
                }}>
                    {state.kind === 'confirm' && state.footerNote && (
                        <span style={{
                            fontFamily: MONO, fontSize: 10, color: T.textFaint,
                            marginRight: 'auto',
                        }}>{state.footerNote}</span>
                    )}
                    {state.kind === 'confirm' && (
                        <button onClick={handleCancel}
                            style={{
                                height: 32, padding: '0 14px',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                background: 'transparent', color: T.text,
                                border: `1px solid ${T.border}`,
                                borderRadius: 5, cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                            }}>
                            {state.cancelLabel ?? t('common.cancel')}
                        </button>
                    )}
                    <button onClick={handleConfirm} disabled={!confirmEnabled}
                        style={{
                            height: 32, padding: '0 14px',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: confirmBg, color: confirmFg,
                            border: `1px solid ${confirmBg}`,
                            borderRadius: 5, cursor: confirmEnabled ? 'pointer' : 'not-allowed',
                            fontSize: 13, fontWeight: 600,
                            opacity: confirmEnabled ? 1 : 0.4,
                        }}>
                        {state.kind === 'confirm'
                            ? (state.confirmLabel ?? t('common.delete'))
                            : (state.okLabel ?? 'OK')}
                    </button>
                </div>
            </div>
        </div>
    );
}

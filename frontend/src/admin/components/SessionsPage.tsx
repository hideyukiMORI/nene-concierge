import { useEffect, useState } from 'react';
import {
    listSessions,
    getSessionDetail,
    ApiError,
} from '../api.js';
import type { SessionSummary, SessionDetail, SessionOutcome } from '../api.js';
import { PageHead, Card, CardSub, StatusPill, ErrorMsg, useLayout, isWideBp } from './Layout.js';
import {
    MobileHeader, MobileIconBtn, FilterChips, Chip, CardList, ListItem,
    Pill, MetaDot, SkeletonListItem, BottomSheet, MetaGrid,
} from './mobile/index.js';
import type { PillVariant } from './mobile/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const MONO = T.fontMono;

// ── Duration helper ───────────────────────────────────────────────────────────

function calcDuration(start: string, end: string | null): string {
    if (!end) return 'in progress';
    const ms   = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(ms) || ms < 0) return '—';
    const secs = Math.floor(ms / 1000);
    const m    = Math.floor(secs / 60);
    const s    = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

// ── Table styles ──────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
    padding: '8px 14px', textAlign: 'left',
    fontSize: T.fontXs, fontWeight: 700, color: T.textMuted,
    fontFamily: MONO, letterSpacing: '0.05em', textTransform: 'uppercase',
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
};

const TD: React.CSSProperties = {
    padding: '9px 14px', fontSize: T.fontSm, color: T.text,
};

// ── Session Detail View (shared between overlay drawer & wide right pane) ────

type DetailMode = 'overlay' | 'pane';

function SessionDetailView({
    sessionId, onClose, mode,
}: {
    sessionId: string;
    onClose:   () => void;
    mode:      DetailMode;  // overlay = <1441px, pane = ≥1441px
}) {
    const { t } = useTranslation();
    const [detail, setDetail]   = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        void getSessionDetail(sessionId)
            .then(res => setDetail(res.data))
            .catch(err => {
                setError(err instanceof ApiError ? err.message : t('sessions.detail.loadError'));
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // Sessions icon SVG
    const SessionIcon = (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );
    const CloseIcon = (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="18" y1="6" x2="6" y2="18"/>
        </svg>
    );

    const shortId = sessionId.slice(0, 8);
    const isPane  = mode === 'pane';

    // Inner content — head + body
    const inner = (
        <>
                {/* Top stripe */}
                <div style={{ height: 3, background: T.primary, flexShrink: 0 }} />

                {/* Head */}
                <div style={{
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: `1px solid ${T.border}`,
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 5,
                        background: T.primaryTint, color: T.primary,
                        border: `1px solid ${T.primaryBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        {SessionIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: T.fontMd, color: T.textStrong }}>
                            Session #{shortId}
                        </div>
                        {detail && (
                            <div style={{ fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                                scenario #{detail.scenario_id}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        aria-label={t('sessions.detail.close')}
                        style={{
                            width: 26, height: 26, borderRadius: T.radiusSm,
                            background: 'transparent', border: `1px solid ${T.border}`,
                            color: T.textMuted, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {CloseIcon}
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 20px' }}>
                    <ErrorMsg msg={error} />

                    {loading && (
                        <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
                    )}

                    {detail && (
                        <>
                            {/* Meta grid */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '100px 1fr',
                                gap: '8px 16px', marginBottom: 18,
                                fontSize: T.fontSm, alignItems: 'baseline',
                            }}>
                                {([
                                    ['outcome',    <StatusPill key="o" variant={detail.outcome === 'dropped' ? 'abandoned' : detail.outcome} />],
                                    ['conversion', <span key="cv" style={{ color: detail.has_conversion ? T.successFg : T.textMuted }}>
                                        {detail.has_conversion ? '✓ yes' : '— no'}
                                    </span>],
                                    ['started',    <span key="s" style={{ fontFamily: MONO, color: T.text }}>{detail.started_at}</span>],
                                    ['ended',      <span key="e" style={{ fontFamily: MONO, color: T.text }}>{detail.ended_at ?? '—'}</span>],
                                    ['duration',   <span key="d" style={{ fontFamily: MONO, color: T.text }}>{calcDuration(detail.started_at, detail.ended_at)}</span>],
                                ] as [string, React.ReactNode][]).map(([key, val]) => (
                                    <>
                                        <div key={`k-${key}`} style={{
                                            fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                                            letterSpacing: '0.06em', textTransform: 'uppercase',
                                        }}>{key}</div>
                                        <div key={`v-${key}`}>{val}</div>
                                    </>
                                ))}
                            </div>

                            {/* Session ID block */}
                            <CardSub>session id</CardSub>
                            <div style={{
                                background: T.surfaceAlt,
                                fontFamily: MONO, fontSize: T.fontXs,
                                wordBreak: 'break-all', padding: 10,
                                borderRadius: T.radiusMd,
                                marginBottom: 20,
                                color: T.textMuted,
                            }}>
                                {detail.id}
                            </div>

                            {/* Collected variables */}
                            {Object.keys(detail.variables).length > 0 && (
                                <section style={{ marginBottom: 20 }}>
                                    <CardSub>collected variables</CardSub>
                                    <div style={{
                                        borderRadius: T.radiusMd,
                                        border: `1px solid ${T.border}`,
                                        overflow: 'hidden',
                                        marginTop: 8,
                                    }}>
                                        {Object.entries(detail.variables).map(([key, val], i, arr) => (
                                            <div
                                                key={key}
                                                style={{
                                                    display: 'grid', gridTemplateColumns: '120px 1fr',
                                                    gap: 12,
                                                    padding: '7px 12px', fontSize: T.fontSm,
                                                    borderBottom: i < arr.length - 1 ? `1px solid ${T.borderLight}` : 'none',
                                                    background: i % 2 === 1 ? T.surfaceAlt : 'transparent',
                                                    alignItems: 'baseline',
                                                }}
                                            >
                                                <span style={{ fontFamily: MONO, color: T.textMuted, fontSize: T.fontXs }}>
                                                    {key}
                                                </span>
                                                <span style={{ color: T.text, wordBreak: 'break-all' }}>{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Messages */}
                            <section>
                                <CardSub>messages · {detail.messages.length}</CardSub>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                                    {detail.messages.map((msg, i) => {
                                        const isBot = msg.role === 'bot';
                                        return (
                                            <div key={msg.id ?? i}>
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: isBot ? 'row' : 'row-reverse',
                                                    gap: 8, alignItems: 'flex-end',
                                                }}>
                                                    {/* Avatar */}
                                                    <div style={{
                                                        width: 22, height: 22, borderRadius: 5,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, flexShrink: 0,
                                                        background: isBot ? T.primaryTint : T.adapterHttpBg,
                                                        color: isBot ? T.primary : T.adapterHttp,
                                                        border: `1px solid ${isBot ? T.primaryBorder : 'rgba(79,118,166,.35)'}`,
                                                    }}>
                                                        {isBot ? 'N' : 'U'}
                                                    </div>
                                                    {/* Bubble */}
                                                    <div style={{
                                                        maxWidth: '78%', padding: '8px 12px',
                                                        borderRadius: T.radiusMd,
                                                        fontSize: T.fontSm, lineHeight: 1.5, color: T.text,
                                                        background: isBot ? T.surfaceAlt : T.adapterHttpBg,
                                                        border: `1px solid ${isBot ? T.borderLight : 'rgba(79,118,166,.20)'}`,
                                                        borderBottomLeftRadius:  isBot ? 0 : T.radiusMd,
                                                        borderBottomRightRadius: isBot ? T.radiusMd : 0,
                                                    }}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                                {/* Time */}
                                                <div style={{
                                                    fontFamily: MONO, fontSize: 10,
                                                    color: T.textFaint,
                                                    textAlign: 'center', margin: '2px 0',
                                                }}>
                                                    {msg.created_at?.slice(11, 19) ?? ''}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {detail.messages.length === 0 && (
                                        <p style={{ color: T.textMuted, fontSize: T.fontSm }}>—</p>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </div>
        </>
    );

    if (isPane) {
        // Sticky right pane (≥1441px) — no backdrop, full viewport height
        return (
            <aside style={{
                width: 480, flexShrink: 0,
                borderLeft: `1px solid ${T.border}`,
                background: T.surface,
                height: '100vh', position: 'sticky', top: 0,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {inner}
            </aside>
        );
    }
    // Overlay drawer (<1441px)
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'oklch(0% 0 0 / 0.35)',
                backdropFilter: 'blur(2px)',
                display: 'flex', justifyContent: 'flex-end',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: 480, maxWidth: '95vw', height: '100vh',
                background: T.surface,
                boxShadow: '-10px 0 40px -10px rgba(15,23,42,.25)',
                display: 'flex', flexDirection: 'column',
                borderLeft: `1px solid ${T.border}`,
            }}>
                {inner}
            </div>
        </div>
    );
}

// ── Outcome → Pill 変換 (mobile) ──────────────────────────────────────────────

function outcomeToPillVariant(o: SessionOutcome): PillVariant {
    if (o === 'converted') return 'success';
    if (o === 'active')    return 'active';
    if (o === 'completed') return 'success';
    if (o === 'dropped' || o === 'abandoned') return 'archived';
    return 'neutral';
}
function outcomeIcon(o: SessionOutcome): string {
    if (o === 'converted') return '✓';
    if (o === 'active')    return '↻';
    if (o === 'completed') return '●';
    return '○';
}

// ── Mobile Session Detail (BottomSheet 内コンテンツ) ─────────────────────────

function MobileSessionDetailSheet({ sessionId, onClose }: { sessionId: string | null; onClose: () => void }) {
    const { t } = useTranslation();
    const [detail, setDetail]   = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) { setDetail(null); return; }
        setLoading(true);
        setError(null);
        let cancelled = false;
        void getSessionDetail(sessionId)
            .then(res => { if (!cancelled) setDetail(res.data); })
            .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.message : t('sessions.detail.loadError')); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const shortId = sessionId?.slice(0, 8);

    const sheetProps = detail
        ? { subtitle: `scenario #${detail.scenario_id}` }
        : {};

    return (
        <BottomSheet
            open={sessionId !== null}
            onClose={onClose}
            title={shortId ? `Session #${shortId}` : ''}
            {...sheetProps}>
            {error && <ErrorMsg msg={error} />}
            {loading && <div style={{ color: T.textMuted, fontSize: T.fontSm }}>{t('common.loading')}</div>}
            {detail && (
                <>
                    <MetaGrid rows={[
                        { label: 'outcome',    value: <Pill variant={outcomeToPillVariant(detail.outcome)} label={detail.outcome} /> },
                        { label: 'conversion', value: <span style={{ color: detail.has_conversion ? T.successFg : T.textMuted, fontFamily: T.fontMono }}>
                            {detail.has_conversion ? '✓ yes' : '— no'}
                        </span> },
                        { label: 'duration',   value: <span style={{ fontFamily: T.fontMono }}>{calcDuration(detail.started_at, detail.ended_at)}</span> },
                        { label: 'started',    value: <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{detail.started_at}</span> },
                        { label: 'ended',      value: <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{detail.ended_at ?? '—'}</span> },
                    ]}/>

                    {Object.keys(detail.variables).length > 0 && (
                        <>
                            <div style={{
                                fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.10em', textTransform: 'uppercase',
                                color: T.textFaint, marginBottom: 8,
                            }}>collected variables</div>
                            <div style={{
                                background: T.surfaceAlt,
                                borderRadius: T.radiusMd,
                                padding: '8px 12px', marginBottom: 18,
                                display: 'grid', gridTemplateColumns: '100px 1fr',
                                gap: '4px 12px', fontSize: 12,
                            }}>
                                {Object.entries(detail.variables).map(([k, v]) => (
                                    <span key={k} style={{ display: 'contents' }}>
                                        <span style={{ color: T.textMuted, fontFamily: T.fontMono }}>{k}</span>
                                        <span style={{ wordBreak: 'break-all', color: T.text }}>{String(v)}</span>
                                    </span>
                                ))}
                            </div>
                        </>
                    )}

                    {detail.messages.length > 0 && (
                        <>
                            <div style={{
                                fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.10em', textTransform: 'uppercase',
                                color: T.textFaint, marginBottom: 10,
                            }}>messages · {detail.messages.length}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {detail.messages.map((m, i) => {
                                    const isBot = m.role === 'bot';
                                    return (
                                        <div key={m.id ?? i}>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: isBot ? 'row' : 'row-reverse',
                                                gap: 8, alignItems: 'flex-end',
                                            }}>
                                                <div style={{
                                                    maxWidth: '78%', padding: '10px 14px',
                                                    borderRadius: 18,
                                                    borderBottomLeftRadius:  isBot ? 4 : 18,
                                                    borderBottomRightRadius: isBot ? 18 : 4,
                                                    fontSize: 14, lineHeight: 1.4,
                                                    color: T.textStrong,
                                                    background: isBot ? T.surfaceAlt : T.adapterHttpBg,
                                                }}>
                                                    {m.content}
                                                </div>
                                            </div>
                                            <div style={{
                                                fontFamily: T.fontMono, fontSize: 10,
                                                color: T.textFaint, textAlign: 'center', margin: '4px 0',
                                            }}>{m.created_at?.slice(11, 19) ?? ''}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </BottomSheet>
    );
}

// ── SessionsPage ──────────────────────────────────────────────────────────────

export default function SessionsPage() {
    const { t } = useTranslation();
    const { isMobile, bp, setFullWidth } = useLayout();
    const wide = isWideBp(bp);

    // ≥1441px は 2-pane なので main を full-width 化する
    useEffect(() => {
        if (!wide) return;
        setFullWidth(true);
        return () => { setFullWidth(false); };
    }, [wide, setFullWidth]);

    const [sessions, setSessions]     = useState<SessionSummary[]>([]);
    const [total, setTotal]           = useState(0);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // filters
    const [outcome, setOutcome]             = useState<SessionOutcome | ''>('');
    const [hasConversion, setHasConversion] = useState<'' | '0' | '1'>('');
    const [scenarioFilter, setScenarioFilter] = useState('');
    const [offset, setOffset]               = useState(0);
    const limit = 50;

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listSessions({
                ...(outcome       ? { outcome: outcome as SessionOutcome } : {}),
                ...(hasConversion ? { has_conversion: Number(hasConversion) as 0 | 1 } : {}),
                limit, offset,
            });
            setSessions(res.data);
            setTotal(res.meta.total);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('sessions.loadError'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, [outcome, hasConversion, offset]); // eslint-disable-line react-hooks/exhaustive-deps

    const active       = sessions.filter(s => s.outcome === 'active').length;
    const subtitle     = loading ? '…' : `${total} records · ${active} active now`;
    const totalPages   = Math.ceil(total / limit);
    const currentPage  = Math.floor(offset / limit) + 1;

    // unique scenario ids for filter dropdown
    const scenarioIds  = [...new Set(sessions.map(s => s.scenario_id))].sort((a, b) => a - b);

    const filtered = scenarioFilter
        ? sessions.filter(s => String(s.scenario_id) === scenarioFilter)
        : sessions;

    const filterSelectStyle: React.CSSProperties = {
        height: 26, padding: '0 8px',
        borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
        background: T.surface, color: T.text,
        fontSize: T.fontXs, fontFamily: MONO,
        cursor: 'pointer', outline: 'none',
    };

    const PAG_BTN: React.CSSProperties = {
        height: T.controlHeightSm, padding: '0 14px', boxSizing: 'border-box',
        borderRadius: T.radiusMd,
        border: `1px solid ${T.border}`, background: T.surface,
        color: T.text, fontSize: T.fontSm, fontWeight: 500,
        cursor: 'pointer', transition: 'filter 150ms ease',
    };

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        const countActive    = sessions.filter(s => s.outcome === 'active').length;
        const countConverted = sessions.filter(s => s.outcome === 'converted').length;

        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Sessions"
                    subtitle={loading ? '…' : `${total} records · ${countActive} active`}
                    trailing={
                        <MobileIconBtn ariaLabel={t('common.refresh')} onClick={() => { void load(); }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <polyline points="23 4 23 10 17 10"/>
                                <polyline points="1 20 1 14 7 14"/>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                        </MobileIconBtn>
                    }
                />

                <FilterChips>
                    <Chip active={outcome === ''}          onClick={() => { setOutcome(''); setOffset(0); }}>all · {total}</Chip>
                    <Chip active={outcome === 'active'}    onClick={() => { setOutcome('active'); setOffset(0); }}>active · {countActive}</Chip>
                    <Chip active={outcome === 'converted'} onClick={() => { setOutcome('converted'); setOffset(0); }}>converted · {countConverted}</Chip>
                    <Chip active={outcome === 'completed'} onClick={() => { setOutcome('completed'); setOffset(0); }}>completed</Chip>
                    <Chip active={outcome === 'dropped'}   onClick={() => { setOutcome('dropped'); setOffset(0); }}>abandoned</Chip>
                </FilterChips>

                {error && (
                    <div style={{ padding: '12px 12px 0' }}>
                        <ErrorMsg msg={error} />
                    </div>
                )}

                {loading ? (
                    <CardList>
                        <SkeletonListItem />
                        <SkeletonListItem />
                        <SkeletonListItem />
                    </CardList>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted, fontSize: T.fontSm }}>
                        {t('sessions.empty')}
                    </div>
                ) : (
                    <CardList>
                        {filtered.map((s, i) => (
                            <ListItem
                                key={s.id}
                                last={i === filtered.length - 1}
                                icon={outcomeIcon(s.outcome)}
                                title={s.id.slice(0, 8) + '…'}
                                meta={
                                    <>
                                        <Pill variant={outcomeToPillVariant(s.outcome)} label={s.outcome} />
                                        <MetaDot />
                                        <span>{calcDuration(s.started_at, s.ended_at)}</span>
                                    </>
                                }
                                onClick={() => setSelectedId(s.id)}
                            />
                        ))}
                    </CardList>
                )}

                {/* Pagination (compact) */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 8,
                        margin: '12px 0', alignItems: 'center',
                        fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                    }}>
                        <button disabled={currentPage <= 1}
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            style={{
                                ...PAG_BTN,
                                opacity: currentPage <= 1 ? 0.45 : 1,
                                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                            }}>← prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage >= totalPages}
                            onClick={() => setOffset(offset + limit)}
                            style={{
                                ...PAG_BTN,
                                opacity: currentPage >= totalPages ? 0.45 : 1,
                                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                            }}>next →</button>
                    </div>
                )}

                <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }}/>

                <MobileSessionDetailSheet
                    sessionId={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            </div>
        );
    }

    // ─────────── Desktop / Tablet / Wide layout ───────────
    // wide (≥1441) は 2-pane (list + sticky right pane)
    // desktop/tablet は通常レイアウト + overlay drawer
    const listAndFilters = (
        <div style={wide ? { padding: '28px 36px 48px', flex: 1, minWidth: 0 } : undefined}>
            <PageHead title="Sessions" subtitle={subtitle}>
                <button
                    onClick={() => { void load(); }}
                    style={{
                        height: T.controlHeightSm, padding: '0 10px',
                        borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
                        background: 'transparent', color: T.primary,
                        fontSize: T.fontXs, fontWeight: 600, cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                    ↻ Refresh
                </button>
                <button
                    style={{
                        height: T.controlHeight, padding: '0 12px',
                        borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
                        background: 'transparent', color: T.primary,
                        fontSize: T.fontSm, fontWeight: 600, cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                    ↓ Export CSV
                </button>
            </PageHead>

            <ErrorMsg msg={error} />

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, letterSpacing: '0.04em',
                }}>
                    outcome:
                    <select
                        value={outcome}
                        onChange={e => { setOutcome(e.target.value as SessionOutcome | ''); setOffset(0); }}
                        style={filterSelectStyle}
                    >
                        <option value="">all</option>
                        <option value="active">active</option>
                        <option value="completed">completed</option>
                        <option value="dropped">abandoned</option>
                        <option value="converted">converted</option>
                    </select>
                </label>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, letterSpacing: '0.04em',
                }}>
                    conversion:
                    <select
                        value={hasConversion}
                        onChange={e => { setHasConversion(e.target.value as '' | '0' | '1'); setOffset(0); }}
                        style={filterSelectStyle}
                    >
                        <option value="">all</option>
                        <option value="1">yes</option>
                        <option value="0">no</option>
                    </select>
                </label>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, letterSpacing: '0.04em',
                }}>
                    scenario:
                    <select
                        value={scenarioFilter}
                        onChange={e => setScenarioFilter(e.target.value)}
                        style={filterSelectStyle}
                    >
                        <option value="">all</option>
                        {scenarioIds.map(id => (
                            <option key={id} value={String(id)}>#{id}</option>
                        ))}
                    </select>
                </label>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {total} records
                </span>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('common.loading')}</p>
                ) : filtered.length === 0 ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('sessions.empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...TH, width: 130 }}>outcome</th>
                                    <th style={{ ...TH, width: 80 }}>scenario</th>
                                    <th style={{ ...TH, width: 100 }}>cv</th>
                                    <th style={{ ...TH, width: 150 }}>started</th>
                                    <th style={{ ...TH, width: 150 }}>ended</th>
                                    <th style={{ ...TH, width: 90 }}>duration</th>
                                    <th style={TH}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s, i) => {
                                    const isSelected = s.id === selectedId;
                                    const pillVariant: Parameters<typeof StatusPill>[0]['variant'] =
                                        s.outcome === 'dropped' ? 'abandoned' : s.outcome;
                                    return (
                                        <tr
                                            key={s.id}
                                            onClick={() => setSelectedId(s.id)}
                                            style={{
                                                borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                                                background: isSelected ? T.primaryTint : 'transparent',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) e.currentTarget.style.background = T.surfaceHover;
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = isSelected ? T.primaryTint : 'transparent';
                                            }}
                                        >
                                            <td style={{ ...TD, boxShadow: isSelected ? `inset 2px 0 0 ${T.primary}` : 'none' }}>
                                                <StatusPill variant={pillVariant} />
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.text }}>
                                                #{s.scenario_id}
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: s.has_conversion ? T.successFg : T.textMuted }}>
                                                {s.has_conversion ? '✓ yes' : '— no'}
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted, whiteSpace: 'nowrap' }}>
                                                {s.started_at}
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted, whiteSpace: 'nowrap' }}>
                                                {s.ended_at ?? '—'}
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted }}>
                                                {calcDuration(s.started_at, s.ended_at)}
                                            </td>
                                            <td style={{ ...TD, color: T.textMuted, fontSize: T.fontXs }}>
                                                {isSelected ? '→ selected' : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 8,
                    marginTop: 16, alignItems: 'center',
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                }}>
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        style={{
                            ...PAG_BTN,
                            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage <= 1 ? 0.45 : 1,
                        }}
                        onMouseEnter={e => { if (currentPage > 1) e.currentTarget.style.filter = 'brightness(0.92)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                    >
                        ← prev
                    </button>
                    <span>page {currentPage} / {totalPages}</span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setOffset(offset + limit)}
                        style={{
                            ...PAG_BTN,
                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage >= totalPages ? 0.45 : 1,
                        }}
                        onMouseEnter={e => { if (currentPage < totalPages) e.currentTarget.style.filter = 'brightness(0.92)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                    >
                        next →
                    </button>
                </div>
            )}

        </div>
    );

    if (wide) {
        // 2-pane: list + sticky right pane
        return (
            <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '100vh' }}>
                {listAndFilters}
                {selectedId !== null ? (
                    <SessionDetailView
                        key={selectedId}
                        sessionId={selectedId}
                        onClose={() => setSelectedId(null)}
                        mode="pane"
                    />
                ) : (
                    <aside style={{
                        width: 480, flexShrink: 0,
                        borderLeft: `1px solid ${T.border}`,
                        background: T.surface,
                        height: '100vh', position: 'sticky', top: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: T.textFaint, fontSize: T.fontSm,
                        textAlign: 'center', padding: 24,
                    }}>
                        <div style={{
                            fontFamily: MONO, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.10em', textTransform: 'uppercase',
                            marginBottom: 6,
                        }}>no session selected</div>
                        <div>左の一覧から行をクリックして詳細を表示</div>
                    </aside>
                )}
            </div>
        );
    }

    // desktop / tablet: overlay drawer
    return (
        <>
            {listAndFilters}
            {selectedId !== null && (
                <SessionDetailView
                    sessionId={selectedId}
                    onClose={() => setSelectedId(null)}
                    mode="overlay"
                />
            )}
        </>
    );
}

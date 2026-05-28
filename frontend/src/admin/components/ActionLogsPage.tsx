import { useEffect, useState } from 'react';
import { listActionLogs, ApiError } from '../api.js';
import type { ActionLogEntry } from '../api.js';
import { PageHead, Card, CardSub, StatusPill, AdapterTag, ErrorMsg, useLayout, isWideBp } from './Layout.js';
import {
    MobileHeader, MobileIconBtn, FilterChips, Chip, CardList, ListItem,
    Pill, SkeletonListItem,
} from './mobile/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const ADAPTER_ICON: Record<string, string> = {
    http:     '→',
    email:    '✉',
    slack:    '#',
    chatwork: '✎',
};

const MONO = T.fontMono;

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

const PAG_BTN: React.CSSProperties = {
    height: T.controlHeightSm, padding: '0 14px', boxSizing: 'border-box',
    borderRadius: T.radiusMd,
    border: `1px solid ${T.border}`, background: T.surface,
    color: T.text, fontSize: T.fontSm, fontWeight: 500,
    cursor: 'pointer',
    transition: 'filter 150ms ease',
};

// ── ActionLog Detail View (shared by overlay drawer & wide right pane) ────────

function ActionLogDetailView({
    log, onClose, mode,
}: {
    log:     ActionLogEntry;
    onClose: () => void;
    mode:    'overlay' | 'pane';
}) {
    const fail = log.status === 'failure';
    const headerColor = fail ? T.dangerFg : T.successFg;
    const headerBg    = fail ? T.dangerBg : T.successBg;
    const headerBorder= fail ? T.dangerBorder : T.successBorder;

    const inner = (
        <>
            <div style={{ height: 3, background: fail ? T.dangerFg : T.successFg, flexShrink: 0 }}/>
            <div style={{
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: `1px solid ${T.border}`, flexShrink: 0,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 5,
                    background: headerBg, color: headerColor,
                    border: `1px solid ${headerBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontFamily: T.fontMono, fontWeight: 700, fontSize: 14,
                }}>{fail ? '!' : '✓'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: T.fontMd, fontWeight: 700, margin: 0, color: T.textStrong,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fail ? (log.error_message?.split(':')[0] ?? 'failure') : `${log.adapter} action`}
                    </h3>
                    <div style={{ fontFamily: T.fontMono, fontSize: T.fontXs, color: T.textMuted, marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.adapter} · session {log.session_id.slice(0, 8)} · {log.executed_at?.slice(11, 19)}
                    </div>
                </div>
                <button onClick={onClose} aria-label="Close"
                    style={{
                        width: 26, height: 26, borderRadius: T.radiusSm,
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.textMuted, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                        <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                    </svg>
                </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 20px' }}>
                {/* Meta grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '110px 1fr',
                    gap: '6px 14px', fontSize: T.fontSm, marginBottom: 18,
                }}>
                    {([
                        ['status',   <StatusPill key="s" variant={log.status} />],
                        ['adapter',  <AdapterTag key="a" adapter={log.adapter} />],
                        ['executed', <span key="e" style={{ fontFamily: T.fontMono, color: T.text }}>{log.executed_at}</span>],
                        ['scenario', <span key="sc">#{log.scenario_id}</span>],
                        ['session',  <span key="se" style={{ fontFamily: T.fontMono, fontSize: 11, wordBreak: 'break-all' }}>{log.session_id}</span>],
                        ['node',     <span key="n" style={{ fontFamily: T.fontMono, color: T.text }}>{log.node_id}</span>],
                    ] as [string, React.ReactNode][]).map(([key, val]) => (
                        <span key={key} style={{ display: 'contents' }}>
                            <span style={{
                                fontFamily: T.fontMono, fontSize: 10,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                color: T.textMuted, alignSelf: 'center',
                            }}>{key}</span>
                            <span style={{ color: T.textStrong }}>{val}</span>
                        </span>
                    ))}
                </div>

                {/* Error / detail block */}
                {fail && log.error_message && (
                    <>
                        <CardSub>error</CardSub>
                        <div style={{
                            background: T.surfaceAlt,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radiusMd,
                            padding: '12px 14px', marginTop: 6, marginBottom: 18,
                            fontFamily: T.fontMono, fontSize: 11.5,
                            lineHeight: 1.6, color: T.dangerFg,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            overflowX: 'auto',
                        }}>
                            {log.error_message}
                        </div>
                    </>
                )}

                {/* Request payload (TODO — backend が完了次第) */}
                <CardSub>request</CardSub>
                <div style={{
                    background: T.surfaceAlt, border: `1px solid ${T.border}`,
                    borderRadius: T.radiusMd,
                    padding: '12px 14px', marginTop: 6, marginBottom: 18,
                    fontFamily: T.fontMono, fontSize: 11.5,
                    lineHeight: 1.6, color: T.textMuted,
                }}>
                    <span style={{ color: T.textMuted }}>adapter:</span> {log.adapter}{'\n'}
                    <span style={{ color: T.textMuted }}>node_id:</span> {log.node_id}{'\n'}
                    <span style={{ color: T.textFaint, fontStyle: 'italic' }}>
                        — full payload not yet exposed by backend —
                    </span>
                </div>

                {/* Retry policy (TODO) */}
                {fail && (
                    <>
                        <CardSub>retry policy</CardSub>
                        <div style={{ fontSize: T.fontSm, color: T.textMuted, lineHeight: 1.5, marginTop: 6 }}>
                            <span style={{ fontFamily: T.fontMono, background: T.surfaceAlt, padding: '2px 6px', borderRadius: 3 }}>
                                attempt 1 / 1
                            </span>
                            <span style={{ marginLeft: 8 }}>· retries not configured</span>
                        </div>
                    </>
                )}
            </div>
        </>
    );

    if (mode === 'pane') {
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
    // overlay
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'oklch(0% 0 0 / 0.35)', backdropFilter: 'blur(2px)',
                display: 'flex', justifyContent: 'flex-end',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: 480, maxWidth: '95vw', height: '100vh',
                background: T.surface, boxShadow: '-10px 0 40px -10px rgba(15,23,42,.25)',
                display: 'flex', flexDirection: 'column',
                borderLeft: `1px solid ${T.border}`,
            }}>
                {inner}
            </div>
        </div>
    );
}

export default function ActionLogsPage() {
    const { t } = useTranslation();
    const { isMobile, bp, setFullWidth } = useLayout();
    const wide = isWideBp(bp);

    const [logs, setLogs]       = useState<ActionLogEntry[]>([]);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // wide+ で main full-width
    useEffect(() => {
        if (!wide) return;
        setFullWidth(true);
        return () => { setFullWidth(false); };
    }, [wide, setFullWidth]);

    const selectedLog = selectedId !== null ? logs.find(l => l.id === selectedId) ?? null : null;

    // filters
    const [adapter, setAdapter] = useState('');
    const [status, setStatus]   = useState('');
    const [range, setRange]     = useState('last 24h'); // UI only
    const [offset, setOffset]   = useState(0);
    const limit = 50;

    useEffect(() => {
        setLoading(true);
        setError(null);
        void listActionLogs({
            ...(adapter ? { adapter } : {}),
            ...(status  ? { status  } : {}),
            limit, offset,
        }).then(res => {
            setLogs(res.data);
            setTotal(res.meta.total);
        }).catch(err => {
            setError(err instanceof ApiError ? err.message : t('actionLogs.loadError'));
        }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adapter, status, offset]);

    function handleFilterChange() { setOffset(0); }

    const failures    = logs.filter(l => l.status === 'failure').length;
    const totalPages  = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const subtitle = loading
        ? '…'
        : `${range} · ${total} records · ${failures} failed`;

    const filterSelectStyle: React.CSSProperties = {
        height: 26, padding: '0 8px',
        borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
        background: T.surface, color: T.text,
        fontSize: T.fontXs, fontFamily: MONO,
        cursor: 'pointer', outline: 'none',
    };

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Action Logs"
                    subtitle={loading ? '…' : `${total} records · ${failures} failed`}
                    trailing={
                        <MobileIconBtn ariaLabel="Export CSV">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </MobileIconBtn>
                    }
                />

                <FilterChips>
                    <Chip active={status === '' && adapter === ''} onClick={() => { setStatus(''); setAdapter(''); handleFilterChange(); }}>all · {total}</Chip>
                    <Chip danger={status === 'failure'} active={status === 'failure'} onClick={() => { setStatus(status === 'failure' ? '' : 'failure'); handleFilterChange(); }}>failure</Chip>
                    <Chip active={status === 'success'} onClick={() => { setStatus(status === 'success' ? '' : 'success'); handleFilterChange(); }}>success</Chip>
                    <Chip active={adapter === 'http'}     onClick={() => { setAdapter(adapter === 'http' ? '' : 'http'); handleFilterChange(); }}>http</Chip>
                    <Chip active={adapter === 'email'}    onClick={() => { setAdapter(adapter === 'email' ? '' : 'email'); handleFilterChange(); }}>email</Chip>
                    <Chip active={adapter === 'slack'}    onClick={() => { setAdapter(adapter === 'slack' ? '' : 'slack'); handleFilterChange(); }}>slack</Chip>
                    <Chip active={adapter === 'chatwork'} onClick={() => { setAdapter(adapter === 'chatwork' ? '' : 'chatwork'); handleFilterChange(); }}>chatwork</Chip>
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
                ) : logs.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted, fontSize: T.fontSm }}>
                        {t('actionLogs.empty')}
                    </div>
                ) : (
                    <CardList>
                        {logs.map((log, i) => {
                            const fail = log.status === 'failure';
                            return (
                                <ListItem
                                    key={log.id ?? i}
                                    last={i === logs.length - 1}
                                    failure={fail}
                                    icon={ADAPTER_ICON[log.adapter] ?? '·'}
                                    title={
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Pill variant={fail ? 'failure' : 'success'} label={log.status} />
                                            <span style={{
                                                fontSize: 12, color: T.textMuted, fontFamily: MONO,
                                                fontWeight: 400,
                                            }}>
                                                {log.adapter} · {log.executed_at?.slice(11, 16) ?? '—'}
                                            </span>
                                        </span>
                                    }
                                    meta={
                                        fail ? (
                                            <span style={{
                                                color: T.dangerFg, fontFamily: MONO,
                                                fontSize: 11.5, lineHeight: 1.4,
                                                whiteSpace: 'normal', wordBreak: 'break-word',
                                            }}>
                                                {log.error_message ?? '—'}
                                            </span>
                                        ) : (
                                            <span>#{log.scenario_id} · {log.session_id.slice(0, 8)}…</span>
                                        )
                                    }
                                />
                            );
                        })}
                    </CardList>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 8,
                        margin: '12px 0', alignItems: 'center',
                        fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                    }}>
                        <button disabled={currentPage <= 1}
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            style={{ ...PAG_BTN, opacity: currentPage <= 1 ? 0.45 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}>← prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage >= totalPages}
                            onClick={() => setOffset(offset + limit)}
                            style={{ ...PAG_BTN, opacity: currentPage >= totalPages ? 0.45 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}>next →</button>
                    </div>
                )}

                <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }}/>
            </div>
        );
    }

    // ─────────── Desktop / Tablet / Wide layout ───────────
    const listAndFilters = (
        <div style={wide ? { padding: '28px 36px 48px', flex: 1, minWidth: 0 } : undefined}>
            <PageHead title="Action Logs" subtitle={subtitle}>
                <button
                    style={{
                        height: T.controlHeight, padding: '0 12px',
                        borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
                        background: 'transparent', color: T.primary,
                        fontSize: T.fontSm, fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
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
                    adapter:
                    <select
                        value={adapter}
                        onChange={e => { setAdapter(e.target.value); handleFilterChange(); }}
                        style={filterSelectStyle}
                    >
                        <option value="">all</option>
                        <option value="http">http</option>
                        <option value="email">email</option>
                        <option value="slack">slack</option>
                        <option value="chatwork">chatwork</option>
                    </select>
                </label>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, letterSpacing: '0.04em',
                }}>
                    status:
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); handleFilterChange(); }}
                        style={filterSelectStyle}
                    >
                        <option value="">all</option>
                        <option value="success">success</option>
                        <option value="failure">failure</option>
                    </select>
                </label>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, letterSpacing: '0.04em',
                }}>
                    range:
                    <select
                        value={range}
                        onChange={e => setRange(e.target.value)}
                        style={filterSelectStyle}
                    >
                        <option>last 24h</option>
                        <option>last 7d</option>
                        <option>last 30d</option>
                    </select>
                </label>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {total} records
                </span>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('common.loading')}</p>
                ) : logs.length === 0 ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('actionLogs.empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...TH, width: 100 }}>status</th>
                                    <th style={{ ...TH, width: 110 }}>adapter</th>
                                    <th style={{ ...TH, width: 130 }}>session</th>
                                    <th style={{ ...TH, width: 80 }}>scenario</th>
                                    <th style={{ ...TH, width: 150 }}>executed</th>
                                    <th style={TH}>error / detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => {
                                    const isSel = log.id !== null && log.id === selectedId;
                                    const fail  = log.status === 'failure';
                                    return (
                                        <tr
                                            key={log.id ?? i}
                                            onClick={() => log.id !== null && setSelectedId(log.id)}
                                            style={{
                                                borderBottom: i < logs.length - 1 ? `1px solid ${T.border}` : 'none',
                                                background: isSel ? (fail ? T.dangerBg : T.primaryTint) : 'transparent',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = T.surfaceHover; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isSel ? (fail ? T.dangerBg : T.primaryTint) : 'transparent'; }}
                                        >
                                            {/* status */}
                                            <td style={{ ...TD, boxShadow: isSel ? `inset 2px 0 0 ${fail ? T.dangerFg : T.primary}` : 'none' }}>
                                                <StatusPill variant={log.status} />
                                            </td>
                                            {/* adapter */}
                                            <td style={TD}>
                                                <AdapterTag adapter={log.adapter} />
                                            </td>
                                            {/* session */}
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontXs, color: T.textFaint }}>
                                                {log.session_id.slice(0, 8)}…
                                            </td>
                                            {/* scenario */}
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.text }}>
                                                #{log.scenario_id}
                                            </td>
                                            {/* executed */}
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted, whiteSpace: 'nowrap' }}>
                                                {log.executed_at}
                                            </td>
                                            {/* error */}
                                            <td style={{
                                                ...TD,
                                                fontFamily: MONO, fontSize: T.fontXs,
                                                color: fail ? T.dangerFg : T.textMuted,
                                                maxWidth: 280,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {log.error_message ?? '—'}
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
        return (
            <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '100vh' }}>
                {listAndFilters}
                {selectedLog ? (
                    <ActionLogDetailView
                        key={selectedLog.id ?? '__sel__'}
                        log={selectedLog}
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
                        }}>no log selected</div>
                        <div>左の一覧から行をクリックして詳細を表示</div>
                    </aside>
                )}
            </div>
        );
    }

    // desktop/tablet: overlay drawer when selected
    return (
        <>
            {listAndFilters}
            {selectedLog && (
                <ActionLogDetailView
                    log={selectedLog}
                    onClose={() => setSelectedId(null)}
                    mode="overlay"
                />
            )}
        </>
    );
}

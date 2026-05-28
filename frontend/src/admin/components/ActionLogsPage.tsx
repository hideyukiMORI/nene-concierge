import { useEffect, useState } from 'react';
import { listActionLogs, ApiError } from '../api.js';
import type { ActionLogEntry } from '../api.js';
import { PageHead, Card, StatusPill, AdapterTag, ErrorMsg, useLayout } from './Layout.js';
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

export default function ActionLogsPage() {
    const { t } = useTranslation();
    const { isMobile } = useLayout();

    const [logs, setLogs]       = useState<ActionLogEntry[]>([]);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

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

    // ─────────── Desktop / Tablet layout ───────────
    return (
        <div>
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
                                {logs.map((log, i) => (
                                    <tr
                                        key={log.id ?? i}
                                        style={{
                                            borderBottom: i < logs.length - 1 ? `1px solid ${T.border}` : 'none',
                                        }}
                                    >
                                        {/* status */}
                                        <td style={TD}>
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
                                            color: log.status === 'failure' ? T.dangerFg : T.textMuted,
                                            maxWidth: 280,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {log.error_message ?? '—'}
                                        </td>
                                    </tr>
                                ))}
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
}

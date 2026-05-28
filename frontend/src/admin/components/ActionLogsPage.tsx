import { useEffect, useState } from 'react';
import { listActionLogs, ApiError } from '../api.js';
import type { ActionLogEntry } from '../api.js';
import { PageHead, Card, StatusPill, AdapterTag, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

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

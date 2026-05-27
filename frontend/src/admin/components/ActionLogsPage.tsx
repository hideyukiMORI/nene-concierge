import { useEffect, useState } from 'react';
import { listActionLogs, ApiError } from '../api.js';
import type { ActionLogEntry } from '../api.js';
import { PageTitle, Card, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

// ── アダプターアイコン ─────────────────────────────────────────────────────────

const ADAPTER_ICONS: Record<string, string> = {
    email:    '📧',
    slack:    '💬',
    chatwork: '🗨️',
    http:     '🌐',
};

// ── ステータスバッジ ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'success' | 'failure' }) {
    const isSuccess = status === 'success';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 9px', borderRadius: 99,
            fontSize: T.fontXs, fontWeight: 700,
            background: isSuccess ? 'oklch(96% 0.04 150)' : 'oklch(97% 0.04 25)',
            color:      isSuccess ? 'oklch(40% 0.14 150)' : 'oklch(40% 0.14 25)',
            border: `1px solid ${isSuccess ? 'oklch(85% 0.09 150)' : 'oklch(87% 0.08 25)'}`,
        }}>
            {isSuccess ? '✓' : '✗'} {status}
        </span>
    );
}

// ── ActionLogsPage ────────────────────────────────────────────────────────────

export default function ActionLogsPage() {
    const { t } = useTranslation();

    const [logs, setLogs]         = useState<ActionLogEntry[]>([]);
    const [total, setTotal]       = useState(0);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);

    // フィルター
    const [adapter, setAdapter]   = useState('');
    const [status, setStatus]     = useState('');
    const [offset, setOffset]     = useState(0);
    const limit = 50;

    useEffect(() => {
        setLoading(true);
        setError(null);
        void listActionLogs({
            ...(adapter ? { adapter } : {}),
            ...(status  ? { status  } : {}),
            limit,
            offset,
        }).then(res => {
            setLogs(res.data);
            setTotal(res.meta.total);
        }).catch(err => {
            setError(err instanceof ApiError ? err.message : t('actionLogs.loadError'));
        }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adapter, status, offset]);

    function handleFilterChange() {
        setOffset(0); // フィルター変更時はページをリセット
    }

    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return (
        <div>
            <PageTitle>{t('actionLogs.pageTitle')}</PageTitle>

            {/* フィルターバー */}
            <div style={{
                display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                {/* Adapter フィルター */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: T.fontSm, color: T.textMuted }}>
                    {t('actionLogs.filterAdapter')}:
                    <select
                        value={adapter}
                        onChange={e => { setAdapter(e.target.value); handleFilterChange(); }}
                        style={{
                            padding: '5px 8px', borderRadius: T.radiusMd,
                            border: `1px solid ${T.borderInput}`, background: T.surface,
                            color: T.text, fontSize: T.fontSm,
                        }}
                    >
                        <option value="">{t('actionLogs.all')}</option>
                        <option value="http">🌐 HTTP</option>
                        <option value="email">📧 Email</option>
                        <option value="slack">💬 Slack</option>
                        <option value="chatwork">🗨️ Chatwork</option>
                    </select>
                </label>

                {/* Status フィルター */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: T.fontSm, color: T.textMuted }}>
                    {t('actionLogs.filterStatus')}:
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); handleFilterChange(); }}
                        style={{
                            padding: '5px 8px', borderRadius: T.radiusMd,
                            border: `1px solid ${T.borderInput}`, background: T.surface,
                            color: T.text, fontSize: T.fontSm,
                        }}
                    >
                        <option value="">{t('actionLogs.all')}</option>
                        <option value="success">✓ success</option>
                        <option value="failure">✗ failure</option>
                    </select>
                </label>

                <span style={{ marginLeft: 'auto', fontSize: T.fontSm, color: T.textMuted }}>
                    {total} records
                </span>
            </div>

            <ErrorMsg msg={error} />

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '20px 24px', color: T.textMuted }}>{t('common.loading')}</p>
                ) : logs.length === 0 ? (
                    <p style={{ padding: '20px 24px', color: T.textMuted }}>{t('actionLogs.empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: T.fontSm }}>
                            <thead>
                                <tr style={{ background: T.tableHeader, borderBottom: `1px solid ${T.border}` }}>
                                    {[
                                        t('common.status'),
                                        t('actionLogs.filterAdapter'),
                                        t('actionLogs.sessionId'),
                                        t('actionLogs.scenarioId'),
                                        t('actionLogs.executedAt'),
                                        t('actionLogs.error'),
                                    ].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', textAlign: 'left',
                                            fontWeight: 600, color: T.textMuted,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr
                                        key={log.id ?? i}
                                        style={{
                                            borderBottom: `1px solid ${T.border}`,
                                            background: i % 2 === 1 ? T.tableRow : 'transparent',
                                        }}
                                    >
                                        <td style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}>
                                            <StatusBadge status={log.status} />
                                        </td>
                                        <td style={{ padding: '9px 16px', whiteSpace: 'nowrap', color: T.text }}>
                                            {ADAPTER_ICONS[log.adapter] ?? '🔧'} {log.adapter}
                                        </td>
                                        <td style={{ padding: '9px 16px', fontFamily: 'monospace', fontSize: T.fontXs, color: T.textMuted }}>
                                            {log.session_id.slice(0, 8)}…
                                        </td>
                                        <td style={{ padding: '9px 16px', color: T.textMuted }}>
                                            #{log.scenario_id}
                                        </td>
                                        <td style={{ padding: '9px 16px', whiteSpace: 'nowrap', color: T.textMuted }}>
                                            {log.executed_at}
                                        </td>
                                        <td style={{
                                            padding: '9px 16px', color: T.dangerText,
                                            fontSize: T.fontXs, maxWidth: 280,
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

            {/* ページネーション */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 8,
                    marginTop: 16, alignItems: 'center',
                }}>
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        style={{
                            padding: '5px 12px', borderRadius: T.radiusMd,
                            border: `1px solid ${T.border}`, background: T.surface,
                            color: T.text, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage <= 1 ? 0.5 : 1,
                        }}
                    >
                        ← Prev
                    </button>
                    <span style={{ fontSize: T.fontSm, color: T.textMuted }}>
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setOffset(offset + limit)}
                        style={{
                            padding: '5px 12px', borderRadius: T.radiusMd,
                            border: `1px solid ${T.border}`, background: T.surface,
                            color: T.text, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage >= totalPages ? 0.5 : 1,
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

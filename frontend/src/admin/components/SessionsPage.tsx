import { useEffect, useState } from 'react';
import {
    listSessions,
    getSessionDetail,
    ApiError,
} from '../api.js';
import type { SessionSummary, SessionDetail, SessionOutcome } from '../api.js';
import { PageTitle, Card, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

// ── Outcome badge ─────────────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<SessionOutcome, { bg: string; fg: string; border: string }> = {
    active:    { bg: 'oklch(96% 0.05 220)', fg: 'oklch(38% 0.15 220)', border: 'oklch(83% 0.10 220)' },
    completed: { bg: 'oklch(96% 0.04 150)', fg: 'oklch(40% 0.14 150)', border: 'oklch(85% 0.09 150)' },
    dropped:   { bg: 'oklch(97% 0.04 25)',  fg: 'oklch(40% 0.14 25)',  border: 'oklch(87% 0.08 25)'  },
    converted: { bg: 'oklch(96% 0.06 290)', fg: 'oklch(38% 0.18 290)', border: 'oklch(83% 0.12 290)' },
};

function OutcomeBadge({ outcome }: { outcome: SessionOutcome }) {
    const { t } = useTranslation();
    const c = OUTCOME_COLORS[outcome];
    const label: Record<SessionOutcome, string> = {
        active:    t('sessions.active'),
        completed: t('sessions.completed'),
        dropped:   t('sessions.dropped'),
        converted: t('sessions.converted'),
    };
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 9px', borderRadius: 99,
            fontSize: T.fontXs, fontWeight: 700,
            background: c.bg, color: c.fg,
            border: `1px solid ${c.border}`,
        }}>
            {label[outcome]}
        </span>
    );
}

// ── Session Detail Panel ──────────────────────────────────────────────────────

function SessionDetailPanel({
    sessionId,
    onClose,
}: {
    sessionId: string;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [detail, setDetail] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        }}>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'oklch(0% 0 0 / 0.35)' }}
            />

            {/* Panel */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: 480, maxWidth: '95vw', height: '100vh',
                background: T.surface, boxShadow: '-4px 0 24px oklch(0% 0 0 / 0.12)',
                overflowY: 'auto', display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                    position: 'sticky', top: 0, background: T.surface, zIndex: 1,
                }}>
                    <span style={{ fontWeight: 700, fontSize: T.fontMd }}>
                        {t('sessions.detail.title')}
                    </span>
                    <button
                        onClick={onClose}
                        aria-label={t('sessions.detail.close')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 20, color: T.textMuted, lineHeight: 1,
                            padding: '2px 6px', borderRadius: T.radiusSm,
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ padding: '16px 20px', flex: 1 }}>
                    <ErrorMsg msg={error} />

                    {loading && (
                        <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
                    )}

                    {detail && (
                        <>
                            {/* Meta info */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr',
                                gap: '8px 16px', marginBottom: 20,
                                fontSize: T.fontSm,
                            }}>
                                {[
                                    [t('sessions.outcome'),    <OutcomeBadge key="o" outcome={detail.outcome} />],
                                    [t('sessions.conversion'), detail.has_conversion ? `✓ ${t('sessions.yes')}` : `— ${t('sessions.no')}`],
                                    [t('sessions.scenarioId'), `#${detail.scenario_id}`],
                                    [t('sessions.startedAt'),  detail.started_at],
                                    [t('sessions.endedAt'),    detail.ended_at ?? '—'],
                                ].map(([label, val]) => (
                                    <div key={String(label)}>
                                        <div style={{ color: T.textMuted, marginBottom: 2 }}>{label}</div>
                                        <div style={{ color: T.text }}>{val}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Session ID */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: T.fontXs, color: T.textMuted, marginBottom: 4 }}>ID</div>
                                <code style={{
                                    fontSize: T.fontXs, color: T.textMuted,
                                    wordBreak: 'break-all',
                                }}>
                                    {detail.id}
                                </code>
                            </div>

                            {/* Collected variables */}
                            {Object.keys(detail.variables).length > 0 && (
                                <section style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: T.fontSm, fontWeight: 700, marginBottom: 8, color: T.text }}>
                                        {t('sessions.detail.variables')}
                                    </h3>
                                    <div style={{
                                        background: T.bg, borderRadius: T.radiusMd,
                                        border: `1px solid ${T.border}`, overflow: 'hidden',
                                    }}>
                                        {Object.entries(detail.variables).map(([key, val], i) => (
                                            <div
                                                key={key}
                                                style={{
                                                    display: 'flex', gap: 12,
                                                    padding: '7px 12px', fontSize: T.fontSm,
                                                    background: i % 2 === 1 ? T.tableRow : 'transparent',
                                                    borderBottom: i < Object.keys(detail.variables).length - 1
                                                        ? `1px solid ${T.border}` : 'none',
                                                }}
                                            >
                                                <span style={{ color: T.textMuted, minWidth: 100, flexShrink: 0 }}>{key}</span>
                                                <span style={{ color: T.text, wordBreak: 'break-all' }}>{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Messages */}
                            <section>
                                <h3 style={{ fontSize: T.fontSm, fontWeight: 700, marginBottom: 10, color: T.text }}>
                                    {t('sessions.detail.messages')} ({detail.messages.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {detail.messages.map((msg, i) => {
                                        const isBot = msg.role === 'bot';
                                        return (
                                            <div
                                                key={msg.id ?? i}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: isBot ? 'row' : 'row-reverse',
                                                    gap: 8, alignItems: 'flex-end',
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: T.fontXs, color: T.textMuted,
                                                    flexShrink: 0, paddingBottom: 4,
                                                }}>
                                                    {isBot ? '🤖' : '👤'}
                                                </div>
                                                <div style={{
                                                    maxWidth: '80%',
                                                    padding: '8px 12px', borderRadius: T.radiusMd,
                                                    background: isBot ? T.bg : 'oklch(92% 0.08 250)',
                                                    border: `1px solid ${T.border}`,
                                                    fontSize: T.fontSm, color: T.text,
                                                    lineHeight: 1.5,
                                                }}>
                                                    {msg.content}
                                                    <div style={{
                                                        marginTop: 4, fontSize: T.fontXs, color: T.textMuted,
                                                        textAlign: isBot ? 'left' : 'right',
                                                    }}>
                                                        {msg.created_at}
                                                    </div>
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
            </div>
        </div>
    );
}

// ── SessionsPage ──────────────────────────────────────────────────────────────

export default function SessionsPage() {
    const { t } = useTranslation();

    const [sessions, setSessions]   = useState<SessionSummary[]>([]);
    const [total, setTotal]         = useState(0);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // フィルター
    const [outcome, setOutcome]             = useState<SessionOutcome | ''>('');
    const [hasConversion, setHasConversion] = useState<'' | '0' | '1'>('');
    const [offset, setOffset]               = useState(0);
    const limit = 50;

    useEffect(() => {
        setLoading(true);
        setError(null);
        void listSessions({
            ...(outcome         ? { outcome: outcome as SessionOutcome }       : {}),
            ...(hasConversion   ? { has_conversion: Number(hasConversion) as 0 | 1 } : {}),
            limit,
            offset,
        }).then(res => {
            setSessions(res.data);
            setTotal(res.meta.total);
        }).catch(err => {
            setError(err instanceof ApiError ? err.message : t('sessions.loadError'));
        }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [outcome, hasConversion, offset]);

    const totalPages  = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const selectStyle = {
        height: '32px', padding: '0 8px', boxSizing: 'border-box',
        borderRadius: T.radiusMd,
        border: `1.5px solid ${T.borderInput}`, background: T.surface,
        color: T.text, fontSize: T.fontSm,
        outline: 'none', cursor: 'pointer',
    } as const;

    return (
        <div>
            <PageTitle>{t('sessions.pageTitle')}</PageTitle>

            {/* フィルターバー */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Outcome */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: T.fontSm, color: T.textMuted }}>
                    {t('sessions.filterOutcome')}:
                    <select
                        value={outcome}
                        onChange={e => { setOutcome(e.target.value as SessionOutcome | ''); setOffset(0); }}
                        style={selectStyle}
                    >
                        <option value="">{t('sessions.all')}</option>
                        <option value="active">{t('sessions.active')}</option>
                        <option value="completed">{t('sessions.completed')}</option>
                        <option value="dropped">{t('sessions.dropped')}</option>
                        <option value="converted">{t('sessions.converted')}</option>
                    </select>
                </label>

                {/* Conversion */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: T.fontSm, color: T.textMuted }}>
                    {t('sessions.filterConversion')}:
                    <select
                        value={hasConversion}
                        onChange={e => { setHasConversion(e.target.value as '' | '0' | '1'); setOffset(0); }}
                        style={selectStyle}
                    >
                        <option value="">{t('sessions.all')}</option>
                        <option value="1">✓ {t('sessions.yes')}</option>
                        <option value="0">— {t('sessions.no')}</option>
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
                ) : sessions.length === 0 ? (
                    <p style={{ padding: '20px 24px', color: T.textMuted }}>{t('sessions.empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: T.fontSm }}>
                            <thead>
                                <tr style={{ background: T.tableHeader, borderBottom: `1px solid ${T.border}` }}>
                                    {[
                                        t('sessions.outcome'),
                                        t('sessions.scenarioId'),
                                        t('sessions.conversion'),
                                        t('sessions.startedAt'),
                                        t('sessions.endedAt'),
                                    ].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', textAlign: 'left',
                                            fontWeight: 600, color: T.textMuted, whiteSpace: 'nowrap',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s, i) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => setSelectedId(s.id)}
                                        style={{
                                            borderBottom: `1px solid ${T.border}`,
                                            background: i % 2 === 1 ? T.tableRow : 'transparent',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.surfaceHover)}
                                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? T.tableRow : 'transparent')}
                                    >
                                        <td style={{ padding: '9px 16px' }}>
                                            <OutcomeBadge outcome={s.outcome} />
                                        </td>
                                        <td style={{ padding: '9px 16px', color: T.textMuted }}>
                                            #{s.scenario_id}
                                        </td>
                                        <td style={{ padding: '9px 16px', color: s.has_conversion ? 'oklch(40% 0.14 150)' : T.textMuted }}>
                                            {s.has_conversion ? `✓ ${t('sessions.yes')}` : `— ${t('sessions.no')}`}
                                        </td>
                                        <td style={{ padding: '9px 16px', color: T.textMuted, whiteSpace: 'nowrap' }}>
                                            {s.started_at}
                                        </td>
                                        <td style={{ padding: '9px 16px', color: T.textMuted, whiteSpace: 'nowrap' }}>
                                            {s.ended_at ?? '—'}
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
                            height: '32px', padding: '0 14px', boxSizing: 'border-box',
                            borderRadius: T.radiusMd,
                            border: `1.5px solid ${T.border}`, background: T.surface,
                            color: T.text, fontSize: T.fontSm, fontWeight: 500,
                            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage <= 1 ? 0.45 : 1,
                            transition: 'filter 150ms ease',
                        }}
                        onMouseEnter={e => { if (currentPage > 1) e.currentTarget.style.filter = 'brightness(0.92)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
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
                            height: '32px', padding: '0 14px', boxSizing: 'border-box',
                            borderRadius: T.radiusMd,
                            border: `1.5px solid ${T.border}`, background: T.surface,
                            color: T.text, fontSize: T.fontSm, fontWeight: 500,
                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage >= totalPages ? 0.45 : 1,
                            transition: 'filter 150ms ease',
                        }}
                        onMouseEnter={e => { if (currentPage < totalPages) e.currentTarget.style.filter = 'brightness(0.92)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Detail panel */}
            {selectedId !== null && (
                <SessionDetailPanel
                    sessionId={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
}

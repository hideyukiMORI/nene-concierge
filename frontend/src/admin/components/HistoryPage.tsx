import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
    searchScenarioRevisions, listScenarios,
    ApiError,
    type ScenarioRevisionListItem, type ScenarioRevisionOperation,
    type ScenarioSummary,
} from '../api.js';
import { PageHead, Card, ErrorMsg, useLayout } from './Layout.js';
import { MobileHeader, MobileIconBtn, CardList, ListItem, MetaDot, Pill, FilterChips, Chip } from './mobile/index.js';
import type { PillVariant } from './mobile/index.js';
import RevisionDiffModal from './RevisionDiffModal.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

const OPERATIONS: ScenarioRevisionOperation[] = ['create', 'update', 'graph_save', 'status_change', 'delete'];

function opPillVariant(op: ScenarioRevisionOperation): PillVariant {
    switch (op) {
        case 'create':        return 'success';
        case 'update':        return 'active';
        case 'graph_save':    return 'active';
        case 'status_change': return 'draft';
        case 'delete':        return 'failure';
    }
}

const PAG_BTN: React.CSSProperties = {
    height: T.controlHeightSm, padding: '0 14px', boxSizing: 'border-box',
    borderRadius: T.radiusMd,
    border: `1px solid ${T.border}`, background: T.surface,
    color: T.text, fontSize: T.fontSm, fontWeight: 500,
    cursor: 'pointer', transition: 'filter 150ms ease',
};

const TH: React.CSSProperties = {
    textAlign: 'left', padding: '10px 12px',
    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    fontWeight: 600,
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: T.fontSm, color: T.text,
    verticalAlign: 'middle',
};

const filterSelectStyle: React.CSSProperties = {
    height: 28, padding: '0 8px',
    borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
    background: T.surface, color: T.text,
    fontSize: T.fontXs, fontFamily: MONO,
    cursor: 'pointer', outline: 'none',
};

const filterInputStyle: React.CSSProperties = {
    height: 28, padding: '0 8px',
    borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
    background: T.surface, color: T.text,
    fontSize: T.fontXs,
    outline: 'none', boxSizing: 'border-box',
};

export default function HistoryPage() {
    const { t } = useTranslation();
    const { isMobile } = useLayout();

    const [items, setItems]   = useState<ScenarioRevisionListItem[]>([]);
    const [total, setTotal]   = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState<string | null>(null);
    const [diffId, setDiffId] = useState<number | null>(null);

    // filters
    const [scenarioId, setScenarioId]   = useState<string>('');
    const [operation, setOperation]     = useState<ScenarioRevisionOperation | ''>('');
    const [query, setQuery]             = useState<string>('');
    const [queryInput, setQueryInput]   = useState<string>('');
    const [dateFrom, setDateFrom]       = useState<string>('');
    const [dateTo, setDateTo]           = useState<string>('');
    const [offset, setOffset]           = useState(0);
    const limit = 50;

    // scenario list for dropdown
    const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);

    useEffect(() => {
        let cancelled = false;
        listScenarios()
            .then(r => { if (!cancelled) setScenarios(r.data); })
            .catch(() => { /* ignore — dropdown stays empty */ });
        return () => { cancelled = true; };
    }, []);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await searchScenarioRevisions({
                ...(scenarioId ? { scenario_id: Number(scenarioId) } : {}),
                ...(operation  ? { operation } : {}),
                ...(query      ? { q: query } : {}),
                ...(dateFrom   ? { date_from: dateFrom } : {}),
                ...(dateTo     ? { date_to:   dateTo } : {}),
            }, limit, offset);
            setItems(res.data);
            setTotal(res.meta.total);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('common.error.fetch'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, [scenarioId, operation, query, dateFrom, dateTo, offset]); // eslint-disable-line react-hooks/exhaustive-deps

    const subtitle    = loading ? '…' : t('history.subtitle', { total: String(total) });
    const totalPages  = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.floor(offset / limit) + 1;

    function resetOffset() { setOffset(0); }

    const Pager = useMemo(() => () => (
        totalPages > 1 ? (
            <div style={{
                display: 'flex', justifyContent: 'center', gap: 8,
                margin: '12px 0', alignItems: 'center',
                fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
            }}>
                <button disabled={currentPage <= 1}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    style={{ ...PAG_BTN, opacity: currentPage <= 1 ? 0.45 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}>← {t('common.prev')}</button>
                <span>{currentPage} / {totalPages}</span>
                <button disabled={currentPage >= totalPages}
                    onClick={() => setOffset(offset + limit)}
                    style={{ ...PAG_BTN, opacity: currentPage >= totalPages ? 0.45 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}>{t('common.next')} →</button>
            </div>
        ) : null
    ), [totalPages, currentPage, offset, t]);

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title={t('history.pageTitle')}
                    subtitle={subtitle}
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

                <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <input
                        value={queryInput}
                        onChange={e => setQueryInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { setQuery(queryInput); resetOffset(); }}}
                        placeholder={t('history.searchPlaceholder')}
                        style={{ ...filterInputStyle, flex: 1, minWidth: 0 }}
                    />
                    <select value={operation}
                        onChange={e => { setOperation((e.target.value as ScenarioRevisionOperation | '')); resetOffset(); }}
                        style={filterSelectStyle}>
                        <option value="">{t('history.allOps')}</option>
                        {OPERATIONS.map(op => <option key={op} value={op}>{t(`history.op.${op}`)}</option>)}
                    </select>
                </div>

                <FilterChips>
                    <Chip active={scenarioId === ''} onClick={() => { setScenarioId(''); resetOffset(); }}>
                        {t('history.allScenarios')}
                    </Chip>
                    {scenarios.slice(0, 8).map(s => (
                        <Chip key={s.id} active={scenarioId === String(s.id)}
                            onClick={() => { setScenarioId(String(s.id)); resetOffset(); }}>
                            {s.name}
                        </Chip>
                    ))}
                </FilterChips>

                {error && (
                    <div style={{ padding: '12px 12px 0' }}>
                        <ErrorMsg msg={error} />
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted, fontSize: T.fontSm }}>
                        {t('common.loading')}
                    </div>
                ) : items.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted, fontSize: T.fontSm }}>
                        {t('history.empty')}
                    </div>
                ) : (
                    <CardList>
                        {items.map((r, i) => (
                            <ListItem
                                key={r.id}
                                last={i === items.length - 1}
                                title={r.scenario_name ?? `#${r.scenario_id}`}
                                meta={
                                    <>
                                        <Pill variant={opPillVariant(r.operation)} label={t(`history.op.${r.operation}`)} />
                                        <MetaDot />
                                        <span>{r.user_email ?? t('history.unknownUser')}</span>
                                        <MetaDot />
                                        <span style={{ fontFamily: MONO }}>{r.created_at ?? ''}</span>
                                    </>
                                }
                                onClick={() => setDiffId(r.id)}
                            />
                        ))}
                    </CardList>
                )}

                <Pager />
                <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }}/>

                <RevisionDiffModal revisionId={diffId} onClose={() => setDiffId(null)} />
            </div>
        );
    }

    // ─────────── Desktop ───────────
    return (
        <div>
            <PageHead title={t('history.pageTitle')} subtitle={subtitle} />

            <ErrorMsg msg={error} />

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {t('history.filter.scenario')}:
                    <select value={scenarioId}
                        onChange={e => { setScenarioId(e.target.value); resetOffset(); }}
                        style={filterSelectStyle}>
                        <option value="">{t('history.allScenarios')}</option>
                        {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {t('history.filter.operation')}:
                    <select value={operation}
                        onChange={e => { setOperation(e.target.value as ScenarioRevisionOperation | ''); resetOffset(); }}
                        style={filterSelectStyle}>
                        <option value="">{t('history.allOps')}</option>
                        {OPERATIONS.map(op => <option key={op} value={op}>{t(`history.op.${op}`)}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {t('history.filter.from')}:
                    <input type="date" value={dateFrom}
                        onChange={e => { setDateFrom(e.target.value); resetOffset(); }}
                        style={filterInputStyle} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {t('history.filter.to')}:
                    <input type="date" value={dateTo}
                        onChange={e => { setDateTo(e.target.value); resetOffset(); }}
                        style={filterInputStyle} />
                </label>
                <input
                    value={queryInput}
                    onChange={e => setQueryInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setQuery(queryInput); resetOffset(); } }}
                    onBlur={() => { if (queryInput !== query) { setQuery(queryInput); resetOffset(); } }}
                    placeholder={t('history.searchPlaceholder')}
                    style={{ ...filterInputStyle, minWidth: 180 }}
                />
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    {total} records
                </span>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('common.loading')}</p>
                ) : items.length === 0 ? (
                    <p style={{ padding: '20px 18px', color: T.textMuted }}>{t('history.empty')}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...TH, width: 60 }}>#</th>
                                    <th style={{ ...TH, width: 120 }}>{t('history.col.operation')}</th>
                                    <th style={TH}>{t('history.col.scenario')}</th>
                                    <th style={{ ...TH, width: 220 }}>{t('history.col.user')}</th>
                                    <th style={{ ...TH, width: 90 }}>{t('history.col.nodes')}</th>
                                    <th style={{ ...TH, width: 170 }}>{t('history.col.when')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((r, i) => (
                                    <tr key={r.id}
                                        onClick={() => setDiffId(r.id)}
                                        style={{
                                            borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                                        <td style={{ ...TD, fontFamily: MONO, color: T.textFaint }}>{r.revision_no}</td>
                                        <td style={TD}>
                                            <Pill variant={opPillVariant(r.operation)} label={t(`history.op.${r.operation}`)} />
                                        </td>
                                        <td style={TD}>
                                            <Link to={`/scenarios/${r.scenario_id}/edit`}
                                                style={{ color: T.text, textDecoration: 'none', fontWeight: 500 }}>
                                                {r.scenario_name ?? `#${r.scenario_id}`}
                                            </Link>
                                            {r.name && r.name !== r.scenario_name && (
                                                <div style={{ fontSize: T.fontXs, color: T.textMuted, marginTop: 2 }}>
                                                    {r.name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ ...TD, color: T.textMuted, fontSize: T.fontXs }}>
                                            {r.user_email ?? t('history.unknownUser')}
                                        </td>
                                        <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                                            {r.node_count}N · {r.edge_count}E
                                        </td>
                                        <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                                            {r.created_at ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Pager />

            <RevisionDiffModal revisionId={diffId} onClose={() => setDiffId(null)} />
        </div>
    );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { listScenarios, deleteScenario, ApiError } from '../api.js';
import type { ScenarioSummary } from '../api.js';
import { PageHead, Card, Btn, StatusPill, ErrorMsg, trHover, useLayout, TH, FILTER_SELECT } from './Layout.js';
import {
    MobileHeader, MobileIconBtn, FilterChips, Chip, CardList, ListItem,
    SwipeRow, FAB, Pill, MetaDot, SkeletonListItem,
} from './mobile/index.js';
import type { PillVariant } from './mobile/index.js';
import { useModals } from './modal/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const MONO = T.fontMono;

type StatusFilter = '' | 'published' | 'draft' | 'archived';

const STATUS_TO_PILL: Record<'draft' | 'published' | 'archived', PillVariant> = {
    published: 'success',
    draft:     'draft',
    archived:  'archived',
};

export default function ScenariosPage() {
    const { t } = useTranslation();
    const nav   = useNavigate();
    const { isMobile } = useLayout();
    const { confirm, alertDialog } = useModals();
    const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listScenarios();
            setScenarios(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarios.loadError'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleDelete(id: number, name: string) {
        const ok = await confirm({
            title: t('scenarios.confirmDeleteTitle'),
            description: t('scenarios.confirmDelete', { name }),
            tone: 'danger',
            confirmLabel: t('common.delete'),
        });
        if (!ok) return;
        try {
            await deleteScenario(id);
            setScenarios(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            void alertDialog({
                title: t('scenarios.deleteError'),
                description: err instanceof ApiError ? err.message : undefined,
                tone: 'danger',
            });
        }
    }

    const filtered = statusFilter
        ? scenarios.filter(s => s.status === statusFilter)
        : scenarios;

    const published = scenarios.filter(s => s.status === 'published').length;
    const subtitle = loading
        ? '…'
        : `${scenarios.length} total · ${published} published`;

    const filterSelectStyle = FILTER_SELECT;

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        const countAll       = scenarios.length;
        const countPublished = scenarios.filter(s => s.status === 'published').length;
        const countDraft     = scenarios.filter(s => s.status === 'draft').length;
        const countArchived  = scenarios.filter(s => s.status === 'archived').length;

        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Scenarios"
                    subtitle={loading ? '…' : `${countAll} total · ${countPublished} published`}
                    trailing={
                        <MobileIconBtn ariaLabel={t('common.search')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                                <circle cx="11" cy="11" r="7"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </MobileIconBtn>
                    }
                />

                <FilterChips>
                    <Chip active={statusFilter === ''}          onClick={() => setStatusFilter('')}>all · {countAll}</Chip>
                    <Chip active={statusFilter === 'published'} onClick={() => setStatusFilter('published')}>published · {countPublished}</Chip>
                    <Chip active={statusFilter === 'draft'}     onClick={() => setStatusFilter('draft')}>draft · {countDraft}</Chip>
                    <Chip active={statusFilter === 'archived'}  onClick={() => setStatusFilter('archived')}>archived · {countArchived}</Chip>
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
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: T.textMuted }}>
                        <div style={{ fontSize: T.fontMd, marginBottom: 4 }}>{t('scenarios.empty')}</div>
                        <div style={{ fontSize: T.fontSm }}>{t('scenarios.emptyHint')}</div>
                    </div>
                ) : (
                    <CardList>
                        {filtered.map((s, i) => {
                            const isLast = i === filtered.length - 1;
                            const item = (
                                <ListItem
                                    last={isLast}
                                    icon={String(s.id).padStart(2, '0')}
                                    title={s.name}
                                    meta={
                                        <>
                                            <Pill variant={STATUS_TO_PILL[s.status]} label={s.status} />
                                            {s.updated_at && (
                                                <>
                                                    <MetaDot />
                                                    <span>{s.updated_at.slice(5, 16).replace('T', ' ')}</span>
                                                </>
                                            )}
                                        </>
                                    }
                                    onClick={() => nav(`/scenarios/${s.id}`)}
                                />
                            );
                            return (
                                <SwipeRow
                                    key={s.id}
                                    actionLabel={t('common.delete')}
                                    onAction={() => void handleDelete(s.id, s.name)}>
                                    {item}
                                </SwipeRow>
                            );
                        })}
                    </CardList>
                )}

                <div style={{ height: 'calc(96px + env(safe-area-inset-bottom))' }}/>

                <FAB ariaLabel={t('common.new')} onClick={() => nav('/scenarios/new')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                    </svg>
                </FAB>
            </div>
        );
    }

    // ─────────── Desktop / Tablet layout ───────────
    return (
        <div>
            <PageHead title="Scenarios" subtitle={subtitle}>
                {/* Inline search box (no-op) */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    height: T.controlHeight,
                    padding: '0 10px',
                    border: `1px solid ${T.border}`,
                    borderRadius: T.radiusMd,
                    background: T.surface, color: T.textMuted,
                    fontSize: T.fontSm,
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span style={{ fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted }}>name, description…</span>
                </div>
                <Link to="/scenarios/new">
                    <Btn>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <line x1="12" y1="5" x2="12" y2="19"/>
                        </svg>
                        新規シナリオ
                    </Btn>
                </Link>
            </PageHead>

            <ErrorMsg msg={error} />

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                    letterSpacing: '0.04em',
                }}>
                    status:
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} style={filterSelectStyle}>
                        <option value="">all</option>
                        <option value="published">published</option>
                        <option value="draft">draft</option>
                        <option value="archived">archived</option>
                    </select>
                </label>
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                    letterSpacing: '0.04em',
                }}>
                    sort:
                    <select style={filterSelectStyle}>
                        <option>updated ↓</option>
                        <option>name a–z</option>
                        <option>created ↓</option>
                    </select>
                </label>
                <span style={{
                    marginLeft: 'auto', fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted,
                }}>
                    {filtered.length} records
                </span>
            </div>

            {loading ? (
                <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
            ) : filtered.length === 0 ? (
                <Card>
                    <p style={{ color: T.textMuted, textAlign: 'center', padding: '40px 0' }}>
                        {t('scenarios.empty')}<br />
                        <span style={{ fontSize: T.fontSm }}>{t('scenarios.emptyHint')}</span>
                    </p>
                </Card>
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ ...TH, width: 44 }}>id</th>
                                <th style={TH}>name</th>
                                <th style={TH}>description</th>
                                <th style={{ ...TH, width: 120 }}>status</th>
                                <th style={{ ...TH, width: 140 }}>updated</th>
                                <th style={{ ...TH, width: 140, textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr
                                    key={s.id}
                                    style={{
                                        borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                                        transition: 'background 100ms ease',
                                    }}
                                    {...trHover}
                                >
                                    {/* id */}
                                    <td style={{
                                        padding: '9px 14px',
                                        fontFamily: MONO, fontSize: T.fontXs, color: T.textFaint,
                                        width: 40,
                                    }}>
                                        {String(s.id).padStart(2, '0')}
                                    </td>
                                    {/* name */}
                                    <td style={{ padding: '9px 14px', fontWeight: 600 }}>
                                        <Link to={`/scenarios/${s.id}`} style={{ color: T.primary, textDecoration: 'none' }}>
                                            {s.name}
                                        </Link>
                                    </td>
                                    {/* description */}
                                    <td style={{ padding: '9px 14px', color: T.textMuted, fontSize: T.fontSm, maxWidth: 200 }}>
                                        {s.description ?? '—'}
                                    </td>
                                    {/* status */}
                                    <td style={{ padding: '9px 14px' }}>
                                        <StatusPill variant={s.status} />
                                    </td>
                                    {/* updated */}
                                    <td style={{ padding: '9px 14px', fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted }}>
                                        {s.updated_at?.slice(5, 16) ?? '—'}
                                    </td>
                                    {/* actions */}
                                    <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <Link to={`/scenarios/${s.id}`}>
                                                <Btn variant="ghost" style={{ height: T.controlHeightSm, padding: '0 10px', fontSize: T.fontXs }}>
                                                    編集
                                                </Btn>
                                            </Link>
                                            <Btn
                                                variant="danger"
                                                style={{ height: T.controlHeightSm, padding: '0 10px', fontSize: T.fontXs }}
                                                onClick={() => void handleDelete(s.id, s.name)}
                                            >
                                                削除
                                            </Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}

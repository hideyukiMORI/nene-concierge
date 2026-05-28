import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listScenarios, deleteScenario, ApiError } from '../api.js';
import type { ScenarioSummary } from '../api.js';
import { PageHead, Card, Btn, StatusPill, ErrorMsg, trHover } from './Layout.js';
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

export default function ScenariosPage() {
    const { t } = useTranslation();
    const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

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
        if (!confirm(t('scenarios.confirmDelete', { name }))) return;
        try {
            await deleteScenario(id);
            setScenarios(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert(err instanceof ApiError ? err.message : t('scenarios.deleteError'));
        }
    }

    const filtered = statusFilter
        ? scenarios.filter(s => s.status === statusFilter)
        : scenarios;

    const published = scenarios.filter(s => s.status === 'published').length;
    const subtitle = loading
        ? '…'
        : `${scenarios.length} total · ${published} published`;

    const filterSelectStyle: React.CSSProperties = {
        height: 26, padding: '0 8px',
        borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
        background: T.surface, color: T.text,
        fontSize: T.fontXs, fontFamily: MONO,
        cursor: 'pointer', outline: 'none',
    };

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
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterSelectStyle}>
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

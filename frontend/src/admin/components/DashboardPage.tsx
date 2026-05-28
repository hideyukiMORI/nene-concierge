import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { getDashboard, listScenarios, listActionLogs, ApiError } from '../api.js';
import type { DashboardStats, ScenarioSummary, ActionLogEntry } from '../api.js';
import { PageHead, Card, CardSub, SectionHead, AdapterTag, ErrorMsg, useLayout, isWideBp, isUltraWideBp } from './Layout.js';
import {
    MobileHeader, MobileIconBtn, MobileSectionHead, KpiGrid, KpiCard as MKpiCard,
    AlertCard, CardList, ListItem, MetaDot, PullToRefreshHint,
} from './mobile/index.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

const MONO = T.fontMono;

// ── Table shared styles ────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
    padding: '8px 14px', textAlign: 'left',
    fontSize: T.fontXs, fontWeight: 700, color: T.textMuted,
    fontFamily: MONO, letterSpacing: '0.05em', textTransform: 'uppercase',
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
};

const TD: React.CSSProperties = {
    padding: '9px 14px', fontSize: T.fontSm, color: T.text,
    borderBottom: `1px solid ${T.border}`,
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    unit,
    valueColor,
    meta,
    alert,
}: {
    label:       string;
    value:       number | string;
    unit?:       string;
    valueColor?: string;
    meta?:       string;
    alert?:      boolean;
}) {
    return (
        <div style={{
            background: alert ? T.dangerBg : T.surface,
            border: `1px solid ${alert ? T.dangerBorder : T.border}`,
            borderRadius: T.radiusLg,
            padding: '16px 18px',
            boxShadow: T.shadowCard,
            display: 'flex', flexDirection: 'column', gap: 6,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: T.fontXs, fontWeight: 700, color: T.textMuted,
                fontFamily: MONO, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: 'currentColor', flexShrink: 0 }} />
                {label}
            </div>
            <div style={{
                fontSize: '2rem', fontWeight: 800, lineHeight: 1,
                color: valueColor ?? (alert ? T.dangerFg : T.textStrong),
            }}>
                {value}
                {unit && (
                    <span style={{ fontSize: T.fontSm, fontWeight: 400, color: T.textMuted, marginLeft: 3 }}>
                        {unit}
                    </span>
                )}
            </div>
            {meta && (
                <div style={{ fontSize: T.fontXs, color: T.textMuted, fontFamily: MONO }}>{meta}</div>
            )}
        </div>
    );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function SparklineCard({ data }: { data: { date: string; count: number }[] }) {
    if (data.length === 0) return null;

    const max    = Math.max(...data.map(d => d.count), 1);
    const W      = 720;
    const H      = 120;
    const pad    = 10;
    const n      = data.length;
    const xStep  = n > 1 ? (W - pad * 2) / (n - 1) : 0;

    const pts = data.map((d, i) => {
        const x = pad + i * xStep;
        const y = pad + (1 - d.count / max) * (H - pad * 2 - 10);
        return [x, y] as [number, number];
    });

    const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
    const fill = `${pts[0][0]},${H} ${polyline} ${pts[pts.length-1][0]},${H}`;

    const dateRange = n > 0
        ? `${data[0].date.slice(5)} → ${data[n-1].date.slice(5)}`
        : '';

    return (
        <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div>
                    <CardSub>sessions · daily</CardSub>
                    <div style={{ fontWeight: 700, fontSize: T.fontMd, color: T.textStrong }}>日別セッション数</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted }}>
                    7 days · {dateRange}
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120, display: 'block' }} preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={T.primary} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={T.primary} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {/* gridlines at 25% 50% 75% */}
                {[0.25, 0.5, 0.75].map(y => (
                    <line key={y}
                        x1="0" x2={W}
                        y1={pad + y * (H - pad * 2 - 10)}
                        y2={pad + y * (H - pad * 2 - 10)}
                        stroke={T.border} strokeWidth="0.7" strokeDasharray="2 3"
                    />
                ))}
                <polygon points={fill} fill="url(#sparkGrad)" />
                <polyline points={polyline} fill="none" stroke={T.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {pts.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={3} fill={T.primary} />
                ))}
            </svg>
            <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: 8,
                fontFamily: MONO, fontSize: T.fontXs, color: T.textFaint,
            }}>
                {data.map(d => (
                    <span key={d.date}>{d.date.slice(5)}</span>
                ))}
            </div>
        </Card>
    );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { t } = useTranslation();
    const nav   = useNavigate();
    const { isMobile, bp, setFullWidth } = useLayout();
    const wide      = isWideBp(bp);
    const ultraWide = isUltraWideBp(bp);

    // wide+ で main の maxWidth は Dashboard 側で管理する (1480 / 1720)
    useEffect(() => {
        if (!wide) return;
        setFullWidth(true);
        return () => { setFullWidth(false); };
    }, [wide, setFullWidth]);

    const [stats, setStats]         = useState<DashboardStats | null>(null);
    const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
    const [failures, setFailures]   = useState<ActionLogEntry[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [dashRes, scenRes, logRes] = await Promise.all([
                getDashboard(),
                listScenarios(),
                listActionLogs({ status: 'failure', limit: 3 }),
            ]);
            setStats(dashRes.data);
            // show published first, up to 3
            const sorted = [...scenRes.data].sort((a, b) => {
                if (a.status === 'published' && b.status !== 'published') return -1;
                if (b.status === 'published' && a.status !== 'published') return 1;
                return 0;
            });
            setScenarios(sorted.slice(0, 3));
            setFailures(logRes.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('dashboard.loadError'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const cvRate = stats?.conversion_rate_7d ?? 0;
    const cvColor = cvRate >= 10 ? T.successFg : cvRate >= 3 ? T.text : T.dangerFg;
    const cvVariant: 'success' | 'default' | 'danger' = cvRate >= 10 ? 'success' : cvRate >= 3 ? 'default' : 'danger';

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    title="Dashboard"
                    subtitle="overview · 7d"
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

                <PullToRefreshHint refreshing={loading && stats !== null} label="refreshing" />

                {error && (
                    <div style={{ padding: '0 12px 12px' }}>
                        <ErrorMsg msg={error} />
                    </div>
                )}

                {/* Alert card — failures > 0 */}
                {stats !== null && stats.action_failures_24h > 0 && (
                    <AlertCard
                        title={`${stats.action_failures_24h} 件のアクション失敗`}
                        desc="直近 24h"
                        onClick={() => nav('/action-logs')}
                    />
                )}

                {loading && stats === null ? (
                    <div style={{ padding: 20, color: T.textMuted, fontSize: T.fontSm, textAlign: 'center' }}>
                        {t('common.loading')}
                    </div>
                ) : stats !== null ? (
                    <>
                        <MobileSectionHead label="key metrics · 7d" />
                        <KpiGrid>
                            <MKpiCard
                                label="sessions"
                                value={stats.sessions_7d.toLocaleString()}
                                meta="last 7 days"
                            />
                            <MKpiCard
                                label="conversions"
                                value={stats.converted_7d.toLocaleString()}
                                meta="last 7 days"
                            />
                            <MKpiCard
                                label="cv rate"
                                value={stats.conversion_rate_7d.toFixed(1)}
                                unit="%"
                                valueColor={cvVariant === 'default' ? 'default' : cvVariant}
                                meta="target 10%"
                            />
                            <MKpiCard
                                label="active now"
                                value={stats.active_sessions.toLocaleString()}
                                valueColor="accent"
                                meta="live"
                            />
                            <MKpiCard
                                label="published"
                                value={stats.published_scenarios.toLocaleString()}
                                meta="scenarios"
                            />
                            <MKpiCard
                                label="failures · 24h"
                                value={stats.action_failures_24h.toLocaleString()}
                                valueColor={stats.action_failures_24h > 0 ? 'danger' : 'default'}
                                alert={stats.action_failures_24h > 0}
                                meta={stats.action_failures_24h > 0 ? 'see logs' : 'all good'}
                            />
                        </KpiGrid>

                        {/* Sparkline */}
                        {stats.daily_sessions.length > 0 && (
                            <div style={{ margin: '4px 12px 14px' }}>
                                <SparklineCard data={stats.daily_sessions} />
                            </div>
                        )}

                        {/* Top scenarios */}
                        <MobileSectionHead
                            label="top scenarios"
                            action={
                                <Link to="/scenarios" style={{
                                    fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                    color: T.primary, textDecoration: 'none',
                                }}>all →</Link>
                            }
                        />
                        {scenarios.length > 0 ? (
                            <CardList>
                                {scenarios.map((s, i) => (
                                    <ListItem
                                        key={s.id}
                                        last={i === scenarios.length - 1}
                                        icon={String(i + 1).padStart(2, '0')}
                                        title={s.name}
                                        meta={
                                            <>
                                                <span>{s.status}</span>
                                                {s.updated_at && <>
                                                    <MetaDot />
                                                    <span>{s.updated_at.slice(0, 10)}</span>
                                                </>}
                                            </>
                                        }
                                        onClick={() => nav(`/scenarios/${s.id}`)}
                                    />
                                ))}
                            </CardList>
                        ) : (
                            <div style={{ padding: '12px 24px', color: T.textMuted, fontSize: T.fontSm }}>
                                —
                            </div>
                        )}

                        {/* Recent failures — モバイルは alert card で総数を出しているので、
                            詳細を一覧表示。failures が空でも明示しない */}
                        {failures.length > 0 && (
                            <>
                                <MobileSectionHead
                                    label="recent failures"
                                    action={
                                        <Link to="/action-logs" style={{
                                            fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                                            letterSpacing: '0.06em', textTransform: 'uppercase',
                                            color: T.primary, textDecoration: 'none',
                                        }}>all →</Link>
                                    }
                                />
                                <CardList>
                                    {failures.map((log, i) => (
                                        <ListItem
                                            key={log.id ?? i}
                                            last={i === failures.length - 1}
                                            failure
                                            icon={<AdapterTag adapter={log.adapter} />}
                                            title={log.error_message ?? '—'}
                                            meta={
                                                <>
                                                    <span>{log.executed_at?.slice(11, 16) ?? '—'}</span>
                                                </>
                                            }
                                            onClick={() => nav('/action-logs')}
                                        />
                                    ))}
                                </CardList>
                            </>
                        )}

                        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }}/>
                    </>
                ) : null}
            </div>
        );
    }

    // ─────────── Desktop / Tablet / Wide layout ───────────
    // wide / ultraWide: Layout の maxWidth ラッパーを抑止して、ここで 1480 / 1720 にする
    const wideMaxWidth = ultraWide ? 1720 : wide ? 1480 : undefined;
    const wideWrap: React.CSSProperties | undefined = wide
        ? { maxWidth: wideMaxWidth, margin: '0 auto', padding: '28px 36px 48px' }
        : undefined;
    return (
        <div style={wideWrap}>
            <PageHead title="Dashboard" subtitle="overview · 7 days">
                <select style={{
                    height: T.controlHeight, padding: '0 10px',
                    borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
                    background: T.surface, color: T.text,
                    fontSize: T.fontSm, cursor: 'pointer', outline: 'none',
                }}>
                    <option>Last 7 days</option>
                    <option>Last 24 hours</option>
                    <option>Last 30 days</option>
                </select>
                <button
                    onClick={() => { void load(); }}
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
                    ↻ Refresh
                </button>
            </PageHead>

            <ErrorMsg msg={error} />

            {/* Alert banner */}
            {stats !== null && stats.action_failures_24h > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    marginBottom: 16,
                    padding: '12px 16px',
                    borderRadius: T.radiusMd,
                    background: T.dangerBg,
                    border: `1px solid ${T.dangerBorder}`,
                    color: T.dangerFg,
                    fontSize: T.fontSm,
                }}>
                    <span style={{
                        width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                        background: T.dangerFg, color: '#fff',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: T.fontXs,
                    }}>!</span>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>
                            {stats.action_failures_24h} 件のアクション失敗が直近 24 時間に発生しました
                        </div>
                        <Link to="/action-logs" style={{
                            fontSize: T.fontXs, fontFamily: MONO, color: T.dangerFg,
                            textDecoration: 'none',
                        }}>
                            → アクションログを確認
                        </Link>
                    </div>
                </div>
            )}

            {loading ? (
                <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
            ) : stats !== null ? (
                <>
                    {/* KPI grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 8,
                        marginBottom: 20,
                    }}>
                        <KpiCard
                            label="sessions · 7d"
                            value={stats.sessions_7d}
                            meta="↑ vs prev period"
                        />
                        <KpiCard
                            label="conversions · 7d"
                            value={stats.converted_7d}
                            meta="↑ vs prev period"
                        />
                        <KpiCard
                            label="cv rate"
                            value={stats.conversion_rate_7d.toFixed(1)}
                            unit="%"
                            valueColor={cvColor}
                            meta="target 10%"
                        />
                        <KpiCard
                            label="active now"
                            value={stats.active_sessions}
                            valueColor={T.primary}
                            meta="live sessions"
                        />
                        <KpiCard
                            label="published scenarios"
                            value={stats.published_scenarios}
                            meta="of total"
                        />
                        <KpiCard
                            label="action failures · 24h"
                            value={stats.action_failures_24h}
                            alert={stats.action_failures_24h > 0}
                        />
                    </div>

                    {/* Sparkline */}
                    <SparklineCard data={stats.daily_sessions} />

                    {/* Two-column (≥1600: three-column): Top scenarios + Recent failures */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: ultraWide ? 'repeat(3, 1fr)' : '1fr 1fr',
                        gap: 14,
                    }}>

                        {/* Top scenarios */}
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
                                <CardSub>top scenarios</CardSub>
                                <div style={{ fontWeight: 700, fontSize: T.fontMd, color: T.textStrong, marginTop: 2 }}>
                                    よく使われているシナリオ
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={TH}>name</th>
                                        <th style={{ ...TH, textAlign: 'right' }}>sessions</th>
                                        <th style={{ ...TH, textAlign: 'right' }}>cv</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scenarios.map((s, i) => (
                                        <tr key={s.id} style={{
                                            borderBottom: i < scenarios.length - 1 ? `1px solid ${T.border}` : 'none',
                                        }}>
                                            <td style={TD}>
                                                <Link to={`/scenarios/${s.id}`} style={{ color: T.primary, textDecoration: 'none', fontWeight: 600 }}>
                                                    {s.name}
                                                </Link>
                                            </td>
                                            <td style={{ ...TD, textAlign: 'right', fontFamily: MONO, fontSize: T.fontSm, color: T.text }}>—</td>
                                            <td style={{ ...TD, textAlign: 'right', fontFamily: MONO, fontSize: T.fontSm, color: T.textMuted }}>—</td>
                                        </tr>
                                    ))}
                                    {scenarios.length === 0 && (
                                        <tr><td colSpan={3} style={{ ...TD, color: T.textMuted, textAlign: 'center' }}>—</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>

                        {/* Recent failures */}
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{
                                padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <CardSub>recent failures</CardSub>
                                    <div style={{ fontWeight: 700, fontSize: T.fontMd, color: T.textStrong, marginTop: 2 }}>直近の失敗</div>
                                </div>
                                <Link to="/action-logs" style={{
                                    fontSize: T.fontXs, fontFamily: MONO,
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                    color: T.primary, textDecoration: 'none',
                                }}>
                                    all →
                                </Link>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {failures.map((log, i) => (
                                        <tr key={log.id ?? i} style={{
                                            borderBottom: i < failures.length - 1 ? `1px solid ${T.border}` : 'none',
                                        }}>
                                            <td style={{ ...TD, width: 90 }}>
                                                <AdapterTag adapter={log.adapter} />
                                            </td>
                                            <td style={{ ...TD, fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {log.error_message ?? '—'}
                                            </td>
                                            <td style={{ ...TD, textAlign: 'right', fontFamily: MONO, fontSize: T.fontXs, color: T.textMuted, whiteSpace: 'nowrap' }}>
                                                {log.executed_at?.slice(11, 16) ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {failures.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ ...TD, color: T.textMuted, textAlign: 'center' }}>
                                                <SectionHead label="no failures" />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </>
            ) : null}
        </div>
    );
}

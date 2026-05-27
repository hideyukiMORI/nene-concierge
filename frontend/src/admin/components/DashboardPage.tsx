import { useEffect, useState } from 'react';
import { getDashboard, ApiError } from '../api.js';
import type { DashboardStats } from '../api.js';
import { PageTitle, Card, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    unit,
    accent,
    alert,
}: {
    label:   string;
    value:   number | string;
    unit?:   string;
    accent?: string;
    alert?:  boolean;
}) {
    return (
        <div style={{
            padding: '20px 24px',
            borderRadius: T.radiusLg,
            background: alert ? 'oklch(97% 0.04 25)' : T.surface,
            border: `1px solid ${alert ? 'oklch(87% 0.08 25)' : T.border}`,
            display: 'flex', flexDirection: 'column', gap: 6,
        }}>
            <div style={{ fontSize: T.fontXs, color: T.textMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{
                fontSize: '2rem', fontWeight: 800, lineHeight: 1,
                color: alert ? 'oklch(40% 0.14 25)' : (accent ?? T.text),
            }}>
                {value}
                {unit && (
                    <span style={{ fontSize: T.fontSm, fontWeight: 400, color: T.textMuted, marginLeft: 4 }}>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
    const { t } = useTranslation();

    if (data.length === 0) {
        return (
            <p style={{ color: T.textMuted, fontSize: T.fontSm, textAlign: 'center', padding: '20px 0' }}>
                {t('dashboard.noData')}
            </p>
        );
    }

    const max    = Math.max(...data.map(d => d.count), 1);
    const width  = 480;
    const height = 80;
    const pad    = 4;
    const n      = data.length;
    const xStep  = n > 1 ? (width - pad * 2) / (n - 1) : 0;

    const points = data.map((d, i) => {
        const x = pad + i * xStep;
        const y = pad + (1 - d.count / max) * (height - pad * 2);
        return `${x},${y}`;
    }).join(' ');

    // Fill area under curve
    const firstX = pad;
    const lastX  = pad + (n - 1) * xStep;
    const fillPoints = `${firstX},${height} ${points} ${lastX},${height}`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 80, display: 'block' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={T.primary} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={T.primary} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {/* Filled area */}
            <polygon
                points={fillPoints}
                fill="url(#sparkGrad)"
            />
            {/* Line */}
            <polyline
                points={points}
                fill="none"
                stroke={T.primary}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Dots */}
            {data.map((d, i) => {
                const x = pad + i * xStep;
                const y = pad + (1 - d.count / max) * (height - pad * 2);
                return (
                    <circle key={d.date} cx={x} cy={y} r="3" fill={T.primary} />
                );
            })}
        </svg>
    );
}

function SparklineCard({ data }: { data: { date: string; count: number }[] }) {
    const { t } = useTranslation();

    return (
        <Card>
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: T.fontSm, color: T.text }}>
                {t('dashboard.dailySessions')}
            </div>
            <Sparkline data={data} />
            {data.length > 0 && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginTop: 6, fontSize: T.fontXs, color: T.textMuted,
                }}>
                    <span>{data[0].date}</span>
                    <span>{data[data.length - 1].date}</span>
                </div>
            )}
        </Card>
    );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { t } = useTranslation();

    const [stats, setStats]     = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        void getDashboard()
            .then(res => setStats(res.data))
            .catch(err => {
                setError(err instanceof ApiError ? err.message : t('dashboard.loadError'));
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <PageTitle>{t('dashboard.pageTitle')}</PageTitle>

            <ErrorMsg msg={error} />

            {/* Action failures alert */}
            {stats !== null && stats.action_failures_24h > 0 && (
                <div style={{
                    marginBottom: 20,
                    padding: '12px 16px',
                    borderRadius: T.radiusMd,
                    background: 'oklch(97% 0.04 25)',
                    border: '1px solid oklch(87% 0.08 25)',
                    color: 'oklch(35% 0.14 25)',
                    fontSize: T.fontSm,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    ⚠️ {t('dashboard.failuresAlert').replace('{{count}}', String(stats.action_failures_24h))}
                </div>
            )}

            {loading ? (
                <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
            ) : stats !== null ? (
                <>
                    {/* KPI グリッド */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 12,
                        marginBottom: 20,
                    }}>
                        <KpiCard
                            label={t('dashboard.sessions7d')}
                            value={stats.sessions_7d}
                        />
                        <KpiCard
                            label={t('dashboard.converted7d')}
                            value={stats.converted_7d}
                            accent="oklch(40% 0.18 290)"
                        />
                        <KpiCard
                            label={t('dashboard.conversionRate')}
                            value={stats.conversion_rate_7d.toFixed(1)}
                            unit="%"
                            accent={
                                stats.conversion_rate_7d >= 10
                                    ? 'oklch(40% 0.14 150)'
                                    : stats.conversion_rate_7d >= 3
                                    ? T.text
                                    : 'oklch(40% 0.14 25)'
                            }
                        />
                        <KpiCard
                            label={t('dashboard.activeSessions')}
                            value={stats.active_sessions}
                            accent={T.primary}
                        />
                        <KpiCard
                            label={t('dashboard.publishedScenarios')}
                            value={stats.published_scenarios}
                        />
                        <KpiCard
                            label={t('dashboard.actionFailures24h')}
                            value={stats.action_failures_24h}
                            alert={stats.action_failures_24h > 0}
                        />
                    </div>

                    {/* Sparkline */}
                    <SparklineCard data={stats.daily_sessions} />
                </>
            ) : null}
        </div>
    );
}

import { useEffect, useState } from 'react';
import { getScenarioHistory, ApiError, type ScenarioRevision, type ScenarioRevisionOperation } from '../api.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import RevisionDiffPanel from './RevisionDiffPanel.js';

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

const OPERATION_COLORS: Record<ScenarioRevisionOperation, { bg: string; fg: string }> = {
    create:        { bg: 'rgba(34,197,94,0.15)',  fg: '#16a34a' },
    update:        { bg: 'rgba(59,130,246,0.15)', fg: '#2563eb' },
    graph_save:    { bg: 'rgba(168,85,247,0.15)', fg: '#9333ea' },
    status_change: { bg: 'rgba(245,158,11,0.18)', fg: '#d97706' },
    delete:        { bg: 'rgba(239,68,68,0.15)',  fg: '#dc2626' },
};

interface Props {
    scenarioId: number;
    open: boolean;
    onClose: () => void;
}

export default function ScenarioHistoryPanel({ scenarioId, open, onClose }: Props) {
    const { t } = useTranslation();
    const [items, setItems] = useState<ScenarioRevision[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diffId, setDiffId] = useState<number | null>(null);

    useEffect(() => {
        if (!open || !scenarioId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        getScenarioHistory(scenarioId, 100, 0)
            .then(res => { if (!cancelled) setItems(res.data); })
            .catch(e => {
                if (cancelled) return;
                const msg = e instanceof ApiError ? e.message : String(e);
                setError(msg);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, scenarioId]);

    if (!open) return null;

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                zIndex: 800,
            }}/>
            <aside style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(420px, 100vw)',
                background: T.surface, borderLeft: `1px solid ${T.border}`,
                boxShadow: T.shadowElevated,
                display: 'flex', flexDirection: 'column',
                zIndex: 801,
            }}>
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 16px',
                    borderBottom: `1px solid ${T.borderLight}`,
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: T.fontMd, fontWeight: 700, color: T.textStrong, flex: 1 }}>
                        {t('history.title')}
                    </h2>
                    <button onClick={onClose}
                        aria-label={t('common.close')}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: T.textMuted, padding: 4,
                        }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                    {loading && (
                        <p style={{ padding: '16px', color: T.textMuted, fontSize: T.fontSm }}>
                            {t('common.loading')}
                        </p>
                    )}
                    {error && (
                        <p style={{ padding: '16px', color: T.dangerFg, fontSize: T.fontSm }}>{error}</p>
                    )}
                    {!loading && !error && items.length === 0 && (
                        <p style={{ padding: '16px', color: T.textMuted, fontSize: T.fontSm }}>
                            {t('history.empty')}
                        </p>
                    )}
                    {!loading && items.map(rev => {
                        const palette = OPERATION_COLORS[rev.operation] ?? OPERATION_COLORS.update;
                        return (
                            <div key={rev.id}
                                onClick={() => setDiffId(rev.id)}
                                style={{
                                    display: 'flex', gap: 12,
                                    padding: '10px 16px',
                                    borderBottom: `1px solid ${T.borderLight}`,
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                                <div style={{
                                    fontFamily: MONO, fontSize: 10,
                                    color: T.textFaint, minWidth: 36,
                                    paddingTop: 2,
                                }}>
                                    #{rev.revision_no}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '1px 7px', borderRadius: 99,
                                            background: palette.bg, color: palette.fg,
                                            fontFamily: MONO, fontSize: 9, fontWeight: 700,
                                            letterSpacing: '0.05em', textTransform: 'uppercase',
                                        }}>{t(`history.op.${rev.operation}`)}</span>
                                        <span style={{
                                            fontFamily: MONO, fontSize: 10, color: T.textFaint,
                                        }}>{rev.node_count}N · {rev.edge_count}E</span>
                                    </div>
                                    <div style={{
                                        fontSize: T.fontSm, color: T.text, fontWeight: 500,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>{rev.name ?? '—'}</div>
                                    <div style={{
                                        marginTop: 2,
                                        fontSize: 11, color: T.textMuted,
                                        display: 'flex', justifyContent: 'space-between', gap: 8,
                                    }}>
                                        <span style={{
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>{rev.user_email ?? t('history.unknownUser')}</span>
                                        <span style={{ fontFamily: MONO, flexShrink: 0 }}>
                                            {rev.created_at ?? ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {diffId !== null && (
                <RevisionDiffPanel revisionId={diffId} onClose={() => setDiffId(null)} mode="overlay" />
            )}
        </>
    );
}

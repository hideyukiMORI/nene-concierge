import { useEffect, useMemo, useState } from 'react';
import {
    getScenarioRevision,
    ApiError,
    type ScenarioRevisionDetail,
    type ScenarioRevisionSnapshot,
    type ScenarioRevisionSnapshotNode,
    type ScenarioRevisionSnapshotEdge,
} from '../api.js';
import { T } from '../theme.js';
import { CloseIcon, RightPane } from './Layout.js';
import { useTranslation } from '../i18n/index.js';

type TFn = ReturnType<typeof useTranslation>['t'];

const MONO = T.fontMono;

type DetailMode = 'overlay' | 'pane';

interface Props {
    revisionId: number | null;
    onClose:    () => void;
    /** 'overlay' = right-side drawer with backdrop. 'pane' = sticky right pane (wide layout). */
    mode?:      DetailMode;
}

interface FieldChange {
    field: string;
    before: string | null;
    after:  string | null;
}

interface NodeDiff {
    added:    ScenarioRevisionSnapshotNode[];
    removed:  ScenarioRevisionSnapshotNode[];
    modified: { before: ScenarioRevisionSnapshotNode; after: ScenarioRevisionSnapshotNode; changes: string[] }[];
}

interface EdgeDiff {
    added:   ScenarioRevisionSnapshotEdge[];
    removed: ScenarioRevisionSnapshotEdge[];
}

export function diffNodes(
    before: ScenarioRevisionSnapshotNode[],
    after:  ScenarioRevisionSnapshotNode[],
): NodeDiff {
    const beforeMap = new Map(before.map(n => [n.node_id, n]));
    const afterMap  = new Map(after.map(n => [n.node_id, n]));

    const added:    ScenarioRevisionSnapshotNode[] = [];
    const removed:  ScenarioRevisionSnapshotNode[] = [];
    const modified: { before: ScenarioRevisionSnapshotNode; after: ScenarioRevisionSnapshotNode; changes: string[] }[] = [];

    for (const a of after) {
        const b = beforeMap.get(a.node_id);
        if (!b) { added.push(a); continue; }
        const changes: string[] = [];
        if (b.label !== a.label) changes.push('label');
        if (b.type  !== a.type)  changes.push('type');
        if (Math.abs(b.position_x - a.position_x) > 0.5 || Math.abs(b.position_y - a.position_y) > 0.5) {
            changes.push('position');
        }
        if (JSON.stringify(b.data ?? {}) !== JSON.stringify(a.data ?? {})) {
            changes.push('data');
        }
        if (changes.length > 0) modified.push({ before: b, after: a, changes });
    }
    for (const b of before) {
        if (!afterMap.has(b.node_id)) removed.push(b);
    }
    return { added, removed, modified };
}

function edgeKey(e: ScenarioRevisionSnapshotEdge): string {
    return `${e.source_node_id}→${e.target_node_id}|${e.label ?? ''}`;
}

export function diffEdges(
    before: ScenarioRevisionSnapshotEdge[],
    after:  ScenarioRevisionSnapshotEdge[],
): EdgeDiff {
    const beforeKeys = new Set(before.map(edgeKey));
    const afterKeys  = new Set(after.map(edgeKey));
    return {
        added:   after.filter(e => !beforeKeys.has(edgeKey(e))),
        removed: before.filter(e => !afterKeys.has(edgeKey(e))),
    };
}

function fieldChanges(before: ScenarioRevisionSnapshot | null, after: ScenarioRevisionSnapshot | null): FieldChange[] {
    if (!after) return [];
    const fields: ('name' | 'description' | 'status')[] = ['name', 'description', 'status'];
    const changes: FieldChange[] = [];
    for (const f of fields) {
        const bv = before?.[f] ?? null;
        const av = after[f] ?? null;
        if (bv !== av) changes.push({ field: f, before: bv, after: av });
    }
    return changes;
}

export default function RevisionDiffPanel({ revisionId, onClose, mode = 'overlay' }: Props) {
    const { t } = useTranslation();
    const [revision, setRevision] = useState<ScenarioRevisionDetail | null>(null);
    const [previous, setPrevious] = useState<ScenarioRevisionDetail | null>(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    useEffect(() => {
        if (revisionId === null) {
            setRevision(null);
            setPrevious(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getScenarioRevision(revisionId)
            .then(res => {
                if (cancelled) return;
                setRevision(res.revision);
                setPrevious(res.previous);
            })
            .catch(e => {
                if (cancelled) return;
                setError(e instanceof ApiError ? e.message : String(e));
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [revisionId]);

    useEffect(() => {
        if (revisionId === null) return;
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [revisionId, onClose]);

    const fields = useMemo(() => {
        return fieldChanges(previous?.snapshot ?? null, revision?.snapshot ?? null);
    }, [previous, revision]);

    const nodeDiff = useMemo<NodeDiff | null>(() => {
        if (!revision?.snapshot) return null;
        return diffNodes(previous?.snapshot?.nodes ?? [], revision.snapshot.nodes);
    }, [previous, revision]);

    const edgeDiff = useMemo<EdgeDiff | null>(() => {
        if (!revision?.snapshot) return null;
        return diffEdges(previous?.snapshot?.edges ?? [], revision.snapshot.edges);
    }, [previous, revision]);

    if (revisionId === null && mode !== 'pane') return null;

    const inner = (
        <>
            {/* Top stripe */}
            <div style={{ height: 3, background: T.primary, flexShrink: 0 }} />

            <header style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 18px',
                borderBottom: `1px solid ${T.border}`,
                flexShrink: 0,
            }}>
                <h2 style={{ margin: 0, fontSize: T.fontMd, fontWeight: 700, color: T.textStrong, flex: 1 }}>
                    {revision
                        ? t('diff.title', { rev: String(revision.revision_no) })
                        : revisionId === null ? '' : t('diff.loading')}
                </h2>
                <button onClick={onClose}
                    aria-label={t('common.close')}
                    style={{
                        width: 26, height: 26, borderRadius: T.radiusSm,
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.textMuted, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <CloseIcon />
                </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
                {revisionId === null && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', color: T.textFaint, fontSize: T.fontSm,
                        height: '100%', padding: 24,
                    }}>
                        <div style={{
                            fontFamily: MONO, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.10em', textTransform: 'uppercase',
                            marginBottom: 6,
                        }}>{t('diff.noSelection.title')}</div>
                        <div>{t('diff.noSelection.hint')}</div>
                    </div>
                )}
                {loading && <p style={{ color: T.textMuted, fontSize: T.fontSm }}>{t('common.loading')}</p>}
                {error && <p style={{ color: T.dangerFg, fontSize: T.fontSm }}>{error}</p>}

                {!loading && revision && (
                    <>
                        <DiffMeta revision={revision} previous={previous} t={t}/>

                        {!revision.snapshot && (
                            <p style={{ color: T.textMuted, fontSize: T.fontSm, marginTop: 16 }}>
                                {t('diff.noSnapshot')}
                            </p>
                        )}

                        {revision.snapshot && fields.length > 0 && (
                            <Section title={t('diff.fields')}>
                                {fields.map(f => (
                                    <FieldChangeRow key={f.field}
                                        field={f.field} before={f.before} after={f.after}/>
                                ))}
                            </Section>
                        )}

                        {revision.snapshot && nodeDiff && (nodeDiff.added.length + nodeDiff.removed.length + nodeDiff.modified.length > 0) && (
                            <Section title={t('diff.nodes')}>
                                {nodeDiff.added.map(n => (
                                    <DiffRow key={'a-'+n.node_id} kind="add"
                                        label={`${n.label || n.node_id}`}
                                        meta={`${n.type} · ${n.node_id}`}/>
                                ))}
                                {nodeDiff.modified.map(m => (
                                    <DiffRow key={'m-'+m.after.node_id} kind="mod"
                                        label={m.after.label || m.after.node_id}
                                        meta={`${m.after.type} · ${m.after.node_id} · ${t('diff.changed')}: ${m.changes.join(', ')}`}/>
                                ))}
                                {nodeDiff.removed.map(n => (
                                    <DiffRow key={'r-'+n.node_id} kind="del"
                                        label={n.label || n.node_id}
                                        meta={`${n.type} · ${n.node_id}`}/>
                                ))}
                            </Section>
                        )}

                        {revision.snapshot && edgeDiff && (edgeDiff.added.length + edgeDiff.removed.length > 0) && (
                            <Section title={t('diff.edges')}>
                                {edgeDiff.added.map((e, i) => (
                                    <DiffRow key={'ea-'+i} kind="add"
                                        label={`${e.source_node_id} → ${e.target_node_id}`}
                                        meta={e.label ?? ''}/>
                                ))}
                                {edgeDiff.removed.map((e, i) => (
                                    <DiffRow key={'er-'+i} kind="del"
                                        label={`${e.source_node_id} → ${e.target_node_id}`}
                                        meta={e.label ?? ''}/>
                                ))}
                            </Section>
                        )}

                        {revision.snapshot && nodeDiff && edgeDiff
                            && nodeDiff.added.length + nodeDiff.removed.length + nodeDiff.modified.length === 0
                            && edgeDiff.added.length + edgeDiff.removed.length === 0
                            && fields.length === 0 && (
                            <p style={{ color: T.textMuted, fontSize: T.fontSm, marginTop: 16 }}>
                                {t('diff.noChanges')}
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );

    return <RightPane mode={mode} onClose={onClose} zIndex={900}>{inner}</RightPane>;
}

function DiffMeta({ revision, previous, t }: {
    revision: ScenarioRevisionDetail;
    previous: ScenarioRevisionDetail | null;
    t: TFn;
}) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr',
            gap: '6px 14px',
            fontSize: T.fontSm,
            marginBottom: 8,
        }}>
            <span style={{ color: T.textMuted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t('diff.meta.operation')}
            </span>
            <span style={{ fontWeight: 600 }}>{t(`history.op.${revision.operation}`)}</span>

            <span style={{ color: T.textMuted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t('diff.meta.by')}
            </span>
            <span>{revision.user_email ?? t('history.unknownUser')}</span>

            <span style={{ color: T.textMuted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t('diff.meta.when')}
            </span>
            <span style={{ fontFamily: MONO, fontSize: T.fontXs }}>{revision.created_at ?? '—'}</span>

            <span style={{ color: T.textMuted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t('diff.meta.comparedTo')}
            </span>
            <span style={{ fontFamily: MONO, fontSize: T.fontXs }}>
                {previous ? `#${previous.revision_no} (${previous.created_at ?? '—'})` : t('diff.noPrevious')}
            </span>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: 16 }}>
            <h3 style={{
                margin: '0 0 8px', fontSize: T.fontSm, fontWeight: 700, color: T.textStrong,
                fontFamily: MONO, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {children}
            </div>
        </div>
    );
}

function DiffRow({ kind, label, meta }: { kind: 'add' | 'del' | 'mod'; label: string; meta: string }) {
    const palette = kind === 'add'
        ? { bg: 'rgba(34,197,94,0.10)',  bar: '#16a34a', sym: '+' }
        : kind === 'del'
            ? { bg: 'rgba(239,68,68,0.10)',  bar: '#dc2626', sym: '−' }
            : { bg: 'rgba(234,179,8,0.10)',  bar: '#ca8a04', sym: '~' };
    return (
        <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '8px 10px',
            background: palette.bg,
            borderLeft: `3px solid ${palette.bar}`,
            borderRadius: T.radiusSm,
        }}>
            <span style={{ fontFamily: MONO, color: palette.bar, fontWeight: 700, flexShrink: 0 }}>{palette.sym}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: T.fontSm, color: T.text, fontWeight: 500 }}>{label}</div>
                {meta && <div style={{ fontFamily: MONO, fontSize: 10, color: T.textMuted, marginTop: 2 }}>{meta}</div>}
            </div>
        </div>
    );
}

function FieldChangeRow({ field, before, after }: { field: string; before: string | null; after: string | null }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {field}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                    padding: '3px 8px', borderRadius: T.radiusSm,
                    background: 'rgba(239,68,68,0.10)', color: '#dc2626',
                    fontSize: T.fontXs, fontFamily: MONO,
                    textDecoration: 'line-through', textDecorationColor: 'rgba(239,68,68,0.6)',
                }}>{before ?? '—'}</span>
                <span style={{ color: T.textFaint }}>→</span>
                <span style={{
                    padding: '3px 8px', borderRadius: T.radiusSm,
                    background: 'rgba(34,197,94,0.12)', color: '#16a34a',
                    fontSize: T.fontXs, fontFamily: MONO,
                }}>{after ?? '—'}</span>
            </div>
        </div>
    );
}

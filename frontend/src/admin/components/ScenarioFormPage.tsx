import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    getScenario, createScenario, updateScenario, deleteScenario, saveScenarioGraph,
    listCredentials,
    ApiError,
    type ScenarioNode, type ScenarioEdge, type CredentialSummary,
} from '../api.js';
import { PageTitle, Btn, Badge, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import ScenarioCanvas from './editor/ScenarioCanvas.js';

// React Flow の CSS を読み込む（esbuild がバンドル時に app.css へ出力する）
import '@xyflow/react/dist/style.css';

export default function ScenarioFormPage() {
    const { id }  = useParams<{ id?: string }>();
    const isNew   = id === undefined;
    const nav     = useNavigate();
    const { t }   = useTranslation();

    // ── メタ情報 ────────────────────────────────────────────────────────────
    const [name, setName]               = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus]           = useState<'draft' | 'published' | 'archived'>('draft');

    // ── グラフデータ ────────────────────────────────────────────────────────
    const [nodes, setNodes]             = useState<ScenarioNode[]>([]);
    const [edges, setEdges]             = useState<ScenarioEdge[]>([]);
    const [credentials, setCredentials] = useState<CredentialSummary[]>([]);

    // ── UI 状態 ─────────────────────────────────────────────────────────────
    const [loading, setLoading]   = useState(!isNew);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [savedMsg, setSavedMsg] = useState('');

    // ── ロード ──────────────────────────────────────────────────────────────
    useEffect(() => {
        void listCredentials().then(r => setCredentials(r.data)).catch(() => {});

        if (isNew) return;
        void (async () => {
            try {
                const s = await getScenario(Number(id));
                setName(s.name);
                setDescription(s.description ?? '');
                setStatus(s.status);
                setNodes(s.nodes);
                setEdges(s.edges);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : t('scenarioForm.loadError'));
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isNew]);

    // ── メタ情報保存 ─────────────────────────────────────────────────────────
    async function handleMetaSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (isNew) {
                const res = await createScenario({ name, ...(description ? { description } : {}) });
                nav(`/scenarios/${res.id}`);
                return;
            }
            await updateScenario(Number(id), { name, description: description || null, status });
            flash(t('scenarioForm.metaSaved'));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.saveError'));
        } finally {
            setSaving(false);
        }
    }

    // ── グラフ保存 ───────────────────────────────────────────────────────────
    async function handleGraphSave(newNodes: ScenarioNode[], newEdges: ScenarioEdge[]) {
        setSaving(true);
        setError(null);
        try {
            await saveScenarioGraph(Number(id), newNodes, newEdges);
            setNodes(newNodes);
            setEdges(newEdges);
            flash(t('scenarioForm.graphSaved'));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.graphSaveError'));
        } finally {
            setSaving(false);
        }
    }

    // ── 削除 ────────────────────────────────────────────────────────────────
    async function handleDelete() {
        if (!confirm(t('scenarios.confirmDelete', { name }))) return;
        try {
            await deleteScenario(Number(id));
            nav('/scenarios');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.deleteError'));
        }
    }

    function flash(msg: string) {
        setSavedMsg(msg);
        setTimeout(() => setSavedMsg(''), 2500);
    }

    const statusOptions = [
        { value: 'draft',     label: t('scenario.status.draft') },
        { value: 'published', label: t('scenario.status.published') },
        { value: 'archived',  label: t('scenario.status.archived') },
    ] as const;

    if (loading) return <p style={{ color: T.textMuted, marginTop: 40 }}>{t('common.loading')}</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', gap: 0 }}>

            {/* ── ヘッダーバー ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
                background: T.surface, flexShrink: 0,
            }}>
                <PageTitle style={{ margin: 0, fontSize: T.fontXl }}>
                    {isNew ? t('scenarioForm.newTitle') : name}
                </PageTitle>
                {!isNew && <Badge status={status} />}
                <div style={{ flex: 1 }} />
                {savedMsg && (
                    <span style={{ fontSize: T.fontBase, color: T.successText, fontWeight: 600 }}>
                        ✓ {savedMsg}
                    </span>
                )}
                {!isNew && (
                    <Btn variant="danger" onClick={() => void handleDelete()}>{t('common.delete')}</Btn>
                )}
                <Btn variant="ghost" onClick={() => nav('/scenarios')}>{t('common.backToList')}</Btn>
            </div>

            {/* ── エラー表示 ── */}
            {error && (
                <div style={{ padding: '8px 16px', background: T.dangerBg, flexShrink: 0 }}>
                    <ErrorMsg msg={error} />
                </div>
            )}

            {/* ── メタ情報フォーム ── */}
            <form
                onSubmit={e => { void handleMetaSave(e); }}
                style={{
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                    padding: '10px 16px', background: T.bg,
                    borderBottom: `1px solid ${T.border}`, flexShrink: 0,
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: T.fontXs, fontWeight: 600, color: T.textMuted, marginBottom: 3 }}>
                        {t('scenarioForm.nameLabel')} *
                    </label>
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        required placeholder={t('scenarioForm.namePlaceholder')}
                        style={{
                            width: '100%', padding: '7px 10px',
                            borderRadius: T.radiusSm, border: `1.5px solid ${T.borderInput}`,
                            fontSize: T.fontBase, boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ flex: '2 1 300px' }}>
                    <label style={{ display: 'block', fontSize: T.fontXs, fontWeight: 600, color: T.textMuted, marginBottom: 3 }}>
                        {t('scenarioForm.descLabel')}
                    </label>
                    <input
                        value={description} onChange={e => setDescription(e.target.value)}
                        placeholder={t('scenarioForm.descPlaceholder')}
                        style={{
                            width: '100%', padding: '7px 10px',
                            borderRadius: T.radiusSm, border: `1.5px solid ${T.borderInput}`,
                            fontSize: T.fontBase, boxSizing: 'border-box',
                        }}
                    />
                </div>
                {!isNew && (
                    <div style={{ flex: '0 0 120px' }}>
                        <label style={{ display: 'block', fontSize: T.fontXs, fontWeight: 600, color: T.textMuted, marginBottom: 3 }}>
                            {t('scenarioForm.statusLabel')}
                        </label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as typeof status)}
                            style={{
                                width: '100%', padding: '7px 10px',
                                borderRadius: T.radiusSm, border: `1.5px solid ${T.borderInput}`,
                                fontSize: T.fontBase, background: T.surface, boxSizing: 'border-box',
                            }}
                        >
                            {statusOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                <Btn type="submit" disabled={saving}>
                    {saving ? t('common.saving') : (isNew ? t('common.create') : t('common.save'))}
                </Btn>
            </form>

            {/* ── ビジュアルエディタ (新規作成前は非表示) ── */}
            {!isNew && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <ScenarioCanvas
                        scenarioId={Number(id)}
                        initialNodes={nodes}
                        initialEdges={edges}
                        credentials={credentials}
                        saving={saving}
                        onSave={handleGraphSave}
                    />
                </div>
            )}

            {isNew && (
                <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.textMuted, fontSize: T.fontMd,
                }}>
                    {t('scenarioForm.canvasHint')}
                </div>
            )}
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    getScenario, createScenario, updateScenario, deleteScenario, saveScenarioGraph,
    listCredentials,
    ApiError,
    type ScenarioNode, type ScenarioEdge, type CredentialSummary,
} from '../api.js';
import { Btn, Badge, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import ScenarioCanvas, { type ScenarioCanvasRef } from './editor/ScenarioCanvas.js';

// React Flow の CSS を読み込む（esbuild がバンドル時に app.css へ出力する）
import '@xyflow/react/dist/style.css';

// ── アイコン ────────────────────────────────────────────────────────────────
const PencilIcon = () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
);

const ChevronUpIcon = () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
    </svg>
);

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
    const [loading, setLoading]         = useState(!isNew);
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [savedMsg, setSavedMsg]       = useState('');
    const canvasRef                     = useRef<ScenarioCanvasRef>(null);

    // ── インライン編集 ──────────────────────────────────────────────────────
    const [editingName, setEditingName] = useState(isNew);
    const [draftName, setDraftName]     = useState('');
    const nameInputRef                  = useRef<HTMLInputElement>(null);

    // ── ステータスドロップダウン ────────────────────────────────────────────
    const [showStatusDrop, setShowStatusDrop] = useState(false);
    const statusDropRef                       = useRef<HTMLDivElement>(null);

    // ── Details ドロワー（説明フィールド）──────────────────────────────────
    const [showDetails, setShowDetails] = useState(isNew);

    // ── ロード ──────────────────────────────────────────────────────────────
    useEffect(() => {
        void listCredentials().then(r => setCredentials(r.data)).catch(() => {});
        if (isNew) {
            // 新規作成: 名前フィールドにフォーカス
            setTimeout(() => nameInputRef.current?.focus(), 50);
            return;
        }
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

    // ── ドロップダウンの外クリックで閉じる ─────────────────────────────────
    useEffect(() => {
        if (!showStatusDrop) return;
        function onClickOutside(e: MouseEvent) {
            if (statusDropRef.current && !statusDropRef.current.contains(e.target as Node)) {
                setShowStatusDrop(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [showStatusDrop]);

    // ── インライン名前編集 ───────────────────────────────────────────────────
    function startEditName() {
        setDraftName(name);
        setEditingName(true);
        setTimeout(() => {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }, 0);
    }

    async function commitName() {
        const trimmed = draftName.trim();
        if (trimmed === '') { setEditingName(false); return; }
        if (trimmed === name) { setEditingName(false); return; }
        setName(trimmed);
        setEditingName(false);
        if (!isNew) await saveMeta({ nameOverride: trimmed });
    }

    function cancelEditName() {
        setEditingName(false);
        setDraftName(name);
    }

    // ── ステータス変更（即時保存） ───────────────────────────────────────────
    async function changeStatus(s: typeof status) {
        setStatus(s);
        setShowStatusDrop(false);
        if (!isNew) await saveMeta({ statusOverride: s });
    }

    // ── メタ情報保存 ─────────────────────────────────────────────────────────
    async function saveMeta(overrides?: { nameOverride?: string; statusOverride?: typeof status }) {
        if (isNew) return;
        setSaving(true);
        setError(null);
        try {
            await updateScenario(Number(id), {
                name:        overrides?.nameOverride  ?? name,
                description: description || null,
                status:      overrides?.statusOverride ?? status,
            });
            flash(t('scenarioForm.metaSaved'));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.saveError'));
        } finally {
            setSaving(false);
        }
    }

    // ── 新規シナリオ作成 ─────────────────────────────────────────────────────
    async function handleCreate() {
        const trimmed = draftName.trim() || name.trim();
        if (!trimmed) return;
        setSaving(true);
        setError(null);
        try {
            const res = await createScenario({ name: trimmed, ...(description ? { description } : {}) });
            nav(`/scenarios/${res.id}`);
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
        { value: 'draft',     label: t('scenario.status.draft')     },
        { value: 'published', label: t('scenario.status.published') },
        { value: 'archived',  label: t('scenario.status.archived')  },
    ] as const;

    if (loading) return (
        <p style={{ color: T.textMuted, marginTop: 40, padding: '0 24px' }}>{t('common.loading')}</p>
    );

    // ── 共通スタイル ─────────────────────────────────────────────────────────
    const divider: React.CSSProperties = {
        width: 1, height: 20, background: T.border, flexShrink: 0,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* ══ ヘッダーバー (48px) ══════════════════════════════════════════ */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 10px', height: 48, flexShrink: 0,
                borderBottom: `1px solid ${T.border}`,
                background: T.surface,
            }}>
                {/* 戻るボタン */}
                <Btn variant="ghost" onClick={() => nav('/scenarios')} style={{ padding: '0 8px' }}>
                    ← {t('common.backToList')}
                </Btn>

                <div style={divider} />

                {/* ── インライン名前編集 ── */}
                {editingName ? (
                    <input
                        ref={nameInputRef}
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onBlur={() => { void commitName(); }}
                        onKeyDown={e => {
                            if (e.key === 'Enter')  { e.preventDefault(); void commitName(); }
                            if (e.key === 'Escape') { e.preventDefault(); cancelEditName(); }
                        }}
                        placeholder={t('scenarioForm.namePlaceholder')}
                        style={{
                            fontSize: T.fontMd, fontWeight: 600,
                            color: T.textStrong,
                            border: `1.5px solid ${T.primary}`,
                            borderRadius: T.radiusSm,
                            padding: '3px 8px',
                            background: T.surface,
                            minWidth: 180, maxWidth: 360,
                            outline: 'none',
                        }}
                    />
                ) : (
                    <button
                        onClick={startEditName}
                        title={t('scenarioForm.nameLabel')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: T.fontMd, fontWeight: 600,
                            color: T.textStrong,
                            background: 'transparent', border: 'none',
                            cursor: 'text', padding: '3px 6px',
                            borderRadius: T.radiusSm,
                            maxWidth: 320,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.surfaceHover; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {name || <span style={{ color: T.textMuted, fontWeight: 400 }}>{t('scenarioForm.namePlaceholder')}</span>}
                        </span>
                        <span style={{ color: T.textMuted, flexShrink: 0 }}><PencilIcon /></span>
                    </button>
                )}

                {/* ── ステータスバッジドロップダウン ── */}
                {!isNew && (
                    <div ref={statusDropRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowStatusDrop(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 3,
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                padding: '2px 4px', borderRadius: T.radiusSm,
                            }}
                            title={t('scenarioForm.statusLabel')}
                        >
                            <Badge status={status} />
                            <span style={{ color: T.textMuted }}><ChevronDownIcon /></span>
                        </button>

                        {showStatusDrop && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: T.radiusMd, boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                                zIndex: 200, overflow: 'hidden', minWidth: 130,
                            }}>
                                {statusOptions.map(o => (
                                    <button
                                        key={o.value}
                                        onClick={() => { void changeStatus(o.value); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            width: '100%', padding: '7px 12px',
                                            background: o.value === status ? T.primaryLight : 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            fontSize: T.fontBase, color: T.text,
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={e => { if (o.value !== status) (e.currentTarget as HTMLButtonElement).style.background = T.surfaceHover; }}
                                        onMouseLeave={e => { if (o.value !== status) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                    >
                                        <Badge status={o.value} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* スペーサー */}
                <div style={{ flex: 1 }} />

                {/* 保存フラッシュ */}
                {savedMsg && (
                    <span style={{ fontSize: T.fontBase, color: T.successText, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        ✓ {savedMsg}
                    </span>
                )}

                {/* 💾 グラフ保存 */}
                {!isNew && (
                    <Btn disabled={saving} onClick={() => canvasRef.current?.triggerSave()}>
                        {saving ? t('common.saving') : t('canvas.save')}
                    </Btn>
                )}

                {/* ⚙ Details トグル */}
                {!isNew && (
                    <button
                        onClick={() => setShowDetails(v => !v)}
                        title={t('scenarioForm.detailsToggle')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '0 8px', height: 28,
                            background: showDetails ? T.primaryLight : 'transparent',
                            border: `1px solid ${showDetails ? T.primaryBorder : T.border}`,
                            borderRadius: T.radiusSm, cursor: 'pointer',
                            fontSize: T.fontXs, fontWeight: 600,
                            color: showDetails ? T.primaryText : T.textMuted,
                        }}
                    >
                        {t('scenarioForm.detailsToggle')}
                        {showDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                )}

                {/* 新規作成ボタン */}
                {isNew && (
                    <Btn
                        disabled={saving || !(draftName.trim() || name.trim())}
                        onClick={() => { void handleCreate(); }}
                    >
                        {saving ? t('common.creating') : t('common.create')}
                    </Btn>
                )}

                {/* 🗑 削除 */}
                {!isNew && (
                    <Btn variant="danger" onClick={() => { void handleDelete(); }}>
                        {t('common.delete')}
                    </Btn>
                )}
            </div>

            {/* ══ Details ドロワー（説明・折りたたみ可）══════════════════════ */}
            {showDetails && (
                <div style={{
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                    padding: '8px 12px', flexShrink: 0,
                    background: T.bg, borderBottom: `1px solid ${T.border}`,
                }}>
                    <div style={{ flex: 1 }}>
                        <label style={{
                            display: 'block', fontSize: T.fontXs, fontWeight: 600,
                            color: T.textMuted, marginBottom: 3,
                        }}>
                            {t('scenarioForm.descLabel')}
                        </label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={t('scenarioForm.descPlaceholder')}
                            style={{
                                width: '100%', padding: '5px 9px',
                                borderRadius: T.radiusSm, border: `1.5px solid ${T.borderInput}`,
                                fontSize: T.fontBase, boxSizing: 'border-box',
                                background: T.surface, color: T.text,
                            }}
                        />
                    </div>
                    {/* 新規の場合は「Create」ボタンをここにも表示 */}
                    {isNew && (
                        <Btn
                            disabled={saving || !(draftName.trim() || name.trim())}
                            onClick={() => { void handleCreate(); }}
                        >
                            {saving ? t('common.creating') : t('common.create')}
                        </Btn>
                    )}
                    {!isNew && (
                        <Btn disabled={saving} onClick={() => { void saveMeta(); }}>
                            {saving ? t('common.saving') : t('common.save')}
                        </Btn>
                    )}
                </div>
            )}

            {/* ══ エラー表示 ═══════════════════════════════════════════════════ */}
            {error && (
                <div style={{ padding: '6px 16px', background: T.dangerBg, flexShrink: 0 }}>
                    <ErrorMsg msg={error} />
                </div>
            )}

            {/* ══ Canvas ═══════════════════════════════════════════════════════ */}
            {!isNew && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <ScenarioCanvas
                        ref={canvasRef}
                        scenarioId={Number(id)}
                        initialNodes={nodes}
                        initialEdges={edges}
                        credentials={credentials}
                        onSave={handleGraphSave}
                    />
                </div>
            )}

            {/* ── 新規作成: キャンバスの代わりにヒントを表示 ── */}
            {isNew && (
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    color: T.textMuted, fontSize: T.fontMd,
                }}>
                    <span style={{ fontSize: 32 }}>✦</span>
                    <p>{t('scenarioForm.canvasHint')}</p>
                </div>
            )}
        </div>
    );
}

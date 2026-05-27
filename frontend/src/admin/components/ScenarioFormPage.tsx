import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    getScenario, createScenario, updateScenario, deleteScenario, saveScenarioGraph,
    listCredentials,
    ApiError,
    type ScenarioNode, type ScenarioEdge, type CredentialSummary, type ChatNodeType,
} from '../api.js';
import { Btn, Badge, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import ScenarioCanvas, { type ScenarioCanvasRef } from './editor/ScenarioCanvas.js';
import { NODE_COLORS, NODE_ICONS } from './editor/NodeTypes.js';

// React Flow の CSS を読み込む（esbuild がバンドル時に app.css へ出力する）
import '@xyflow/react/dist/style.css';

// ── アイコン ────────────────────────────────────────────────────────────────
const PencilIcon = () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
);

/** 説明フィールドを開く鉛筆+ドキュメントアイコン */
const DescEditIcon = () => (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12z"/>
        <path d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
    </svg>
);

/** Analytics — 棒グラフ単色ベクター */
const AnalyticsIcon = () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"/>
    </svg>
);

/** 保存 — ダウンロード矢印単色ベクター */
const SaveIcon = () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 0a.5.5 0 0 1 .5.5v9.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 10.293V.5A.5.5 0 0 1 8 0"/>
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.1a.5.5 0 0 1 1 0v2.1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V10.4a.5.5 0 0 1 .5-.5"/>
    </svg>
);

/** 削除 — ゴミ箱単色ベクター */
const TrashIcon = () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0"/>
        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3v1h11V2h-11z"/>
    </svg>
);

// ── ノードタイプ定義（ヘッダーに表示する順） ─────────────────────────────────
const NODE_TYPES: ChatNodeType[] = ['message', 'condition', 'action', 'end'];

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

    // ── Analytics モード（ヘッダーから制御 → Canvas に prop で渡す）──────────
    const [analyticsMode, setAnalyticsMode] = useState(false);

    // ── ロード ──────────────────────────────────────────────────────────────
    useEffect(() => {
        void listCredentials().then(r => setCredentials(r.data)).catch(() => {});
        if (isNew) {
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

    // ── ステータスドロップダウン 外クリックで閉じる ─────────────────────────
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
        setTimeout(() => { nameInputRef.current?.focus(); nameInputRef.current?.select(); }, 0);
    }

    async function commitName() {
        const trimmed = draftName.trim();
        if (trimmed === '') { setEditingName(false); return; }
        if (trimmed === name) { setEditingName(false); return; }
        setName(trimmed);
        setEditingName(false);
        if (!isNew) await saveMeta({ nameOverride: trimmed });
    }

    function cancelEditName() { setEditingName(false); setDraftName(name); }

    // ── ステータス変更（即時保存）──────────────────────────────────────────
    async function changeStatus(s: typeof status) {
        setStatus(s);
        setShowStatusDrop(false);
        if (!isNew) await saveMeta({ statusOverride: s });
    }

    // ── メタ情報保存 ─────────────────────────────────────────────────────────
    async function saveMeta(overrides?: { nameOverride?: string; statusOverride?: typeof status }) {
        if (isNew) return;
        setSaving(true); setError(null);
        try {
            await updateScenario(Number(id), {
                name:        overrides?.nameOverride  ?? name,
                description: description || null,
                status:      overrides?.statusOverride ?? status,
            });
            flash(t('scenarioForm.metaSaved'));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.saveError'));
        } finally { setSaving(false); }
    }

    // ── 新規シナリオ作成 ─────────────────────────────────────────────────────
    async function handleCreate() {
        const trimmed = draftName.trim() || name.trim();
        if (!trimmed) return;
        setSaving(true); setError(null);
        try {
            const res = await createScenario({ name: trimmed, ...(description ? { description } : {}) });
            nav(`/scenarios/${res.id}`);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.saveError'));
        } finally { setSaving(false); }
    }

    // ── グラフ保存 ───────────────────────────────────────────────────────────
    async function handleGraphSave(newNodes: ScenarioNode[], newEdges: ScenarioEdge[]) {
        setSaving(true); setError(null);
        try {
            await saveScenarioGraph(Number(id), newNodes, newEdges);
            setNodes(newNodes); setEdges(newEdges);
            flash(t('scenarioForm.graphSaved'));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarioForm.graphSaveError'));
        } finally { setSaving(false); }
    }

    // ── 削除 ────────────────────────────────────────────────────────────────
    async function handleDelete() {
        if (!confirm(t('scenarios.confirmDelete', { name }))) return;
        try { await deleteScenario(Number(id)); nav('/scenarios'); }
        catch (err) { setError(err instanceof ApiError ? err.message : t('scenarioForm.deleteError')); }
    }

    function flash(msg: string) { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2500); }

    const statusOptions = [
        { value: 'draft',     label: t('scenario.status.draft')     },
        { value: 'published', label: t('scenario.status.published') },
        { value: 'archived',  label: t('scenario.status.archived')  },
    ] as const;

    if (loading) return (
        <p style={{ color: T.textMuted, marginTop: 40, padding: '0 24px' }}>{t('common.loading')}</p>
    );

    // ── 共通スタイル ─────────────────────────────────────────────────────────
    const divider: React.CSSProperties = { width: 1, height: 14, background: T.border, flexShrink: 0 };

    // コンパクトボタン共通スタイル
    const cBtn = (opts: { active?: boolean; fill?: boolean } = {}): React.CSSProperties => ({
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        height: 22, padding: '0 7px', borderRadius: T.radiusMd,
        background: opts.fill ? T.primary : opts.active ? T.primaryLight : 'transparent',
        border: `1px solid ${opts.fill ? T.primary : opts.active ? T.primaryBorder : T.border}`,
        color: opts.fill ? '#fff' : opts.active ? T.primaryText : T.textMuted,
        fontSize: '10px', fontWeight: 600,
        cursor: 'pointer', flexShrink: 0, letterSpacing: '0.01em',
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* ══ ヘッダーバー (36px) ══════════════════════════════════════════
                左: [← Back] | [名前] [Status▾] [✏desc]
                右: [savedMsg] [Msg][Cond][Action][End] / [← Edit] | [📊] [↓save] [○delete]
            ════════════════════════════════════════════════════════════════════ */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '0 8px', height: 36, flexShrink: 0,
                borderBottom: `1px solid ${T.border}`,
                background: T.surface,
            }}>

                {/* ── 左ブロック ──────────────────────────────────────────── */}

                {/* 戻る */}
                <button
                    onClick={() => nav('/scenarios')}
                    style={cBtn()}
                    onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    ← {t('common.backToList')}
                </button>

                <div style={divider} />

                {/* インライン名前編集 */}
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
                            fontSize: T.fontBase, fontWeight: 600, color: T.textStrong,
                            border: `1.5px solid ${T.primary}`, borderRadius: T.radiusSm,
                            padding: '2px 7px', background: T.surface,
                            minWidth: 130, maxWidth: 240, outline: 'none',
                        }}
                    />
                ) : (
                    <button
                        onClick={startEditName}
                        title={t('scenarioForm.nameLabel')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: T.fontBase, fontWeight: 600, color: T.textStrong,
                            background: 'transparent', border: 'none', cursor: 'text',
                            padding: '2px 5px', borderRadius: T.radiusSm,
                            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHover; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {name || <span style={{ color: T.textMuted, fontWeight: 400 }}>{t('scenarioForm.namePlaceholder')}</span>}
                        </span>
                        <span style={{ color: T.textMuted, flexShrink: 0 }}><PencilIcon /></span>
                    </button>
                )}

                {/* ステータスドロップダウン */}
                {!isNew && (
                    <div ref={statusDropRef} style={{ position: 'relative', flexShrink: 0 }}>
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
                                zIndex: 200, overflow: 'hidden', minWidth: 100,
                            }}>
                                {statusOptions.map(o => (
                                    <button
                                        key={o.value}
                                        onClick={() => { void changeStatus(o.value); }}
                                        style={{
                                            display: 'flex', alignItems: 'center',
                                            width: '100%', padding: '6px 12px',
                                            background: o.value === status ? T.primaryLight : 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            fontSize: T.fontSm, color: T.text, textAlign: 'left',
                                        }}
                                        onMouseEnter={e => { if (o.value !== status) e.currentTarget.style.background = T.surfaceHover; }}
                                        onMouseLeave={e => { if (o.value !== status) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Badge status={o.value} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 説明編集アイコン（ステータス横 → showDetails ドロワーを開閉） */}
                {!isNew && (
                    <button
                        onClick={() => setShowDetails(v => !v)}
                        title={t('scenarioForm.descLabel')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, padding: 0, borderRadius: T.radiusSm,
                            background: showDetails ? T.primaryLight : 'transparent',
                            border: `1px solid ${showDetails ? T.primaryBorder : 'transparent'}`,
                            color: showDetails ? T.primaryText : T.textMuted,
                            cursor: 'pointer', flexShrink: 0,
                        }}
                        onMouseEnter={e => { if (!showDetails) { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.borderColor = T.border; } }}
                        onMouseLeave={e => { if (!showDetails) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                    >
                        <DescEditIcon />
                    </button>
                )}

                {/* スペーサー */}
                <div style={{ flex: 1 }} />

                {/* ── 右ブロック ──────────────────────────────────────────── */}

                {/* 保存フラッシュ */}
                {savedMsg && (
                    <span style={{ fontSize: '10px', color: T.successText, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, marginRight: 4 }}>
                        ✓ {savedMsg}
                    </span>
                )}

                {/* ノードパレット / Analytics 退出ボタン */}
                {!isNew && (
                    <>
                        {analyticsMode ? (
                            /* Analytics モード中: 編集に戻る */
                            <button
                                onClick={() => setAnalyticsMode(false)}
                                style={{ ...cBtn({ fill: true }), fontWeight: 700 }}
                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                            >
                                ← {t('canvas.editMode')}
                            </button>
                        ) : (
                            /* 編集モード: ノードパレット */
                            NODE_TYPES.map(type => {
                                const c = NODE_COLORS[type];
                                const label = t(`node.type.${type}` as Parameters<typeof t>[0]);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => canvasRef.current?.addNode(type)}
                                        title={t('node.addToCanvas', { type: label })}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 3,
                                            padding: '1px 6px', height: 22, borderRadius: T.radiusMd,
                                            background: c.header, border: 'none',
                                            color: '#fff', fontWeight: 600, fontSize: '10px',
                                            cursor: 'pointer', flexShrink: 0, letterSpacing: '0.01em',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                                    >
                                        <span style={{ display: 'inline-flex', transform: 'scale(0.8)', transformOrigin: 'center', lineHeight: 0 }}>
                                            {NODE_ICONS[type]}
                                        </span>
                                        <span>{label}</span>
                                    </button>
                                );
                            })
                        )}

                        <div style={divider} />
                    </>
                )}

                {/* Analytics トグル */}
                {!isNew && (
                    <button
                        onClick={() => setAnalyticsMode(v => !v)}
                        title={t('canvas.analyticsMode')}
                        style={cBtn({ active: analyticsMode })}
                        onMouseEnter={e => { if (!analyticsMode) e.currentTarget.style.background = T.surfaceHover; }}
                        onMouseLeave={e => { if (!analyticsMode) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <AnalyticsIcon />
                        {t('canvas.analyticsMode')}
                    </button>
                )}

                {/* 保存 */}
                {!isNew && !analyticsMode && (
                    <button
                        disabled={saving}
                        onClick={() => canvasRef.current?.triggerSave()}
                        style={{ ...cBtn({ fill: true }), opacity: saving ? 0.6 : 1 }}
                        onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = 'brightness(0.9)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                    >
                        <SaveIcon />
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                )}

                {/* 新規: Create ボタン */}
                {isNew && (
                    <Btn
                        disabled={saving || !(draftName.trim() || name.trim())}
                        onClick={() => { void handleCreate(); }}
                    >
                        {saving ? t('common.creating') : t('common.create')}
                    </Btn>
                )}

                {/* 削除: 丸アイコンボタン */}
                {!isNew && (
                    <button
                        onClick={() => { void handleDelete(); }}
                        title={t('common.delete')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, padding: 0, borderRadius: '50%',
                            background: 'transparent', border: `1px solid ${T.border}`,
                            color: T.textMuted, cursor: 'pointer', flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background   = T.dangerBg;
                            e.currentTarget.style.borderColor  = T.dangerBorder;
                            e.currentTarget.style.color        = T.dangerText;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background   = 'transparent';
                            e.currentTarget.style.borderColor  = T.border;
                            e.currentTarget.style.color        = T.textMuted;
                        }}
                    >
                        <TrashIcon />
                    </button>
                )}
            </div>

            {/* ══ Details ドロワー（説明・折りたたみ）════════════════════════════ */}
            {showDetails && (
                <div style={{
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                    padding: '8px 12px', flexShrink: 0,
                    background: T.bg, borderBottom: `1px solid ${T.border}`,
                }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: T.fontXs, fontWeight: 600, color: T.textMuted, marginBottom: 3 }}>
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
                    {isNew && (
                        <Btn disabled={saving || !(draftName.trim() || name.trim())} onClick={() => { void handleCreate(); }}>
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
                        analyticsMode={analyticsMode}
                    />
                </div>
            )}

            {/* 新規作成: ヒント表示 */}
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

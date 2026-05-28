import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    getScenario, createScenario, updateScenario, deleteScenario, saveScenarioGraph,
    listCredentials,
    ApiError,
    type ScenarioNode, type ScenarioEdge, type CredentialSummary, type ChatNodeType,
} from '../api.js';
import { Btn, Badge, ErrorMsg, useLayout } from './Layout.js';
import { MobileHeader, MobileIconBtn, Pill } from './mobile/index.js';
import type { PillVariant } from './mobile/index.js';
import { T, NODE_TOKENS } from '../theme.js';
import { useTranslation } from '../i18n/index.js';
import ScenarioCanvas, { type ScenarioCanvasRef } from './editor/ScenarioCanvas.js';

// React Flow CSS は esbuild がバンドル
import '@xyflow/react/dist/style.css';

// ─────────────────────────────────────────────────────────────────────────────
// v2 (2026-05-28) — ピルグループ式の固定ヘッダー
//   [<] [Title ✎ · Status] | [⌘K Search] | [add: M C A E] | [⋯ 📊 💾 Save] [🗑]
//   3px ピル、46px ヘッダー高さ。CSS 変数経由でテーマ自動追従。
// ─────────────────────────────────────────────────────────────────────────────

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

// ── Icons ────────────────────────────────────────────────────────────────────
const IconBack = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const IconPencil = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>
);
const IconChevDown = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const IconDesc = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h10M8 17h6"/></svg>
);
const IconSearch = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconHistory = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 14"/></svg>
);
const IconAnalytics = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const IconSave = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const IconTrash = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
);

const NODE_TYPES: ChatNodeType[] = ['message', 'condition', 'action', 'end'];

// ── ヘッダー内部スタイル (memo: 高さ・寸法は T.editorHeaderH 経由) ─────────
const pill = (extra?: React.CSSProperties): React.CSSProperties => ({
    display: 'flex', alignItems: 'center',
    height: 30, padding: '0 4px', gap: 2,
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: T.radiusLg,
    flexShrink: 0,
    ...extra,
});

const iconBtn = (active?: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: T.radiusSm,
    color: active ? T.primary : T.textMuted,
    background: active ? T.primaryTint : 'transparent',
    border: 'none', cursor: 'pointer', flexShrink: 0,
});

export default function ScenarioFormPage() {
    const { id }  = useParams<{ id?: string }>();
    const isNew   = id === undefined;
    const nav     = useNavigate();
    const { t }   = useTranslation();
    const { isMobile } = useLayout();

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

    // ── Details ドロワー (説明) ─────────────────────────────────────────────
    const [showDetails, setShowDetails] = useState(isNew);

    // ── Analytics モード ────────────────────────────────────────────────────
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

    async function changeStatus(s: typeof status) {
        setStatus(s);
        setShowStatusDrop(false);
        if (!isNew) await saveMeta({ statusOverride: s });
    }

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

    // ── Node palette chip (右ピル内) ────────────────────────────────────────
    function NodeChip({ type }: { type: ChatNodeType }) {
        const tok = NODE_TOKENS[type];
        const label = t(`node.type.${type}` as Parameters<typeof t>[0]);
        return (
            <button onClick={() => canvasRef.current?.addNode(type)}
                title={t('node.addToCanvas', { type: label })}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    height: 22, padding: '0 9px', borderRadius: T.radiusSm,
                    background: 'transparent', color: T.text,
                    border: 'none', cursor: 'pointer',
                    fontSize: T.fontXs, fontWeight: 600, whiteSpace: 'nowrap',
                }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: tok.stripe }}/>
                <span>{label}</span>
            </button>
        );
    }

    // ─────────── Mobile layout ───────────
    if (isMobile) {
        const pillVariant: PillVariant =
            status === 'published' ? 'success' :
            status === 'archived'  ? 'archived' :
                                     'draft';

        // 新規作成: タイトル入力 + Create ボタンのみ
        if (isNew) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', background: T.bg }}>
                    <MobileHeader
                        title={t('scenarios.new' as Parameters<typeof t>[0]) || 'New scenario'}
                        onBack={() => nav('/scenarios')}
                    />
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label style={{
                            fontFamily: MONO, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: T.textMuted,
                        }}>{t('scenarioForm.nameLabel')}</label>
                        <input value={draftName}
                            onChange={e => setDraftName(e.target.value)}
                            placeholder={t('scenarioForm.namePlaceholder')}
                            style={{
                                height: T.controlHeight, padding: '0 12px',
                                borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
                                fontSize: T.fontMd, background: T.surface, color: T.text,
                                outline: 'none',
                            }}/>
                        <label style={{
                            fontFamily: MONO, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: T.textMuted, marginTop: 8,
                        }}>{t('scenarioForm.descLabel')}</label>
                        <input value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={t('scenarioForm.descPlaceholder')}
                            style={{
                                height: T.controlHeight, padding: '0 12px',
                                borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
                                fontSize: T.fontMd, background: T.surface, color: T.text,
                                outline: 'none',
                            }}/>
                        {error && <ErrorMsg msg={error}/>}
                        <Btn disabled={saving || !draftName.trim()}
                            onClick={() => { void handleCreate(); }}
                            style={{ marginTop: 8 }}>
                            {saving ? t('common.creating') : t('common.create')}
                        </Btn>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', background: T.bg }}>
                <MobileHeader
                    showMenu={false}
                    onBack={() => nav('/scenarios')}
                    title={name || t('scenarioForm.namePlaceholder')}
                    leading={
                        <div style={{
                            display: 'inline-flex', alignItems: 'center',
                            marginLeft: -4, marginRight: 2,
                        }}>
                            <Pill variant={pillVariant} label={status} dot={false}/>
                        </div>
                    }
                    trailing={
                        <>
                            <MobileIconBtn ariaLabel={t('canvas.analyticsMode')} onClick={() => setAnalyticsMode(v => !v)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={analyticsMode ? T.primary : 'currentColor'} strokeWidth="2" strokeLinecap="round" aria-hidden>
                                    <line x1="18" y1="20" x2="18" y2="10"/>
                                    <line x1="12" y1="20" x2="12" y2="4"/>
                                    <line x1="6" y1="20" x2="6" y2="14"/>
                                </svg>
                            </MobileIconBtn>
                            {!analyticsMode && (
                                <MobileIconBtn ariaLabel={t('common.save')} onClick={() => canvasRef.current?.triggerSave()}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                        <polyline points="17 21 17 13 7 13 7 21"/>
                                        <polyline points="7 3 7 8 15 8"/>
                                    </svg>
                                </MobileIconBtn>
                            )}
                        </>
                    }
                />

                {error && (
                    <div style={{ padding: '6px 16px', background: T.dangerBg, flexShrink: 0 }}>
                        <ErrorMsg msg={error} />
                    </div>
                )}

                <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
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

                {savedMsg && (
                    <span style={{
                        position: 'fixed', top: 'calc(56px + env(safe-area-inset-top))', right: 16,
                        fontSize: T.fontXs, color: T.successFg, fontWeight: 600,
                        background: T.successBg, padding: '4px 10px',
                        borderRadius: T.radiusXl, zIndex: 50,
                    }}>
                        ✓ {savedMsg}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* ══ ヘッダーバー (46px) ══════════════════════════════════════════ */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 12px',
                height: T.editorHeaderH, flexShrink: 0,
                borderBottom: `1px solid ${T.border}`,
                background: T.surfaceAlt,
            }}>
                {/* 左ピル: Back + Title + Status + Desc */}
                <div style={pill()}>
                    <button onClick={() => nav('/scenarios')}
                        title={t('common.backToList')} aria-label={t('common.backToList')}
                        style={iconBtn()}>
                        <IconBack/>
                    </button>
                    <div style={{ width: 1, height: 14, background: T.border, margin: '0 4px' }}/>

                    {/* インライン名前編集 */}
                    {editingName ? (
                        <input ref={nameInputRef} value={draftName}
                            onChange={e => setDraftName(e.target.value)}
                            onBlur={() => { void commitName(); }}
                            onKeyDown={e => {
                                if (e.key === 'Enter')  { e.preventDefault(); void commitName(); }
                                if (e.key === 'Escape') { e.preventDefault(); cancelEditName(); }
                            }}
                            placeholder={t('scenarioForm.namePlaceholder')}
                            style={{
                                fontSize: T.fontBase, fontWeight: 600, color: T.textStrong,
                                border: `1px solid ${T.primary}`, borderRadius: T.radiusSm,
                                padding: '2px 7px', background: T.surface,
                                minWidth: 130, maxWidth: 240, outline: 'none',
                            }}/>
                    ) : (
                        <button onClick={startEditName} title={t('scenarioForm.nameLabel')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '0 6px',
                                fontSize: T.fontBase, fontWeight: 600, color: T.text,
                                background: 'transparent', border: 'none', cursor: 'text',
                                maxWidth: 220, minWidth: 0,
                                overflow: 'hidden', whiteSpace: 'nowrap',
                            }}>
                            <span style={{
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                minWidth: 0,
                            }}>
                                {name || <span style={{ color: T.textMuted, fontWeight: 400 }}>
                                    {t('scenarioForm.namePlaceholder')}
                                </span>}
                            </span>
                            <span style={{ color: T.textFaint, flexShrink: 0, display: 'inline-flex' }}><IconPencil/></span>
                        </button>
                    )}

                    {/* ステータス */}
                    {!isNew && (
                        <>
                            <div style={{ width: 1, height: 14, background: T.border, margin: '0 4px' }}/>
                            <div ref={statusDropRef} style={{ position: 'relative', flexShrink: 0 }}>
                                <button onClick={() => setShowStatusDrop(v => !v)}
                                    title={t('scenarioForm.statusLabel')}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        height: 22, padding: '0 8px', marginRight: 2,
                                        background: status === 'published'
                                            ? T.successPillBg
                                            : status === 'draft' ? T.badgeDraftBg : T.badgeArchBg,
                                        color: status === 'published'
                                            ? T.successFg
                                            : status === 'draft' ? T.badgeDraftColor : T.badgeArchColor,
                                        borderRadius: 99, border: 'none', cursor: 'pointer',
                                        fontSize: T.fontXs, fontWeight: 700, whiteSpace: 'nowrap',
                                    }}>
                                    {status === 'published' && (
                                        <span style={{ width: 5, height: 5, borderRadius: 99, background: 'currentColor' }}/>
                                    )}
                                    <Badge status={status}/>
                                    <span style={{ display: 'inline-flex', opacity: 0.7 }}><IconChevDown/></span>
                                </button>
                                {showStatusDrop && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                                        background: T.surface, border: `1px solid ${T.border}`,
                                        borderRadius: T.radiusMd, boxShadow: T.shadowElevated,
                                        zIndex: 200, overflow: 'hidden', minWidth: 120,
                                    }}>
                                        {statusOptions.map(o => (
                                            <button key={o.value}
                                                onClick={() => { void changeStatus(o.value); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center',
                                                    width: '100%', padding: '6px 12px',
                                                    background: o.value === status ? T.primaryLight : 'transparent',
                                                    border: 'none', cursor: 'pointer',
                                                    fontSize: T.fontSm, color: T.text, textAlign: 'left',
                                                }}>
                                                <Badge status={o.value}/>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowDetails(v => !v)}
                                title={t('scenarioForm.descLabel')}
                                style={{ ...iconBtn(showDetails), color: showDetails ? T.primary : T.textMuted }}>
                                <IconDesc/>
                            </button>
                        </>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}/>

                {/* 中央ピル: Search */}
                <div style={pill({ padding: '0 10px', gap: 7, minWidth: 220 })}>
                    <span style={{ color: T.textFaint, display: 'inline-flex' }}><IconSearch/></span>
                    <span style={{ padding: '0 4px', fontSize: T.fontSm, color: T.textMuted, flex: 1 }}>
                        {t('common.search')}
                    </span>
                    <span style={{
                        padding: '1px 6px', borderRadius: T.radiusSm,
                        background: T.surfaceAlt, border: `1px solid ${T.border}`,
                        fontFamily: MONO, fontSize: 9.5, color: T.textFaint,
                    }}>⌘K</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}/>

                {/* 右1: ノードパレット */}
                {!isNew && !analyticsMode && (
                    <div style={pill()}>
                        <span style={{
                            padding: '0 6px',
                            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em',
                            color: T.textFaint, textTransform: 'uppercase', fontFamily: MONO,
                            borderRight: `1px solid ${T.border}`, marginRight: 2,
                        }}>add</span>
                        {NODE_TYPES.map(type => <NodeChip key={type} type={type}/>)}
                    </div>
                )}

                {/* 右2: アクション群 */}
                {!isNew && (
                    <div style={pill()}>
                        <button title={t('canvas.analyticsMode')}
                            onClick={() => setAnalyticsMode(v => !v)}
                            style={iconBtn(analyticsMode)}>
                            <IconAnalytics/>
                        </button>
                        <button title={t('common.history')} style={iconBtn()}>
                            <IconHistory/>
                        </button>
                        {!analyticsMode && (
                            <>
                                <div style={{ width: 1, height: 14, background: T.border, margin: '0 2px' }}/>
                                <button disabled={saving}
                                    onClick={() => canvasRef.current?.triggerSave()}
                                    style={{
                                        height: 22, padding: '0 10px',
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        background: T.primary, color: T.primaryFg,
                                        border: 'none', borderRadius: T.radiusSm,
                                        cursor: saving ? 'wait' : 'pointer',
                                        opacity: saving ? 0.6 : 1,
                                        fontSize: T.fontXs, fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                    }}>
                                    <IconSave/>
                                    {saving ? t('common.saving') : t('common.save')}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* 新規作成: Create ボタン */}
                {isNew && (
                    <Btn disabled={saving || !(draftName.trim() || name.trim())}
                        onClick={() => { void handleCreate(); }}>
                        {saving ? t('common.creating') : t('common.create')}
                    </Btn>
                )}

                {/* 削除: 円ボタン */}
                {!isNew && (
                    <button onClick={() => { void handleDelete(); }}
                        title={t('common.delete')}
                        style={{
                            width: 28, height: 28, borderRadius: 99,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: T.surface, border: `1px solid ${T.border}`,
                            color: T.textMuted, cursor: 'pointer', flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background  = T.dangerBg;
                            e.currentTarget.style.borderColor = T.dangerBorder;
                            e.currentTarget.style.color       = T.dangerFg;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background  = T.surface;
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.color       = T.textMuted;
                        }}>
                        <IconTrash/>
                    </button>
                )}

                {/* 保存フラッシュ (一時表示) */}
                {savedMsg && (
                    <span style={{
                        position: 'absolute', top: 52, right: 16,
                        fontSize: T.fontXs, color: T.successFg, fontWeight: 600,
                        background: T.successBg, padding: '4px 10px',
                        borderRadius: T.radiusXl,
                    }}>
                        ✓ {savedMsg}
                    </span>
                )}
            </div>

            {/* ══ Details ドロワー (説明) ═══════════════════════════════════════ */}
            {showDetails && (
                <div style={{
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                    padding: '8px 12px', flexShrink: 0,
                    background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`,
                }}>
                    <div style={{ flex: 1 }}>
                        <label style={{
                            display: 'block',
                            fontSize: T.fontXs, fontWeight: 600,
                            color: T.textMuted, fontFamily: MONO,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            marginBottom: 4,
                        }}>{t('scenarioForm.descLabel')}</label>
                        <input value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={t('scenarioForm.descPlaceholder')}
                            style={{
                                width: '100%', padding: '5px 9px',
                                borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
                                fontSize: T.fontBase, boxSizing: 'border-box',
                                background: T.surface, color: T.text,
                            }}/>
                    </div>
                    {isNew && (
                        <Btn disabled={saving || !(draftName.trim() || name.trim())}
                            onClick={() => { void handleCreate(); }}>
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

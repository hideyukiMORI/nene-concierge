import {
    ReactFlow,
    Background,
    BackgroundVariant,
    MiniMap,
    Panel,
    addEdge,
    useNodesState,
    useEdgesState,
    useReactFlow,
    type Node,
    type Edge,
    type Connection,
    type NodeTypes,
} from '@xyflow/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type {
    ScenarioNode, ScenarioEdge, CredentialSummary, ChatNodeType,
    NodeAnalyticsData, ScenarioAnalyticsResponse, AnalyticsPeriod,
} from '../../api.js';
import { getScenarioAnalytics } from '../../api.js';
import { NODE_COLORS, MessageNode, ConditionNode, ActionNode, EndNode } from './NodeTypes.js';
import NodeConfigPanel from './NodeConfigPanel.js';
import { T, NODE_TOKENS } from '../../theme.js';
import { useTranslation } from '../../i18n/index.js';
import { useLayout } from '../Layout.js';
import { BottomSheet, FAB } from '../mobile/index.js';

// ── React Flow ノードタイプ登録 ───────────────────────────────────────────────

const nodeTypes: NodeTypes = {
    message:   MessageNode,
    condition: ConditionNode,
    action:    ActionNode,
    end:       EndNode,
};

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

// ── ヘルパー: API 型 ↔ ReactFlow 型 ─────────────────────────────────────────

function apiNodeToRF(n: ScenarioNode): Node {
    return {
        id:       n.node_id,
        type:     n.type,
        position: { x: n.position_x, y: n.position_y },
        data:     { ...n.data, label: n.label },
    };
}

function apiEdgeToRF(e: ScenarioEdge, i: number): Edge {
    return {
        id:     `e-${e.source_node_id}-${e.target_node_id}-${i}`,
        source: e.source_node_id,
        target: e.target_node_id,
        label:  e.label ?? undefined,
        sourceHandle: e.label === 'true' ? 'true' : e.label === 'false' ? 'false' : null,
    };
}

function rfNodeToApi(n: Node): ScenarioNode {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { label, _analytics, _isBottleneck, ...rest } = n.data as Record<string, unknown>;
    return {
        node_id:    n.id,
        type:       n.type as ChatNodeType,
        label:      String(label ?? ''),
        data:       rest as Record<string, unknown>,
        position_x: n.position.x,
        position_y: n.position.y,
    };
}

function rfEdgeToApi(e: Edge): ScenarioEdge {
    return {
        source_node_id: e.source,
        target_node_id: e.target,
        label:          typeof e.label === 'string' ? e.label : null,
    };
}

// ── Analytics 期間 ────────────────────────────────────────────────────────────

const PERIODS: AnalyticsPeriod[] = ['1d', '7d', '30d', '90d'];
const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
    '1d': '1D', '7d': '7D', '30d': '30D', '90d': '90D',
};

// ── Analytics サマリーパネル（右フローティング）───────────────────────────────

function AnalyticsSummaryPanel({
    report, loading, noData, period, onPeriodChange,
}: {
    report:          ScenarioAnalyticsResponse | null;
    loading:         boolean;
    noData:          boolean;
    period:          AnalyticsPeriod;
    onPeriodChange:  (p: AnalyticsPeriod) => void;
}) {
    const { t } = useTranslation();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 期間セレクタ */}
            <div style={{
                display: 'flex', gap: 2, padding: '8px 10px',
                borderBottom: `1px solid ${T.border}`, flexShrink: 0,
            }}>
                <span style={{ fontSize: T.fontXs, color: T.textMuted, alignSelf: 'center', marginRight: 4 }}>
                    📊
                </span>
                {PERIODS.map(p => (
                    <button
                        key={p}
                        onClick={() => onPeriodChange(p)}
                        style={{
                            padding: '2px 7px', fontSize: T.fontXs, fontWeight: p === period ? 700 : 400,
                            border: `1px solid ${p === period ? T.primary : T.border}`,
                            borderRadius: T.radiusSm, cursor: 'pointer',
                            background: p === period ? T.primaryLight : 'transparent',
                            color: p === period ? T.primaryText : T.textMuted,
                        }}
                    >
                        {PERIOD_LABELS[p]}
                    </button>
                ))}
            </div>

            {/* コンテンツ */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: T.fontSm }}>
                    {t('canvas.analytics.loading')}
                </div>
            ) : noData || !report ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: T.fontSm, textAlign: 'center', padding: 16, lineHeight: 1.5 }}>
                    {t('canvas.analytics.noData')}
                </div>
            ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                    {(() => {
                        const cRate = report.total_sessions > 0
                            ? Math.round(report.converted_sessions / report.total_sessions * 100) : 0;
                        const dRate = report.total_sessions > 0
                            ? Math.round(report.completed_sessions / report.total_sessions * 100) : 0;

                        function StatRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
                            return (
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                                    <span style={{ fontSize: T.fontSm, color: T.textMuted }}>{label}</span>
                                    <span style={{ fontSize: T.fontSm, fontWeight: 700, color: T.textStrong, fontFamily: MONO }}>
                                        {value.toLocaleString()}
                                        {sub && <span style={{ fontSize: T.fontXs, fontWeight: 400, color: T.textMuted, marginLeft: 4 }}>{sub}</span>}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <>
                                <StatRow label={t('canvas.analytics.sessions')}  value={report.total_sessions} />
                                <StatRow label={t('canvas.analytics.completed')} value={report.completed_sessions} sub={`${dRate}%`} />
                                <StatRow label={t('canvas.analytics.converted')} value={report.converted_sessions} sub={`${cRate}%`} />
                                <div style={{ marginTop: 8, fontSize: T.fontXs, color: T.textMuted, fontFamily: MONO }}>
                                    {report.period_from} – {report.period_to}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

// ── BottomDock ────────────────────────────────────────────────────────────────
// ReactFlow の Panel として canvas 内部に配置 → useReactFlow が使える

const ZoomInIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
);
const ZoomOutIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
);
const FitViewIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
    </svg>
);

function DockBtn({ onClick, title, children }: {
    onClick: () => void; title: string; children: React.ReactNode;
}) {
    return (
        <button onClick={onClick} title={title}
            style={{
                width: 28, height: 28, borderRadius: T.radiusSm,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.textMuted,
                transition: `background ${T.transitionFast}, color ${T.transitionFast}`,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = T.surfaceHover;
                e.currentTarget.style.color = T.text;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = T.textMuted;
            }}>
            {children}
        </button>
    );
}

// ── MobileZoomStack — bottom-left 縦型ズーム UI (mobile only) ────────────────

function MobileZoomStack() {
    const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
    const [pct, setPct] = useState(100);
    useEffect(() => {
        const tick = () => setPct(Math.round(getZoom() * 100));
        const id = setInterval(tick, 300);
        return () => clearInterval(id);
    }, [getZoom]);
    return (
        <div style={{
            background: T.glassDockBg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            boxShadow: T.shadowElevated,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            <div style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700,
                color: T.textStrong, letterSpacing: '0.04em',
                borderBottom: `1px solid ${T.borderLight}`,
                padding: '8px 0', textAlign: 'center', minWidth: 38,
            }}>{pct}%</div>
            <button onClick={() => zoomIn({ duration: 150 })} aria-label="Zoom in"
                style={zoomStackBtn}>
                <ZoomInIcon/>
            </button>
            <button onClick={() => zoomOut({ duration: 150 })} aria-label="Zoom out"
                style={zoomStackBtn}>
                <ZoomOutIcon/>
            </button>
            <button onClick={() => fitView({ padding: 0.6, maxZoom: 0.85, duration: 200 })} aria-label="Fit view"
                style={{ ...zoomStackBtn, borderBottom: 'none' }}>
                <FitViewIcon/>
            </button>
        </div>
    );
}
const zoomStackBtn: React.CSSProperties = {
    width: 38, height: 38, background: 'transparent',
    border: 'none', borderBottom: `1px solid ${T.borderLight}`,
    color: T.textMuted, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

// ── MobileMiniMap — top-right の自前ミニマップ (110×78) ──────────────────────

function MobileMiniMap({ nodes }: { nodes: Node[] }) {
    if (nodes.length === 0) return null;
    // node の bounding box を計算してミニマップに正規化
    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + 160;  // ノード幅 ~160 を加算
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + 80;   // ノード高 ~80
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    return (
        <div style={{
            position: 'relative',
            width: 110, height: 78,
            background: T.glassDockBg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${T.border}`,
            borderRadius: 8, padding: 6,
            boxShadow: T.shadowElevated,
        }}>
            <span style={{
                position: 'absolute', top: 3, left: 6,
                fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                letterSpacing: '0.10em', textTransform: 'uppercase',
                color: T.textFaint,
            }}>map</span>
            {nodes.map(n => {
                const tok = NODE_TOKENS[n.type as ChatNodeType];
                const left = ((n.position.x - minX) / spanX) * 100;
                const top  = ((n.position.y - minY) / spanY) * 100;
                return (
                    <span key={n.id} style={{
                        position: 'absolute',
                        left: `${left * 0.85 + 7}%`, top: `${top * 0.75 + 18}%`,
                        width: 14, height: 5,
                        borderRadius: 1.5,
                        background: tok?.stripe ?? T.textFaint,
                    }}/>
                );
            })}
        </div>
    );
}

function BottomDock({ nodeCount }: { nodeCount: number }) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            background: T.glassDockBg,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            padding: '3px 6px',
            boxShadow: T.shadowElevated,
        }}>
            <DockBtn onClick={() => zoomOut({ duration: 150 })} title="Zoom out">
                <ZoomOutIcon/>
            </DockBtn>
            <DockBtn onClick={() => fitView({ padding: 0.6, maxZoom: 0.85, duration: 200 })} title="Fit view">
                <FitViewIcon/>
            </DockBtn>
            <DockBtn onClick={() => zoomIn({ duration: 150 })} title="Zoom in">
                <ZoomInIcon/>
            </DockBtn>
            <div style={{ width: 1, height: 14, background: T.border, margin: '0 4px' }}/>
            <span style={{
                fontSize: 10.5, fontFamily: MONO,
                color: T.textFaint, padding: '0 4px',
                whiteSpace: 'nowrap', userSelect: 'none',
            }}>
                {nodeCount} nodes
            </span>
        </div>
    );
}

// ── Public ref handle ─────────────────────────────────────────────────────────

export interface ScenarioCanvasRef {
    triggerSave: () => void;
    addNode:     (type: ChatNodeType) => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    scenarioId:    number;
    initialNodes:  ScenarioNode[];
    initialEdges:  ScenarioEdge[];
    credentials:   CredentialSummary[];
    onSave:        (nodes: ScenarioNode[], edges: ScenarioEdge[]) => void;
    analyticsMode: boolean;   // 親ヘッダーから制御
    /** モバイルヘッダーのノード数表示用 — 内部 nodes が変わるたびに発火 */
    onLiveNodeCount?: (n: number) => void;
    /** ライブ state を親に通知 — リサイズで canvas が unmount/remount しても
     *  親が ref に保存しておけば新 instance に initialNodes として渡せる。 */
    onLiveStateChange?: (nodes: ScenarioNode[], edges: ScenarioEdge[]) => void;
}

// ── コンポーネント ──────────────────────────────────────────────────────────────

const ScenarioCanvas = forwardRef<ScenarioCanvasRef, Props>(function ScenarioCanvas(
    { scenarioId, initialNodes, initialEdges, credentials, onSave, analyticsMode, onLiveNodeCount, onLiveStateChange },
    ref,
) {
    const { t } = useTranslation();
    const { isMobile } = useLayout();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes.map(apiNodeToRF));
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges.map(apiEdgeToRF));
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [addPickerOpen, setAddPickerOpen]   = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // ライブノード数を親 (モバイルヘッダー) に通知
    useEffect(() => {
        onLiveNodeCount?.(nodes.length);
    }, [nodes.length, onLiveNodeCount]);

    // ライブ state を親に通知 — リサイズで canvas が unmount/remount される場合に
    // 親が ref で保持しておき、次の instance に initialNodes として渡せるようにする。
    useEffect(() => {
        onLiveStateChange?.(nodes.map(rfNodeToApi), edges.map(rfEdgeToApi));
    }, [nodes, edges, onLiveStateChange]);

    // ── Analytics 状態（期間は内部管理、モードは親から制御）──────────────────────
    const [period, setPeriod]                   = useState<AnalyticsPeriod>('7d');
    const [analyticsReport, setAnalyticsReport] = useState<ScenarioAnalyticsResponse | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsNoData, setAnalyticsNoData]   = useState(false);

    // initialNodes 変化時に同期
    useEffect(() => {
        setNodes(initialNodes.map(apiNodeToRF));
        setEdges(initialEdges.map(apiEdgeToRF));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes.length, initialEdges.length]);

    // ── Analytics フェッチ ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!analyticsMode) {
            setNodes(nds => nds.map(n => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _analytics, _isBottleneck, ...rest } = n.data as Record<string, unknown>;
                return { ...n, data: rest };
            }));
            setAnalyticsReport(null);
            setAnalyticsNoData(false);
            return;
        }

        let cancelled = false;
        setAnalyticsLoading(true);
        setAnalyticsNoData(false);

        void getScenarioAnalytics(scenarioId, period).then(report => {
            if (cancelled) return;
            setAnalyticsReport(report);

            if (report.total_sessions === 0) {
                setAnalyticsNoData(true);
                setAnalyticsLoading(false);
                return;
            }

            const analyticsMap = new Map<string, NodeAnalyticsData>(
                report.nodes.map(n => [n.node_id, n]),
            );
            const bottleneckSet = new Set(report.bottlenecks);

            setNodes(nds => nds.map(n => ({
                ...n,
                data: { ...n.data, _analytics: analyticsMap.get(n.id), _isBottleneck: bottleneckSet.has(n.id) },
            })));
            setAnalyticsLoading(false);
        }).catch(() => {
            if (cancelled) return;
            setAnalyticsNoData(true);
            setAnalyticsLoading(false);
        });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analyticsMode, period, scenarioId]);

    const onConnect = useCallback((connection: Connection) => {
        setEdges(eds => addEdge({ ...connection, id: `e-${uuidv4()}` }, eds));
    }, [setEdges]);

    // ── ノード追加（ref 経由でヘッダーから呼び出し可能）───────────────────────────
    const addNode = useCallback((type: ChatNodeType) => {
        const id = uuidv4();
        const defaults: Record<ChatNodeType, Record<string, unknown>> = {
            message:   { text: '', choices: [], variable_name: '' },
            condition: { variable: '', operator: 'eq', value: '' },
            action:    { action_type: 'http', credential_id: undefined },
            end:       { outcome: 'completed' },
        };
        const defaultLabel = t(`node.type.${type}` as Parameters<typeof t>[0]);
        const newNode: Node = {
            id,
            type,
            position: { x: 120 + Math.random() * 200, y: 80 + Math.random() * 180 },
            data:     { ...defaults[type], label: defaultLabel },
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedNodeId(id);
    }, [setNodes, t]);

    // ── ノード設定変更 ─────────────────────────────────────────────────────────
    // NOTE: スプレッドは `{ ...data, label }` の順序にする。逆順だと data 側の
    //   古い label プロパティが新しい label を上書きしてしまい、LABEL 編集が
    //   反映されない (NodeConfigPanel が node.data 全体を data として渡すため)。
    function handleNodeChange(id: string, label: string, data: Record<string, unknown>) {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...data, label } } : n));
    }

    // ── ノード削除 ─────────────────────────────────────────────────────────────
    function handleNodeDelete(id: string) {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
        setSelectedNodeId(null);
    }

    // ── 保存 ──────────────────────────────────────────────────────────────────
    const handleSave = useCallback(() => {
        onSave(nodes.map(rfNodeToApi), edges.map(rfEdgeToApi));
    }, [nodes, edges, onSave]);

    useImperativeHandle(ref, () => ({ triggerSave: handleSave, addNode }), [handleSave, addNode]);

    const selectedNode = !analyticsMode ? (nodes.find(n => n.id === selectedNodeId) ?? null) : null;
    const showRightPanel = analyticsMode || selectedNode !== null;

    // モバイルで選択ノードシートを開いている時はキャンバスを上側に詰める
    const sheetHeight = 380;
    const canvasBottomInset = (isMobile && selectedNode && !analyticsMode) ? sheetHeight : 0;

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <div ref={reactFlowWrapper}
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    bottom: canvasBottomInset,
                    background: T.canvasBg,
                    transition: 'bottom 200ms ease',
                }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => { if (!analyticsMode) setSelectedNodeId(node.id); }}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    fitViewOptions={{ padding: 0.6, maxZoom: 0.85 }}
                    deleteKeyCode={analyticsMode ? null : 'Delete'}
                    nodesDraggable={!analyticsMode}
                    nodesConnectable={!analyticsMode}
                    elementsSelectable={!analyticsMode}
                    defaultEdgeOptions={{
                        style: { stroke: T.edgeStroke, strokeWidth: 1.5 },
                    }}
                >
                    {/* ドットグリッド背景 */}
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color={T.canvasDot} />

                    {/* ミニマップ (desktop のみ — モバイルは自前 .minimap を canvas 外に描画)
                        bottom: 64 でテーマスイッチャー (右下 fixed) との衝突を回避。
                        参考: docs/designs/footer_2026-05-29_01 variant-c.jsx L310-313 */}
                    {!isMobile && (
                        <MiniMap
                            nodeColor={n => NODE_COLORS[n.type as ChatNodeType]?.header ?? T.sidebarMuted}
                            style={{
                                background: T.minimapBg,
                                border: `1px solid ${T.border}`,
                                borderRadius: T.radiusMd,
                                bottom: 32,
                                right: 8,
                            }}
                            maskColor="oklch(0% 0 0 / 0.08)"
                            pannable
                            zoomable
                        />
                    )}

                    {/* ボトムドック (desktop のみ — モバイルは縦型 ZoomStack) */}
                    {!isMobile && (
                        <Panel position="bottom-center" style={{ marginBottom: 14 }}>
                            <BottomDock nodeCount={nodes.length} />
                        </Panel>
                    )}

                    {/* モバイル: 縦型 ZoomStack を bottom-left に */}
                    {isMobile && (
                        <Panel position="bottom-left" style={{ marginBottom: 12, marginLeft: 12 }}>
                            <MobileZoomStack />
                        </Panel>
                    )}

                    {/* モバイル: 自前の mini minimap を top-right に */}
                    {isMobile && (
                        <Panel position="top-right" style={{ marginTop: 12, marginRight: 12 }}>
                            <MobileMiniMap nodes={nodes} />
                        </Panel>
                    )}
                </ReactFlow>
            </div>

            {/* 右ドロワー (desktop / tablet) — モバイルは BottomSheet 経由 */}
            {!isMobile && (
                <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0,
                    width: T.editorDrawerW,
                    zIndex: 10,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    transform: showRightPanel ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.20s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: showRightPanel ? 'auto' : 'none',
                }}>
                    {analyticsMode ? (
                        <div style={{
                            height: '100%',
                            background: T.surfaceAlt,
                            borderLeft: `1px solid ${T.border}`,
                            boxShadow: '-6px 0 20px rgba(0,0,0,.07)',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <AnalyticsSummaryPanel
                                report={analyticsReport}
                                loading={analyticsLoading}
                                noData={analyticsNoData}
                                period={period}
                                onPeriodChange={setPeriod}
                            />
                        </div>
                    ) : selectedNode ? (
                        <NodeConfigPanel
                            node={selectedNode}
                            credentials={credentials}
                            onChange={handleNodeChange}
                            onDelete={handleNodeDelete}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    ) : null}
                </div>
            )}

            {/* モバイル: インライン Sheet (canvas 下に張り付き、380px) */}
            {isMobile && selectedNode && !analyticsMode && (() => {
                const tok = NODE_TOKENS[selectedNode.type as ChatNodeType];
                return (
                    <div style={{
                        position: 'absolute', left: 0, right: 0, bottom: 0,
                        height: sheetHeight,
                        background: T.surface,
                        borderRadius: '18px 18px 0 0',
                        boxShadow: '0 -10px 30px -10px rgba(15,23,42,.18)',
                        display: 'flex', flexDirection: 'column',
                        paddingBottom: 'env(safe-area-inset-bottom)',
                        overflow: 'hidden',
                        zIndex: 20,
                    }}>
                        {/* type stripe */}
                        <div style={{ height: 3, background: tok.stripe, flexShrink: 0 }}/>
                        {/* drag handle */}
                        <div style={{
                            width: 36, height: 4, borderRadius: 99,
                            background: T.borderLight,
                            margin: '8px auto 4px', flexShrink: 0,
                        }}/>
                        {/* NodeConfigPanel をシート内に埋め込み (mobile prop) */}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <NodeConfigPanel
                                node={selectedNode}
                                credentials={credentials}
                                onChange={handleNodeChange}
                                onDelete={handleNodeDelete}
                                onClose={() => setSelectedNodeId(null)}
                                mobile
                            />
                        </div>
                    </div>
                );
            })()}

            {/* モバイル: Analytics サマリーも BottomSheet */}
            {isMobile && (
                <BottomSheet
                    open={analyticsMode}
                    onClose={() => { /* parent toggles analyticsMode */ }}
                    title="Analytics"
                    height="60vh">
                    <AnalyticsSummaryPanel
                        report={analyticsReport}
                        loading={analyticsLoading}
                        noData={analyticsNoData}
                        period={period}
                        onPeriodChange={setPeriod}
                    />
                </BottomSheet>
            )}

            {/* モバイル: ノード追加 FAB + Picker BottomSheet */}
            {isMobile && !analyticsMode && (
                <>
                    <FAB ariaLabel={t('node.addToCanvas', { type: '' })} onClick={() => setAddPickerOpen(true)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <line x1="12" y1="5" x2="12" y2="19"/>
                        </svg>
                    </FAB>
                    <BottomSheet
                        open={addPickerOpen}
                        onClose={() => setAddPickerOpen(false)}
                        title="Add node">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(['message','condition','action','end'] as ChatNodeType[]).map(type => {
                                const tok = NODE_TOKENS[type];
                                return (
                                    <button key={type}
                                        onClick={() => { addNode(type); setAddPickerOpen(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '12px 14px',
                                            background: T.surface,
                                            border: `1px solid ${T.border}`,
                                            borderLeft: `3px solid ${tok.stripe}`,
                                            borderRadius: T.radiusMd,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            WebkitTapHighlightColor: 'transparent',
                                        }}>
                                        <span style={{
                                            width: 28, height: 28, borderRadius: T.radiusSm,
                                            background: tok.chip, border: `1px solid ${tok.chipEdge}`,
                                            color: tok.stripe,
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: 14, flexShrink: 0,
                                        }}>{type[0]?.toUpperCase()}</span>
                                        <span style={{
                                            flex: 1, fontSize: 15, fontWeight: 600,
                                            color: T.textStrong,
                                        }}>{t(`node.type.${type}` as Parameters<typeof t>[0])}</span>
                                        <span style={{
                                            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                                            fontSize: 11, color: T.textFaint,
                                        }}>{type}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </BottomSheet>
                </>
            )}
        </div>
    );
});

export default ScenarioCanvas;

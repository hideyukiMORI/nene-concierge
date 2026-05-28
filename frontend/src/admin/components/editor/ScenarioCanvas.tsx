import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
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
import { T } from '../../theme.js';
import { useTranslation } from '../../i18n/index.js';

// ── React Flow ノードタイプ登録 ───────────────────────────────────────────────

const nodeTypes: NodeTypes = {
    message:   MessageNode,
    condition: ConditionNode,
    action:    ActionNode,
    end:       EndNode,
};

// ── ヘルパー: API 型 ↔ ReactFlow 型 ─────────────────────────────────────────

function apiNodeToRF(n: ScenarioNode): Node {
    return {
        id:       n.node_id,
        type:     n.type,
        position: { x: n.position_x, y: n.position_y },
        data:     { label: n.label, ...n.data },
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
                                    <span style={{ fontSize: T.fontMd, fontWeight: 700, color: T.textStrong }}>
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
                                <div style={{ marginTop: 8, fontSize: T.fontXs, color: T.textMuted }}>
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
}

// ── コンポーネント ──────────────────────────────────────────────────────────────

const ScenarioCanvas = forwardRef<ScenarioCanvasRef, Props>(function ScenarioCanvas(
    { scenarioId, initialNodes, initialEdges, credentials, onSave, analyticsMode },
    ref,
) {
    const { t } = useTranslation();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes.map(apiNodeToRF));
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges.map(apiEdgeToRF));
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

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
            data:     { label: defaultLabel, ...defaults[type] },
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedNodeId(id);
    }, [setNodes, t]);

    // ── ノード設定変更 ─────────────────────────────────────────────────────────
    function handleNodeChange(id: string, label: string, data: Record<string, unknown>) {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { label, ...data } } : n));
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

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <div ref={reactFlowWrapper} style={{ position: 'absolute', inset: 0 }}>
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
                >
                    <Background gap={20} color={T.border} />
                    <Controls />
                    <MiniMap
                        nodeColor={n => NODE_COLORS[n.type as ChatNodeType]?.header ?? T.sidebarMuted}
                        style={{ background: T.tableHeader, border: `1px solid ${T.border}` }}
                    />
                </ReactFlow>
            </div>

            {/* 右ドロワー: ノード設定 or Analytics サマリー */}
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
        </div>
    );
});

export default ScenarioCanvas;

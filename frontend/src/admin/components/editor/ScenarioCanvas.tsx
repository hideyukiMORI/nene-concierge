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
    Panel,
} from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type {
    ScenarioNode, ScenarioEdge, CredentialSummary, ChatNodeType,
    NodeAnalyticsData, ScenarioAnalyticsResponse, AnalyticsPeriod,
} from '../../api.js';
import { getScenarioAnalytics } from '../../api.js';
import { NODE_COLORS, NODE_ICONS, MessageNode, ConditionNode, ActionNode, EndNode } from './NodeTypes.js';
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
    // _analytics / _isBottleneck を除外して保存
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

// ── Analytics 期間ボタン ──────────────────────────────────────────────────────

const PERIODS: AnalyticsPeriod[] = ['1d', '7d', '30d', '90d'];
const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
    '1d': '1D', '7d': '7D', '30d': '30D', '90d': '90D',
};

// ── Analytics サマリーパネル ──────────────────────────────────────────────────

function AnalyticsSummaryPanel({
    report, loading, noData,
}: {
    report: ScenarioAnalyticsResponse | null;
    loading: boolean;
    noData: boolean;
}) {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div style={{
                width: 220, padding: '20px 16px', background: T.surface,
                borderLeft: `1px solid ${T.border}`, color: T.textMuted,
                fontSize: T.fontSm, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {t('canvas.analytics.loading')}
            </div>
        );
    }

    if (noData || !report) {
        return (
            <div style={{
                width: 220, padding: '20px 16px', background: T.surface,
                borderLeft: `1px solid ${T.border}`, color: T.textMuted,
                fontSize: T.fontSm, display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', lineHeight: 1.5,
            }}>
                {t('canvas.analytics.noData')}
            </div>
        );
    }

    const cRate = report.total_sessions > 0
        ? Math.round(report.converted_sessions / report.total_sessions * 100)
        : 0;
    const dRate = report.total_sessions > 0
        ? Math.round(report.completed_sessions / report.total_sessions * 100)
        : 0;

    function StatRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
        return (
            <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: `1px solid ${T.border}`,
            }}>
                <span style={{ fontSize: T.fontSm, color: T.textMuted }}>{label}</span>
                <span style={{ fontSize: T.fontMd, fontWeight: 700, color: T.textStrong }}>
                    {value.toLocaleString()}
                    {sub && <span style={{ fontSize: T.fontXs, fontWeight: 400, color: T.textMuted, marginLeft: 4 }}>{sub}</span>}
                </span>
            </div>
        );
    }

    return (
        <div style={{
            width: 220, background: T.surface, borderLeft: `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
            <div style={{
                padding: '12px 14px 8px',
                borderBottom: `1px solid ${T.border}`,
                fontSize: T.fontSm, fontWeight: 700, color: T.textStrong,
            }}>
                📊 {t('canvas.analyticsMode')}
            </div>
            <div style={{ padding: '4px 14px 14px' }}>
                <StatRow label={t('canvas.analytics.sessions')}   value={report.total_sessions} />
                <StatRow label={t('canvas.analytics.completed')}  value={report.completed_sessions} sub={`${dRate}%`} />
                <StatRow label={t('canvas.analytics.converted')}  value={report.converted_sessions} sub={`${cRate}%`} />
            </div>
            <div style={{ padding: '4px 14px', fontSize: T.fontXs, color: T.textMuted }}>
                {report.period_from} – {report.period_to}
            </div>
        </div>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    scenarioId:    number;
    initialNodes:  ScenarioNode[];
    initialEdges:  ScenarioEdge[];
    credentials:   CredentialSummary[];
    saving:        boolean;
    onSave:        (nodes: ScenarioNode[], edges: ScenarioEdge[]) => void;
}

// ── コンポーネント ──────────────────────────────────────────────────────────────

export default function ScenarioCanvas({
    scenarioId, initialNodes, initialEdges, credentials, saving, onSave,
}: Props) {
    const { t } = useTranslation();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes.map(apiNodeToRF));
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges.map(apiEdgeToRF));
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // ── Analytics 状態 ─────────────────────────────────────────────────────────
    const [analyticsMode, setAnalyticsMode]   = useState(false);
    const [period, setPeriod]                 = useState<AnalyticsPeriod>('7d');
    const [analyticsReport, setAnalyticsReport] = useState<ScenarioAnalyticsResponse | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsNoData, setAnalyticsNoData]   = useState(false);

    // initialNodes が変わった（ページロード後）ときに同期
    useEffect(() => {
        setNodes(initialNodes.map(apiNodeToRF));
        setEdges(initialEdges.map(apiEdgeToRF));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes.length, initialEdges.length]);

    // ── Analytics フェッチ ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!analyticsMode) {
            // Edit モードに戻したらオーバーレイを除去
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

            // ノードにアナリティクスデータを付与
            const analyticsMap = new Map<string, NodeAnalyticsData>(
                report.nodes.map(n => [n.node_id, n]),
            );
            const bottleneckSet = new Set(report.bottlenecks);

            setNodes(nds => nds.map(n => ({
                ...n,
                data: {
                    ...n.data,
                    _analytics:    analyticsMap.get(n.id),
                    _isBottleneck: bottleneckSet.has(n.id),
                },
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

    // ── ノード追加 ─────────────────────────────────────────────────────────────
    function addNode(type: ChatNodeType) {
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
            position: { x: 100 + Math.random() * 200, y: 80 + Math.random() * 200 },
            data:     { label: defaultLabel, ...defaults[type] },
        };
        setNodes(nds => [...nds, newNode]);
        setSelectedNodeId(id);
    }

    // ── ノード設定変更 ─────────────────────────────────────────────────────────
    function handleNodeChange(id: string, label: string, data: Record<string, unknown>) {
        setNodes(nds => nds.map(n => n.id === id
            ? { ...n, data: { label, ...data } }
            : n,
        ));
    }

    // ── ノード削除 ─────────────────────────────────────────────────────────────
    function handleNodeDelete(id: string) {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
        setSelectedNodeId(null);
    }

    // ── 保存 ──────────────────────────────────────────────────────────────────
    function handleSave() {
        onSave(
            nodes.map(rfNodeToApi),
            edges.map(rfEdgeToApi),
        );
    }

    const selectedNode = !analyticsMode
        ? (nodes.find(n => n.id === selectedNodeId) ?? null)
        : null;

    // ── セグメントコントロール共通スタイル ──────────────────────────────────────
    function segBtn(active: boolean): React.CSSProperties {
        return {
            padding: '5px 12px', fontSize: T.fontSm, fontWeight: active ? 700 : 400,
            border: 'none', cursor: 'pointer',
            background: active ? T.primary : 'transparent',
            color: active ? '#fff' : T.text,
            transition: 'background 0.1s, color 0.1s',
        };
    }

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {/* キャンバス */}
            <div ref={reactFlowWrapper} style={{ flex: 1, position: 'relative' }}>
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
                    fitViewOptions={{ padding: 0.2 }}
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

                    {/* ツールバー (React Flow Panel) */}
                    <Panel position="top-left">
                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: 6,
                        }}>
                            {/* Edit / Analytics トグル */}
                            <div style={{
                                display: 'flex', borderRadius: T.radiusMd,
                                border: `1px solid ${T.border}`,
                                overflow: 'hidden',
                                background: T.surface,
                                boxShadow: T.shadowCard,
                            }}>
                                <button
                                    style={segBtn(!analyticsMode)}
                                    onClick={() => setAnalyticsMode(false)}
                                >
                                    ✏️ {t('canvas.editMode')}
                                </button>
                                <button
                                    style={{
                                        ...segBtn(analyticsMode),
                                        borderLeft: `1px solid ${T.border}`,
                                    }}
                                    onClick={() => setAnalyticsMode(true)}
                                >
                                    📊 {t('canvas.analyticsMode')}
                                </button>
                            </div>

                            {/* ノードパレット (Edit モードのみ) */}
                            {!analyticsMode && (
                                <div style={{
                                    display: 'flex', gap: 6, padding: 10,
                                    background: T.surface, borderRadius: T.radiusLg,
                                    border: `1px solid ${T.border}`,
                                    boxShadow: T.shadowCard,
                                }}>
                                    {(['message', 'condition', 'action', 'end'] as ChatNodeType[]).map(type => {
                                        const c = NODE_COLORS[type];
                                        const label = t(`node.type.${type}` as Parameters<typeof t>[0]);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => addNode(type)}
                                                title={t('node.addToCanvas', { type: label })}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '6px 10px', borderRadius: T.radiusMd,
                                                    background: c.bg, border: `1.5px solid ${c.border}`,
                                                    color: c.text, fontWeight: 600, fontSize: T.fontSm,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {NODE_ICONS[type]} {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 期間セレクタ (Analytics モードのみ) */}
                            {analyticsMode && (
                                <div style={{
                                    display: 'flex',
                                    background: T.surface,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: T.radiusMd,
                                    overflow: 'hidden',
                                    boxShadow: T.shadowCard,
                                }}>
                                    {PERIODS.map((p, i) => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p)}
                                            style={{
                                                ...segBtn(period === p),
                                                borderLeft: i > 0 ? `1px solid ${T.border}` : 'none',
                                                padding: '5px 10px',
                                            }}
                                        >
                                            {PERIOD_LABELS[p]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* 保存ボタン (Edit モードのみ) */}
                    {!analyticsMode && (
                        <Panel position="top-right">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: '8px 20px', borderRadius: 8,
                                    background: saving ? T.primaryMuted : T.primary,
                                    color: '#fff', border: 'none',
                                    fontWeight: 700, fontSize: T.fontMd,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 6px rgba(37,99,235,.35)',
                                }}
                            >
                                {saving ? t('canvas.saving') : t('canvas.save')}
                            </button>
                        </Panel>
                    )}
                </ReactFlow>
            </div>

            {/* 右パネル: Analytics モード → サマリー / Edit モード → ノード設定 */}
            {analyticsMode ? (
                <AnalyticsSummaryPanel
                    report={analyticsReport}
                    loading={analyticsLoading}
                    noData={analyticsNoData}
                />
            ) : (
                selectedNode && (
                    <NodeConfigPanel
                        node={selectedNode}
                        credentials={credentials}
                        onChange={handleNodeChange}
                        onDelete={handleNodeDelete}
                    />
                )
            )}
        </div>
    );
}

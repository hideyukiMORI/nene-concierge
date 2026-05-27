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

import type { ScenarioNode, ScenarioEdge, CredentialSummary, ChatNodeType } from '../../api.js';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS, MessageNode, ConditionNode, ActionNode, EndNode } from './NodeTypes.js';
import NodeConfigPanel from './NodeConfigPanel.js';
import { T } from '../../theme.js';

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
    const { label, ...rest } = n.data as Record<string, unknown>;
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    initialNodes:  ScenarioNode[];
    initialEdges:  ScenarioEdge[];
    credentials:   CredentialSummary[];
    saving:        boolean;
    onSave:        (nodes: ScenarioNode[], edges: ScenarioEdge[]) => void;
}

// ── コンポーネント ──────────────────────────────────────────────────────────────

export default function ScenarioCanvas({ initialNodes, initialEdges, credentials, saving, onSave }: Props) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes.map(apiNodeToRF));
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges.map(apiEdgeToRF));
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // initialNodes が変わった（ページロード後）ときに同期
    useEffect(() => {
        setNodes(initialNodes.map(apiNodeToRF));
        setEdges(initialEdges.map(apiEdgeToRF));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes.length, initialEdges.length]);

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
        const newNode: Node = {
            id,
            type,
            position: { x: 100 + Math.random() * 200, y: 80 + Math.random() * 200 },
            data:     { label: NODE_LABELS[type], ...defaults[type] },
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

    const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

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
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    deleteKeyCode="Delete"
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
                            display: 'flex', gap: 6, padding: 10,
                            background: T.surface, borderRadius: T.radiusLg,
                            border: `1px solid ${T.border}`,
                            boxShadow: T.shadowCard,
                        }}>
                            {(['message', 'condition', 'action', 'end'] as ChatNodeType[]).map(type => {
                                const c = NODE_COLORS[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => addNode(type)}
                                        title={`${NODE_LABELS[type]}ノードを追加`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            padding: '6px 10px', borderRadius: T.radiusMd,
                                            background: c.bg, border: `1.5px solid ${c.border}`,
                                            color: c.text, fontWeight: 600, fontSize: T.fontSm,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {NODE_ICONS[type]} {NODE_LABELS[type]}
                                    </button>
                                );
                            })}
                        </div>
                    </Panel>

                    {/* 保存ボタン */}
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
                            {saving ? '保存中…' : '💾 保存'}
                        </button>
                    </Panel>
                </ReactFlow>
            </div>

            {/* 右パネル: 選択ノードの設定 */}
            {selectedNode && (
                <NodeConfigPanel
                    node={selectedNode}
                    credentials={credentials}
                    onChange={handleNodeChange}
                    onDelete={handleNodeDelete}
                />
            )}
        </div>
    );
}

import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ChatNodeType, NodeAnalyticsData } from '../../api.js';

// ── カラーパレット ────────────────────────────────────────────────────────────

export const NODE_COLORS: Record<ChatNodeType, { bg: string; border: string; header: string; text: string }> = {
    message:   { bg: '#eff6ff', border: '#3b82f6', header: '#2563eb', text: '#1e3a8a' },
    condition: { bg: '#fffbeb', border: '#f59e0b', header: '#d97706', text: '#78350f' },
    action:    { bg: '#f0fdf4', border: '#22c55e', header: '#16a34a', text: '#14532d' },
    end:       { bg: '#fef2f2', border: '#ef4444', header: '#dc2626', text: '#7f1d1d' },
};

export const NODE_ICONS: Record<ChatNodeType, string> = {
    message:   '💬',
    condition: '🔀',
    action:    '⚡',
    end:       '🏁',
};

export const NODE_LABELS: Record<ChatNodeType, string> = {
    message:   'メッセージ',
    condition: '条件分岐',
    action:    'アクション',
    end:       '終端',
};

// ── ノードデータ型 ────────────────────────────────────────────────────────────

export interface MessageData  { text?: string; choices?: string[]; variable_name?: string; }
export interface ConditionData { variable?: string; operator?: string; value?: string; }
export interface ActionData   { action_type?: string; credential_id?: number; }
export interface EndData      { outcome?: string; }

// ── Analytics カラーヘルパー ──────────────────────────────────────────────────

function dropOffColor(rate: number): string {
    if (rate >= 0.5) return '#ef4444'; // 50%+ → 赤
    if (rate >= 0.2) return '#f59e0b'; // 20-50% → 橙
    return '#22c55e';                  // < 20% → 緑
}

// ── 共通ノード UI ─────────────────────────────────────────────────────────────

function NodeShell({
    type, label, children, selected, analytics, isBottleneck,
}: {
    type:         ChatNodeType;
    label:        string;
    children?:    React.ReactNode;
    selected?:    boolean;
    analytics?:   NodeAnalyticsData;
    isBottleneck?: boolean;
}) {
    const c = NODE_COLORS[type];
    const borderColor = isBottleneck
        ? '#ef4444'
        : analytics
            ? dropOffColor(analytics.drop_off_rate)
            : selected ? '#6366f1' : c.border;
    const boxShadow = isBottleneck
        ? '0 0 0 3px rgba(239,68,68,.35)'
        : selected ? '0 0 0 3px #c7d2fe' : '0 2px 6px rgba(0,0,0,.10)';

    return (
        <div style={{
            background:   c.bg,
            border:       `2px solid ${borderColor}`,
            borderRadius: 10,
            minWidth:     200,
            maxWidth:     240,
            boxShadow,
            fontSize:     13,
            fontFamily:   'system-ui, sans-serif',
            position:     'relative',
        }}>
            {/* ヘッダー */}
            <div style={{
                background:   c.header, color: '#fff',
                padding:      '6px 10px', borderRadius: '8px 8px 0 0',
                fontWeight:   700, fontSize: 12,
                display:      'flex', alignItems: 'center', gap: 6,
            }}>
                <span>{NODE_ICONS[type]}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label || NODE_LABELS[type]}
                </span>
                {/* ボトルネックバッジ */}
                {isBottleneck && (
                    <span style={{
                        background: '#ef4444', color: '#fff',
                        fontSize: 9, fontWeight: 700,
                        padding: '1px 5px', borderRadius: 99,
                        flexShrink: 0,
                    }}>
                        ⚠
                    </span>
                )}
            </div>
            {/* ボディ */}
            {children && (
                <div style={{ padding: '8px 10px', color: c.text, lineHeight: 1.4 }}>
                    {children}
                </div>
            )}
            {/* Analytics オーバーレイ */}
            {analytics && (
                <div style={{
                    padding: '5px 10px 6px',
                    borderTop: `1px solid ${c.border}`,
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: 'rgba(0,0,0,.03)',
                    borderRadius: '0 0 8px 8px',
                }}>
                    {/* 訪問数 */}
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: 11, fontWeight: 700, color: '#374151',
                    }}>
                        👁 {analytics.visit_count.toLocaleString()}
                    </span>
                    {/* 離脱率 */}
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: dropOffColor(analytics.drop_off_rate),
                        marginLeft: 'auto',
                    }}>
                        {Math.round(analytics.drop_off_rate * 100)}% ↓
                    </span>
                </div>
            )}
        </div>
    );
}

function truncate(s: string, n = 80) {
    return s.length > n ? s.slice(0, n) + '…' : s;
}

// ── Analytics データ抽出ヘルパー ──────────────────────────────────────────────

function getAnalytics(data: Record<string, unknown>): NodeAnalyticsData | undefined {
    return data['_analytics'] as NodeAnalyticsData | undefined;
}
function getIsBottleneck(data: Record<string, unknown>): boolean {
    return data['_isBottleneck'] === true;
}

// ── message ───────────────────────────────────────────────────────────────────

export function MessageNode({ data, selected }: NodeProps) {
    const d = data as MessageData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="message" label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.text && <p style={{ margin: 0, fontSize: 12 }}>{truncate(d.text)}</p>}
                {d.choices && d.choices.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {d.choices.map((c, i) => (
                            <span key={i} style={{
                                background: '#dbeafe', color: '#1e40af',
                                borderRadius: 99, padding: '2px 8px', fontSize: 11,
                            }}>
                                {c}
                            </span>
                        ))}
                    </div>
                )}
                {d.variable_name && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
                        → <code>{d.variable_name}</code>
                    </p>
                )}
            </NodeShell>
            <Handle type="source" position={Position.Bottom} />
        </>
    );
}

// ── condition ─────────────────────────────────────────────────────────────────

export function ConditionNode({ data, selected }: NodeProps) {
    const d = data as ConditionData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="condition" label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.variable && (
                    <p style={{ margin: 0, fontSize: 12 }}>
                        <code>{d.variable}</code>
                        {d.operator ? ` ${d.operator}` : ''}
                        {d.value ? ` "${d.value}"` : ''}
                    </p>
                )}
                {/* 分岐割合 (Analytics モード) */}
                {a && Object.keys(a.branch_percentages).length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {Object.entries(a.branch_percentages).map(([label, pct]) => (
                            <span key={label} style={{
                                fontSize: 10, fontWeight: 700,
                                color: label === 'true' ? '#16a34a' : '#dc2626',
                                background: label === 'true' ? '#dcfce7' : '#fee2e2',
                                borderRadius: 99, padding: '1px 6px',
                            }}>
                                {label}: {Math.round(pct * 100)}%
                            </span>
                        ))}
                    </div>
                )}
            </NodeShell>
            <Handle type="source" position={Position.Bottom} id="true"
                style={{ left: '30%' }} />
            <Handle type="source" position={Position.Bottom} id="false"
                style={{ left: '70%' }} />
        </>
    );
}

// ── action ────────────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, string> = {
    email: '📧', slack: '💬', chatwork: '🗨️', http: '🌐',
};

export function ActionNode({ data, selected }: NodeProps) {
    const d = data as ActionData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="action" label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.action_type && (
                    <p style={{ margin: 0, fontSize: 12 }}>
                        {ACTION_ICONS[d.action_type] ?? '🔧'} {d.action_type}
                    </p>
                )}
            </NodeShell>
            <Handle type="source" position={Position.Bottom} />
        </>
    );
}

// ── end ───────────────────────────────────────────────────────────────────────

export function EndNode({ data, selected }: NodeProps) {
    const d = data as EndData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="end" label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.outcome && <p style={{ margin: 0, fontSize: 12 }}>{d.outcome}</p>}
            </NodeShell>
        </>
    );
}

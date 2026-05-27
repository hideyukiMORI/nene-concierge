import type { ReactElement } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ChatNodeType, NodeAnalyticsData } from '../../api.js';

// ── カラーパレット (OKLCH) ────────────────────────────────────────────────────
// Hue 248 = blue, 65 = amber, 192 = teal (primary), 265 = slate

export const NODE_COLORS: Record<ChatNodeType, { bg: string; border: string; header: string; text: string }> = {
    message:   { bg: 'oklch(96% 0.03 248)',  border: 'oklch(70% 0.12 248)',  header: 'oklch(52% 0.18 248)',  text: 'oklch(32% 0.16 248)'  },
    condition: { bg: 'oklch(96% 0.04 65)',   border: 'oklch(74% 0.12 65)',   header: 'oklch(62% 0.16 65)',   text: 'oklch(36% 0.14 65)'   },
    action:    { bg: 'oklch(96% 0.03 192)',  border: 'oklch(72% 0.10 192)',  header: 'oklch(56% 0.16 192)',  text: 'oklch(34% 0.14 192)'  },
    end:       { bg: 'oklch(96% 0.015 265)', border: 'oklch(72% 0.06 265)',  header: 'oklch(48% 0.10 265)',  text: 'oklch(32% 0.10 265)'  },
};

// ── ノードアイコン (inline SVG) ───────────────────────────────────────────────

export const NODE_ICONS: Record<ChatNodeType, ReactElement> = {
    message: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 10.5A1.5 1.5 0 0 1 12.5 12H5L2 15V4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5z"/>
        </svg>
    ),
    condition: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M8 1.5L14.5 8 8 14.5 1.5 8z"/>
        </svg>
    ),
    action: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.5 1.5L3 9.5h5L6.5 14.5 14 6.5H9L9.5 1.5z"/>
        </svg>
    ),
    end: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5"/>
            <polyline points="5,8.5 7,10.5 11,6"/>
        </svg>
    ),
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
export interface ActionData {
    action_type?:  string;
    credential_id?: number;
    /** QR adapter params */
    qr_content?:  string;
    qr_variable?: string;
    qr_size?:     number;
}
export interface EndData      { outcome?: string; }

// ── Analytics カラーヘルパー ──────────────────────────────────────────────────

function dropOffColor(rate: number): string {
    if (rate >= 0.5) return 'oklch(52% 0.20 25)';  // 50%+ → 赤
    if (rate >= 0.2) return 'oklch(62% 0.16 65)';  // 20-50% → 橙
    return 'oklch(56% 0.16 145)';                   // < 20% → 緑
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
        ? 'oklch(52% 0.20 25)'
        : analytics
            ? dropOffColor(analytics.drop_off_rate)
            : selected ? 'oklch(62% 0.18 265)' : c.border;
    const boxShadow = isBottleneck
        ? '0 0 0 3px oklch(52% 0.20 25 / 0.35)'
        : selected ? '0 0 0 3px oklch(80% 0.10 265 / 0.6)' : '0 2px 6px rgba(0,0,0,.10)';

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
                        background: 'oklch(52% 0.20 25)', color: '#fff',
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
                        fontSize: 11, fontWeight: 700, color: 'oklch(28% 0.02 75)',
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
                                color: label === 'true' ? 'oklch(38% 0.15 145)' : 'oklch(40% 0.18 25)',
                                background: label === 'true' ? 'oklch(94% 0.05 145)' : 'oklch(95% 0.04 25)',
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
    email: '📧', slack: '💬', chatwork: '🗨️', http: '🌐', qr: '◻',
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
                {d.action_type === 'qr' && d.qr_content && (
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'oklch(36% 0.14 145)', wordBreak: 'break-all' }}>
                        {truncate(d.qr_content, 40)}
                        {d.qr_variable && d.qr_variable !== 'qr_url'
                            ? ` → ${d.qr_variable}` : ''}
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

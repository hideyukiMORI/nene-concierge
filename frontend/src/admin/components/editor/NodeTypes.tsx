import type { ReactElement } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ChatNodeType, NodeAnalyticsData } from '../../api.js';
import { T } from '../../theme.js';

// ── カラーパレット (OKLCH) ────────────────────────────────────────────────────
// Hue 248 = blue, 65 = amber, 192 = teal (primary), 265 = slate
//
// bg: color-mix で各テーマの surface 色にヘッダー色を 14% 混ぜる
//   → ライトテーマでは薄いパステル、ダークテーマでは暗いトーンに自然になじむ

export const NODE_COLORS: Record<ChatNodeType, { bg: string; header: string; text: string }> = {
    message:   {
        bg:     'color-mix(in oklch, oklch(52% 0.18 248) 14%, var(--nca-color-surface))',
        header: 'oklch(52% 0.18 248)',
        text:   'oklch(26% 0.16 248)',   // MiniMap などで参照（NodeShell 内は T.text を使用）
    },
    condition: {
        bg:     'color-mix(in oklch, oklch(62% 0.16 65) 14%, var(--nca-color-surface))',
        header: 'oklch(62% 0.16 65)',
        text:   'oklch(28% 0.14 65)',
    },
    action:    {
        bg:     'color-mix(in oklch, oklch(52% 0.17 192) 14%, var(--nca-color-surface))',
        header: 'oklch(52% 0.17 192)',
        text:   'oklch(26% 0.14 192)',
    },
    end:       {
        bg:     'color-mix(in oklch, oklch(44% 0.10 265) 14%, var(--nca-color-surface))',
        header: 'oklch(44% 0.10 265)',
        text:   'oklch(24% 0.10 265)',
    },
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

    // 選択・ボトルネック・Analytics 離脱率は boxShadow のみで表現（border なし）
    const boxShadow = isBottleneck
        ? '0 0 0 3px oklch(52% 0.20 25 / 0.55), 0 2px 8px rgba(0,0,0,.14)'
        : analytics
            ? `0 0 0 2px ${dropOffColor(analytics.drop_off_rate)} , 0 2px 8px rgba(0,0,0,.12)`
            : selected
                ? '0 0 0 3px oklch(62% 0.18 265 / 0.55), 0 2px 8px rgba(0,0,0,.14)'
                : '0 2px 8px rgba(0,0,0,.12)';

    return (
        <div style={{
            background:   c.bg,
            borderRadius: 3,            // シャープな角丸
            minWidth:     200,
            maxWidth:     240,
            boxShadow,
            fontSize:     13,
            position:     'relative',
            overflow:     'hidden',     // ヘッダーを角丸でクリップ
        }}>
            {/* ヘッダー (べた塗り) */}
            <div style={{
                background: c.header, color: '#fff',
                padding:    '6px 10px',
                fontWeight: 700, fontSize: 12,
                display:    'flex', alignItems: 'center', gap: 6,
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
            {/* ボディ — テーマ対応テキスト色 */}
            {children && (
                <div style={{ padding: '8px 10px', color: T.text, lineHeight: 1.4 }}>
                    {children}
                </div>
            )}
            {/* Analytics オーバーレイ — テーマ対応 */}
            {analytics && (
                <div style={{
                    padding: '5px 10px 6px',
                    borderTop: `1px solid ${T.border}`,
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: T.tableHeader,
                }}>
                    {/* 訪問数 */}
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: 11, fontWeight: 700, color: T.textMuted,
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
                        {d.choices.map((choice, i) => (
                            <span key={i} style={{
                                background: 'color-mix(in oklch, oklch(52% 0.18 248) 28%, var(--nca-color-surface))',
                                color: T.text,
                                borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                            }}>
                                {choice}
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
                                color: label === 'true' ? 'oklch(56% 0.17 145)' : 'oklch(60% 0.20 25)',
                                background: label === 'true'
                                    ? 'color-mix(in oklch, oklch(52% 0.17 145) 25%, var(--nca-color-surface))'
                                    : 'color-mix(in oklch, oklch(52% 0.20 25) 25%, var(--nca-color-surface))',
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

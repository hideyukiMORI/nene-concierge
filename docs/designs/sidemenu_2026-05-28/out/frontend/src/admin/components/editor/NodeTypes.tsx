import type { ReactElement } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ChatNodeType, NodeAnalyticsData } from '../../api.js';
import { T, NODE_TOKENS } from '../../theme.js';

// ─────────────────────────────────────────────────────────────────────────────
// v2 (2026-05-28) — モダンノードカード
//   - 角丸 2px (CAD/dev tool feel)
//   - 上端 2px の細いカラーアクセントエッジ
//   - ノード色でほんのり染めたボディ (ダーク視認性UP)
//   - ヘッダー: アイコンチップ + ラベル + モノスペース ID
//   - 色は全テーマ対応 (CSS 変数経由 — index.html で定義)
// ─────────────────────────────────────────────────────────────────────────────

// ── NODE_COLORS (互換性のため残置 — CSS 変数を参照) ─────────────────────────
//
// 旧コードが NODE_COLORS[type].header を直接読んでいるケースに備えた橋渡し。
// 新コードは NODE_TOKENS (theme.ts) を直接使うこと。
export const NODE_COLORS: Record<ChatNodeType, { bg: string; header: string; text: string }> = {
    message:   { bg: NODE_TOKENS.message.body,   header: NODE_TOKENS.message.stripe,   text: T.text },
    condition: { bg: NODE_TOKENS.condition.body, header: NODE_TOKENS.condition.stripe, text: T.text },
    action:    { bg: NODE_TOKENS.action.body,    header: NODE_TOKENS.action.stripe,    text: T.text },
    end:       { bg: NODE_TOKENS.end.body,       header: NODE_TOKENS.end.stripe,       text: T.text },
};

// ── ノードアイコン (inline SVG) ───────────────────────────────────────────────
export const NODE_ICONS: Record<ChatNodeType, ReactElement> = {
    message: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 10.5A1.5 1.5 0 0 1 12.5 12H5L2 15V4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5z"/>
        </svg>
    ),
    condition: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
            <path d="M8 1.5L14.5 8 8 14.5 1.5 8z"/>
        </svg>
    ),
    action: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.5 1.5L3 9.5h5L6.5 14.5 14 6.5H9L9.5 1.5z"/>
        </svg>
    ),
    end: (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
    qr_content?:  string;
    qr_variable?: string;
    qr_size?:     number;
}
export interface EndData      { outcome?: string; }

// ── Analytics カラーヘルパー ──────────────────────────────────────────────────
function dropOffColor(rate: number): string {
    if (rate >= 0.5) return 'oklch(58% 0.20 25)';
    if (rate >= 0.2) return 'oklch(62% 0.16 65)';
    return 'oklch(56% 0.16 145)';
}

const MONO = 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace';

// ── 共通ノード UI ─────────────────────────────────────────────────────────────
function NodeShell({
    type, label, id, children, selected, analytics, isBottleneck,
}: {
    type:         ChatNodeType;
    label:        string;
    id:           string;
    children?:    React.ReactNode;
    selected?:    boolean;
    analytics?:   NodeAnalyticsData;
    isBottleneck?: boolean;
}) {
    const tok = NODE_TOKENS[type];

    // 選択・ボトルネック・Analytics 離脱率の boxShadow 表現
    const boxShadow = isBottleneck
        ? `0 0 0 2px oklch(58% 0.20 25 / 0.55), ${T.shadowCard}`
        : analytics
            ? `0 0 0 2px ${dropOffColor(analytics.drop_off_rate)}, ${T.shadowCard}`
            : selected
                ? `0 0 0 2px ${tok.stripe}80, ${T.shadowCard}`
                : T.shadowCard;

    return (
        <div style={{
            background:   tok.body,
            border:       `1px solid ${selected ? tok.stripe : tok.edge}`,
            borderRadius: T.radiusNode,
            minWidth:     200,
            maxWidth:     240,
            boxShadow,
            fontSize:     T.fontBase,
            position:     'relative',
            overflow:     'hidden',
        }}>
            {/* 上端: 細いカラーアクセント */}
            <div style={{ height: 2, background: tok.stripe }}/>

            {/* ヘッダー: icon chip + label + ID */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px 4px',
            }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 16, height: 16, borderRadius: 3,
                    background: tok.chip,
                    color: tok.stripe,
                    border: `1px solid ${tok.chipEdge}`,
                    flexShrink: 0,
                }}>{NODE_ICONS[type]}</span>
                <span style={{
                    flex: 1, fontSize: T.fontSm, fontWeight: 700, color: T.text,
                    letterSpacing: '-0.005em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{label || NODE_LABELS[type]}</span>
                {isBottleneck && (
                    <span style={{
                        background: 'oklch(58% 0.20 25)', color: '#fff',
                        fontSize: 9, fontWeight: 700,
                        padding: '1px 5px', borderRadius: 99,
                        flexShrink: 0,
                    }}>⚠</span>
                )}
                <span style={{
                    fontFamily: MONO, fontSize: 9.5, color: T.textFaint, fontWeight: 500,
                    flexShrink: 0,
                }}>{id}</span>
            </div>

            {/* ボディ */}
            {children && (
                <div style={{
                    padding: '0 8px 7px', fontSize: T.fontXs,
                    color: T.textMuted, lineHeight: 1.4,
                }}>
                    {children}
                </div>
            )}

            {/* Analytics オーバーレイ */}
            {analytics && (
                <div style={{
                    padding: '5px 10px 6px',
                    borderTop: `1px solid ${tok.edge}`,
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: T.surfaceAlt,
                }}>
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: T.fontXs, fontWeight: 700, color: T.textMuted,
                        fontFamily: MONO,
                    }}>
                        {analytics.visit_count.toLocaleString()} visits
                    </span>
                    <span style={{
                        fontSize: T.fontXs, fontWeight: 700,
                        color: dropOffColor(analytics.drop_off_rate),
                        marginLeft: 'auto', fontFamily: MONO,
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
export function MessageNode({ id, data, selected }: NodeProps) {
    const d = data as MessageData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="message" id={id}
                label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.text && <p style={{ margin: 0 }}>{truncate(d.text)}</p>}
                {d.choices && d.choices.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {d.choices.map((choice, i) => (
                            <span key={i} style={{
                                background: NODE_TOKENS.message.chip,
                                color: NODE_TOKENS.message.stripe,
                                border: `1px solid ${NODE_TOKENS.message.chipEdge}`,
                                borderRadius: 99, padding: '1px 5px',
                                fontSize: 9.5, fontWeight: 600,
                            }}>
                                {choice}
                            </span>
                        ))}
                    </div>
                )}
                {d.variable_name && (
                    <p style={{ margin: '4px 0 0', fontSize: T.fontXs, color: T.textFaint, fontFamily: MONO }}>
                        → <code>{d.variable_name}</code>
                    </p>
                )}
            </NodeShell>
            <Handle type="source" position={Position.Bottom} />
        </>
    );
}

// ── condition ─────────────────────────────────────────────────────────────────
export function ConditionNode({ id, data, selected }: NodeProps) {
    const d = data as ConditionData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="condition" id={id}
                label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.variable && (
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: T.fontXs }}>
                        <code>{d.variable}</code>
                        {d.operator ? ` ${d.operator}` : ''}
                        {d.value ? ` "${d.value}"` : ''}
                    </p>
                )}
                {a && Object.keys(a.branch_percentages).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {Object.entries(a.branch_percentages).map(([label, pct]) => (
                            <span key={label} style={{
                                fontSize: 10, fontWeight: 700,
                                fontFamily: MONO,
                                color: label === 'true' ? 'oklch(56% 0.17 145)' : 'oklch(60% 0.20 25)',
                                background: label === 'true'
                                    ? 'oklch(56% 0.17 145 / 0.16)'
                                    : 'oklch(60% 0.20 25 / 0.16)',
                                borderRadius: 99, padding: '1px 6px',
                            }}>
                                {label}: {Math.round(pct * 100)}%
                            </span>
                        ))}
                    </div>
                )}
            </NodeShell>
            <Handle type="source" position={Position.Bottom} id="true"  style={{ left: '30%' }} />
            <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} />
        </>
    );
}

// ── action ────────────────────────────────────────────────────────────────────
const ACTION_TYPE_LABEL: Record<string, string> = {
    email: 'Email', slack: 'Slack', chatwork: 'Chatwork', http: 'HTTP', qr: 'QR',
};

export function ActionNode({ id, data, selected }: NodeProps) {
    const d = data as ActionData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="action" id={id}
                label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.action_type && (
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: T.fontXs }}>
                        {ACTION_TYPE_LABEL[d.action_type] ?? d.action_type}
                    </p>
                )}
                {d.action_type === 'qr' && d.qr_content && (
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: T.textFaint, wordBreak: 'break-all' }}>
                        {truncate(d.qr_content, 40)}
                        {d.qr_variable && d.qr_variable !== 'qr_url' ? ` → ${d.qr_variable}` : ''}
                    </p>
                )}
            </NodeShell>
            <Handle type="source" position={Position.Bottom} />
        </>
    );
}

// ── end ───────────────────────────────────────────────────────────────────────
export function EndNode({ id, data, selected }: NodeProps) {
    const d = data as EndData;
    const a = getAnalytics(data as Record<string, unknown>);
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <NodeShell
                type="end" id={id}
                label={String(data['label'] ?? '')} selected={selected}
                {...(a !== undefined ? { analytics: a } : {})}
                isBottleneck={getIsBottleneck(data as Record<string, unknown>)}
            >
                {d.outcome && (
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: T.fontXs }}>{d.outcome}</p>
                )}
            </NodeShell>
        </>
    );
}

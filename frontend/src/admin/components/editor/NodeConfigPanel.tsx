import type { Node } from '@xyflow/react';
import type { CredentialSummary, ChatNodeType } from '../../api.js';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from './NodeTypes.js';
import type { MessageData, ConditionData, ActionData, EndData } from './NodeTypes.js';

interface Props {
    node:         Node;
    credentials:  CredentialSummary[];
    onChange:     (id: string, label: string, data: Record<string, unknown>) => void;
    onDelete:     (id: string) => void;
}

const S = {
    panel: {
        width: 280, background: '#fff', borderLeft: '1px solid #e5e7eb',
        overflowY: 'auto' as const, padding: '16px 16px',
        display: 'flex', flexDirection: 'column' as const, gap: 12,
    },
    label: { display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 3, color: '#374151' },
    input: {
        width: '100%', padding: '7px 10px', borderRadius: 6,
        border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none',
        boxSizing: 'border-box' as const,
    },
    select: {
        width: '100%', padding: '7px 10px', borderRadius: 6,
        border: '1.5px solid #d1d5db', fontSize: 13, background: '#fff',
        boxSizing: 'border-box' as const,
    },
    textarea: {
        width: '100%', padding: '7px 10px', borderRadius: 6,
        border: '1.5px solid #d1d5db', fontSize: 13, resize: 'vertical' as const,
        outline: 'none', boxSizing: 'border-box' as const, minHeight: 80,
    },
    section: { borderTop: '1px solid #f3f4f6', paddingTop: 10 },
    tag: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#dbeafe', color: '#1e40af',
        borderRadius: 99, padding: '3px 10px', fontSize: 12,
    },
    tagList: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
};

function LabelInput({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void;
}) {
    return (
        <div>
            <label style={S.label}>{label}</label>
            <input style={S.input} value={value} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

export default function NodeConfigPanel({ node, credentials, onChange, onDelete }: Props) {
    const type = node.type as ChatNodeType;
    const data = node.data as Record<string, unknown>;
    const label = String(data['label'] ?? '');
    const colors = NODE_COLORS[type];

    function setLabel(v: string) {
        onChange(node.id, v, data);
    }
    function setData(patch: Record<string, unknown>) {
        onChange(node.id, label, { ...data, ...patch });
    }

    // ── message ───────────────────────────────────────────────────────────────
    function MessageConfig() {
        const d = data as MessageData;
        const choices: string[] = d.choices ?? [];

        function addChoice() {
            const v = prompt('選択肢テキストを入力');
            if (v) setData({ choices: [...choices, v] });
        }
        function removeChoice(i: number) {
            setData({ choices: choices.filter((_, j) => j !== i) });
        }

        return (
            <>
                <LabelInput label="ラベル" value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>メッセージテキスト</label>
                    <textarea
                        style={S.textarea}
                        value={String(d.text ?? '')}
                        onChange={e => setData({ text: e.target.value })}
                        placeholder="訪問者に表示するメッセージ…"
                    />
                </div>
                <div style={S.section}>
                    <label style={S.label}>選択肢（クイックリプライ）</label>
                    <div style={S.tagList}>
                        {choices.map((c, i) => (
                            <span key={i} style={S.tag}>
                                {c}
                                <button
                                    onClick={() => removeChoice(i)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1e40af', fontSize: 14, lineHeight: 1 }}
                                >×</button>
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={addChoice}
                        style={{
                            marginTop: 6, fontSize: 12, color: '#2563eb',
                            background: 'none', border: '1px dashed #93c5fd',
                            borderRadius: 6, padding: '4px 10px', cursor: 'pointer', width: '100%',
                        }}
                    >
                        ＋ 選択肢を追加
                    </button>
                </div>
                <div style={S.section}>
                    <label style={S.label}>変数名（入力を収集する場合）</label>
                    <input
                        style={S.input}
                        value={String(d.variable_name ?? '')}
                        onChange={e => setData({ variable_name: e.target.value || undefined })}
                        placeholder="例: user_name"
                    />
                </div>
            </>
        );
    }

    // ── condition ─────────────────────────────────────────────────────────────
    function ConditionConfig() {
        const d = data as ConditionData;
        return (
            <>
                <LabelInput label="ラベル" value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>変数名</label>
                    <input
                        style={S.input}
                        value={d.variable ?? ''}
                        onChange={e => setData({ variable: e.target.value })}
                        placeholder="例: user_answer"
                    />
                </div>
                <div>
                    <label style={S.label}>演算子</label>
                    <select
                        style={S.select}
                        value={d.operator ?? 'eq'}
                        onChange={e => setData({ operator: e.target.value })}
                    >
                        <option value="eq">= 等しい</option>
                        <option value="neq">≠ 等しくない</option>
                        <option value="contains">contains 含む</option>
                        <option value="exists">exists 存在する</option>
                        <option value="not_exists">not_exists 存在しない</option>
                    </select>
                </div>
                {(d.operator !== 'exists' && d.operator !== 'not_exists') && (
                    <div>
                        <label style={S.label}>比較値</label>
                        <input
                            style={S.input}
                            value={d.value ?? ''}
                            onChange={e => setData({ value: e.target.value })}
                            placeholder="比較する値"
                        />
                    </div>
                )}
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                    下のハンドル: 左=true / 右=false
                </p>
            </>
        );
    }

    // ── action ────────────────────────────────────────────────────────────────
    function ActionConfig() {
        const d = data as ActionData;
        return (
            <>
                <LabelInput label="ラベル" value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>アクションタイプ</label>
                    <select
                        style={S.select}
                        value={d.action_type ?? 'http'}
                        onChange={e => setData({ action_type: e.target.value })}
                    >
                        <option value="http">HTTP</option>
                        <option value="email">Email</option>
                        <option value="slack">Slack</option>
                        <option value="chatwork">Chatwork</option>
                    </select>
                </div>
                <div>
                    <label style={S.label}>クレデンシャル</label>
                    <select
                        style={S.select}
                        value={String(d.credential_id ?? '')}
                        onChange={e => setData({ credential_id: e.target.value ? Number(e.target.value) : undefined })}
                    >
                        <option value="">— 選択 —</option>
                        {credentials
                            .filter(c => !d.action_type || c.adapter === d.action_type)
                            .map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                    </select>
                </div>
            </>
        );
    }

    // ── end ───────────────────────────────────────────────────────────────────
    function EndConfig() {
        const d = data as EndData;
        return (
            <>
                <LabelInput label="ラベル" value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>アウトカム</label>
                    <select
                        style={S.select}
                        value={d.outcome ?? 'completed'}
                        onChange={e => setData({ outcome: e.target.value })}
                    >
                        <option value="completed">completed — 完了</option>
                        <option value="abandoned">abandoned — 離脱</option>
                    </select>
                </div>
            </>
        );
    }

    return (
        <div style={S.panel}>
            {/* ヘッダー */}
            <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                background: colors.header, color: '#fff',
                fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span>{NODE_ICONS[type]}</span>
                <span>{NODE_LABELS[type]}</span>
            </div>

            {/* フォーム */}
            {type === 'message'   && <MessageConfig />}
            {type === 'condition' && <ConditionConfig />}
            {type === 'action'    && <ActionConfig />}
            {type === 'end'       && <EndConfig />}

            {/* 削除ボタン */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, marginTop: 4 }}>
                <button
                    onClick={() => onDelete(node.id)}
                    style={{
                        width: '100%', padding: '7px 0',
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        color: '#b91c1c', borderRadius: 6, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                    }}
                >
                    🗑 このノードを削除
                </button>
            </div>
        </div>
    );
}

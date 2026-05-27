import type { Node } from '@xyflow/react';
import type { CredentialSummary, ChatNodeType } from '../../api.js';
import { NODE_COLORS, NODE_ICONS } from './NodeTypes.js';
import type { MessageData, ConditionData, ActionData, EndData } from './NodeTypes.js';
import { T } from '../../theme.js';
import { useTranslation } from '../../i18n/index.js';

interface Props {
    node:        Node;
    credentials: CredentialSummary[];
    onChange:    (id: string, label: string, data: Record<string, unknown>) => void;
    onDelete:    (id: string) => void;
}

const S = {
    panel: {
        width: 280, background: T.surface, borderLeft: `1px solid ${T.border}`,
        overflowY: 'auto' as const, padding: '16px 16px',
        display: 'flex', flexDirection: 'column' as const, gap: 12,
    },
    label:    { display: 'block', fontWeight: 600, fontSize: T.fontSm, marginBottom: 3, color: T.textStrong },
    input:    {
        width: '100%', padding: '7px 10px', borderRadius: T.radiusSm,
        border: `1.5px solid ${T.borderInput}`, fontSize: T.fontBase,
        outline: 'none', boxSizing: 'border-box' as const,
    },
    select:   {
        width: '100%', padding: '7px 10px', borderRadius: T.radiusSm,
        border: `1.5px solid ${T.borderInput}`, fontSize: T.fontBase,
        background: T.surface, boxSizing: 'border-box' as const,
    },
    textarea: {
        width: '100%', padding: '7px 10px', borderRadius: T.radiusSm,
        border: `1.5px solid ${T.borderInput}`, fontSize: T.fontBase,
        resize: 'vertical' as const, outline: 'none',
        boxSizing: 'border-box' as const, minHeight: 80,
    },
    section: { borderTop: `1px solid ${T.borderLight}`, paddingTop: 10 },
    tag:     {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: T.primaryBg, color: T.primaryText,
        borderRadius: T.radiusXl, padding: '3px 10px', fontSize: T.fontSm,
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
    const { t }  = useTranslation();
    const type   = node.type as ChatNodeType;
    const data   = node.data as Record<string, unknown>;
    const label  = String(data['label'] ?? '');
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
            const v = prompt(t('node.addChoicePrompt'));
            if (v) setData({ choices: [...choices, v] });
        }
        function removeChoice(i: number) {
            setData({ choices: choices.filter((_, j) => j !== i) });
        }

        return (
            <>
                <LabelInput label={t('node.label')} value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>{t('node.messageText')}</label>
                    <textarea
                        style={S.textarea}
                        value={String(d.text ?? '')}
                        onChange={e => setData({ text: e.target.value })}
                        placeholder={t('node.messagePlaceholder')}
                    />
                </div>
                <div style={S.section}>
                    <label style={S.label}>{t('node.choices')}</label>
                    <div style={S.tagList}>
                        {choices.map((c, i) => (
                            <span key={i} style={S.tag}>
                                {c}
                                <button
                                    onClick={() => removeChoice(i)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, color: T.primaryText, fontSize: 14, lineHeight: 1,
                                    }}
                                >×</button>
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={addChoice}
                        style={{
                            marginTop: 6, fontSize: T.fontSm, color: T.primary,
                            background: 'none', border: `1px dashed ${T.primaryMuted}`,
                            borderRadius: T.radiusSm, padding: '4px 10px',
                            cursor: 'pointer', width: '100%',
                        }}
                    >
                        {t('node.addChoice')}
                    </button>
                </div>
                <div style={S.section}>
                    <label style={S.label}>{t('node.variableName')}</label>
                    <input
                        style={S.input}
                        value={String(d.variable_name ?? '')}
                        onChange={e => setData({ variable_name: e.target.value || undefined })}
                        placeholder={t('node.variablePlaceholder')}
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
                <LabelInput label={t('node.label')} value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>{t('node.conditionVar')}</label>
                    <input
                        style={S.input}
                        value={d.variable ?? ''}
                        onChange={e => setData({ variable: e.target.value })}
                        placeholder={t('node.conditionVarPlaceholder')}
                    />
                </div>
                <div>
                    <label style={S.label}>{t('node.operator')}</label>
                    <select
                        style={S.select}
                        value={d.operator ?? 'eq'}
                        onChange={e => setData({ operator: e.target.value })}
                    >
                        <option value="eq">{t('node.operator.eq')}</option>
                        <option value="neq">{t('node.operator.neq')}</option>
                        <option value="contains">{t('node.operator.contains')}</option>
                        <option value="exists">{t('node.operator.exists')}</option>
                        <option value="not_exists">{t('node.operator.not_exists')}</option>
                    </select>
                </div>
                {(d.operator !== 'exists' && d.operator !== 'not_exists') && (
                    <div>
                        <label style={S.label}>{t('node.compareValue')}</label>
                        <input
                            style={S.input}
                            value={d.value ?? ''}
                            onChange={e => setData({ value: e.target.value })}
                            placeholder={t('node.compareValuePlaceholder')}
                        />
                    </div>
                )}
                <p style={{ fontSize: T.fontXs, color: T.textMuted, margin: 0 }}>
                    {t('node.conditionHint')}
                </p>
            </>
        );
    }

    // ── action ────────────────────────────────────────────────────────────────
    function ActionConfig() {
        const d = data as ActionData;
        return (
            <>
                <LabelInput label={t('node.label')} value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>{t('node.actionType')}</label>
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
                    <label style={S.label}>{t('node.credential')}</label>
                    <select
                        style={S.select}
                        value={String(d.credential_id ?? '')}
                        onChange={e => setData({ credential_id: e.target.value ? Number(e.target.value) : undefined })}
                    >
                        <option value="">{t('node.credentialNone')}</option>
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
                <LabelInput label={t('node.label')} value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>{t('node.outcome')}</label>
                    <select
                        style={S.select}
                        value={d.outcome ?? 'completed'}
                        onChange={e => setData({ outcome: e.target.value })}
                    >
                        <option value="completed">{t('node.outcome.completed')}</option>
                        <option value="abandoned">{t('node.outcome.abandoned')}</option>
                    </select>
                </div>
            </>
        );
    }

    const typeLabel = t(`node.type.${type}` as Parameters<typeof t>[0]);

    return (
        <div style={S.panel}>
            {/* ヘッダー */}
            <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                background: colors.header, color: '#fff',
                fontWeight: 700, fontSize: T.fontBase,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span>{NODE_ICONS[type]}</span>
                <span>{typeLabel}</span>
            </div>

            {/* フォーム */}
            {type === 'message'   && <MessageConfig />}
            {type === 'condition' && <ConditionConfig />}
            {type === 'action'    && <ActionConfig />}
            {type === 'end'       && <EndConfig />}

            {/* 削除ボタン */}
            <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 12, marginTop: 4 }}>
                <button
                    onClick={() => onDelete(node.id)}
                    style={{
                        width: '100%', padding: '7px 0',
                        background: T.dangerBg, border: `1px solid ${T.dangerBorder}`,
                        color: T.dangerText, borderRadius: T.radiusSm,
                        cursor: 'pointer', fontSize: T.fontBase, fontWeight: 600,
                    }}
                >
                    {t('node.delete')}
                </button>
            </div>
        </div>
    );
}

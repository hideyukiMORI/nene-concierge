import type { Node } from '@xyflow/react';
import type { CredentialSummary, ChatNodeType } from '../../api.js';
import { NODE_COLORS, NODE_ICONS } from './NodeTypes.js';
import type { MessageData, ConditionData, ActionData, EndData } from './NodeTypes.js';
import { T } from '../../theme.js';
import { applyFocus, removeFocus } from '../Layout.js';
// T.controlHeight (= var(--nca-control-height)) で高さを一元管理
import { useTranslation } from '../../i18n/index.js';

interface Props {
    node:        Node;
    credentials: CredentialSummary[];
    onChange:    (id: string, label: string, data: Record<string, unknown>) => void;
    onDelete:    (id: string) => void;
}

// ── Panel-scoped style constants ──────────────────────────────────────────────
// Heights and paddings match the shared Field/Select components in Layout.tsx
// (36px control height, 1.5px border). Panel uses fontBase (13px) instead of
// fontMd (14px) to keep the compact sidebar feel.

const S = {
    panel: {
        background: T.surface,
        overflowY: 'auto' as const, padding: '16px',
        display: 'flex', flexDirection: 'column' as const, gap: 14,
    },
    label: {
        display: 'block', fontWeight: 600, fontSize: T.fontSm,
        marginBottom: 4, color: T.textStrong, lineHeight: '1.4',
    },
    input: {
        width: '100%', height: T.controlHeight, padding: '0 10px',
        boxSizing: 'border-box' as const,
        borderRadius: T.radiusMd, border: `1.5px solid ${T.borderInput}`,
        fontSize: T.fontBase, outline: 'none',
        background: T.surface, color: T.text,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    select: {
        width: '100%', height: T.controlHeight, padding: '0 10px',
        boxSizing: 'border-box' as const,
        borderRadius: T.radiusMd, border: `1.5px solid ${T.borderInput}`,
        fontSize: T.fontBase, background: T.surface, color: T.text,
        outline: 'none', cursor: 'pointer',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    textarea: {
        width: '100%', padding: '8px 10px',
        boxSizing: 'border-box' as const,
        borderRadius: T.radiusMd, border: `1.5px solid ${T.borderInput}`,
        fontSize: T.fontBase, outline: 'none',
        resize: 'vertical' as const, lineHeight: '1.5',
        minHeight: 80, background: T.surface, color: T.text,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    section: { borderTop: `1px solid ${T.borderLight}`, paddingTop: 12 },
    tag: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: T.primaryBg, color: T.primaryText,
        borderRadius: T.radiusXl, padding: '3px 10px', fontSize: T.fontSm,
    },
    tagList: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
    hint: {
        margin: '4px 0 0', fontSize: T.fontXs, color: T.textMuted,
        lineHeight: '1.4',
    },
};

// Event handler shortcuts
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    applyFocus(e.currentTarget);
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    removeFocus(e.currentTarget);

function LabelInput({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void;
}) {
    return (
        <div>
            <label style={S.label}>{label}</label>
            <input
                style={S.input} value={value} onChange={e => onChange(e.target.value)}
                onFocus={onF} onBlur={onB}
            />
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
                        onFocus={onF} onBlur={onB}
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
                            borderRadius: T.radiusMd, padding: '5px 10px',
                            cursor: 'pointer', width: '100%',
                            transition: 'background 120ms ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget).style.background = T.primaryBg; }}
                        onMouseLeave={e => { (e.currentTarget).style.background = 'none'; }}
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
                        onFocus={onF} onBlur={onB}
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
                        onFocus={onF} onBlur={onB}
                    />
                </div>
                <div>
                    <label style={S.label}>{t('node.operator')}</label>
                    <select
                        style={S.select}
                        value={d.operator ?? 'eq'}
                        onChange={e => setData({ operator: e.target.value })}
                        onFocus={onF} onBlur={onB}
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
                            onFocus={onF} onBlur={onB}
                        />
                    </div>
                )}
                <p style={S.hint}>{t('node.conditionHint')}</p>
            </>
        );
    }

    // ── action ────────────────────────────────────────────────────────────────
    function ActionConfig() {
        const d = data as ActionData;
        const isQr = (d.action_type ?? 'http') === 'qr';

        return (
            <>
                <LabelInput label={t('node.label')} value={label} onChange={setLabel} />
                <div style={S.section}>
                    <label style={S.label}>{t('node.actionType')}</label>
                    <select
                        style={S.select}
                        value={d.action_type ?? 'http'}
                        onChange={e => setData({ action_type: e.target.value })}
                        onFocus={onF} onBlur={onB}
                    >
                        <option value="http">HTTP</option>
                        <option value="email">Email</option>
                        <option value="slack">Slack</option>
                        <option value="chatwork">Chatwork</option>
                        <option value="qr">◻ {t('node.qrCode')}</option>
                    </select>
                </div>

                {/* QR 専用フィールド */}
                {isQr && (
                    <>
                        <div style={S.section}>
                            <label style={S.label}>{t('node.qrContent')}</label>
                            <textarea
                                style={S.textarea}
                                value={d.qr_content ?? ''}
                                onChange={e => setData({ qr_content: e.target.value })}
                                placeholder={t('node.qrContentPlaceholder')}
                                onFocus={onF} onBlur={onB}
                            />
                            <p style={S.hint}>{t('node.qrContentHint')}</p>
                        </div>
                        <div>
                            <label style={S.label}>{t('node.qrVariable')}</label>
                            <input
                                style={S.input}
                                value={d.qr_variable ?? ''}
                                onChange={e => setData({ qr_variable: e.target.value || undefined })}
                                placeholder={t('node.qrVariablePlaceholder')}
                                onFocus={onF} onBlur={onB}
                            />
                        </div>
                        <div>
                            <label style={S.label}>{t('node.qrSize')}</label>
                            <input
                                type="number"
                                min={64} max={800} step={8}
                                style={S.input}
                                value={d.qr_size ?? 200}
                                onChange={e => setData({ qr_size: Number(e.target.value) || undefined })}
                                onFocus={onF} onBlur={onB}
                            />
                        </div>
                    </>
                )}

                {/* クレデンシャル（QR は不要） */}
                {!isQr && (
                    <div>
                        <label style={S.label}>{t('node.credential')}</label>
                        <select
                            style={S.select}
                            value={String(d.credential_id ?? '')}
                            onChange={e => setData({ credential_id: e.target.value ? Number(e.target.value) : undefined })}
                            onFocus={onF} onBlur={onB}
                        >
                            <option value="">{t('node.credentialNone')}</option>
                            {credentials
                                .filter(c => !d.action_type || c.adapter === d.action_type)
                                .map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                        </select>
                    </div>
                )}
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
                        onFocus={onF} onBlur={onB}
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
                padding: '8px 12px', borderRadius: T.radiusMd, marginBottom: 2,
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
            <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 12, marginTop: 2 }}>
                <button
                    onClick={() => onDelete(node.id)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '100%', height: T.controlHeight,
                        boxSizing: 'border-box',
                        background: T.dangerBg, border: `1.5px solid ${T.dangerBorder}`,
                        color: T.dangerText, borderRadius: T.radiusMd,
                        cursor: 'pointer', fontSize: T.fontBase, fontWeight: 600,
                        transition: 'filter 150ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.94)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                    {t('node.delete')}
                </button>
            </div>
        </div>
    );
}

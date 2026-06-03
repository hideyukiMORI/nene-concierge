import { useState } from 'react';
import type { Node } from '@xyflow/react';
import type { CredentialSummary, ChatNodeType } from '../../api.js';
import { NODE_ICONS } from './NodeTypes.js';
import type { MessageData, ConditionData, ActionData, EndData } from './NodeTypes.js';
import { T, NODE_TOKENS } from '../../theme.js';
import { applyFocus, removeFocus, CloseIcon } from '../Layout.js';
import { useTranslation } from '../../i18n/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// v2 (2026-05-28) — タブ付きドロワー
//   - 上端 3px のタイプアクセント
//   - ヘッダー: タイプアイコンチップ + ラベル + ID + 閉じる
//   - タブ: Config / Analytics / Connections
//   - フォーム: CSS変数経由でテーマに完全追従
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    node:        Node;
    credentials: CredentialSummary[];
    onChange:    (id: string, label: string, data: Record<string, unknown>) => void;
    onDelete:    (id: string) => void;
    onClose?:    () => void;
    /** モバイルインラインシート内で描画する時に true。
     *  width: 固定 320 を 100% に、borderLeft / 上端 stripe を削除し、surface を sheet 用に変更。 */
    mobile?:     boolean;
}

const MONO = T.fontMono;

// ── Panel-scoped style constants ──────────────────────────────────────────────
const S = {
    label: {
        display: 'block',
        fontSize: T.fontXs, fontWeight: 600,
        color: T.textMuted, fontFamily: MONO,
        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
        marginBottom: 5, lineHeight: '1.4',
    },
    input: {
        width: '100%', height: T.controlHeight, padding: '0 10px',
        boxSizing: 'border-box' as const,
        borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
        fontSize: T.fontBase, outline: 'none',
        background: T.surface, color: T.text,
        transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
    },
    select: {
        width: '100%', height: T.controlHeight, padding: '0 10px',
        boxSizing: 'border-box' as const,
        borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
        fontSize: T.fontBase, background: T.surface, color: T.text,
        outline: 'none', cursor: 'pointer',
        transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
    },
    textarea: {
        width: '100%', padding: '8px 10px',
        boxSizing: 'border-box' as const,
        borderRadius: T.radiusMd, border: `1px solid ${T.borderInput}`,
        fontSize: T.fontBase, outline: 'none',
        resize: 'vertical' as const, lineHeight: '1.5',
        minHeight: 80, background: T.surface, color: T.text,
        transition: `border-color ${T.transitionFast}, box-shadow ${T.transitionFast}`,
    },
    field: { marginBottom: 14 },
    hint:  { margin: '4px 0 0', fontSize: T.fontXs, color: T.textFaint, lineHeight: '1.4' },
};

const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    applyFocus(e.currentTarget);
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    removeFocus(e.currentTarget);

// ── Icons ────────────────────────────────────────────────────────────────────

const TrashIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
    </svg>
);

// ── Sub-component: field with label ──────────────────────────────────────────
function Field({ label, children, hint }: {
    label: string; children: React.ReactNode; hint?: string;
}) {
    return (
        <div style={S.field}>
            <label style={S.label}>{label}</label>
            {children}
            {hint && <p style={S.hint}>{hint}</p>}
        </div>
    );
}

// ── 本体 ─────────────────────────────────────────────────────────────────────
export default function NodeConfigPanel({ node, credentials, onChange, onDelete, onClose, mobile = false }: Props) {
    const { t }  = useTranslation();
    const type   = node.type as ChatNodeType;
    const data   = node.data as Record<string, unknown>;
    const label  = String(data['label'] ?? '');
    const tok    = NODE_TOKENS[type];

    // タブ
    const [tab, setTab] = useState<'config' | 'analytics' | 'connections'>('config');

    const typeLabel = t(`node.type.${type}` as Parameters<typeof t>[0]);

    function setLabel(v: string) { onChange(node.id, v, data); }
    function setData(patch: Record<string, unknown>) {
        onChange(node.id, label, { ...data, ...patch });
    }

    return (
        <div style={{
            width: mobile ? '100%' : T.editorDrawerW,
            height: '100%', flexShrink: 0,
            background: mobile ? T.surface : T.surfaceAlt,
            borderLeft: mobile ? 'none' : `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* タイプアクセント (mobile はシート側で出すので非表示) */}
            {!mobile && <div style={{ height: 3, background: tok.stripe, flexShrink: 0 }}/>}

            {/* ヘッダー */}
            <div style={{
                padding: '12px 14px 10px',
                display: 'flex', alignItems: 'center', gap: 9,
                borderBottom: `1px solid ${T.border}`,
                background: T.surface, flexShrink: 0,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 5,
                    background: tok.chip, color: tok.stripe,
                    border: `1px solid ${tok.chipEdge}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>{NODE_ICONS[type]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: T.fontBase, fontWeight: 700, color: T.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {label || typeLabel}
                    </div>
                    <div style={{ fontSize: T.fontXs, color: T.textMuted, fontFamily: MONO }}>
                        {typeLabel} · {node.id}
                    </div>
                </div>
                {/* 削除ボタン (ヘッダーへ移動 — 右下テーマスイッチャーとの衝突回避) */}
                <button onClick={() => onDelete(node.id)}
                    title={t('node.delete')} aria-label={t('node.delete')}
                    style={{
                        width: 28, height: 28, borderRadius: 5,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.dangerFg, cursor: 'pointer', flexShrink: 0,
                        marginRight: 2,
                        transition: `background ${T.transitionFast}, border-color ${T.transitionFast}`,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = T.dangerBg;
                        e.currentTarget.style.borderColor = T.dangerBorder;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = T.border;
                    }}>
                    <TrashIcon/>
                </button>
                {onClose && (
                    <button onClick={onClose} aria-label={t('common.close')} title={t('common.close')}
                        style={{
                            width: 24, height: 24, borderRadius: T.radiusSm,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none',
                            color: T.textMuted, cursor: 'pointer', flexShrink: 0,
                        }}>
                        <CloseIcon size={12} />
                    </button>
                )}
            </div>

            {/* タブ */}
            <div style={{
                display: 'flex', gap: 14, padding: '4px 14px 0',
                borderBottom: `1px solid ${T.border}`, background: T.surface,
                flexShrink: 0,
            }}>
                {(['config', 'analytics', 'connections'] as const).map(k => (
                    <button key={k} onClick={() => setTab(k)}
                        style={{
                            padding: '8px 0 9px',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: T.fontSm, fontWeight: tab === k ? 700 : 500,
                            color: tab === k ? T.text : T.textMuted,
                            borderBottom: tab === k
                                ? `2px solid ${T.primary}`
                                : '2px solid transparent',
                            marginBottom: -1,
                        }}>
                        {tabLabel(k, t)}
                    </button>
                ))}
            </div>

            {/* ボディ (スクロール可) */}
            <div style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
                {tab === 'config' && (
                    <>
                        <Field label={t('node.label')}>
                            <input style={S.input} value={label}
                                onChange={e => setLabel(e.target.value)}
                                onFocus={onF} onBlur={onB}/>
                        </Field>
                        {type === 'message'   && <MessageConfig   data={data as MessageData}   setData={setData}/>}
                        {type === 'condition' && <ConditionConfig data={data as ConditionData} setData={setData}/>}
                        {type === 'action'    && <ActionConfig    data={data as ActionData}    setData={setData} credentials={credentials}/>}
                        {type === 'end'       && <EndConfig       data={data as EndData}       setData={setData}/>}
                    </>
                )}
                {tab === 'analytics' && <AnalyticsTab data={data}/>}
                {tab === 'connections' && <ConnectionsTab nodeId={node.id} type={type}/>}
            </div>

            {/* フッター (削除ボタンはヘッダーに移動した — 右下テーマスイッチャーとの衝突回避) */}
            <div style={{
                padding: '10px 14px', borderTop: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', flexShrink: 0,
                background: T.surface,
            }}>
                <span style={{ flex: 1, fontSize: T.fontXs, color: T.textFaint, fontFamily: MONO }}>
                    {t('node.edited')}
                </span>
            </div>
        </div>
    );
}

// ── Tab label helper ─────────────────────────────────────────────────────────
function tabLabel(k: 'config' | 'analytics' | 'connections', t: ReturnType<typeof useTranslation>['t']) {
    if (k === 'config')      return t('node.tab.config');
    if (k === 'analytics')   return t('node.tab.analytics');
    return t('node.tab.connections');
}

// ── Message Config ───────────────────────────────────────────────────────────
function MessageConfig({ data, setData }: { data: MessageData; setData: (p: Record<string, unknown>) => void }) {
    const { t } = useTranslation();
    const choices: string[] = data.choices ?? [];

    function addChoice() {
        const v = prompt(t('node.addChoicePrompt'));
        if (v) setData({ choices: [...choices, v] });
    }
    function removeChoice(i: number) {
        setData({ choices: choices.filter((_, j) => j !== i) });
    }

    return (
        <>
            <Field label={t('node.messageText')}>
                <textarea style={S.textarea}
                    value={String(data.text ?? '')}
                    onChange={e => setData({ text: e.target.value })}
                    placeholder={t('node.messagePlaceholder')}
                    onFocus={onF} onBlur={onB}/>
            </Field>
            <Field label={t('node.choices')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {choices.map((c, i) => (
                        <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 5px 3px 9px', borderRadius: 99,
                            background: T.primaryBg, color: T.primaryText,
                            fontSize: T.fontSm,
                        }}>
                            {c}
                            <button onClick={() => removeChoice(i)} aria-label={t('common.remove')}
                                style={{
                                    width: 14, height: 14, borderRadius: 99, padding: 0,
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: T.primaryText, fontSize: 14, lineHeight: 1,
                                }}>×</button>
                        </span>
                    ))}
                </div>
                <button onClick={addChoice}
                    style={{
                        marginTop: 6, width: '100%',
                        fontSize: T.fontSm, color: T.primary,
                        background: 'transparent',
                        border: `1px dashed ${T.primaryMuted}`,
                        borderRadius: T.radiusMd, padding: '5px 10px',
                        cursor: 'pointer',
                    }}>
                    + {t('node.addChoice')}
                </button>
            </Field>
            <Field label={t('node.variableName')} hint={t('node.variableHint')}>
                <input style={{ ...S.input, fontFamily: MONO }}
                    value={String(data.variable_name ?? '')}
                    onChange={e => setData({ variable_name: e.target.value || undefined })}
                    placeholder={t('node.variablePlaceholder')}
                    onFocus={onF} onBlur={onB}/>
            </Field>
        </>
    );
}

// ── Condition Config ─────────────────────────────────────────────────────────
function ConditionConfig({ data, setData }: { data: ConditionData; setData: (p: Record<string, unknown>) => void }) {
    const { t } = useTranslation();
    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8, marginBottom: 14 }}>
                <div>
                    <label style={S.label}>{t('node.conditionVar')}</label>
                    <input style={{ ...S.input, fontFamily: MONO, fontSize: T.fontSm }}
                        value={data.variable ?? ''}
                        onChange={e => setData({ variable: e.target.value })}
                        placeholder={t('node.conditionVarPlaceholder')}
                        onFocus={onF} onBlur={onB}/>
                </div>
                <div>
                    <label style={S.label}>{t('node.operator')}</label>
                    <select style={{ ...S.select, fontFamily: MONO }}
                        value={data.operator ?? 'eq'}
                        onChange={e => setData({ operator: e.target.value })}
                        onFocus={onF} onBlur={onB}>
                        <option value="eq">==</option>
                        <option value="neq">!=</option>
                        <option value="contains">∋</option>
                        <option value="exists">?</option>
                        <option value="not_exists">!?</option>
                    </select>
                </div>
            </div>
            {(data.operator !== 'exists' && data.operator !== 'not_exists') && (
                <Field label={t('node.compareValue')}>
                    <input style={S.input}
                        value={data.value ?? ''}
                        onChange={e => setData({ value: e.target.value })}
                        placeholder={t('node.compareValuePlaceholder')}
                        onFocus={onF} onBlur={onB}/>
                </Field>
            )}

            {/* Preview */}
            <div style={{
                padding: 10, background: T.bg, border: `1px dashed ${T.border}`,
                borderRadius: T.radiusMd, marginBottom: 14,
            }}>
                <div style={S.label}>Preview</div>
                <div style={{
                    fontSize: T.fontSm, color: T.text, fontFamily: MONO, lineHeight: 1.5,
                }}>
                    <span style={{ color: NODE_TOKENS.action.stripe }}>if</span>{' '}
                    <span>{data.variable || 'var'}</span>{' '}
                    <span style={{ color: T.textMuted }}>{data.operator ?? 'eq'}</span>{' '}
                    {(data.operator !== 'exists' && data.operator !== 'not_exists') && (
                        <span style={{ color: NODE_TOKENS.condition.stripe }}>"{data.value ?? ''}"</span>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Action Config ────────────────────────────────────────────────────────────
function ActionConfig({ data, setData, credentials }: {
    data: ActionData; setData: (p: Record<string, unknown>) => void;
    credentials: CredentialSummary[];
}) {
    const { t } = useTranslation();
    const isQr = (data.action_type ?? 'http') === 'qr';
    return (
        <>
            <Field label={t('node.actionType')}>
                <select style={S.select}
                    value={data.action_type ?? 'http'}
                    onChange={e => setData({ action_type: e.target.value })}
                    onFocus={onF} onBlur={onB}>
                    <option value="http">HTTP</option>
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="chatwork">Chatwork</option>
                    <option value="qr">{t('node.qrCode')}</option>
                </select>
            </Field>

            {isQr && (
                <>
                    <Field label={t('node.qrContent')} hint={t('node.qrContentHint')}>
                        <textarea style={S.textarea}
                            value={data.qr_content ?? ''}
                            onChange={e => setData({ qr_content: e.target.value })}
                            placeholder={t('node.qrContentPlaceholder')}
                            onFocus={onF} onBlur={onB}/>
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 14 }}>
                        <div>
                            <label style={S.label}>{t('node.qrVariable')}</label>
                            <input style={{ ...S.input, fontFamily: MONO }}
                                value={data.qr_variable ?? ''}
                                onChange={e => setData({ qr_variable: e.target.value || undefined })}
                                placeholder={t('node.qrVariablePlaceholder')}
                                onFocus={onF} onBlur={onB}/>
                        </div>
                        <div>
                            <label style={S.label}>{t('node.qrSize')}</label>
                            <input type="number" min={64} max={800} step={8} style={S.input}
                                value={data.qr_size ?? 200}
                                onChange={e => setData({ qr_size: Number(e.target.value) || undefined })}
                                onFocus={onF} onBlur={onB}/>
                        </div>
                    </div>
                </>
            )}

            {!isQr && (
                <Field label={t('node.credential')}>
                    <select style={S.select}
                        value={String(data.credential_id ?? '')}
                        onChange={e => setData({ credential_id: e.target.value ? Number(e.target.value) : undefined })}
                        onFocus={onF} onBlur={onB}>
                        <option value="">{t('node.credentialNone')}</option>
                        {credentials
                            .filter(c => !data.action_type || c.adapter === data.action_type)
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
            )}
        </>
    );
}

// ── End Config ───────────────────────────────────────────────────────────────
function EndConfig({ data, setData }: { data: EndData; setData: (p: Record<string, unknown>) => void }) {
    const { t } = useTranslation();
    return (
        <Field label={t('node.outcome')}>
            <select style={S.select}
                value={data.outcome ?? 'completed'}
                onChange={e => setData({ outcome: e.target.value })}
                onFocus={onF} onBlur={onB}>
                <option value="completed">{t('node.outcome.completed')}</option>
                <option value="abandoned">{t('node.outcome.abandoned')}</option>
            </select>
        </Field>
    );
}

// ── Analytics Tab (placeholder — 既存 _analytics データ表示) ──────────────────
function AnalyticsTab({ data }: { data: Record<string, unknown> }) {
    const a = data['_analytics'] as { visit_count?: number; drop_off_rate?: number } | undefined;
    if (!a) {
        return (
            <p style={{ color: T.textMuted, fontSize: T.fontSm, padding: '8px 0' }}>
                Analytics モードを有効にすると、このノードの訪問数・離脱率が表示されます。
            </p>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Stat label="Visits" value={(a.visit_count ?? 0).toLocaleString()}/>
            <Stat label="Drop-off" value={`${Math.round((a.drop_off_rate ?? 0) * 100)}%`}/>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            padding: 12, background: T.surface,
            border: `1px solid ${T.border}`, borderRadius: T.radiusMd,
        }}>
            <div style={S.label}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: MONO }}>{value}</div>
        </div>
    );
}

// ── Connections Tab (placeholder) ────────────────────────────────────────────
function ConnectionsTab({ nodeId, type }: { nodeId: string; type: ChatNodeType }) {
    return (
        <div>
            <label style={S.label}>Outgoing edges</label>
            <p style={{ color: T.textMuted, fontSize: T.fontSm, marginTop: 6 }}>
                {nodeId} ({type}) からの接続一覧。React Flow のエッジ情報を親から受け取って表示してください。
            </p>
        </div>
    );
}

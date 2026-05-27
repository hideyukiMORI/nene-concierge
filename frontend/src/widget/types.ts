// ── Appearance API ──────────────────────────────────────────────────────────

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type TriggerType    = 'page_load' | 'scroll' | 'exit_intent' | 'manual';

export interface AppearanceConfig {
    color_primary:   string;
    color_secondary: string;
    position:        WidgetPosition;
    trigger_type:    TriggerType;
    icon_url:        string | null;
    welcome_text:    string | null;
}

// ── Session / Engine API ─────────────────────────────────────────────────────

export interface ChoiceView {
    target_node_id: string;
    label:          string | null;
}

export interface NodeView {
    node_id:     string;
    type:        'message' | 'condition' | 'action' | 'end';
    label:       string;
    choices:     ChoiceView[];
    is_terminal: boolean;
}

export type SessionOutcome = 'active' | 'completed' | 'dropped' | 'converted' | 'preview';

export interface SessionStartResponse {
    session_id: string;
    node:       NodeView;
}

export interface SessionStepResponse {
    outcome: SessionOutcome;
    node:    NodeView;
}

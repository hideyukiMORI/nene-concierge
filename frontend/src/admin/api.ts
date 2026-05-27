import { getToken, clearToken } from './auth.js';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DailySessionCount {
    date:  string;
    count: number;
}

export interface DashboardStats {
    sessions_7d:          number;
    converted_7d:         number;
    conversion_rate_7d:   number;
    active_sessions:      number;
    published_scenarios:  number;
    action_failures_24h:  number;
    daily_sessions:       DailySessionCount[];
}

export interface DashboardResponse {
    data: DashboardStats;
}

const BASE = window.location.origin;

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...(init.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...init, headers });

    if (res.status === 401) {
        clearToken();
        window.location.href = '/admin/';
        throw new ApiError(401, 'Unauthorized');
    }
    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { title?: string };
        throw new ApiError(res.status, body.title ?? `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse { token: string; expires_at: string; email: string; role: string; }

export function login(email: string, password: string): Promise<LoginResponse> {
    return request('/api/v1/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ email, password }),
    });
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

export interface ScenarioSummary {
    id: number; name: string; description: string | null;
    status: 'draft' | 'published' | 'archived';
    created_at: string | null; updated_at: string | null;
}

export type ChatNodeType = 'message' | 'condition' | 'action' | 'end';

export interface ScenarioNode {
    node_id:    string;
    type:       ChatNodeType;
    label:      string;
    data:       Record<string, unknown>;
    position_x: number;
    position_y: number;
}

export interface ScenarioEdge {
    source_node_id: string;
    target_node_id: string;
    label:          string | null;
}

export interface ScenarioDetail extends ScenarioSummary {
    nodes: ScenarioNode[];
    edges: ScenarioEdge[];
}
export interface ScenarioListResponse { data: ScenarioSummary[]; }

export function listScenarios(): Promise<ScenarioListResponse> {
    return request('/api/v1/scenarios');
}
export function getScenario(id: number): Promise<ScenarioDetail> {
    return request(`/api/v1/scenarios/${id}`);
}
export function createScenario(body: { name: string; description?: string }): Promise<{ id: number }> {
    return request('/api/v1/scenarios', { method: 'POST', body: JSON.stringify(body) });
}
export function updateScenario(id: number, body: Partial<{ name: string; description: string | null; status: string }>): Promise<void> {
    return request(`/api/v1/scenarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export function deleteScenario(id: number): Promise<void> {
    return request(`/api/v1/scenarios/${id}`, { method: 'DELETE' });
}
export function saveScenarioGraph(
    id: number,
    nodes: ScenarioNode[],
    edges: ScenarioEdge[],
): Promise<void> {
    return request(`/api/v1/scenarios/${id}/graph`, {
        method: 'PUT',
        body:   JSON.stringify({ nodes, edges }),
    });
}

// ── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = '1d' | '7d' | '30d' | '90d';

export interface NodeAnalyticsData {
    node_id:             string;
    visit_count:         number;
    avg_dwell_ms:        number;
    drop_off_rate:       number;
    branch_percentages:  Record<string, number>;
}

export interface ScenarioAnalyticsResponse {
    scenario_id:         number;
    period_from:         string;
    period_to:           string;
    total_sessions:      number;
    completed_sessions:  number;
    converted_sessions:  number;
    nodes:               NodeAnalyticsData[];
    bottlenecks:         string[];
}

export function getScenarioAnalytics(
    id: number,
    period: AnalyticsPeriod = '7d',
): Promise<ScenarioAnalyticsResponse> {
    return request(`/api/v1/scenarios/${id}/analytics?period=${period}`);
}

// ── Appearance ────────────────────────────────────────────────────────────────

export interface AppearanceData {
    color_primary: string; color_secondary: string;
    position: string; trigger_type: string;
    icon_url: string | null; welcome_text: string | null;
}

export function getAppearance(): Promise<AppearanceData> {
    return request('/api/v1/appearance');
}
export function upsertAppearance(body: Partial<AppearanceData>): Promise<AppearanceData> {
    return request('/api/v1/appearance', { method: 'PUT', body: JSON.stringify(body) });
}

// ── Action Credentials ────────────────────────────────────────────────────────

export interface CredentialSummary {
    id: number; name: string; adapter: string;
    created_at: string | null; updated_at: string | null;
}
export interface CredentialListResponse { data: CredentialSummary[]; }

export function listCredentials(): Promise<CredentialListResponse> {
    return request('/api/v1/action-credentials');
}
export function createCredential(body: { name: string; adapter: string; config?: Record<string, unknown> }): Promise<{ id: number }> {
    return request('/api/v1/action-credentials', { method: 'POST', body: JSON.stringify(body) });
}
export function deleteCredential(id: number): Promise<void> {
    return request(`/api/v1/action-credentials/${id}`, { method: 'DELETE' });
}

// ── Action Logs ───────────────────────────────────────────────────────────────

export interface ActionLogEntry {
    id:            number | null;
    session_id:    string;
    scenario_id:   number;
    node_id:       string;
    adapter:       string;
    status:        'success' | 'failure';
    error_message: string | null;
    executed_at:   string;
}

export interface ActionLogListResponse {
    data: ActionLogEntry[];
    meta: { total: number; limit: number; offset: number };
}

export interface ActionLogFilter {
    adapter?:     string;
    status?:      string;
    scenario_id?: number;
    limit?:       number;
    offset?:      number;
}

export function listActionLogs(filter: ActionLogFilter = {}): Promise<ActionLogListResponse> {
    const params = new URLSearchParams();
    if (filter.adapter)     params.set('adapter',     filter.adapter);
    if (filter.status)      params.set('status',      filter.status);
    if (filter.scenario_id) params.set('scenario_id', String(filter.scenario_id));
    if (filter.limit)       params.set('limit',        String(filter.limit));
    if (filter.offset)      params.set('offset',       String(filter.offset));
    const qs = params.toString();
    return request(`/api/v1/action-logs${qs ? `?${qs}` : ''}`);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type SessionOutcome = 'active' | 'completed' | 'dropped' | 'converted';

export interface SessionSummary {
    id:             string;
    scenario_id:    number;
    outcome:        SessionOutcome;
    has_conversion: boolean;
    started_at:     string;
    ended_at:       string | null;
}

export interface SessionMessage {
    id:         number | null;
    role:       'bot' | 'visitor';
    content:    string;
    node_id:    string | null;
    created_at: string;
}

export interface SessionDetail extends SessionSummary {
    variables: Record<string, string>;
    messages:  SessionMessage[];
}

export interface SessionListResponse {
    data: SessionSummary[];
    meta: { total: number; limit: number; offset: number };
}

export interface SessionDetailResponse {
    data: SessionDetail;
}

export interface SessionFilter {
    outcome?:        SessionOutcome;
    has_conversion?: 0 | 1;
    scenario_id?:    number;
    limit?:          number;
    offset?:         number;
}

export function listSessions(filter: SessionFilter = {}): Promise<SessionListResponse> {
    const params = new URLSearchParams();
    if (filter.outcome        !== undefined) params.set('outcome',         filter.outcome);
    if (filter.has_conversion !== undefined) params.set('has_conversion',  String(filter.has_conversion));
    if (filter.scenario_id    !== undefined) params.set('scenario_id',     String(filter.scenario_id));
    if (filter.limit          !== undefined) params.set('limit',           String(filter.limit));
    if (filter.offset         !== undefined) params.set('offset',          String(filter.offset));
    const qs = params.toString();
    return request(`/api/v1/sessions${qs ? `?${qs}` : ''}`);
}

export function getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
    return request(`/api/v1/sessions/${encodeURIComponent(sessionId)}`);
}

export function getDashboard(): Promise<DashboardResponse> {
    return request('/api/v1/dashboard');
}

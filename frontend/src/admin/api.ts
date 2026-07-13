import { createNene2Transport, isNene2ClientError, type TokenStore } from '@hideyukimori/nene2-client';
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

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// admin/auth.ts already owns the sessionStorage pair (`nene_admin_token` /
// `nene_admin_email`, Issue #161 / PR #162) and is consumed directly by
// App.tsx / Layout.tsx / LoginPage.tsx / UsersPage.tsx for isAuthenticated()
// and the stored email. Adapting its getToken/clearToken to the transport's
// minimal TokenStore contract keeps that module — and every one of its other
// callers — untouched. This is the smaller diff versus switching to
// createSessionTokenStore({ key: 'nene_admin_token' }), which would only
// cover the token half of the pair and would still need auth.ts kept around
// for the email key and isAuthenticated().
const tokenStore: TokenStore = {
    getToken:   () => getToken(),
    clearToken: () => clearToken(),
};

// baseUrl '' = same-origin relative paths; equivalent to the previous
// `window.location.origin` prefix since this admin SPA is always served
// same-origin with its API.
const transport = createNene2Transport({
    baseUrl: '',
    tokenStore,
    // Indirection instead of passing `window.fetch`/`globalThis.fetch`
    // directly: createNene2Transport resolves and binds its fetch once at
    // creation time, so a direct reference would freeze whatever `fetch`
    // was global at module-import time. This wrapper re-reads the `fetch`
    // binding on every call, matching call-time lookup — the same semantics
    // as the plain `fetch(...)` calls it replaces (and what lets tests use
    // vi.stubGlobal('fetch', ...)).
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    // Fires only for a 401 on a request that carried a token (session
    // expiry) — matches the previous unconditional 401 handler's intent.
    // A 401 with no token attached (e.g. a wrong-password login attempt)
    // no longer clears/redirects; see PR description "挙動変化".
    onUnauthorized: () => {
        window.location.href = '/admin/';
    },
});

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase();
    // Every call site in this file JSON.stringify()s its body before handing
    // it to this RequestInit-shaped helper; transport.post/put/patch accept
    // (and re-serialize) a plain value themselves, so it is parsed back here.
    // This keeps all ~30 call sites below unchanged — the smallest diff for
    // this migration.
    const body = typeof init.body === 'string' ? JSON.parse(init.body) as unknown : undefined;

    try {
        switch (method) {
            case 'GET':    return await transport.get<T>(path);
            case 'POST':   return await transport.post<T>(path, body);
            case 'PUT':    return await transport.put<T>(path, body);
            case 'PATCH':  return await transport.patch<T>(path, body);
            case 'DELETE': return await transport.delete<T>(path);
            default:       throw new Error(`admin/api.ts request(): unsupported method ${method}`);
        }
    } catch (err) {
        if (isNene2ClientError(err)) {
            // Same fallback chain as the previous body.title ?? `HTTP ${status}`.
            throw new ApiError(err.status, err.problem?.title ?? `HTTP ${err.status}`);
        }
        throw err;
    }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse { token: string; expires_at: string; email: string; role: string; }

export function login(email: string, password: string): Promise<LoginResponse> {
    return request('/api/v1/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ email, password }),
    });
}

// ── Me / Memberships ─────────────────────────────────────────────────────────

export interface MeOrganization {
    id:        number;
    slug:      string;
    name:      string;
    is_active: boolean;
}

export interface MeMembership extends MeOrganization {
    role: string;
}

export interface MeResponse {
    id:                   number;
    email:                string;
    role:                 string;
    status:               string;
    organizations:        MeMembership[];
    current_organization: MeOrganization | null;
}

export function getMe(): Promise<MeResponse> {
    return request('/api/v1/me');
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

export type ScenarioRevisionOperation = 'create' | 'update' | 'graph_save' | 'status_change' | 'delete';

export interface ScenarioRevision {
    id:          number;
    revision_no: number;
    user_id:     number | null;
    user_email:  string | null;
    operation:   ScenarioRevisionOperation;
    name:        string | null;
    status:      string | null;
    node_count:  number;
    edge_count:  number;
    created_at:  string | null;
}

export interface ScenarioHistoryResponse {
    data: ScenarioRevision[];
    meta: { total: number; limit: number; offset: number };
}

export function getScenarioHistory(id: number, limit = 50, offset = 0): Promise<ScenarioHistoryResponse> {
    return request(`/api/v1/scenarios/${id}/history?limit=${limit}&offset=${offset}`);
}

export interface ScenarioRevisionListItem extends ScenarioRevision {
    scenario_id:   number;
    scenario_name: string | null;
}

export interface ScenarioRevisionsResponse {
    data: ScenarioRevisionListItem[];
    meta: { total: number; limit: number; offset: number };
}

export interface ScenarioRevisionsFilters {
    scenario_id?: number;
    user_id?:     number;
    operation?:   ScenarioRevisionOperation;
    q?:           string;
    date_from?:   string;
    date_to?:     string;
}

export interface ScenarioRevisionSnapshotNode {
    node_id:    string;
    type:       ChatNodeType;
    label:      string;
    data:       Record<string, unknown>;
    position_x: number;
    position_y: number;
}
export interface ScenarioRevisionSnapshotEdge {
    source_node_id: string;
    target_node_id: string;
    label:          string | null;
}
export interface ScenarioRevisionSnapshot {
    name:        string | null;
    description: string | null;
    status:      string | null;
    nodes:       ScenarioRevisionSnapshotNode[];
    edges:       ScenarioRevisionSnapshotEdge[];
}

export interface ScenarioRevisionDetail {
    id:              number;
    scenario_id:     number;
    organization_id: number;
    revision_no:     number;
    user_id:         number | null;
    user_email:      string | null;
    operation:       ScenarioRevisionOperation;
    name:            string | null;
    description:     string | null;
    status:          string | null;
    node_count:      number;
    edge_count:      number;
    snapshot:        ScenarioRevisionSnapshot | null;
    created_at:      string | null;
}

export interface ScenarioRevisionDetailResponse {
    revision: ScenarioRevisionDetail;
    previous: ScenarioRevisionDetail | null;
}

export function getScenarioRevision(id: number): Promise<ScenarioRevisionDetailResponse> {
    return request(`/api/v1/scenario-revisions/${id}`);
}

export function searchScenarioRevisions(
    filters: ScenarioRevisionsFilters,
    limit = 50,
    offset = 0,
): Promise<ScenarioRevisionsResponse> {
    const params = new URLSearchParams();
    if (filters.scenario_id !== undefined) params.set('scenario_id', String(filters.scenario_id));
    if (filters.user_id     !== undefined) params.set('user_id',     String(filters.user_id));
    if (filters.operation)                 params.set('operation',   filters.operation);
    if (filters.q)                         params.set('q',           filters.q);
    if (filters.date_from)                 params.set('date_from',   filters.date_from);
    if (filters.date_to)                   params.set('date_to',     filters.date_to);
    params.set('limit',  String(limit));
    params.set('offset', String(offset));
    return request(`/api/v1/scenario-revisions?${params.toString()}`);
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

// ── Users (Issue #116 — Admin user management) ────────────────────────────────

export type UserRole   = 'superadmin' | 'owner' | 'editor' | 'viewer';
export type UserStatus = 'active' | 'disabled';

export interface UserSummary {
    id:         number;
    email:      string;
    role:       UserRole;
    status:     UserStatus;
    created_at: number | null;
    updated_at: number | null;
}

export interface UserListResponse { data: UserSummary[]; }

export function listUsers(): Promise<UserListResponse> {
    return request('/api/v1/users');
}

export function getUser(id: number): Promise<UserSummary> {
    return request(`/api/v1/users/${id}`);
}

export interface CreateUserPayload {
    email:    string;
    password: string;
    role:     UserRole;
}

export function createUser(payload: CreateUserPayload): Promise<UserSummary> {
    return request('/api/v1/users', {
        method: 'POST',
        body:   JSON.stringify(payload),
    });
}

export interface UpdateUserPayload {
    role?:     UserRole;
    status?:   UserStatus;
    password?: string;
}

export function updateUser(id: number, payload: UpdateUserPayload): Promise<UserSummary> {
    return request(`/api/v1/users/${id}`, {
        method: 'PATCH',
        body:   JSON.stringify(payload),
    });
}

export function deleteUser(id: number): Promise<void> {
    return request(`/api/v1/users/${id}`, { method: 'DELETE' });
}

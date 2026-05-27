import { getToken, clearToken } from './auth.js';

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
export interface ScenarioDetail extends ScenarioSummary {
    nodes: unknown[]; edges: unknown[];
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

import type {
    AppearanceConfig,
    SessionStartResponse,
    SessionStepResponse,
} from './types.js';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        ...init,
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText} (${url})`);
    }

    return res.json() as Promise<T>;
}

export function fetchAppearance(baseUrl: string): Promise<AppearanceConfig> {
    return fetchJson<AppearanceConfig>(`${baseUrl}/api/v1/public/appearance`);
}

export function startSession(baseUrl: string, scenarioId: number): Promise<SessionStartResponse> {
    return fetchJson<SessionStartResponse>(`${baseUrl}/api/v1/public/sessions`, {
        method: 'POST',
        body:   JSON.stringify({ scenario_id: scenarioId }),
    });
}

export function stepSession(
    baseUrl:      string,
    sessionId:    string,
    targetNodeId: string,
): Promise<SessionStepResponse> {
    return fetchJson<SessionStepResponse>(
        `${baseUrl}/api/v1/public/sessions/${sessionId}/step`,
        {
            method: 'POST',
            body:   JSON.stringify({ target_node_id: targetNodeId }),
        },
    );
}

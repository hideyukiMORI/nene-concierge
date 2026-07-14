import {
    createNene2Transport,
    isNene2ClientError,
    type Nene2Transport,
} from '@hideyukimori/nene2-client';
import type {
    AppearanceConfig,
    SessionStartResponse,
    SessionStepResponse,
} from './types.js';

// The embed widget only ever calls the unauthenticated public API
// (/api/v1/public/*). Per fleet convention W2a (会議 R3④A-8 / 02 §11) it uses an
// *anonymous* transport — created WITHOUT a tokenStore — so the token-derived
// `Authorization` / `X-Authorization` mirror never fires: nene2-client sets
// those headers only when a bearer token is present, and there is none here.
// This is the read-only, always-signed-out counterpart to the admin SPA's
// authenticated transport (#165).
//
// Public-path behaviour is intentionally left unchanged versus the previous
// plain `fetch` implementation:
//   • Cookie-less preserved — no `credentials` is passed, so fetch keeps its
//     same-origin default (never `include`).
//   • Same JSON headers — `Accept: application/json` on every request;
//     `Content-Type: application/json` on the bodied POSTs.
//   • Same throw contract — HTTP-status failures reject with the previous
//     `API error: <status> …` message (re-shaped in `run` below); network /
//     abort failures propagate unchanged.

// One transport per origin. The widget resolves a single baseUrl from its
// <script> tag, but api.ts callers still pass it explicitly (unchanged
// signatures), so memoise rather than recreate a transport on every call.
const transports = new Map<string, Nene2Transport>();

function transportFor(baseUrl: string): Nene2Transport {
    let transport = transports.get(baseUrl);

    if (transport === undefined) {
        transport = createNene2Transport({
            baseUrl,
            // No tokenStore → anonymous: no auth headers, no 401 token-clearing.
            // Indirection instead of passing `fetch` directly: createNene2Transport
            // resolves and binds fetch once at creation time, so a direct
            // reference would freeze whatever `fetch` was global at import time.
            // Re-reading the binding on every call preserves the call-time lookup
            // semantics of the plain `fetch(...)` it replaces — and is what lets
            // tests use vi.stubGlobal('fetch', ...) (same手筋 as admin #165).
            fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
        });
        transports.set(baseUrl, transport);
    }

    return transport;
}

// index.ts catches every api error, logs it, and shows a generic message — the
// only observable contract is "reject on failure". We re-shape HTTP-status
// errors back to the previous `API error: <status> [<title>] (<url>)` string so
// the widget's console surface stays stable; a Problem Details `title` replaces
// the old `statusText` (unavailable from Nene2ClientError). Network / abort
// errors surface as Nene2ClientError with status 0 — propagated unchanged, as
// the old raw-fetch rejection was.
async function run<T>(op: () => Promise<T>): Promise<T> {
    try {
        return await op();
    } catch (err) {
        if (isNene2ClientError(err) && err.status !== 0) {
            const title = err.problem?.title;
            const label = title !== undefined && title !== '' ? `${err.status} ${title}` : `${err.status}`;
            throw new Error(`API error: ${label} (${err.url})`);
        }
        throw err;
    }
}

export function fetchAppearance(baseUrl: string): Promise<AppearanceConfig> {
    return run(() => transportFor(baseUrl).get<AppearanceConfig>('/api/v1/public/appearance'));
}

export function startSession(baseUrl: string, scenarioId: number): Promise<SessionStartResponse> {
    return run(() => transportFor(baseUrl).post<SessionStartResponse>('/api/v1/public/sessions', {
        scenario_id: scenarioId,
    }));
}

export function stepSession(
    baseUrl:      string,
    sessionId:    string,
    targetNodeId: string,
): Promise<SessionStepResponse> {
    return run(() => transportFor(baseUrl).post<SessionStepResponse>(
        `/api/v1/public/sessions/${sessionId}/step`,
        { target_node_id: targetNodeId },
    ));
}

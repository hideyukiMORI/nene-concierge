"use strict";
var NeNeWidget = (() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/@hideyukimori/nene2-client/dist/problem/guards.js
  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function isHttpStatus(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599;
  }
  function isProblemDetails(value) {
    if (!isPlainObject(value)) {
      return false;
    }
    const { type, title, status, detail, instance } = value;
    if (typeof type !== "string" || typeof title !== "string" || !isHttpStatus(status)) {
      return false;
    }
    if (detail !== void 0 && typeof detail !== "string") {
      return false;
    }
    if (instance !== void 0 && typeof instance !== "string") {
      return false;
    }
    return true;
  }
  function parseProblemDetails(value) {
    return isProblemDetails(value) ? value : void 0;
  }
  async function parseProblemDetailsResponse(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/problem+json") && !contentType.includes("application/json")) {
      return void 0;
    }
    try {
      const body = await response.json();
      return parseProblemDetails(body);
    } catch {
      return void 0;
    }
  }

  // node_modules/@hideyukimori/nene2-client/dist/client/errors.js
  var Nene2ClientError = class extends Error {
    constructor(message, options) {
      super(message);
      __publicField(this, "status");
      __publicField(this, "problem");
      __publicField(this, "url");
      /** Present when the response included Retry-After or X-RateLimit-* headers. */
      __publicField(this, "rateLimit");
      this.name = "Nene2ClientError";
      this.status = options.status;
      this.url = options.url;
      this.problem = options.problem;
      this.rateLimit = options.rateLimit;
    }
  };
  function isNene2ClientError(error) {
    return error instanceof Nene2ClientError;
  }

  // node_modules/@hideyukimori/nene2-client/dist/client/rate-limit.js
  function parseHeaderInt(value) {
    if (value === null || value.trim() === "") {
      return void 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : void 0;
  }
  function parseRateLimitHeaders(headers) {
    const retryAfterSeconds = parseHeaderInt(headers.get("Retry-After"));
    const limit = parseHeaderInt(headers.get("X-RateLimit-Limit"));
    const remaining = parseHeaderInt(headers.get("X-RateLimit-Remaining"));
    const reset = parseHeaderInt(headers.get("X-RateLimit-Reset"));
    if (retryAfterSeconds === void 0 && limit === void 0 && remaining === void 0 && reset === void 0) {
      return void 0;
    }
    return {
      ...retryAfterSeconds !== void 0 ? { retryAfterSeconds } : {},
      ...limit !== void 0 ? { limit } : {},
      ...remaining !== void 0 ? { remaining } : {},
      ...reset !== void 0 ? { reset } : {}
    };
  }

  // node_modules/@hideyukimori/nene2-client/dist/client/signal.js
  function mergeRequestSignal(userSignal, timeoutMs) {
    const parts = [];
    if (userSignal !== void 0) {
      parts.push(userSignal);
    }
    if (timeoutMs !== void 0) {
      if (timeoutMs <= 0) {
        throw new Error("Nene2ClientConfig.timeoutMs must be positive");
      }
      parts.push(AbortSignal.timeout(timeoutMs));
    }
    if (parts.length === 0) {
      return void 0;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    const controller = new AbortController();
    const abortFromParts = () => {
      controller.abort();
    };
    for (const part of parts) {
      if (part.aborted) {
        abortFromParts();
        return controller.signal;
      }
      part.addEventListener("abort", abortFromParts, { once: true });
    }
    return controller.signal;
  }

  // node_modules/@hideyukimori/nene2-client/dist/client/request.js
  function wrapFetchError(error, url) {
    if (error instanceof Nene2ClientError) {
      return error;
    }
    if (error instanceof Error) {
      const prefix = error.name === "AbortError" || error.name === "TimeoutError" ? "NENE2 request aborted or timed out" : "NENE2 network request failed";
      return new Nene2ClientError(`${prefix}: ${error.message}`, { status: 0, url });
    }
    return new Nene2ClientError("NENE2 network request failed", { status: 0, url });
  }

  // node_modules/@hideyukimori/nene2-client/dist/transport/headers.js
  function buildTransportHeaders(input) {
    const headers = new Headers(input.staticHeaders);
    if (input.requestHeaders !== void 0) {
      for (const [name, value] of Object.entries(input.requestHeaders)) {
        headers.set(name, value);
      }
    }
    if (input.apiKey !== void 0) {
      headers.set("X-NENE2-API-Key", input.apiKey);
    }
    if (input.token !== null) {
      headers.set("Authorization", `Bearer ${input.token}`);
      headers.set("X-Authorization", `Bearer ${input.token}`);
    }
    return headers;
  }

  // node_modules/@hideyukimori/nene2-client/dist/transport/transport.js
  function resolveTransportConfig(config) {
    const fetchFn = config.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== "function") {
      throw new Error("fetch is not available; pass Nene2TransportConfig.fetch");
    }
    return {
      baseUrl: (config.baseUrl ?? "").replace(/\/+$/, ""),
      tokenStore: config.tokenStore,
      apiKey: config.apiKey,
      headers: config.headers ?? {},
      credentials: config.credentials,
      // Bind so an extracted browser `window.fetch` keeps its required receiver.
      fetch: fetchFn.bind(globalThis),
      timeoutMs: config.timeoutMs,
      onUnauthorized: config.onUnauthorized,
      onForbidden: config.onForbidden,
      clearTokenOnStatuses: config.clearTokenOnStatuses ?? [401]
    };
  }
  async function send(config, init) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const url = `${config.baseUrl}${init.path}`;
    const token = ((_a = config.tokenStore) == null ? void 0 : _a.getToken()) ?? null;
    const headers = buildTransportHeaders({
      staticHeaders: config.headers,
      requestHeaders: (_b = init.options) == null ? void 0 : _b.headers,
      apiKey: config.apiKey,
      token
    });
    if (init.accept !== void 0 && !headers.has("Accept")) {
      headers.set("Accept", init.accept);
    }
    if (init.contentType !== void 0) {
      headers.set("Content-Type", init.contentType);
    }
    const requestInit = { method: init.method, headers };
    if (init.body !== void 0) {
      requestInit.body = init.body;
    }
    if (config.credentials !== void 0) {
      requestInit.credentials = config.credentials;
    }
    const signal = mergeRequestSignal((_c = init.options) == null ? void 0 : _c.signal, config.timeoutMs);
    if (signal !== void 0) {
      requestInit.signal = signal;
    }
    let response;
    try {
      response = await config.fetch(url, requestInit);
    } catch (error) {
      throw wrapFetchError(error, url);
    }
    if (response.ok || (((_e = (_d = init.options) == null ? void 0 : _d.alsoOkStatuses) == null ? void 0 : _e.includes(response.status)) ?? false)) {
      return response;
    }
    const problem = await parseProblemDetailsResponse(response);
    const status = response.status;
    const tokenAttached = token !== null;
    if (tokenAttached && config.clearTokenOnStatuses.includes(status)) {
      (_f = config.tokenStore) == null ? void 0 : _f.clearToken();
    }
    const context = { status, path: init.path, url, tokenAttached, problem };
    if (status === 401 && tokenAttached) {
      (_g = config.onUnauthorized) == null ? void 0 : _g.call(config, context);
    }
    if (status === 403) {
      (_h = config.onForbidden) == null ? void 0 : _h.call(config, context);
    }
    const detail = (problem == null ? void 0 : problem.detail) ?? (problem == null ? void 0 : problem.title) ?? response.statusText;
    throw new Nene2ClientError(`NENE2 request failed: ${detail}`, {
      status,
      url,
      problem,
      rateLimit: parseRateLimitHeaders(response.headers)
    });
  }
  async function parseJsonBody(response, url) {
    if (response.status === 204) {
      return void 0;
    }
    const text = await response.text();
    if (text === "") {
      return void 0;
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      const contentType = response.headers.get("content-type") ?? "";
      const hint = contentType.includes("text/html") || contentType.includes("text/plain") ? " \u2014 response looks like HTML/text; check baseUrl points at the JSON API" : "";
      throw new Nene2ClientError(`NENE2 response is not valid JSON${hint}`, {
        status: response.status,
        url
      });
    }
    return body;
  }
  function parseContentDispositionFilename(header) {
    if (header === null) {
      return null;
    }
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    if ((match == null ? void 0 : match[1]) === void 0) {
      return null;
    }
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  async function toBlobDownload(response) {
    const blob = await response.blob();
    const filename = parseContentDispositionFilename(response.headers.get("Content-Disposition"));
    return { blob, filename };
  }
  function jsonBody(body) {
    if (body === void 0) {
      return { body: void 0, contentType: void 0 };
    }
    return { body: JSON.stringify(body), contentType: "application/json" };
  }
  function createNene2Transport(config = {}) {
    const resolved = resolveTransportConfig(config);
    async function requestJson(method, path, body, options) {
      const response = await send(resolved, {
        method,
        path,
        ...jsonBody(body),
        accept: "application/json",
        options
      });
      return parseJsonBody(response, `${resolved.baseUrl}${path}`);
    }
    async function requestRaw(path, body, options) {
      const response = await send(resolved, {
        method: "POST",
        path,
        body,
        contentType: (options == null ? void 0 : options.contentType) ?? "text/csv",
        accept: "application/json",
        options
      });
      return parseJsonBody(response, `${resolved.baseUrl}${path}`);
    }
    return {
      get: (path, options) => requestJson("GET", path, void 0, options),
      post: (path, body, options) => requestJson("POST", path, body, options),
      put: (path, body, options) => requestJson("PUT", path, body, options),
      patch: (path, body, options) => requestJson("PATCH", path, body, options),
      delete: (path, options) => requestJson("DELETE", path, void 0, options),
      getBlob: async (path, options) => {
        const response = await send(resolved, { method: "GET", path, options });
        return toBlobDownload(response);
      },
      postBlob: async (path, body, options) => {
        const response = await send(resolved, {
          method: "POST",
          path,
          ...jsonBody(body),
          options
        });
        return toBlobDownload(response);
      },
      upload: async (path, formData, options) => {
        const response = await send(resolved, {
          method: "POST",
          path,
          body: formData,
          accept: "application/json",
          options
        });
        return parseJsonBody(response, `${resolved.baseUrl}${path}`);
      },
      postCsv: (path, csv, options) => requestRaw(path, csv, options),
      postBytes: (path, body, options) => requestRaw(path, body, options)
    };
  }

  // src/widget/api.ts
  var transports = /* @__PURE__ */ new Map();
  function transportFor(baseUrl2) {
    let transport = transports.get(baseUrl2);
    if (transport === void 0) {
      transport = createNene2Transport({
        baseUrl: baseUrl2,
        // No tokenStore → anonymous: no auth headers, no 401 token-clearing.
        // Indirection instead of passing `fetch` directly: createNene2Transport
        // resolves and binds fetch once at creation time, so a direct
        // reference would freeze whatever `fetch` was global at import time.
        // Re-reading the binding on every call preserves the call-time lookup
        // semantics of the plain `fetch(...)` it replaces — and is what lets
        // tests use vi.stubGlobal('fetch', ...) (same手筋 as admin #165).
        fetch: (...args) => fetch(...args)
      });
      transports.set(baseUrl2, transport);
    }
    return transport;
  }
  async function run(op) {
    var _a;
    try {
      return await op();
    } catch (err) {
      if (isNene2ClientError(err) && err.status !== 0) {
        const title = (_a = err.problem) == null ? void 0 : _a.title;
        const label = title !== void 0 && title !== "" ? `${err.status} ${title}` : `${err.status}`;
        throw new Error(`API error: ${label} (${err.url})`);
      }
      throw err;
    }
  }
  function fetchAppearance(baseUrl2) {
    return run(() => transportFor(baseUrl2).get("/api/v1/public/appearance"));
  }
  function startSession(baseUrl2, scenarioId2) {
    return run(() => transportFor(baseUrl2).post("/api/v1/public/sessions", {
      scenario_id: scenarioId2
    }));
  }
  function stepSession(baseUrl2, sessionId, targetNodeId) {
    return run(() => transportFor(baseUrl2).post(
      `/api/v1/public/sessions/${sessionId}/step`,
      { target_node_id: targetNodeId }
    ));
  }

  // src/widget/style.ts
  function buildCss(primary, secondary, position) {
    const vProp = position.startsWith("bottom") ? "bottom" : "top";
    const hProp = position.endsWith("right") ? "right" : "left";
    return `
:host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #1f2937;
    box-sizing: border-box;
}

*, *::before, *::after { box-sizing: inherit; }

/* \u2500\u2500 Launcher \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.launcher {
    position: fixed;
    ${vProp}: 24px;
    ${hProp}: 24px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: ${position.endsWith("right") ? "flex-end" : "flex-start"};
    gap: 8px;
}

.launcher-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: ${primary};
    color: ${secondary};
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    outline: none;
}

.launcher-btn:hover  { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.22); }
.launcher-btn:active { transform: scale(0.96); }
.launcher-btn:focus-visible { outline: 3px solid ${primary}; outline-offset: 3px; }

.welcome-tooltip {
    background: #1f2937;
    color: #fff;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: fadeIn 0.2s ease;
}

/* \u2500\u2500 Chat overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

.chat-overlay {
    position: fixed;
    ${vProp}: 92px;
    ${hProp}: 16px;
    width: 360px;
    max-width: calc(100vw - 32px);
    max-height: min(600px, calc(100vh - 108px));
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483646;
    animation: slideUp 0.2s ease;
}

.chat-overlay[hidden] { display: none !important; }

.chat-header {
    background: ${primary};
    color: ${secondary};
    padding: 14px 16px;
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.close-btn {
    background: transparent;
    border: none;
    color: ${secondary};
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.8;
    transition: opacity 0.1s;
}
.close-btn:hover { opacity: 1; }

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
}

.message-bubble {
    background: #f3f4f6;
    border-radius: 12px 12px 12px 4px;
    padding: 10px 14px;
    max-width: 88%;
    align-self: flex-start;
    word-break: break-word;
    animation: fadeIn 0.18s ease;
    white-space: pre-wrap;
}

.chat-choices {
    padding: 10px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    border-top: 1px solid #f3f4f6;
}

.choice-btn {
    background: #fff;
    border: 1.5px solid ${primary};
    color: ${primary};
    border-radius: 8px;
    padding: 9px 14px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s, color 0.12s;
    word-break: break-word;
}

.choice-btn:hover  { background: ${primary}; color: ${secondary}; }
.choice-btn:active { opacity: 0.85; }

.status-msg {
    font-size: 13px;
    color: #6b7280;
    text-align: center;
    padding: 8px 0 4px;
    animation: fadeIn 0.2s ease;
}

/* \u2500\u2500 Animations \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

@keyframes fadeIn   { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes slideUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
`;
  }

  // src/widget/ui.ts
  function createWidgetDom(appearance) {
    const host = document.createElement("div");
    host.id = "nene-concierge-widget";
    const shadow = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = buildCss(
      appearance.color_primary,
      appearance.color_secondary,
      appearance.position
    );
    shadow.appendChild(styleEl);
    const launcher = document.createElement("div");
    launcher.className = "launcher";
    if (appearance.welcome_text) {
      const tooltip = document.createElement("div");
      tooltip.className = "welcome-tooltip";
      tooltip.textContent = appearance.welcome_text;
      launcher.appendChild(tooltip);
    }
    const launcherBtn = document.createElement("button");
    launcherBtn.className = "launcher-btn";
    launcherBtn.setAttribute("aria-label", "\u30C1\u30E3\u30C3\u30C8\u3092\u958B\u304F");
    launcherBtn.setAttribute("aria-expanded", "false");
    if (appearance.icon_url) {
      const img = document.createElement("img");
      img.src = appearance.icon_url;
      img.alt = "";
      img.style.cssText = "width:28px;height:28px;object-fit:contain;";
      launcherBtn.appendChild(img);
    } else {
      launcherBtn.textContent = "\u{1F4AC}";
    }
    launcher.appendChild(launcherBtn);
    shadow.appendChild(launcher);
    const overlay = document.createElement("div");
    overlay.className = "chat-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "\u30C1\u30E3\u30C3\u30C8");
    overlay.hidden = true;
    const header = document.createElement("div");
    header.className = "chat-header";
    const headerTitle = document.createElement("span");
    headerTitle.textContent = "\u30C1\u30E3\u30C3\u30C8";
    header.appendChild(headerTitle);
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.setAttribute("aria-label", "\u9589\u3058\u308B");
    closeBtn.textContent = "\xD7";
    header.appendChild(closeBtn);
    const messages = document.createElement("div");
    messages.className = "chat-messages";
    messages.setAttribute("role", "log");
    messages.setAttribute("aria-live", "polite");
    const choices = document.createElement("div");
    choices.className = "chat-choices";
    overlay.appendChild(header);
    overlay.appendChild(messages);
    overlay.appendChild(choices);
    shadow.appendChild(overlay);
    closeBtn.addEventListener("click", () => {
      overlay.hidden = true;
      launcherBtn.setAttribute("aria-expanded", "false");
    });
    return { host, shadow, launcher, launcherBtn, overlay, messages, choices };
  }
  var DATA_IMAGE_RE = /(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/g;
  function renderMessageContent(bubble, text) {
    const parts = text.split(DATA_IMAGE_RE);
    for (const part of parts) {
      if (part.startsWith("data:image/")) {
        const img = document.createElement("img");
        img.src = part;
        img.alt = "QR code";
        img.style.cssText = "display:block;max-width:200px;height:auto;border-radius:6px;margin:4px 0;";
        bubble.appendChild(img);
      } else if (part !== "") {
        bubble.appendChild(document.createTextNode(part));
      }
    }
  }
  function addMessage(messages, text) {
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    renderMessageContent(bubble, text);
    messages.appendChild(bubble);
    bubble.scrollIntoView({ behavior: "smooth", block: "end" });
  }
  function addStatus(messages, text) {
    const status = document.createElement("p");
    status.className = "status-msg";
    status.textContent = text;
    messages.appendChild(status);
    status.scrollIntoView({ behavior: "smooth", block: "end" });
  }
  function renderChoices(choices, options, onChoice) {
    choices.innerHTML = "";
    for (const choice of options) {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice.label ?? "\u6B21\u3078";
      btn.addEventListener("click", () => {
        choices.querySelectorAll(".choice-btn").forEach((b) => {
          b.disabled = true;
        });
        onChoice(choice);
      });
      choices.appendChild(btn);
    }
  }
  function clearChoices(choices) {
    choices.innerHTML = "";
  }
  function showTerminal(messages, choices, node) {
    addMessage(messages, node.label);
    addStatus(messages, "\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u7D42\u4E86\u3057\u307E\u3057\u305F\u3002");
    clearChoices(choices);
  }
  function openOverlay(elements) {
    elements.overlay.hidden = false;
    elements.launcherBtn.setAttribute("aria-expanded", "true");
    elements.overlay.focus();
  }

  // src/widget/index.ts
  var script = document.currentScript;
  var baseUrl = script ? new URL(script.src).origin : window.location.origin;
  var scenarioId = (script == null ? void 0 : script.dataset["scenarioId"]) != null ? parseInt(script.dataset["scenarioId"], 10) : null;
  var chatTitle = (script == null ? void 0 : script.dataset["title"]) ?? "\u30C1\u30E3\u30C3\u30C8";
  if (scenarioId === null || isNaN(scenarioId)) {
    console.warn("[NeNe Widget] data-scenario-id is required. Widget not initialized.");
  } else {
    initWidget(baseUrl, scenarioId, chatTitle);
  }
  async function initWidget(base, sid, title) {
    let appearance;
    try {
      appearance = await fetchAppearance(base);
    } catch (err) {
      console.error("[NeNe Widget] Failed to load appearance:", err);
      appearance = {
        color_primary: "#2563eb",
        color_secondary: "#ffffff",
        position: "bottom-right",
        trigger_type: "manual",
        icon_url: null,
        welcome_text: null
      };
    }
    const elements = createWidgetDom(appearance);
    const headerTitle = elements.shadow.querySelector(".chat-header span");
    if (headerTitle) {
      headerTitle.textContent = title;
    }
    document.body.appendChild(elements.host);
    let sessionId = null;
    let started = false;
    async function openChat() {
      openOverlay(elements);
      if (started) return;
      started = true;
      clearChoices(elements.choices);
      try {
        const resp = await startSession(base, sid);
        sessionId = resp.session_id;
        await renderNode(resp.node);
      } catch (err) {
        console.error("[NeNe Widget] Failed to start session:", err);
        addStatus(elements.messages, "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u958B\u59CB\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
      }
    }
    async function renderNode(node) {
      if (node.is_terminal) {
        showTerminal(elements.messages, elements.choices, node);
        return;
      }
      addMessage(elements.messages, node.label);
      if (node.choices.length === 0) {
        await autoStep();
        return;
      }
      renderChoices(elements.choices, node.choices, async (choice) => {
        clearChoices(elements.choices);
        addMessage(elements.messages, choice.label ?? "\u6B21\u3078");
        await advanceSession(choice.target_node_id);
      });
    }
    async function advanceSession(targetNodeId) {
      if (sessionId === null) return;
      try {
        const resp = await stepSession(base, sessionId, targetNodeId);
        await renderNode(resp.node);
      } catch (err) {
        console.error("[NeNe Widget] Step failed:", err);
        addStatus(elements.messages, "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002");
      }
    }
    async function autoStep() {
      await advanceSession("");
    }
    elements.launcherBtn.addEventListener("click", () => {
      if (elements.overlay.hidden) {
        void openChat();
      } else {
        elements.overlay.hidden = true;
        elements.launcherBtn.setAttribute("aria-expanded", "false");
      }
    });
    if (appearance.trigger_type === "page_load") {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        void openChat();
      } else {
        document.addEventListener("DOMContentLoaded", () => void openChat(), { once: true });
      }
    }
  }
})();
//# sourceMappingURL=widget.js.map

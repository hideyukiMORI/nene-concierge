"use strict";
var NeNeWidget = (() => {
  // src/widget/api.ts
  async function fetchJson(url, init) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      ...init
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText} (${url})`);
    }
    return res.json();
  }
  function fetchAppearance(baseUrl2) {
    return fetchJson(`${baseUrl2}/api/v1/public/appearance`);
  }
  function startSession(baseUrl2, scenarioId2) {
    return fetchJson(`${baseUrl2}/api/v1/public/sessions`, {
      method: "POST",
      body: JSON.stringify({ scenario_id: scenarioId2 })
    });
  }
  function stepSession(baseUrl2, sessionId, targetNodeId) {
    return fetchJson(
      `${baseUrl2}/api/v1/public/sessions/${sessionId}/step`,
      {
        method: "POST",
        body: JSON.stringify({ target_node_id: targetNodeId })
      }
    );
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
  function addMessage(messages, text) {
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;
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

/**
 * NeNe Concierge embed widget
 *
 * Embed on any page:
 *   <script src="https://your-domain.com/widget.js" data-scenario-id="1" async></script>
 *
 * Optional attributes:
 *   data-scenario-id  (required) — ID of the published scenario to run
 *   data-title        — Chat window title (default: "チャット")
 */

import { fetchAppearance, startSession, stepSession } from './api.js';
import { createWidgetDom, addMessage, addStatus, renderChoices, clearChoices, showTerminal, openOverlay } from './ui.js';
import type { NodeView } from './types.js';

// ── Detect configuration from <script> tag ────────────────────────────────────

const script = document.currentScript as HTMLScriptElement | null;
const baseUrl    = script ? new URL(script.src).origin : window.location.origin;
const scenarioId = script?.dataset['scenarioId'] != null
    ? parseInt(script.dataset['scenarioId'], 10)
    : null;
const chatTitle  = script?.dataset['title'] ?? 'チャット';

if (scenarioId === null || isNaN(scenarioId)) {
    console.warn('[NeNe Widget] data-scenario-id is required. Widget not initialized.');
} else {
    initWidget(baseUrl, scenarioId, chatTitle);
}

// ── Main initialization ───────────────────────────────────────────────────────

async function initWidget(base: string, sid: number, title: string): Promise<void> {
    // 1. Load appearance config
    let appearance;

    try {
        appearance = await fetchAppearance(base);
    } catch (err) {
        console.error('[NeNe Widget] Failed to load appearance:', err);
        // Fall back to sensible defaults so the widget still renders
        appearance = {
            color_primary:   '#2563eb',
            color_secondary: '#ffffff',
            position:        'bottom-right' as const,
            trigger_type:    'manual' as const,
            icon_url:        null,
            welcome_text:    null,
        };
    }

    // 2. Build and mount DOM
    const elements = createWidgetDom(appearance);

    // Update header title from data attribute
    const headerTitle = elements.shadow.querySelector<HTMLSpanElement>('.chat-header span');
    if (headerTitle) {
        headerTitle.textContent = title;
    }

    document.body.appendChild(elements.host);

    // 3. Session state
    let sessionId: string | null = null;
    let started = false;

    // 4. Start / resume session on overlay open
    async function openChat(): Promise<void> {
        openOverlay(elements);

        if (started) return; // already running
        started = true;

        clearChoices(elements.choices);

        try {
            const resp = await startSession(base, sid);
            sessionId = resp.session_id;
            await renderNode(resp.node);
        } catch (err) {
            console.error('[NeNe Widget] Failed to start session:', err);
            addStatus(elements.messages, 'セッションを開始できませんでした。');
        }
    }

    // 5. Render a node
    async function renderNode(node: NodeView): Promise<void> {
        if (node.is_terminal) {
            showTerminal(elements.messages, elements.choices, node);
            return;
        }

        addMessage(elements.messages, node.label);

        if (node.choices.length === 0) {
            // Action or condition node with no choices → auto-step with empty target
            await autoStep();
            return;
        }

        renderChoices(elements.choices, node.choices, async (choice) => {
            clearChoices(elements.choices);
            addMessage(elements.messages, choice.label ?? '次へ');
            await advanceSession(choice.target_node_id);
        });
    }

    // 6. Advance the session by choosing a specific node
    async function advanceSession(targetNodeId: string): Promise<void> {
        if (sessionId === null) return;

        try {
            const resp = await stepSession(base, sessionId, targetNodeId);
            await renderNode(resp.node);
        } catch (err) {
            console.error('[NeNe Widget] Step failed:', err);
            addStatus(elements.messages, 'エラーが発生しました。');
        }
    }

    // 7. Auto-step (for action/condition nodes that have a single outgoing edge)
    async function autoStep(): Promise<void> {
        // Engine resolves the next node automatically when no target_node_id given.
        // We pass an empty string; the server will route via conditions.
        await advanceSession('');
    }

    // 8. Wire launcher button
    elements.launcherBtn.addEventListener('click', () => {
        if (elements.overlay.hidden) {
            void openChat();
        } else {
            elements.overlay.hidden = true;
            elements.launcherBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // 9. Trigger: auto-open on page_load
    if (appearance.trigger_type === 'page_load') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            void openChat();
        } else {
            document.addEventListener('DOMContentLoaded', () => void openChat(), { once: true });
        }
    }
}

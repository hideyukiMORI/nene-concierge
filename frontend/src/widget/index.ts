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

    // 9. Trigger: auto-open according to the configured trigger type (#204)
    //
    // 自動オープンは 1 訪問につき 1 回だけ。訪問者が自分で閉じた後に勝手に開き直さない。
    let autoOpened = false;

    function autoOpen(): void {
        if (autoOpened || started) return;
        autoOpened = true;
        void openChat();
    }

    switch (appearance.trigger_type) {
        case 'page_load':
            onDocumentReady(autoOpen);
            break;

        case 'scroll':
            wireScrollTrigger(autoOpen);
            break;

        case 'exit_intent':
            wireExitIntentTrigger(autoOpen);
            break;

        case 'manual':
            // ランチャーボタンのみ（8 で配線済み）
            break;
    }
}

// ── Auto-open triggers ────────────────────────────────────────────────────────

/** スクロール自動オープンのしきい値。読了率でいう「半分まで読んだ」。 */
const SCROLL_TRIGGER_RATIO = 0.5;

function onDocumentReady(open: () => void): void {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        open();
    } else {
        document.addEventListener('DOMContentLoaded', open, { once: true });
    }
}

/**
 * ページの読了率が {@link SCROLL_TRIGGER_RATIO} を超えたら 1 回だけ開く。
 *
 * 🔴 ページがスクロール不能（コンテンツがビューポートに収まる）の場合、この条件は
 * **永遠に満たされない**。黙って何も起きないのは「設定できるのに動かない」の再生産なので、
 * その場合は警告を出して運用者に見えるようにする（#204 の主題そのもの）。
 */
function wireScrollTrigger(open: () => void): void {
    const onScroll = (): void => {
        if (scrolledRatio() < SCROLL_TRIGGER_RATIO) return;
        window.removeEventListener('scroll', onScroll);
        open();
    };

    if (!isScrollable()) {
        console.warn(
            '[NeNe Widget] trigger_type=scroll, but this page cannot scroll.'
            + ' The widget will only open from the launcher button.',
        );
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // 途中位置で読み込まれた場合（リロード・アンカー遷移）にも判定する
    onScroll();
}

/**
 * 離脱意図（マウスがビューポート上端から出る）で 1 回だけ開く。
 *
 * ⚠️ ポインタを持たない端末（タッチのみ）では **原理的に発火しない**。
 * `mouseout` は指の操作では起きないため、モバイル訪問者にはランチャーのみが残る。
 */
function wireExitIntentTrigger(open: () => void): void {
    const onMouseOut = (event: MouseEvent): void => {
        // relatedTarget が null＝ウィンドウの外へ出た。clientY <= 0＝上端（タブ/アドレスバー方向）。
        if (event.relatedTarget !== null || event.clientY > 0) return;
        document.removeEventListener('mouseout', onMouseOut);
        open();
    };

    document.addEventListener('mouseout', onMouseOut);
}

/** ドキュメントがスクロール可能か（コンテンツがビューポートを超えるか）。 */
function isScrollable(): boolean {
    return scrollableDistance() > 0;
}

/** 0（先頭）〜1（末尾）。スクロール不能なら 0 を返す（＝しきい値を満たさない）。 */
function scrolledRatio(): number {
    const distance = scrollableDistance();
    if (distance <= 0) return 0;

    return window.scrollY / distance;
}

function scrollableDistance(): number {
    return document.documentElement.scrollHeight - window.innerHeight;
}

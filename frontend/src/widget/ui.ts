import type { AppearanceConfig, ChoiceView, NodeView } from './types.js';
import { buildCss } from './style.js';

export interface WidgetElements {
    host:         HTMLElement;
    shadow:       ShadowRoot;
    launcher:     HTMLDivElement;
    launcherBtn:  HTMLButtonElement;
    overlay:      HTMLDivElement;
    messages:     HTMLDivElement;
    choices:      HTMLDivElement;
}

export function createWidgetDom(appearance: AppearanceConfig): WidgetElements {
    // ── Host element (appended to <body>) ──────────────────────────────────
    const host = document.createElement('div');
    host.id = 'nene-concierge-widget';
    const shadow = host.attachShadow({ mode: 'open' });

    // ── Styles ─────────────────────────────────────────────────────────────
    const styleEl = document.createElement('style');
    styleEl.textContent = buildCss(
        appearance.color_primary,
        appearance.color_secondary,
        appearance.position,
    );
    shadow.appendChild(styleEl);

    // ── Launcher ───────────────────────────────────────────────────────────
    const launcher = document.createElement('div');
    launcher.className = 'launcher';

    if (appearance.welcome_text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'welcome-tooltip';
        tooltip.textContent = appearance.welcome_text;
        launcher.appendChild(tooltip);
    }

    const launcherBtn = document.createElement('button');
    launcherBtn.className = 'launcher-btn';
    launcherBtn.setAttribute('aria-label', 'チャットを開く');
    launcherBtn.setAttribute('aria-expanded', 'false');

    if (appearance.icon_url) {
        const img = document.createElement('img');
        img.src = appearance.icon_url;
        img.alt = '';
        img.style.cssText = 'width:28px;height:28px;object-fit:contain;';
        launcherBtn.appendChild(img);
    } else {
        launcherBtn.textContent = '💬';
    }

    launcher.appendChild(launcherBtn);
    shadow.appendChild(launcher);

    // ── Chat overlay ───────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'chat-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'チャット');
    overlay.hidden = true;

    const header = document.createElement('div');
    header.className = 'chat-header';

    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'チャット';
    header.appendChild(headerTitle);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.setAttribute('aria-label', '閉じる');
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);

    const messages = document.createElement('div');
    messages.className = 'chat-messages';
    messages.setAttribute('role', 'log');
    messages.setAttribute('aria-live', 'polite');

    const choices = document.createElement('div');
    choices.className = 'chat-choices';

    overlay.appendChild(header);
    overlay.appendChild(messages);
    overlay.appendChild(choices);
    shadow.appendChild(overlay);

    // ── Wire close button ──────────────────────────────────────────────────
    closeBtn.addEventListener('click', () => {
        overlay.hidden = true;
        launcherBtn.setAttribute('aria-expanded', 'false');
    });

    return { host, shadow, launcher, launcherBtn, overlay, messages, choices };
}

/** data:image/... URI にマッチするパターン */
const DATA_IMAGE_RE = /(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/g;

/**
 * テキスト内の data:image/... URI を <img> として描画し、
 * それ以外のテキスト部分はそのまま表示する。
 */
function renderMessageContent(bubble: HTMLDivElement, text: string): void {
    const parts = text.split(DATA_IMAGE_RE);

    for (const part of parts) {
        if (part.startsWith('data:image/')) {
            const img = document.createElement('img');
            img.src = part;
            img.alt = 'QR code';
            img.style.cssText = 'display:block;max-width:200px;height:auto;border-radius:6px;margin:4px 0;';
            bubble.appendChild(img);
        } else if (part !== '') {
            bubble.appendChild(document.createTextNode(part));
        }
    }
}

export function addMessage(messages: HTMLDivElement, text: string): void {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    renderMessageContent(bubble, text);
    messages.appendChild(bubble);
    bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

export function addStatus(messages: HTMLDivElement, text: string): void {
    const status = document.createElement('p');
    status.className = 'status-msg';
    status.textContent = text;
    messages.appendChild(status);
    status.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

export function renderChoices(
    choices:  HTMLDivElement,
    options:  ChoiceView[],
    onChoice: (choice: ChoiceView) => void,
): void {
    choices.innerHTML = '';

    for (const choice of options) {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.label ?? '次へ';
        btn.addEventListener('click', () => {
            // Disable all buttons immediately to prevent double-clicks
            choices.querySelectorAll<HTMLButtonElement>('.choice-btn').forEach(b => {
                b.disabled = true;
            });
            onChoice(choice);
        });
        choices.appendChild(btn);
    }
}

export function clearChoices(choices: HTMLDivElement): void {
    choices.innerHTML = '';
}

export function showTerminal(messages: HTMLDivElement, choices: HTMLDivElement, node: NodeView): void {
    addMessage(messages, node.label);
    addStatus(messages, 'セッションが終了しました。');
    clearChoices(choices);
}

export function openOverlay(elements: WidgetElements): void {
    elements.overlay.hidden = false;
    elements.launcherBtn.setAttribute('aria-expanded', 'true');
    // Focus the overlay for accessibility
    elements.overlay.focus();
}

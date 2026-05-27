import type { WidgetPosition } from './types.js';

/** Returns the CSS string for the Shadow DOM, parameterised by appearance. */
export function buildCss(primary: string, secondary: string, position: WidgetPosition): string {
    const vProp = position.startsWith('bottom') ? 'bottom' : 'top';
    const hProp = position.endsWith('right')   ? 'right'  : 'left';

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

/* ── Launcher ─────────────────────────────────────────────────────────────── */

.launcher {
    position: fixed;
    ${vProp}: 24px;
    ${hProp}: 24px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: ${position.endsWith('right') ? 'flex-end' : 'flex-start'};
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

/* ── Chat overlay ─────────────────────────────────────────────────────────── */

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

/* ── Animations ───────────────────────────────────────────────────────────── */

@keyframes fadeIn   { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes slideUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
`;
}

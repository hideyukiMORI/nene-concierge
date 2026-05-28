// Theme switcher widget — floats bottom-right of every admin page.
// Persists choice to localStorage.nca-theme; applied to <html data-nca-theme>.
(function () {
  const STORAGE_KEY = 'nca-theme';

  // Theme metadata — order matches Settings page card grid.
  // dot: brand accent (sidebar accent color) for preview
  // sbBg: sidebar bg color
  // chrome: page bg color
  const THEMES = [
    { id: 'default',    label: 'Default',    light: 'default-light',   dark: 'default-dark',   dotLight: '#0d9488', dotDark: '#2DD4BF', sbLight: '#0E1116', sbDark: '#070809', bgLight: '#FAFAF7', bgDark: '#0B0D10' },
    { id: 'github',     label: 'GitHub',     light: 'github-light',    dark: 'github-dark',    dotLight: '#1f883d', dotDark: '#3fb950', sbLight: '#ffffff', sbDark: '#010409', bgLight: '#f6f8fa', bgDark: '#0d1117' },
    { id: 'solarized',  label: 'Solarized',  light: 'solarized-light', dark: 'solarized-dark', dotLight: '#268bd2', dotDark: '#2aa198', sbLight: '#002b36', sbDark: '#00212b', bgLight: '#fdf6e3', bgDark: '#002b36' },
    { id: 'ubuntu',     label: 'Ubuntu',     light: 'ubuntu-light',    dark: 'ubuntu-dark',    dotLight: '#E95420', dotDark: '#E95420', sbLight: '#2C001E', sbDark: '#1E0014', bgLight: '#F7F7F5', bgDark: '#2C001E' },
    { id: 'dracula',    label: 'Dracula',    dark: 'dracula-dark',     darkOnly: true, dotDark: '#bd93f9', sbDark: '#21222c', bgDark: '#282a36' },
    { id: 'monokai',    label: 'Monokai',    dark: 'monokai-dark',     darkOnly: true, dotDark: '#a6e22e', sbDark: '#1e1f1a', bgDark: '#272822' },
  ];

  function applyTheme(themeKey) {
    // themeKey: 'default-light' | 'default-dark' | ... | null (for :root default)
    if (themeKey && themeKey !== 'default-light') {
      document.documentElement.setAttribute('data-nca-theme', themeKey);
    } else {
      document.documentElement.removeAttribute('data-nca-theme');
    }
    try { localStorage.setItem(STORAGE_KEY, themeKey || 'default-light'); } catch (e) {}
  }

  function getCurrentTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'default-light';
    } catch (e) { return 'default-light'; }
  }

  function findThemeByKey(key) {
    for (const t of THEMES) {
      if (t.light === key) return { theme: t, mode: 'light' };
      if (t.dark === key) return { theme: t, mode: 'dark' };
    }
    return { theme: THEMES[0], mode: 'light' };
  }

  // ─── Inject CSS for the widget ─────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #nca-theme-switcher {
      position: fixed; right: 16px; bottom: 16px;
      z-index: 200;
      font-family: "Inter", system-ui, sans-serif;
      font-size: 12px;
    }
    #nca-theme-switcher .trigger {
      display: inline-flex; align-items: center; gap: 7px;
      height: 32px; padding: 0 12px;
      background: var(--nca-color-surface);
      border: 1px solid var(--nca-color-border);
      border-radius: 99px;
      color: var(--nca-color-text);
      box-shadow: var(--nca-shadow-elevated, 0 10px 30px -10px rgba(15,23,42,.18));
      cursor: pointer; outline: none;
    }
    #nca-theme-switcher .trigger:hover { background: var(--nca-color-surface-hover); }
    #nca-theme-switcher .trigger-dot {
      width: 9px; height: 9px; border-radius: 99px;
      border: 1.5px solid var(--nca-color-surface);
      box-shadow: 0 0 0 1px var(--nca-color-border);
    }
    #nca-theme-switcher .trigger-label {
      font-family: ui-monospace, "JetBrains Mono", monospace;
      font-size: 11px; font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--nca-color-text-muted);
    }
    #nca-theme-switcher .trigger-mode {
      color: var(--nca-color-text);
      font-weight: 700;
    }
    #nca-theme-switcher .trigger-chev {
      color: var(--nca-color-text-faint);
      font-size: 10px;
    }
    #nca-theme-switcher .menu {
      position: absolute; bottom: calc(100% + 8px); right: 0;
      min-width: 260px;
      background: var(--nca-color-surface);
      border: 1px solid var(--nca-color-border);
      border-radius: 8px;
      box-shadow: var(--nca-shadow-elevated, 0 18px 50px -10px rgba(15,23,42,.25));
      padding: 6px;
      display: none;
    }
    #nca-theme-switcher.open .menu { display: block; }
    #nca-theme-switcher .menu-label {
      font-family: ui-monospace, "JetBrains Mono", monospace;
      font-size: 9.5px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--nca-color-text-faint);
      padding: 8px 10px 4px;
    }
    #nca-theme-switcher .row {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 10px;
      border-radius: 5px;
      cursor: pointer;
    }
    #nca-theme-switcher .row:hover { background: var(--nca-color-surface-hover); }
    #nca-theme-switcher .row.current { background: var(--nca-color-primary-tint); }
    #nca-theme-switcher .swatch {
      width: 28px; height: 18px; border-radius: 3px;
      border: 1px solid var(--nca-color-border-light);
      flex-shrink: 0;
      display: grid; grid-template-columns: 8px 1fr;
      overflow: hidden;
    }
    #nca-theme-switcher .swatch .sb { height: 100%; }
    #nca-theme-switcher .swatch .pg {
      height: 100%; position: relative;
    }
    #nca-theme-switcher .swatch .pg::after {
      content: '';
      position: absolute; left: 3px; top: 4px;
      width: 9px; height: 2px; border-radius: 1px;
      background: currentColor; opacity: 0.6;
    }
    #nca-theme-switcher .row-name {
      flex: 1; font-size: 12.5px; font-weight: 500;
      color: var(--nca-color-text);
    }
    #nca-theme-switcher .row.current .row-name { font-weight: 700; color: var(--nca-color-text-strong); }
    #nca-theme-switcher .mode-toggle {
      display: flex; align-items: center; gap: 2px;
      padding: 2px;
      background: var(--nca-color-surface-alt);
      border-radius: 99px;
      border: 1px solid var(--nca-color-border-light);
    }
    #nca-theme-switcher .seg {
      width: 22px; height: 18px; border-radius: 99px;
      display: flex; align-items: center; justify-content: center;
      color: var(--nca-color-text-faint); font-size: 11px;
      cursor: pointer;
    }
    #nca-theme-switcher .seg.active {
      background: var(--nca-color-surface);
      color: var(--nca-color-text-strong);
      box-shadow: 0 1px 2px rgba(15,23,42,.08);
    }
    #nca-theme-switcher .seg.disabled { opacity: 0.25; cursor: not-allowed; }
    #nca-theme-switcher .menu-foot {
      margin-top: 4px; padding: 8px 10px 4px;
      font-family: ui-monospace, "JetBrains Mono", monospace;
      font-size: 9.5px; color: var(--nca-color-text-faint);
      letter-spacing: 0.04em;
      border-top: 1px solid var(--nca-color-border-light);
    }
  `;
  document.head.appendChild(style);

  // ─── Build widget ──────────────────────────────────────────────────────
  function render() {
    const current = getCurrentTheme();
    const { theme: curTheme, mode: curMode } = findThemeByKey(current);

    const trigger = `
      <button class="trigger" id="nca-ts-trigger">
        <span class="trigger-dot" style="background: ${curMode === 'dark' ? curTheme.dotDark : curTheme.dotLight}"></span>
        <span class="trigger-label">theme:</span>
        <span class="trigger-mode">${curTheme.label} · ${curMode}</span>
        <span class="trigger-chev">▴</span>
      </button>
    `;

    const rows = THEMES.map(t => {
      const lightKey = t.light;
      const darkKey = t.dark;
      const isCurrent = (current === lightKey) || (current === darkKey);
      const cls = `row${isCurrent ? ' current' : ''}`;
      const swatch = `
        <span class="swatch" title="${t.label}" style="color: ${curMode === 'dark' && t.dotDark ? t.dotDark : t.dotLight}">
          <span class="sb" style="background: ${(t.darkOnly || curMode === 'dark') ? t.sbDark : t.sbLight}"></span>
          <span class="pg" style="background: ${(t.darkOnly || curMode === 'dark') ? t.bgDark : t.bgLight}"></span>
        </span>
      `;
      const lightActive = current === lightKey ? 'active' : '';
      const darkActive  = current === darkKey  ? 'active' : '';
      const lightDis = t.darkOnly ? 'disabled' : '';
      const toggle = `
        <span class="mode-toggle">
          <span class="seg ${lightActive} ${lightDis}" data-set="${lightKey || ''}" title="Light">☀</span>
          <span class="seg ${darkActive}" data-set="${darkKey}" title="Dark">🌙</span>
        </span>
      `;
      return `<div class="${cls}" data-theme="${t.id}">
        ${swatch}
        <span class="row-name">${t.label}${t.darkOnly ? ' <span style="font-family:ui-monospace,monospace;font-size:9.5px;color:var(--nca-color-text-faint);">dark only</span>' : ''}</span>
        ${toggle}
      </div>`;
    }).join('');

    const menu = `
      <div class="menu">
        <div class="menu-label">choose admin theme</div>
        ${rows}
        <div class="menu-foot">Persists to localStorage · live preview only</div>
      </div>
    `;

    const container = document.createElement('div');
    container.id = 'nca-theme-switcher';
    container.innerHTML = trigger + menu;
    return container;
  }

  // ─── Mount + bind ──────────────────────────────────────────────────────
  // Apply persisted theme immediately
  applyTheme(getCurrentTheme());

  function mount() {
    const existing = document.getElementById('nca-theme-switcher');
    if (existing) existing.remove();
    const widget = render();
    document.body.appendChild(widget);

    // Toggle menu
    widget.querySelector('#nca-ts-trigger').addEventListener('click', e => {
      e.stopPropagation();
      widget.classList.toggle('open');
    });
    // Outside click closes
    document.addEventListener('click', e => {
      if (!widget.contains(e.target)) widget.classList.remove('open');
    });
    // Theme segment click
    widget.querySelectorAll('.seg').forEach(seg => {
      seg.addEventListener('click', e => {
        e.stopPropagation();
        if (seg.classList.contains('disabled')) return;
        const key = seg.dataset.set;
        if (!key) return;
        applyTheme(key);
        mount(); // re-render with new current
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

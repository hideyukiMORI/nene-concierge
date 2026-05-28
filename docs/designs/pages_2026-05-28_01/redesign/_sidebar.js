// Shared sidebar injected on every admin page.
// data-active="<page-id>" on <body> controls which nav item is active.
(function () {
  const ICONS = {
    dashboard: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    scenarios: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
    appearance: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="8" r="1.2" fill="currentColor"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor"/></svg>',
    credentials: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    logs: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    sessions: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    settings: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  };

  const ITEMS = [
    { id: 'dashboard',   href: 'dashboard.html',   icon: ICONS.dashboard,   label: 'Dashboard' },
    { id: 'scenarios',   href: 'scenarios.html',   icon: ICONS.scenarios,   label: 'Scenarios' },
    { divider: true },
    { id: 'appearance',  href: 'appearance.html',  icon: ICONS.appearance,  label: 'Appearance' },
    { id: 'credentials', href: 'credentials.html', icon: ICONS.credentials, label: 'Credentials' },
    { id: 'logs',        href: 'action-logs.html', icon: ICONS.logs,        label: 'Action Logs' },
    { id: 'sessions',    href: 'sessions.html',    icon: ICONS.sessions,    label: 'Sessions' },
    { divider: true },
    { id: 'settings',    href: 'settings.html',    icon: ICONS.settings,    label: 'Settings' },
  ];

  const active = document.body.dataset.active || '';
  const el = document.getElementById('nca-sidebar');
  if (!el) return;

  const header = `
    <div class="sidebar-header">
      <div class="brand-mark">
        <span class="br">[</span><span>n</span><span class="br">]</span>
        <span class="cursor nca-brand-cursor"></span>
      </div>
      <span class="brand-word">nene<span class="dim">.concierge</span></span>
      <span class="brand-admin">admin</span>
    </div>`;

  const nav = ITEMS.map(it => {
    if (it.divider) return '<div class="nav-divider"></div>';
    const cls = `nav-item${it.id === active ? ' active' : ''}`;
    return `<a href="${it.href}" class="${cls}"><span class="icon">${it.icon}</span><span>${it.label}</span></a>`;
  }).join('');

  el.innerHTML = `${header}
    <nav class="sidebar-nav">${nav}</nav>
    <div class="sidebar-footer">owner@nene-concierge.local</div>`;
})();

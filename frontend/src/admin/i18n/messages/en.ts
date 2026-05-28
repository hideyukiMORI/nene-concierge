/**
 * English message catalog — source of truth for NeNe Concierge Admin.
 *
 * Key naming: {feature}.{element}
 * Param interpolation: {{paramName}}
 *
 * All other locales are `Partial<MessageCatalog>` and fall back to these values.
 */

export const en = {
    // ── Locale names ──────────────────────────────────────────────────────────
    'locale.en':      'English',
    'locale.ja':      'Japanese',
    'locale.fr':      'French',
    'locale.zh-Hans': 'Chinese (Simplified)',
    'locale.pt-BR':   'Portuguese (Brazil)',
    'locale.de':      'German',

    // ── Common ────────────────────────────────────────────────────────────────
    'common.loading':       'Loading…',
    'common.saving':        'Saving…',
    'common.save':          'Save',
    'common.create':        'Create',
    'common.creating':      'Creating…',
    'common.delete':        'Delete',
    'common.edit':          'Edit',
    'common.cancel':        'Cancel',
    'common.close':         'Close',
    'common.remove':        'Remove',
    'common.search':        'Search nodes / actions…',
    'common.history':       'History',
    'common.backToList':    'Back to list',
    'common.new':           '+ New',
    'common.add':           '+ Add',
    'common.id':            'ID',
    'common.name':          'Name',
    'common.description':   'Description',
    'common.status':        'Status',
    'common.actions':       'Actions',
    'common.createdAt':     'Created',
    'common.optional':      '(optional)',
    'common.required':      '*',

    'common.error.unknown': 'An error occurred.',
    'common.error.fetch':   'Failed to load data.',
    'common.error.save':    'Failed to save.',
    'common.error.delete':  'Failed to delete.',

    // ── Nav ───────────────────────────────────────────────────────────────────
    'nav.brand':            'NeNe Concierge',
    'nav.scenarios':        'Scenarios',
    'nav.appearance':       'Appearance',
    'nav.credentials':      'Action Credentials',
    'nav.settings':         'Settings',
    'nav.logout':           'Log out',
    'nav.collapseSidebar':  'Collapse sidebar',
    'nav.expandSidebar':    'Expand sidebar',

    // ── Auth ──────────────────────────────────────────────────────────────────
    'auth.appTitle':          'NeNe Concierge',
    'auth.subtitle':          'Sign in to Admin',
    'auth.emailLabel':        'Email address',
    'auth.emailPlaceholder':  'admin@example.com',
    'auth.passwordLabel':     'Password',
    'auth.pwPlaceholder':     '••••••••',
    'auth.signIn':            'Sign in',
    'auth.signingIn':         'Signing in…',
    'auth.error':             'Login failed.',

    // ── Scenarios list ────────────────────────────────────────────────────────
    'scenarios.pageTitle':     'Scenarios',
    'scenarios.empty':         'No scenarios yet.',
    'scenarios.emptyHint':     'Click "New" to create one.',
    'scenarios.loadError':     'Failed to load scenarios.',
    'scenarios.deleteError':   'Failed to delete.',
    'scenarios.confirmDelete': 'Delete "{{name}}"? This cannot be undone.',

    'scenario.status.draft':     'Draft',
    'scenario.status.published': 'Published',
    'scenario.status.archived':  'Archived',

    // ── Scenario form / editor ────────────────────────────────────────────────
    'scenarioForm.newTitle':          'New Scenario',
    'scenarioForm.metaSaved':         'Metadata saved',
    'scenarioForm.graphSaved':        'Graph saved',
    'scenarioForm.nameLabel':         'Scenario name',
    'scenarioForm.namePlaceholder':   'e.g. Inquiry flow',
    'scenarioForm.descLabel':         'Description (optional)',
    'scenarioForm.descPlaceholder':   'Brief description of this scenario…',
    'scenarioForm.statusLabel':       'Status',
    'scenarioForm.canvasHint':        'Create the scenario to open the canvas editor.',
    'scenarioForm.detailsToggle':     'Details',
    'scenarioForm.loadError':         'Failed to load scenario.',
    'scenarioForm.saveError':         'Failed to save.',
    'scenarioForm.graphSaveError':    'Failed to save graph.',
    'scenarioForm.deleteError':       'Failed to delete.',

    // ── Appearance ────────────────────────────────────────────────────────────
    'appearance.pageTitle':        'Appearance',
    'appearance.primaryColor':     'Primary color',
    'appearance.secondaryColor':   'Secondary color (text)',
    'appearance.position':         'Position',
    'appearance.trigger':          'Trigger',
    'appearance.iconUrl':          'Icon URL (optional)',
    'appearance.iconPlaceholder':  'https://example.com/icon.png',
    'appearance.welcomeText':      'Welcome text (optional)',
    'appearance.welcomePlaceholder': 'How can I help you?',
    'appearance.saved':            '✓ Saved.',
    'appearance.loadError':        'Failed to load appearance.',
    'appearance.saveError':        'Failed to save.',

    'appearance.position.bottomRight': 'Bottom right',
    'appearance.position.bottomLeft':  'Bottom left',
    'appearance.position.topRight':    'Top right',
    'appearance.position.topLeft':     'Top left',

    'appearance.trigger.pageLoad':    'On page load (auto open)',
    'appearance.trigger.scroll':      'On scroll',
    'appearance.trigger.exitIntent':  'Exit intent',
    'appearance.trigger.manual':      'Manual (button click only)',

    // ── Credentials ───────────────────────────────────────────────────────────
    'credentials.pageTitle':     'Action Credentials',
    'credentials.newTitle':      'New Credential',
    'credentials.nameLabel':     'Name',
    'credentials.namePlaceholder': 'e.g. Slack notification webhook',
    'credentials.adapterLabel':  'Adapter',
    'credentials.secretHint':    '* Sensitive config (URL, tokens, etc.) can be updated via API after creation.',
    'credentials.empty':         'No credentials yet.',
    'credentials.loadError':     'Failed to load credentials.',
    'credentials.saveError':     'Failed to create credential.',
    'credentials.deleteError':   'Failed to delete.',
    'credentials.confirmDelete': 'Delete "{{name}}"?',

    'credentials.adapter.http':     'HTTP (External API)',
    'credentials.adapter.email':    'Email',
    'credentials.adapter.slack':    'Slack',
    'credentials.adapter.chatwork': 'Chatwork',

    // ── Node types ────────────────────────────────────────────────────────────
    'node.type.message':   'Message',
    'node.type.condition': 'Condition',
    'node.type.action':    'Action',
    'node.type.end':       'End',

    // ── Node config panel ─────────────────────────────────────────────────────
    'node.label':              'Label',
    'node.messageText':        'Message text',
    'node.messagePlaceholder': 'Message to display to visitor…',
    'node.choices':            'Choices (quick reply)',
    'node.addChoice':          '+ Add choice',
    'node.addChoicePrompt':    'Enter choice text',
    'node.variableName':       'Variable name (to collect input)',
    'node.variablePlaceholder': 'e.g. user_name',
    'node.variableHint':       'Variable name to reference in subsequent nodes',
    'node.tab.config':         'Config',
    'node.tab.analytics':      'Analytics',
    'node.tab.connections':    'Connections',
    'node.edited':             'Edited',

    'node.conditionVar':         'Variable',
    'node.conditionVarPlaceholder': 'e.g. user_answer',
    'node.operator':             'Operator',
    'node.compareValue':         'Compare value',
    'node.compareValuePlaceholder': 'Value to compare',
    'node.conditionHint':        'Bottom handles: left = true / right = false',

    'node.actionType':    'Action type',
    'node.credential':    'Credential',
    'node.credentialNone': '— Select —',

    'node.qrCode':               'QR code',
    'node.qrContent':            'Content (URL or text)',
    'node.qrContentPlaceholder': 'https://example.com/{{user_id}}',
    'node.qrContentHint':        '{{variable}} interpolation is supported.',
    'node.qrVariable':           'Output variable name',
    'node.qrVariablePlaceholder': 'qr_url',
    'node.qrSize':               'Image size (px, 64–800)',

    'node.outcome': 'Outcome',
    'node.outcome.completed': 'completed — Done',
    'node.outcome.abandoned': 'abandoned — Abandoned',

    'node.operator.eq':        '= Equal',
    'node.operator.neq':       '≠ Not equal',
    'node.operator.contains':  'contains',
    'node.operator.exists':    'exists',
    'node.operator.not_exists': 'not_exists',

    'node.addToCanvas': 'Add {{type}} node',
    'node.delete':      '🗑 Delete this node',

    // ── Canvas ────────────────────────────────────────────────────────────────
    'canvas.save':   '💾 Save',
    'canvas.saving': 'Saving…',

    'canvas.editMode':      'Edit',
    'canvas.analyticsMode': 'Analytics',

    'canvas.analytics.loading':    'Loading analytics…',
    'canvas.analytics.noData':     'No session data for this period.',
    'canvas.analytics.visits':     '{{count}} visits',
    'canvas.analytics.dropOff':    '{{rate}}% drop-off',
    'canvas.analytics.bottleneck': '⚠ Bottleneck',
    'canvas.analytics.sessions':   'Sessions',
    'canvas.analytics.completed':  'Completed',
    'canvas.analytics.converted':  'Converted',
    'canvas.analytics.rate':       '{{rate}}%',

    // ── Action Logs ───────────────────────────────────────────────────────────
    'nav.actionLogs':          'Action Logs',
    'actionLogs.pageTitle':    'Action Logs',
    'actionLogs.empty':        'No action logs yet.',
    'actionLogs.loadError':    'Failed to load action logs.',
    'actionLogs.filterAdapter': 'Adapter',
    'actionLogs.filterStatus':  'Status',
    'actionLogs.all':           'All',
    'actionLogs.sessionId':    'Session',
    'actionLogs.scenarioId':   'Scenario',
    'actionLogs.executedAt':   'Executed at',
    'actionLogs.error':        'Error',

    // ── Dashboard ────────────────────────────────────────────────────────────
    'nav.dashboard':                  'Dashboard',
    'dashboard.pageTitle':            'Dashboard',
    'dashboard.loadError':            'Failed to load dashboard.',
    'dashboard.sessions7d':           'Sessions (7d)',
    'dashboard.converted7d':          'Converted (7d)',
    'dashboard.conversionRate':       'Conversion Rate',
    'dashboard.activeSessions':       'Active Sessions',
    'dashboard.publishedScenarios':   'Published Scenarios',
    'dashboard.actionFailures24h':    'Action Failures (24h)',
    'dashboard.dailySessions':        'Daily Sessions (7d)',
    'dashboard.noData':               'No data yet.',
    'dashboard.failuresAlert':        '{{count}} action failure(s) in the last 24 hours.',

    // ── Sessions ─────────────────────────────────────────────────────────────
    'nav.sessions':              'Sessions',
    'sessions.pageTitle':        'Sessions',
    'sessions.empty':            'No sessions yet.',
    'sessions.loadError':        'Failed to load sessions.',
    'sessions.filterOutcome':    'Outcome',
    'sessions.filterConversion': 'Conversion',
    'sessions.all':              'All',
    'sessions.active':           'Active',
    'sessions.completed':        'Completed',
    'sessions.dropped':          'Dropped',
    'sessions.converted':        'Converted',
    'sessions.yes':              'Yes',
    'sessions.no':               'No',
    'sessions.scenarioId':       'Scenario',
    'sessions.startedAt':        'Started',
    'sessions.endedAt':          'Ended',
    'sessions.outcome':          'Outcome',
    'sessions.conversion':       'Conversion',
    'sessions.detail.title':     'Session Detail',
    'sessions.detail.variables': 'Collected Variables',
    'sessions.detail.messages':  'Messages',
    'sessions.detail.close':     'Close',
    'sessions.detail.loadError': 'Failed to load session detail.',

    // ── Settings ──────────────────────────────────────────────────────────────
    'settings.pageTitle':  'Settings',
    'settings.adminTheme': 'Admin Theme',

    // ── Theme ─────────────────────────────────────────────────────────────────
    'theme.toggleLight': 'Switch to light mode',
    'theme.toggleDark':  'Switch to dark mode',
    'theme.label':       'Theme',
} as const

/** Complete message catalog type — keys from the English source of truth, values are strings. */
export type MessageCatalog = { [K in keyof typeof en]: string }

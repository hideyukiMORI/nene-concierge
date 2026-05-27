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
    'nav.brand':       'NeNe Concierge',
    'nav.scenarios':   'Scenarios',
    'nav.appearance':  'Appearance',
    'nav.credentials': 'Action Credentials',
    'nav.logout':      'Log out',

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

    'node.conditionVar':         'Variable',
    'node.conditionVarPlaceholder': 'e.g. user_answer',
    'node.operator':             'Operator',
    'node.compareValue':         'Compare value',
    'node.compareValuePlaceholder': 'Value to compare',
    'node.conditionHint':        'Bottom handles: left = true / right = false',

    'node.actionType':    'Action type',
    'node.credential':    'Credential',
    'node.credentialNone': '— Select —',

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

    // ── Theme ─────────────────────────────────────────────────────────────────
    'theme.toggleLight': 'Switch to light mode',
    'theme.toggleDark':  'Switch to dark mode',
    'theme.label':       'Theme',
} as const

/** Complete message catalog type — keys from the English source of truth, values are strings. */
export type MessageCatalog = { [K in keyof typeof en]: string }

/* ══════════════════════════════════════════════════════════════
   Models — Factory functions for domain objects
   ══════════════════════════════════════════════════════════════ */
const Models = {

    /* ── Tunnel ── */
    createTunnel(id, description = '', products = []) {
        return {
            id,
            description,
            products,
            blocks: [
                { id: 'DEBUT', label: 'DEBUT', type: 'initial' },
            ],
            transitions: [],
        };
    },

    /* ── Block ── */
    createBlock(id, type, label = '') {
        const block = { id, label: label || id, type };
        if (type === 'formulaire' || type === 'tarif') {
            block.steps = [
                { id: 'DEBUT_ETAPES', label: 'DEBUT', type: 'initial' },
                { id: 'FIN_ETAPES', label: 'FIN', type: 'final' },
            ];
            block.stepTransitions = [
                { source: 'DEBUT_ETAPES', target: 'FIN_ETAPES', condition: '', order: 1 },
            ];
        }
        if (type === 'tarif') {
            block.schemaId = '';
        }
        if (type === 'trigger') {
            block.actions = [];
        }
        return block;
    },

    /* ── Trigger action (email / sms / cron / webhook / autre) ── */
    createTriggerAction(type) {
        const action = {
            id: 'act_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            type,
            label: '',
            timing: { mode: 'immediate', delay: 0, delayUnit: 'minutes', cron: '' },
            config: {},
        };
        if (type === 'email') {
            action.config = {
                recipientType: 'gestionnaire',
                customRecipient: '',
                subject: '',
                body: '',
            };
        } else if (type === 'sms') {
            action.config = {
                recipientType: 'etudiant',
                customRecipient: '',
                message: '',
            };
        } else if (type === 'cron') {
            action.config = { expression: '0 8 * * *', taskLabel: '' };
        } else if (type === 'webhook') {
            action.config = { url: '', method: 'POST', body: '' };
        } else {
            action.config = { description: '' };
        }
        return action;
    },

    /* ── Transition ── */
    createTransition(source, target, condition = '', order = 0) {
        return { source, target, condition, order };
    },

    /* ── Step (étape dans un bloc) ── */
    createStep(id, title = '') {
        return {
            id,
            title,
            intro: '',
            questions: [],
            helpTexts: [],
        };
    },

    /* ── Question ── */
    createQuestion(id, title, body, type = 'bool') {
        return {
            id,
            questionNb: id,
            title,
            body,
            type,
            resValues: type === 'bool' ? ['Oui', 'Non'] : [],
            order: 0,
        };
    },

    /* ── Schéma de calcul ── */
    createSchema(id, label = '', description = '', products = []) {
        return {
            id,
            label,
            description,
            products,
            nodes: [
                { id: 'ENTREE', label: 'ENTRÉE', type: 'initial' },
            ],
            transitions: [],
        };
    },

    /* ── Noeud de variable (dans un schéma) ── */
    createVariableNode(id, variableId, label = '') {
        return { id, variableId, label: label || id, type: 'variable' };
    },

    /* ── Noeud de formule (dans un schéma) ── */
    createFormulaNode(id, formulaId, label = '') {
        return { id, formulaId, label: label || id, type: 'formula' };
    },

    /* ── Formule tarifaire ── */
    createFormula(id, label = '', description = '') {
        return {
            id,
            label,
            description,
            prestations: [],
            isActive: true,
        };
    },

    /* ── Prestation (ligne d'une formule) ── */
    createPrestation(type, label, amount = 0, formula = '') {
        return { type, label, amount, formula };
    },

    /* ── Variable ── */
    createVariable(id, label, source, type = 'text') {
        return {
            id,
            label,
            source,
            type,
            description: '',
            values: [],
            usableInSchema: true,
            usableInFormula: false,
            mode: 'mock',
        };
    },

    /* ── Type helpers ── */
    BLOCK_TYPES: ['formulaire', 'tarif', 'paiement', 'information', 'upload', 'trigger'],

    BLOCK_ICONS: {
        initial: '▶',
        final: '■',
        formulaire: '📋',
        tarif: '💰',
        paiement: '💳',
        upload: '📎',
        information: 'ℹ️',
        trigger: '⚡',
    },

    /* ── Trigger helpers ── */
    TRIGGER_ACTION_TYPES: ['email', 'sms', 'cron', 'webhook', 'autre'],

    TRIGGER_ACTION_ICONS: {
        email: '✉️',
        sms: '💬',
        cron: '⏰',
        webhook: '🔗',
        autre: '⚙️',
    },

    TRIGGER_ACTION_LABELS: {
        email: 'Email',
        sms: 'SMS',
        cron: 'Tâche planifiée',
        webhook: 'Webhook',
        autre: 'Action personnalisée',
    },

    TRIGGER_TIMING_MODES: ['immediate', 'delayed', 'scheduled'],

    TRIGGER_TIMING_LABELS: {
        immediate: 'Immédiat',
        delayed: 'Différé',
        scheduled: 'Planifié (cron)',
    },

    TRIGGER_DELAY_UNITS: ['minutes', 'heures', 'jours'],

    TRIGGER_RECIPIENTS: [
        { id: 'gestionnaire', label: 'Gestionnaire (email par défaut)' },
        { id: 'etudiant', label: 'Étudiant' },
        { id: 'prof', label: 'Professeur' },
        { id: 'autre', label: 'Autre (personnalisé)' },
    ],

    /* Types d'étapes (à l'intérieur d'un bloc) :
       - step  : étape standard avec questions
       - tarif : étape de tarification (traitement spécial, dans un bloc tarif uniquement) */
    STEP_TYPES: ['step', 'tarif'],

    STEP_ICONS: {
        initial: '▶',
        final: '■',
        step: '📝',
        tarif: '💰',
    },

    VARIABLE_SOURCES: ['produit', 'dossier', 'reponse_etudiant', 'globale'],

    VARIABLE_TYPES: ['text', 'number', 'bool', 'select'],

    VARIABLE_MODES: ['mock', 'manuel', 'backend'],
};

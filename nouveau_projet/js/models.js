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
        return block;
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
    BLOCK_TYPES: ['formulaire', 'tarif', 'paiement', 'information', 'upload'],

    BLOCK_ICONS: {
        initial: '▶',
        final: '■',
        formulaire: '📋',
        tarif: '💰',
        paiement: '💳',
        upload: '📎',
        information: 'ℹ️',
    },

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

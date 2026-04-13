/* ══════════════════════════════════════════════════════════════
   Mock Data — Données d'exemple pour le développement
   Initialise le Store si vide
   ══════════════════════════════════════════════════════════════ */

const MOCK_TUNNELS = [
    {
        id: 'DN',
        description: 'Tunnel des dossiers nationaux — parcours standard L1/L2/L3 Droit',
        products: ['L1-DROIT', 'L2-DROIT', 'L3-DROIT'],
        blocks: [
            { id: 'DEBUT', label: 'DEBUT', type: 'initial' },
            { id: 'info_perso', label: 'Informations personnelles', type: 'formulaire',
                steps: [
                    { id: 'DEBUT_ETAPES', label: 'DEBUT', type: 'initial' },
                    { id: 'etape_identite', label: 'Identité', type: 'step', title: 'Identité de l\'étudiant', intro: 'Veuillez renseigner votre identité civile.', questions: [
                        { id: 'Q_NOM', questionNb: 'Q1', title: 'Nom', body: 'Votre nom de famille', type: 'text', resValues: [], order: 1 },
                        { id: 'Q_PRENOM', questionNb: 'Q2', title: 'Prénom', body: 'Votre prénom', type: 'text', resValues: [], order: 2 },
                        { id: 'Q_DDN', questionNb: 'Q3', title: 'Date de naissance', body: 'Votre date de naissance', type: 'date', resValues: [], order: 3 },
                    ], helpTexts: [] },
                    { id: 'etape_coordonnees', label: 'Coordonnées', type: 'step', title: 'Coordonnées de l\'étudiant', intro: 'Vos coordonnées postales et électroniques.', questions: [
                        { id: 'Q_EMAIL', questionNb: 'Q4', title: 'Email', body: 'Votre adresse email', type: 'email', resValues: [], order: 1 },
                        { id: 'Q_TEL', questionNb: 'Q5', title: 'Téléphone', body: 'Numéro de téléphone', type: 'tel', resValues: [], order: 2 },
                        { id: 'Q_ADRESSE', questionNb: 'Q6', title: 'Adresse', body: 'Adresse postale complète', type: 'text', resValues: [], order: 3 },
                    ], helpTexts: ['Utilisez une adresse email valide — elle servira pour les communications.'] },
                    { id: 'etape_situation', label: 'Situation', type: 'step', title: 'Situation académique', intro: 'Informations sur votre parcours académique.', questions: [
                        { id: 'Q_BAC', questionNb: 'Q7', title: 'Baccalauréat', body: 'Année d\'obtention du bac', type: 'number', resValues: [], order: 1 },
                        { id: 'Q_DERNIER_DIPLOME', questionNb: 'Q8', title: 'Dernier diplôme', body: 'Intitulé du dernier diplôme obtenu', type: 'text', resValues: [], order: 2 },
                    ], helpTexts: [] },
                    { id: 'FIN_ETAPES', label: 'FIN', type: 'final' },
                ],
                stepTransitions: [
                    { source: 'DEBUT_ETAPES', target: 'etape_identite', condition: '', order: 1 },
                    { source: 'etape_identite', target: 'etape_coordonnees', condition: '', order: 2 },
                    { source: 'etape_coordonnees', target: 'etape_situation', condition: '', order: 3 },
                    { source: 'etape_situation', target: 'FIN_ETAPES', condition: '', order: 4 },
                ],
            },
            { id: 'tarification', label: 'Tarification', type: 'tarif',
                steps: [
                    { id: 'DEBUT_ETAPES', label: 'DEBUT', type: 'initial' },
                    { id: 'etape_bourse', label: 'Bourse', type: 'step', title: 'Situation boursière', intro: 'Informations sur votre bourse.', questions: [
                        { id: 'Q_BOURSIER', questionNb: 'Q10', title: 'Boursier ?', body: 'Êtes-vous boursier ?', type: 'bool', resValues: ['Oui', 'Non'], order: 1 },
                    ], helpTexts: ['Munissez-vous de votre notification de bourse.'] },
                    { id: 'etape_nationalite', label: 'Nationalité', type: 'step', title: 'Nationalité', intro: 'Votre nationalité.', questions: [
                        { id: 'Q_NATIONALITE_UE', questionNb: 'Q11', title: 'Nationalité UE ?', body: 'Avez-vous la nationalité d\'un pays de l\'UE ?', type: 'bool', resValues: ['Oui', 'Non'], order: 1 },
                    ], helpTexts: [] },
                    { id: 'FIN_ETAPES', label: 'FIN', type: 'final' },
                ],
                stepTransitions: [
                    { source: 'DEBUT_ETAPES', target: 'etape_bourse', condition: '', order: 1 },
                    { source: 'etape_bourse', target: 'etape_nationalite', condition: 'Q_BOURSIER=Non', order: 2 },
                    { source: 'etape_bourse', target: 'FIN_ETAPES', condition: 'Q_BOURSIER=Oui', order: 3 },
                    { source: 'etape_nationalite', target: 'FIN_ETAPES', condition: '', order: 4 },
                ],
                schemaId: 'SCH_DN' },
            { id: 'documents', label: 'Upload documents', type: 'upload' },
            { id: 'paiement', label: 'Paiement en ligne', type: 'paiement' },
            { id: 'FIN', label: 'FIN', type: 'final' },
        ],
        transitions: [
            { source: 'DEBUT', target: 'info_perso', condition: '', order: 1 },
            { source: 'info_perso', target: 'tarification', condition: '', order: 2 },
            { source: 'tarification', target: 'documents', condition: '', order: 3 },
            { source: 'documents', target: 'paiement', condition: '', order: 4 },
            { source: 'paiement', target: 'FIN', condition: '', order: 5 },
        ],
    },
    {
        id: 'DGE',
        description: 'Tunnel grands établissements — Masters et formations spécialisées',
        products: ['MASTER-GE', 'MBA-GE'],
        blocks: [
            { id: 'DEBUT', label: 'DEBUT', type: 'initial' },
            { id: 'eligibilite', label: 'Vérification éligibilité', type: 'formulaire',
                steps: [
                    { id: 'DEBUT_ETAPES', label: 'DEBUT', type: 'initial' },
                    { id: 'etape_elig', label: 'Éligibilité', type: 'step', title: 'Critères d\'éligibilité', intro: 'Vérification de vos critères d\'admission.', questions: [
                        { id: 'Q_ELIGIBLE', questionNb: 'Q20', title: 'Eligible ?', body: 'Remplissez-vous les conditions d\'admission ?', type: 'bool', resValues: ['Oui', 'Non'], order: 1 },
                    ], helpTexts: [] },
                    { id: 'FIN_ETAPES', label: 'FIN', type: 'final' },
                ],
                stepTransitions: [
                    { source: 'DEBUT_ETAPES', target: 'etape_elig', condition: '', order: 1 },
                    { source: 'etape_elig', target: 'FIN_ETAPES', condition: '', order: 2 },
                ],
            },
            { id: 'infos', label: 'Informations complémentaires', type: 'information' },
            { id: 'tarif_ge', label: 'Tarification GE', type: 'tarif', steps: [], schemaId: 'SCH_GE' },
            { id: 'docs_ge', label: 'Documents spécifiques', type: 'upload' },
            { id: 'paiement_ge', label: 'Paiement', type: 'paiement' },
            { id: 'FIN', label: 'FIN', type: 'final' },
        ],
        transitions: [
            { source: 'DEBUT', target: 'eligibilite', condition: '', order: 1 },
            { source: 'eligibilite', target: 'infos', condition: 'eligible=Oui', order: 2 },
            { source: 'eligibilite', target: 'FIN', condition: 'eligible=Non', order: 3 },
            { source: 'infos', target: 'tarif_ge', condition: '', order: 4 },
            { source: 'tarif_ge', target: 'docs_ge', condition: '', order: 5 },
            { source: 'docs_ge', target: 'paiement_ge', condition: '', order: 6 },
            { source: 'paiement_ge', target: 'FIN', condition: '', order: 7 },
        ],
    },
];

const MOCK_SCHEMAS = [
    {
        id: 'SCH_DN',
        label: 'Schéma Droit National',
        description: 'Détermine la formule tarifaire pour les formations nationales de Droit',
        products: ['L1-DROIT', 'L2-DROIT', 'L3-DROIT'],
        nodes: [
            { id: 'ENTREE', label: 'ENTRÉE', type: 'initial' },
            { id: 'v_boursier', label: 'Boursier ?', type: 'variable', variableId: 'VAR_BOURSIER' },
            { id: 'v_nationalite', label: 'Nationalité UE ?', type: 'variable', variableId: 'VAR_NATIONALITE' },
            { id: 'f_standard', label: 'Formule Standard', type: 'formula', formulaId: 'FORM_STD' },
            { id: 'f_boursier', label: 'Formule Boursier', type: 'formula', formulaId: 'FORM_BOURS' },
            { id: 'f_inter', label: 'Formule International', type: 'formula', formulaId: 'FORM_INTER' },
        ],
        transitions: [
            { source: 'ENTREE', target: 'v_boursier', condition: '', order: 1 },
            { source: 'v_boursier', target: 'f_boursier', condition: 'Oui', order: 2 },
            { source: 'v_boursier', target: 'v_nationalite', condition: 'Non', order: 3 },
            { source: 'v_nationalite', target: 'f_standard', condition: 'Oui', order: 4 },
            { source: 'v_nationalite', target: 'f_inter', condition: 'Non', order: 5 },
        ],
    },
    {
        id: 'SCH_GE',
        label: 'Schéma Grands Établissements',
        description: 'Détermine la formule tarifaire pour les formations GE',
        products: ['MASTER-GE', 'MBA-GE'],
        nodes: [
            { id: 'ENTREE', label: 'ENTRÉE', type: 'initial' },
            { id: 'v_formation', label: 'Type formation', type: 'variable', variableId: 'VAR_TYPE_FORM' },
            { id: 'f_master', label: 'Formule Master', type: 'formula', formulaId: 'FORM_MASTER' },
            { id: 'f_mba', label: 'Formule MBA', type: 'formula', formulaId: 'FORM_MBA' },
        ],
        transitions: [
            { source: 'ENTREE', target: 'v_formation', condition: '', order: 1 },
            { source: 'v_formation', target: 'f_master', condition: 'Master', order: 2 },
            { source: 'v_formation', target: 'f_mba', condition: 'MBA', order: 3 },
        ],
    },
];

const MOCK_FORMULAS = [
    {
        id: 'FORM_STD',
        label: 'Formule Standard',
        description: 'Tarif national standard pour étudiants français/UE',
        isActive: true,
        prestations: [
            { type: 'pedagogie', label: 'Droits pédagogiques', amount: 170, formula: '' },
            { type: 'bu', label: 'BU', amount: 34, formula: 'GLOB_BU' },
            { type: 'crio', label: 'CRIO', amount: 92, formula: 'GLOB_CRIO' },
        ],
    },
    {
        id: 'FORM_BOURS',
        label: 'Formule Boursier',
        description: 'Tarif exonéré pour les boursiers',
        isActive: true,
        prestations: [
            { type: 'pedagogie', label: 'Droits pédagogiques', amount: 0, formula: '' },
            { type: 'bu', label: 'BU', amount: 0, formula: '' },
            { type: 'crio', label: 'CRIO', amount: 0, formula: '' },
        ],
    },
    {
        id: 'FORM_INTER',
        label: 'Formule International',
        description: 'Tarif pour étudiants hors UE',
        isActive: true,
        prestations: [
            { type: 'pedagogie', label: 'Droits pédagogiques', amount: 2770, formula: '' },
            { type: 'bu', label: 'BU', amount: 34, formula: 'GLOB_BU' },
            { type: 'crio', label: 'CRIO', amount: 92, formula: 'GLOB_CRIO' },
            { type: 'transfert', label: 'Frais de transfert', amount: 23, formula: 'GLOB_TRANSFERT' },
        ],
    },
    {
        id: 'FORM_MASTER',
        label: 'Formule Master GE',
        description: 'Tarif Master grands établissements',
        isActive: true,
        prestations: [
            { type: 'pedagogie', label: 'Droits pédagogiques', amount: 243, formula: '' },
            { type: 'bu', label: 'BU', amount: 34, formula: 'GLOB_BU' },
        ],
    },
    {
        id: 'FORM_MBA',
        label: 'Formule MBA',
        description: 'Tarif MBA spécialisé',
        isActive: false,
        prestations: [
            { type: 'pedagogie', label: 'Frais de scolarité', amount: 8500, formula: '' },
        ],
    },
];

const MOCK_VARIABLES = [
    { id: 'VAR_BOURSIER', label: 'Boursier', source: 'reponse_etudiant', type: 'bool', description: "L'étudiant est-il boursier ?", values: ['Oui', 'Non'], usableInSchema: true, usableInFormula: false, mode: 'mock' },
    { id: 'VAR_NATIONALITE', label: 'Nationalité UE', source: 'dossier', type: 'bool', description: "L'étudiant a-t-il la nationalité d'un pays UE ?", values: ['Oui', 'Non'], usableInSchema: true, usableInFormula: false, mode: 'mock' },
    { id: 'VAR_TYPE_FORM', label: 'Type de formation', source: 'produit', type: 'select', description: 'Type de la formation (Master, MBA...)', values: ['Master', 'MBA', 'DU'], usableInSchema: true, usableInFormula: false, mode: 'mock' },
    { id: 'VAR_DOUBLE_NAT', label: 'Double nationalité', source: 'reponse_etudiant', type: 'bool', description: "L'étudiant a-t-il une double nationalité ?", values: ['Oui', 'Non'], usableInSchema: true, usableInFormula: false, mode: 'mock' },
    { id: 'VAR_SITUATION', label: 'Situation particulière', source: 'reponse_etudiant', type: 'select', description: 'Situation administrative particulière', values: ['Standard', 'Handicap', 'Sportif HN', 'Réfugié'], usableInSchema: true, usableInFormula: false, mode: 'mock' },
    { id: 'GLOB_BU', label: 'Droit BU', source: 'globale', type: 'number', description: 'Montant des droits de bibliothèque universitaire', values: ['34'], usableInSchema: false, usableInFormula: true, mode: 'mock' },
    { id: 'GLOB_CRIO', label: 'Droit CRIO', source: 'globale', type: 'number', description: 'Contribution vie étudiante et de campus', values: ['92'], usableInSchema: false, usableInFormula: true, mode: 'mock' },
    { id: 'GLOB_TRANSFERT', label: 'Frais de transfert', source: 'globale', type: 'number', description: 'Frais de transfert de dossier', values: ['23'], usableInSchema: false, usableInFormula: true, mode: 'mock' },
];

// Initialisation du store
// Force le rechargement des données mock (dev mode)
// Passer ?reset dans l'URL pour réinitialiser les données
if (window.location.search.includes('reset')) {
    Store.save('tunnels', MOCK_TUNNELS);
    Store.save('schemas', MOCK_SCHEMAS);
    Store.save('formulas', MOCK_FORMULAS);
    Store.save('variables', MOCK_VARIABLES);
    console.log('[Studio] Données mock rechargées (reset)');
    // Clean URL
    history.replaceState(null, '', window.location.pathname + window.location.hash);
} else {
    Store.initIfEmpty('tunnels', MOCK_TUNNELS);
    Store.initIfEmpty('schemas', MOCK_SCHEMAS);
    Store.initIfEmpty('formulas', MOCK_FORMULAS);
    Store.initIfEmpty('variables', MOCK_VARIABLES);
}

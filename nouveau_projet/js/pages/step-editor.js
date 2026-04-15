/* ══════════════════════════════════════════════════════════════
   Page — Éditeur visuel d'étapes d'un bloc (Mermaid interactive)
   Route: #step-editor/TUNNEL_ID/BLOCK_ID
   ══════════════════════════════════════════════════════════════ */
const StepEditorPage = {

    _tunnel: null,
    _block: null,

    render($container, params) {
        const tunnelId = params && params[0];
        const blockId  = params && params[1];
        this._tunnel = Store.findById('tunnels', tunnelId);
        if (!this._tunnel) { navigate('#tunnels'); return; }

        this._block = this._tunnel.blocks.find(b => b.id === blockId);
        if (!this._block || (!this._block.steps)) { navigate('#tunnel-editor/' + tunnelId); return; }

        // Ensure stepTransitions array
        if (!this._block.stepTransitions) this._block.stepTransitions = [];

        // Ensure DEBUT / FIN étapes exist
        if (!this._block.steps.find(s => s.type === 'initial')) {
            this._block.steps.unshift({ id: 'DEBUT_ETAPES', label: 'DEBUT', type: 'initial' });
        }
        if (!this._block.steps.find(s => s.type === 'final')) {
            this._block.steps.push({ id: 'FIN_ETAPES', label: 'FIN', type: 'final' });
        }

        const stepCount = this._block.steps.filter(s => s.type === 'step').length;

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <button class="back-btn" id="back-to-tunnel" title="Retour au tunnel">←</button>
                    <div>
                        <h1 class="page-title">${escHtml(this._block.label)}</h1>
                        <p class="page-subtitle">Étapes du bloc ${typeBadge(this._block.type)} — Tunnel ${escHtml(this._tunnel.id)} · ${stepCount} étape${stepCount > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-sm btn-light" id="export-step-png-btn" title="Exporter le diagramme en PNG">↓ Exporter PNG</button>
                    <button class="btn btn-sm btn-light" id="add-step-btn">+ Ajouter une étape</button>
                </div>
            </div>
            <div class="mermaid-container">
                <div id="steps-mermaid-preview"></div>
            </div>
        `);

        this._bindEvents();
        this._renderDiagram();
    },

    /* ════════════════════════════════════════
       Mermaid: convertir les étapes en graph
       ════════════════════════════════════════ */
    _toMermaid() {
        const block = this._block;
        let m = '---\nconfig:\n    layout: elk\n---\ngraph TD\n';
        m += '    classDef initial fill:#bfe2ef,stroke:#6accee,color:#1a6d8a;\n';
        m += '    classDef final fill:#c4eac6,stroke:#65ae6a,color:#2d5e30;\n';
        m += '    classDef step fill:#E0EAFF,stroke:#3B5BDB,color:#2b3d91;\n';
        m += '    classDef tarif fill:#FFF3E0,stroke:#E8590C,color:#a13d06;\n\n';

        block.steps.forEach(s => {
            if (s.type === 'initial') {
                m += `    ${s.id}(("▶ ${s.label}"))\n`;
            } else if (s.type === 'final') {
                m += `    ${s.id}["■ ${s.label}"]\n`;
            } else {
                const icon = s.type === 'tarif' ? '💰' : '📝';
                const qCount = (s.questions || []).length;
                const qInfo = qCount > 0 ? `<br/>${qCount} question${qCount > 1 ? 's' : ''}` : '';
                m += `    ${s.id}["${icon} ${s.label}${qInfo}"]\n`;
            }
        });

        m += '\n';
        const sorted = [...(block.stepTransitions || [])].sort((a, b) => a.order - b.order);
        sorted.forEach(tr => {
            if (tr.condition) {
                m += `    ${tr.source} -- "${tr.condition}" --> ${tr.target}\n`;
            } else {
                m += `    ${tr.source} --> ${tr.target}\n`;
            }
        });

        m += '\n';
        block.steps.forEach(s => {
            // step et tarif ont leur propre classDef ; initial/final restent inchangés
            const cls = (s.type === 'step' || s.type === 'tarif') ? s.type : s.type;
            m += `    class ${s.id} ${cls}\n`;
        });

        return m;
    },

    async _renderDiagram() {
        const mermaidStr = this._toMermaid();
        console.log('[StepEditor] _renderDiagram called, graphEngine:', !!window.graphEngine);
        const self = this;
        if (window.graphEngine) {
            await window.graphEngine.render('#steps-mermaid-preview', mermaidStr, function (nodeId) {
                console.log('[StepEditor] Node clicked:', nodeId);
                const step = self._block.steps.find(s => s.id === nodeId);
                if (step) self._openStepModal(step);
            });
        }
    },

    _save() {
        Store.upsert('tunnels', this._tunnel);
        this._renderDiagram();
    },

    _bindEvents() {
        const self = this;
        $('#back-to-tunnel').off('click').on('click', () => navigate('#tunnel-editor/' + self._tunnel.id));
        $('#export-step-png-btn').off('click').on('click', () => {
            exportMermaidPng('#steps-mermaid-preview', `steps-${self._tunnel.id}-${self._block.id}`);
        });
        $('#add-step-btn').off('click').on('click', () => self._openAddStepModal());
    },

    /* ════════════════════════════════════════
       Modal — Gérer une étape existante
       ════════════════════════════════════════ */
    _openStepModal(step) {
        const self = this;
        const block = this._block;
        const isSpecial = step.type === 'initial' || step.type === 'final';

        const outTransitions = (block.stepTransitions || []).filter(tr => tr.source === step.id);
        const possibleTargets = block.steps.filter(s => s.id !== step.id);
        const questions = step.questions || [];
        const helpTexts = step.helpTexts || [];

        // ── Transitions HTML ──
        const transHtml = outTransitions.length > 0
            ? outTransitions.map((tr, i) => `
                <div class="list-row div-condition" data-idx="${i}">
                    <div class="condition-main">
                        <span class="condition-str">${escHtml(tr.condition) || '<em style="color:var(--muted-2)">sans condition</em>'}</span>
                        <span class="condition-arrow">→</span>
                        <select class="select-target step-select-target" data-idx="${i}">
                            ${possibleTargets.map(s => `<option value="${s.id}" ${s.id === tr.target ? 'selected' : ''}>${s.label || s.id}</option>`).join('')}
                        </select>
                    </div>
                    <div class="condition-actions">
                        <button class="action-btn step-edit-cond-btn" data-idx="${i}" title="Modifier">✎</button>
                        <button class="action-btn danger step-del-cond-btn" data-idx="${i}" title="Supprimer">✕</button>
                    </div>
                </div>
            `).join('')
            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune transition</p>';

        // ── Questions HTML ──
        const questionsHtml = questions.length > 0
            ? questions.map((q, i) => `
                <div class="list-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;" data-qidx="${i}">
                    <div style="flex:1;min-width:0;">
                        <strong style="font-size:13px;">${escHtml(q.questionNb || q.id)}</strong>
                        <span style="margin-left:6px;font-size:13px;">${escHtml(q.title)}</span>
                        <span style="margin-left:6px;font-size:12px;color:var(--muted);">(${q.type})</span>
                        ${q.resValues && q.resValues.length > 0 ? `<span style="margin-left:6px;font-size:11px;color:var(--muted-2);">[${q.resValues.join(', ')}]</span>` : ''}
                    </div>
                    <div class="condition-actions">
                        <button class="action-btn step-edit-q-btn" data-qidx="${i}" title="Modifier">✎</button>
                        <button class="action-btn danger step-del-q-btn" data-qidx="${i}" title="Supprimer">✕</button>
                    </div>
                </div>
            `).join('')
            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune question</p>';

        const currentHelpText = (helpTexts && helpTexts.length > 0) ? helpTexts[0] : '';

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <div class="header-top">
                    <div>
                        <h2 class="modal-title">${escHtml(step.id)}</h2>
                        <p class="modal-subtitle">${typeBadge(step.type || 'step')} ${escHtml(step.label)}</p>
                    </div>
                </div>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
                ${!isSpecial ? `
                <div class="form-row">
                    <div class="form-group">
                        <label>Label</label>
                        <input type="text" id="step-label-input" value="${escHtml(step.label)}" />
                    </div>
                    <div class="form-group">
                        <label>Titre</label>
                        <input type="text" id="step-title-input" value="${escHtml(step.title || '')}" />
                    </div>
                </div>
                ${block.type === 'tarif' ? `
                <div class="form-group">
                    <label>Type d'étape</label>
                    <div class="radio-group">
                        <label><input type="radio" name="step-type-input" value="step" ${step.type === 'step' ? 'checked' : ''} /><span>📝 Étape standard</span></label>
                        <label><input type="radio" name="step-type-input" value="tarif" ${step.type === 'tarif' ? 'checked' : ''} /><span>💰 Étape tarif (traitement spécial)</span></label>
                    </div>
                    <span class="form-hint">Les étapes tarif sont liées au schéma de calcul du bloc.</span>
                </div>` : ''}
                <div class="form-row">
                    <div class="form-group">
                        <label>Texte d'introduction</label>
                        <textarea id="step-intro-input" rows="2">${escHtml(step.intro || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Texte d'aide</label>
                        <textarea id="step-help-input" rows="2" placeholder="Indication affichée pour guider l'étudiant…">${escHtml(currentHelpText)}</textarea>
                    </div>
                </div>

                <div class="two-col">
                    <div class="panel">
                        <div class="panel-header">
                            <div>
                                <h3 class="panel-title">Questions</h3>
                                <p class="panel-subtitle">${questions.length} question${questions.length > 1 ? 's' : ''}</p>
                            </div>
                            <button class="btn btn-sm btn-light" id="step-add-q-btn">+ Ajouter</button>
                        </div>
                        <div class="panel-body" id="step-questions-list">
                            ${questionsHtml}
                        </div>
                    </div>

                    <div class="panel">
                        <div class="panel-header">
                            <div>
                                <h3 class="panel-title">Transitions sortantes</h3>
                                <p class="panel-subtitle">${outTransitions.length} transition${outTransitions.length > 1 ? 's' : ''}</p>
                            </div>
                            <button class="btn btn-sm btn-light" id="step-add-trans-btn">+ Ajouter</button>
                        </div>
                        <div class="panel-body" id="step-transitions-list">
                            ${transHtml}
                        </div>
                    </div>
                </div>` : `
                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title">Transitions sortantes</h3>
                            <p class="panel-subtitle">${outTransitions.length} transition${outTransitions.length > 1 ? 's' : ''}</p>
                        </div>
                        <button class="btn btn-sm btn-light" id="step-add-trans-btn">+ Ajouter</button>
                    </div>
                    <div class="panel-body" id="step-transitions-list">
                        ${transHtml}
                    </div>
                </div>`}
            </div>
            <div class="modal-footer">
                <div class="modal-footer-left">
                    ${!isSpecial ? `<button class="btn btn-danger" id="step-del-btn">Supprimer l'étape</button>` : ''}
                </div>
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="step-save-btn">Enregistrer</button>
            </div>
        `, { wide: true });

        // ── Bind ──
        this._bindStepModalEvents(step, outTransitions, possibleTargets, questions);
    },

    _bindStepModalEvents(step, outTransitions, possibleTargets, questions) {
        const self = this;
        const block = this._block;
        const isSpecial = step.type === 'initial' || step.type === 'final';

        // Save
        $('#step-save-btn').on('click', () => {
            if (!isSpecial) {
                step.label = $('#step-label-input').val().trim() || step.id;
                step.title = $('#step-title-input').val().trim();
                step.intro = $('#step-intro-input').val().trim();
                if (block.type === 'tarif') {
                    const newType = $('input[name="step-type-input"]:checked').val();
                    if (newType === 'step' || newType === 'tarif') step.type = newType;
                }
                const helpVal = $('#step-help-input').val().trim();
                step.helpTexts = helpVal ? [helpVal] : [];
            }
            // Update transition targets
            $('#step-transitions-list .step-select-target').each(function () {
                const idx = parseInt($(this).data('idx'));
                if (outTransitions[idx]) outTransitions[idx].target = $(this).val();
            });
            closeModal();
            self._save();
        });

        // Delete step
        $('#step-del-btn').on('click', () => {
            confirmAction('Supprimer l\'étape', `Supprimer « ${step.id} » et ses transitions ?`, () => {
                block.steps = block.steps.filter(s => s.id !== step.id);
                block.stepTransitions = (block.stepTransitions || []).filter(tr => tr.source !== step.id && tr.target !== step.id);
                closeModal();
                self._save();
            });
        });

        // ── Transitions ──
        $('#step-add-trans-btn').on('click', () => {
            const first = possibleTargets[0];
            if (!first) return;
            const newOrder = (block.stepTransitions || []).length > 0
                ? Math.max(...block.stepTransitions.map(t => t.order)) + 1 : 1;
            block.stepTransitions.push(Models.createTransition(step.id, first.id, '', newOrder));
            closeModal();
            self._save();
            self._openStepModal(step);
        });

        $(document).off('click.stepeditcond').on('click.stepeditcond', '.step-edit-cond-btn', function () {
            const idx = parseInt($(this).data('idx'));
            const trans = outTransitions[idx];
            if (trans) self._openStepConditionModal(trans, step);
        });

        $(document).off('click.stepdelcond').on('click.stepdelcond', '.step-del-cond-btn', function () {
            const idx = parseInt($(this).data('idx'));
            const trans = outTransitions[idx];
            if (trans) {
                const tIdx = block.stepTransitions.indexOf(trans);
                if (tIdx >= 0) block.stepTransitions.splice(tIdx, 1);
                closeModal();
                self._save();
                self._openStepModal(step);
            }
        });

        // ── Questions ──
        $('#step-add-q-btn').on('click', () => {
            self._openQuestionModal(step, null);
        });

        $(document).off('click.stepeditq').on('click.stepeditq', '.step-edit-q-btn', function () {
            const idx = parseInt($(this).data('qidx'));
            if (questions[idx]) self._openQuestionModal(step, questions[idx]);
        });

        $(document).off('click.stepdelq').on('click.stepdelq', '.step-del-q-btn', function () {
            const idx = parseInt($(this).data('qidx'));
            questions.splice(idx, 1);
            step.questions = questions;
            closeModal();
            self._save();
            self._openStepModal(step);
        });

    },

    /* ════════════════════════════════════════
       Modal 2 — Condition d'une transition
       ════════════════════════════════════════ */
    _openStepConditionModal(transition, step) {
        const self = this;
        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Condition de transition</h2>
                <p class="modal-subtitle">Depuis <strong>${escHtml(step.id)}</strong> vers <strong>${escHtml(transition.target)}</strong></p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Expression</label>
                    <input type="text" id="step-cond-expr" value="${escHtml(transition.condition)}" placeholder="ex: Q_BOURSIER=Oui" />
                    <span class="form-hint">Vide = transition inconditionnelle. Utilisez ID_QUESTION=Valeur.</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
                <button class="btn btn-primary" id="step-save-cond-btn">Enregistrer</button>
            </div>
        `);

        $('#step-save-cond-btn').on('click', () => {
            transition.condition = $('#step-cond-expr').val().trim();
            closeModal2();
            closeModal();
            self._save();
            const fresh = self._block.steps.find(s => s.id === step.id);
            if (fresh) self._openStepModal(fresh);
        });
    },

    /* ════════════════════════════════════════
       Modal 2 — Ajouter/modifier une question
       ════════════════════════════════════════ */
    _openQuestionModal(step, existing) {
        const self = this;
        const isEdit = !!existing;
        const qTypes = ['text', 'number', 'bool', 'select', 'date', 'email', 'tel', 'textarea'];

        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? 'Modifier la question' : 'Nouvelle question'}</h2>
                <p class="modal-subtitle">Étape : ${escHtml(step.label)}</p>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Identifiant</label>
                        <input type="text" id="q-id" value="${isEdit ? escHtml(existing.id) : ''}" ${isEdit ? 'readonly style="opacity:0.6"' : ''} placeholder="ex: Q_NOM" />
                    </div>
                    <div class="form-group">
                        <label>N° question</label>
                        <input type="text" id="q-nb" value="${isEdit ? escHtml(existing.questionNb || '') : ''}" placeholder="ex: Q1" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="q-title" value="${isEdit ? escHtml(existing.title) : ''}" placeholder="Titre de la question" />
                </div>
                <div class="form-group">
                    <label>Corps / libellé complet</label>
                    <textarea id="q-body" rows="2">${isEdit ? escHtml(existing.body) : ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Type</label>
                        <select id="q-type">
                            ${qTypes.map(t => `<option value="${t}" ${isEdit && existing.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Valeurs de réponse (séparées par ,)</label>
                        <input type="text" id="q-values" value="${isEdit && existing.resValues ? existing.resValues.join(', ') : ''}" placeholder="Oui, Non" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
                <button class="btn btn-primary" id="q-save-btn">Enregistrer</button>
            </div>
        `);

        $('#q-save-btn').on('click', () => {
            const id = $('#q-id').val().trim();
            if (!id) { $('#q-id').focus(); return; }

            const data = {
                id,
                questionNb: $('#q-nb').val().trim() || id,
                title: $('#q-title').val().trim(),
                body: $('#q-body').val().trim(),
                type: $('#q-type').val(),
                resValues: $('#q-values').val().split(',').map(s => s.trim()).filter(Boolean),
                order: isEdit ? existing.order : (step.questions || []).length + 1,
            };

            if (isEdit) {
                Object.assign(existing, data);
            } else {
                if (!step.questions) step.questions = [];
                if (step.questions.some(q => q.id === id)) {
                    alert('Une question avec cet ID existe déjà dans cette étape.');
                    return;
                }
                step.questions.push(data);
            }

            closeModal2();
            closeModal();
            self._save();
            const fresh = self._block.steps.find(s => s.id === step.id);
            if (fresh) self._openStepModal(fresh);
        });
    },

    /* ════════════════════════════════════════
       Modal 2 — Ajouter un texte d'aide
       ════════════════════════════════════════ */
    _openHelpTextModal(step) {
        const self = this;
        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Ajouter un texte d'aide</h2>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Texte d'aide / explication</label>
                    <textarea id="help-text-input" rows="3" placeholder="Texte affiché pour guider l'étudiant..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
                <button class="btn btn-primary" id="help-save-btn">Ajouter</button>
            </div>
        `);

        $('#help-save-btn').on('click', () => {
            const txt = $('#help-text-input').val().trim();
            if (!txt) return;
            if (!step.helpTexts) step.helpTexts = [];
            step.helpTexts.push(txt);
            closeModal2();
            closeModal();
            self._save();
            const fresh = self._block.steps.find(s => s.id === step.id);
            if (fresh) self._openStepModal(fresh);
        });
    },

    /* ════════════════════════════════════════
       Modal — Ajouter une nouvelle étape
       ════════════════════════════════════════ */
    _openAddStepModal() {
        const self = this;
        const blockIsTarif = self._block.type === 'tarif';

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Ajouter une étape</h2>
                <p class="modal-subtitle">Nouvelle étape dans le bloc « ${escHtml(self._block.label)} »</p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Identifiant</label>
                    <input type="text" id="new-step-id" placeholder="ex: etape_identite" />
                </div>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="new-step-label" placeholder="Nom affiché" />
                </div>
                ${blockIsTarif ? `
                <div class="form-group">
                    <label>Type d'étape</label>
                    <div class="radio-group">
                        <label><input type="radio" name="new-step-type" value="step" checked /><span>📝 Étape standard (questions)</span></label>
                        <label><input type="radio" name="new-step-type" value="tarif" /><span>💰 Étape tarif (traitement spécial)</span></label>
                    </div>
                    <span class="form-hint">Les étapes tarif alimentent le schéma de calcul associé au bloc.</span>
                </div>` : ''}
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="new-step-title" placeholder="Titre de l'étape" />
                </div>
                <div class="form-group">
                    <label>Texte d'introduction (optionnel)</label>
                    <textarea id="new-step-intro" rows="2"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="create-step-btn">Créer l'étape</button>
            </div>
        `);

        $('#create-step-btn').on('click', () => {
            const id = $('#new-step-id').val().trim();
            const label = $('#new-step-label').val().trim();
            if (!id) { $('#new-step-id').focus(); return; }
            if (self._block.steps.some(s => s.id === id)) {
                alert('Une étape avec cet identifiant existe déjà.');
                return;
            }

            const stepType = blockIsTarif ? ($('input[name="new-step-type"]:checked').val() || 'step') : 'step';

            const newStep = {
                id,
                label: label || id,
                type: stepType,
                title: $('#new-step-title').val().trim(),
                intro: $('#new-step-intro').val().trim(),
                questions: [],
                helpTexts: [],
            };

            // Insert before FIN_ETAPES
            const finIdx = self._block.steps.findIndex(s => s.type === 'final');
            if (finIdx >= 0) {
                self._block.steps.splice(finIdx, 0, newStep);
            } else {
                self._block.steps.push(newStep);
            }

            closeModal();
            self._save();
        });
    },
};

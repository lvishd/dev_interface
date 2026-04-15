/* ══════════════════════════════════════════════════════════════
   Page — Éditeur visuel d'un tunnel (Mermaid interactive)
   ══════════════════════════════════════════════════════════════ */
const TunnelEditorPage = {

    _tunnel: null,

    render($container, params) {
        const tunnelId = params && params[0];
        this._tunnel = Store.findById('tunnels', tunnelId);
        if (!this._tunnel) { navigate('#tunnels'); return; }

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <button class="back-btn" id="back-to-tunnels" title="Retour">←</button>
                    <div>
                        <h1 class="page-title">${escHtml(this._tunnel.id)}</h1>
                        <p class="page-subtitle">${escHtml(this._tunnel.description)}</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-sm btn-light" id="export-tunnel-png-btn" title="Exporter le diagramme en PNG">↓ Exporter PNG</button>
                    <button class="btn btn-sm btn-light" id="add-block-btn">+ Ajouter un bloc</button>
                </div>
            </div>
            <div class="mermaid-container">
                <div id="mermaid-preview"></div>
            </div>
        `);

        this._bindEvents();
        this._renderDiagram();
    },

    /* ── Mermaid conversion ── */
    _toMermaid() {
        const t = this._tunnel;
        let m = '---\nconfig:\n    layout: elk\n---\ngraph TD\n';
        m += '    classDef initial fill:#bfe2ef,stroke:#6accee,color:#1a6d8a;\n';
        m += '    classDef final fill:#c4eac6,stroke:#65ae6a,color:#2d5e30;\n';
        m += '    classDef formulaire fill:#E0EAFF,stroke:#3B5BDB,color:#2b3d91;\n';
        m += '    classDef tarif fill:#FFF3E0,stroke:#E8590C,color:#a13d06;\n';
        m += '    classDef paiement fill:#F3E8FF,stroke:#7C3AED,color:#5623a7;\n';
        m += '    classDef upload fill:#E8F5E9,stroke:#2E7D32,color:#1b5e20;\n';
        m += '    classDef information fill:#FFF9C4,stroke:#F59E0B,color:#92610a;\n';
        m += '    classDef trigger fill:#FEF3C7,stroke:#D97706,color:#92400E;\n\n';

        t.blocks.forEach(b => {
            const icon = Models.BLOCK_ICONS[b.type] || '';
            const label = b.label || b.id;
            if (b.type === 'initial')      m += `    ${b.id}(("${icon} ${label}"))\n`;
            else if (b.type === 'final')   m += `    ${b.id}["${icon} ${label}"]\n`;
            else                           m += `    ${b.id}["${icon} ${label}"]\n`;
        });

        m += '\n';
        const sorted = [...t.transitions].sort((a, b) => a.order - b.order);
        sorted.forEach(tr => {
            if (tr.condition) {
                m += `    ${tr.source} -- "${tr.condition}" --> ${tr.target}\n`;
            } else {
                m += `    ${tr.source} --> ${tr.target}\n`;
            }
        });

        m += '\n';
        t.blocks.forEach(b => {
            m += `    class ${b.id} ${b.type}\n`;
        });
        return m;
    },

    /* ── Render diagram ── */
    async _renderDiagram() {
        const mermaidStr = this._toMermaid();
        console.log('[TunnelEditor] _renderDiagram called, graphEngine:', !!window.graphEngine);
        console.log('[TunnelEditor] Mermaid string (first 300 chars):', mermaidStr.substring(0, 300));
        const self = this;
        if (window.graphEngine) {
            await window.graphEngine.render('#mermaid-preview', mermaidStr, function (nodeId) {
                console.log('[TunnelEditor] Node clicked:', nodeId);
                const block = self._tunnel.blocks.find(b => b.id === nodeId);
                if (block) self._openBlockModal(block);
                else console.warn('[TunnelEditor] Block not found for nodeId:', nodeId);
            });
        } else {
            console.error('[TunnelEditor] window.graphEngine is NOT available!');
        }
    },

    /* ── Save + refresh ── */
    _save() {
        Store.upsert('tunnels', this._tunnel);
        this._renderDiagram();
    },

    /* ── Events ── */
    _bindEvents() {
        const self = this;

        $('#back-to-tunnels').off('click').on('click', () => navigate('#tunnels'));

        $('#export-tunnel-png-btn').off('click').on('click', () => {
            exportMermaidPng('#mermaid-preview', `tunnel-${self._tunnel.id}`);
        });

        $('#add-block-btn').off('click').on('click', () => self._openAddBlockModal());
    },

    /* ══════════════════════════════════════════
       Modal — Gérer un bloc existant
       ══════════════════════════════════════════ */
    _openBlockModal(block) {
        const self = this;
        const tunnel = this._tunnel;
        const isSpecial = block.type === 'initial' || block.type === 'final';
        const hasSteps = block.type === 'formulaire' || block.type === 'tarif';
        const isTarif  = block.type === 'tarif';
        const isTrigger = block.type === 'trigger';
        if (isTrigger && !Array.isArray(block.actions)) block.actions = [];

        // Transitions from this block
        const outTransitions = tunnel.transitions.filter(tr => tr.source === block.id);
        const possibleTargets = tunnel.blocks.filter(b => b.id !== block.id);

        const transitionsHtml = outTransitions.length > 0
            ? outTransitions.map((tr, i) => `
                <div class="list-row div-condition" data-idx="${i}">
                    <div class="condition-main">
                        <span class="condition-str" title="Condition">${escHtml(tr.condition) || '<em style="color:var(--muted-2)">sans condition</em>'}</span>
                        <span class="condition-arrow">→</span>
                        <select class="select-target" data-idx="${i}">
                            ${possibleTargets.map(b => `<option value="${b.id}" ${b.id === tr.target ? 'selected' : ''}>${b.id}</option>`).join('')}
                        </select>
                    </div>
                    <div class="condition-actions">
                        <button class="action-btn edit-cond-btn" data-idx="${i}" title="Modifier la condition">✎</button>
                        <button class="action-btn danger del-cond-btn" data-idx="${i}" title="Supprimer">✕</button>
                    </div>
                </div>
            `).join('')
            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune transition sortante</p>';

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <div class="header-top">
                    <div>
                        <h2 class="modal-title">${escHtml(block.id)}</h2>
                        <p class="modal-subtitle">${typeBadge(block.type)} ${escHtml(block.label)}</p>
                    </div>
                </div>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
                ${!isSpecial ? `
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="block-label-input" value="${escHtml(block.label)}" />
                </div>` : ''}

                ${hasSteps ? `
                <button class="btn btn-primary" id="open-steps-btn" style="align-self:flex-start;">
                    📋 Ouvrir l'éditeur d'étapes (${(block.steps || []).length} étapes)
                </button>` : ''}

                ${isTrigger ? `
                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title">Actions déclenchées</h3>
                            <p class="panel-subtitle">${block.actions.length} action${block.actions.length > 1 ? 's' : ''} configurée${block.actions.length > 1 ? 's' : ''}</p>
                        </div>
                        <button class="btn btn-sm btn-light" id="add-action-btn">+ Ajouter une action</button>
                    </div>
                    <div class="panel-body" id="actions-list">
                        ${block.actions.length > 0
                            ? block.actions.map((a, i) => `
                                <div class="list-row trigger-action-row">
                                    <span class="trigger-action-icon">${Models.TRIGGER_ACTION_ICONS[a.type] || '⚙️'}</span>
                                    <div class="trigger-action-main">
                                        <strong>${escHtml(a.label) || Models.TRIGGER_ACTION_LABELS[a.type] || a.type}</strong>
                                        <span class="trigger-action-meta">${Models.TRIGGER_ACTION_LABELS[a.type] || a.type} · ${Models.TRIGGER_TIMING_LABELS[a.timing && a.timing.mode] || 'Immédiat'}</span>
                                    </div>
                                    <div class="trigger-action-actions">
                                        <button class="action-btn edit-action-btn" data-idx="${i}" title="Modifier">✎</button>
                                        <button class="action-btn danger del-action-btn" data-idx="${i}" title="Supprimer">✕</button>
                                    </div>
                                </div>
                            `).join('')
                            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune action — ajoutez-en une pour déclencher un email, un SMS ou autre.</p>'}
                    </div>
                </div>` : ''}

                ${isTarif ? (() => {
                    const tarifSteps = (block.steps || []).filter(s => s.type === 'tarif');
                    const standardSteps = (block.steps || []).filter(s => s.type === 'step');
                    return `
                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title">Étapes tarif liées</h3>
                            <p class="panel-subtitle">${tarifSteps.length} étape${tarifSteps.length > 1 ? 's' : ''} tarif · ${standardSteps.length} étape${standardSteps.length > 1 ? 's' : ''} standard</p>
                        </div>
                    </div>
                    <div class="panel-body">
                        ${tarifSteps.length > 0
                            ? tarifSteps.map(s => `
                                <div class="list-row" style="display:flex;align-items:center;gap:10px;">
                                    <span>💰</span>
                                    <strong style="font-size:13px;">${escHtml(s.id)}</strong>
                                    <span style="font-size:13px;color:var(--muted);">${escHtml(s.label)}</span>
                                    <span style="margin-left:auto;font-size:12px;color:var(--muted-2);">${(s.questions || []).length} question${(s.questions || []).length > 1 ? 's' : ''}</span>
                                </div>
                            `).join('')
                            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune étape de type tarif — ouvre l\'éditeur d\'étapes pour en ajouter.</p>'}
                    </div>
                </div>
                <div class="form-group">
                    <label>Schéma de calcul associé</label>
                    <select id="block-schema-select">
                        <option value="">— Aucun —</option>
                        ${Store.getAll('schemas').map(s => `<option value="${s.id}" ${s.id === block.schemaId ? 'selected' : ''}>${s.id} — ${escHtml(s.label)}</option>`).join('')}
                    </select>
                    <span class="form-hint">Les étapes tarif alimentent ce schéma via les variables de type « réponse étudiant ».</span>
                </div>`;
                })() : ''}

                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title">Transitions sortantes</h3>
                            <p class="panel-subtitle">${outTransitions.length} transition${outTransitions.length > 1 ? 's' : ''}</p>
                        </div>
                        <button class="btn btn-sm btn-light" id="add-trans-btn">+ Ajouter</button>
                    </div>
                    <div class="panel-body" id="transitions-list">
                        ${transitionsHtml}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="modal-footer-left">
                    ${!isSpecial ? `<button class="btn btn-danger" id="del-block-btn">Supprimer le bloc</button>` : ''}
                </div>
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="save-block-btn">Enregistrer</button>
            </div>
        `);

        // ── Bind modal events ──
        $('#save-block-btn').on('click', () => {
            if (!isSpecial) {
                block.label = $('#block-label-input').val().trim() || block.id;
            }
            if (isTarif) {
                block.schemaId = $('#block-schema-select').val();
            }
            // Update transition targets from selects
            $('#transitions-list .select-target').each(function () {
                const idx = parseInt($(this).data('idx'));
                const trans = outTransitions[idx];
                if (trans) trans.target = $(this).val();
            });
            closeModal();
            self._save();
        });

        $('#del-block-btn').on('click', () => {
            confirmAction('Supprimer le bloc', `Supprimer « ${block.id} » et toutes ses transitions ?`, () => {
                tunnel.blocks = tunnel.blocks.filter(b => b.id !== block.id);
                tunnel.transitions = tunnel.transitions.filter(tr => tr.source !== block.id && tr.target !== block.id);
                closeModal();
                self._save();
            });
        });

        // Add transition
        $('#add-trans-btn').on('click', () => {
            const firstTarget = possibleTargets[0];
            if (!firstTarget) return;
            const newOrder = tunnel.transitions.length > 0
                ? Math.max(...tunnel.transitions.map(t => t.order)) + 1 : 1;
            tunnel.transitions.push(Models.createTransition(block.id, firstTarget.id, '', newOrder));
            closeModal();
            self._save();
            self._openBlockModal(block);
        });

        // Edit condition (open modal2)
        $(document).off('click.editcond').on('click.editcond', '.edit-cond-btn', function () {
            const idx = parseInt($(this).data('idx'));
            const trans = outTransitions[idx];
            if (trans) self._openConditionModal(trans, block);
        });

        // Delete transition
        $(document).off('click.delcond').on('click.delcond', '.del-cond-btn', function () {
            const idx = parseInt($(this).data('idx'));
            const trans = outTransitions[idx];
            if (trans) {
                const tIdx = tunnel.transitions.indexOf(trans);
                if (tIdx >= 0) tunnel.transitions.splice(tIdx, 1);
                closeModal();
                self._save();
                self._openBlockModal(block);
            }
        });

        // Open steps editor
        $('#open-steps-btn').on('click', () => {
            closeModal();
            navigate('#step-editor/' + self._tunnel.id + '/' + block.id);
        });

        // Trigger actions
        if (isTrigger) {
            $('#add-action-btn').off('click').on('click', () => self._openActionTypeModal(block));

            $(document).off('click.editact').on('click.editact', '.edit-action-btn', function () {
                const idx = parseInt($(this).data('idx'));
                const action = block.actions[idx];
                if (action) self._openActionModal(action, block, idx);
            });

            $(document).off('click.delact').on('click.delact', '.del-action-btn', function () {
                const idx = parseInt($(this).data('idx'));
                confirmAction('Supprimer l\'action', 'Cette action sera définitivement supprimée du bloc trigger.', () => {
                    block.actions.splice(idx, 1);
                    closeModal();
                    self._save();
                    self._openBlockModal(block);
                });
            });
        }
    },

    /* ══════════════════════════════════════════
       Modal 2 — Choisir le type d'action
       ══════════════════════════════════════════ */
    _openActionTypeModal(block) {
        const self = this;
        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Nouvelle action</h2>
                <p class="modal-subtitle">Choisissez le type d'action à déclencher</p>
            </div>
            <div class="modal-body">
                <div class="trigger-type-grid">
                    ${Models.TRIGGER_ACTION_TYPES.map(t => `
                        <button type="button" class="trigger-type-card" data-type="${t}">
                            <span class="trigger-type-icon">${Models.TRIGGER_ACTION_ICONS[t]}</span>
                            <span class="trigger-type-label">${Models.TRIGGER_ACTION_LABELS[t]}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `);

        $('.trigger-type-card').on('click', function () {
            const type = $(this).data('type');
            const action = Models.createTriggerAction(type);
            block.actions.push(action);
            closeModal2();
            const idx = block.actions.length - 1;
            self._openActionModal(action, block, idx);
        });
    },

    /* ══════════════════════════════════════════
       Modal 2 — Éditer une action (email, sms, cron...)
       ══════════════════════════════════════════ */
    _openActionModal(action, block, idx) {
        const self = this;
        const timing = action.timing || (action.timing = { mode: 'immediate', delay: 0, delayUnit: 'minutes', cron: '' });
        const templateVars = window.TEMPLATE_VARIABLES || [];

        const variablesHtml = this._renderVariablePills(templateVars);

        const timingHtml = `
            <div class="form-group">
                <label>Moment d'exécution</label>
                <div class="radio-group">
                    ${Models.TRIGGER_TIMING_MODES.map(m => `
                        <label>
                            <input type="radio" name="trig-timing" value="${m}" ${timing.mode === m ? 'checked' : ''} />
                            <span>${Models.TRIGGER_TIMING_LABELS[m]}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group trig-delay-fields" style="display:${timing.mode === 'delayed' ? 'flex' : 'none'};gap:10px;align-items:flex-end;">
                <div style="flex:1;">
                    <label>Délai</label>
                    <input type="number" id="trig-delay" min="0" value="${timing.delay || 0}" />
                </div>
                <div style="flex:1;">
                    <label>Unité</label>
                    <select id="trig-delay-unit">
                        ${Models.TRIGGER_DELAY_UNITS.map(u => `<option value="${u}" ${timing.delayUnit === u ? 'selected' : ''}>${u}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group trig-cron-fields" style="display:${timing.mode === 'scheduled' ? 'block' : 'none'};">
                <label>Expression cron</label>
                <input type="text" id="trig-cron" value="${escHtml(timing.cron || '')}" placeholder="0 8 * * *" />
                <span class="form-hint">Format cron standard : minute heure jour mois jour-semaine</span>
            </div>
        `;

        let typeHtml = '';
        if (action.type === 'email') {
            typeHtml = `
                <div class="form-group">
                    <label>Destinataire</label>
                    <select id="trig-recipient">
                        ${Models.TRIGGER_RECIPIENTS.map(r => `<option value="${r.id}" ${action.config.recipientType === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group trig-custom-recipient" style="display:${action.config.recipientType === 'autre' ? 'block' : 'none'};">
                    <label>Email personnalisé</label>
                    <input type="email" id="trig-custom-recipient" value="${escHtml(action.config.customRecipient || '')}" placeholder="adresse@exemple.fr" />
                </div>
                <div class="form-group">
                    <label>Objet du mail</label>
                    <input type="text" id="trig-subject" value="${escHtml(action.config.subject || '')}" placeholder="Ex : Votre dossier d'inscription" />
                </div>
                <div class="form-group">
                    <label>Variables disponibles</label>
                    ${variablesHtml}
                </div>
                <div class="form-group">
                    <label>Corps du mail</label>
                    <div id="trig-email-editor"></div>
                </div>
            `;
        } else if (action.type === 'sms') {
            typeHtml = `
                <div class="form-group">
                    <label>Destinataire</label>
                    <select id="trig-recipient">
                        ${Models.TRIGGER_RECIPIENTS.map(r => `<option value="${r.id}" ${action.config.recipientType === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group trig-custom-recipient" style="display:${action.config.recipientType === 'autre' ? 'block' : 'none'};">
                    <label>Numéro personnalisé</label>
                    <input type="text" id="trig-custom-recipient" value="${escHtml(action.config.customRecipient || '')}" placeholder="+33 6 12 34 56 78" />
                </div>
                <div class="form-group">
                    <label>Variables disponibles</label>
                    ${variablesHtml}
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea id="trig-sms-message" rows="5" placeholder="Contenu du SMS (160 caractères recommandés)">${escHtml(action.config.message || '')}</textarea>
                </div>
            `;
        } else if (action.type === 'cron') {
            typeHtml = `
                <div class="form-group">
                    <label>Libellé de la tâche</label>
                    <input type="text" id="trig-task-label" value="${escHtml(action.config.taskLabel || '')}" placeholder="Ex : Relance auto dossiers incomplets" />
                </div>
                <div class="form-group">
                    <label>Expression cron</label>
                    <input type="text" id="trig-cron-expr" value="${escHtml(action.config.expression || '0 8 * * *')}" placeholder="0 8 * * *" />
                    <span class="form-hint">Exécution planifiée via crontab serveur</span>
                </div>
            `;
        } else if (action.type === 'webhook') {
            typeHtml = `
                <div class="form-group">
                    <label>URL du webhook</label>
                    <input type="url" id="trig-webhook-url" value="${escHtml(action.config.url || '')}" placeholder="https://api.exemple.fr/hook" />
                </div>
                <div class="form-group">
                    <label>Méthode HTTP</label>
                    <select id="trig-webhook-method">
                        ${['POST', 'GET', 'PUT', 'PATCH', 'DELETE'].map(m => `<option value="${m}" ${action.config.method === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Variables disponibles</label>
                    ${variablesHtml}
                </div>
                <div class="form-group">
                    <label>Corps de requête (JSON)</label>
                    <textarea id="trig-webhook-body" rows="6" placeholder='{"email":"\${etudiant_email}"}'>${escHtml(action.config.body || '')}</textarea>
                </div>
            `;
        } else {
            typeHtml = `
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="trig-other-desc" rows="5" placeholder="Décrire l'action à effectuer">${escHtml(action.config.description || '')}</textarea>
                </div>
            `;
        }

        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">${Models.TRIGGER_ACTION_ICONS[action.type]} ${Models.TRIGGER_ACTION_LABELS[action.type]}</h2>
                <p class="modal-subtitle">Bloc trigger <strong>${escHtml(block.id)}</strong></p>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
                <div class="form-group">
                    <label>Nom de l'action</label>
                    <input type="text" id="trig-label" value="${escHtml(action.label || '')}" placeholder="Ex : Notification inscription" />
                </div>
                ${timingHtml}
                <hr style="border:none;border-top:1px solid var(--line);margin:4px 0;" />
                ${typeHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
                <button class="btn btn-primary" id="save-action-btn">Enregistrer</button>
            </div>
        `);

        // Init Quill for email body (after modal is in DOM)
        let quill = null;
        if (action.type === 'email' && typeof Quill !== 'undefined') {
            quill = new Quill('#trig-email-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean'],
                    ],
                },
            });
            if (action.config.body) quill.root.innerHTML = action.config.body;
        }

        // Track last focused insertable target (subject, sms message, webhook body, Quill body...)
        // so variable pills insert where the user last clicked.
        let lastFocusedTarget = quill ? { kind: 'quill', quill } : null;
        const $modal2 = $('#app-modal-2-content');

        $modal2.off('focusin.trigvar').on('focusin.trigvar', 'input[type="text"], input[type="email"], input[type="url"], textarea', function () {
            lastFocusedTarget = { kind: 'field', el: this };
        });

        if (quill) {
            quill.root.addEventListener('focus', () => {
                lastFocusedTarget = { kind: 'quill', quill };
            });
        }

        // Timing mode switch
        $('input[name="trig-timing"]').on('change', function () {
            const mode = $(this).val();
            $('.trig-delay-fields').css('display', mode === 'delayed' ? 'flex' : 'none');
            $('.trig-cron-fields').css('display', mode === 'scheduled' ? 'block' : 'none');
        });

        // Recipient switch
        $('#trig-recipient').on('change', function () {
            $('.trig-custom-recipient').css('display', $(this).val() === 'autre' ? 'block' : 'none');
        });

        // Variable pills → insert into last focused editor (mousedown prevents blur)
        $('.var-pill').off('mousedown click').on('mousedown', function (e) {
            e.preventDefault(); // keep focus on the current field
        }).on('click', function () {
            const v = $(this).data('var');
            self._insertVariable(v, lastFocusedTarget);
        });

        // Save
        $('#save-action-btn').off('click').on('click', () => {
            action.label = $('#trig-label').val().trim();
            const mode = $('input[name="trig-timing"]:checked').val();
            action.timing = {
                mode,
                delay: parseInt($('#trig-delay').val()) || 0,
                delayUnit: $('#trig-delay-unit').val() || 'minutes',
                cron: $('#trig-cron').val().trim(),
            };

            if (action.type === 'email') {
                action.config.recipientType = $('#trig-recipient').val();
                action.config.customRecipient = $('#trig-custom-recipient').val().trim();
                action.config.subject = $('#trig-subject').val().trim();
                action.config.body = quill ? quill.root.innerHTML : '';
            } else if (action.type === 'sms') {
                action.config.recipientType = $('#trig-recipient').val();
                action.config.customRecipient = $('#trig-custom-recipient').val().trim();
                action.config.message = $('#trig-sms-message').val();
            } else if (action.type === 'cron') {
                action.config.taskLabel = $('#trig-task-label').val().trim();
                action.config.expression = $('#trig-cron-expr').val().trim();
            } else if (action.type === 'webhook') {
                action.config.url = $('#trig-webhook-url').val().trim();
                action.config.method = $('#trig-webhook-method').val();
                action.config.body = $('#trig-webhook-body').val();
            } else {
                action.config.description = $('#trig-other-desc').val();
            }

            block.actions[idx] = action;
            closeModal2();
            closeModal();
            self._save();
            const freshBlock = self._tunnel.blocks.find(b => b.id === block.id);
            if (freshBlock) self._openBlockModal(freshBlock);
        });
    },

    /* Rendu des pills de variables */
    _renderVariablePills(vars) {
        if (!vars || !vars.length) return '<p style="color:var(--muted);font-size:12px;margin:0;">Aucune variable</p>';
        const grouped = {};
        vars.forEach(v => {
            const cat = v.category || 'Autres';
            (grouped[cat] = grouped[cat] || []).push(v);
        });
        return `<div class="variable-pills">${
            Object.entries(grouped).map(([cat, list]) => `
                <div class="var-pill-group">
                    <span class="var-pill-group-label">${escHtml(cat)}</span>
                    ${list.map(v => `<button type="button" class="var-pill" data-var="\${${v.id}}" title="${escHtml(v.label)}">${v.id}</button>`).join('')}
                </div>
            `).join('')
        }</div>`;
    },

    /* Insertion d'une variable au caret dans la cible fournie (quill ou champ texte) */
    _insertVariable(varText, target) {
        if (target && target.kind === 'quill' && target.quill) {
            const q = target.quill;
            const range = q.getSelection(true) || { index: q.getLength(), length: 0 };
            q.insertText(range.index, varText, 'user');
            q.setSelection(range.index + varText.length, 0);
            return;
        }
        if (target && target.kind === 'field' && target.el) {
            const el = target.el;
            const start = el.selectionStart != null ? el.selectionStart : el.value.length;
            const end   = el.selectionEnd   != null ? el.selectionEnd   : el.value.length;
            const val = el.value;
            el.value = val.slice(0, start) + varText + val.slice(end);
            const pos = start + varText.length;
            try { el.setSelectionRange(pos, pos); } catch (_) {}
            el.focus();
        }
    },

    /* ══════════════════════════════════════════
       Modal 2 — Éditer une condition
       ══════════════════════════════════════════ */
    _openConditionModal(transition, block) {
        const self = this;
        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Condition</h2>
                <p class="modal-subtitle">Transition depuis <strong>${escHtml(block.id)}</strong> vers <strong>${escHtml(transition.target)}</strong></p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Expression de condition</label>
                    <input type="text" id="cond-expr-input" value="${escHtml(transition.condition)}" placeholder="ex: boursier=Oui, eligible=Non..." />
                    <span class="form-hint">Laissez vide pour une transition inconditionnelle</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
                <button class="btn btn-primary" id="save-cond-btn">Enregistrer</button>
            </div>
        `);

        $('#save-cond-btn').on('click', () => {
            transition.condition = $('#cond-expr-input').val().trim();
            closeModal2();
            // Re-render transitions in the parent modal
            closeModal();
            self._save();
            const freshBlock = self._tunnel.blocks.find(b => b.id === block.id);
            if (freshBlock) self._openBlockModal(freshBlock);
        });
    },

    /* ══════════════════════════════════════════
       Modal — Ajouter un nouveau bloc
       ══════════════════════════════════════════ */
    _openAddBlockModal() {
        const self = this;
        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Ajouter un bloc</h2>
                <p class="modal-subtitle">Choisissez le type de bloc à insérer dans le tunnel</p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Identifiant</label>
                    <input type="text" id="new-block-id" placeholder="ex: info_perso, tarif_calc..." />
                </div>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="new-block-label" placeholder="Nom affiché du bloc" />
                </div>
                <div class="form-group">
                    <label>Type de bloc</label>
                    <div class="radio-group" id="block-type-group">
                        ${Models.BLOCK_TYPES.map((t, i) => `
                            <label>
                                <input type="radio" name="block-type" value="${t}" ${i === 0 ? 'checked' : ''} />
                                <span>${Models.BLOCK_ICONS[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="create-block-btn">Créer le bloc</button>
            </div>
        `);

        $('#create-block-btn').on('click', () => {
            const id = $('#new-block-id').val().trim();
            const label = $('#new-block-label').val().trim();
            const type = $('input[name="block-type"]:checked').val();

            if (!id) { $('#new-block-id').focus(); return; }
            if (self._tunnel.blocks.some(b => b.id === id)) {
                alert('Un bloc avec cet identifiant existe déjà.');
                return;
            }

            const block = Models.createBlock(id, type, label);
            // Insert before FIN
            const finIdx = self._tunnel.blocks.findIndex(b => b.type === 'final');
            if (finIdx >= 0) {
                self._tunnel.blocks.splice(finIdx, 0, block);
            } else {
                self._tunnel.blocks.push(block);
            }

            closeModal();
            self._save();
        });
    },
};

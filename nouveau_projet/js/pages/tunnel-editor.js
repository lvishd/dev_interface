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
        m += '    classDef information fill:#FFF9C4,stroke:#F59E0B,color:#92610a;\n\n';

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

                ${isTarif ? `
                <div class="form-group">
                    <label>Schéma de calcul associé</label>
                    <select id="block-schema-select">
                        <option value="">— Aucun —</option>
                        ${Store.getAll('schemas').map(s => `<option value="${s.id}" ${s.id === block.schemaId ? 'selected' : ''}>${s.id} — ${escHtml(s.label)}</option>`).join('')}
                    </select>
                </div>` : ''}

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

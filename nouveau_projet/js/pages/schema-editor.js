/* ══════════════════════════════════════════════════════════════
   Page — Éditeur visuel d'un schéma de calcul (Mermaid)
   ══════════════════════════════════════════════════════════════ */
const SchemaEditorPage = {

    _schema: null,

    render($container, params) {
        const schemaId = params && params[0];
        this._schema = Store.findById('schemas', schemaId);
        if (!this._schema) { navigate('#schemas'); return; }

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <button class="back-btn" id="back-to-schemas" title="Retour">←</button>
                    <div>
                        <h1 class="page-title">${escHtml(this._schema.id)}</h1>
                        <p class="page-subtitle">${escHtml(this._schema.label)} — ${escHtml(this._schema.description)}</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-sm btn-light" id="export-schema-png-btn" title="Exporter le diagramme en PNG">↓ Exporter PNG</button>
                    <button class="btn btn-sm btn-light" id="add-schema-node-btn">+ Ajouter un nœud</button>
                </div>
            </div>
            <div class="mermaid-container">
                <div id="schema-mermaid-preview"></div>
            </div>
        `);

        this._bindEvents();
        this._renderDiagram();
    },

    _toMermaid() {
        const s = this._schema;
        let m = '---\nconfig:\n    layout: elk\n---\ngraph TD\n';
        m += '    classDef initial fill:#bfe2ef,stroke:#6accee,color:#1a6d8a;\n';
        m += '    classDef variable fill:#E0EAFF,stroke:#3B5BDB,color:#2b3d91;\n';
        m += '    classDef formula fill:#F3E8FF,stroke:#7C3AED,color:#5623a7;\n\n';

        s.nodes.forEach(n => {
            if (n.type === 'initial') {
                m += `    ${n.id}(("▶ ${n.label}"))\n`;
            } else if (n.type === 'variable') {
                m += `    ${n.id}{"🔀 ${n.label}"}\n`;
            } else if (n.type === 'formula') {
                m += `    ${n.id}["💰 ${n.label}"]\n`;
            }
        });

        m += '\n';
        const sorted = [...s.transitions].sort((a, b) => a.order - b.order);
        sorted.forEach(tr => {
            if (tr.condition) {
                m += `    ${tr.source} -- "${tr.condition}" --> ${tr.target}\n`;
            } else {
                m += `    ${tr.source} --> ${tr.target}\n`;
            }
        });

        m += '\n';
        s.nodes.forEach(n => {
            m += `    class ${n.id} ${n.type}\n`;
        });
        return m;
    },

    async _renderDiagram() {
        const mermaidStr = this._toMermaid();
        console.log('[SchemaEditor] _renderDiagram called, graphEngine:', !!window.graphEngine);
        const self = this;
        if (window.graphEngine) {
            await window.graphEngine.render('#schema-mermaid-preview', mermaidStr, function (nodeId) {
                console.log('[SchemaEditor] Node clicked:', nodeId);
                const node = self._schema.nodes.find(n => n.id === nodeId);
                if (node) self._openNodeModal(node);
            });
        }
    },

    _exportPng() {
        const svgEl = document.querySelector('#schema-mermaid-preview svg');
        if (!svgEl) { alert('Aucun diagramme à exporter.'); return; }

        // Mesurer la bbox réelle du contenu (insensible aux transforms svgPanZoom)
        const liveViewport = svgEl.querySelector('.svg-pan-zoom_viewport') || svgEl;
        const bbox = liveViewport.getBBox();
        const padding = 20;
        const w = bbox.width  + padding * 2;
        const h = bbox.height + padding * 2;
        console.log('[Export] bbox:', bbox, '→', w, 'x', h);

        // Clone — on règle viewBox et dimensions sur le contenu réel
        const clone = svgEl.cloneNode(true);
        clone.setAttribute('width',  w);
        clone.setAttribute('height', h);
        clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${w} ${h}`);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Retire les @import / @font-face externes (sinon canvas tainted)
        clone.querySelectorAll('style').forEach(s => {
            s.textContent = s.textContent
                .replace(/@import\s+[^;]+;/g, '')
                .replace(/@font-face\s*\{[^}]*\}/gs, '');
        });

        // Retirer les contrôles UI de svgPanZoom (+ / RESET / -)
        clone.querySelectorAll('#svg-pan-zoom-controls, .svg-pan-zoom-control').forEach(el => el.remove());

        // Neutraliser le transform de pan/zoom pour partir d'un état "fit"
        const cloneViewport = clone.querySelector('.svg-pan-zoom_viewport');
        if (cloneViewport) {
            cloneViewport.removeAttribute('transform');
            cloneViewport.removeAttribute('style');
        }

        const svgStr  = new XMLSerializer().serializeToString(clone);
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
        console.log('[Export] dataUrl length:', dataUrl.length, '— src assigné');

        const scale  = 2;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');

        const schemaId = this._schema.id;
        const img = new Image();

        img.onload = () => {
            console.log('[Export] img.onload déclenché');
            try {
                ctx.scale(scale, scale);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);

                // toBlob() : plus robuste que toDataURL() pour les grandes images
                canvas.toBlob(blob => {
                    if (!blob) { alert('Échec génération PNG (blob null).'); return; }
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.download = `schema-${schemaId}.png`;
                    a.href = blobUrl;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
                    console.log('[Export] téléchargement déclenché');
                }, 'image/png');
            } catch (e) {
                console.error('[Export] erreur canvas:', e);
                alert('Erreur export PNG : ' + e.message);
            }
        };

        img.onerror = (e) => {
            console.error('[Export] img.onerror :', e);
            alert('Échec chargement SVG pour export.');
        };

        img.src = dataUrl;
    },

    _save() {
        Store.upsert('schemas', this._schema);
        this._renderDiagram();
    },

    _bindEvents() {
        const self = this;
        console.log('[SchemaEditor] _bindEvents, export btn exists:', $('#export-schema-png-btn').length);
        $('#back-to-schemas').off('click').on('click', () => navigate('#schemas'));
        $('#export-schema-png-btn').off('click').on('click', () => {
            console.log('[SchemaEditor] export-schema-png-btn clicked');
            self._exportPng();
        });
        $('#add-schema-node-btn').off('click').on('click', () => self._openAddNodeModal());
    },

    /* ── Modal: gérer un nœud existant ── */
    _openNodeModal(node) {
        const self = this;
        const schema = this._schema;
        const isInitial = node.type === 'initial';
        const outTransitions = schema.transitions.filter(tr => tr.source === node.id);
        const possibleTargets = schema.nodes.filter(n => n.id !== node.id);

        const transitionsHtml = outTransitions.length > 0
            ? outTransitions.map((tr, i) => `
                <div class="list-row div-condition" data-idx="${i}">
                    <div class="condition-main">
                        <span class="condition-str">${escHtml(tr.condition) || '<em style="color:var(--muted-2)">sans condition</em>'}</span>
                        <span class="condition-arrow">→</span>
                        <select class="select-target" data-idx="${i}">
                            ${possibleTargets.map(n => `<option value="${n.id}" ${n.id === tr.target ? 'selected' : ''}>${n.id}</option>`).join('')}
                        </select>
                    </div>
                    <div class="condition-actions">
                        <button class="action-btn sch-edit-cond-btn" data-idx="${i}" title="Modifier">✎</button>
                        <button class="action-btn danger sch-del-cond-btn" data-idx="${i}" title="Supprimer">✕</button>
                    </div>
                </div>
            `).join('')
            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune transition</p>';

        // Extra info for variable/formula nodes
        let extraHtml = '';
        if (node.type === 'variable') {
            const variable = Store.findById('variables', node.variableId);
            extraHtml = `
                <div class="form-group">
                    <label>Variable liée</label>
                    <select id="node-var-select">
                        <option value="">— Aucune —</option>
                        ${Store.getAll('variables').filter(v => v.usableInSchema).map(v =>
                            `<option value="${v.id}" ${v.id === node.variableId ? 'selected' : ''}>${v.id} — ${escHtml(v.label)}</option>`
                        ).join('')}
                    </select>
                    ${variable ? `<span class="form-hint">Type: ${variable.type} · Valeurs: ${variable.values.join(', ')}</span>` : ''}
                </div>
            `;
        } else if (node.type === 'formula') {
            extraHtml = `
                <div class="form-group">
                    <label>Formule liée</label>
                    <select id="node-formula-select">
                        <option value="">— Aucune —</option>
                        ${Store.getAll('formulas').map(f =>
                            `<option value="${f.id}" ${f.id === node.formulaId ? 'selected' : ''}>${f.id} — ${escHtml(f.label)}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <div class="header-top">
                    <div>
                        <h2 class="modal-title">${escHtml(node.id)}</h2>
                        <p class="modal-subtitle">${typeBadge(node.type)} ${escHtml(node.label)}</p>
                    </div>
                </div>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
                ${!isInitial ? `
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="snode-label-input" value="${escHtml(node.label)}" />
                </div>
                ${extraHtml}` : ''}

                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title">Transitions sortantes</h3>
                            <p class="panel-subtitle">${outTransitions.length} transition${outTransitions.length > 1 ? 's' : ''}</p>
                        </div>
                        <button class="btn btn-sm btn-light" id="sch-add-trans-btn">+ Ajouter</button>
                    </div>
                    <div class="panel-body" id="sch-transitions-list">
                        ${transitionsHtml}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="modal-footer-left">
                    ${!isInitial ? `<button class="btn btn-danger" id="sch-del-node-btn">Supprimer</button>` : ''}
                </div>
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="sch-save-node-btn">Enregistrer</button>
            </div>
        `);

        // Save
        $('#sch-save-node-btn').on('click', () => {
            if (!isInitial) {
                node.label = $('#snode-label-input').val().trim() || node.id;
                if (node.type === 'variable') node.variableId = $('#node-var-select').val();
                if (node.type === 'formula') node.formulaId = $('#node-formula-select').val();
            }
            $('#sch-transitions-list .select-target').each(function () {
                const idx = parseInt($(this).data('idx'));
                if (outTransitions[idx]) outTransitions[idx].target = $(this).val();
            });
            closeModal();
            self._save();
        });

        // Delete node
        $('#sch-del-node-btn').on('click', () => {
            confirmAction('Supprimer le nœud', `Supprimer « ${node.id} » ?`, () => {
                schema.nodes = schema.nodes.filter(n => n.id !== node.id);
                schema.transitions = schema.transitions.filter(tr => tr.source !== node.id && tr.target !== node.id);
                closeModal();
                self._save();
            });
        });

        // Add transition
        $('#sch-add-trans-btn').on('click', () => {
            const firstTarget = possibleTargets[0];
            if (!firstTarget) return;
            const newOrder = schema.transitions.length > 0
                ? Math.max(...schema.transitions.map(t => t.order)) + 1 : 1;
            schema.transitions.push(Models.createTransition(node.id, firstTarget.id, '', newOrder));
            closeModal();
            self._save();
            self._openNodeModal(node);
        });

        // Edit condition
        $(document).off('click.scheditcond').on('click.scheditcond', '.sch-edit-cond-btn', function () {
            const idx = parseInt($(this).data('idx'));
            const trans = outTransitions[idx];
            if (trans) self._openSchCondModal(trans, node);
        });

        // Delete transition
        $(document).off('click.schdelcond').on('click.schdelcond', '.sch-del-cond-btn', function () {
            const idx = parseInt($(this).data('idx'));
            const trans = outTransitions[idx];
            if (trans) {
                const tIdx = schema.transitions.indexOf(trans);
                if (tIdx >= 0) schema.transitions.splice(tIdx, 1);
                closeModal();
                self._save();
                self._openNodeModal(node);
            }
        });
    },

    /* ── Modal 2: condition ── */
    _openSchCondModal(transition, node) {
        const self = this;
        openModal2(`
            <button class="close-modal" onclick="closeModal2()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Condition</h2>
                <p class="modal-subtitle">Transition depuis <strong>${escHtml(node.id)}</strong></p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Expression</label>
                    <input type="text" id="sch-cond-expr" value="${escHtml(transition.condition)}" placeholder="ex: Oui, Non, Master..." />
                    <span class="form-hint">Valeur attendue pour emprunter cette branche</span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
                <button class="btn btn-primary" id="sch-save-cond-btn">Enregistrer</button>
            </div>
        `);

        $('#sch-save-cond-btn').on('click', () => {
            transition.condition = $('#sch-cond-expr').val().trim();
            closeModal2();
            closeModal();
            self._save();
            const freshNode = self._schema.nodes.find(n => n.id === node.id);
            if (freshNode) self._openNodeModal(freshNode);
        });
    },

    /* ── Modal: ajouter un nœud ── */
    _openAddNodeModal() {
        const self = this;
        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">Ajouter un nœud</h2>
                <p class="modal-subtitle">Nœud de variable (décision) ou de formule (résultat)</p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Identifiant</label>
                    <input type="text" id="new-snode-id" placeholder="ex: v_boursier, f_standard..." />
                </div>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="new-snode-label" placeholder="Nom du nœud" />
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <div class="radio-group">
                        <label><input type="radio" name="snode-type" value="variable" checked /><span>🔀 Variable (décision)</span></label>
                        <label><input type="radio" name="snode-type" value="formula" /><span>💰 Formule (résultat)</span></label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="create-snode-btn">Créer</button>
            </div>
        `);

        $('#create-snode-btn').on('click', () => {
            const id = $('#new-snode-id').val().trim();
            const label = $('#new-snode-label').val().trim();
            const type = $('input[name="snode-type"]:checked').val();

            if (!id) { $('#new-snode-id').focus(); return; }
            if (self._schema.nodes.some(n => n.id === id)) {
                alert('Un nœud avec cet identifiant existe déjà.');
                return;
            }

            const node = type === 'variable'
                ? Models.createVariableNode(id, '', label)
                : Models.createFormulaNode(id, '', label);

            self._schema.nodes.push(node);
            closeModal();
            self._save();
        });
    },
};

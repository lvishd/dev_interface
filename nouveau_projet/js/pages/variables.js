/* ══════════════════════════════════════════════════════════════
   Page — Référentiel des variables (table CRUD)
   ══════════════════════════════════════════════════════════════ */
const VariablesPage = {

    render($container) {
        const variables = Store.getAll('variables');

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <div>
                        <h1 class="page-title">Variables</h1>
                        <p class="page-subtitle">${variables.length} variable${variables.length > 1 ? 's' : ''} dans le référentiel</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-primary" id="add-variable-btn">+ Nouvelle variable</button>
                </div>
            </div>
            <div class="page-scroll">
                <div class="stats-row">
                    ${this._statsForSource(variables, 'produit', 'Produit')}
                    ${this._statsForSource(variables, 'dossier', 'Dossier / FP')}
                    ${this._statsForSource(variables, 'reponse_etudiant', 'Réponse étudiant')}
                    ${this._statsForSource(variables, 'globale', 'Globale')}
                </div>

                ${variables.length === 0
                    ? '<div class="empty-state"><p>Aucune variable configurée</p></div>'
                    : `<div class="panel">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Label</th>
                                    <th>Source</th>
                                    <th>Type</th>
                                    <th>Valeurs</th>
                                    <th>Mode</th>
                                    <th style="width:100px">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${variables.map(v => this._renderRow(v)).join('')}
                            </tbody>
                        </table>
                    </div>`}
            </div>
        `);

        this._bindEvents();
    },

    _statsForSource(variables, source, label) {
        const count = variables.filter(v => v.source === source).length;
        return `
            <div class="stat-card">
                <div class="stat-label">${label}</div>
                <div class="stat-value">${count}</div>
            </div>
        `;
    },

    _renderRow(v) {
        const valuesStr = v.values.length > 0 ? v.values.slice(0, 3).join(', ') + (v.values.length > 3 ? '…' : '') : '—';
        return `
            <tr>
                <td><strong>${escHtml(v.id)}</strong></td>
                <td>${escHtml(v.label)}</td>
                <td>${sourceBadge(v.source)}</td>
                <td><span class="badge" style="background:var(--panel-soft);border:1px solid var(--line);color:var(--text);">${v.type}</span></td>
                <td style="font-size:13px;color:var(--muted);">${escHtml(valuesStr)}</td>
                <td><span class="badge" style="background:var(--panel-soft);border:1px solid var(--line);color:var(--muted);">${v.mode}</span></td>
                <td>
                    <div class="card-actions">
                        <button class="action-btn edit-var-btn" data-id="${escHtml(v.id)}" title="Modifier">✎</button>
                        <button class="action-btn danger delete-var-btn" data-id="${escHtml(v.id)}" title="Supprimer">✕</button>
                    </div>
                </td>
            </tr>
        `;
    },

    _bindEvents() {
        const self = this;

        $(document).off('click.vlist-add').on('click.vlist-add', '#add-variable-btn', () => self._openVarModal());

        $(document).off('click.vlist-edit').on('click.vlist-edit', '.edit-var-btn', function (e) {
            e.stopPropagation();
            const v = Store.findById('variables', $(this).data('id'));
            if (v) self._openVarModal(v);
        });

        $(document).off('click.vlist-del').on('click.vlist-del', '.delete-var-btn', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            confirmAction('Supprimer la variable', `Supprimer « ${id} » ?`, () => {
                Store.remove('variables', id);
                self.render($('#page-content'));
            });
        });
    },

    _openVarModal(existing) {
        const self = this;
        const isEdit = !!existing;

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? 'Modifier la variable' : 'Nouvelle variable'}</h2>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Identifiant</label>
                        <input type="text" id="var-id" value="${isEdit ? escHtml(existing.id) : ''}" ${isEdit ? 'readonly style="opacity:0.6"' : ''} placeholder="ex: VAR_BOURSIER" />
                    </div>
                    <div class="form-group">
                        <label>Label</label>
                        <input type="text" id="var-label" value="${isEdit ? escHtml(existing.label) : ''}" placeholder="Nom lisible" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="var-desc">${isEdit ? escHtml(existing.description) : ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Source</label>
                        <select id="var-source">
                            ${Models.VARIABLE_SOURCES.map(s => `<option value="${s}" ${isEdit && existing.source === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="var-type">
                            ${Models.VARIABLE_TYPES.map(t => `<option value="${t}" ${isEdit && existing.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Valeurs possibles (séparées par des virgules)</label>
                    <input type="text" id="var-values" value="${isEdit ? existing.values.join(', ') : ''}" placeholder="ex: Oui, Non" />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Mode</label>
                        <select id="var-mode">
                            ${Models.VARIABLE_MODES.map(m => `<option value="${m}" ${isEdit && existing.mode === m ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Usage</label>
                        <div style="display:flex;gap:16px;margin-top:4px;">
                            <label style="display:flex;gap:6px;align-items:center;font-size:13px;font-weight:600;cursor:pointer;text-transform:none;letter-spacing:0;color:var(--text);">
                                <input type="checkbox" id="var-schema" ${isEdit && existing.usableInSchema ? 'checked' : ''} /> Schéma
                            </label>
                            <label style="display:flex;gap:6px;align-items:center;font-size:13px;font-weight:600;cursor:pointer;text-transform:none;letter-spacing:0;color:var(--text);">
                                <input type="checkbox" id="var-formula" ${isEdit && existing.usableInFormula ? 'checked' : ''} /> Formule
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="save-var-btn">Enregistrer</button>
            </div>
        `);

        $('#save-var-btn').on('click', () => {
            const id = $('#var-id').val().trim();
            const label = $('#var-label').val().trim();
            if (!id) { $('#var-id').focus(); return; }

            const data = {
                id,
                label,
                description: $('#var-desc').val().trim(),
                source: $('#var-source').val(),
                type: $('#var-type').val(),
                values: $('#var-values').val().split(',').map(s => s.trim()).filter(Boolean),
                mode: $('#var-mode').val(),
                usableInSchema: $('#var-schema').is(':checked'),
                usableInFormula: $('#var-formula').is(':checked'),
            };

            if (!isEdit && Store.findById('variables', id)) {
                alert('Une variable avec cet identifiant existe déjà.');
                return;
            }

            Store.upsert('variables', isEdit ? Object.assign(existing, data) : data);
            closeModal();
            self.render($('#page-content'));
        });
    },
};

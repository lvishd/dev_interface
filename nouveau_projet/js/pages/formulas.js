/* ══════════════════════════════════════════════════════════════
   Page — Formules tarifaires (table CRUD)
   ══════════════════════════════════════════════════════════════ */
const FormulasPage = {

    render($container) {
        const formulas = Store.getAll('formulas');

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <div>
                        <h1 class="page-title">Formules tarifaires</h1>
                        <p class="page-subtitle">${formulas.length} formule${formulas.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-primary" id="add-formula-btn">+ Nouvelle formule</button>
                </div>
            </div>
            <div class="page-scroll">
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-label">Formules actives</div>
                        <div class="stat-value">${formulas.filter(f => f.isActive).length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Formules inactives</div>
                        <div class="stat-value">${formulas.filter(f => !f.isActive).length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total prestations</div>
                        <div class="stat-value">${formulas.reduce((s, f) => s + f.prestations.length, 0)}</div>
                    </div>
                </div>

                ${formulas.length === 0
                    ? '<div class="empty-state"><p>Aucune formule tarifaire</p></div>'
                    : `<div class="panel">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Label</th>
                                    <th>Prestations</th>
                                    <th>Total estimé</th>
                                    <th>Statut</th>
                                    <th style="width:100px">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${formulas.map(f => this._renderRow(f)).join('')}
                            </tbody>
                        </table>
                    </div>`}
            </div>
        `);

        this._bindEvents();
    },

    _renderRow(formula) {
        const total = formula.prestations.reduce((s, p) => s + (p.amount || 0), 0);
        return `
            <tr data-id="${escHtml(formula.id)}">
                <td><strong>${escHtml(formula.id)}</strong></td>
                <td>${escHtml(formula.label)}</td>
                <td>${formula.prestations.length} prestation${formula.prestations.length > 1 ? 's' : ''}</td>
                <td><strong>${total.toFixed(2)} €</strong></td>
                <td>${statusBadge(formula.isActive)}</td>
                <td>
                    <div class="card-actions">
                        <button class="action-btn edit-formula-btn" data-id="${escHtml(formula.id)}" title="Modifier">✎</button>
                        <button class="action-btn danger delete-formula-btn" data-id="${escHtml(formula.id)}" title="Supprimer">✕</button>
                    </div>
                </td>
            </tr>
        `;
    },

    _bindEvents() {
        const self = this;

        $(document).off('click.flist-add').on('click.flist-add', '#add-formula-btn', () => self._openFormulaModal());

        $(document).off('click.flist-edit').on('click.flist-edit', '.edit-formula-btn', function (e) {
            e.stopPropagation();
            const formula = Store.findById('formulas', $(this).data('id'));
            if (formula) self._openFormulaModal(formula);
        });

        $(document).off('click.flist-del').on('click.flist-del', '.delete-formula-btn', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            confirmAction('Supprimer la formule', `Supprimer « ${id} » ?`, () => {
                Store.remove('formulas', id);
                self.render($('#page-content'));
            });
        });
    },

    _openFormulaModal(existing) {
        const self = this;
        const isEdit = !!existing;
        const prestations = isEdit ? [...existing.prestations] : [];

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? 'Modifier la formule' : 'Nouvelle formule'}</h2>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:18px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Identifiant</label>
                        <input type="text" id="formula-id" value="${isEdit ? escHtml(existing.id) : ''}" ${isEdit ? 'readonly style="opacity:0.6"' : ''} />
                    </div>
                    <div class="form-group">
                        <label>Label</label>
                        <input type="text" id="formula-label" value="${isEdit ? escHtml(existing.label) : ''}" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="formula-desc">${isEdit ? escHtml(existing.description) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Statut</label>
                    <div class="radio-group">
                        <label><input type="radio" name="formula-active" value="true" ${!isEdit || existing.isActive ? 'checked' : ''} /><span>Actif</span></label>
                        <label><input type="radio" name="formula-active" value="false" ${isEdit && !existing.isActive ? 'checked' : ''} /><span>Inactif</span></label>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <h3 class="panel-title">Prestations</h3>
                            <p class="panel-subtitle">${prestations.length} ligne${prestations.length > 1 ? 's' : ''}</p>
                        </div>
                        <button class="btn btn-sm btn-light" id="add-presta-btn">+ Ajouter</button>
                    </div>
                    <div class="panel-body" id="presta-list">
                        ${prestations.length > 0
                            ? prestations.map((p, i) => `
                                <div class="list-row div-condition" data-idx="${i}">
                                    <div class="condition-main" style="gap:8px;">
                                        <input type="text" class="presta-label" data-idx="${i}" value="${escHtml(p.label)}" placeholder="Label" style="flex:1;padding:6px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;" />
                                        <input type="number" class="presta-amount" data-idx="${i}" value="${p.amount}" placeholder="Montant" style="width:100px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;" />
                                        <span style="font-size:13px;color:var(--muted);">€</span>
                                    </div>
                                    <div class="condition-actions">
                                        <button class="action-btn danger del-presta-btn" data-idx="${i}" title="Supprimer">✕</button>
                                    </div>
                                </div>
                            `).join('')
                            : '<p style="color:var(--muted);font-size:13px;margin:0;">Aucune prestation</p>'}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="save-formula-btn">Enregistrer</button>
            </div>
        `);

        // Add prestation row
        $('#add-presta-btn').on('click', () => {
            prestations.push({ type: '', label: '', amount: 0, formula: '' });
            // Re-open to refresh
            if (isEdit) {
                existing.prestations = prestations;
            }
            closeModal();
            self._openFormulaModal(isEdit ? existing : { id: $('#formula-id').val(), label: $('#formula-label').val(), description: $('#formula-desc').val(), isActive: $('input[name="formula-active"]:checked').val() === 'true', prestations });
        });

        // Delete prestation
        $(document).off('click.fdelp').on('click.fdelp', '.del-presta-btn', function () {
            const idx = parseInt($(this).data('idx'));
            prestations.splice(idx, 1);
            if (isEdit) existing.prestations = prestations;
            closeModal();
            self._openFormulaModal(isEdit ? existing : { id: $('#formula-id').val(), label: $('#formula-label').val(), description: $('#formula-desc').val(), isActive: true, prestations });
        });

        // Save
        $('#save-formula-btn').on('click', () => {
            const id = $('#formula-id').val().trim();
            const label = $('#formula-label').val().trim();
            const desc = $('#formula-desc').val().trim();
            const isActive = $('input[name="formula-active"]:checked').val() === 'true';

            if (!id) { $('#formula-id').focus(); return; }

            // Collect updated prestation values
            $('#presta-list .list-row').each(function () {
                const idx = parseInt($(this).data('idx'));
                if (prestations[idx]) {
                    prestations[idx].label = $(this).find('.presta-label').val().trim();
                    prestations[idx].amount = parseFloat($(this).find('.presta-amount').val()) || 0;
                }
            });

            if (isEdit) {
                existing.label = label;
                existing.description = desc;
                existing.isActive = isActive;
                existing.prestations = prestations;
                Store.upsert('formulas', existing);
            } else {
                if (Store.findById('formulas', id)) {
                    alert('Une formule avec cet identifiant existe déjà.');
                    return;
                }
                Store.upsert('formulas', { id, label, description: desc, isActive, prestations });
            }

            closeModal();
            self.render($('#page-content'));
        });
    },
};

/* ══════════════════════════════════════════════════════════════
   Page — Liste des schémas de calcul (cards grid)
   ══════════════════════════════════════════════════════════════ */
const SchemaListPage = {

    render($container) {
        const schemas = Store.getAll('schemas');

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <div>
                        <h1 class="page-title">Schémas de calcul</h1>
                        <p class="page-subtitle">${schemas.length} schéma${schemas.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-primary" id="add-schema-btn">+ Nouveau schéma</button>
                </div>
            </div>
            <div class="page-scroll">
                <div class="cards-grid" id="schema-cards">
                    ${schemas.length === 0
                        ? '<div class="empty-state"><p>Aucun schéma de calcul</p></div>'
                        : schemas.map(s => this._renderCard(s)).join('')}
                </div>
            </div>
        `);

        this._bindEvents();
    },

    _renderCard(schema) {
        const varNodes = schema.nodes.filter(n => n.type === 'variable').length;
        const formNodes = schema.nodes.filter(n => n.type === 'formula').length;
        return `
            <div class="card" data-schema-id="${escHtml(schema.id)}">
                <div class="card-header">
                    <div class="card-icon schema">📐</div>
                    <div class="card-actions">
                        <button class="action-btn edit-schema-btn" data-id="${escHtml(schema.id)}" title="Modifier">✎</button>
                        <button class="action-btn danger delete-schema-btn" data-id="${escHtml(schema.id)}" title="Supprimer">✕</button>
                    </div>
                </div>
                <h3 class="card-title">${escHtml(schema.id)}</h3>
                <p class="card-description">${escHtml(schema.description)}</p>
                <div class="card-tags">
                    ${schema.products.map(p => `<span class="tag">${escHtml(p)}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="card-stat"><strong>${varNodes}</strong> variable${varNodes > 1 ? 's' : ''} · <strong>${formNodes}</strong> formule${formNodes > 1 ? 's' : ''}</span>
                    <button class="btn btn-sm btn-primary open-schema-editor-btn" data-id="${escHtml(schema.id)}">Ouvrir l'éditeur →</button>
                </div>
            </div>
        `;
    },

    _bindEvents() {
        const self = this;

        $(document).off('click.slist-open').on('click.slist-open', '.open-schema-editor-btn', function (e) {
            e.stopPropagation();
            navigate('#schema-editor/' + $(this).data('id'));
        });

        $(document).off('click.slist-card').on('click.slist-card', '.card[data-schema-id]', function (e) {
            if ($(e.target).closest('.action-btn, .open-schema-editor-btn').length) return;
            navigate('#schema-editor/' + $(this).data('schema-id'));
        });

        $(document).off('click.slist-add').on('click.slist-add', '#add-schema-btn', () => self._openSchemaModal());

        $(document).off('click.slist-edit').on('click.slist-edit', '.edit-schema-btn', function (e) {
            e.stopPropagation();
            const schema = Store.findById('schemas', $(this).data('id'));
            if (schema) self._openSchemaModal(schema);
        });

        $(document).off('click.slist-del').on('click.slist-del', '.delete-schema-btn', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            confirmAction('Supprimer le schéma', `Supprimer « ${id} » ?`, () => {
                Store.remove('schemas', id);
                self.render($('#page-content'));
            });
        });
    },

    _openSchemaModal(existing) {
        const self = this;
        const isEdit = !!existing;

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">${isEdit ? 'Modifier le schéma' : 'Nouveau schéma'}</h2>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Identifiant</label>
                    <input type="text" id="schema-id" value="${isEdit ? escHtml(existing.id) : ''}" ${isEdit ? 'readonly style="opacity:0.6"' : ''} placeholder="ex: SCH_DN" />
                </div>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" id="schema-label" value="${isEdit ? escHtml(existing.label) : ''}" />
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="schema-desc">${isEdit ? escHtml(existing.description) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Produits (séparés par des virgules)</label>
                    <input type="text" id="schema-products" value="${isEdit ? existing.products.join(', ') : ''}" />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="save-schema-btn">Enregistrer</button>
            </div>
        `);

        $('#save-schema-btn').on('click', () => {
            const id = $('#schema-id').val().trim();
            if (!id) { $('#schema-id').focus(); return; }
            const label = $('#schema-label').val().trim();
            const desc = $('#schema-desc').val().trim();
            const products = $('#schema-products').val().split(',').map(s => s.trim()).filter(Boolean);

            if (isEdit) {
                existing.label = label;
                existing.description = desc;
                existing.products = products;
                Store.upsert('schemas', existing);
            } else {
                if (Store.findById('schemas', id)) {
                    alert('Un schéma avec cet identifiant existe déjà.');
                    return;
                }
                const schema = Models.createSchema(id, label, desc, products);
                Store.upsert('schemas', schema);
            }

            closeModal();
            self.render($('#page-content'));
        });
    },
};

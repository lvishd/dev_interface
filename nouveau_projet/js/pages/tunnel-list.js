/* ══════════════════════════════════════════════════════════════
   Page — Liste des tunnels (cards grid + CRUD)
   ══════════════════════════════════════════════════════════════ */
const TunnelListPage = {

    render($container) {
        const tunnels = Store.getAll('tunnels');

        $container.html(`
            <div class="page-toolbar">
                <div class="page-toolbar-left">
                    <div>
                        <h1 class="page-title">Tunnels d'inscription</h1>
                        <p class="page-subtitle">${tunnels.length} tunnel${tunnels.length > 1 ? 's' : ''} configuré${tunnels.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="page-toolbar-right">
                    <button class="btn btn-primary" id="add-tunnel-btn">+ Nouveau tunnel</button>
                </div>
            </div>
            <div class="page-scroll">
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-label">Total tunnels</div>
                        <div class="stat-value">${tunnels.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total blocs</div>
                        <div class="stat-value">${tunnels.reduce((s, t) => s + t.blocks.length, 0)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Produits couverts</div>
                        <div class="stat-value">${[...new Set(tunnels.flatMap(t => t.products))].length}</div>
                    </div>
                </div>
                <div class="cards-grid" id="tunnel-cards">
                    ${tunnels.length === 0
                        ? '<div class="empty-state"><p>Aucun tunnel configuré</p><button class="btn btn-primary" id="add-tunnel-btn-empty">+ Créer un tunnel</button></div>'
                        : tunnels.map(t => this._renderCard(t)).join('')}
                </div>
            </div>
        `);

        this._bindEvents();
    },

    _renderCard(tunnel) {
        const blockCount = tunnel.blocks.filter(b => b.type !== 'initial' && b.type !== 'final').length;
        const transCount = tunnel.transitions.length;
        return `
            <div class="card" data-tunnel-id="${escHtml(tunnel.id)}">
                <div class="card-header">
                    <div class="card-icon tunnel">🔀</div>
                    <div class="card-actions">
                        <button class="action-btn edit-tunnel-btn" data-id="${escHtml(tunnel.id)}" title="Modifier">✎</button>
                        <button class="action-btn danger delete-tunnel-btn" data-id="${escHtml(tunnel.id)}" title="Supprimer">✕</button>
                    </div>
                </div>
                <h3 class="card-title">${escHtml(tunnel.id)}</h3>
                <p class="card-description">${escHtml(tunnel.description)}</p>
                <div class="card-tags">
                    ${tunnel.products.map(p => `<span class="tag">${escHtml(p)}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="card-stat"><strong>${blockCount}</strong> bloc${blockCount > 1 ? 's' : ''} · <strong>${transCount}</strong> transition${transCount > 1 ? 's' : ''}</span>
                    <button class="btn btn-sm btn-primary open-editor-btn" data-id="${escHtml(tunnel.id)}">Ouvrir l'éditeur →</button>
                </div>
            </div>
        `;
    },

    _bindEvents() {
        const self = this;

        // Open editor
        $(document).off('click.tlist-open').on('click.tlist-open', '.open-editor-btn', function (e) {
            e.stopPropagation();
            navigate('#tunnel-editor/' + $(this).data('id'));
        });

        // Card click = open editor
        $(document).off('click.tlist-card').on('click.tlist-card', '.card[data-tunnel-id]', function (e) {
            if ($(e.target).closest('.action-btn, .open-editor-btn').length) return;
            navigate('#tunnel-editor/' + $(this).data('tunnel-id'));
        });

        // Add tunnel
        $(document).off('click.tlist-add').on('click.tlist-add', '#add-tunnel-btn, #add-tunnel-btn-empty', function () {
            self._openTunnelModal();
        });

        // Edit tunnel
        $(document).off('click.tlist-edit').on('click.tlist-edit', '.edit-tunnel-btn', function (e) {
            e.stopPropagation();
            const tunnel = Store.findById('tunnels', $(this).data('id'));
            if (tunnel) self._openTunnelModal(tunnel);
        });

        // Delete tunnel
        $(document).off('click.tlist-del').on('click.tlist-del', '.delete-tunnel-btn', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            confirmAction('Supprimer le tunnel', `Voulez-vous vraiment supprimer le tunnel « ${id} » ?`, () => {
                Store.remove('tunnels', id);
                self.render($('#page-content'));
            });
        });
    },

    _openTunnelModal(existing) {
        const isEdit = !!existing;
        const title = isEdit ? 'Modifier le tunnel' : 'Nouveau tunnel';

        openModal(`
            <button class="close-modal" onclick="closeModal()">×</button>
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <p class="modal-subtitle">${isEdit ? 'Modifier les propriétés du tunnel' : 'Créer un nouveau tunnel d\'inscription'}</p>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Identifiant</label>
                    <input type="text" id="tunnel-id" value="${isEdit ? escHtml(existing.id) : ''}" ${isEdit ? 'readonly style="opacity:0.6"' : ''} placeholder="ex: DN, DGE..." />
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="tunnel-desc" placeholder="Description du tunnel...">${isEdit ? escHtml(existing.description) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Produits (séparés par des virgules)</label>
                    <input type="text" id="tunnel-products" value="${isEdit ? existing.products.join(', ') : ''}" placeholder="ex: L1-DROIT, L2-DROIT" />
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal()">Annuler</button>
                <button class="btn btn-primary" id="save-tunnel-btn">Enregistrer</button>
            </div>
        `);

        const self = this;
        $('#save-tunnel-btn').on('click', function () {
            const id = $('#tunnel-id').val().trim();
            const desc = $('#tunnel-desc').val().trim();
            const products = $('#tunnel-products').val().split(',').map(s => s.trim()).filter(Boolean);

            if (!id) { $('#tunnel-id').focus(); return; }

            if (isEdit) {
                existing.description = desc;
                existing.products = products;
                Store.upsert('tunnels', existing);
            } else {
                if (Store.findById('tunnels', id)) {
                    alert('Un tunnel avec cet identifiant existe déjà.');
                    return;
                }
                const tunnel = Models.createTunnel(id, desc, products);
                // Add default FIN block
                tunnel.blocks.push({ id: 'FIN', label: 'FIN', type: 'final' });
                tunnel.transitions.push(Models.createTransition('DEBUT', 'FIN', '', 1));
                Store.upsert('tunnels', tunnel);
            }

            closeModal();
            self.render($('#page-content'));
        });
    },
};

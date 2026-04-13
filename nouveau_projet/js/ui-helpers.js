/* ══════════════════════════════════════════════════════════════
   UI Helpers — Modal, navigation, badges, utilities
   ══════════════════════════════════════════════════════════════ */

/* ── Modal management ── */
function openModal(contentHtml) {
    $('#app-modal-content').html(contentHtml);
    $('#app-modal').removeClass('hidden');
}

function closeModal() {
    $('#app-modal').addClass('hidden');
    $('#app-modal-content').html('');
}

function openModal2(contentHtml) {
    $('#app-modal-2-content').html(contentHtml);
    $('#app-modal-2').removeClass('hidden');
}

function closeModal2() {
    $('#app-modal-2').addClass('hidden');
    $('#app-modal-2-content').html('');
}

/* ── Navigation ── */
function navigate(hash) {
    window.location.hash = hash;
}

function updateActiveNav(page) {
    $('.nav-item').removeClass('active');
    $(`.nav-item[data-page="${page}"]`).addClass('active');
}

/* ── Badge helpers ── */
function typeBadge(type) {
    const labels = {
        formulaire: 'Formulaire',
        tarif: 'Tarif',
        paiement: 'Paiement',
        upload: 'Upload',
        information: 'Information',
        initial: 'Début',
        final: 'Fin',
        variable: 'Variable',
        formula: 'Formule',
    };
    return `<span class="badge badge-${type}">${labels[type] || type}</span>`;
}

function sourceBadge(source) {
    const labels = {
        produit: 'Produit',
        dossier: 'Dossier / FP',
        reponse_etudiant: 'Réponse étudiant',
        globale: 'Globale',
    };
    return `<span class="badge badge-source">${labels[source] || source}</span>`;
}

function statusBadge(isActive) {
    return isActive
        ? '<span class="badge badge-active">Actif</span>'
        : '<span class="badge badge-inactive">Inactif</span>';
}

/* ── Confirm dialog ── */
function confirmAction(title, message, onConfirm) {
    openModal2(`
        <button class="close-modal" onclick="closeModal2()">×</button>
        <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            <p class="modal-subtitle">${message}</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-light" onclick="closeModal2()">Annuler</button>
            <button class="btn btn-danger" id="confirm-action-btn">Confirmer</button>
        </div>
    `);
    $('#confirm-action-btn').on('click', function () {
        closeModal2();
        onConfirm();
    });
}

/* ── ID sanitizer ── */
function cleanId(mermaidId) {
    return mermaidId.replace(/^flowchart-/, '').replace(/-\d+$/, '');
}

/* ── Unique ID generator ── */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/* ── Escape HTML ── */
function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

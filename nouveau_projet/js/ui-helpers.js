/* ══════════════════════════════════════════════════════════════
   UI Helpers — Modal, navigation, badges, utilities
   ══════════════════════════════════════════════════════════════ */

/* ── Modal management ── */
function openModal(contentHtml, opts) {
    const $c = $('#app-modal-content');
    $c.html(contentHtml);
    $c.toggleClass('wide', !!(opts && opts.wide));
    $('#app-modal').removeClass('hidden');
}

function closeModal() {
    $('#app-modal').addClass('hidden');
    $('#app-modal-content').removeClass('wide').html('');
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
        step: 'Étape',
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

/* ── Export Mermaid SVG → PNG ──
   containerSelector : sélecteur du <div> contenant le <svg> Mermaid
   filename          : nom du fichier téléchargé (sans extension)          */
function exportMermaidPng(containerSelector, filename) {
    const svgEl = document.querySelector(containerSelector + ' svg');
    if (!svgEl) { alert('Aucun diagramme à exporter.'); return; }

    // bbox réelle du contenu (insensible au pan/zoom)
    const liveViewport = svgEl.querySelector('.svg-pan-zoom_viewport') || svgEl;
    const bbox = liveViewport.getBBox();
    const padding = 20;
    const w = bbox.width  + padding * 2;
    const h = bbox.height + padding * 2;

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

    // Retire les contrôles svgPanZoom (+ / RESET / -)
    clone.querySelectorAll('#svg-pan-zoom-controls, .svg-pan-zoom-control').forEach(el => el.remove());

    // Neutralise le transform pan/zoom
    const cloneViewport = clone.querySelector('.svg-pan-zoom_viewport');
    if (cloneViewport) {
        cloneViewport.removeAttribute('transform');
        cloneViewport.removeAttribute('style');
    }

    const svgStr  = new XMLSerializer().serializeToString(clone);
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

    const scale  = 2;
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
        try {
            ctx.scale(scale, scale);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(blob => {
                if (!blob) { alert('Échec génération PNG.'); return; }
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.download = `${filename}.png`;
                a.href = blobUrl;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
            }, 'image/png');
        } catch (e) {
            console.error('[ExportPng] erreur :', e);
            alert('Erreur export PNG : ' + e.message);
        }
    };
    img.onerror = () => alert('Échec chargement SVG pour export.');
    img.src = dataUrl;
}

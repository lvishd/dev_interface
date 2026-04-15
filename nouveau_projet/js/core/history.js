/* ══════════════════════════════════════════════════════════════
   History — Undo/Redo stack (Ctrl+Z / Ctrl+Y)
   Snapshot global de toutes les collections gérées par Store.
   ══════════════════════════════════════════════════════════════ */
const History = {
    _undo: [],
    _redo: [],
    _max: 20,
    _suspended: false,
    _collections: ['tunnels', 'schemas', 'formulas', 'variables'],

    _snapshot() {
        const snap = {};
        this._collections.forEach(c => { snap[c] = Store.getAll(c); });
        return structuredClone(snap);
    },

    _restore(snap) {
        this._suspended = true;
        this._collections.forEach(c => { Store.save(c, snap[c]); });
        this._suspended = false;
    },

    /** À appeler AVANT chaque mutation pour sauvegarder l'état courant. */
    record() {
        if (this._suspended) return;
        this._undo.push(this._snapshot());
        if (this._undo.length > this._max) this._undo.shift();
        this._redo = [];
        this.updateButtons();
    },

    undo() {
        if (this._undo.length === 0) return;
        this._redo.push(this._snapshot());
        this._restore(this._undo.pop());
        this.updateButtons();
        if (typeof handleRoute === 'function') handleRoute();
    },

    redo() {
        if (this._redo.length === 0) return;
        this._undo.push(this._snapshot());
        this._restore(this._redo.pop());
        this.updateButtons();
        if (typeof handleRoute === 'function') handleRoute();
    },

    updateButtons() {
        $('#history-undo').prop('disabled', this._undo.length === 0);
        $('#history-redo').prop('disabled', this._redo.length === 0);
    },
};

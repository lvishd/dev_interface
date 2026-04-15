/* ══════════════════════════════════════════════════════════════
   Store — Persistence layer (localStorage)
   ══════════════════════════════════════════════════════════════ */
const Store = {
    _prefix: 'studio_',

    get(key) {
        try { return JSON.parse(localStorage.getItem(this._prefix + key)); }
        catch { return null; }
    },

    set(key, value) {
        localStorage.setItem(this._prefix + key, JSON.stringify(value));
    },

    getAll(collection) {
        return this.get(collection) || [];
    },

    save(collection, items) {
        if (typeof History !== 'undefined') History.record();
        this.set(collection, items);
    },

    findById(collection, id) {
        return this.getAll(collection).find(item => item.id === id) || null;
    },

    upsert(collection, item) {
        if (typeof History !== 'undefined') History.record();
        const items = this.getAll(collection);
        const idx = items.findIndex(i => i.id === item.id);
        if (idx >= 0) items[idx] = item;
        else items.push(item);
        this.set(collection, items);
    },

    remove(collection, id) {
        if (typeof History !== 'undefined') History.record();
        const items = this.getAll(collection).filter(i => i.id !== id);
        this.set(collection, items);
    },

    /** Initialise avec des données mock si le store est vide */
    initIfEmpty(collection, mockItems) {
        if (this.getAll(collection).length === 0) {
            this.set(collection, mockItems);
        }
    }
};

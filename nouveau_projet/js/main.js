/* ══════════════════════════════════════════════════════════════
   Main — Entry point
   Uses global vendor libs (jQuery, mermaid, svgPanZoom, Sortable)
   loaded from js/bundle/vendor.iife.js
   ══════════════════════════════════════════════════════════════ */

/* ── Graph Engine (exposed globally) ── */
window.graphEngine = {

    _panZoomInstances: {},

    /**
     * Extract the business node ID from a Mermaid SVG element.
     * Tries multiple strategies for robustness.
     */
    _extractId(el) {
        // Strategy 1: el.id like "mermaid-123-flowchart-MYID-0" or "flowchart-MYID-0"
        const rawId = el.id || "";
        if (rawId) {
            const m = rawId.match(/flowchart-(.+?)-\d+$/);
            if (m) return m[1];
        }
        // Strategy 2: data-id attribute (some mermaid versions)
        if (el.dataset && el.dataset.id) return el.dataset.id;
        // Strategy 3: nodeLabel text content
        const labelEl = el.querySelector(".nodeLabel");
        if (labelEl) {
            const text = labelEl.textContent.trim()
                .replace(/^[▶■📋💰💳📎ℹ️📝📐🔀💰✉🔗]\s*/u, "").trim();
            if (text) return text;
        }
        return "";
    },

    async render(containerSelector, mermaidStr, onNodeClick) {
        const container = document.querySelector(containerSelector);
        if (!container) { console.warn("[GraphEngine] Container not found:", containerSelector); return; }

        // Clean previous panZoom
        if (this._panZoomInstances[containerSelector]) {
            try { this._panZoomInstances[containerSelector].destroy(); } catch (_) {}
            delete this._panZoomInstances[containerSelector];
        }

        // Reset container
        container.removeAttribute("data-processed");
        container.innerHTML = "";
        container.textContent = mermaidStr;

        try {
            await mermaid.run({ nodes: [container] });
        } catch (err) {
            console.error("[GraphEngine] Mermaid render error:", err);
            container.innerHTML = `<div class="mermaid-error">Erreur Mermaid:\n${err.message || err}</div>`;
            return;
        }

        // Wait one animation frame to ensure SVG is fully in DOM
        await new Promise(resolve => requestAnimationFrame(resolve));

        const svg = container.querySelector("svg");
        if (!svg) { console.warn("[GraphEngine] No SVG found after render"); return; }

        console.log("[GraphEngine] SVG rendered successfully in", containerSelector);

        // Bind click events on nodes + clusters
        if (onNodeClick) {
            const self = this;
            const interactives = svg.querySelectorAll(".node, .cluster");
            console.log("[GraphEngine] Found", interactives.length, "interactive elements");

            interactives.forEach(el => {
                el.style.cursor = "pointer";
                el.style.pointerEvents = "all";

                el.addEventListener("click", function (e) {
                    e.stopPropagation();
                    const nodeId = self._extractId(el);
                    console.log("[GraphEngine] Click on node, extracted ID:", nodeId, "raw el.id:", el.id);
                    if (nodeId) onNodeClick(nodeId, el);
                });
            });
        }

        // SVG Pan Zoom
        if (typeof svgPanZoom !== "undefined") {
            try {
                this._panZoomInstances[containerSelector] = svgPanZoom(svg, {
                    zoomEnabled: true,
                    controlIconsEnabled: true,
                    fit: true,
                    center: true,
                    minZoom: 0.3,
                    maxZoom: 5,
                });
            } catch (pzErr) {
                console.warn("[GraphEngine] svgPanZoom error:", pzErr);
            }
        }
    },
};

/* ── SPA Router ── */
const routes = {
    tunnels:          typeof TunnelListPage !== "undefined" ? TunnelListPage : null,
    "tunnel-editor":  typeof TunnelEditorPage !== "undefined" ? TunnelEditorPage : null,
    "step-editor":    typeof StepEditorPage !== "undefined" ? StepEditorPage : null,
    schemas:          typeof SchemaListPage !== "undefined" ? SchemaListPage : null,
    "schema-editor":  typeof SchemaEditorPage !== "undefined" ? SchemaEditorPage : null,
    formulas:         typeof FormulasPage !== "undefined" ? FormulasPage : null,
    variables:        typeof VariablesPage !== "undefined" ? VariablesPage : null,
};

function handleRoute() {
    const hash = window.location.hash.replace(/^#/, "") || "tunnels";
    const parts = hash.split("/");
    const pageName = parts[0];
    const params = parts.slice(1);

    const page = routes[pageName];
    if (page && page.render) {
        page.render($("#page-content"), params);
    } else {
        $("#page-content").html('<div class="empty-state"><p>Page introuvable</p></div>');
    }

    updateActiveNav(pageName);
}

window.addEventListener("hashchange", handleRoute);

/* ── Init on DOM ready ── */
$(function () {
    mermaid.registerLayoutLoaders(window.elkLayouts);

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "default",
    });

    console.log("[Studio] Mermaid initialized, starting router");
    handleRoute();
});

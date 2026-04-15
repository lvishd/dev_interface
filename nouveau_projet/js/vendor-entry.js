/* ══════════════════════════════════════════════════════════════
   Vendor Entry — Build entry point (bundled by Vite into IIFE)
   Imports all npm dependencies and exposes them as globals
   so the app can run from file:// without a server.
   ══════════════════════════════════════════════════════════════ */
import jQuery from "jquery";
import svgPanZoom from "svg-pan-zoom";
import Sortable from "sortablejs";
import mermaid from "mermaid";
import elkLayouts from "@mermaid-js/layout-elk";
import Quill from "quill";
import quillCss from "quill/dist/quill.snow.css?inline";

window.$ = window.jQuery = jQuery;
window.svgPanZoom = svgPanZoom;
window.Sortable = Sortable;
window.mermaid = mermaid;
window.elkLayouts = elkLayouts;
window.Quill = Quill;

// Inject Quill CSS at runtime so the bundle stays single-file
if (quillCss && typeof document !== "undefined") {
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-source", "quill-snow");
    styleEl.textContent = quillCss;
    document.head.appendChild(styleEl);
}

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

window.$ = window.jQuery = jQuery;
window.svgPanZoom = svgPanZoom;
window.Sortable = Sortable;
window.mermaid = mermaid;
window.elkLayouts = elkLayouts;

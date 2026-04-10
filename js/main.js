import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs";
import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0.2.1/dist/mermaid-layout-elk.esm.min.mjs";

async function renderDiagram() {
    const graphMermaid = jsonToMermaid(graphJSON);

    error.textContent = "";
    preview.removeAttribute("data-processed");
    preview.innerHTML = "";
    preview.textContent = graphMermaid;

    try {
        await mermaid.run({ nodes: [preview] });

        const svgElement = document.querySelector("#preview svg");

        if (svgElement) {
            const interactives = svgElement.querySelectorAll(".node, .cluster");

            interactives.forEach((el) => {
                el.addEventListener("click", (e) => {
                    e.stopPropagation();

                    const $modal = $("#modal-manage-node");
                    const $questions = $modal.find("#box-questions");
                    const $conditions = $modal.find("#box-conditions");
                    const $finalSuffixe = $modal.find("#node-type-final");
                    const $emailBox = $modal.find("#box-email-template");
                    const $tunnelBox = $modal.find("#box-tunnel-config");
                    const $saveBtn = $modal.find("#saveBtn");
                    const $deleteBtn = $modal.find("#deleteBtn");

                    // default UI state
                    $questions.show();
                    $conditions.show();
                    $finalSuffixe.hide();
                    $emailBox.hide();
                    $tunnelBox.hide();
                    $saveBtn.prop("disabled", false);
                    $deleteBtn.prop("disabled", false);
                    $modal.find(".stats").show();

                    let id = null;
                    const isNode = el.classList.contains("node");
                    const isFinal = el.classList.contains("final");
                    const isEmail = el.classList.contains("email_node");
                    const isTunnel = el.classList.contains("tunnel_node");

                    if (isNode) {
                        const label = el.querySelector(".nodeLabel p")?.textContent.trim();

                        if (label === "DEBUT") {
                            id = label;
                            $questions.hide();
                            $deleteBtn.prop("disabled", true);
                        } else if (!isFinal && !isEmail && !isTunnel) {
                            const parentClass = [...el.classList].find(c => c.startsWith("parent_"));
                            id = parentClass?.replace("parent_", "");
                        } else {
                            // final, email or tunnel node - extract id from label
                            id = label?.replace("✉ ", "");
                        }
                    } else {
                        id = el.getAttribute("id");
                        if (id === "[object Object]") {
                            id = $(el).find(".nodeLabel p").text();
                        }
                    }

                    if (!id) return;

                    const node = graphJSON.nodes.find(n => n.id === id);
                    const nodeType = node ? node.type : (isFinal ? "final" : "etape");

                    let suffix = "";
                    if (nodeType === "final") {
                        $finalSuffixe.show();
                        $questions.hide();
                        $conditions.hide();
                        $modal.find(".stats").hide();
                        $saveBtn.prop("disabled", true);
                    } else if (nodeType === "email") {
                        $questions.hide();
                        $emailBox.show();
                        initEmailEditor(node);
                    } else if (nodeType === "tunnel") {
                        $questions.hide();
                        $conditions.hide();
                        $tunnelBox.show();
                        $("#tunnelTarget").val(node.tunnelTarget || "");
                    }

                    $modal.find("#node-id").text(`${id}${suffix}`);

                    currentNodeId = id;
                    initModalQuestions(id);
                    initModalConditions(id);
                    updateStats();
                    showModal("#modal-manage-node");
                });
            });

            svgPanZoom(svgElement, {
                zoomEnabled: true,
                controlIconsEnabled: true,
                fit: true,
                center: true,
            });
        }
    } catch (e) {
        error.textContent = e?.message || String(e);
        console.error(e);
    }
}

// Expose renderDiagram globally so other scripts can call it
window.renderDiagram = renderDiagram;

$(document).ready(function () {
    mermaid.registerLayoutLoaders(elkLayouts);

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "default",
    });

    initEvents();
    initAutocomplete();
    renderDiagram();
});

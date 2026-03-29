import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs";

function resetGraph() {
    graphJSON = {
        questions: [],
        nodes: [
            {
                id: "debut",
                label: "DEBUT",
                type: "initial",
                questions: [],
            },
        ],
        transitions: [],
    };
    renderDiagram();
}

function cleanId(mermaidId) {
    return mermaidId.replace(/^flowchart-/, "").replace(/-[0-9]+$/, "");
}

async function renderDiagram() {
    const graphMermaid = jsonToMermaid(graphJSON);

    error.textContent = "";
    preview.removeAttribute("data-processed");
    preview.innerHTML = "";
    preview.textContent = graphMermaid;

    source.value = graphMermaid;

    try {
        await mermaid.run({ nodes: [preview] });

        const svgElement = document.querySelector("#preview svg");

        if (svgElement) {
            const interactives = svgElement.querySelectorAll(".cluster");

            interactives.forEach((el) => {
                el.addEventListener("click", function (e) {
                    e.stopPropagation();

                    const rawId = el.getAttribute("id");
                    if (rawId) {
                        $("#modal-manage-node #node-id").html(rawId);

                        initModalConditions(rawId);

                        $("#modal-manage-node").removeClass("hidden");
                    }
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

function jsonToMermaid(data) {
    let mermaid = "graph TD\n";

    // --- QUESTIONS ---
    mermaid += "    %% questions\n";
    data.questions
        ?.sort((a, b) => a.order - b.order)
        .forEach((q) => {
            const answers = q.resValues.map((v) => v[0]).join("/");
            mermaid += `    ${q.id}["${q.questionNb} : ${q.title}<br/> ${q.body} <br/>(${answers})"]\n`;
        });

    // --- NODES ---
    mermaid += "\n    %% nodes\n";

    data.nodes?.forEach((node) => {
        if (node.type === "initial") {
            mermaid += `    ${node.id}((${node.label}))\n`;
        } else if (node.type === "final") {
            mermaid += `    ${node.id}[${node.id}]\n`;
        } else if (node.type === "etape") {
            mermaid += `\n    subgraph ${node.id}\n`;
            mermaid += `        direction LR\n`;

            if (node.questions && node.questions.length > 0) {
                mermaid += "        " + node.questions.join("~~~~") + "\n";
            }

            mermaid += "    end\n";
        }
    });

    // --- TRANSITIONS ---
    mermaid += "\n    %% transitions\n";

    data.transitions
        ?.sort((a, b) => a.order - b.order)
        .forEach((t) => {
            let label = "";

            if (t.condition) {
                label = ` -- "${t.order}/<br/> ${t.condition}" --> `;
            } else {
                label = " --> ";
            }

            mermaid += `    ${t.source}${label}${t.target}\n`;
        });

    // --- CLASSES ---
    mermaid += "\n    %% appartenance aux classes\n";

    data.nodes?.forEach((node) => {
        if (node.type === "final") {
            mermaid += `    class ${node.id} final\n`;
        }
    });

    return mermaid;
}

function addNode(node) {
    graphJSON.nodes.push(node);
}

function createConditionRow(nodeIdsList = []) {
    const $row = $(`
        <div class="list-row div-condition">
            <span class="condition-str"></span>
            <select class="select-available-nodes"></select>
            <button class="modify-condition">M</button>
            <button class="delete-condition">X</button>
        </div>
    `);

    const $select = $row.find(".select-available-nodes");

    nodeIdsList.forEach((id) => {
        $select.append(
            $("<option>", {
                value: id,
                text: id,
            }),
        );
    });

    return $row;
}

function addConditionRow(elem) {
    $("#container-conditions").append(elem);
}

function initModalConditions(nodeId) {
    const nodesIdsList = getNodeIdsList();

    $("#modal-manage-node #container-conditions").empty();

    graphJSON.transitions.forEach((transition) => {
        if (transition.source === nodeId) {
            const $row = createConditionRow(nodesIdsList);

            const $select = $row.find(".select-available-nodes");
            $select.val(transition.target);

            addConditionRow($row);
        }
    });
}

function getNodeIdsList() {
    return graphJSON.nodes.map((node) => node.id);
}

function buildTransitions(nodeId) {
    $(".div-condition").each(function (index) {
        const $div = $(this);

        const conditionText = $div.find(".condition-str").text().trim();
        const selectedTarget = $div.find(".select-available-nodes").val();

        const transition = {
            source: nodeId,
            target: selectedTarget,
            condition: conditionText,
            order: index + 1,
        };

        graphJSON.transitions.push(transition);
    });
}

function deleteTransitions(source2delete) {
    graphJSON.transitions = graphJSON.transitions.filter((t) => t.source !== source2delete);
}

function deleteNode(node2delete) {
    graphJSON.nodes = graphJSON.nodes.filter((node) => {
        return node.id !== node2delete;
    });

    graphJSON.transitions = graphJSON.transitions.filter((transition) => {
        return transition.source !== node2delete && transition.target !== node2delete;
    });
}

function saveNode(nodeId) {
    // questions

    // transitions
    // les transitions du node sont maj de zéro
    deleteTransitions(nodeId);
    buildTransitions(nodeId);
}

$(document).ready(function () {
    mermaid.registerLayoutLoaders(elkLayouts);

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "default",
    });

    const source = document.getElementById("source");
    const preview = document.getElementById("preview");
    const error = document.getElementById("error");
    const btn = document.getElementById("renderBtn");

    renderDiagram();

    $("#reset-graph").on("click", function () {
        resetGraph();
    });

    $("#add-node-btn").on("click", function () {
        $("#modal-add-node").removeClass("hidden");
        $("#nodeId").val("");
        $('input[name="type"][value="etape"]').prop("checked", true);
    });

    $("#modal-add-node #cancelBtn").on("click", function () {
        $("#modal-add-node").addClass("hidden");
    });

    $("#modal-add-node #createBtn").on("click", function () {
        const id = $("#nodeId").val().trim();
        const type = $('input[name="type"]:checked').val();

        if (!id) {
            alert("ID requis");
            return;
        }

        let questions = [];
        if (type === "etape") {
            questions = [`initialiser_${id}`];
        }

        const newNode = {
            id: id,
            label: "",
            type: type,
            questions: questions,
        };

        addNode(newNode);
        renderDiagram();

        $("#modal-add-node").addClass("hidden");
    });

    $("#modal-manage-node #cancelBtn").on("click", function () {
        $("#modal-manage-node").addClass("hidden");
    });

    $("#modal-manage-node #saveBtn").on("click", function () {
        const nodeId = $("#modal-manage-node #node-id").text();
        saveNode(nodeId);
        renderDiagram();
        $("#modal-manage-node").addClass("hidden");
    });

    $("#modal-manage-node #deleteBtn").on("click", function () {
        const nodeId = $("#modal-manage-node #node-id").text();
        deleteNode(nodeId);
        renderDiagram();
        $("#modal-manage-node").addClass("hidden");
    });

    new Sortable($("#modal-manage-node #container-questions")[0], {
        animation: 150,
        ghostClass: "sortable-ghost",

        onEnd: function () {
            //
        },
    });

    new Sortable($("#modal-manage-node #container-conditions")[0], {
        animation: 150,
        ghostClass: "sortable-ghost",

        onEnd: function () {
            //
        },
    });

    $(document).on("click", ".div-condition .delete-condition", function () {
        let $button = $(this);
        $button.closest(".div-condition").remove();
    });

    $(document).on("click", ".div-condition .modify-condition", function () {
        currentConditionSpan = $(this).closest(".div-condition").find(".condition-str");

        const currentText = currentConditionSpan.text().trim();
        $("#modal-modify-condition input").val(currentText);

        $("#modal-modify-condition").removeClass("hidden");
    });

    $("#modal-modify-condition #saveBtn").on("click", function () {
        const newValue = $("#modal-modify-condition input").val();

        if (currentConditionSpan) {
            currentConditionSpan.text(newValue);
            currentConditionSpan = null;
        }

        $("#modal-modify-condition").addClass("hidden");
    });

    $("#modal-modify-condition #cancelBtn").on("click", function () {
        $("#modal-modify-condition").addClass("hidden");
    });

    $("#modal-manage-node #add-condition-btn").on("click", function () {
        const nodeIdsList = getNodeIdsList();
        const conditionRow = createConditionRow(nodeIdsList);
        addConditionRow(conditionRow);
    });
});

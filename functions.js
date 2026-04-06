import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs";
import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0.2.1/dist/mermaid-layout-elk.esm.min.mjs";

function resetGraph() {
    // deux possibilités: recommencer le graphe ou bien revenir en arrière
    // saveStacks();
    undoStack = [];
    redoStack = [];
    graphJSON = {
        questions: [],
        nodes: [
            {
                id: "DEBUT",
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
                    const $saveBtn = $modal.find("#saveBtn");
                    const $deleteBtn = $modal.find("#deleteBtn");

                    // default UI state
                    $questions.show();
                    $conditions.show();
                    $finalSuffixe.hide();
                    $saveBtn.prop("disabled", false);
                    $deleteBtn.prop("disabled", false);

                    let id = null;
                    const isNode = el.classList.contains("node");
                    const isFinal = el.classList.contains("final");

                    if (isNode) {
                        const label = el.querySelector(".nodeLabel p")?.textContent.trim();

                        if (label === "DEBUT") {
                            id = label;
                            $questions.hide();
                            $deleteBtn.prop("disabled", true);
                        } else if (!isFinal) {
                            const parentClass = [...el.classList].find(c => c.startsWith("parent_"));
                            id = parentClass?.replace("parent_", "");
                        } else {
                            id = label;
                        }
                    } else {
                        id = el.getAttribute("id");
                        if (id === "[object Object]") {
                            id = $(el).find(".nodeLabel p").text();
                        }
                    }

                    if (!id) return;

                    let suffix = "";
                    if (isFinal) {
                        $finalSuffixe.show();
                        $questions.hide();
                        $conditions.hide();
                        $saveBtn.prop("disabled", true);
                    }

                    $modal.find("#node-id").text(`${id}${suffix}`);
                    
                    initModalQuestions(id);
                    initModalConditions(id);
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

function jsonToMermaid(data) {
    let mermaid = `---
config:
    layout: elk
---
graph TD
    classDef final fill:#c4eac6, stroke:#65ae6a;
    classDef starting_point fill:#bfe2ef, stroke:#6accee;\n\n`;

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
                mermaid +=
                    "        " +
                    node.questions
                        .map((q) => `${q}:::parent_${node.id}`)
                        .join("~~~~") +
                    "\n";
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
    mermaid += "    class DEBUT starting_point\n";

    data.nodes?.forEach((node) => {
        if (node.type === "final") {
            mermaid += `    class ${node.id} final\n`;
        }
    });

    return mermaid;
}

function addNode(node) {
    saveStacks();

    graphJSON.nodes.push(node);
}

function createConditionRow(transition) {
    const $row = $(`
        <div class="list-row div-condition">
            <span class="condition-str">${transition ? transition.condition : ""}</span>
            <select class="select-available-nodes"></select>
            <button class="modify-condition">M</button>
            <button class="delete-condition">X</button>
        </div>
    `);

    const $select = $row.find(".select-available-nodes");

    const nodesIdsList = getNodeIdsList();
    nodesIdsList.forEach((id) => {
        $select.append(
            $("<option>", {
                value: id,
                text: id,
            }),
        );
    });

    return $row;
}

function createQuestionRow(question) {
    const $row = $(`
        <div class="list-row div-question" data-question-id="${question.id}">
            <span class="question-str">${question.title}</span>
            <button class="delete-question">X</button>
        </div>
    `);

    return $row;
}

function addConditionRow(elem) {
    $("#container-conditions").append(elem);
}

function addQuestionRow(elem) {
    $("#container-questions").append(elem);
}

function initModalConditions(nodeId) {
    $("#modal-manage-node #container-conditions").empty();

    graphJSON.transitions.forEach((transition) => {
        if (transition.source === nodeId) {
            const $row = createConditionRow(transition);

            const $select = $row.find(".select-available-nodes");
            $select.val(transition.target);

            addConditionRow($row);
        }
    });
}

function initModalQuestions(nodeId) {
    $("#modal-manage-node #container-questions").empty();

    const node = graphJSON.nodes.find((n) => n.id === nodeId);
    const questionsIds = node.questions ?? [];

    questionsIds.forEach((questionId) => {
        const question = questionsBouchon.find((q) => q.id === questionId) ?? null;
        if (question == null) {
            return true;
        }
        const $row = createQuestionRow(question);

        addQuestionRow($row);
    });
}

function getNodeIdsList() {
    return graphJSON.nodes.map((node) => node.id);
}

function buildTransitionsJSON(nodeId) {
    $("#modal-manage-node .div-condition").each(function (index) {
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

function buildQuestionsJSON(nodeId) {
    const node = graphJSON.nodes.find((n) => n.id === nodeId);

    const $questions = $("#modal-manage-node .div-question");
    if ($questions.length == 0) {
        node.questions = [`initialiser_${nodeId}`];
    } else {
        $questions.each(function () {
            const $div = $(this);

            const questionId = $div.data("question-id");
            node.questions.push(questionId);

            const question = questionsBouchon.find((q) => q.id === questionId);

            if (!graphJSON.questions.some((q) => q.id === question.id)) {
                // push only if not exists in graphJSON.questions
                graphJSON.questions.push(question);
            }
        });
    }
}

function deleteQuestions(nodeId) {
    const node = graphJSON.nodes.find((n) => n.id === nodeId);
    node.questions = [];
}

function deleteUnusedQuestionsJSON() {
    // keep only the questions that are actually referenced in at least one node
    const usedQuestionIds = new Set(graphJSON.nodes.flatMap((node) => node.questions));

    graphJSON.questions = graphJSON.questions.filter((q) => usedQuestionIds.has(q.id));
}

function deleteTransitions(source2delete) {
    graphJSON.transitions = graphJSON.transitions.filter((t) => t.source !== source2delete);
}

function deleteNode(node2delete) {
    saveStacks();

    graphJSON.nodes = graphJSON.nodes.filter((node) => {
        return node.id !== node2delete;
    });

    graphJSON.transitions = graphJSON.transitions.filter((transition) => {
        return transition.source !== node2delete && transition.target !== node2delete;
    });
}

function saveNode(nodeId) {
    saveStacks();

    // questions
    // les questions du node sont maj de zéro
    deleteQuestions(nodeId);
    buildQuestionsJSON(nodeId);
    deleteUnusedQuestionsJSON();

    // transitions
    // les transitions du node sont maj de zéro
    deleteTransitions(nodeId);
    buildTransitionsJSON(nodeId);
}

function showModal(id) {
    $(id).removeClass("hidden");
}

function hideModal(id) {
    $(id).addClass("hidden");
}

function initModalQuestionsDisponibles() {
    $("#questions-disponibles").empty();
    questionsBouchon.forEach((question) => {
        const $button = $("<button>", {
            text: `${question.id} : ${question.title}`,
        }).on("click", function () {
            const questionRow = createQuestionRow(question);
            addQuestionRow(questionRow);
            hideModal("#modal-add-question");
        });
        $("#questions-disponibles").append($button);
    });
}

function undo() {
    if (undoStack.length === 0) return;

    redoStack.push(structuredClone(graphJSON));
    graphJSON = undoStack.pop();
    renderDiagram();
}

function redo() {
    if (redoStack.length === 0) return;

    undoStack.push(structuredClone(graphJSON));
    graphJSON = redoStack.pop();
    renderDiagram();
}

function saveStacks() {
    undoStack.push(structuredClone(graphJSON));
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }
    redoStack = [];
}

$(document).ready(function () {
    mermaid.registerLayoutLoaders(elkLayouts);

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "default",
    });

    renderDiagram();

    $("#reset-graph").on("click", function () {
        resetGraph();
    });

    $("#add-node-btn").on("click", function () {
        showModal("#modal-add-node");
        $("#nodeId").val("");
        $('input[name="type"][value="etape"]').prop("checked", true);
    });

    $("#modal-add-node #cancelBtn").on("click", function () {
        hideModal("#modal-add-node");
    });

    $("#modal-add-node #createBtn").on("click", function () {
        const id = $("#nodeId").val().trim();

        const existingIds = graphJSON.nodes.map(n => n.id);
        if (existingIds.includes(id)) {
            alert("Cet ID existe déjà");
            return;
        }
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

        hideModal("#modal-add-node");
    });

    $("#modal-manage-node #cancelBtn").on("click", function () {
        hideModal("#modal-manage-node");
    });

    $("#modal-manage-node #saveBtn").on("click", function () {
        const nodeId = $("#modal-manage-node #node-id").text().trim();
        saveNode(nodeId);
        renderDiagram();
        hideModal("#modal-manage-node");
    });

    $("#modal-manage-node #deleteBtn").on("click", function () {
        const nodeId = $("#modal-manage-node #node-id").text();
        deleteNode(nodeId);
        deleteUnusedQuestionsJSON();
        renderDiagram();
        hideModal("#modal-manage-node");
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

    $(document).on("click", ".div-question .delete-question", function () {
        let $button = $(this);
        $button.closest(".div-question").remove();
    });

    $(document).on("click", ".div-condition .modify-condition", function () {
        currentConditionSpan = $(this).closest(".div-condition").find(".condition-str");

        const currentText = currentConditionSpan.text().trim();
        $("#modal-modify-condition input").val(currentText);

        showModal("#modal-modify-condition");
    });

    $("#modal-modify-condition #saveBtn").on("click", function () {
        const newValue = $("#modal-modify-condition input").val();

        if (currentConditionSpan) {
            currentConditionSpan.text(newValue);
            currentConditionSpan = null;
        }

        hideModal("#modal-modify-condition");
    });

    $("#modal-modify-condition #cancelBtn").on("click", function () {
        hideModal("#modal-modify-condition");
    });

    $("#modal-manage-node #add-condition-btn").on("click", function () {
        const conditionRow = createConditionRow();
        addConditionRow(conditionRow);
    });

    $("#modal-manage-node #add-question-btn").on("click", function () {
        initModalQuestionsDisponibles();
        showModal("#modal-add-question");
    });

    $("#modal-add-question #cancelBtn").on("click", function () {
        hideModal("#modal-add-question");
    });

    $("#undo-graph-btn").on("click", function () {
        undo();
    });

    $("#redo-graph-btn").on("click", function () {
        redo();
    });

    $(document).on("keydown", function(e) {
        if (e.ctrlKey && e.key === "z") {
            e.preventDefault();
            undo();
        }

        if (e.ctrlKey && e.key === "y") {
            e.preventDefault();
            redo();
        }
    });
});

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
    updateUndoRedoButtons();
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

function jsonToMermaid(data) {
    let mermaid = `---
config:
    layout: elk
---
graph TD
    classDef final fill:#c4eac6, stroke:#65ae6a;
    classDef starting_point fill:#bfe2ef, stroke:#6accee;
    classDef email_node fill:#FFF3E0,stroke:#E8590C,color:#E8590C;
    classDef tunnel_node fill:#F3E8FF,stroke:#7C3AED,color:#7C3AED;\n\n`;

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
        } else if (node.type === "email") {
            mermaid += `    ${node.id}(["✉ ${node.id}"])\n`;
        } else if (node.type === "tunnel") {
            mermaid += `    ${node.id}{{"🔗 ${node.id}"}}\n`;
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
        } else if (node.type === "email") {
            mermaid += `    class ${node.id} email_node\n`;
        } else if (node.type === "tunnel") {
            mermaid += `    class ${node.id} tunnel_node\n`;
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
            <div class="condition-main">
                <span class="condition-str">${transition ? transition.condition : ""}</span>
                <span class="condition-arrow">→</span>
                <select class="select-sortie-type">
                    <option value="bloc">Redirection bloc</option>
                    <option value="profil">Redirection profil</option>
                    <option value="notification">Notification mail</option>
                    <option value="tunnel">Redirection tunnel</option>
                </select>
                <select class="select-available-nodes"></select>
            </div>
            <div class="condition-actions">
                <button class="action-btn modify-condition" title="Modifier">✎</button>
                <button class="action-btn danger delete-condition" title="Supprimer">✕</button>
            </div>
        </div>
    `);

    const $typeSelect = $row.find(".select-sortie-type");
    const $select = $row.find(".select-available-nodes");

    populateNodeSelect($select);

    $typeSelect.on("change", function () {
        updateSortieTypeUI($row);
    });

    // Set initial type
    if (transition && transition.sortieType) {
        $typeSelect.val(transition.sortieType);
    }
    updateSortieTypeUI($row);

    return $row;
}

function createQuestionRow(question) {
    const $row = $(`
        <div class="list-row div-question" data-question-id="${question.id}">
            <div class="question-main">
                <div class="question-code">${question.id}</div>
                <span class="question-str">${question.title}</span>
            </div>
            <div class="question-actions">
                <button class="action-btn edit-question" title="Modifier">✎</button>
                <button class="action-btn danger delete-question" title="Supprimer">✕</button>
            </div>
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

function updateStats() {
    const qCount = $("#container-questions .div-question").length;
    const cCount = $("#container-conditions .div-condition").length;
    $("#stat-questions").text(qCount);
    $("#stat-conditions").text(cCount);
}

function initModalConditions(nodeId) {
    $("#modal-manage-node #container-conditions").empty();

    graphJSON.transitions.forEach((transition) => {
        if (transition.source === nodeId) {
            // Auto-detect sortieType from target node if not set
            if (!transition.sortieType) {
                const targetNode = graphJSON.nodes.find((n) => n.id === transition.target);
                if (targetNode) {
                    if (targetNode.type === "final") transition.sortieType = "profil";
                    else if (targetNode.type === "email") transition.sortieType = "notification";
                    else if (targetNode.type === "tunnel") transition.sortieType = "tunnel";
                    else transition.sortieType = "bloc";
                } else {
                    transition.sortieType = "bloc";
                }
            }

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

function populateNodeSelect($select, typeFilter) {
    $select.empty();
    graphJSON.nodes.forEach((node) => {
        if (!typeFilter || typeFilter.includes(node.type)) {
            $select.append($("<option>", { value: node.id, text: node.id }));
        }
    });
}

function updateSortieTypeUI($row) {
    const type = $row.find(".select-sortie-type").val();
    const $nodeSelect = $row.find(".select-available-nodes");
    const $typeSelect = $row.find(".select-sortie-type");
    const currentTarget = $nodeSelect.val();

    $typeSelect.attr("data-type", type);

    if (type === "bloc") {
        populateNodeSelect($nodeSelect, ["etape", "initial"]);
    } else if (type === "profil") {
        populateNodeSelect($nodeSelect, ["final"]);
    } else if (type === "notification") {
        populateNodeSelect($nodeSelect, ["email"]);
    } else if (type === "tunnel") {
        populateNodeSelect($nodeSelect, ["tunnel"]);
    }
    if (currentTarget) $nodeSelect.val(currentTarget);
}

function buildTransitionsJSON(nodeId) {
    $("#modal-manage-node .div-condition").each(function (index) {
        const $div = $(this);

        const conditionText = $div.find(".condition-str").text().trim();
        const sortieType = $div.find(".select-sortie-type").val();
        const selectedTarget = $div.find(".select-available-nodes").val();

        const transition = {
            source: nodeId,
            target: selectedTarget,
            condition: conditionText,
            order: index + 1,
            sortieType: sortieType,
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

    const node = graphJSON.nodes.find((n) => n.id === nodeId);

    if (node.type === "email") {
        node.emailSubject = $("#emailSubject").val().trim();
        node.emailBody = window.emailQuill ? window.emailQuill.root.innerHTML : "";
    }

    if (node.type === "tunnel") {
        node.tunnelTarget = $("#tunnelTarget").val().trim();
        return;
    }

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

function initEmailEditor(node) {
    $("#emailSubject").val(node.emailSubject || "");

    // Destroy previous Quill instance if any
    const container = document.querySelector("#box-email-template .form-group:last-child");
    const oldToolbar = container.querySelector(".ql-toolbar");
    if (oldToolbar) oldToolbar.remove();
    const editorEl = document.getElementById("email-editor");
    editorEl.innerHTML = "";
    editorEl.className = "";

    window.emailQuill = new Quill("#email-editor", {
        theme: "snow",
        placeholder: "Rédigez le contenu de votre email...",
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ color: [] }, { background: [] }],
                ["link"],
                ["clean"],
            ],
        },
    });

    if (node.emailBody) {
        window.emailQuill.root.innerHTML = node.emailBody;
    }
}

function initModalQuestionsDisponibles() {
    $("#questions-disponibles").empty();

    // Collect question IDs already in the bloc
    const alreadyAdded = new Set();
    $("#container-questions .div-question").each(function () {
        alreadyAdded.add($(this).data("question-id"));
    });

    questionsBouchon.forEach((question) => {
        if (alreadyAdded.has(question.id)) return;

        const $button = $("<button>", {
            text: `${question.id} : ${question.title}`,
        }).on("click", function () {
            const questionRow = createQuestionRow(question);
            addQuestionRow(questionRow);
            updateStats();
            hideModal("#modal-add-question");
        });
        $("#questions-disponibles").append($button);
    });

    // Reset new question form
    $("#newQuestionId").val("");
    $("#newQuestionTitle").val("");
    $("#newQuestionBody").val("");
    $("#newQuestionType").val("bool");
    $("#newQuestionValues").val("");
    $("#newQuestionValuesGroup").hide();
}

function getResValuesForType(type, customValues) {
    if (type === "bool") return ["Oui", "Non"];
    if (type === "select" && customValues) {
        return customValues.split(",").map(v => v.trim()).filter(v => v.length > 0);
    }
    return [];
}

function undo() {
    if (undoStack.length === 0) return;

    redoStack.push(structuredClone(graphJSON));
    graphJSON = undoStack.pop();
    renderDiagram();
    updateUndoRedoButtons();
}

function redo() {
    if (redoStack.length === 0) return;

    undoStack.push(structuredClone(graphJSON));
    graphJSON = redoStack.pop();
    renderDiagram();
    updateUndoRedoButtons();
}

function saveStacks() {
    undoStack.push(structuredClone(graphJSON));
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }
    redoStack = [];
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    $("#undo-graph-btn").prop("disabled", undoStack.length === 0);
    $("#redo-graph-btn").prop("disabled", redoStack.length === 0);
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

        if (type === "email") {
            newNode.emailSubject = "";
            newNode.emailBody = "";
        } else if (type === "tunnel") {
            newNode.tunnelTarget = "";
        }

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
        updateStats();
    });

    $(document).on("click", ".div-question .delete-question", function () {
        let $button = $(this);
        $button.closest(".div-question").remove();
        updateStats();
    });

    // ── Edit question ──
    $(document).on("click", ".div-question .edit-question", function () {
        const $row = $(this).closest(".div-question");
        const qId = $row.data("question-id");
        const question = questionsBouchon.find((q) => q.id === qId);
        if (!question) return;

        $("#editQuestionId").val(question.id);
        $("#editQuestionTitle").val(question.title);
        $("#editQuestionBody").val(question.body);
        $("#editQuestionType").val(question.type);

        if (question.type === "select") {
            $("#editQuestionValuesGroup").show();
            $("#editQuestionValues").val((question.resValues || []).join(", "));
        } else {
            $("#editQuestionValuesGroup").hide();
            $("#editQuestionValues").val("");
        }

        showModal("#modal-edit-question");
    });

    $("#editQuestionType").on("change", function () {
        if ($(this).val() === "select") {
            $("#editQuestionValuesGroup").show();
        } else {
            $("#editQuestionValuesGroup").hide();
            $("#editQuestionValues").val("");
        }
    });

    $("#saveEditQuestionBtn").on("click", function () {
        const id = $("#editQuestionId").val().trim();
        const title = $("#editQuestionTitle").val().trim();
        const body = $("#editQuestionBody").val().trim();
        const type = $("#editQuestionType").val();

        if (!title || !body) {
            alert("Veuillez remplir le titre et la question.");
            return;
        }

        if (type === "select") {
            const vals = $("#editQuestionValues").val().trim();
            if (!vals) {
                alert("Veuillez saisir au moins une valeur pour la liste à choix.");
                return;
            }
        }

        // Update in questionsBouchon
        const question = questionsBouchon.find((q) => q.id === id);
        if (question) {
            question.title = title;
            question.body = body;
            question.type = type;
            question.resValues = getResValuesForType(type, $("#editQuestionValues").val());
        }

        // Update the row in the DOM
        const $row = $(`.div-question[data-question-id="${id}"]`);
        $row.find(".question-str").text(title);

        hideModal("#modal-edit-question");
    });

    $("#cancelEditQuestionBtn").on("click", function () {
        hideModal("#modal-edit-question");
    });

    $("#closeEditQuestion").on("click", function () {
        hideModal("#modal-edit-question");
    });

    $(document).on("click", ".div-condition .modify-condition", function () {
        currentConditionSpan = $(this).closest(".div-condition").find(".condition-str");

        const currentText = currentConditionSpan.text().trim();
        $("#conditionInput").val(currentText);
        $("#autocomplete-dropdown").addClass("hidden").empty();

        showModal("#modal-modify-condition");
    });

    $("#modal-modify-condition #saveBtn").on("click", function () {
        const newValue = $("#conditionInput").val();

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
        updateStats();

        currentConditionSpan = conditionRow.find(".condition-str");
        $("#conditionInput").val("");
        $("#autocomplete-dropdown").addClass("hidden").empty();
        showModal("#modal-modify-condition");
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

    $("#createQuestionBtn").on("click", function () {
        const id = $("#newQuestionId").val().trim();
        const title = $("#newQuestionTitle").val().trim();
        const body = $("#newQuestionBody").val().trim();
        const type = $("#newQuestionType").val();

        if (!id || !title || !body) {
            alert("Veuillez remplir tous les champs (Code, Titre, Question).");
            return;
        }

        if (type === "select") {
            const vals = $("#newQuestionValues").val().trim();
            if (!vals) {
                alert("Veuillez saisir au moins une valeur pour la liste à choix.");
                return;
            }
        }

        if (questionsBouchon.some((q) => q.id === id)) {
            alert("Une question avec ce code existe déjà.");
            return;
        }

        const newQuestion = {
            id: id,
            questionNb: id,
            title: title,
            body: body,
            type: type,
            resValues: getResValuesForType(type, $("#newQuestionValues").val()),
            order: questionsBouchon.length + 1,
        };

        questionsBouchon.push(newQuestion);

        const questionRow = createQuestionRow(newQuestion);
        addQuestionRow(questionRow);
        updateStats();
        hideModal("#modal-add-question");
    });

    // Close buttons (×)
    $("#closeAddNode").on("click", function () {
        hideModal("#modal-add-node");
    });
    $("#closeManageNode").on("click", function () {
        hideModal("#modal-manage-node");
    });
    $("#closeAddQuestion").on("click", function () {
        hideModal("#modal-add-question");
    });
    $("#closeModifyCondition").on("click", function () {
        hideModal("#modal-modify-condition");
    });

    // Toggle select values field visibility
    $("#newQuestionType").on("change", function () {
        if ($(this).val() === "select") {
            $("#newQuestionValuesGroup").show();
        } else {
            $("#newQuestionValuesGroup").hide();
            $("#newQuestionValues").val("");
        }
    });

    // ── Autocomplete conditions (@/$) ──
    const $condInput = $("#conditionInput");
    const $dropdown = $("#autocomplete-dropdown");
    let acTriggerIndex = -1; // position of the trigger char (@ or $)

    function getBlockQuestions() {
        if (!currentNodeId) return [];
        const node = graphJSON.nodes.find((n) => n.id === currentNodeId);
        if (!node) return [];
        const ids = node.questions ?? [];
        return ids
            .map((qId) => questionsBouchon.find((q) => q.id === qId))
            .filter(Boolean);
    }

    function typeLabel(type) {
        const map = { bool: "Oui / Non", text: "Texte", number: "Nombre", select: "Liste" };
        return map[type] || type;
    }

    function buildDropdown(questions, filter) {
        $dropdown.empty();
        const lowerFilter = filter.toLowerCase();
        const filtered = questions.filter(
            (q) =>
                q.id.toLowerCase().includes(lowerFilter) ||
                q.title.toLowerCase().includes(lowerFilter)
        );

        if (filtered.length === 0) {
            $dropdown.addClass("hidden");
            return;
        }

        filtered.forEach((q) => {
            let valuesHtml = "";
            if (q.resValues && q.resValues.length > 0) {
                valuesHtml = `<div class="ac-values">${q.resValues
                    .map((v) => `<span class="ac-value-pill">${v}</span>`)
                    .join("")}</div>`;
            }

            const $item = $(`
                <div class="autocomplete-item" data-qid="${q.id}">
                    <div class="ac-code">${q.id}</div>
                    <div class="ac-info">
                        <div class="ac-title">${q.title}</div>
                        <div class="ac-type">${typeLabel(q.type)}</div>
                        ${valuesHtml}
                    </div>
                </div>
            `);

            $item.on("click", function () {
                insertQuestion(q.id);
            });

            $dropdown.append($item);
        });

        $dropdown.removeClass("hidden");
    }

    function insertQuestion(qId) {
        const val = $condInput.val();
        const before = val.substring(0, acTriggerIndex);
        const after = val.substring($condInput[0].selectionStart);
        const newVal = before + qId + after;
        $condInput.val(newVal);

        // place cursor after inserted id
        const cursorPos = acTriggerIndex + qId.length;
        $condInput[0].setSelectionRange(cursorPos, cursorPos);
        $condInput.focus();

        $dropdown.addClass("hidden");
        acTriggerIndex = -1;
    }

    function buildKeywordDropdown(keyword, wordStart, cursorPos) {
        $dropdown.empty();
        const $item = $(`
            <div class="autocomplete-item autocomplete-keyword" data-keyword="${keyword}">
                <div class="ac-code">mot-clé</div>
                <div class="ac-info">
                    <div class="ac-title">${keyword}</div>
                    <div class="ac-type">Condition par défaut</div>
                </div>
            </div>
        `);
        $item.on("click", function () {
            insertKeyword(keyword, wordStart, cursorPos);
        });
        $dropdown.append($item);
        $dropdown.removeClass("hidden");
    }

    function insertKeyword(keyword, wordStart, cursorPos) {
        const val = $condInput.val();
        const before = val.substring(0, wordStart);
        const after = val.substring(cursorPos);
        const newVal = before + keyword + after;
        $condInput.val(newVal);

        const newCursorPos = wordStart + keyword.length;
        $condInput[0].setSelectionRange(newCursorPos, newCursorPos);
        $condInput.focus();

        $dropdown.addClass("hidden");
        acTriggerIndex = -1;
    }

    $condInput.on("input", function () {
        const val = $(this).val();
        const cursorPos = this.selectionStart;

        // search backwards from cursor for @ or $
        let triggerPos = -1;
        for (let i = cursorPos - 1; i >= 0; i--) {
            const ch = val[i];
            if (ch === "@" || ch === "$") {
                triggerPos = i;
                break;
            }
            if (ch === " " || ch === "=" || ch === "<" || ch === ">") {
                break;
            }
        }

        if (triggerPos === -1) {
            // Check for keyword autocomplete ("sinon")
            let wordStart = cursorPos;
            for (let i = cursorPos - 1; i >= 0; i--) {
                const ch = val[i];
                if (ch === " " || ch === "=" || ch === "<" || ch === ">") {
                    break;
                }
                wordStart = i;
            }
            const currentWord = val.substring(wordStart, cursorPos).toLowerCase();
            if (currentWord.length >= 2 && "sinon".startsWith(currentWord)) {
                acTriggerIndex = wordStart;
                buildKeywordDropdown("sinon", wordStart, cursorPos);
            } else {
                $dropdown.addClass("hidden");
                acTriggerIndex = -1;
            }
            return;
        }

        acTriggerIndex = triggerPos;
        const fragment = val.substring(triggerPos + 1, cursorPos);
        const questions = getBlockQuestions();
        buildDropdown(questions, fragment);
    });

    $condInput.on("keydown", function (e) {
        if ($dropdown.hasClass("hidden")) return;

        const $items = $dropdown.find(".autocomplete-item");
        const $active = $dropdown.find(".autocomplete-item.active");
        let idx = $items.index($active);

        if (e.key === "ArrowDown") {
            e.preventDefault();
            idx = idx < $items.length - 1 ? idx + 1 : 0;
            $items.removeClass("active").eq(idx).addClass("active");
            $items.eq(idx)[0].scrollIntoView({ block: "nearest" });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            idx = idx > 0 ? idx - 1 : $items.length - 1;
            $items.removeClass("active").eq(idx).addClass("active");
            $items.eq(idx)[0].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if ($active.length) {
                if ($active.data("keyword")) {
                    insertKeyword($active.data("keyword"), acTriggerIndex, this.selectionStart);
                } else {
                    insertQuestion($active.data("qid"));
                }
            }
        } else if (e.key === "Escape") {
            $dropdown.addClass("hidden");
            acTriggerIndex = -1;
        }
    });

    // Close dropdown when clicking outside
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".autocomplete-wrapper").length) {
            $dropdown.addClass("hidden");
            acTriggerIndex = -1;
        }
    });

    // ── Variable pills: insert variable into Quill editor ──
    $(document).on("click", ".var-pill", function () {
        const varText = $(this).data("var");
        if (!window.emailQuill) return;

        const quill = window.emailQuill;
        const range = quill.getSelection(true);
        quill.insertText(range.index, varText, {
            background: "#FFF9C4",
            bold: true,
        });
        quill.setSelection(range.index + varText.length);
    });
});

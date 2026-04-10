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

function getResValuesForType(type, customValues) {
    if (type === "bool") return ["Oui", "Non"];
    if (type === "select" && customValues) {
        return customValues.split(",").map(v => v.trim()).filter(v => v.length > 0);
    }
    return [];
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

function initEvents() {
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
}

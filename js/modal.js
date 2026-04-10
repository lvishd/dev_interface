function showModal(id) {
    $(id).removeClass("hidden");
}

function hideModal(id) {
    $(id).addClass("hidden");
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

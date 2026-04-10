function resetGraph() {
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

function addNode(node) {
    saveStacks();
    graphJSON.nodes.push(node);
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
    deleteQuestions(nodeId);
    buildQuestionsJSON(nodeId);
    deleteUnusedQuestionsJSON();

    // transitions
    deleteTransitions(nodeId);
    buildTransitionsJSON(nodeId);
}

function deleteQuestions(nodeId) {
    const node = graphJSON.nodes.find((n) => n.id === nodeId);
    node.questions = [];
}

function deleteUnusedQuestionsJSON() {
    const usedQuestionIds = new Set(graphJSON.nodes.flatMap((node) => node.questions));
    graphJSON.questions = graphJSON.questions.filter((q) => usedQuestionIds.has(q.id));
}

function deleteTransitions(source2delete) {
    graphJSON.transitions = graphJSON.transitions.filter((t) => t.source !== source2delete);
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
                graphJSON.questions.push(question);
            }
        });
    }
}

function getNodeIdsList() {
    return graphJSON.nodes.map((node) => node.id);
}

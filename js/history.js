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

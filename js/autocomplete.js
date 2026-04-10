function initAutocomplete() {
    const $condInput = $("#conditionInput");
    const $dropdown = $("#autocomplete-dropdown");
    let acTriggerIndex = -1;

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
}

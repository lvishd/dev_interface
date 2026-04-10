function cleanId(mermaidId) {
    return mermaidId.replace(/^flowchart-/, "").replace(/-[0-9]+$/, "");
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

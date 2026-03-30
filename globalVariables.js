let currentConditionSpan = null;

let graphJSON = {
    "questions": [],
    "nodes": [
        {
            "id": "DEBUT",
            "label": "DEBUT",
            "type": "initial",
            "questions": []
        }
    ],
    "transitions": []
};

let t = null;

const questionsBouchon = [
    {
        "id": "Q1",
        "questionNb": "Q1",
        "title": "Boursier",
        "body": "Etes-vous boursier ?",
        "type": "bool",
        "resValues": ["Oui", "Non"],
        "order": 1
    },
    {
        "id": "Q2",
        "questionNb": "Q2",
        "title": "Double nationalité",
        "body": "Avez-vous une double nationalité ?",
        "type": "bool",
        "resValues": ["Oui", "Non"],
        "order": 2
    },
    {
        "id": "Q3",
        "questionNb": "Q3",
        "title": "Situation particulière",
        "body": "Etes-vous dans une situation particulière ?",
        "type": "bool",
        "resValues": ["Oui", "Non"],
        "order": 3
    }
];
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

graphJSON = {
    "questions": [],
    "nodes": [
        {
            "id": "DEBUT",
            "label": "DEBUT",
            "type": "initial",
            "questions": []
        },
        {
            "id": "test",
            "label": "",
            "type": "etape",
            "questions": [
                "initialiser_test"
            ]
        },
        {
            "id": "test2",
            "label": "",
            "type": "etape",
            "questions": [
                "initialiser_test2"
            ]
        }
    ],
    "transitions": [
    ]
};
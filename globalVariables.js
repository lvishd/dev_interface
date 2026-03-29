let currentConditionSpan = null;

let graphJSON = {
    "questions": [],
    "nodes": [
        {
            "id": "debut",
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
            "id": "debut",
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
        {
            "source": "test",
            "target": "debut",
            "condition": "",
            "order": 0
        },
        {
            "source": "test2",
            "target": "test",
            "condition": "",
            "order": 0
        }
    ]
};
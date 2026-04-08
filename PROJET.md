# Simulateur de Tunnel de Questions — Suivi Projet

## Contexte

Outil de **paramétrage d'un tunnel (workflow) de questions** à destination d'étudiants.

- **LOT 1 — Interface Admin** (en cours) : l'administrateur construit visuellement le workflow — blocs de questions, conditions de sortie, profils finaux, notifications.
- **LOT 2 — Moteur Étudiant** (futur) : exécution du tunnel côté étudiant, parcours dynamique selon les réponses, affichage du résultat final (code profil).

### Objectif métier

L'admin définit un **graphe orienté** composé de :

| Concept          | Description |
|------------------|-------------|
| **Question**     | Question posée à l'étudiant (Oui/Non, texte, nombre, liste à choix). |
| **Bloc (étape)** | Regroupe 1+ questions. Un bloc peut contenir un texte d'instruction et appartenir à un département. |
| **Condition**    | Règle évaluée sur les réponses (`Q1=Oui`, `Q7 > 8000`, `sinon`…) qui détermine la sortie d'un bloc. |
| **Transition**   | Lien d'un bloc vers un autre bloc ou vers un **profil final**. |
| **Profil final** | Code résultat de l'étudiant (ex: `NO`, `ED`, `DN`, `CA`, `L0`-`L7`, `P0`-`P9`…). |
| **Notification** | Message affiché à l'étudiant à un moment donné du parcours (ex: fin de bloc). |

### Flux typique (depuis le fichier Excel de référence)

```
DEBUT
  → Bloc DIP-NAT (Q1, Q2, Q3)
      Si Q3=Oui → Bloc SIT-PART (Q4 : type de situation)
      Sinon     → Profil NO
  → Bloc DGM-LSO2 (Q5 : pays foyer fiscal)
      Si hors UE → Profil ET
      Sinon      → Bloc DGM-LSO3 (Q6 : renoncement tarif modulé)
          Si Q6=Non  → Profil L0
          Sinon      → Bloc DGM-LSO4 (Q7: RBG, Q8: fratrie ESR, Q9: région)
              Conditions sur tranches de revenus → Profils L1–L7, ED, DN
```

---

## Architecture technique

| Fichier               | Rôle |
|-----------------------|------|
| `vue.html`            | Page principale : toolbar, zone de rendu Mermaid, toutes les modales. |
| `functions.js`        | Logique métier (module ESM) : rendu diagramme, CRUD nœuds/transitions/questions, événements. |
| `globalVariables.js`  | Données initiales : `graphJSON` (état du graphe) + `questionsBouchon` (catalogue de questions). |
| `style.css`           | Design system : variables CSS, layout, modales, cartes, boutons. |
| `modal.html`          | Maquette de référence design (standalone). |

**Dépendances externes (CDN)** : jQuery, Mermaid.js + ELK layout, svg-pan-zoom, SortableJS, Google Fonts (Inter).

---

## Structures de données

### Question

```json
{
  "id": "Q7",
  "questionNb": "Q7",
  "title": "Revenu brut global",
  "body": "Saisissez le revenu brut global 2019...",
  "helpText": "Texte d'aide optionnel",
  "type": "number",
  "resValues": [],
  "order": 7
}
```

Types supportés :

| `type`   | Description               | `resValues`                                    |
|----------|---------------------------|-------------------------------------------------|
| `bool`   | Oui / Non                 | `["Oui", "Non"]`                                |
| `text`   | Texte libre               | `[]`                                             |
| `number` | Numérique (entier/décim.) | `[]`                                             |
| `select` | Liste à choix             | `["réfugié", "enfant de personnel", "handicap"]` |

### Nœud (Bloc)

```json
{
  "id": "DGM-LSO1",
  "label": "",
  "type": "etape",
  "questions": ["Q1", "Q2", "Q3"],
  "department": "LSO",
  "instructionText": ""
}
```

Types de nœud : `initial`, `etape`, `final`.

### Transition

```json
{
  "source": "DGM-LSO1",
  "target": "NO",
  "condition": "Q1=Oui",
  "order": 1
}
```

---

## Données de référence (Excel)

Fichier : `Parametrages_simulateur_VERSION-FINALE.xlsx`

### Feuille `questions_simulateur` — 11 questions

| Code | Libellé | Donnée | Type |
|------|---------|--------|------|
| Q1 | Êtes-vous boursier ? | Boursier | O/N |
| Q2 | Avez-vous une double nationalité ? | Double nationalité | O/N |
| Q3 | Êtes-vous dans une situation particulière ? | Situation particulière | O/N |
| Q4 | Précisez la situation | Détail situation | Select : réfugié, enfant de personnel, handicap > 80% |
| Q5 | Pays du foyer fiscal de référence | Lieu foyer fiscal | Select : France, UE, hors UE |
| Q6 | Acceptez-vous d'indiquer les revenus ? | Renoncement tarif modulé | O/N |
| Q7 | Saisissez le revenu brut global 2019 | Revenu brut global | Numérique entier positif |
| Q8 | Frère/sœur inscrit dans l'enseignement sup. ? | Fratrie ESR | O/N |
| Q9 | Localisation du foyer fiscal | Région foyer fiscal | Select : Île-de-France, Province, UE |
| Q10 | Confirmez revenus < 8000 € = parents ? | Contrôle détachement fiscal | O/N |
| Q11 | Étiez-vous boursier CROUS en 2020/2021 ? | Boursier N-1 | O/N |

### Feuille `blocs_question` — Blocs principaux

| Bloc | Questions | Départements | Sorties possibles |
|------|-----------|-------------|-------------------|
| DIP-NAT | Q1+Q2+Q3 | LSO, MSO, MIDO | → SIT-PART / Profil NO |
| DGM-LSO1 | Q1+Q2+Q3 | LSO | → Profil NO, SIT-PART, redoublants, DGM-LSO2 |
| DGM-MSO1 | Q1+Q2+Q3 | MSO, IPJ | → Profil NO, SIT-PART, redoublants, DGM-MSO2 |
| SIT-PART | Q4 | Tous | → Profil CA |
| DGM-LSO2 | Q5 | LSO | → Profil ET / DGM-LSO3 |
| DGM-MSO2 | Q5 | MSO, IPJ | → Profil ET / DGM-MSO3 |
| DGM-LSO3 | Q6 | LSO | → Profil L0 / DGM-LSO4 |
| DGM-MSO3 | Q6 | MSO, IPJ | → Profil P0 / DGM-MSO4 |
| DGM-LSO4 | Q7+Q8+Q9 | LSO | → Profils L1–L7, ED, DN (tranches RBG) |
| DGM-MSO4 | Q7+Q8+Q9 | MSO, IPJ | → Profils P0–P9, PA (tranches RBG) |
| RBG_BAS_LSO5 | Q10 | LSO | → Profil ED / RBG_BAS_MODIF |
| RBG_BAS_MSO5 | Q10 | MSO | → Profil P9 / RBG_BAS_MODIF |
| RBG_BAS_MODIF | (aucune) | — | Bloc d'instruction : message de correction |
| DU-1 | Q2 | MSO | → Profil NO |
| DGE-LON | Q1+Q2 | LSO | → Profil DI |
| DGE-MAD | Q1+Q2+Q3 | LSO | → SIT-PART, Profil PR/NO |
| DU-3 | Q2+Q11 | MSO, MIDO | → Profil CA/NO |

### Feuille `Déroulés` — Workflows par département

- **DGE Modulés LSO** : DGM-LSO1 → SIT-PART → DGM-LSO2 → DGM-LSO3 → DGM-LSO4 → RBG_BAS_LSO5 → RBG_BAS_MODIF
- **DGE Modulés MSO** : DGM-MSO1 → SIT-PART → DGM-MSO2 → DGM-MSO3 → DGM-MSO4 → RBG_BAS_MSO5 → RBG_BAS_MODIF
- **Diplômes Nationaux** : DN-1 → SIT-PART
- **Campus Londres** : DGE-LON
- **Campus Madrid** : DGE-MAD → SIT-PART
- **DU** : DU-1 / DU-2 / DU-3

---

## Avancement

### LOT 1 — Interface Admin

| # | Fonctionnalité | Statut |
|---|---------------|--------|
| 1 | Rendu graphe Mermaid + ELK avec pan/zoom | ✅ Fait |
| 2 | Ajout / suppression de nœuds (étape, final) | ✅ Fait |
| 3 | Modale de gestion d'un bloc (questions + conditions) | ✅ Fait |
| 4 | Drag & drop pour réordonner questions et conditions | ✅ Fait |
| 5 | Ajout de questions existantes dans un bloc | ✅ Fait |
| 6 | Création de nouvelles questions (formulaire inline) | ✅ Fait |
| 7 | Types de réponse : bool, texte, nombre, liste à choix | ✅ Fait |
| 8 | Design moderne (inspiré modal.html) | ✅ Fait |
| 9 | Texte d'aide sur les questions | ⬜ À faire |
| 10 | Texte d'instruction sur les blocs | ⬜ À faire |
| 11 | Rattachement département sur un bloc | ⬜ À faire |
| 12 | Notifications paramétrables (message fin de bloc) | ⬜ À faire |
| 13 | Import / Export JSON du graphe | ⬜ À faire |
| 14 | Validation du graphe (cohérence, nœuds orphelins) | ⬜ À faire |
| 15 | Conditions avancées (opérateurs >, <, ET, OU, sinon) | ⬜ À faire |
| 16 | Gestion des redoublants (profil N-1) | ⬜ À faire |

### LOT 2 — Moteur Étudiant

| # | Fonctionnalité | Statut |
|---|---------------|--------|
| 1 | Parcours du tunnel question par question | ⬜ À faire |
| 2 | Évaluation des conditions côté client | ⬜ À faire |
| 3 | Affichage du résultat final (code profil) | ⬜ À faire |
| 4 | Affichage des notifications paramétrées | ⬜ À faire |
| 5 | Historique / retour en arrière | ⬜ À faire |

---

## Décisions techniques

- Tout est côté client (pas de backend pour le moment).
- Le catalogue de questions (`questionsBouchon`) sert de référentiel global ; les blocs référencent les questions par ID.
- Le graphe est stocké en JSON (`graphJSON`) et converti en syntaxe Mermaid pour le rendu.
- Le design s'appuie sur le system de `modal.html` (variables CSS, border-radius 30px, Inter, backdrop blur).

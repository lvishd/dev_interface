import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs";

function cleanId(mermaidId) {
    return mermaidId.replace(/^flowchart-/, '').replace(/-[0-9]+$/, '');
}

mermaid.registerLayoutLoaders(elkLayouts);

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default"
});

const source = document.getElementById("source");
const preview = document.getElementById("preview");
const error = document.getElementById("error");
const btn = document.getElementById("renderBtn");

// ?? Default diagram content
source.value = `---
config:
    layout: elk
---
graph TD
      classDef block fill:#eeeeee, stroke-width:0px;
      classDef decision fill:#e1f5fe;
      classDef final fill:#c8e6c9, stroke:#B6DEB8;

      Start((DÉBUT)) --> DGM-LSO1

      subgraph DGM-LSO1 ["DGM-LSO1"]
          Q1["Q1 : Boursier<br/> Êtes-vous boursier ? <br/>(O/N)"]
          Q2["Q2 : Double nationalité<br/> Avez-vous une double nationalité ? <br/>(O/N)"]
          Q3["Q3 : Situation particulière<br/> Êtes-vous dans une situation particulière ? <br/>(O/N)"]
      end

      DGM-LSO1 -- "Q1=Oui" --> NO[PROFIL_NO]
      DGM-LSO1 -- "Q3=Oui" --> SIT-PART
      DGM-LSO1 -- "Sinon" --> DGM-LSO2
      DGM-LSO1 -- "si redoublant" --> CheckRedoublant

      class CheckRedoublant decision
      CheckRedoublant{"Profil N-1 ?"}

      CheckRedoublant -- "autre cas" --> PR[PROFIL_PR]
      CheckRedoublant -- "profil N-1 = ED" --> ED[PROFIL_ED]
      CheckRedoublant -- "profil N-1 = ND" --> ND[PROFIL_ND]
      CheckRedoublant -- "profil N-1 = L7" --> L7[PROFIL_L7]

      %% DGM-LSO1 -- "Redoublant" --> RED[PROFIL_RED</b><br/>Maintien profil N-1]


      subgraph SIT-PART ["SIT-PART"]
          Q4["Q4 : Détail Situation particulière<br/> Précisez la situation <br/>(réfugié/enfant de personnel/handicap >80%)"]
      end
      SIT-PART --> CA[PROFIL_CA]

      subgraph DGM-LSO2 ["DGM-LSO2"]
          Q5["Q5 : Lieu foyer fiscal parents<br/> Quel est le pays de votre foyer fiscal de référence ?<br/>(France / UE / Hors-UE)"]
      end

      DGM-LSO2 -- "Hors-UE" --> ET[PROFIL_ET]
      DGM-LSO2 -- "France / UE" --> DGM-LSO3

      subgraph DGM-LSO3 ["DGM-LSO3"]
          Q6["Q6 : Renoncement tarif modulé<br/> Acceptez-vous d'indiquer les revenus de votre foyer fiscal ?<br/>(O/N)"]
      end

      DGM-LSO3 -- "Non" --> L0[PROFIL_L0]
      DGM-LSO3 -- "Oui" --> DGM-LSO4

      subgraph DGM-LSO4 ["DGM-LSO4"]
          Q7["Q7 : Revenu brut global<br/>Saisissez le revenu brut global 2019 (avis d'impôt 2020) de vos parents ou le vôtre si vous êtes détaché du foyer fiscal parental<br/>(Numérique entier positif)"]
          Q8["Q8 : Frère ou sœurs scolarisés dans l'enseignement supérieur<br/> Avez-vous un frère ou une sœur inscrit(e) dans un établissement d'enseignement supérieur en France ou à l'international pour 2021/2022 ?<br/>(O/N)"]
          Q9["Q9 : Région du foyer fiscal<br/> Précisez encore la localisation de votre foyer fiscal<br/>(Ile-De-France/Province/Pays membre de l'Union Européenne)"]
      end

      DN[PROFIL_DN]
      L6[PROFIL_L6]
      L5[PROFIL_L5]
      L4[PROFIL_L4]
      L3[PROFIL_L3]
      L2[PROFIL_L2]
      L1[PROFIL_L1]
      

      DGM-LSO4 -- "Q7 <= 8000" --> RBG_BAS_LSO5
      DGM-LSO4 -- "8000 < Q7 <= 40000" --> ED
      DGM-LSO4 -- "40000 < Q7 <= 50000" --> DN
      DGM-LSO4 -- "50000 < Q7 <= 60000" --> L7
      DGM-LSO4 -- "60000 < Q7 <= 70000" --> L6
      DGM-LSO4 -- "70000 < Q7 <= 80000" --> L5
      DGM-LSO4 -- "80000 < Q7 <= 100000" --> L4
      DGM-LSO4 -- "100000 < Q7 <= 120000" --> L3
      DGM-LSO4 -- "120000 < Q7 <= 140000" --> L2
      DGM-LSO4 -- "1400000 < Q7 <= 160000" --> L1
      DGM-LSO4 -- "160000 < Q7" --> L0
      DGM-LSO4 -- "70000 < Q7 <= 80000 ET Q8=oui" --> L6
      DGM-LSO4 -- "80000 < Q7 <= 100000 ET Q8=oui" --> L5
      DGM-LSO4 -- "100000 < Q7 <= 120000 ET Q8=oui" --> L4
      DGM-LSO4 -- "120000 < Q7 <= 140000 ET Q8=oui" --> L3
      DGM-LSO4 -- "140000 < Q7 <= 160000 ET Q8=oui" --> L2
      DGM-LSO4 -- "Q7 < 160000 ET Q8=oui" --> L1
      
      
      %%DGM-LSO4 --> Check{Analyse des revenus}

      %%Check -- "Si Détaché & RBG < 8000€" --> RBG_BAS_LSO5
      %%Check -- "Calcul standard" --> PX[PROFIL P0 à P9]

      subgraph RBG_BAS_LSO5 ["RBG_BAS_LSO5"]
          Q10["Q10 <br/> Le revenu que vous déclarez est inférieur à 8000 €. Confirmez-vous qu'il s'agit des revenus de vos parents ?"]
      end

      RBG_BAS_LSO5 -- "Oui" --> ED[PROFIL_ED]
      RBG_BAS_LSO5 -- "Non" --> RBG_BAS_MODIF

      subgraph RBG_BAS_MODIF ["RBG_BAS_MODIF"]
          MSG["INFO <br/> Revenus insuffisants déclarés.<br/>Retour à la saisie nécessaire."]
      end
      RBG_BAS_MODIF -.-> DGM-LSO4
      
      class DGM-LSO1 block
      class SIT-PART block
      class DGM-LSO2 block
      class DGM-LSO3 block
      class DGM-LSO4 block
      class RBG_BAS_LSO5 block
      class RBG_BAS_MODIF block

      %% Styles finaux
      class DN,L0,L1,L2,L3,L4,L5,L6,L7,CA,PR,ED,ND,NO,RED,ET,P0_B,PX,P9 final
      class Check decision
`;

async function renderDiagram() {
    error.textContent = "";
    preview.removeAttribute("data-processed");
    preview.innerHTML = "";
    preview.textContent = source.value;

    try {
        await mermaid.run({ nodes: [preview] });

        const svgElement = document.querySelector('#preview svg');

        if (svgElement) {
            const interactives = svgElement.querySelectorAll('.node, .cluster');

            interactives.forEach(el => {
                el.addEventListener('click', function (e) {
                    e.stopPropagation();

                    const rawId = el.getAttribute('id');
                    if (rawId) {
                        alert("Elément cliqué (ID) : " + cleanId(rawId));
                    }
                });
            });

            svgPanZoom(svgElement, {
                zoomEnabled: true,
                controlIconsEnabled: true,
                fit: true,
                center: true
            });
        }

    } catch (e) {
        error.textContent = e?.message || String(e);
        console.error(e);
    }
}

btn.addEventListener("click", renderDiagram);
renderDiagram();

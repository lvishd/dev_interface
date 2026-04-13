1. Description projet structurée
Nom provisoire du projet

Studio de configuration des tunnels d’inscription et de tarification

Contexte métier

Le projet consiste à développer une application Back Office permettant à des gestionnaires de scolarité / administrateurs métier de configurer visuellement des tunnels d’inscription.

Un tunnel d’inscription est un workflow paramétrable composé de plusieurs blocs, utilisé pour définir le parcours administratif d’un étudiant. Ce parcours peut contenir :

des blocs formulaire,
des blocs tarif,
des blocs paiement,
des blocs information,
des blocs upload de documents,
des événements ou triggers comme l’envoi d’email ou de SMS.

Le document fonctionnel fourni indique qu’un tunnel d’inscription est paramétrable par la scolarité, associé à un produit d’inscription, et composé de blocs proposés en séquence à l’étudiant. Il distingue notamment les blocs formulaire, questionnaire de tarification, upload de document et paiement en ligne.

Le besoin a évolué : l’objectif n’est plus simplement de déterminer un profil de tarification, mais de déterminer directement une formule tarifaire à partir de variables provenant de plusieurs sources. Le transcript de réunion confirme ce changement d’approche.

Objectif de la phase 1

La phase 1 ne couvre pas l’exécution complète côté étudiant.
Elle couvre exclusivement la conception, l’administration et la visualisation Back Office des éléments suivants :

gestion des tunnels,
gestion du workflow entre blocs,
gestion des étapes internes d’un bloc,
gestion des questionnaires tarifaires,
gestion des schémas de calcul,
gestion des formules tarifaires,
gestion des variables et de leurs sources,
préparation de l’intégration future avec le backend réel.

L’exécution du tunnel côté étudiant sera traitée dans une phase 2.

Vision produit

L’application doit être pensée comme un studio d’orchestration métier visuelle.

Elle ne doit pas être conçue comme un simple form builder.
Elle doit permettre au BO de modéliser plusieurs niveaux de logique métier à l’aide d’un diagramme Mermaid interactif, homogène dans toute l’application.

Les trois composants majeurs suivants doivent fonctionner avec la même logique UI/UX :

Gestion des tunnels
workflow entre blocs
Gestion des étapes d’un bloc
workflow entre étapes de questions
Gestion des schémas de calcul
workflow entre variables, conditions, objets et formules

Le principe central est le suivant :

le modèle métier est stocké en JSON / structure persistée,
ce modèle est transformé en diagramme Mermaid,
les objets Mermaid sont interactifs,
un clic sur un nœud ouvre une modale ou un panneau contextuel,
les modifications mettent à jour le modèle,
puis le diagramme est regénéré.
Concepts métier principaux
1. Tunnel

Un tunnel est un workflow global identifié par :

un identifiant libre, par exemple DN, DGE, etc.
une description
une liste de produits associés

Le tunnel contient des blocs reliés entre eux par des transitions, éventuellement conditionnelles.

2. Bloc

Un bloc appartient à un tunnel.
Il peut être de type :

formulaire
tarif
paiement
information
upload
éventuellement trigger / event technique si modélisé comme nœud

Un bloc peut contenir sa propre logique interne.

3. Étape

Une étape est un groupe de questions à l’intérieur d’un bloc.
Les étapes sont elles-mêmes reliées par un workflow conditionnel.

Chaque étape peut contenir :

un texte d’introduction
une liste de questions
des textes d’aide ou d’explication
des règles de redirection
des événements déclenchés entre étapes

Le transcript confirme qu’un bloc formulaire peut comporter texte d’introduction, questions et textes explicatifs de question.

4. Bloc tarif

Le bloc tarif ressemble fortement à un bloc formulaire, mais avec des capacités supplémentaires.

À la fin du parcours de questions, il doit être capable de :

déterminer une formule tarifaire
afficher le montant
demander le mode de règlement
demander le nombre de paiements

Ce comportement est explicitement décrit dans le transcript.

5. Questionnaire tarifaire

Le questionnaire tarifaire est une logique de questions utilisée pour collecter les informations nécessaires à la détermination de la formule.

Il est associé à un ou plusieurs tunnels. Le document indique qu’il permet de créer des étapes, des questions, des conditions de renvoi et qu’en fin d’exécution il affiche le montant à payer et demande les modalités de paiement.

6. Schéma de calcul

Le schéma de calcul est un graphe de décision qui utilise des variables et leurs valeurs pour déterminer une formule tarifaire.

Le document précise que l’application de détermination des schémas de calcul utilise des variables et leur valeur, crée un enchaînement de variables conditionné par la valeur, et aboutit soit à une autre variable, soit à une formule tarifaire.

Le transcript confirme qu’il faut prévoir plusieurs schémas de calcul, associés à des produits, et non directement aux tunnels.

7. Formule tarifaire

Une formule tarifaire est une définition de calcul qui produit un montant détaillé par type de prestation.

Le document précise que la formule transmet le tarif regroupé par type de prestation, par exemple pédagogie, CRIO, BU, etc.

8. Variables

Les variables proviennent de plusieurs sources :

dossier / formation personnalisée
produit d’inscription
réponses de l’étudiant
variables globales

Le document et le transcript listent explicitement ces sources.

En phase 1, l’application doit pouvoir simuler / référencer ces variables même si les récupérations backend réelles ne sont pas encore branchées.
L’idée est de préparer un système où, plus tard, il suffira d’appeler des fonctions backend pour récupérer :

la liste des variables,
leurs valeurs possibles,
leurs valeurs réelles.
Chaîne conceptuelle principale

Le modèle métier cible est le suivant :

une formation personnalisée connaît son produit
le produit permet de déterminer :
le tunnel
le schéma de calcul
le tunnel permet d’accéder au questionnaire tarifaire
les réponses au questionnaire + les variables disponibles permettent de parcourir le schéma de calcul
le schéma permet de déterminer une formule tarifaire
la formule permet de calculer le montant détaillé

Le transcript explicite précisément cette chaîne.

Périmètre fonctionnel phase 1
A. Gestion des tunnels

L’administrateur arrive sur une page listant les tunnels sous forme de cards.

Chaque card doit permettre :

d’afficher l’identifiant du tunnel
d’afficher sa description
d’afficher les produits associés
de modifier l’identifiant
de modifier la description
d’accéder à des actions via dropdown ou menu
d’ouvrir l’éditeur visuel du tunnel
B. Éditeur visuel d’un tunnel

L’éditeur doit afficher le tunnel sous forme de graphe Mermaid interactif.

Fonctionnalités attendues :

afficher les blocs
ajouter un bloc
supprimer un bloc
modifier un bloc
relier des blocs
définir des conditions sur les transitions
définir des triggers / events
ouvrir une modale au clic sur un bloc
re-rendre le diagramme après modification
C. Gestion des blocs

Chaque type de bloc doit avoir un comportement spécifique.

Bloc formulaire
gestion des étapes
gestion des questions
textes d’introduction
textes d’aide
redirections conditionnelles
events optionnels
Bloc tarif
tout ce qu’a le bloc formulaire
possibilité d’attacher un schéma de calcul existant
possibilité de créer un nouveau schéma de calcul
possibilité d’utiliser les questions du bloc dans le schéma de calcul
affichage de la formule déterminée
affichage du montant simulé
paramétrage mode de règlement / nb de paiements
D. Éditeur visuel d’étapes

Chaque bloc ayant une logique interne doit permettre l’accès à un designer d’étapes utilisant la même UX que le designer de tunnel.

Fonctionnalités :

afficher les étapes
ajouter une étape
supprimer une étape
modifier une étape
relier les étapes
définir conditions de passage
définir événements entre étapes
gérer questions et textes d’explication
E. Gestion des schémas de calcul

L’application doit proposer une liste de schémas de calcul.

Pour chaque schéma :

identifiant
libellé
description
produits associés
variables utilisées
formules atteignables
indicateurs d’usage

Éditeur visuel :

nœuds de variables
nœuds de formule
branches conditionnelles
sorties vers autre variable
alertes si aucun résultat
modales contextuelles
même UX Mermaid interactive
F. Gestion des formules tarifaires

L’application doit permettre :

lister les formules
créer une formule
modifier une formule
supprimer / désactiver une formule
voir où elle est utilisée
voir dans combien de schémas elle apparaît
visualiser sa structure

Le transcript insiste sur le besoin de traçabilité et d’administration des formules et de leurs usages.

G. Gestion des variables

Le système doit permettre de référencer des variables avec au minimum :

identifiant technique
libellé
source
type
valeurs possibles
description
utilisable dans schéma ?
utilisable dans formule ?
mode d’alimentation :
mock
manuel
backend

Sources minimales :

produit
dossier / formation personnalisée
réponses étudiant
variables globales
H. Variables globales

Il faut prévoir une administration de variables globales décrivant les tarifs :

droits nationaux
BU
transfert
CRIO
tranches
autres montants globaux

Le transcript propose clairement cette idée d’un référentiel paramétrable de variables globales.

Principes UI/UX
1. Uniformité entre les 3 designers

Les trois composants suivants doivent fonctionner avec la même logique UX :

designer de tunnel
designer d’étapes
designer de schéma de calcul
2. Mermaid interactif

Le diagramme Mermaid est le support central d’édition.

Il ne s’agit pas d’une simple visualisation.
C’est une surface d’édition métier.

3. Interaction

Chaque nœud doit être cliquable et ouvrir une modale ou un panneau selon son type.

Exemples :

bloc de tunnel → config du bloc
étape → questions, textes, redirections
variable → source, valeurs, branches
formule → aperçu et usages
trigger → email, sms, action
4. Lisibilité

Le système devra rester lisible même sur des graphes complexes :

hiérarchie visuelle claire
couleurs par type d’objet
pan / zoom si nécessaire
re-render rapide
labels explicites
Contraintes d’architecture

L’application doit être conçue en séparant clairement :

Socle générique de graph editing
structure des nœuds
structure des liens
moteur Mermaid
mapping modèle → Mermaid
binding des événements
ouverture de modales
mise à jour du JSON
re-render
Couches métier spécialisées
tunnel
étapes
schéma de calcul
formules
variables
Hors périmètre phase 1

Ne pas implémenter pour l’instant :

exécution complète côté étudiant
paiement réel
récupération réelle des variables backend
intégration email / sms réelle
import API réel depuis systèmes externes
moteur final de facturation / encaissement

En revanche, il faut préparer leur intégration future.

Résultat attendu de la phase 1

Une application Back Office capable de :

administrer les tunnels
modéliser les blocs et leurs relations
modéliser les étapes et leurs relations
modéliser les schémas de calcul
administrer variables et formules
offrir une UX homogène basée sur Mermaid interactif
servir de base propre pour brancher ensuite l’exécution étudiante et le backend réel
2. Prompt complet pour un agent IA dans VSCode

Tu peux donner ce prompt tel quel à ton agent IA, ou me demander ensuite une version encore plus directive, par exemple : “génère l’architecture des fichiers”, “fais-moi le MVP React”, “propose le modèle de données”, etc.

Prompt

Je veux que tu m’aides à concevoir et développer un Back Office de configuration visuelle de tunnels d’inscription et de tarification.

Attention : ce projet n’est pas un simple form builder.
C’est un studio d’orchestration métier visuelle permettant à des administrateurs de modéliser des workflows complexes.

Objectif de la phase actuelle

Nous travaillons uniquement sur la phase 1 Back Office.

Cette phase doit permettre :

la gestion des tunnels
la gestion des blocs d’un tunnel
la gestion des étapes de questions à l’intérieur d’un bloc
la gestion des schémas de calcul
la gestion des formules tarifaires
la gestion des variables et de leurs sources

La phase d’exécution côté étudiant viendra plus tard et n’est pas à développer maintenant.

Vision produit

L’application doit proposer plusieurs éditeurs visuels utilisant la même logique UI/UX :

éditeur de tunnels
pour modéliser le workflow entre blocs
éditeur d’étapes
pour modéliser le workflow entre étapes de questions à l’intérieur d’un bloc
éditeur de schémas de calcul
pour modéliser le workflow entre variables, conditions et formules

Ces trois éditeurs doivent fonctionner avec une même philosophie d’interaction, basée sur un diagramme Mermaid interactif.

Le diagramme Mermaid n’est pas juste un rendu.
C’est une surface d’édition métier.

Principes UI/UX obligatoires

Je veux une architecture UI/UX proche de cette logique :

un modèle métier JSON sert de source de vérité
ce modèle est converti en Mermaid
les nœuds Mermaid sont interactifs
cliquer sur un nœud ouvre une modale ou un panneau contextuel
la modale permet de modifier les propriétés métier
les modifications mettent à jour le JSON
le diagramme est regénéré immédiatement

Je veux que cette logique soit réutilisable entre :

tunnels
étapes
schémas de calcul

Donc pense le projet comme un framework interne de graph editing Mermaid, spécialisé ensuite par domaine métier.

Concepts métier à modéliser
Tunnel

Un tunnel possède :

un identifiant libre
une description
des produits associés
une liste de blocs
des transitions entre blocs
des conditions
des triggers / events optionnels
Bloc

Un bloc appartient à un tunnel et peut être de type :

formulaire
tarif
paiement
information
upload

Un bloc peut contenir sa propre logique interne.

Étape

Une étape est un groupe de questions dans un bloc.

Une étape possède potentiellement :

un identifiant
un titre
un texte d’introduction
une liste de questions
des textes d’aide ou d’explication
des transitions vers d’autres étapes
des conditions de redirection
des événements optionnels
Bloc formulaire

Le bloc formulaire gère :

les étapes
les questions
les textes d’introduction
les transitions
les conditions
les events
Bloc tarif

Le bloc tarif est proche du bloc formulaire, mais doit aussi permettre :

d’attacher un schéma de calcul existant
de créer un schéma de calcul
d’exploiter les questions du bloc dans le schéma de calcul
de déterminer une formule tarifaire
d’afficher un montant simulé
de définir le mode de règlement
de définir le nombre de paiements
Schéma de calcul

Le schéma de calcul est un graphe de décision :

on teste des variables
selon leurs valeurs, on va vers :
une autre variable
ou une formule tarifaire

Le schéma doit être associé à un ou plusieurs produits, pas directement au tunnel.

Formule tarifaire

Une formule tarifaire calcule un montant détaillé par type de prestation.

Elle doit pouvoir utiliser :

des variables globales
des variables du dossier
potentiellement des réponses du questionnaire si elles sont stockées dans le dossier / la FP
Variables

Les variables viennent de plusieurs sources :

produit
dossier / formation personnalisée
réponses étudiant
variables globales

Pour la phase 1, il faut concevoir le système pour qu’on puisse simuler ces variables et leurs valeurs possibles, avant branchement backend réel.

Parcours attendu dans l’application
Écran liste des tunnels

L’administrateur arrive sur une liste de tunnels sous forme de cards.

Chaque card doit afficher :

identifiant du tunnel
description
produits associés

Chaque card doit permettre :

modifier l’identifiant
modifier la description
accéder via dropdown à des actions
ouvrir l’éditeur visuel du tunnel
Éditeur de tunnel

L’éditeur du tunnel doit afficher le workflow entre blocs sous forme de Mermaid interactif.

Fonctions attendues :

ajouter un bloc
éditer un bloc
supprimer un bloc
relier des blocs
définir des conditions sur les liens
définir des triggers / events
ouvrir une modale selon le type du bloc
Éditeur d’étapes

Depuis un bloc, on doit pouvoir ouvrir un second éditeur visuel montrant les étapes de questions.

Fonctions attendues :

ajouter une étape
éditer une étape
supprimer une étape
relier des étapes
définir les conditions de passage
gérer les questions et les textes explicatifs
Éditeur de schéma de calcul

L’application doit proposer une liste de schémas de calcul et un éditeur visuel Mermaid interactif.

Fonctions attendues :

ajouter une variable
ajouter une formule
relier les nœuds
définir les valeurs qui déclenchent chaque branche
définir les sorties
détecter les cas non couverts
afficher usages et associations
Gestion des formules

Prévoir une interface d’administration des formules tarifaires :

liste
création
édition
suppression logique ou désactivation
traçabilité des usages
voir dans quels schémas chaque formule apparaît
Gestion des variables

Prévoir un référentiel de variables avec :

identifiant technique
libellé
source
type
description
valeurs possibles
compatibilité schéma / formule
mode d’alimentation :
mock
manuel
backend
Architecture attendue

Je veux une architecture propre, modulaire et extensible.

Conçois l’application avec :

1. Un socle générique de graph editing

Ce socle doit gérer :

modèle de nœuds
modèle de liens
transformation vers Mermaid
gestion des clics
ouverture de modales
mise à jour du state
re-render du diagramme
2. Trois couches spécialisées
tunnel designer
steps designer
calculation schema designer
3. Couche métier séparée
tunnels
blocs
étapes
questions
schémas de calcul
formules
variables
4. Data model clair

Propose des modèles de données robustes pour :

Tunnel
Block
Step
Question
Transition
Condition
Trigger
CalculationSchema
VariableNode
Formula
VariableDefinition
Important

Ne me propose pas une solution trop simplifiée.

Je veux explicitement que tu prennes en compte :

le caractère visuel et interactif du projet
l’uniformité UX entre les 3 types d’éditeurs
la séparation entre questionnaire tarifaire, schéma de calcul et formule tarifaire
la future intégration backend
la maintenabilité
la possibilité de faire grossir l’outil
Ce que je veux de toi comme livrables

Je veux que tu me proposes, dans cet ordre :

une architecture fonctionnelle
une architecture technique
un modèle de données
une proposition d’arborescence projet
une stratégie de composants réutilisables
un MVP réaliste
une roadmap d’implémentation par étapes
puis du code propre et structuré

Quand tu proposes du code :

sois modulaire
évite le code jetable
nomme clairement les concepts métier
sépare le socle générique Mermaid des couches métier
pense extensibilité
Contraintes supplémentaires
La phase 1 ne doit pas implémenter l’exécution réelle côté étudiant
La phase 1 ne doit pas dépendre d’un backend complet pour fonctionner
Il faut prévoir des données mockées / simulées
Il faut rendre le système prêt à brancher plus tard sur des fonctions backend réelles
Le design doit rester lisible même pour des graphes complexes
Ce que je veux en premier maintenant

Commence par me proposer :

la cartographie complète des modules
le modèle de données recommandé
l’architecture des composants frontend
puis un plan d’implémentation MVP

Ne code pas tout d’un coup.
Commence par cadrer proprement la conception.
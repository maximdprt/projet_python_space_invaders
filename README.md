# Space Invaders · Eugenia Arcade

![La salle d'arcade](docs/capture.png)

Un **Space Invaders écrit en Python pur**, avec uniquement les notions du cours, qui tourne dans une **salle d'arcade 3D** dans le navigateur. On se promène entre les 10 bornes de l'atelier, on s'approche de la borne 10 et on joue : le jeu Python s'exécute dans la page grâce à Pyodide et s'affiche sur l'écran de la borne.

Projet 10 de l'atelier « 10 projets, à vous de jouer » · Eugenia School, Bachelor 2 · **Corentin & Maxim**.

## Le jeu en Python pur

Toute la logique du jeu tient dans **4 fichiers** de `src/space_invaders/`. Le JavaScript ne fait que lire le clavier, appeler Python et dessiner ce que Python renvoie : aucune règle n'est codée en JS.

```
niveaux.py  ◄──  entites.py  ◄──  flotte.py  ◄──  partie.py
(réglages)       (les objets)      (la grille)      (les règles)
```

| Fichier | Rôle |
|---|---|
| `niveaux.py` | Constantes de l'écran, points, les 5 **paliers** (liste de dictionnaires) et le calcul des paramètres de chaque vague. |
| `entites.py` | `Entite` et ses enfants : `Vaisseau`, `Missile`, `Ennemi`, `EnnemiBlinde`, `Soucoupe`. Collisions, tirs, vies. |
| `flotte.py` | `Flotte` : la grille d'ennemis, son avancée, sa descente, son accélération et sa riposte. |
| `partie.py` | `Partie` : assemble tout, applique les règles à chaque image (tick) et renvoie l'état à afficher. |

### Notions du cours utilisées

| Notion | Où |
|---|---|
| Listes de dictionnaires | `PALIERS` dans `niveaux.py` |
| Boucle `for` + accumulateur | `palier_pour`, `plus_bas`, `trouver_tireurs` |
| Boucles imbriquées | `Flotte.creer_grille` |
| Listes en compréhension | `Flotte.vivants`, `Partie.nettoyer` |
| Tuples + déballage dans un `for` | `CANONS` et `Vaisseau.tirer` |
| `d.get(cle, defaut)` | `Ennemi.__init__`, `Flotte.trouver_tireurs` |
| Classes, `__init__`, méthodes | toutes les entités, `Flotte`, `Partie` |
| `@property` + setter + `raise ValueError` | `Vaisseau.vies` |
| Héritage + `super()` + redéfinition | `decrire()` dans chaque entité, `EnnemiBlinde.tirer` |
| `isinstance` | `Flotte.tir_de` |
| Composition / délégation | `Partie` possède un `Vaisseau` et une `Flotte` |
| Expression ternaire | `Vaisseau.tirer`, `Soucoupe.__init__` |
| `random` | riposte, blindés, soucoupe |
| `if __name__ == "__main__":` | démo du moteur dans `partie.py` |

Aucun commentaire ni docstring dans ces fichiers, et aucune notion hors cours. Le script `outils/verifier_notions.py` le vérifie automatiquement.

## Règles du jeu

- 3 vies au départ (5 maximum, +1 à chaque palier).
- Les envahisseurs avancent, descendent à chaque bord et accélèrent quand la flotte se vide. Ils ripostent : seul le plus bas de chaque colonne tire.
- Méduse 10 pts, crabe 20 pts, poulpe 30 pts, blindé 40 pts (3 tirs pour le détruire), soucoupe mystère 50 à 300 pts.
- Quand une flotte est détruite, une nouvelle vague arrive, plus rapide et plus agressive (+100 × numéro de vague).
- **5 paliers** selon le nombre total d'ennemis tués (0, 25, 70, 140, 240) : RECRUE, PILOTE, AS, ELITE, LEGENDE. À chaque palier, le vaisseau se transforme et change d'arme (simple, double, triple, éventail, laser perforant), et les vagues suivantes deviennent beaucoup plus dures.
- Défaite si on n'a plus de vies, si un envahisseur touche le vaisseau ou si la flotte atteint la ligne du bas.

## Touches

| Dans la salle | Dans le jeu (borne 10) |
|---|---|
| **Z Q S D** (ou WASD, flèches) : se déplacer | **← →** : bouger |
| **Souris** : regarder · **Maj** : courir | **Espace** : tirer, démarrer, rejouer |
| **E** : jouer à la borne visée | **P** : pause |
| **H** : aide · **F1** : qualité graphique | **Échap** : revenir dans la salle |

## Installation et lancement (Windows, PowerShell)

Depuis la racine du projet :

```powershell
# 1. Environnement Python (une seule fois)
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # si bloqué : Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
python -m pip install --upgrade pip
pip install -e ".[dev]"

# 2. Salle 3D (une seule fois, puis à chaque modification du JS)
cd salle
npm install
npm run build
cd ..

# 3. Lancer
python main.py

# Tests
pytest

# Audit des notions du cours
python outils/verifier_notions.py

# Démo du moteur sans affichage
python -m space_invaders.partie
```

Développement de la salle avec rechargement à chaud : `cd salle ; npm run dev` (le lancement des projets en terminal ne marche qu'avec `python main.py` lancé à côté, Vite redirige `/api` vers lui). Modifier un fichier de `src/space_invaders/` recharge directement le jeu dans la borne.

Tout fonctionne **hors ligne** : Three.js, Pyodide et les polices sont installés par npm et copiés dans `salle/dist/`.

## Architecture

```
navigateur (Chrome / Edge)
  salle/src (JavaScript, Three.js)
   ├─ salle 3D, 10 bornes, déplacement FPS
   ├─ écran de la borne 10 = canvas 2D utilisé comme texture 3D
   └─ pont_python.js ──► Pyodide (Python dans le navigateur)
                            └─ exécute src/space_invaders/*.py
        60 fois par seconde : partie.mettre_a_jour(gauche, droite, tir) puis partie.etat()
                    ▲
                    │ http://localhost:8000
main.py ─► lanceur/serveur.py (http.server de la bibliothèque standard)
             ├─ sert salle/dist/
             └─ POST /api/lancer/<numero> → ouvre un terminal sur projets/projet_XX/main.py
```

- `main.py` ne contient aucune logique : il appelle `lanceur.serveur.demarrer_salle()`.
- Le port se change avec la variable d'environnement `PORT_SALLE` (8000 par défaut).
- Les fichiers Python du jeu ne sont **jamais copiés** : la salle les importe tels quels depuis `src/space_invaders/` au moment du build.

## Brancher le projet d'un autre binôme

Voir [`projets/LISEZ_MOI.md`](projets/LISEZ_MOI.md) : on met son `main.py` dans `projets/projet_XX_nom/`, on passe `"disponible": true` dans `projets/projets.json`, et la touche **E** devant la borne ouvre un terminal qui lance le jeu.

## Tests

```powershell
pytest
```

Les tests (`tests/`) couvrent les paliers, les collisions, les vies, chaque arme, les blindés, la flotte (rebond, descente, accélération), le démarrage, le score, les paliers, les vagues, la défaite et le contrat de `etat()`.

## Crédits

Corentin & Maxim · Eugenia School · Atelier Python 2026.
Three.js, Pyodide, polices Press Start 2P et Orbitron (licence OFL).

# Brancher son projet sur une borne

Chaque borne de la salle (1 à 9) lance le projet d'un binôme dans une fenêtre de terminal.

1. Mets ton projet dans `projets/projet_XX_nom/` (le dossier existe déjà) avec un fichier `main.py` qui se lance avec `python main.py`.
2. Passe `"disponible": true` pour ton numéro dans `projets/projets.json`.
3. C'est tout : relance `python main.py` à la racine, va devant ta borne et appuie sur **E**. Un terminal s'ouvre et lance ton jeu.

Conseils :
- Ton `main.py` est lancé depuis ton propre dossier (`cwd`), tu peux donc ouvrir tes fichiers avec des chemins relatifs.
- Termine par un `input("Appuie sur Entrée pour quitter...")` pour que la fenêtre ne se ferme pas d'un coup à la fin de la partie.
- Le nom, le binôme et la couleur affichés sur la borne viennent aussi de `projets.json`.

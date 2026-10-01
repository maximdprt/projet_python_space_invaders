"""Audit des notions du cours dans les 4 fichiers du jeu (hors package, hors contrainte)."""
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
FICHIERS = ["niveaux.py", "entites.py", "flotte.py", "partie.py"]

MOTS_INTERDITS = [
    "try", "except", "finally", "lambda", "break", "continue", "pass", "enumerate", "zip",
    "sorted", "global", "nonlocal", "staticmethod", "classmethod", "dataclass", "dataclasses",
    "assert", "yield", "pygame", "tkinter", "is",
]
MOTIFS_INTERDITS = [
    "min(", "abs(", "round(", ".sort(", ".pop(", ".items(", ".keys(", ".values(", "set(",
    "//", "**", "*args", "**kwargs", ":=", "->", "#", '"""', "'''", "__str__", "__repr__",
    "__eq__", "import time", "import math", "match ", "case ", "async ", "await ",
]
IMPORTS_AUTORISES = re.compile(r"^(import random|from space_invaders\.\w+ import .+)$")


def retirer_chaines(ligne):
    return re.sub(r"\"[^\"]*\"|'[^']*'", '""', ligne)


def auditer_fichier(chemin):
    fautes = []
    lignes = chemin.read_text(encoding="utf-8").splitlines()
    dans_bloc_main = False
    for numero, ligne in enumerate(lignes, start=1):
        if ligne.startswith('if __name__ == "__main__":'):
            dans_bloc_main = True
        code = retirer_chaines(ligne)
        for mot in MOTS_INTERDITS:
            if re.search(rf"\b{mot}\b", code):
                fautes.append((numero, mot, ligne))
        for motif in MOTIFS_INTERDITS:
            if motif in code:
                fautes.append((numero, motif, ligne))
        if re.search(r"\bprint\(", code) and not dans_bloc_main:
            fautes.append((numero, "print hors __main__", ligne))
        if re.search(r"\w\s*:\s*(int|str|float|bool|list|dict)\b", code) and "def " in code:
            fautes.append((numero, "annotation de type", ligne))
        if code.startswith(("import ", "from ")) and not IMPORTS_AUTORISES.match(code.strip()):
            if not code.rstrip().endswith("("):
                fautes.append((numero, "import non autorisé", ligne))
            elif not code.startswith("from space_invaders."):
                fautes.append((numero, "import non autorisé", ligne))
        if re.search(r"def __(?!init__)\w+__", code):
            fautes.append((numero, "méthode spéciale", ligne))
    return fautes


def main():
    total = 0
    for nom in FICHIERS:
        chemin = RACINE / "projets" / "projet_10_space_invaders" / "space_invaders" / nom
        fautes = auditer_fichier(chemin)
        nb_lignes = len(chemin.read_text(encoding="utf-8").splitlines())
        print(f"{nom:12} {nb_lignes:4} lignes, {len(fautes)} écart(s)")
        for numero, motif, ligne in fautes:
            print(f"   ligne {numero}: [{motif}] {ligne.strip()}")
        total += len(fautes)
    if total == 0:
        print("OK — notions du cours respectées")
        return 0
    print(f"{total} écart(s) à corriger")
    return 1


if __name__ == "__main__":
    sys.exit(main())

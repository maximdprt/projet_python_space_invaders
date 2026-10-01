import random

from space_invaders.entites import Ennemi
from space_invaders.niveaux import LARGEUR, parametres_vague

SORTES = ["poulpe", "crabe", "crabe", "meduse", "meduse"]


class Flotte:
    def __init__(self, vague):
        parametres = parametres_vague(vague)
        self.vitesse = parametres["vitesse"] + 0.1 * vague
        self.proba_tir = parametres["proba_tir"]
        self.direction = 1
        self.ennemis = []
        for ligne in range(parametres["lignes"]):
            for colonne in range(9):
                self.ennemis.append(
                    Ennemi(142 + colonne * 60, 70 + ligne * 45, SORTES[ligne])
                )

    def avancer(self):
        au_bord = False
        for ennemi in self.ennemis:
            ennemi.deplacer(self.vitesse * self.direction, 0)
            if ennemi.x < 0 or ennemi.x + ennemi.largeur > LARGEUR:
                au_bord = True
        if au_bord:
            self.direction = -self.direction
            for ennemi in self.ennemis:
                ennemi.deplacer(0, 14)

    def riposter(self):
        if len(self.ennemis) > 0 and random.random() < self.proba_tir:
            return [random.choice(self.ennemis).tirer()]
        return []

    def plus_bas(self):
        bas = 0
        for ennemi in self.ennemis:
            if ennemi.y + ennemi.hauteur > bas:
                bas = ennemi.y + ennemi.hauteur
        return bas

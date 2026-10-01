import random

from space_invaders.niveaux import LARGEUR_ECRAN, DESCENTE
from space_invaders.entites import Ennemi, EnnemiBlinde

ECART_X = 52
ECART_Y = 42
SORTES_PAR_LIGNE = ["poulpe", "crabe", "crabe", "meduse", "meduse"]


class Flotte:
    def __init__(self, parametres):
        self.vitesse = parametres["vitesse_flotte"]
        self.proba_tir = parametres["proba_tir"]
        self.vitesse_tir = parametres["vitesse_tir"]
        self.direction = 1
        self.ennemis = []
        colonnes = parametres["colonnes"]
        depart_x = (LARGEUR_ECRAN - colonnes * ECART_X) / 2
        for ligne in range(parametres["lignes"]):
            for colonne in range(colonnes):
                x = depart_x + colonne * ECART_X
                y = 70 + ligne * ECART_Y
                if random.random() < parametres["part_blindes"]:
                    self.ennemis.append(EnnemiBlinde(x, y))
                else:
                    self.ennemis.append(Ennemi(x, y, SORTES_PAR_LIGNE[ligne]))
        self.total = len(self.ennemis)

    def nettoyer(self):
        self.ennemis = [ennemi for ennemi in self.ennemis if ennemi.vivant]

    def deplacer_tous(self, dx, dy):
        for ennemi in self.ennemis:
            ennemi.deplacer(dx, dy)

    def touche_un_bord(self, pas):
        au_bord = False
        for ennemi in self.ennemis:
            if ennemi.x + pas < 0 or ennemi.x + ennemi.largeur + pas > LARGEUR_ECRAN:
                au_bord = True
        return au_bord

    def avancer(self):
        pas = self.vitesse * (2 - len(self.ennemis) / self.total) * self.direction
        if self.touche_un_bord(pas):
            self.direction = -self.direction
            self.deplacer_tous(0, DESCENTE)
        else:
            self.deplacer_tous(pas, 0)

    def plus_bas(self):
        plus_bas = 0
        for ennemi in self.ennemis:
            if ennemi.y + ennemi.hauteur > plus_bas:
                plus_bas = ennemi.y + ennemi.hauteur
        return plus_bas

    def riposter(self):
        if len(self.ennemis) > 0 and random.random() < self.proba_tir:
            return [random.choice(self.ennemis).tirer(self.vitesse_tir)]
        return []

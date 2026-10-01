import random

from space_invaders.niveaux import LARGEUR_ECRAN, HAUT_FLOTTE, ECART_X, ECART_Y
from space_invaders.entites import Ennemi, EnnemiBlinde, Missile


class Flotte:
    def __init__(self, parametres):
        self.vitesse = parametres["vitesse_flotte"]
        self.descente = parametres["descente"]
        self.proba_tir = parametres["proba_tir"]
        self.vitesse_tir = parametres["vitesse_tir_ennemi"]
        self.direction = 1
        self.ennemis = []
        self.creer_grille(parametres["lignes"], parametres["colonnes"], parametres["part_blindes"])
        self.total_depart = len(self.ennemis)

    def creer_grille(self, lignes, colonnes, part_blindes):
        largeur_grille = (colonnes - 1) * ECART_X + 36
        depart_x = (LARGEUR_ECRAN - largeur_grille) / 2
        for ligne in range(lignes):
            for colonne in range(colonnes):
                x = depart_x + colonne * ECART_X
                y = HAUT_FLOTTE + ligne * ECART_Y
                if random.random() < part_blindes:
                    self.ennemis.append(EnnemiBlinde(x, y))
                else:
                    self.ennemis.append(Ennemi(x, y, self.sorte_de_ligne(ligne)))

    def sorte_de_ligne(self, ligne):
        if ligne == 0:
            return "poulpe"
        elif ligne <= 2:
            return "crabe"
        return "meduse"

    def vivants(self):
        return [ennemi for ennemi in self.ennemis if ennemi.vivant]

    def nettoyer(self):
        self.ennemis = self.vivants()

    def vitesse_effective(self):
        if self.total_depart == 0:
            return self.vitesse
        part_detruite = 1 - len(self.vivants()) / self.total_depart
        return self.vitesse * (1 + 1.5 * part_detruite)

    def touche_un_bord(self, largeur_ecran):
        pas = self.vitesse_effective() * self.direction
        au_bord = False
        for ennemi in self.vivants():
            if ennemi.x + pas < 0 or ennemi.x + ennemi.largeur + pas > largeur_ecran:
                au_bord = True
        return au_bord

    def avancer(self, largeur_ecran):
        if self.touche_un_bord(largeur_ecran):
            for ennemi in self.ennemis:
                ennemi.deplacer(0, self.descente)
            self.direction = -self.direction
        else:
            pas = self.vitesse_effective() * self.direction
            for ennemi in self.ennemis:
                ennemi.deplacer(pas, 0)

    def plus_bas(self):
        plus_bas = 0
        for ennemi in self.vivants():
            if ennemi.y + ennemi.hauteur > plus_bas:
                plus_bas = ennemi.y + ennemi.hauteur
        return plus_bas

    def est_vide(self):
        return len(self.vivants()) == 0

    def trouver_tireurs(self):
        tireurs = {}
        colonnes = []
        for ennemi in self.vivants():
            colonne = int(ennemi.x / ECART_X)
            actuel = tireurs.get(colonne, ennemi)
            if ennemi.y >= actuel.y:
                tireurs[colonne] = ennemi
            if colonne not in colonnes:
                colonnes.append(colonne)
        return [tireurs[colonne] for colonne in colonnes]

    def riposter(self, palier_index):
        missiles = []
        for tireur in self.trouver_tireurs():
            if random.random() < self.proba_tir:
                missiles.append(self.tir_de(tireur, palier_index))
        return missiles

    def tir_de(self, tireur, palier_index):
        blinde = isinstance(tireur, EnnemiBlinde)
        if palier_index >= 3 and not blinde and random.randint(1, 4) == 1:
            x = tireur.x + tireur.largeur / 2 - 3
            return Missile(x, tireur.y + tireur.hauteur, 2, self.vitesse_tir, "ennemi", "zigzag")
        return tireur.tirer(self.vitesse_tir)

    def decrire(self):
        return [ennemi.decrire() for ennemi in self.vivants()]

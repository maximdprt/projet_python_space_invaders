import random

from space_invaders.niveaux import LIGNE_DEFAITE, PROBA_BONUS
from space_invaders.entites import Vaisseau, Bonus
from space_invaders.flotte import Flotte


class Partie:
    def __init__(self):
        self.statut = "accueil"
        self.tir_precedent = False
        self.nouvelle_partie()

    def nouvelle_partie(self):
        self.score = 0
        self.ennemis_tues = 0
        self.vague = 1
        self.vaisseau = Vaisseau()
        self.flotte = Flotte(1)
        self.missiles = []
        self.bonus = []
        self.explosions = []

    def mettre_a_jour(self, gauche, droite, tir):
        nouvel_appui = tir and not self.tir_precedent
        self.tir_precedent = tir
        if self.statut == "en_cours":
            self.jouer(gauche, droite, tir)
        elif nouvel_appui:
            self.nouvelle_partie()
            self.statut = "en_cours"

    def jouer(self, gauche, droite, tir):
        self.explosions = []
        if gauche:
            self.vaisseau.bouger(-1)
        if droite:
            self.vaisseau.bouger(1)
        if tir:
            self.missiles += self.vaisseau.tirer()
        self.vaisseau.mettre_a_jour()
        self.missiles += self.flotte.riposter()
        self.flotte.avancer()
        for objet in self.missiles + self.bonus:
            objet.avancer()
        self.toucher_ennemis()
        self.toucher_vaisseau()
        self.ramasser_bonus()
        self.missiles = [missile for missile in self.missiles if missile.vivant]
        self.bonus = [bonus for bonus in self.bonus if bonus.vivant]
        self.flotte.ennemis = [ennemi for ennemi in self.flotte.ennemis if ennemi.vivant]
        self.verifier_vague()
        self.verifier_defaite()

    def toucher_ennemis(self):
        for missile in self.missiles:
            for ennemi in self.flotte.ennemis:
                if missile.sorte == "tir" and missile.vivant and ennemi.vivant and missile.touche(ennemi):
                    missile.vivant = False
                    ennemi.vivant = False
                    self.score += ennemi.points
                    self.ennemis_tues += 1
                    self.explosions.append(ennemi.decrire())
                    if random.random() < PROBA_BONUS:
                        self.bonus.append(Bonus(ennemi.x + 7, ennemi.y))

    def toucher_vaisseau(self):
        for missile in self.missiles:
            if missile.sorte == "plasma" and missile.touche(self.vaisseau):
                missile.vivant = False
                self.vaisseau.perdre_vie()

    def ramasser_bonus(self):
        for bonus in self.bonus:
            if bonus.touche(self.vaisseau):
                bonus.vivant = False
                self.vaisseau.evoluer()

    def verifier_vague(self):
        if len(self.flotte.ennemis) == 0:
            self.vague += 1
            self.flotte = Flotte(self.vague)

    def verifier_defaite(self):
        if self.vaisseau.vies == 0 or self.flotte.plus_bas() > LIGNE_DEFAITE:
            self.statut = "perdu"

    def etat(self):
        return {
            "statut": self.statut,
            "score": self.score,
            "vies": self.vaisseau.vies,
            "vague": self.vague,
            "forme": self.vaisseau.forme + 1,
            "duree_forme": self.vaisseau.duree_forme,
            "ennemis_tues": self.ennemis_tues,
            "vaisseau": self.vaisseau.decrire(),
            "ennemis": [ennemi.decrire() for ennemi in self.flotte.ennemis],
            "missiles": [missile.decrire() for missile in self.missiles],
            "bonus": [bonus.decrire() for bonus in self.bonus],
            "explosions": self.explosions,
        }

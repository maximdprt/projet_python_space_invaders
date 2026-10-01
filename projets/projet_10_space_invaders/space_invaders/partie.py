from space_invaders.niveaux import LIGNE_DEFAITE, PALIERS, palier_pour
from space_invaders.entites import Vaisseau
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
        self.palier = 0
        self.vaisseau = Vaisseau()
        self.flotte = Flotte(PALIERS[0], 1)
        self.missiles = []
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
        for missile in self.missiles:
            missile.avancer()
        self.toucher_ennemis()
        self.toucher_vaisseau()
        self.missiles = [missile for missile in self.missiles if missile.vivant]
        self.flotte.ennemis = [ennemi for ennemi in self.flotte.ennemis if ennemi.vivant]
        self.verifier_palier()
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

    def toucher_vaisseau(self):
        for missile in self.missiles:
            if missile.sorte == "plasma" and missile.touche(self.vaisseau):
                missile.vivant = False
                self.vaisseau.perdre_vie()

    def verifier_palier(self):
        nouveau_palier = palier_pour(self.ennemis_tues)
        if nouveau_palier > self.palier:
            self.palier = nouveau_palier
            self.vaisseau.evoluer(PALIERS[nouveau_palier])

    def verifier_vague(self):
        if len(self.flotte.ennemis) == 0:
            self.vague += 1
            self.flotte = Flotte(PALIERS[self.palier], self.vague)

    def verifier_defaite(self):
        if self.vaisseau.vies == 0 or self.flotte.plus_bas() > LIGNE_DEFAITE:
            self.statut = "perdu"

    def etat(self):
        return {
            "statut": self.statut,
            "score": self.score,
            "vies": self.vaisseau.vies,
            "vague": self.vague,
            "palier": PALIERS[self.palier]["nom"],
            "ennemis_tues": self.ennemis_tues,
            "vaisseau": self.vaisseau.decrire(),
            "ennemis": [ennemi.decrire() for ennemi in self.flotte.ennemis],
            "missiles": [missile.decrire() for missile in self.missiles],
            "explosions": self.explosions,
        }

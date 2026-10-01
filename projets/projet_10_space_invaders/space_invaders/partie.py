import random

from space_invaders.niveaux import LIGNE_DEFAITE, PAUSE_ENTRE_VAGUES, PALIERS
from space_invaders.niveaux import palier_pour, seuil_suivant, parametres_vague
from space_invaders.entites import Vaisseau, Soucoupe
from space_invaders.flotte import Flotte

PROBA_SOUCOUPE = 0.002


class Partie:
    def __init__(self):
        self.statut = "accueil"
        self.meilleur_score = 0
        self.tir_precedent = False
        self.reinitialiser()

    def reinitialiser(self):
        self.score = 0
        self.ennemis_tues = 0
        self.vague = 1
        self.palier = 0
        self.attente = 0
        self.vaisseau = Vaisseau()
        self.flotte = Flotte(parametres_vague(0, 1))
        self.missiles = []
        self.soucoupes = []
        self.evenements = []

    def basculer_pause(self):
        if self.statut == "en_cours":
            self.statut = "pause"
        elif self.statut == "pause":
            self.statut = "en_cours"

    def mettre_a_jour(self, gauche, droite, tir):
        self.evenements = []
        nouvel_appui = tir and not self.tir_precedent
        self.tir_precedent = tir
        if self.statut == "accueil" or self.statut == "perdu":
            if nouvel_appui:
                self.reinitialiser()
                self.statut = "en_cours"
        elif self.statut == "en_cours":
            if self.attente > 0:
                self.attente -= 1
            else:
                self.jouer(gauche, droite, tir)

    def jouer(self, gauche, droite, tir):
        self.deplacer_vaisseau(gauche, droite)
        if tir:
            self.missiles += self.vaisseau.tirer()
        self.missiles += self.flotte.riposter()
        self.flotte.avancer()
        self.gerer_soucoupe()
        for missile in self.missiles:
            missile.avancer()
        self.verifier_collisions()
        self.nettoyer()
        self.verifier_palier()
        self.verifier_vague()
        self.verifier_defaite()

    def deplacer_vaisseau(self, gauche, droite):
        direction = 0
        if gauche:
            direction = -1
        if droite:
            direction = 1
        self.vaisseau.bouger(direction)
        self.vaisseau.mettre_a_jour()

    def gerer_soucoupe(self):
        if len(self.soucoupes) == 0 and random.random() < PROBA_SOUCOUPE:
            self.soucoupes.append(Soucoupe())
        for soucoupe in self.soucoupes:
            soucoupe.avancer()

    def verifier_collisions(self):
        cibles = self.flotte.ennemis + self.soucoupes
        for missile in self.missiles:
            if missile.est_du_joueur():
                for cible in cibles:
                    if missile.vivant and cible.vivant and missile.touche(cible):
                        self.toucher(missile, cible)
            elif missile.touche(self.vaisseau):
                missile.vivant = False
                if self.vaisseau.perdre_vie():
                    self.evenements.append({"type": "touche"})

    def toucher(self, missile, cible):
        cible.recevoir_tir()
        if not missile.perforant:
            missile.vivant = False
        if not cible.vivant:
            self.score += cible.points
            self.ennemis_tues += 1
            self.evenements.append({"type": "explosion", "x": cible.x, "y": cible.y,
                                    "sorte": cible.sorte})

    def nettoyer(self):
        self.missiles = [missile for missile in self.missiles if missile.vivant]
        self.soucoupes = [soucoupe for soucoupe in self.soucoupes if soucoupe.vivant]
        self.flotte.nettoyer()

    def verifier_palier(self):
        nouveau_palier = palier_pour(self.ennemis_tues)
        if nouveau_palier > self.palier:
            self.palier = nouveau_palier
            self.vaisseau.equiper(PALIERS[nouveau_palier])
            self.vaisseau.ajouter_vie()

    def verifier_vague(self):
        if len(self.flotte.ennemis) == 0:
            self.vague += 1
            self.score += 100 * self.vague
            self.flotte = Flotte(parametres_vague(self.palier, self.vague))
            self.missiles = []
            self.attente = PAUSE_ENTRE_VAGUES

    def verifier_defaite(self):
        envahi = self.flotte.plus_bas() > LIGNE_DEFAITE
        if self.vaisseau.vies == 0 or envahi:
            self.statut = "perdu"
            if self.score > self.meilleur_score:
                self.meilleur_score = self.score

    def etat(self):
        return {
            "statut": self.statut, "score": self.score, "meilleur_score": self.meilleur_score,
            "vies": self.vaisseau.vies, "vague": self.vague, "attente": self.attente > 0,
            "palier": self.palier + 1, "nom_palier": PALIERS[self.palier]["nom"],
            "ennemis_tues": self.ennemis_tues, "prochain_seuil": seuil_suivant(self.palier),
            "vaisseau": self.vaisseau.decrire(),
            "ennemis": [ennemi.decrire() for ennemi in self.flotte.ennemis + self.soucoupes],
            "missiles": [missile.decrire() for missile in self.missiles],
            "evenements": self.evenements,
        }


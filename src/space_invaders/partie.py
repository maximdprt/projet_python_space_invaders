import random

from space_invaders.niveaux import (
    LARGEUR_ECRAN, HAUTEUR_ECRAN, VIES_MAX, LIGNE_DEFAITE, PAUSE_ENTRE_VAGUES,
    PROBA_SOUCOUPE, PALIERS, palier_pour, seuil_suivant, parametres_vague,
)
from space_invaders.entites import Vaisseau, Soucoupe
from space_invaders.flotte import Flotte


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
        self.index_palier = 0
        self.vaisseau = Vaisseau()
        self.vaisseau.evoluer(PALIERS[0])
        self.flotte = Flotte(parametres_vague(0, 1))
        self.missiles = []
        self.soucoupes = []
        self.evenements = []
        self.tick = 0
        self.pause_vague = 0

    def demarrer(self):
        self.reinitialiser()
        self.statut = "en_cours"

    def basculer_pause(self):
        if self.statut == "en_cours":
            self.statut = "pause"
        elif self.statut == "pause":
            self.statut = "en_cours"

    def mettre_a_jour(self, gauche, droite, tir):
        self.evenements = []
        self.tick += 1
        nouvel_appui = tir and not self.tir_precedent
        self.tir_precedent = tir
        if self.statut == "accueil" or self.statut == "perdu":
            if nouvel_appui:
                self.demarrer()
            return
        if self.statut == "pause":
            return
        if self.pause_vague > 0:
            self.pause_vague -= 1
            self.avancer_missiles()
            self.nettoyer()
            return
        self.jouer_un_tick(gauche, droite, tir)

    def jouer_un_tick(self, gauche, droite, tir):
        self.deplacer_vaisseau(gauche, droite)
        self.vaisseau.mettre_a_jour()
        self.tir_joueur(tir)
        self.avancer_missiles()
        self.flotte.avancer(LARGEUR_ECRAN)
        ripostes = self.flotte.riposter(self.index_palier)
        if len(ripostes) > 0:
            self.missiles += ripostes
            self.evenements.append({"type": "tir_ennemi"})
        self.gerer_soucoupe()
        self.verifier_collisions()
        self.nettoyer()
        self.verifier_palier()
        self.verifier_fin_vague()
        self.verifier_defaite()

    def deplacer_vaisseau(self, gauche, droite):
        direction = 0
        if gauche:
            direction -= 1
        if droite:
            direction += 1
        self.vaisseau.bouger(direction, LARGEUR_ECRAN)

    def missiles_du_camp(self, camp):
        return [missile for missile in self.missiles if missile.camp == camp]

    def tir_joueur(self, tir):
        palier = PALIERS[self.index_palier]
        nb_missiles = len(self.missiles_du_camp("joueur"))
        if tir and self.vaisseau.peut_tirer(nb_missiles, palier["missiles_max"]):
            self.missiles += self.vaisseau.tirer(palier["vitesse_missile"])
            self.evenements.append({"type": "tir", "arme": self.vaisseau.arme})

    def avancer_missiles(self):
        for missile in self.missiles:
            missile.avancer()
            if missile.est_sorti(LARGEUR_ECRAN, HAUTEUR_ECRAN):
                missile.vivant = False

    def gerer_soucoupe(self):
        if len(self.soucoupes) == 0:
            if random.random() < PROBA_SOUCOUPE:
                self.soucoupes.append(Soucoupe(random.choice([-1, 1])))
                self.evenements.append({"type": "soucoupe"})
        else:
            for soucoupe in self.soucoupes:
                soucoupe.avancer(LARGEUR_ECRAN)

    def ajouter_evenement(self, type_evenement, entite):
        self.evenements.append({"type": type_evenement, "x": entite.x, "y": entite.y})

    def marquer_points(self, points):
        self.score += points
        if self.score > self.meilleur_score:
            self.meilleur_score = self.score

    def toucher_cible(self, missile, cible):
        if cible.recevoir_tir():
            self.marquer_points(cible.points)
            self.ennemis_tues += 1
            self.evenements.append({"type": "explosion", "x": cible.x, "y": cible.y, "sorte": cible.sorte})
        else:
            self.ajouter_evenement("impact", missile)
        if not missile.perforant:
            missile.vivant = False

    def verifier_collisions(self):
        self.toucher_ennemis()
        self.annuler_tirs()
        self.toucher_vaisseau()

    def toucher_ennemis(self):
        cibles = self.flotte.vivants() + self.soucoupes
        for missile in self.missiles_du_camp("joueur"):
            for cible in cibles:
                if missile.vivant and cible.vivant and missile.touche(cible):
                    self.toucher_cible(missile, cible)

    def annuler_tirs(self):
        ennemis = self.missiles_du_camp("ennemi")
        for missile in self.missiles_du_camp("joueur"):
            for tir_ennemi in ennemis:
                if missile.vivant and tir_ennemi.vivant and missile.touche(tir_ennemi):
                    missile.vivant = False
                    tir_ennemi.vivant = False
                    self.ajouter_evenement("annulation", tir_ennemi)

    def toucher_vaisseau(self):
        for tir_ennemi in self.missiles_du_camp("ennemi"):
            if tir_ennemi.vivant and tir_ennemi.touche(self.vaisseau):
                tir_ennemi.vivant = False
                if self.vaisseau.perdre_vie():
                    self.ajouter_evenement("vaisseau_touche", self.vaisseau)

    def nettoyer(self):
        self.missiles = [missile for missile in self.missiles if missile.vivant]
        self.soucoupes = [soucoupe for soucoupe in self.soucoupes if soucoupe.vivant]
        self.flotte.nettoyer()

    def verifier_palier(self):
        nouveau_palier = palier_pour(self.ennemis_tues)
        if nouveau_palier > self.index_palier:
            self.index_palier = nouveau_palier
            palier = PALIERS[self.index_palier]
            self.vaisseau.evoluer(palier)
            self.evenements.append({"type": "palier", "numero": self.index_palier + 1,
                                    "nom": palier["nom"], "apparence": palier["apparence"]})

    def verifier_fin_vague(self):
        if self.flotte.est_vide():
            self.vague += 1
            self.marquer_points(100 * self.vague)
            self.flotte = Flotte(parametres_vague(self.index_palier, self.vague))
            self.pause_vague = PAUSE_ENTRE_VAGUES
            self.missiles = self.missiles_du_camp("joueur")
            self.evenements.append({"type": "vague", "numero": self.vague})

    def flotte_touche_vaisseau(self):
        contact = False
        for ennemi in self.flotte.vivants():
            if ennemi.touche(self.vaisseau):
                contact = True
        return contact

    def verifier_defaite(self):
        plus_de_vies = self.vaisseau.vies == 0
        envahi = self.flotte.plus_bas() >= LIGNE_DEFAITE
        if plus_de_vies or envahi or self.flotte_touche_vaisseau():
            self.statut = "perdu"
            self.evenements.append({"type": "defaite", "score": self.score})

    def etat(self):
        return {
            "statut": self.statut, "tick": self.tick,
            "score": self.score, "meilleur_score": self.meilleur_score,
            "vies": self.vaisseau.vies, "vies_max": VIES_MAX,
            "vague": self.vague, "en_transition": self.pause_vague > 0,
            "palier": self.index_palier + 1, "nom_palier": PALIERS[self.index_palier]["nom"],
            "ennemis_tues": self.ennemis_tues, "prochain_seuil": seuil_suivant(self.index_palier),
            "vaisseau": self.vaisseau.decrire(),
            "ennemis": self.flotte.decrire(),
            "soucoupes": [soucoupe.decrire() for soucoupe in self.soucoupes],
            "missiles": [missile.decrire() for missile in self.missiles],
            "evenements": self.evenements,
        }


if __name__ == "__main__":
    partie = Partie()
    partie.demarrer()
    for numero in range(600):
        partie.mettre_a_jour(False, numero % 40 < 20, numero % 7 == 0)
    print(partie.etat()["score"], partie.etat()["vies"], partie.etat()["statut"])

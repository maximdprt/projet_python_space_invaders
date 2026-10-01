import random

from space_invaders.niveaux import LARGEUR_ECRAN, VIES_DEPART, VIES_MAX, INVINCIBILITE, POINTS

TAILLES_MISSILES = {
    "simple": (4, 16),
    "laser": (6, 44),
    "plasma": (8, 12),
    "bombe": (14, 14),
    "zigzag": (6, 16),
}

CANONS = {
    "simple": [(0, 0)],
    "double": [(-20, 0), (20, 0)],
    "triple": [(-12, -1.5), (0, 0), (12, 1.5)],
    "eventail": [(-16, -3), (-8, -1.5), (0, 0), (8, 1.5), (16, 3)],
    "laser": [(-14, 0), (14, 0)],
}


class Entite:
    def __init__(self, x, y, largeur, hauteur):
        self.x = x
        self.y = y
        self.largeur = largeur
        self.hauteur = hauteur
        self.vivant = True

    def deplacer(self, dx, dy):
        self.x += dx
        self.y += dy

    def touche(self, autre):
        return (self.x < autre.x + autre.largeur
                and autre.x < self.x + self.largeur
                and self.y < autre.y + autre.hauteur
                and autre.y < self.y + self.hauteur)

    def decrire(self):
        return {"x": self.x, "y": self.y, "largeur": self.largeur, "hauteur": self.hauteur}


class Vaisseau(Entite):
    def __init__(self):
        super().__init__((LARGEUR_ECRAN - 52) / 2, 540, 52, 30)
        self.vitesse = 5
        self.vies = VIES_DEPART
        self.apparence = "chasseur"
        self.arme = "simple"
        self.recharge_max = 28
        self.recharge = 0
        self.invincible = 0

    @property
    def vies(self):
        return self._vies

    @vies.setter
    def vies(self, valeur):
        if valeur < 0 or valeur > VIES_MAX:
            raise ValueError("Nombre de vies invalide")
        self._vies = valeur

    def bouger(self, direction, largeur_ecran):
        self.deplacer(direction * self.vitesse, 0)
        if self.x < 0:
            self.x = 0
        if self.x + self.largeur > largeur_ecran:
            self.x = largeur_ecran - self.largeur

    def peut_tirer(self, nb_missiles_joueur, missiles_max):
        return self.recharge == 0 and nb_missiles_joueur < missiles_max

    def tirer(self, vitesse_missile):
        sorte = "laser" if self.arme == "laser" else "simple"
        largeur_missile = TAILLES_MISSILES[sorte][0]
        hauteur_missile = TAILLES_MISSILES[sorte][1]
        centre = self.x + self.largeur / 2
        missiles = []
        for decalage_x, vx in CANONS[self.arme]:
            x = centre + decalage_x - largeur_missile / 2
            y = self.y - hauteur_missile
            missiles.append(Missile(x, y, vx, -vitesse_missile, "joueur", sorte))
        self.recharge = self.recharge_max
        return missiles

    def evoluer(self, palier):
        self.apparence = palier["apparence"]
        self.arme = palier["arme"]
        self.recharge_max = palier["recharge"]
        self.vitesse = palier["vitesse_vaisseau"]
        if palier["seuil"] > 0:
            self.invincible = INVINCIBILITE
            if self.vies < VIES_MAX:
                self.vies += 1

    def perdre_vie(self):
        if self.invincible == 0:
            self.vies -= 1
            self.invincible = INVINCIBILITE
            return True
        return False

    def mettre_a_jour(self):
        if self.recharge > 0:
            self.recharge -= 1
        if self.invincible > 0:
            self.invincible -= 1

    def decrire(self):
        description = super().decrire()
        description["apparence"] = self.apparence
        description["arme"] = self.arme
        description["invincible"] = self.invincible > 0
        return description


class Missile(Entite):
    def __init__(self, x, y, vx, vy, camp, sorte):
        taille = TAILLES_MISSILES[sorte]
        super().__init__(x, y, taille[0], taille[1])
        self.vx = vx
        self.vy = vy
        self.camp = camp
        self.sorte = sorte
        self.perforant = sorte == "laser"
        self.compteur = 0

    def avancer(self):
        self.deplacer(self.vx, self.vy)
        self.compteur += 1
        if self.sorte == "zigzag" and self.compteur % 12 == 0:
            self.vx = -self.vx

    def est_sorti(self, largeur_ecran, hauteur_ecran):
        trop_haut = self.y + self.hauteur < 0
        trop_bas = self.y > hauteur_ecran
        trop_a_cote = self.x + self.largeur < 0 or self.x > largeur_ecran
        return trop_haut or trop_bas or trop_a_cote

    def decrire(self):
        description = super().decrire()
        description["camp"] = self.camp
        description["sorte"] = self.sorte
        return description


class Ennemi(Entite):
    def __init__(self, x, y, sorte):
        super().__init__(x, y, 36, 26)
        self.sorte = sorte
        self.points = POINTS.get(sorte, 0)
        self.pv = 1

    def recevoir_tir(self):
        self.pv -= 1
        if self.pv <= 0:
            self.vivant = False
        return not self.vivant

    def tirer(self, vitesse):
        x = self.x + self.largeur / 2 - 4
        return Missile(x, self.y + self.hauteur, 0, vitesse, "ennemi", "plasma")

    def decrire(self):
        description = super().decrire()
        description["sorte"] = self.sorte
        description["pv"] = self.pv
        return description


class EnnemiBlinde(Ennemi):
    def __init__(self, x, y):
        super().__init__(x, y, "blinde")
        self.pv = 3

    def tirer(self, vitesse):
        x = self.x + self.largeur / 2 - 7
        return Missile(x, self.y + self.hauteur, 0, vitesse * 0.7, "ennemi", "bombe")


class Soucoupe(Ennemi):
    def __init__(self, direction):
        depart = -56 if direction == 1 else LARGEUR_ECRAN
        super().__init__(depart, 34, "soucoupe")
        self.largeur = 56
        self.hauteur = 22
        self.direction = direction
        self.vitesse = 2.2
        self.points = random.choice([50, 100, 150, 300])

    def avancer(self, largeur_ecran):
        self.deplacer(self.vitesse * self.direction, 0)
        sortie_droite = self.direction == 1 and self.x > largeur_ecran
        sortie_gauche = self.direction == -1 and self.x + self.largeur < 0
        if sortie_droite or sortie_gauche:
            self.vivant = False

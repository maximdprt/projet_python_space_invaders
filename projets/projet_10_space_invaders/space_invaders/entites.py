from space_invaders.niveaux import LARGEUR_ECRAN, HAUTEUR_ECRAN, VIES_DEPART, VIES_MAX
from space_invaders.niveaux import INVINCIBILITE, POINTS, PALIERS

VITESSE_MISSILE = 10

CANONS = {
    "simple": [(0, 0)],
    "double": [(-18, 0), (18, 0)],
    "triple": [(-14, -1.5), (0, 0), (14, 1.5)],
    "eventail": [(-16, -3), (-8, -1.5), (0, 0), (8, 1.5), (16, 3)],
    "laser": [(-14, 0), (14, 0)],
}


class Entite:
    def __init__(self, x, y, largeur, hauteur, sorte):
        self.x = x
        self.y = y
        self.largeur = largeur
        self.hauteur = hauteur
        self.sorte = sorte
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
        return {"x": self.x, "y": self.y, "largeur": self.largeur,
                "hauteur": self.hauteur, "sorte": self.sorte}


class Vaisseau(Entite):
    def __init__(self):
        super().__init__(374, 540, 52, 30, "chasseur")
        self.vies = VIES_DEPART
        self.recharge = 0
        self.invincible = 0
        self.equiper(PALIERS[0])

    @property
    def vies(self):
        return self._vies

    @vies.setter
    def vies(self, valeur):
        if valeur < 0 or valeur > VIES_MAX:
            raise ValueError("Nombre de vies invalide")
        self._vies = valeur

    def equiper(self, palier):
        self.sorte = palier["apparence"]
        self.arme = palier["arme"]
        self.recharge_max = palier["recharge"]
        self.vitesse = palier["vitesse_vaisseau"]

    def ajouter_vie(self):
        if self.vies < VIES_MAX:
            self.vies += 1
        self.invincible = INVINCIBILITE

    def bouger(self, direction):
        self.deplacer(direction * self.vitesse, 0)
        if self.x < 0:
            self.x = 0
        if self.x > LARGEUR_ECRAN - self.largeur:
            self.x = LARGEUR_ECRAN - self.largeur

    def tirer(self):
        if self.recharge > 0:
            return []
        self.recharge = self.recharge_max
        sorte = "laser" if self.arme == "laser" else "tir"
        missiles = []
        for decalage, vx in CANONS[self.arme]:
            missiles.append(Missile(self.x + 26 + decalage, self.y - 16, vx, -VITESSE_MISSILE, sorte))
        return missiles

    def perdre_vie(self):
        if self.invincible > 0:
            return False
        self.vies -= 1
        self.invincible = INVINCIBILITE
        return True

    def mettre_a_jour(self):
        if self.recharge > 0:
            self.recharge -= 1
        if self.invincible > 0:
            self.invincible -= 1

    def decrire(self):
        description = super().decrire()
        description["invincible"] = self.invincible > 0
        return description


class Missile(Entite):
    def __init__(self, x, y, vx, vy, sorte):
        super().__init__(x - 3, y, 6, 16, sorte)
        self.vx = vx
        self.vy = vy
        self.perforant = sorte == "laser"

    def est_du_joueur(self):
        return self.vy < 0

    def avancer(self):
        self.deplacer(self.vx, self.vy)
        if self.y < -20 or self.y > HAUTEUR_ECRAN:
            self.vivant = False


class Ennemi(Entite):
    def __init__(self, x, y, sorte):
        super().__init__(x, y, 36, 26, sorte)
        self.points = POINTS[sorte]
        self.pv = 1

    def recevoir_tir(self):
        self.pv -= 1
        if self.pv <= 0:
            self.vivant = False

    def tirer(self, vitesse):
        return Missile(self.x + 18, self.y + 26, 0, vitesse, "plasma")


class EnnemiBlinde(Ennemi):
    def __init__(self, x, y):
        super().__init__(x, y, "blinde")
        self.pv = 2

    def tirer(self, vitesse):
        return Missile(self.x + 18, self.y + 26, 0, vitesse * 0.8, "bombe")


class Soucoupe(Ennemi):
    def __init__(self):
        super().__init__(-56, 34, "soucoupe")
        self.largeur = 56

    def avancer(self):
        self.deplacer(2, 0)
        if self.x > LARGEUR_ECRAN:
            self.vivant = False

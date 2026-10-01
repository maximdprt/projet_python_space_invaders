from space_invaders.niveaux import LARGEUR, HAUTEUR, VIES_MAX, CANONS, POINTS


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
        return (self.x < autre.x + autre.largeur and autre.x < self.x + self.largeur
                and self.y < autre.y + autre.hauteur and autre.y < self.y + self.hauteur)

    def decrire(self):
        return {"x": self.x, "y": self.y, "largeur": self.largeur,
                "hauteur": self.hauteur, "sorte": self.sorte}


class Vaisseau(Entite):
    def __init__(self):
        super().__init__(374, 540, 52, 30, "chasseur")
        self.vies = 3
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

    def bouger(self, direction):
        self.deplacer(direction * 6, 0)
        if self.x < 0:
            self.x = 0
        if self.x > LARGEUR - self.largeur:
            self.x = LARGEUR - self.largeur

    def tirer(self):
        missiles = []
        if self.recharge == 0:
            self.recharge = 15
            for decalage in CANONS[self.sorte]:
                missiles.append(Missile(self.x + 23 + decalage, self.y, -10))
        return missiles

    def perdre_vie(self):
        if self.invincible == 0:
            self.vies -= 1
            self.invincible = 120

    def evoluer(self, palier):
        self.sorte = palier["vaisseau"]
        self.invincible = 120
        if self.vies < VIES_MAX:
            self.vies += 1

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
    def __init__(self, x, y, vitesse):
        super().__init__(x, y, 6, 16, "tir" if vitesse < 0 else "plasma")
        self.vitesse = vitesse

    def avancer(self):
        self.deplacer(0, self.vitesse)
        if self.y < -20 or self.y > HAUTEUR:
            self.vivant = False


class Ennemi(Entite):
    def __init__(self, x, y, sorte):
        super().__init__(x, y, 36, 26, sorte)
        self.points = POINTS[sorte]

    def tirer(self):
        return Missile(self.x + 15, self.y + 26, 4)

from space_invaders.flotte import Flotte
from space_invaders.niveaux import PALIERS


def test_taille_de_la_grille():
    assert len(Flotte(PALIERS[0], 1).ennemis) == PALIERS[0]["lignes"] * 9


def test_rebond_et_descente_au_bord():
    flotte = Flotte(PALIERS[0], 1)
    y_depart = flotte.ennemis[0].y
    while flotte.direction == 1:
        flotte.avancer()
    assert flotte.ennemis[0].y == y_depart + 12


def test_plus_bas():
    flotte = Flotte(PALIERS[0], 1)
    assert flotte.plus_bas() == flotte.ennemis[-1].y + flotte.ennemis[-1].hauteur


def test_flotte_vide_ne_tire_pas():
    flotte = Flotte(PALIERS[0], 1)
    flotte.ennemis = []
    assert flotte.riposter() == []

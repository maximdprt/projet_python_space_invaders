from space_invaders.flotte import Flotte
from space_invaders.niveaux import parametres_vague, DESCENTE


def test_taille_de_la_grille():
    parametres = parametres_vague(0, 1)
    assert len(Flotte(parametres).ennemis) == parametres["lignes"] * parametres["colonnes"]


def test_rebond_et_descente_au_bord():
    flotte = Flotte(parametres_vague(0, 1))
    y_depart = flotte.ennemis[0].y
    while flotte.direction == 1:
        flotte.avancer()
    assert flotte.ennemis[0].y == y_depart + DESCENTE


def test_plus_bas():
    flotte = Flotte(parametres_vague(0, 1))
    assert flotte.plus_bas() == flotte.ennemis[-1].y + flotte.ennemis[-1].hauteur


def test_flotte_vide_ne_tire_pas():
    flotte = Flotte(parametres_vague(0, 1))
    flotte.ennemis = []
    assert flotte.riposter() == []

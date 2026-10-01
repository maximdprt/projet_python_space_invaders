import random

from space_invaders.flotte import Flotte
from space_invaders.niveaux import parametres_vague


def nouvelle_flotte(index_palier=0):
    random.seed(0)
    return Flotte(parametres_vague(index_palier, 1))


def test_nombre_ennemis_egal_lignes_fois_colonnes():
    assert len(nouvelle_flotte().ennemis) == 3 * 8


def test_premiere_ligne_de_poulpes():
    assert nouvelle_flotte().ennemis[0].sorte == "poulpe"


def test_grille_centree():
    flotte = nouvelle_flotte()
    gauche = flotte.ennemis[0].x
    droite = 800 - (flotte.ennemis[7].x + flotte.ennemis[7].largeur)
    assert gauche == droite


def test_rebond_et_descente_au_bord():
    flotte = nouvelle_flotte()
    y_depart = flotte.ennemis[0].y
    for _ in range(1000):
        flotte.avancer(800)
        if flotte.direction == -1:
            break
    assert flotte.direction == -1
    assert flotte.ennemis[0].y == y_depart + flotte.descente


def test_acceleration_quand_la_flotte_se_vide():
    flotte = nouvelle_flotte()
    vitesse_pleine = flotte.vitesse_effective()
    for ennemi in flotte.ennemis[:12]:
        ennemi.vivant = False
    assert flotte.vitesse_effective() > vitesse_pleine


def test_plus_bas():
    flotte = nouvelle_flotte()
    dernier = flotte.ennemis[-1]
    assert flotte.plus_bas() == dernier.y + dernier.hauteur


def test_plus_bas_flotte_vide():
    flotte = nouvelle_flotte()
    for ennemi in flotte.ennemis:
        ennemi.vivant = False
    assert flotte.plus_bas() == 0
    assert flotte.est_vide()


def test_seul_le_plus_bas_de_chaque_colonne_tire():
    flotte = nouvelle_flotte()
    tireurs = flotte.trouver_tireurs()
    assert len(tireurs) == 8
    for tireur in tireurs:
        assert tireur.y == flotte.ennemis[-1].y


def test_riposte_renvoie_des_missiles_ennemis():
    flotte = nouvelle_flotte()
    flotte.proba_tir = 1
    missiles = flotte.riposter(0)
    assert len(missiles) == 8
    assert missiles[0].camp == "ennemi"


def test_blindes_presents_aux_hauts_paliers():
    flotte = nouvelle_flotte(4)
    assert any(ennemi.sorte == "blinde" for ennemi in flotte.ennemis)

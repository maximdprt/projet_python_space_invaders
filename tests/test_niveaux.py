from space_invaders.niveaux import PALIERS, palier_pour, seuil_suivant, parametres_vague


def test_palier_au_depart():
    assert palier_pour(0) == 0


def test_palier_pilote_a_25_tues():
    assert palier_pour(25) == 1


def test_palier_juste_avant_le_seuil():
    assert palier_pour(24) == 0


def test_palier_maximum():
    assert palier_pour(10_000) == 4


def test_seuil_suivant():
    assert seuil_suivant(0) == 25


def test_seuil_suivant_dernier_palier():
    assert seuil_suivant(4) == -1


def test_parametres_vague_ne_modifie_pas_paliers():
    vitesse_avant = PALIERS[0]["vitesse_flotte"]
    parametres_vague(0, 5)
    assert PALIERS[0]["vitesse_flotte"] == vitesse_avant


def test_parametres_vague_accelere_avec_la_vague():
    assert parametres_vague(0, 3)["vitesse_flotte"] > parametres_vague(0, 1)["vitesse_flotte"]


def test_parametres_vague_plafonnes():
    assert parametres_vague(4, 100)["vitesse_flotte"] == 3.2

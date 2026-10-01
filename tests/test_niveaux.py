from space_invaders.niveaux import PALIERS, palier_pour, seuil_suivant, parametres_vague


def test_palier_selon_ennemis_tues():
    assert palier_pour(0) == 0
    assert palier_pour(20) == 1
    assert palier_pour(10000) == len(PALIERS) - 1


def test_seuil_suivant():
    assert seuil_suivant(0) == PALIERS[1]["seuil"]
    assert seuil_suivant(len(PALIERS) - 1) == -1


def test_chaque_vague_est_plus_rapide_sans_toucher_aux_paliers():
    vitesse_depart = PALIERS[0]["vitesse_flotte"]
    assert parametres_vague(0, 3)["vitesse_flotte"] > parametres_vague(0, 1)["vitesse_flotte"]
    assert PALIERS[0]["vitesse_flotte"] == vitesse_depart


def test_vitesse_plafonnee():
    assert parametres_vague(4, 500)["vitesse_flotte"] == 2

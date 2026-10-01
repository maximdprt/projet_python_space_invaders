from space_invaders.niveaux import VAGUES, FORMES, CANONS, parametres_vague


def test_chaque_forme_a_ses_canons():
    for forme in FORMES:
        assert forme in CANONS


def test_les_vagues_sont_de_plus_en_plus_dures():
    assert parametres_vague(2)["vitesse"] > parametres_vague(1)["vitesse"]
    assert parametres_vague(2)["proba_tir"] > parametres_vague(1)["proba_tir"]


def test_apres_la_derniere_vague_on_garde_la_plus_dure():
    assert parametres_vague(100) == VAGUES[-1]

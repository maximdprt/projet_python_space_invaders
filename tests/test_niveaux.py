from space_invaders.niveaux import PALIERS, CANONS, palier_pour


def test_palier_selon_ennemis_tues():
    assert palier_pour(0) == 0
    assert palier_pour(20) == 1
    assert palier_pour(10000) == len(PALIERS) - 1


def test_chaque_vaisseau_a_ses_canons():
    for palier in PALIERS:
        assert palier["vaisseau"] in CANONS

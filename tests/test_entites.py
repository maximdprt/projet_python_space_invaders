import pytest

from space_invaders.entites import Entite, Vaisseau, Missile, Ennemi, EnnemiBlinde, Soucoupe
from space_invaders.niveaux import PALIERS


def test_deux_rectangles_qui_se_chevauchent_se_touchent():
    assert Entite(0, 0, 10, 10).touche(Entite(5, 5, 10, 10))


def test_deux_rectangles_eloignes_ne_se_touchent_pas():
    assert not Entite(0, 0, 10, 10).touche(Entite(20, 0, 10, 10))


def test_vies_negatives_refusees():
    vaisseau = Vaisseau()
    with pytest.raises(ValueError):
        vaisseau.vies = -1


def test_vies_au_dessus_du_max_refusees():
    vaisseau = Vaisseau()
    with pytest.raises(ValueError):
        vaisseau.vies = 6


def test_vaisseau_ne_sort_pas_a_gauche():
    vaisseau = Vaisseau()
    for _ in range(200):
        vaisseau.bouger(-1, 800)
    assert vaisseau.x == 0


def test_vaisseau_ne_sort_pas_a_droite():
    vaisseau = Vaisseau()
    for _ in range(200):
        vaisseau.bouger(1, 800)
    assert vaisseau.x + vaisseau.largeur == 800


@pytest.mark.parametrize("index_palier, attendu", [(0, 1), (1, 2), (2, 3), (3, 5), (4, 2)])
def test_chaque_arme_tire_le_bon_nombre_de_missiles(index_palier, attendu):
    vaisseau = Vaisseau()
    vaisseau.evoluer(PALIERS[index_palier])
    assert len(vaisseau.tirer(10)) == attendu


def test_laser_est_perforant():
    vaisseau = Vaisseau()
    vaisseau.evoluer(PALIERS[4])
    assert vaisseau.tirer(10)[0].perforant


def test_missile_simple_non_perforant():
    assert not Missile(0, 0, 0, -5, "joueur", "simple").perforant


def test_tir_lance_la_recharge():
    vaisseau = Vaisseau()
    vaisseau.tirer(10)
    assert not vaisseau.peut_tirer(0, 1)


def test_perdre_vie_puis_invincible():
    vaisseau = Vaisseau()
    assert vaisseau.perdre_vie()
    assert not vaisseau.perdre_vie()
    assert vaisseau.vies == 2


def test_evoluer_donne_une_vie():
    vaisseau = Vaisseau()
    vaisseau.evoluer(PALIERS[1])
    assert vaisseau.vies == 4
    assert vaisseau.apparence == "intercepteur"


def test_zigzag_change_de_sens():
    missile = Missile(100, 100, 2, 4, "ennemi", "zigzag")
    for _ in range(12):
        missile.avancer()
    assert missile.vx == -2


def test_ennemi_blinde_survit_a_deux_tirs():
    blinde = EnnemiBlinde(0, 0)
    assert not blinde.recevoir_tir()
    assert not blinde.recevoir_tir()
    assert blinde.vivant


def test_ennemi_blinde_meurt_au_troisieme_tir():
    blinde = EnnemiBlinde(0, 0)
    blinde.recevoir_tir()
    blinde.recevoir_tir()
    assert blinde.recevoir_tir()
    assert not blinde.vivant


def test_ennemi_blinde_est_un_ennemi():
    assert isinstance(EnnemiBlinde(0, 0), Ennemi)


def test_ennemi_blinde_tire_une_bombe():
    assert EnnemiBlinde(0, 0).tirer(5).sorte == "bombe"


def test_soucoupe_disparait_en_sortant():
    soucoupe = Soucoupe(1)
    for _ in range(500):
        soucoupe.avancer(800)
    assert not soucoupe.vivant

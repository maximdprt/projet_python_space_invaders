import pytest

from space_invaders.entites import Vaisseau, Ennemi, EnnemiBlinde, Soucoupe, Missile
from space_invaders.niveaux import PALIERS, VIES_MAX


def test_collision():
    assert Ennemi(100, 100, "crabe").touche(Missile(110, 110, 0, -10, "tir"))
    assert not Ennemi(100, 100, "crabe").touche(Missile(300, 110, 0, -10, "tir"))


def test_vies_protegees_par_le_setter():
    vaisseau = Vaisseau()
    with pytest.raises(ValueError):
        vaisseau.vies = -1
    with pytest.raises(ValueError):
        vaisseau.vies = VIES_MAX + 1


def test_vaisseau_reste_dans_l_ecran():
    vaisseau = Vaisseau()
    for numero in range(300):
        vaisseau.bouger(-1)
    assert vaisseau.x == 0


def test_chaque_arme_tire_le_bon_nombre_de_missiles():
    attendus = [1, 2, 3, 5, 2]
    for index in range(len(PALIERS)):
        vaisseau = Vaisseau()
        vaisseau.equiper(PALIERS[index])
        assert len(vaisseau.tirer()) == attendus[index]


def test_recharge_entre_deux_tirs():
    vaisseau = Vaisseau()
    assert len(vaisseau.tirer()) == 1
    assert vaisseau.tirer() == []


def test_laser_perforant():
    vaisseau = Vaisseau()
    vaisseau.equiper(PALIERS[-1])
    assert vaisseau.tirer()[0].perforant


def test_invincible_apres_un_coup():
    vaisseau = Vaisseau()
    assert vaisseau.perdre_vie()
    assert not vaisseau.perdre_vie()
    assert vaisseau.vies == 2


def test_blinde_resiste_a_un_tir():
    blinde = EnnemiBlinde(0, 0)
    blinde.recevoir_tir()
    assert blinde.vivant
    blinde.recevoir_tir()
    assert not blinde.vivant
    assert isinstance(blinde, Ennemi)


def test_soucoupe_disparait_apres_l_ecran():
    soucoupe = Soucoupe()
    for numero in range(500):
        soucoupe.avancer()
    assert not soucoupe.vivant

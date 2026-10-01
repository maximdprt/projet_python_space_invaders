import pytest

from space_invaders.entites import Entite, Vaisseau, Ennemi, Missile
from space_invaders.niveaux import PALIERS, VIES_MAX


def test_collision():
    assert Ennemi(100, 100, "crabe").touche(Missile(110, 110, -10))
    assert not Ennemi(100, 100, "crabe").touche(Missile(300, 110, -10))


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


def test_recharge_entre_deux_tirs():
    vaisseau = Vaisseau()
    assert len(vaisseau.tirer()) == 1
    assert vaisseau.tirer() == []


def test_evolution_du_vaisseau():
    vaisseau = Vaisseau()
    vaisseau.evoluer(PALIERS[4])
    assert len(vaisseau.tirer()) == 5
    assert vaisseau.vies == 4


def test_invincible_apres_un_coup():
    vaisseau = Vaisseau()
    vaisseau.perdre_vie()
    vaisseau.perdre_vie()
    assert vaisseau.vies == 2


def test_heritage():
    assert isinstance(Vaisseau(), Entite)
    assert isinstance(Ennemi(0, 0, "crabe"), Entite)
    assert Missile(0, 0, 4).sorte == "plasma"

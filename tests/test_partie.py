import random

from space_invaders.partie import Partie
from space_invaders.entites import Missile, Bonus
from space_invaders.niveaux import FORMES


def partie_lancee():
    random.seed(0)
    partie = Partie()
    partie.mettre_a_jour(False, False, True)
    return partie


def test_espace_demarre_la_partie():
    assert partie_lancee().statut == "en_cours"


def test_un_tir_detruit_un_ennemi():
    partie = partie_lancee()
    cible = partie.flotte.ennemis[0]
    partie.missiles = [Missile(cible.x + 15, cible.y + 10, -1)]
    partie.toucher_ennemis()
    assert not cible.vivant
    assert partie.score == cible.points
    assert len(partie.explosions) == 1


def test_ramasser_un_bonus_change_la_forme():
    partie = partie_lancee()
    vaisseau = partie.vaisseau
    partie.bonus = [Bonus(vaisseau.x + 10, vaisseau.y)]
    partie.ramasser_bonus()
    assert vaisseau.sorte == FORMES[1]
    assert not partie.bonus[0].vivant


def test_nouvelle_vague_quand_la_flotte_est_vide():
    partie = partie_lancee()
    partie.flotte.ennemis = []
    partie.verifier_vague()
    assert partie.vague == 2
    assert len(partie.flotte.ennemis) > 0


def test_defaite_quand_les_ennemis_arrivent_en_bas():
    partie = partie_lancee()
    for ennemi in partie.flotte.ennemis:
        ennemi.deplacer(0, 600)
    partie.verifier_defaite()
    assert partie.statut == "perdu"


def test_une_partie_entiere_sans_erreur():
    partie = partie_lancee()
    for numero in range(5000):
        partie.mettre_a_jour(numero % 90 < 45, numero % 90 >= 45, True)
    assert partie.statut in ["en_cours", "perdu"]
    assert "bonus" in partie.etat()

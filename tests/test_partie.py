import random

from space_invaders.partie import Partie
from space_invaders.entites import Missile
from space_invaders.niveaux import PALIERS


def partie_lancee():
    random.seed(0)
    partie = Partie()
    partie.mettre_a_jour(False, False, True)
    return partie


def test_espace_demarre_la_partie():
    assert partie_lancee().statut == "en_cours"


def test_pause():
    partie = partie_lancee()
    partie.basculer_pause()
    x_depart = partie.vaisseau.x
    partie.mettre_a_jour(False, True, False)
    assert partie.statut == "pause"
    assert partie.vaisseau.x == x_depart


def test_un_tir_detruit_un_ennemi():
    partie = partie_lancee()
    cible = partie.flotte.ennemis[0]
    partie.missiles = [Missile(cible.x + 18, cible.y + 10, 0, -1, "tir")]
    partie.verifier_collisions()
    assert not cible.vivant
    assert partie.score == cible.points
    assert partie.ennemis_tues == 1


def test_passage_de_palier():
    partie = partie_lancee()
    partie.ennemis_tues = PALIERS[1]["seuil"]
    partie.verifier_palier()
    assert partie.vaisseau.sorte == PALIERS[1]["apparence"]
    assert partie.vaisseau.arme == PALIERS[1]["arme"]
    assert partie.vaisseau.vies == 4


def test_nouvelle_vague_quand_la_flotte_est_vide():
    partie = partie_lancee()
    partie.flotte.ennemis = []
    partie.verifier_vague()
    assert partie.vague == 2
    assert len(partie.flotte.ennemis) > 0


def test_defaite_quand_les_ennemis_arrivent_en_bas():
    partie = partie_lancee()
    partie.flotte.deplacer_tous(0, 600)
    partie.verifier_defaite()
    assert partie.statut == "perdu"


def test_defaite_sans_vie():
    partie = partie_lancee()
    partie.vaisseau.vies = 0
    partie.verifier_defaite()
    assert partie.statut == "perdu"


def test_etat_complet():
    cles = ["statut", "score", "meilleur_score", "vies", "vague", "attente", "palier",
            "nom_palier", "ennemis_tues", "prochain_seuil", "vaisseau", "ennemis",
            "missiles", "evenements"]
    etat = partie_lancee().etat()
    for cle in cles:
        assert cle in etat


def test_une_partie_entiere_sans_erreur():
    partie = partie_lancee()
    for numero in range(5000):
        partie.mettre_a_jour(numero % 90 < 45, numero % 90 >= 45, True)
    assert partie.statut in ["en_cours", "perdu"]

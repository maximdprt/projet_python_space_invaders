import random

from space_invaders.partie import Partie
from space_invaders.entites import Ennemi
from space_invaders.niveaux import LIGNE_DEFAITE


def partie_lancee():
    random.seed(0)
    partie = Partie()
    partie.mettre_a_jour(False, False, True)
    return partie


def test_espace_demarre_la_partie():
    assert partie_lancee().statut == "en_cours"


def test_la_partie_attend_espace():
    partie = Partie()
    partie.mettre_a_jour(False, True, False)
    assert partie.statut == "accueil"


def test_pause():
    partie = partie_lancee()
    partie.basculer_pause()
    tick_x = partie.vaisseau.x
    partie.mettre_a_jour(False, True, False)
    assert partie.statut == "pause"
    assert partie.vaisseau.x == tick_x


def test_un_tir_detruit_un_ennemi_et_augmente_le_score():
    partie = partie_lancee()
    partie.flotte.proba_tir = 0
    partie.flotte.vitesse = 0
    cible = partie.flotte.ennemis[-1]
    partie.vaisseau.x = cible.x + cible.largeur / 2 - partie.vaisseau.largeur / 2
    partie.mettre_a_jour(False, False, True)
    for _ in range(80):
        partie.mettre_a_jour(False, False, False)
    assert partie.ennemis_tues >= 1
    assert partie.score >= 10


def test_passage_de_palier_a_25_tues():
    partie = partie_lancee()
    partie.ennemis_tues = 25
    partie.verifier_palier()
    assert partie.index_palier == 1
    assert partie.vaisseau.apparence == "intercepteur"
    assert partie.vaisseau.arme == "double"
    assert any(e["type"] == "palier" for e in partie.evenements)


def test_nouvelle_vague_quand_la_flotte_est_vide():
    partie = partie_lancee()
    for ennemi in partie.flotte.ennemis:
        ennemi.vivant = False
    partie.verifier_fin_vague()
    assert partie.vague == 2
    assert not partie.flotte.est_vide()
    assert partie.etat()["en_transition"]


def test_defaite_quand_la_flotte_atteint_le_bas():
    partie = partie_lancee()
    for ennemi in partie.flotte.ennemis:
        ennemi.y = LIGNE_DEFAITE
    partie.verifier_defaite()
    assert partie.statut == "perdu"


def test_defaite_a_zero_vie():
    partie = partie_lancee()
    partie.vaisseau.vies = 0
    partie.verifier_defaite()
    assert partie.statut == "perdu"


def test_rejouer_apres_defaite():
    partie = partie_lancee()
    partie.vaisseau.vies = 0
    partie.mettre_a_jour(False, False, False)
    partie.mettre_a_jour(False, False, True)
    assert partie.statut == "en_cours"
    assert partie.vaisseau.vies == 3


def test_meilleur_score_conserve():
    partie = partie_lancee()
    partie.marquer_points(500)
    partie.demarrer()
    assert partie.score == 0
    assert partie.meilleur_score == 500


def test_etat_contient_toutes_les_cles():
    cles = ["statut", "tick", "score", "meilleur_score", "vies", "vies_max", "vague",
            "en_transition", "palier", "nom_palier", "ennemis_tues", "prochain_seuil",
            "vaisseau", "ennemis", "soucoupes", "missiles", "evenements"]
    etat = partie_lancee().etat()
    for cle in cles:
        assert cle in etat


def test_etat_vaisseau_contient_apparence():
    vaisseau = partie_lancee().etat()["vaisseau"]
    for cle in ["x", "y", "largeur", "hauteur", "apparence", "arme", "invincible"]:
        assert cle in vaisseau


def test_ennemi_touche_le_vaisseau_fait_perdre():
    partie = partie_lancee()
    intrus = Ennemi(partie.vaisseau.x, partie.vaisseau.y, "crabe")
    partie.flotte.ennemis.append(intrus)
    partie.verifier_defaite()
    assert partie.statut == "perdu"


def test_moteur_tourne_sans_erreur_longtemps():
    partie = partie_lancee()
    for numero in range(3000):
        partie.mettre_a_jour(numero % 90 < 45, numero % 90 >= 45, True)
    assert partie.tick > 0

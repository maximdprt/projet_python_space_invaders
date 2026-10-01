LARGEUR_ECRAN = 800
HAUTEUR_ECRAN = 600
VIES_DEPART = 3
VIES_MAX = 5
LIGNE_DEFAITE = 520
HAUT_FLOTTE = 70
ECART_X = 52
ECART_Y = 42
INVINCIBILITE = 120
PAUSE_ENTRE_VAGUES = 90
PROBA_SOUCOUPE = 0.0015
HAUSSE_PAR_VAGUE = 0.12

POINTS = {"meduse": 10, "crabe": 20, "poulpe": 30, "blinde": 40}

PLAFONDS = {"vitesse_flotte": 3.2, "proba_tir": 0.045, "vitesse_tir_ennemi": 10.0}

PALIERS = [
    {
        "nom": "RECRUE", "seuil": 0, "apparence": "chasseur", "arme": "simple",
        "missiles_max": 1, "recharge": 28, "vitesse_missile": 9,
        "lignes": 3, "colonnes": 8, "vitesse_flotte": 0.6, "descente": 14,
        "proba_tir": 0.006, "vitesse_tir_ennemi": 3.5, "part_blindes": 0,
        "vitesse_vaisseau": 5,
    },
    {
        "nom": "PILOTE", "seuil": 25, "apparence": "intercepteur", "arme": "double",
        "missiles_max": 4, "recharge": 22, "vitesse_missile": 10,
        "lignes": 4, "colonnes": 9, "vitesse_flotte": 0.9, "descente": 16,
        "proba_tir": 0.010, "vitesse_tir_ennemi": 4.5, "part_blindes": 0,
        "vitesse_vaisseau": 5.5,
    },
    {
        "nom": "AS", "seuil": 70, "apparence": "faucon", "arme": "triple",
        "missiles_max": 6, "recharge": 18, "vitesse_missile": 11,
        "lignes": 5, "colonnes": 10, "vitesse_flotte": 1.2, "descente": 18,
        "proba_tir": 0.015, "vitesse_tir_ennemi": 5.5, "part_blindes": 0.15,
        "vitesse_vaisseau": 6,
    },
    {
        "nom": "ELITE", "seuil": 140, "apparence": "croiseur", "arme": "eventail",
        "missiles_max": 10, "recharge": 15, "vitesse_missile": 12,
        "lignes": 5, "colonnes": 11, "vitesse_flotte": 1.5, "descente": 20,
        "proba_tir": 0.021, "vitesse_tir_ennemi": 6.5, "part_blindes": 0.3,
        "vitesse_vaisseau": 6.5,
    },
    {
        "nom": "LEGENDE", "seuil": 240, "apparence": "dreadnought", "arme": "laser",
        "missiles_max": 16, "recharge": 7, "vitesse_missile": 15,
        "lignes": 6, "colonnes": 11, "vitesse_flotte": 1.9, "descente": 22,
        "proba_tir": 0.028, "vitesse_tir_ennemi": 7.5, "part_blindes": 0.45,
        "vitesse_vaisseau": 7,
    },
]


def palier_pour(ennemis_tues):
    index_trouve = 0
    for index in range(len(PALIERS)):
        if PALIERS[index]["seuil"] <= ennemis_tues:
            index_trouve = index
    return index_trouve


def seuil_suivant(index_palier):
    if index_palier + 1 < len(PALIERS):
        return PALIERS[index_palier + 1]["seuil"]
    return -1


def parametres_vague(index_palier, numero_vague):
    palier = PALIERS[index_palier]
    parametres = {}
    for cle in palier:
        parametres[cle] = palier[cle]
    multiplicateur = 1 + HAUSSE_PAR_VAGUE * (numero_vague - 1)
    for cle in PLAFONDS:
        valeur = palier[cle] * multiplicateur
        if valeur > PLAFONDS[cle]:
            valeur = PLAFONDS[cle]
        parametres[cle] = valeur
    return parametres

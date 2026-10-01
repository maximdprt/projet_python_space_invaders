LARGEUR_ECRAN = 800
HAUTEUR_ECRAN = 600
VIES_DEPART = 3
VIES_MAX = 5
LIGNE_DEFAITE = 540
DESCENTE = 12
INVINCIBILITE = 150
PAUSE_ENTRE_VAGUES = 90
HAUSSE_PAR_VAGUE = 0.08

POINTS = {"meduse": 10, "crabe": 20, "poulpe": 30, "blinde": 40, "soucoupe": 150}

PALIERS = [
    {"nom": "RECRUE", "seuil": 0, "apparence": "chasseur", "arme": "simple",
     "recharge": 16, "vitesse_vaisseau": 6, "lignes": 3, "colonnes": 8,
     "vitesse_flotte": 0.5, "proba_tir": 0.012, "vitesse_tir": 3, "part_blindes": 0},
    {"nom": "PILOTE", "seuil": 20, "apparence": "intercepteur", "arme": "double",
     "recharge": 14, "vitesse_vaisseau": 6.5, "lignes": 3, "colonnes": 9,
     "vitesse_flotte": 0.7, "proba_tir": 0.016, "vitesse_tir": 3.5, "part_blindes": 0},
    {"nom": "AS", "seuil": 50, "apparence": "faucon", "arme": "triple",
     "recharge": 13, "vitesse_vaisseau": 7, "lignes": 4, "colonnes": 9,
     "vitesse_flotte": 0.9, "proba_tir": 0.020, "vitesse_tir": 4, "part_blindes": 0.1},
    {"nom": "ELITE", "seuil": 100, "apparence": "croiseur", "arme": "eventail",
     "recharge": 12, "vitesse_vaisseau": 7, "lignes": 4, "colonnes": 10,
     "vitesse_flotte": 1.1, "proba_tir": 0.025, "vitesse_tir": 4.5, "part_blindes": 0.2},
    {"nom": "LEGENDE", "seuil": 170, "apparence": "dreadnought", "arme": "laser",
     "recharge": 6, "vitesse_vaisseau": 7.5, "lignes": 5, "colonnes": 10,
     "vitesse_flotte": 1.3, "proba_tir": 0.030, "vitesse_tir": 5, "part_blindes": 0.3},
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


def plafonner(valeur, plafond):
    if valeur > plafond:
        return plafond
    return valeur


def parametres_vague(index_palier, numero_vague):
    palier = PALIERS[index_palier]
    hausse = 1 + HAUSSE_PAR_VAGUE * (numero_vague - 1)
    return {
        "lignes": palier["lignes"],
        "colonnes": palier["colonnes"],
        "part_blindes": palier["part_blindes"],
        "vitesse_tir": palier["vitesse_tir"],
        "vitesse_flotte": plafonner(palier["vitesse_flotte"] * hausse, 2),
        "proba_tir": plafonner(palier["proba_tir"] * hausse, 0.045),
    }

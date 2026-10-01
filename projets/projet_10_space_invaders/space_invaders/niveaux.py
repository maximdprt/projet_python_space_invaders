LARGEUR = 800
HAUTEUR = 600
LIGNE_DEFAITE = 540
VIES_MAX = 5

POINTS = {"poulpe": 30, "crabe": 20, "meduse": 10}

CANONS = {
    "chasseur": [0],
    "intercepteur": [-16, 16],
    "faucon": [-20, 0, 20],
    "croiseur": [-24, -8, 8, 24],
    "dreadnought": [-30, -15, 0, 15, 30],
}

PALIERS = [
    {"nom": "RECRUE", "seuil": 0, "vaisseau": "chasseur", "lignes": 3, "vitesse": 0.5, "proba_tir": 0.012},
    {"nom": "PILOTE", "seuil": 20, "vaisseau": "intercepteur", "lignes": 3, "vitesse": 0.7, "proba_tir": 0.016},
    {"nom": "AS", "seuil": 50, "vaisseau": "faucon", "lignes": 4, "vitesse": 0.9, "proba_tir": 0.02},
    {"nom": "ELITE", "seuil": 100, "vaisseau": "croiseur", "lignes": 4, "vitesse": 1.1, "proba_tir": 0.025},
    {"nom": "LEGENDE", "seuil": 170, "vaisseau": "dreadnought", "lignes": 5, "vitesse": 1.3, "proba_tir": 0.03},
]


def palier_pour(ennemis_tues):
    numero = 0
    for index in range(len(PALIERS)):
        if ennemis_tues >= PALIERS[index]["seuil"]:
            numero = index
    return numero

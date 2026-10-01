LARGEUR = 800
HAUTEUR = 600
LIGNE_DEFAITE = 540
VIES_MAX = 5
PROBA_BONUS = 0.15

POINTS = {"poulpe": 30, "crabe": 20, "meduse": 10}

FORMES = ["chasseur", "intercepteur", "faucon", "croiseur", "dreadnought"]

CANONS = {
    "chasseur": [0],
    "intercepteur": [-16, 16],
    "faucon": [-20, 0, 20],
    "croiseur": [-24, -8, 8, 24],
    "dreadnought": [-30, -15, 0, 15, 30],
}

VAGUES = [
    {"lignes": 3, "vitesse": 0.8, "proba_tir": 0.03},
    {"lignes": 4, "vitesse": 1.0, "proba_tir": 0.04},
    {"lignes": 4, "vitesse": 1.3, "proba_tir": 0.05},
    {"lignes": 5, "vitesse": 1.5, "proba_tir": 0.06},
    {"lignes": 5, "vitesse": 1.8, "proba_tir": 0.07},
]


def parametres_vague(numero):
    if numero > len(VAGUES):
        numero = len(VAGUES)
    return VAGUES[numero - 1]

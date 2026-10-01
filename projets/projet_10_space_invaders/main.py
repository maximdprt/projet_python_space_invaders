from space_invaders.partie import Partie


def main():
    partie = Partie()
    partie.mettre_a_jour(False, False, True)
    for numero in range(600):
        partie.mettre_a_jour(False, numero % 40 < 20, numero % 7 == 0)
    etat = partie.etat()
    print("Projet 10 - Space Invaders (Corentin & Maxim)")
    print(f"Score : {etat['score']} - Vies : {etat['vies']} - Forme : {etat['forme']}/5 - Statut : {etat['statut']}")
    print("Pour jouer : lance python main.py a la racine et va a la borne 10.")


if __name__ == "__main__":
    main()

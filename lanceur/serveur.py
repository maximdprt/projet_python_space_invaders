import json
import os
import subprocess
import sys
import threading
import time
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "projets" / "projet_10_space_invaders"))

from space_invaders.partie import Partie

DOSSIER_SALLE = RACINE / "salle"
FICHIER_PROJETS = RACINE / "projets" / "projets.json"
PORT = int(os.environ.get("PORT_SALLE", "8000"))
TICK = 1 / 60


class Moteur:
    """Fait tourner la Partie (Python pur) 60 fois par seconde ; le navigateur ne fait qu'afficher."""

    def __init__(self):
        self.partie = Partie()
        self.touches = {"gauche": False, "droite": False, "tir": False}
        self.tir_en_attente = False
        self.en_pause = False
        self.image = "{}"
        self.numero = 0
        self.signal = threading.Condition()

    def boucle(self):
        prochain = time.perf_counter()
        while True:
            with self.signal:
                tir = self.touches["tir"] or self.tir_en_attente
                self.tir_en_attente = False
                if not self.en_pause:
                    self.partie.mettre_a_jour(self.touches["gauche"], self.touches["droite"], tir)
                etat = self.partie.etat()
                etat["pause"] = self.en_pause
                self.image = json.dumps(etat, separators=(",", ":"))
                self.numero += 1
                self.signal.notify_all()
            prochain += TICK
            time.sleep(max(0, prochain - time.perf_counter()))

    def appuyer(self, touches):
        with self.signal:
            if touches.get("tir") and not self.touches["tir"]:
                self.tir_en_attente = True
            for nom in self.touches:
                self.touches[nom] = bool(touches.get(nom))

    def pause(self, voulue):
        with self.signal:
            self.en_pause = voulue and self.partie.statut == "en_cours"


moteur = Moteur()


def lire_projets():
    with open(FICHIER_PROJETS, encoding="utf-8") as fichier:
        return json.load(fichier)


def lancer_projet(numero):
    projet = next((p for p in lire_projets() if p["numero"] == numero), None)
    if projet is None or projet["type"] != "terminal" or not projet["disponible"]:
        return False
    options = {"creationflags": subprocess.CREATE_NEW_CONSOLE} if os.name == "nt" else {}
    subprocess.Popen([sys.executable, "main.py"], cwd=RACINE / projet["dossier"], **options)
    return True


class Gestionnaire(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".woff2": "font/woff2"}

    def repondre(self, donnees):
        corps = json.dumps(donnees, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def lire_corps(self):
        taille = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(taille) or b"{}")

    def do_GET(self):
        if self.path == "/api/projets":
            self.repondre(lire_projets())
        elif self.path == "/api/flux":
            self.diffuser()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/touches":
            moteur.appuyer(self.lire_corps())
            self.repondre({"ok": True})
        elif self.path == "/api/pause":
            moteur.pause(self.lire_corps().get("pause", True))
            self.repondre({"ok": True})
        elif self.path.startswith("/api/lancer/") and self.path[12:].isdigit():
            self.repondre({"ok": lancer_projet(int(self.path[12:]))})
        else:
            self.send_error(404)

    def diffuser(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        vu = -1
        try:
            while True:
                with moteur.signal:
                    moteur.signal.wait_for(lambda deja_vu=vu: moteur.numero != deja_vu, timeout=1)
                    vu, image = moteur.numero, moteur.image
                self.wfile.write(f"data: {image}\n\n".encode())
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            moteur.appuyer({})
            moteur.pause(True)

    def log_message(self, format, *args):
        pass


def demarrer_salle():
    threading.Thread(target=moteur.boucle, daemon=True).start()
    serveur = ThreadingHTTPServer(("127.0.0.1", PORT), partial(Gestionnaire, directory=str(DOSSIER_SALLE)))
    adresse = f"http://localhost:{PORT}"
    print(f"Salle d'arcade ouverte sur {adresse} - Ctrl+C pour quitter")
    if not os.environ.get("SALLE_SANS_NAVIGATEUR"):
        webbrowser.open(adresse)
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("Salle fermée.")

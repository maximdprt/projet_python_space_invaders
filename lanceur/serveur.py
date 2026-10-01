import json
import os
import subprocess
import sys
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOSSIER_SALLE = RACINE / "salle" / "dist"
FICHIER_PROJETS = RACINE / "projets" / "projets.json"
PORT = int(os.environ.get("PORT_SALLE", "8000"))
OUVRIR_NAVIGATEUR = os.environ.get("SALLE_SANS_NAVIGATEUR", "") == ""
ADRESSES_LOCALES = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

TYPES_MIME = {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".wasm": "application/wasm",
    ".json": "application/json",
    ".css": "text/css",
    ".zip": "application/zip",
    ".html": "text/html",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}


def lire_projets():
    with open(FICHIER_PROJETS, encoding="utf-8") as fichier:
        return json.load(fichier)


def lancer_projet(numero):
    projet = next((p for p in lire_projets() if p["numero"] == numero), None)
    if projet is None:
        return False, f"Projet {numero} inconnu"
    if projet.get("type") != "terminal":
        return False, "Ce projet tourne directement dans la borne"
    if not projet.get("disponible"):
        return False, f"{projet['nom']} : bientôt disponible"
    dossier = RACINE / projet["dossier"]
    if not (dossier / "main.py").exists():
        return False, f"main.py introuvable dans {projet['dossier']}"
    options = {}
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NEW_CONSOLE
    subprocess.Popen([sys.executable, "main.py"], cwd=dossier, **options)
    return True, ""


class GestionnaireSalle(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, **TYPES_MIME}

    def envoyer_json(self, code, donnees):
        corps = json.dumps(donnees, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def depuis_cette_machine(self):
        return self.client_address[0] in ADRESSES_LOCALES

    def do_GET(self):
        chemin = self.path.split("?")[0]
        if chemin == "/api/projets":
            self.envoyer_json(200, lire_projets())
            return
        super().do_GET()

    def do_POST(self):
        chemin = self.path.split("?")[0]
        if not chemin.startswith("/api/lancer/"):
            self.envoyer_json(404, {"ok": False, "message": "Route inconnue"})
            return
        if not self.depuis_cette_machine():
            self.envoyer_json(403, {"ok": False, "message": "Lancement autorisé seulement en local"})
            return
        numero = chemin.rsplit("/", 1)[-1]
        if not numero.isdigit():
            self.envoyer_json(400, {"ok": False, "message": "Numéro invalide"})
            return
        ok, message = lancer_projet(int(numero))
        self.envoyer_json(200, {"ok": ok, "message": message})

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        if self.path.startswith("/api/"):
            super().log_message(format, *args)


def demarrer_salle():
    if not (DOSSIER_SALLE / "index.html").exists():
        print("La salle n'est pas encore construite.")
        print("Lance d'abord : cd salle ; npm install ; npm run build")
        return
    gestionnaire = partial(GestionnaireSalle, directory=str(DOSSIER_SALLE))
    serveur = ThreadingHTTPServer(("127.0.0.1", PORT), gestionnaire)
    adresse = f"http://localhost:{PORT}"
    print(f"Salle d'arcade ouverte sur {adresse} — Ctrl+C pour quitter")
    if OUVRIR_NAVIGATEUR:
        threading.Timer(0.6, lambda: webbrowser.open(adresse)).start()
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\nSalle fermée. À bientôt !")
    finally:
        serveur.server_close()

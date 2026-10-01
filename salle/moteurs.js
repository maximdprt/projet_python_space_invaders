// Deux façons de faire tourner LE MÊME jeu Python (les 4 fichiers de space_invaders/) :
// - en local (python main.py) : le serveur Python calcule le jeu et l'envoie en direct ;
// - en ligne (Vercel, site statique) : MicroPython (~560 Ko) exécute les fichiers .py dans le navigateur.
export const EN_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname) && !location.search.includes("navigateur");

export function demarrerMoteur(recevoir) {
  return EN_LOCAL ? moteurServeur(recevoir) : moteurNavigateur(recevoir);
}

function moteurServeur(recevoir) {
  new EventSource("/api/flux").onmessage = (m) => recevoir(JSON.parse(m.data));
  const envoyer = (route, donnees) => fetch(route, { method: "POST", body: JSON.stringify(donnees) });
  return {
    touches: (t) => envoyer("/api/touches", t),
    pause: (oui) => envoyer("/api/pause", { pause: oui }),
  };
}

const FICHIERS = ["__init__", "niveaux", "entites", "flotte", "partie"];
// Petit pont Python : avance la partie d'une image et garde les explosions jusqu'à la prochaine lecture.
const PONT = `
import sys, json
sys.path.append("/")
from space_invaders.partie import Partie
partie = Partie()
explosions = []
def avancer(gauche, droite, tir):
    partie.mettre_a_jour(gauche, droite, tir)
    if partie.statut == "en_cours":
        explosions.extend(partie.explosions)
def lire():
    etat = partie.etat()
    etat["explosions"] = explosions[:]
    del explosions[:]
    return json.dumps(etat)
`;

function moteurNavigateur(recevoir) {
  let avancer = null, lire = null, enPause = true, tirEnAttente = false, reste = 0, avant = 0, dernier = null;
  let touches = { gauche: false, droite: false, tir: false };
  const publier = (texte) => {
    dernier = JSON.parse(texte);
    dernier.pause = enPause && dernier.statut === "en_cours";
    recevoir(dernier);
  };

  (async () => {
    const { loadMicroPython } = await import("./lib/micropython/micropython.mjs");
    const mp = await loadMicroPython({ heapsize: 4 * 1024 * 1024 });
    mp.FS.mkdir("/space_invaders");
    for (const nom of FICHIERS) mp.FS.writeFile(`/space_invaders/${nom}.py`, await (await fetch(`space_invaders/${nom}.py`)).text());
    mp.runPython(PONT);
    avancer = mp.globals.get("avancer");
    lire = mp.globals.get("lire");
    publier(lire());
  })();

  // 60 images de jeu par seconde, quelle que soit la vitesse de l'écran.
  requestAnimationFrame(function boucle(t) {
    requestAnimationFrame(boucle);
    const dt = Math.min(100, t - avant);
    avant = t;
    if (!avancer || enPause) return;
    reste += dt;
    let calcule = false;
    while (reste >= 1000 / 60) {
      reste -= 1000 / 60;
      avancer(touches.gauche, touches.droite, touches.tir || tirEnAttente);
      tirEnAttente = false;
      calcule = true;
    }
    if (calcule) publier(lire());
  });

  return {
    touches(t) {
      if (t.tir && !touches.tir) tirEnAttente = true;
      touches = { ...t };
    },
    pause(oui) {
      enPause = oui;
      reste = 0;
      if (dernier) recevoir({ ...dernier, explosions: [], pause: enPause && dernier.statut === "en_cours" });
    },
  };
}

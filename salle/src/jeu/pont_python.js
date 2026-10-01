// Pont JS <-> Python : charge Pyodide, écrit les 4 fichiers du jeu dans son système
// de fichiers virtuel et expose une petite API. Aucune règle du jeu ici.
import initPy from "../../../src/space_invaders/__init__.py?raw";
import niveauxPy from "../../../src/space_invaders/niveaux.py?raw";
import entitesPy from "../../../src/space_invaders/entites.py?raw";
import flottePy from "../../../src/space_invaders/flotte.py?raw";
import partiePy from "../../../src/space_invaders/partie.py?raw";

const FICHIERS = {
  "__init__.py": initPy,
  "niveaux.py": niveauxPy,
  "entites.py": entitesPy,
  "flotte.py": flottePy,
  "partie.py": partiePy,
};

let pyodide = null;
let partie = null;
let majPy = null;
let etatPy = null;
let pausePy = null;
let derniereErreur = null;
let promesse = null;

export function chargerJeu(signalerProgression = () => {}) {
  if (!promesse) promesse = charger(signalerProgression);
  return promesse;
}

async function charger(signaler) {
  try {
    signaler(0.05, "Démarrage de Python…");
    const indexURL = new URL("pyodide/", document.baseURI).href;
    const module = await import(/* @vite-ignore */ indexURL + "pyodide.mjs");
    signaler(0.15, "Téléchargement de Python (WebAssembly)…");
    const options = { indexURL };
    // Hébergement sans .zip autorisé (ex. page de démo) : chemin de la stdlib surchargeable.
    if (window.PYODIDE_STDLIB_URL) options.stdLibURL = new URL(window.PYODIDE_STDLIB_URL, document.baseURI).href;
    pyodide = await module.loadPyodide(options);
    signaler(0.8, "Chargement des 4 fichiers du jeu…");
    pyodide.FS.mkdirTree("/home/pyodide/space_invaders");
    for (const [nom, contenu] of Object.entries(FICHIERS)) {
      pyodide.FS.writeFile(`/home/pyodide/space_invaders/${nom}`, contenu);
    }
    pyodide.runPython(
      "import sys\nif '/home/pyodide' not in sys.path:\n    sys.path.insert(0, '/home/pyodide')\n" +
        "from space_invaders.partie import Partie\npartie = Partie()",
    );
    partie = pyodide.globals.get("partie");
    majPy = partie.mettre_a_jour;
    etatPy = partie.etat;
    pausePy = partie.basculer_pause;
    signaler(1, "Python prêt");
    return true;
  } catch (erreur) {
    derniereErreur = String(erreur && erreur.message ? erreur.message : erreur);
    signaler(1, "Erreur Python");
    console.error(erreur);
    return false;
  }
}

export function estPret() {
  return partie !== null && derniereErreur === null;
}

export function erreur() {
  return derniereErreur;
}

// Avance d'un tick et renvoie les évènements de CE tick (pour ne rien perdre en rattrapage).
export function tick(gauche, droite, tir) {
  if (!estPret()) return [];
  try {
    majPy(gauche, droite, tir);
    const liste = partie.evenements;
    let evenements = [];
    if (liste.length > 0) evenements = liste.toJs({ dict_converter: Object.fromEntries });
    liste.destroy();
    return evenements;
  } catch (e) {
    derniereErreur = String(e.message || e);
    console.error(e);
    return [];
  }
}

export function lireEtat() {
  if (!estPret()) return null;
  try {
    const proxy = etatPy();
    const etat = proxy.toJs({ dict_converter: Object.fromEntries });
    proxy.destroy();
    return etat;
  } catch (e) {
    derniereErreur = String(e.message || e);
    console.error(e);
    return null;
  }
}

export function basculerPause() {
  if (estPret()) pausePy();
}

export function statut() {
  if (!estPret()) return "chargement";
  return partie.statut;
}

export function definirMeilleurScore(n) {
  if (!estPret()) return;
  partie.meilleur_score = Math.max(0, Math.floor(Number(n) || 0));
}

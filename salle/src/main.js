// Point d'entrée : construit la salle, l'interface et branche le jeu Python sur la borne 10.
import * as THREE from "three";
import "@fontsource/press-start-2p/400.css";
import "@fontsource/orbitron/600.css";
import "@fontsource/orbitron/900.css";
import projetsJson from "../../projets/projets.json";

import { creerScene } from "./salle/scene.js";
import { creerArchitecture } from "./salle/architecture.js";
import { creerBorne, creerEcranAttente } from "./salle/bornes.js";
import { creerControles } from "./salle/controles.js";
import { creerInteraction } from "./salle/interaction.js";
import { creerPersonnages } from "./salle/personnages.js";
import { creerHudSalle } from "./ui/hud_salle.js";
import { creerEcranAccueil } from "./ui/chargement.js";
import { creerRenduJeu } from "./jeu/rendu_jeu.js";
import { creerEffets, appliquerEvenements, mettreAJourEffets } from "./jeu/effets.js";
import { activerClavierJeu, lireCommandes, surPause, surQuitter } from "./jeu/clavier.js";
import * as python from "./jeu/pont_python.js";

const CLE_RECORD = "eugenia_space_invaders_record";
const PAS = 1 / 60;

function lireRecord() {
  try {
    return Number(localStorage.getItem(CLE_RECORD)) || 0;
  } catch {
    return 0;
  }
}

function ecrireRecord(valeur) {
  try {
    localStorage.setItem(CLE_RECORD, String(valeur));
  } catch {
    /* stockage indisponible : le record reste en mémoire */
  }
}

async function demarrer() {
  await Promise.all([
    document.fonts.load('16px "Press Start 2P"'),
    document.fonts.load('900 40px "Orbitron"'),
    document.fonts.load('600 40px "Orbitron"'),
  ]).catch(() => {});

  const projets = projetsJson.map((p) => ({ ...p }));
  const monde = creerScene(document.getElementById("app"));
  const { scene, camera, renderer } = monde;
  const architecture = creerArchitecture(scene);
  const personnages = creerPersonnages(scene);

  // --- Bornes ---
  const rendu = creerRenduJeu(2);
  const effets = creerEffets();
  const ecransAttente = new Map();
  const bornes = projets.map((projet) => {
    let canvas = rendu.canvas;
    if (projet.type !== "integre") {
      const ecran = creerEcranAttente(projet);
      ecransAttente.set(projet.numero, ecran);
      canvas = ecran.canvas;
    }
    return creerBorne(projet, canvas);
  });
  const emplacements = {
    1: [-6.2, -6, Math.PI / 2], 2: [-6.2, -3.5, Math.PI / 2], 3: [-6.2, -1, Math.PI / 2],
    4: [-6.2, 1.5, Math.PI / 2], 5: [-6.2, 4, Math.PI / 2],
    6: [6.2, -6, -Math.PI / 2], 7: [6.2, -3.5, -Math.PI / 2], 8: [6.2, -1, -Math.PI / 2],
    9: [6.2, 1.5, -Math.PI / 2], 10: [0, -9.3, 0],
  };
  const obstacles = [...architecture.obstacles, ...personnages.obstacles];
  for (const borne of bornes) {
    const [x, z, rot] = emplacements[borne.projet.numero];
    borne.groupe.position.set(x, 0, z);
    borne.groupe.rotation.y = rot;
    scene.add(borne.groupe);
    if (borne.projet.type === "integre") {
      obstacles.push({ minX: x - 1.32, maxX: x + 1.32, minZ: z - 0.3 - 1.32, maxZ: z - 0.3 + 1.32 });
    } else {
      const avant = 0.24;
      const arriere = 0.74;
      const sens = Math.sign(rot);
      const minX = sens > 0 ? x - arriere : x - avant;
      const maxX = sens > 0 ? x + avant : x + arriere;
      obstacles.push({ minX, maxX, minZ: z - 0.4, maxZ: z + 0.4 });
    }
  }
  const borneJeu = bornes.find((b) => b.projet.type === "integre");

  const projecteur = new THREE.SpotLight(0xffd6f4, 40, 12, 0.42, 0.5, 1.2);
  projecteur.position.set(0, 4.3, -6.6);
  projecteur.target.position.set(0, 0.8, -9.3);
  projecteur.shadow.mapSize.set(1024, 1024);
  projecteur.shadow.bias = -0.0004;
  scene.add(projecteur, projecteur.target);

  // --- Contrôles et interface ---
  const controles = creerControles(camera, renderer.domElement, obstacles);
  scene.add(controles.controles.object);
  const interaction = creerInteraction(camera, bornes);
  const hud = creerHudSalle();
  let mode = "accueil";
  let positionSalle = null;
  let chargement = { valeur: 0, message: "Préparation de Python…" };

  const accueil = creerEcranAccueil(() => controles.verrouiller());
  controles.controles.addEventListener("lock", () => {
    accueil.cacher();
    if (mode === "accueil") mode = "salle";
  });
  controles.controles.addEventListener("unlock", () => {
    if (mode === "salle") accueil.afficherReprendre(true);
  });

  monde.surQualite((q, nom) => {
    architecture.definirQualite(q);
    projecteur.castShadow = q.ombres;
    const avant = rendu.canvas.width;
    rendu.definirFacteur(q.facteurJeu);
    if (rendu.canvas.width !== avant) {
      borneJeu.texture.dispose();
      borneJeu.texture.needsUpdate = true;
    }
    hud.afficherQualite(nom);
  });
  monde.appliquerQualite("moyen");

  // --- Chargement de Python en arrière-plan dès l'ouverture ---
  python
    .chargerJeu((valeur, message) => {
      chargement = { valeur, message };
      accueil.progression(valeur, message);
    })
    .then((ok) => {
      if (ok) python.definirMeilleurScore(lireRecord());
      accueil.progression(1, ok ? "Python prêt · borne 10 jouable" : "Erreur Python (voir l'écran de la borne 10)");
    });

  // Disponibilité à jour depuis le lanceur (si la salle est servie par main.py)
  fetch("api/projets")
    .then((r) => (r.ok ? r.json() : null))
    .then((liste) => {
      if (!Array.isArray(liste)) return;
      for (const p of liste) {
        const local = projets.find((x) => x.numero === p.numero);
        if (local) local.disponible = Boolean(p.disponible);
      }
    })
    .catch(() => {});

  // --- Entrer / sortir de la borne 10 ---
  function entrerJeu() {
    mode = "transition";
    positionSalle = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
    controles.definirActif(false);
    controles.deverrouiller();
    hud.afficherVisee(null);
    interaction.lancerTransition(interaction.cadrageEcran(borneJeu), 0.8, () => {
      mode = "jeu";
      activerClavierJeu(true);
      hud.modeJeu(true);
    });
  }

  function quitterJeu() {
    if (mode !== "jeu") return;
    if (python.statut() === "en_cours") python.basculerPause();
    activerClavierJeu(false);
    hud.modeJeu(false);
    mode = "transition";
    interaction.lancerTransition(positionSalle, 0.8, () => {
      mode = "salle";
      controles.definirActif(true);
      accueil.afficherReprendre(true);
    });
  }

  surQuitter(quitterJeu);
  surPause(() => python.basculerPause());

  async function lancerProjet(borne, t) {
    const ecran = ecransAttente.get(borne.projet.numero);
    if (!borne.projet.disponible) {
      ecran.afficherMessage("BIENTOT !", t, 2.5);
      hud.message(`${borne.projet.nom} : bientôt disponible`);
      return;
    }
    try {
      const reponse = await fetch(`api/lancer/${borne.projet.numero}`, { method: "POST" });
      const donnees = await reponse.json();
      if (donnees.ok) {
        ecran.afficherMessage("EN COURS DANS LE TERMINAL", t, 8);
        hud.message(`${borne.projet.nom} s'ouvre dans un terminal`);
      } else {
        hud.message(donnees.message || "Impossible de lancer ce projet");
      }
    } catch {
      hud.message("Lancement en terminal : utilise « python main.py »", 4000);
    }
  }

  let temps = 0;
  window.addEventListener("keydown", (e) => {
    if (e.code === "F1") {
      e.preventDefault();
      monde.qualiteSuivante();
      return;
    }
    if (e.code === "KeyH" && mode !== "jeu") hud.basculerAide();
    if (e.code === "KeyE" && mode === "salle" && controles.estVerrouille()) {
      const borne = interaction.borneVisee();
      if (!borne) return;
      if (borne.projet.type === "integre") entrerJeu();
      else lancerProjet(borne, temps);
    }
  });

  // --- Boucle principale ---
  const horloge = new THREE.Timer();
  let accumulateur = 0;
  let dernierEcransAttente = 0;

  function avancerJeu(dt) {
    if (!python.estPret()) {
      if (python.erreur()) rendu.dessinerErreur(python.erreur(), dt);
      else rendu.dessinerChargement(chargement.valeur, chargement.message, dt);
      return;
    }
    accumulateur = Math.min(accumulateur + dt, PAS * 5);
    const commandes = mode === "jeu" ? lireCommandes() : { gauche: false, droite: false, tir: false };
    while (accumulateur >= PAS) {
      const evenements = python.tick(commandes.gauche, commandes.droite, commandes.tir);
      appliquerEvenements(effets, evenements);
      for (const ev of evenements) {
        if (ev.type === "defaite") ecrireRecord(Math.max(lireRecord(), ev.score));
      }
      accumulateur -= PAS;
    }
    const etat = python.lireEtat();
    mettreAJourEffets(effets, dt);
    if (etat) rendu.dessiner(etat, effets, dt);
    else if (python.erreur()) rendu.dessinerErreur(python.erreur(), dt);
  }

  function boucle() {
    requestAnimationFrame(boucle);
    horloge.update();
    const dt = Math.min(horloge.getDelta(), 0.1);
    temps += dt;

    if (mode === "salle") {
      controles.miseAJour(dt);
      hud.afficherVisee(controles.estVerrouille() ? interaction.borneVisee() : null);
    }
    interaction.miseAJour(dt);

    avancerJeu(dt);
    borneJeu.texture.needsUpdate = true;

    if (temps - dernierEcransAttente > 1 / 15) {
      dernierEcransAttente = temps;
      for (const borne of bornes) {
        const ecran = ecransAttente.get(borne.projet.numero);
        if (!ecran) continue;
        ecran.dessiner(temps);
        borne.texture.needsUpdate = true;
      }
    }

    architecture.miseAJour(temps, dt);
    personnages.miseAJour(temps);
    for (const borne of bornes) borne.animer(temps);
    monde.rendre();
  }
  boucle();

  // Accès de débogage depuis la console du navigateur (F12).
  window.__arcade = { python, camera, rendu, effets, mode: () => mode, entrerJeu, quitterJeu, interaction, bornes };
}

demarrer();

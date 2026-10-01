// Salle d'arcade 3D. Le jeu tourne en Python sur le serveur : ici on affiche et on envoie les touches.
import * as THREE from "three";
import { creerEcranJeu } from "./jeu.js";

const $ = (id) => document.getElementById(id);
await document.fonts.load("16px Pixel");
const projets = await (await fetch("/api/projets")).json();

// ---------- Moteur 3D ----------
const rendu = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
rendu.setPixelRatio(Math.min(devicePixelRatio, 1.5));
rendu.setSize(innerWidth, innerHeight);
rendu.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(rendu.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#07020f");
scene.fog = new THREE.Fog("#07020f", 12, 34);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 60);
camera.rotation.order = "YXZ";
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  rendu.setSize(innerWidth, innerHeight);
});

function toile(l, h, dessin, repetition = 1) {
  const c = document.createElement("canvas");
  c.width = l; c.height = h;
  dessin(c.getContext("2d"), l, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetition, repetition);
  return t;
}
function bloc(l, h, p, materiau, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), materiau);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const neon = (couleur) => new THREE.MeshBasicMaterial({ color: couleur, toneMapped: false });
const mat = (couleur, options = {}) => new THREE.MeshPhongMaterial({ color: couleur, shininess: 60, ...options });
const OR = mat("#c9a24a", { shininess: 120, specular: "#fff1b8" });
const NOIR_LAQUE = mat("#0b0710", { shininess: 140, specular: "#555" });
const texHalo = toile(64, 64, (g) => {
  const d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  d.addColorStop(0, "#fff"); d.addColorStop(0.25, "#ffffff88"); d.addColorStop(1, "#fff0");
  g.fillStyle = d; g.fillRect(0, 0, 64, 64);
});
function halo(couleur, x, y, z, taille, parent = scene) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHalo, color: couleur, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.position.set(x, y, z);
  s.scale.setScalar(taille);
  parent.add(s);
  return s;
}
const obstacles = [];

// ---------- Salle : sol, murs, plafond ----------
const sol = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), new THREE.MeshLambertMaterial({
  map: toile(256, 256, (g) => {
    g.fillStyle = "#170c29"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#c9a24a66"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(128, 20); g.lineTo(236, 128); g.lineTo(128, 236); g.lineTo(20, 128); g.closePath(); g.stroke();
    g.fillStyle = "#ff2bd655"; g.fillRect(122, 122, 12, 12);
  }, 9),
}));
sol.rotation.x = -Math.PI / 2;
sol.position.set(0, 0, -3);
scene.add(sol);
const allee = new THREE.Mesh(new THREE.PlaneGeometry(7, 20), new THREE.MeshStandardMaterial({
  roughness: 0.18, metalness: 0.4,
  map: toile(128, 128, (g) => {
    g.fillStyle = "#05030a"; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#3a1d63"; g.lineWidth = 2; g.strokeRect(1, 1, 126, 126);
  }, 4),
}));
allee.rotation.x = -Math.PI / 2;
allee.position.set(0, 0.005, -3);
scene.add(allee);
const tapis = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 14.5), new THREE.MeshLambertMaterial({
  map: toile(64, 256, (g) => {
    g.fillStyle = "#8a0f1f"; g.fillRect(0, 0, 64, 256);
    g.fillStyle = "#c9a24a"; g.fillRect(3, 0, 3, 256); g.fillRect(58, 0, 3, 256);
    g.fillStyle = "#a8162b";
    for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(32, y); g.lineTo(46, y + 16); g.lineTo(32, y + 32); g.lineTo(18, y + 16); g.fill(); }
  }),
}));
tapis.material.map.repeat.set(1, 6);
tapis.rotation.x = -Math.PI / 2;
tapis.position.set(0, 0.01, -1.95);
scene.add(tapis);

const murTex = toile(128, 256, (g) => {
  g.fillStyle = "#0e0818"; g.fillRect(0, 0, 128, 256);
  g.strokeStyle = "#24133b"; g.lineWidth = 4; g.strokeRect(12, 12, 104, 232);
});
murTex.repeat.set(10, 1);
const murMat = new THREE.MeshLambertMaterial({ map: murTex });
for (const [l, x, z, angle] of [[20, -9, -3, Math.PI / 2], [20, 9, -3, -Math.PI / 2], [18, 0, -13, 0], [18, 0, 7, Math.PI]]) {
  const mur = new THREE.Mesh(new THREE.PlaneGeometry(l, 4.5), murMat);
  mur.position.set(x, 2.25, z);
  mur.rotation.y = angle;
  scene.add(mur);
}
const plafond = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), new THREE.MeshLambertMaterial({ color: "#05030a" }));
plafond.rotation.x = Math.PI / 2;
plafond.position.set(0, 4.5, -3);
scene.add(plafond);

// Bandes néon des murs + caissons dorés du plafond
for (const [x, couleur] of [[-8.97, "#ff2bd6"], [8.97, "#22f5ff"]]) {
  bloc(0.03, 0.05, 20, neon(couleur), x, 0.35, -3);
  bloc(0.03, 0.05, 20, neon(couleur), x, 3.4, -3);
}
for (const x of [-3, 3]) bloc(0.08, 0.04, 19, OR, x, 4.45, -3);
for (let z = -12; z <= 6; z += 4.5) bloc(6, 0.04, 0.08, OR, 0, 4.45, z);

// Enseigne néon du fond
const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({
  transparent: true, depthWrite: false, toneMapped: false,
  map: toile(1024, 256, (g, l) => {
    g.textAlign = "center";
    for (const [mot, y, couleur] of [["EUGENIA", 105, "#ff2bd6"], ["ARCADE", 215, "#22f5ff"]]) {
      g.font = "86px Pixel"; g.shadowColor = couleur; g.shadowBlur = 30;
      g.strokeStyle = couleur; g.lineWidth = 6; g.strokeText(mot, l / 2, y);
      g.fillStyle = "#fff"; g.fillText(mot, l / 2, y);
    }
  }),
}));
enseigne.position.set(0, 3.3, -12.95);
scene.add(enseigne);
bloc(6.3, 1.7, 0.05, NOIR_LAQUE, 0, 3.3, -12.99);

// Colonnes laquées
for (const x of [-5, 5]) for (const z of [4.6, -1.2, -7.6]) {
  const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.5, 20), NOIR_LAQUE);
  colonne.position.set(x, 2.25, z);
  scene.add(colonne);
  for (const y of [0.15, 3.0, 4.35]) {
    const anneau = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 20), OR);
    anneau.position.set(x, y, z);
    scene.add(anneau);
  }
  bloc(0.04, 2.4, 0.04, neon(x < 0 ? "#ff2bd6" : "#22f5ff"), x + (x < 0 ? 0.33 : -0.33), 1.6, z);
  obstacles.push({ x, z, r: 0.45 });
}

// Poteaux et cordons rouges le long du tapis
const corde = mat("#b0102a");
for (const x of [-1.1, 1.1]) for (let z = 4.5; z > -8.5; z -= 2.6) {
  const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.12, 0.95, 12), OR);
  poteau.position.set(x, 0.47, z);
  scene.add(poteau);
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), OR);
  tete.position.set(x, 0.97, z);
  scene.add(tete);
  if (z > -7) bloc(0.03, 0.03, 2.6, corde, x, 0.85, z - 1.3);
}

// Boules à facettes
const boules = [-3, 3].map((x) => {
  const boule = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat("#bbb", { flatShading: true, shininess: 200, specular: "#fff" }));
  boule.position.set(x, 3.8, -3);
  scene.add(boule);
  return boule;
});

// Lumières (peu nombreuses : c'est ce qui coûte le plus)
scene.add(new THREE.HemisphereLight("#8a6cff", "#2a0a24", 1.1));
for (const [couleur, x, y, z, i] of [["#ff2bd6", -6, 3, 0, 30], ["#22f5ff", 6, 3, 0, 30], ["#ff2bd6", -6, 3, -8, 25],
  ["#22f5ff", 6, 3, -8, 25], ["#ffcf7a", 0, 3.8, -9.5, 45], ["#ffcf7a", 0, 3.8, 3, 20]]) {
  const lumiere = new THREE.PointLight(couleur, i, 16, 1.5);
  lumiere.position.set(x, y, z);
  scene.add(lumiere);
}

// ---------- Bornes ----------
const ecranJeu = creerEcranJeu();
const texJeu = new THREE.CanvasTexture(ecranJeu.canvas);
texJeu.colorSpace = THREE.SRGBColorSpace;

function marquee(p) {
  return toile(512, 128, (g, l, h) => {
    const d = g.createLinearGradient(0, 0, l, 0);
    d.addColorStop(0, "#0a0414"); d.addColorStop(0.5, p.couleur); d.addColorStop(1, "#0a0414");
    g.fillStyle = d; g.fillRect(0, 0, l, h);
    g.textAlign = "center"; g.shadowColor = "#fff"; g.shadowBlur = 8; g.fillStyle = "#fff";
    g.font = "40px Pixel"; g.fillText(String(p.numero).padStart(2, "0"), 62, 84);
    g.font = "24px Pixel"; g.fillText(p.nom.toUpperCase(), 300, 62, 380);
    g.font = "14px Pixel"; g.fillStyle = "#ffe9a8"; g.fillText(p.binome, 300, 98, 380);
  });
}
function ecranAttente(p) {
  return toile(256, 192, (g, l, h) => {
    g.fillStyle = "#05010d"; g.fillRect(0, 0, l, h);
    g.textAlign = "center";
    g.font = "64px 'Segoe UI Emoji', sans-serif"; g.fillText(p.icone, l / 2, 96);
    g.shadowColor = p.couleur; g.shadowBlur = 8; g.fillStyle = "#fff";
    g.font = "12px Pixel"; g.fillText(p.nom.toUpperCase(), l / 2, 136, 236);
    g.fillStyle = p.disponible ? "#7dff3a" : "#ffc83d";
    g.fillText(p.disponible ? "[E] LANCER" : "BIENTOT", l / 2, 166);
    g.fillStyle = "#0005";
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, l, 1);
  });
}

const bornes = [];
function creerBorne(p, x, z, angle, echelle = 1, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = angle;
  g.scale.setScalar(echelle);
  scene.add(g);
  const couleur = new THREE.Color(p.couleur);
  const vif = couleur.clone().lerp(new THREE.Color("#fff"), 0.25);
  bloc(0.78, 1.75, 0.7, mat("#120c1c"), 0, 0.875, 0, g);
  for (const cote of [-1, 1]) {
    bloc(0.04, 2.0, 0.78, mat(couleur.clone().multiplyScalar(0.5), { emissive: couleur, emissiveIntensity: 0.08 }), cote * 0.41, 1.0, 0, g);
    bloc(0.02, 2.0, 0.02, neon(vif), cote * 0.41, 1.0, 0.4, g);
  }
  const ecran = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.48), new THREE.MeshBasicMaterial({ map: p.numero === 10 ? texJeu : ecranAttente(p), toneMapped: false }));
  ecran.position.set(0, 1.42, 0.41);
  ecran.rotation.x = -0.18;
  g.add(ecran);
  const enTete = bloc(0.8, 0.24, 0.14, mat("#111"), 0, 1.9, 0.3, g);
  const bandeau = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.22), new THREE.MeshBasicMaterial({ map: marquee(p), toneMapped: false }));
  bandeau.position.z = 0.072;
  enTete.add(bandeau);
  const pupitre = bloc(0.78, 0.07, 0.34, mat("#1b1428"), 0, 1.05, 0.48, g);
  pupitre.rotation.x = 0.28;
  bloc(0.03, 0.1, 0.03, neon("#ff3b3b"), -0.2, 1.12, 0.5, g);
  for (const [bx, c] of [[0.08, "#22f5ff"], [0.18, "#ffc83d"], [0.28, "#7dff3a"]]) bloc(0.05, 0.03, 0.05, neon(c), bx, 1.1, 0.48, g);
  bloc(0.12, 0.08, 0.02, neon("#ffc83d"), 0, 0.4, 0.36, g);
  halo(couleur, 0, 2.25, 0.1, 1.2, g);
  g.updateMatrixWorld(true);
  const centre = ecran.getWorldPosition(new THREE.Vector3());
  const normale = ecran.getWorldDirection(new THREE.Vector3());
  const vue = new THREE.PerspectiveCamera();
  vue.position.copy(centre).addScaledVector(normale, 0.44 * echelle);
  vue.lookAt(centre);
  bornes.push({ p, position: new THREE.Vector3(x, y + 1.4, z), vue });
  obstacles.push({ x, z, r: 0.6 * echelle });
}

const autres = projets.filter((p) => p.numero !== 10);
autres.forEach((p, i) => {
  const gauche = i < 5;
  creerBorne(p, gauche ? -7.9 : 7.9, 3 - (gauche ? i : i - 5) * 2.6, gauche ? Math.PI / 2 : -Math.PI / 2);
});
const podium = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.16, 40), NOIR_LAQUE);
podium.position.set(0, 0.08, -10.4);
scene.add(podium);
const anneauPodium = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.025, 8, 60), neon("#ff2bd6"));
anneauPodium.rotation.x = Math.PI / 2;
anneauPodium.position.set(0, 0.15, -10.4);
scene.add(anneauPodium);
creerBorne(projets.find((p) => p.numero === 10), 0, -10.4, 0, 1.15, 0.16);

// ---------- Flux du jeu Python ----------
let etatJeu = null;
new EventSource("/api/flux").onmessage = (m) => {
  etatJeu = JSON.parse(m.data);
  ecranJeu.recevoir(etatJeu);
};
const envoyer = (route, donnees = {}) => fetch(route, { method: "POST", body: JSON.stringify(donnees) }).then((r) => r.json());

// ---------- Contrôles ----------
let mode = "salle", lacet = 0, tangage = 0, cible = null, transition = null, retour = null, pas = 0;
const touches = {}, touchesJeu = { gauche: false, droite: false, tir: false };
const TOUCHES_JEU = { ArrowLeft: "gauche", ArrowRight: "droite", Space: "tir" };
camera.position.set(0, 1.65, 5.5);

$("accueil").onclick = () => rendu.domElement.requestPointerLock();
document.addEventListener("pointerlockchange", () => {
  const verrouille = document.pointerLockElement === rendu.domElement;
  $("accueil").classList.toggle("cache", verrouille || mode !== "salle");
  $("viseur").classList.toggle("cache", !verrouille);
});
addEventListener("mousemove", (e) => {
  if (!document.pointerLockElement || mode !== "salle") return;
  lacet -= e.movementX * 0.0022;
  tangage = Math.max(-1.2, Math.min(1.2, tangage - e.movementY * 0.0022));
});
addEventListener("keydown", (e) => {
  touches[e.code] = true;
  if (mode === "salle" && e.code === "KeyE" && cible && document.pointerLockElement) utiliser(cible);
  if (mode !== "jeu") return;
  if (e.code === "Escape") return sortirDuJeu();
  if (e.code === "KeyP" && etatJeu) envoyer("/api/pause", { pause: etatJeu.statut === "en_cours" });
  changerTouche(e, true);
});
addEventListener("keyup", (e) => {
  touches[e.code] = false;
  if (mode === "jeu") changerTouche(e, false);
});
function changerTouche(e, appuye) {
  const nom = TOUCHES_JEU[e.code];
  if (!nom) return;
  e.preventDefault();
  if (touchesJeu[nom] !== appuye) {
    touchesJeu[nom] = appuye;
    envoyer("/api/touches", touchesJeu);
  }
}

function utiliser(borne) {
  if (borne.p.numero !== 10) {
    envoyer(`/api/lancer/${borne.p.numero}`).then((r) => montrerInfo(r.ok ? "LANCÉ DANS UN TERMINAL" : "BIENTÔT DISPONIBLE"));
    return;
  }
  mode = "transition";
  transition = { de: camera.position.clone(), deQ: camera.quaternion.clone(), vers: borne.vue.position, versQ: borne.vue.quaternion, t: 0, puis: "jeu" };
  retour = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
  document.exitPointerLock();
  $("info").classList.add("cache");
  $("accueil").classList.add("cache");
  $("aide").textContent = "← → BOUGER · ESPACE TIRER · P PAUSE · ÉCHAP SORTIR";
  envoyer("/api/pause", { pause: false });
}
function sortirDuJeu() {
  for (const nom in touchesJeu) touchesJeu[nom] = false;
  envoyer("/api/touches", touchesJeu);
  envoyer("/api/pause", { pause: true });
  mode = "transition";
  transition = { de: camera.position.clone(), deQ: camera.quaternion.clone(), vers: retour.position, versQ: retour.quaternion, t: 0, puis: "salle" };
  $("aide").textContent = "ZQSD BOUGER · SOURIS REGARDER · E JOUER";
}
let minuterieInfo = 0;
function montrerInfo(texte) {
  $("info").textContent = texte;
  minuterieInfo = 2;
}

function deplacer(dt) {
  const avant = (touches.KeyW || touches.ArrowUp ? 1 : 0) - (touches.KeyS || touches.ArrowDown ? 1 : 0);
  const cote = (touches.KeyD || touches.ArrowRight ? 1 : 0) - (touches.KeyA || touches.ArrowLeft ? 1 : 0);
  const vitesse = (touches.ShiftLeft ? 6 : 3.2) * dt;
  const s = Math.sin(lacet), c = Math.cos(lacet), p = camera.position;
  p.x += (-s * avant + c * cote) * vitesse;
  p.z += (-c * avant - s * cote) * vitesse;
  for (const o of obstacles) {
    const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), min = o.r + 0.3;
    if (d < min) { p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min; }
  }
  p.x = Math.max(-8.6, Math.min(8.6, p.x));
  p.z = Math.max(-12.6, Math.min(6.6, p.z));
  pas += (avant || cote ? dt * 9 : 0);
  p.y = 1.65 + Math.sin(pas) * 0.025;
  camera.rotation.set(tangage, lacet, 0);
}

function viser() {
  const regard = camera.getWorldDirection(new THREE.Vector3());
  cible = null;
  for (const b of bornes) {
    const vers = b.position.clone().sub(camera.position);
    if (vers.length() < 2.8 && vers.normalize().dot(regard) > 0.8) cible = b;
  }
  $("viseur").classList.toggle("actif", !!cible);
  if (minuterieInfo > 0) return $("info").classList.remove("cache");
  $("info").classList.toggle("cache", !cible);
  if (cible) $("info").textContent = `[E] ${cible.p.numero === 10 ? "JOUER" : "LANCER"} · ${cible.p.numero} · ${cible.p.nom} · ${cible.p.binome}`;
}

if (location.hash === "#jeu") utiliser(bornes.at(-1));

// ---------- Boucle ----------
let avant = performance.now();
rendu.setAnimationLoop((maintenant) => {
  const dt = Math.min(0.05, (maintenant - avant) / 1000);
  avant = maintenant;
  minuterieInfo -= dt;
  if (mode === "salle") { deplacer(dt); viser(); }
  if (mode === "transition") {
    transition.t = Math.min(1, transition.t + dt / 0.7);
    const k = transition.t * transition.t * (3 - 2 * transition.t);
    camera.position.lerpVectors(transition.de, transition.vers, k);
    camera.quaternion.slerpQuaternions(transition.deQ, transition.versQ, k);
    if (transition.t === 1) {
      mode = transition.puis;
      if (mode === "salle") $("accueil").classList.remove("cache");
    }
  }
  for (const b of boules) b.rotation.y += dt * 0.4;
  anneauPodium.material.color.setHSL(0.88 + Math.sin(maintenant / 900) * 0.05, 1, 0.55);
  ecranJeu.dessiner(maintenant);
  texJeu.needsUpdate = true;
  rendu.render(scene, camera);
});

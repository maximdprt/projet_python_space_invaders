// Salle d'arcade-casino 3D. Le jeu tourne en Python sur le serveur : ici on affiche et on envoie les touches.
// Optimisation : pas de post-traitement, matériaux simples, et toutes les animations de lumière
// sont calculées par la carte graphique (un seul shader, une seule valeur "temps" envoyée par image).
import * as THREE from "three";
import { creerMascotte, animerMascotte } from "./personnage.js";
import { creerJeu } from "./jeu.js";

const $ = (id) => document.getElementById(id);
await document.fonts.load("16px Pixel");
import { EN_LOCAL } from "./moteurs.js";
const projets = await (await fetch("projets.json")).json();

// ---------- Moteur ----------
const QUALITE_MAX = Math.min(devicePixelRatio, 1);
let qualite = QUALITE_MAX;
const rendu = new THREE.WebGLRenderer({ powerPreference: "high-performance" });
rendu.setPixelRatio(qualite);
rendu.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(rendu.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#06020c");
scene.fog = new THREE.Fog("#06020c", 14, 32);
const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 60);
camera.rotation.order = "YXZ";
function redimensionner() {
  camera.aspect = innerWidth / innerHeight;
  // Écran en hauteur (téléphone) : on élargit le champ de vision pour ne pas voir la salle "au zoom".
  camera.fov = Math.min(100, Math.max(65, (2 * Math.atan(Math.tan(0.6545) / camera.aspect) * 180) / Math.PI));
  camera.updateProjectionMatrix();
  rendu.setSize(innerWidth, innerHeight);
}
redimensionner();
addEventListener("resize", redimensionner);

// ---------- Animations de casino, calculées par la carte graphique ----------
// 1 = néon qui respire, 2 = chenillard d'ampoules, 3 = néon qui grésille de temps en temps.
const temps = { value: 0 };
function lumiere(couleur, motif = 0, carte = null) {
  return new THREE.ShaderMaterial({
    uniforms: { temps, couleur: { value: new THREE.Color(couleur) }, carte: { value: carte } },
    defines: carte ? { MOTIF: motif, CARTE: 1 } : { MOTIF: motif },
    transparent: !!carte, depthWrite: !carte, blending: carte ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `
      varying vec2 vUv; varying float vId;
      void main() {
        vUv = uv;
        vId = float(gl_InstanceID) + modelMatrix[3].x * 0.7 + modelMatrix[3].z * 0.37;
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
      }`,
    fragmentShader: `
      uniform float temps; uniform vec3 couleur; uniform sampler2D carte;
      varying vec2 vUv; varying float vId;
      void main() {
        float k = 1.0;
        #if MOTIF == 1
          k = 0.7 + 0.3 * sin(temps * 1.6 + vId);
        #elif MOTIF == 2
          k = mod(floor(vId) - floor(temps * 7.0), 3.0) < 1.0 ? 0.2 : 1.0;
        #elif MOTIF == 3
          k = fract(sin(floor(temps * 10.0) + vId) * 43758.5) > 0.96 ? 0.25 : 1.0;
        #endif
        vec4 c = vec4(couleur * k, 1.0);
        #ifdef CARTE
          c *= texture2D(carte, vUv);
        #endif
        gl_FragColor = c;
        #include <colorspace_fragment>
      }`,
  });
}

// ---------- Petits outils ----------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (couleur, brillance = 30) => new THREE.MeshPhongMaterial({ color: couleur, shininess: brillance });
const OR = new THREE.MeshPhongMaterial({ color: "#c9973a", specular: "#ffe7a8", shininess: 90 });
const LAQUE = new THREE.MeshPhongMaterial({ color: "#0b0712", specular: "#6a5a80", shininess: 120 });
const NOIR = mat("#0a070f");

function toile(l, h, dessin, rx = 1, ry = rx) {
  const c = document.createElement("canvas");
  c.width = l; c.height = h;
  dessin(c.getContext("2d"), l, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}
function ajouter(geometrie, materiau, x, y, z, ry = 0, parent = scene) {
  const m = new THREE.Mesh(geometrie, materiau);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}
const pose = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const obstacles = [];

// Halo lumineux "cuit" dans une texture : remplace le bloom pour un coût quasi nul.
const degrade = toile(4, 64, (g) => {
  const d = g.createLinearGradient(0, 0, 0, 64);
  d.addColorStop(0, "#0000"); d.addColorStop(0.5, "#fff"); d.addColorStop(1, "#0000");
  g.fillStyle = d; g.fillRect(0, 0, 4, 64);
});
function neon(longueur, couleur, x, y, z, ry, motif = 1) {
  ajouter(new THREE.BoxGeometry(longueur, 0.045, 0.045), lumiere(couleur, motif), x, y, z, ry);
  const halo = new THREE.MeshBasicMaterial({ map: degrade, color: couleur, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  ajouter(new THREE.PlaneGeometry(longueur, 0.9), halo, x, y, z, ry).translateZ(0.03);
}
// texte : une chaîne d'une seule couleur, ou une liste de morceaux [texte, couleur] écrits à la suite.
function enseigne(texte, couleur, largeur, x, y, z, ry, motif = 1, taille = 120) {
  const morceaux = Array.isArray(texte) ? texte : [[texte, couleur]];
  const carte = toile(1024, 200, (g, l, h) => {
    g.textBaseline = "middle";
    g.font = `${taille}px Pixel`;
    const total = morceaux.reduce((somme, [t]) => somme + g.measureText(t).width, 0);
    g.font = `${Math.min(taille, (taille * (l - 60)) / total)}px Pixel`;
    let gauche = (l - morceaux.reduce((somme, [t]) => somme + g.measureText(t).width, 0)) / 2;
    for (const [t, c] of morceaux) {
      g.shadowColor = c; g.shadowBlur = 30;
      g.strokeStyle = c; g.lineWidth = 10; g.strokeText(t, gauche, h / 2);
      g.shadowBlur = 0; g.fillStyle = "#fff"; g.fillText(t, gauche, h / 2);
      gauche += g.measureText(t).width;
    }
  });
  return ajouter(new THREE.PlaneGeometry(largeur, largeur / 5.12), lumiere("#fff", motif, carte), x, y, z, ry);
}

// ---------- Architecture ----------
const LX = 8, Z0 = 8, Z1 = -24, HT = 5, PZ = (Z0 + Z1) / 2, PL = Z0 - Z1;
const sol = ajouter(new THREE.PlaneGeometry(2 * LX, PL), new THREE.MeshLambertMaterial({
  map: toile(256, 256, (g) => {
    g.fillStyle = "#1a0a2c"; g.fillRect(0, 0, 256, 256);
    for (const [x, y] of [[0, 0], [256, 0], [0, 256], [256, 256], [128, 128]]) {
      g.strokeStyle = "#c9973a"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 58, 0, 7); g.stroke();
      g.fillStyle = "#3b0f52"; g.beginPath(); g.arc(x, y, 44, 0, 7); g.fill();
      g.fillStyle = "#c42a63"; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill();
    }
    g.fillStyle = "#1a9c98";
    for (const [x, y] of [[128, 0], [0, 128], [256, 128], [128, 256]]) { g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x + 22, y); g.lineTo(x, y + 22); g.lineTo(x - 22, y); g.fill(); }
  }, 8, 16),
}), 0, 0, PZ);
sol.rotation.x = -Math.PI / 2;
const allee = ajouter(new THREE.PlaneGeometry(6.2, PL - 4), new THREE.MeshPhongMaterial({
  shininess: 140, specular: "#4a3a66",
  map: toile(256, 256, (g) => {
    g.fillStyle = "#07050b"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#2a1d3d"; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
    g.strokeStyle = "#ffffff12"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(90, 120, 160, 20, 256, 200); g.stroke();
  }, 3, 13),
}), 0, 0.004, PZ + 2);
allee.rotation.x = -Math.PI / 2;
const tapis = ajouter(new THREE.PlaneGeometry(1.8, 24), new THREE.MeshLambertMaterial({
  map: toile(64, 128, (g) => {
    g.fillStyle = "#7d0b1c"; g.fillRect(0, 0, 64, 128);
    g.fillStyle = "#c9973a"; g.fillRect(3, 0, 3, 128); g.fillRect(58, 0, 3, 128);
    g.fillStyle = "#9c1328"; g.beginPath(); g.moveTo(32, 20); g.lineTo(48, 64); g.lineTo(32, 108); g.lineTo(16, 64); g.fill();
  }, 1, 12),
}), 0, 0.01, -6);
tapis.rotation.x = -Math.PI / 2;

const murs = new THREE.MeshLambertMaterial({
  map: toile(256, 512, (g) => {
    g.fillStyle = "#140b20"; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = "#2b1742"; g.lineWidth = 8; g.strokeRect(24, 40, 208, 432);
    g.strokeStyle = "#c9973a66"; g.lineWidth = 2; g.strokeRect(36, 52, 184, 408);
  }, 12, 1),
});
for (const [l, x, z, ry] of [[PL, -LX, PZ, Math.PI / 2], [PL, LX, PZ, -Math.PI / 2], [2 * LX, 0, Z1, 0], [2 * LX, 0, Z0, Math.PI]])
  ajouter(new THREE.PlaneGeometry(l, HT), murs, x, HT / 2, z, ry);
const plafond = ajouter(new THREE.PlaneGeometry(2 * LX, PL), mat("#08050d"), 0, HT, PZ);
plafond.rotation.x = Math.PI / 2;
for (const x of [-3.2, 3.2]) ajouter(new THREE.BoxGeometry(0.12, 0.1, PL), OR, x, HT - 0.05, PZ);
for (let z = Z0 - 2; z > Z1; z -= 4) ajouter(new THREE.BoxGeometry(6.4, 0.1, 0.12), OR, 0, HT - 0.05, z);

// Néons qui respirent : plinthes, corniches, plafond
for (const [x, c] of [[-LX + 0.05, "#ff2bd6"], [LX - 0.05, "#22f5ff"]]) {
  const ry = x < 0 ? Math.PI / 2 : -Math.PI / 2;
  neon(PL, c, x, 0.15, PZ, ry);
  neon(PL, c, x, HT - 0.3, PZ, ry);
}
neon(2 * LX, "#ffb347", 0, HT - 0.3, Z1 + 0.05, 0);
for (const x of [-3.2, 3.2]) ajouter(new THREE.BoxGeometry(0.04, 0.04, PL - 4), lumiere(x < 0 ? "#ff2bd6" : "#22f5ff", 1), x, HT - 0.14, PZ);

// Colonnes laquées à bagues dorées
for (const x of [-6.4, 6.4]) for (const z of [5, -4, -13]) {
  ajouter(new THREE.CylinderGeometry(0.32, 0.32, HT, 20), LAQUE, x, HT / 2, z);
  for (const y of [0.08, 1.1, HT - 0.5]) ajouter(new THREE.CylinderGeometry(0.37, 0.37, 0.09, 20), OR, x, y, z);
  obstacles.push({ x, z, r: 0.5 });
}

// Banquettes de velours le long des murs, sous les grands symboles de cartes en néon
const VELOURS = mat("#5c0b22", 8);
const symboles = [["♠", "#22f5ff"], ["♥", "#ff2bd6"], ["♦", "#ffb347"], ["♣", "#7dff3a"]];
for (const cote of [-1, 1]) for (let i = 0; i < 4; i++) {
  const z = 1 - i * 6.2, x = cote * (LX - 0.45), ry = -cote * Math.PI / 2;
  ajouter(new THREE.BoxGeometry(2.6, 0.45, 0.6), VELOURS, x, 0.22, z, ry);
  ajouter(new THREE.BoxGeometry(2.6, 0.7, 0.18), VELOURS, cote * (LX - 0.12), 0.75, z, ry);
  ajouter(new THREE.BoxGeometry(2.7, 0.05, 0.65), OR, x, 0.02, z, ry);
  const [s, c] = symboles[(i + (cote > 0 ? 2 : 0)) % 4];
  const carte = toile(256, 256, (g) => {
    g.font = "200px serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = c; g.shadowBlur = 24; g.strokeStyle = c; g.lineWidth = 8; g.strokeText(s, 128, 140);
  });
  ajouter(new THREE.PlaneGeometry(1.5, 1.5), lumiere("#fff", 1, carte), cote * (LX - 0.06), 2.7, z, ry);
  obstacles.push({ x: cote * (LX - 0.4), z: z - 0.9, r: 0.6 }, { x: cote * (LX - 0.4), z: z + 0.9, r: 0.6 });
}
enseigne("JACKPOT", "#ffb347", 4.5, -LX + 0.06, 4.1, -14, Math.PI / 2, 3);
enseigne("777 CASINO", "#ff3b3b", 4.5, LX - 0.06, 4.1, -14, -Math.PI / 2, 3);
enseigne("INSERT COIN", "#7dff3a", 3.6, 0, 3.9, Z0 - 0.06, Math.PI, 1, 90);

// ---------- Bornes d'arcade (profil extrudé partagé par les 10 bornes) ----------
const PROFIL = [[-0.42, 0], [0.32, 0], [0.32, 0.92], [0.52, 1.0], [0.5, 1.08], [0.3, 1.14], [0.18, 1.7], [0.36, 1.78], [0.36, 2.05], [-0.42, 2.05]];
const geoBorne = new THREE.ExtrudeGeometry(new THREE.Shape(PROFIL.map(([z, y]) => new THREE.Vector2(z, y))), { depth: 0.8, bevelEnabled: false })
  .translate(0, 0, -0.4).rotateY(-Math.PI / 2);
const geoContour = new THREE.BufferGeometry().setFromPoints(PROFIL.map(([z, y]) => V3(0, y, z)));
const geoEcran = new THREE.PlaneGeometry(0.66, 0.495);
const jeu = creerJeu();
jeu.canvas.className = "plein cache";
document.body.append(jeu.canvas);
jeu.surQuitter(sortirDuJeu);
$("action").addEventListener("click", (e) => {
  e.preventDefault();
  if (mode === "salle" && cible) utiliser(cible);
});
const texJeu = new THREE.CanvasTexture(jeu.canvas);
texJeu.colorSpace = THREE.SRGBColorSpace;

function marquee(p) {
  return toile(512, 160, (g, l, h) => {
    const d = g.createLinearGradient(0, 0, l, 0);
    d.addColorStop(0, "#0a0414"); d.addColorStop(0.5, p.couleur); d.addColorStop(1, "#0a0414");
    g.fillStyle = d; g.fillRect(0, 0, l, h);
    g.textAlign = "center"; g.shadowColor = "#fff"; g.shadowBlur = 10; g.fillStyle = "#fff";
    g.font = "44px Pixel"; g.fillText(String(p.numero).padStart(2, "0"), 62, 100);
    g.font = "26px Pixel"; g.fillText(p.nom.toUpperCase(), 300, 78, 380);
    g.font = "15px Pixel"; g.fillStyle = "#ffe9a8"; g.fillText(p.binome, 300, 120, 380);
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
    g.fillText(p.disponible ? "[E] LANCER" : "INSERT COIN", l / 2, 166);
    g.fillStyle = "#0005";
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, l, 1);
  });
}

const bornes = [];
function creerBorne(p, x, z, ry, echelle = 1, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  g.scale.setScalar(echelle);
  scene.add(g);
  const couleur = new THREE.Color(p.couleur);
  ajouter(geoBorne, [mat(couleur.clone().multiplyScalar(0.7), 60), LAQUE], 0, 0, 0, 0, g);
  for (const cote of [-0.405, 0.405]) {
    const contour = new THREE.LineLoop(geoContour, new THREE.LineBasicMaterial({ color: couleur.clone().lerp(new THREE.Color("#fff"), 0.4), toneMapped: false }));
    contour.position.x = cote;
    g.add(contour);
  }
  const ecran = ajouter(geoEcran, new THREE.MeshBasicMaterial({ map: p.numero === 10 ? texJeu : ecranAttente(p), toneMapped: false }), 0, 1.425, 0.252, 0, g);
  ecran.rotation.x = -0.211;
  ajouter(new THREE.PlaneGeometry(0.78, 0.25), new THREE.MeshBasicMaterial({ map: marquee(p), toneMapped: false }), 0, 1.915, 0.362, 0, g);
  ajouter(new THREE.SphereGeometry(0.035, 10, 8), mat("#e0202c", 80), -0.2, 1.2, 0.42, 0, g);
  ajouter(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), NOIR, -0.2, 1.15, 0.42, 0, g);
  [["#22f5ff", 0.02], ["#ffc83d", 0.12], ["#7dff3a", 0.22]].forEach(([c, bx]) =>
    ajouter(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }), bx, 1.125, 0.42, 0, g));
  ajouter(new THREE.BoxGeometry(0.8, 0.03, 0.02), lumiere(p.couleur, 1), 0, 0.05, 0.33, 0, g);
  ajouter(new THREE.PlaneGeometry(0.12, 0.09), lumiere("#ff7a1a", 3), 0, 0.55, 0.322, 0, g);
  g.updateMatrixWorld(true);
  const centre = ecran.getWorldPosition(V3());
  const vue = new THREE.PerspectiveCamera();
  vue.position.copy(centre).addScaledVector(ecran.getWorldDirection(V3()), 0.47 * echelle);
  vue.lookAt(centre);
  bornes.push({ p, position: V3(x, y + 1.4 * echelle, z), vue });
  obstacles.push({ x, z, r: 0.6 * echelle });
}
projets.filter((p) => p.numero !== 10).forEach((p, i) => {
  const gauche = i < 5;
  creerBorne(p, gauche ? -4.3 : 4.3, 2.5 - (gauche ? i : i - 5) * 3.3, gauche ? Math.PI / 2 : -Math.PI / 2);
});

// ---------- Scène de la borne 10 : estrade, enseigne, chenillard d'ampoules ----------
ajouter(new THREE.BoxGeometry(6.4, 0.3, 4.4), LAQUE, 0, 0.15, -21.8);
ajouter(new THREE.BoxGeometry(6.4, 0.04, 0.04), lumiere("#ff2bd6", 1), 0, 0.3, -19.6);
creerBorne(projets.find((p) => p.numero === 10), 0, -21.4, 0, 1.2, 0.3);
ajouter(new THREE.BoxGeometry(8.2, 2.1, 0.1), LAQUE, 0, 3.95, Z1 + 0.06);
enseigne([["EUGENI", "#ff2bd6"], ["ARCADE", "#22f5ff"]], null, 7.6, 0, 3.95, Z1 + 0.15, 0, 3);
// Chenillard : ampoules du cadre de l'enseigne, du bord de l'estrade et du lustre (une seule instruction de dessin).
const ampoules = [];
for (let x = -4; x <= 4; x += 0.27) ampoules.push(pose(x, 4.95, Z1 + 0.15));
for (let y = 4.68; y > 2.95; y -= 0.27) ampoules.push(pose(4, y, Z1 + 0.15));
for (let x = 4; x >= -4; x -= 0.27) ampoules.push(pose(x, 2.95, Z1 + 0.15));
for (let y = 3.22; y < 4.95; y += 0.27) ampoules.push(pose(-4, y, Z1 + 0.15));
for (let x = -3.1; x <= 3.1; x += 0.3) ampoules.push(pose(x, 0.36, -19.6));
for (let i = 0; i < 40; i++) ampoules.push(pose(Math.cos((i / 40) * 6.283) * 1.8, HT - 0.3, -6 + Math.sin((i / 40) * 6.283) * 1.8));
const geoAmpoule = new THREE.SphereGeometry(0.045, 8, 6);
const lustre = new THREE.InstancedMesh(geoAmpoule, lumiere("#ffd27a", 2), ampoules.length);
ampoules.forEach((m, i) => lustre.setMatrixAt(i, m));
scene.add(lustre);

// Poteaux et cordons de velours devant l'estrade
for (const x of [-1.2, 1.2]) for (let z = -19; z < -10; z += 2.2) {
  ajouter(new THREE.CylinderGeometry(0.035, 0.13, 0.95, 12), OR, x, 0.47, z);
  ajouter(new THREE.SphereGeometry(0.06, 10, 8), OR, x, 0.97, z);
  if (z < -12) ajouter(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), VELOURS, x, 0.85, z + 1.1).rotation.x = Math.PI / 2;
}

// ---------- Mascottes animées (personnage.js) ----------
// Deux jouent aux bornes, les autres accueillent les visiteurs et font coucou.
const mascottes = [
  ["ziggy", -3.2, -0.8, -Math.PI / 2, true],
  ["nova", 3.2, -4.1, Math.PI / 2, true],
  ["bobby", 2.3, -18.4, -0.4, false],
  ["mochi", -2.3, -18.4, 0.4, false],
  ["pepite", -1.9, 3.2, 0.3, false],
].map(([cle, x, z, ry, joue], i) => {
  const p = creerMascotte(cle);
  p.racine.position.set(x, 0, z);
  p.racine.rotation.y = ry;
  scene.add(p.racine);
  obstacles.push({ x, z, r: 0.45 });
  return { p, joue, decalage: i * 1.7 };
});

// Lumières : 3 seulement, l'ambiance vient des néons
scene.add(new THREE.HemisphereLight("#8f6bff", "#2a0a24", 0.9));
for (const [c, x, z, i] of [["#ff2bd6", -5, -6, 22], ["#22f5ff", 5, -6, 22], ["#ffcf7a", 0, -18.5, 26]]) {
  const l = new THREE.PointLight(c, i, 0, 1.6);
  l.position.set(x, 3.2, z);
  scene.add(l);
}

// ---------- Contrôles ----------
let mode = "salle", lacet = 0, tangage = 0, cible = null, transition = null, retour = null, pas = 0, minuterieInfo = 0;
const touches = {};
camera.position.set(0, 1.65, 6.5);

const TACTILE = matchMedia("(hover: none) and (pointer: coarse)").matches;
let joy = null, look = null;
const AIDE_SALLE = TACTILE ? "POUCE GAUCHE BOUGER · POUCE DROIT REGARDER" : "ZQSD BOUGER · SOURIS REGARDER · E JOUER";
$("aide").textContent = AIDE_SALLE;

function basculerMode(nom) {
  mode = nom;
  document.body.classList.toggle("ensalle", nom === "salle");
  document.body.classList.toggle("enjeu", nom === "jeu");
}
basculerMode("salle");

if (TACTILE) {
  $("accueil").onclick = () => {
    $("accueil").classList.add("cache");
    $("viseur").classList.remove("cache");
    const plein = document.documentElement.requestFullscreen;
    if (plein) plein.call(document.documentElement).catch(() => {});
  };
  const toucher = rendu.domElement;
  toucher.addEventListener("touchstart", (e) => {
    if (mode !== "salle") return;
    for (const t of e.changedTouches) {
      if (t.clientX < innerWidth / 2 && !joy) {
        joy = { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0 };
        // Le joystick apparaît sous le pouce, là où il s'est posé.
        Object.assign($("joystick").style, { left: `${t.clientX - 60}px`, top: `${t.clientY - 60}px`, bottom: "auto" });
        $("joystick").classList.add("actif");
      } else if (!look) {
        look = { id: t.identifier, x: t.clientX, y: t.clientY };
      }
    }
    e.preventDefault();
  }, { passive: false });
  toucher.addEventListener("touchmove", (e) => {
    if (mode !== "salle") return;
    for (const t of e.changedTouches) {
      if (joy && t.identifier === joy.id) {
        const R = 50;
        joy.dx = Math.max(-R, Math.min(R, t.clientX - joy.x0));
        joy.dy = Math.max(-R, Math.min(R, t.clientY - joy.y0));
        $("joystick").style.setProperty("--jx", `calc(50% + ${joy.dx * 0.76}px)`);
        $("joystick").style.setProperty("--jy", `calc(50% + ${joy.dy * 0.76}px)`);
      } else if (look && t.identifier === look.id) {
        const dx = t.clientX - look.x, dy = t.clientY - look.y;
        look.x = t.clientX; look.y = t.clientY;
        lacet -= dx * 0.004;
        tangage = Math.max(-1.2, Math.min(1.2, tangage - dy * 0.004));
      }
    }
    e.preventDefault();
  }, { passive: false });
  const relacher = (e) => {
    for (const t of e.changedTouches) {
      if (joy && t.identifier === joy.id) {
        joy = null;
        $("joystick").removeAttribute("style");
        $("joystick").classList.remove("actif");
      } else if (look && t.identifier === look.id) look = null;
    }
  };
  toucher.addEventListener("touchend", relacher);
  toucher.addEventListener("touchcancel", relacher);
} else {
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
}
addEventListener("keydown", (e) => {
  touches[e.code] = true;
  if (mode === "salle" && e.code === "KeyE" && cible && (TACTILE || document.pointerLockElement)) utiliser(cible);
});
addEventListener("keyup", (e) => (touches[e.code] = false));

function utiliser(borne) {
  if (borne.p.numero !== 10) {
    if (!EN_LOCAL) return montrerInfo("À LANCER EN LOCAL (python main.py)");
    fetch(`/api/lancer/${borne.p.numero}`, { method: "POST" }).then((r) => r.json())
      .then((r) => montrerInfo(r.ok ? "LANCÉ DANS UN TERMINAL" : "BIENTÔT DISPONIBLE"));
    return;
  }
  basculerMode("transition");
  retour = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
  transition = { de: retour.position, deQ: retour.quaternion, vers: borne.vue.position, versQ: borne.vue.quaternion, t: 0, puis: "jeu" };
  if (!TACTILE) document.exitPointerLock();
  $("info").classList.add("cache");
  $("accueil").classList.add("cache");
  $("aide").textContent = "← → BOUGER · ESPACE TIRER · P PAUSE · ÉCHAP SORTIR";
}
function sortirDuJeu() {
  jeu.activer(false);
  jeu.canvas.classList.add("cache");
  basculerMode("transition");
  transition = { de: camera.position.clone(), deQ: camera.quaternion.clone(), vers: retour.position, versQ: retour.quaternion, t: 0, puis: "salle" };
  $("aide").textContent = AIDE_SALLE;
}
function montrerInfo(texte) {
  $("info").textContent = texte;
  minuterieInfo = 2;
}

function deplacer(dt) {
  let avant = (touches.KeyW || touches.ArrowUp ? 1 : 0) - (touches.KeyS || touches.ArrowDown ? 1 : 0);
  let cote = (touches.KeyD || touches.ArrowRight ? 1 : 0) - (touches.KeyA || touches.ArrowLeft ? 1 : 0);
  if (joy) { avant = -joy.dy / 50; cote = joy.dx / 50; }
  const vitesse = (touches.ShiftLeft ? 6 : 3.2) * dt;
  const s = Math.sin(lacet), c = Math.cos(lacet), p = camera.position;
  p.x += (-s * avant + c * cote) * vitesse;
  p.z += (-c * avant - s * cote) * vitesse;
  for (const o of obstacles) {
    const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), min = o.r + 0.3;
    if (d < min) { p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min; }
  }
  p.x = Math.max(-LX + 0.6, Math.min(LX - 0.6, p.x));
  p.z = Math.max(Z1 + 0.6, Math.min(Z0 - 0.6, p.z));
  if (Math.abs(p.x) < 3.5 && p.z < -19.3) p.z = -19.3;
  pas += avant || cote ? dt * 9 : 0;
  p.y = 1.65 + Math.sin(pas) * 0.025;
  camera.rotation.set(tangage, lacet, 0);
}

function viser() {
  cible = null;
  let meilleure = 2.2;
  for (const b of bornes) {
    const d = b.position.distanceTo(camera.position);
    if (d < meilleure) { cible = b; meilleure = d; }
  }
  $("viseur").classList.toggle("actif", !!cible);
  document.body.classList.toggle("cible", !!cible && mode === "salle");
  if (cible) $("action").textContent = cible.p.numero === 10 ? "JOUER" : "LANCER";
  if (minuterieInfo > 0) return $("info").classList.remove("cache");
  $("info").classList.toggle("cache", !cible);
  if (cible) $("info").textContent = `${TACTILE ? "" : "[E] "}${cible.p.numero === 10 ? "JOUER" : "LANCER"} · ${cible.p.numero} · ${cible.p.nom} · ${cible.p.binome}`;
}

if (location.hash === "#jeu") utiliser(bornes.at(-1));

// ---------- Boucle ----------
let avant = performance.now();
rendu.setAnimationLoop((maintenant) => {
  const dt = Math.min(0.05, (maintenant - avant) / 1000);
  avant = maintenant;
  minuterieInfo -= dt;
  temps.value = maintenant / 1000;
  if (mode === "salle") { deplacer(dt); viser(); }
  if (mode === "transition") {
    transition.t = Math.min(1, transition.t + dt / 0.7);
    const k = transition.t * transition.t * (3 - 2 * transition.t);
    camera.position.lerpVectors(transition.de, transition.vers, k);
    camera.quaternion.slerpQuaternions(transition.deQ, transition.versQ, k);
    if (transition.t === 1) {
      basculerMode(transition.puis);
      if (mode === "salle" && !TACTILE) $("accueil").classList.remove("cache");
      if (mode === "jeu") { jeu.canvas.classList.remove("cache"); jeu.activer(true); }
    }
  }
  // Pendant la partie, la 3D est figée : seul le jeu 2D est dessiné.
  if (mode === "jeu") return jeu.dessiner(maintenant);
  for (const m of mascottes) animerMascotte(m.p, temps.value, m.decalage, m.joue);
  // Dans la salle, l'écran de la borne 10 n'est rafraîchi qu'environ 12 fois par seconde.
  if (maintenant - dernierEcran > 80) {
    dernierEcran = maintenant;
    jeu.dessiner(maintenant);
    texJeu.needsUpdate = true;
  }
  ajusterQualite(maintenant);
  rendu.render(scene, camera);
});

// Si le PC rame, on baisse la résolution du rendu 3D (et on la remonte s'il est à l'aise).
let dernierEcran = 0, images = 0, debutMesure = performance.now();
function ajusterQualite(maintenant) {
  images++;
  if (maintenant - debutMesure < 2000) return;
  const fps = (images * 1000) / (maintenant - debutMesure);
  images = 0;
  debutMesure = maintenant;
  const nouvelle = fps < 40 ? Math.max(0.5, qualite - 0.15) : fps > 57 ? Math.min(QUALITE_MAX, qualite + 0.1) : qualite;
  if (nouvelle !== qualite) rendu.setPixelRatio((qualite = nouvelle));
}

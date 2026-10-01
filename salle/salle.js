// Salle d'arcade-casino 3D. Le jeu tourne en Python sur le serveur : ici on affiche et on envoie les touches.
import * as THREE from "three";
import { EffectComposer } from "./lib/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./lib/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./lib/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "./lib/addons/environments/RoomEnvironment.js";
import { creerEcranJeu } from "./jeu.js";

const $ = (id) => document.getElementById(id);
await document.fonts.load("16px Pixel");
const projets = await (await fetch("/api/projets")).json();

// ---------- Moteur : rendu HDR + bloom (les néons brillent vraiment) ----------
const rendu = new THREE.WebGLRenderer({ powerPreference: "high-performance" });
rendu.setPixelRatio(Math.min(devicePixelRatio, 1.25));
rendu.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(rendu.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#06020c");
scene.fog = new THREE.FogExp2("#0a0414", 0.022);
scene.environment = new THREE.PMREMGenerator(rendu).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.04;
const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 80);
camera.rotation.order = "YXZ";
const composeur = new EffectComposer(rendu, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composeur.setPixelRatio(rendu.getPixelRatio());
composeur.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.4, 1);
composeur.addPass(bloom);
composeur.addPass(new OutputPass());
function redimensionner() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  rendu.setSize(innerWidth, innerHeight);
  composeur.setSize(innerWidth, innerHeight);
}
redimensionner();
addEventListener("resize", redimensionner);

// ---------- Petits outils ----------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const HDR = (couleur, force = 3) => new THREE.Color(couleur).multiplyScalar(force);
const neon = (couleur, force = 3) => new THREE.MeshBasicMaterial({ color: HDR(couleur, force) });
const brillant = (couleur, rugosite = 0.3, metal = 0.1) => new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: metal });
const OR = brillant("#d6a84c", 0.25, 1);
const LAQUE = brillant("#0b0712", 0.12, 0.2);
const NOIR = brillant("#09060e", 0.6);

function toile(l, h, dessin, rx = 1, ry = rx) {
  const c = document.createElement("canvas");
  c.width = l; c.height = h;
  dessin(c.getContext("2d"), l, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
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
const pose = (x, y, z, ry = 0, rx = 0) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0)), V3(1, 1, 1));
// Une seule instruction de dessin pour toutes les copies d'un objet (machines à sous, ampoules...).
function instances(geometrie, materiau, bases, local = pose(0, 0, 0)) {
  const m = new THREE.InstancedMesh(geometrie, materiau, bases.length);
  bases.forEach((b, i) => m.setMatrixAt(i, b.clone().multiply(local)));
  scene.add(m);
  return m;
}
function enseigne(texte, couleur, largeur, x, y, z, ry, taille = 120, force = 1.4) {
  const t = toile(1024, 200, (g, l, h) => {
    g.font = `${taille}px Pixel`; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = couleur; g.shadowBlur = 25;
    g.strokeStyle = couleur; g.lineWidth = 10; g.strokeText(texte, l / 2, h / 2, l - 40);
    g.fillStyle = "#fff"; g.fillText(texte, l / 2, h / 2, l - 40);
  });
  const mat = new THREE.MeshBasicMaterial({ map: t, color: HDR("#fff", force), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  return ajouter(new THREE.PlaneGeometry(largeur, largeur / 5.12), mat, x, y, z, ry);
}
const obstacles = [];

// ---------- Architecture : moquette de casino, allée en marbre, murs, plafond à caissons ----------
const LX = 13, Z0 = 8, Z1 = -24, HT = 5.5, PZ = (Z0 + Z1) / 2, PL = Z0 - Z1;
const sol = ajouter(new THREE.PlaneGeometry(2 * LX, PL), brillant("#fff", 0.9), 0, 0, PZ);
sol.rotation.x = -Math.PI / 2;
sol.material.map = toile(256, 256, (g) => {
  g.fillStyle = "#1a0a2c"; g.fillRect(0, 0, 256, 256);
  for (const [x, y] of [[0, 0], [256, 0], [0, 256], [256, 256], [128, 128]]) {
    g.strokeStyle = "#d6a84c"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 58, 0, 7); g.stroke();
    g.fillStyle = "#3b0f52"; g.beginPath(); g.arc(x, y, 44, 0, 7); g.fill();
    g.fillStyle = "#e0306f"; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill();
  }
  g.fillStyle = "#1fb5b0";
  for (const [x, y] of [[128, 0], [0, 128], [256, 128], [128, 256]]) { g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x + 22, y); g.lineTo(x, y + 22); g.lineTo(x - 22, y); g.fill(); }
}, 10, 12);
const allee = ajouter(new THREE.PlaneGeometry(6.4, PL - 4), brillant("#fff", 0.14, 0.1), 0, 0.004, PZ + 2);
allee.rotation.x = -Math.PI / 2;
allee.material.map = toile(256, 256, (g) => {
  g.fillStyle = "#07050b"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#2a1d3d"; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
  g.strokeStyle = "#ffffff10"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(90, 120, 160, 20, 256, 200); g.stroke();
}, 3, 13);
const tapis = ajouter(new THREE.PlaneGeometry(1.8, 24), new THREE.MeshStandardMaterial({ roughness: 0.95 }), 0, 0.01, -6);
tapis.rotation.x = -Math.PI / 2;
tapis.material.map = toile(64, 128, (g) => {
  g.fillStyle = "#7d0b1c"; g.fillRect(0, 0, 64, 128);
  g.fillStyle = "#d6a84c"; g.fillRect(3, 0, 3, 128); g.fillRect(58, 0, 3, 128);
  g.fillStyle = "#9c1328"; g.beginPath(); g.moveTo(32, 20); g.lineTo(48, 64); g.lineTo(32, 108); g.lineTo(16, 64); g.fill();
}, 1, 12);

const murs = brillant("#fff", 0.55);
murs.map = toile(256, 512, (g) => {
  g.fillStyle = "#120a1d"; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "#2b1742"; g.lineWidth = 8; g.strokeRect(24, 40, 208, 432);
  g.strokeStyle = "#d6a84c55"; g.lineWidth = 2; g.strokeRect(36, 52, 184, 408);
}, 12, 1);
for (const [l, x, z, ry] of [[PL, -LX, PZ, Math.PI / 2], [PL, LX, PZ, -Math.PI / 2], [2 * LX, 0, Z1, 0], [2 * LX, 0, Z0, Math.PI]])
  ajouter(new THREE.PlaneGeometry(l, HT), murs, x, HT / 2, z, ry);
const plafond = ajouter(new THREE.PlaneGeometry(2 * LX, PL), brillant("#07040b", 0.8), 0, HT, PZ);
plafond.rotation.x = Math.PI / 2;
for (let x = -9; x <= 9; x += 4.5) ajouter(new THREE.BoxGeometry(0.12, 0.1, PL), OR, x, HT - 0.05, PZ);
for (let z = Z0 - 2; z > Z1; z -= 5) ajouter(new THREE.BoxGeometry(2 * LX, 0.1, 0.12), OR, 0, HT - 0.05, z);
// Néons de corniche et de plinthe
for (const [x, c] of [[-LX + 0.03, "#ff2bd6"], [LX - 0.03, "#22f5ff"]])
  for (const y of [0.12, HT - 0.35]) ajouter(new THREE.BoxGeometry(0.04, 0.05, PL), neon(c), x, y, PZ);
ajouter(new THREE.BoxGeometry(2 * LX, 0.05, 0.04), neon("#ffc06a"), 0, HT - 0.35, Z1 + 0.03);

// Colonnes laquées à bagues dorées
const colonnes = [];
for (const x of [-7.4, 7.4]) for (const z of [5, -6.5, -17]) { colonnes.push(pose(x, 0, z)); obstacles.push({ x, z, r: 0.55 }); }
instances(new THREE.CylinderGeometry(0.35, 0.35, HT, 24), LAQUE, colonnes, pose(0, HT / 2, 0));
for (const y of [0.1, 1.2, HT - 0.6]) instances(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24), OR, colonnes, pose(0, y, 0));
instances(new THREE.BoxGeometry(0.05, 3, 0.05), neon("#ff2bd6", 2.5), colonnes, pose(0, 2.6, 0.36));

// ---------- Machines à sous le long des murs (instanciées) ----------
const rouleaux = toile(128, 512, (g) => {
  g.fillStyle = "#fff8e6"; g.fillRect(0, 0, 128, 512);
  g.textAlign = "center"; g.textBaseline = "middle";
  ["7", "🍒", "BAR", "💎", "🔔", "🍋"].forEach((s, i) => {
    g.font = s === "7" || s === "BAR" ? "bold 44px Pixel" : "54px 'Segoe UI Emoji'";
    g.fillStyle = s === "7" ? "#e0102f" : "#1a1a1a";
    g.fillText(s, 64, 42 + i * 85);
  });
}, 3, 0.45);
const fronton = toile(256, 128, (g) => {
  const d = g.createLinearGradient(0, 0, 0, 128); d.addColorStop(0, "#4a0b6b"); d.addColorStop(1, "#13021f");
  g.fillStyle = d; g.fillRect(0, 0, 256, 128);
  g.textAlign = "center"; g.font = "38px Pixel"; g.fillStyle = "#ffd84a"; g.shadowColor = "#ff8a00"; g.shadowBlur = 14;
  g.fillText("777", 128, 62); g.font = "16px Pixel"; g.fillStyle = "#fff"; g.fillText("JACKPOT", 128, 100);
});
const machines = [];
for (const [x, ry] of [[-LX + 0.55, Math.PI / 2], [LX - 0.55, -Math.PI / 2]])
  for (let z = 5.5; z > -17.5; z -= 1.05) machines.push(pose(x, 0, z, ry));
const teintes = ["#7a0f2a", "#3b1470", "#0f4a6e", "#6e4a0f"];
const corps = instances(new THREE.BoxGeometry(0.78, 1.2, 0.66), brillant("#fff", 0.25, 0.4), machines, pose(0, 0.6, 0));
const tetes = instances(new THREE.BoxGeometry(0.78, 0.62, 0.5), brillant("#fff", 0.25, 0.4), machines, pose(0, 1.52, -0.08));
machines.forEach((m, i) => { corps.setColorAt(i, new THREE.Color(teintes[i % 4])); tetes.setColorAt(i, new THREE.Color(teintes[(i + 1) % 4])); });
instances(new THREE.PlaneGeometry(0.56, 0.3), new THREE.MeshBasicMaterial({ map: rouleaux, color: HDR("#fff", 0.75) }), machines, pose(0, 1.0, 0.335));
instances(new THREE.PlaneGeometry(0.66, 0.46), new THREE.MeshBasicMaterial({ map: fronton, color: HDR("#fff", 1.2) }), machines, pose(0, 1.52, 0.175));
instances(new THREE.BoxGeometry(0.8, 0.025, 0.025), neon("#ffc06a", 3), machines, pose(0, 1.2, 0.34));
const gyros = instances(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial(), machines, pose(0, 1.92, 0));
instances(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 16), brillant("#8a0f22", 0.5), machines, pose(0, 0.68, 0.85));
instances(new THREE.CylinderGeometry(0.035, 0.05, 0.66, 8), OR, machines, pose(0, 0.33, 0.85));

// ---------- Tables de jeu : blackjack et roulette, sous des lampes suspendues ----------
const ABAT_JOUR = brillant("#d6a84c", 0.25, 1);
ABAT_JOUR.side = THREE.DoubleSide;
const BOIS = brillant("#3a1a0c", 0.4);
function feutre(dessin) {
  const map = toile(512, 512, (g, l, h) => { g.fillStyle = "#0b5a35"; g.fillRect(0, 0, l, h); dessin(g, l, h); });
  return new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: "#fff", emissiveIntensity: 0.5, roughness: 1 });
}
function lampe(x, z) {
  ajouter(new THREE.CylinderGeometry(0.3, 0.55, 0.35, 24, 1, true), ABAT_JOUR, x, HT - 1.6, z);
  ajouter(new THREE.CircleGeometry(0.5, 24), neon("#ffd9a0", 2.5), x, HT - 1.76, z).rotation.x = Math.PI / 2;
  ajouter(new THREE.CylinderGeometry(0.01, 0.01, 1.4, 4), NOIR, x, HT - 0.7, z);
}
function blackjack(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  ajouter(new THREE.CylinderGeometry(1.3, 1.3, 0.08, 40, 1, false, -Math.PI / 2, Math.PI), feutre((c) => {
    c.strokeStyle = "#d6a84c"; c.lineWidth = 4; c.beginPath(); c.arc(256, 256, 200, 0, 7); c.stroke();
    c.font = "18px Pixel"; c.fillStyle = "#f3d27a"; c.textAlign = "center"; c.fillText("BLACKJACK", 256, 330);
  }), 0, 0.8, 0, 0, g);
  ajouter(new THREE.TorusGeometry(1.3, 0.07, 8, 40, Math.PI), BOIS, 0, 0.84, 0, 0, g).rotation.x = Math.PI / 2;
  ajouter(new THREE.CylinderGeometry(0.4, 0.55, 0.8, 16), NOIR, 0, 0.4, 0.3, 0, g);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i + 0.5) * (Math.PI / 5);
    ajouter(new THREE.PlaneGeometry(0.12, 0.17), new THREE.MeshBasicMaterial({ color: "#f4f4f4" }), Math.sin(a) * 0.95, 0.85, Math.cos(a) * 0.95, 0, g).rotation.x = -Math.PI / 2;
    ajouter(new THREE.CylinderGeometry(0.06, 0.06, 0.09, 12), brillant(["#d61c2c", "#1c4fd6", "#111", "#18a050", "#d6a84c"][i], 0.3), Math.sin(a) * 0.7, 0.89, Math.cos(a) * 0.7, 0, g);
  }
  obstacles.push({ x, z, r: 1.6 });
  lampe(x, z);
}
const roues = [];
function roulette(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  ajouter(new THREE.BoxGeometry(1.4, 0.08, 2.6), feutre((c) => {
    for (let i = 0; i < 36; i++) {
      c.fillStyle = (i * 7) % 3 === 0 ? "#b0102a" : "#111";
      c.fillRect(140 + (i % 3) * 80, 160 + Math.floor(i / 3) * 28, 76, 25);
    }
  }), 0, 0.8, 0, 0, g);
  ajouter(new THREE.BoxGeometry(1.5, 0.12, 2.7), BOIS, 0, 0.72, 0, 0, g);
  ajouter(new THREE.CylinderGeometry(0.5, 0.6, 0.72, 16), NOIR, 0, 0.36, 0, 0, g);
  const roue = ajouter(new THREE.CylinderGeometry(0.42, 0.46, 0.1, 37), brillant("#fff", 0.3), 0, 0.9, -0.85, 0, g);
  roue.material.map = toile(256, 256, (c) => {
    for (let i = 0; i < 37; i++) {
      c.fillStyle = i === 0 ? "#0b7a3a" : i % 2 ? "#b0102a" : "#111";
      c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 128, (i * 2 * Math.PI) / 37, ((i + 1) * 2 * Math.PI) / 37); c.fill();
    }
    c.fillStyle = "#5a2c10"; c.beginPath(); c.arc(128, 128, 60, 0, 7); c.fill();
  });
  ajouter(new THREE.ConeGeometry(0.1, 0.16, 12), OR, 0, 0.12, 0, 0, roue);
  roues.push(roue);
  obstacles.push({ x, z: z + 0.7, r: 1.1 }, { x, z: z - 0.7, r: 1.1 });
  lampe(x, z);
}
blackjack(-9.6, -1.5, Math.PI / 2);
roulette(-9.6, -11);
roulette(9.6, -1.5);
blackjack(9.6, -11, -Math.PI / 2);

// ---------- Bornes d'arcade (vrai profil extrudé, partagé par les 10 bornes) ----------
const PROFIL = [[-0.42, 0], [0.32, 0], [0.32, 0.92], [0.52, 1.0], [0.5, 1.08], [0.3, 1.14], [0.18, 1.7], [0.36, 1.78], [0.36, 2.05], [-0.42, 2.05]];
const geoBorne = new THREE.ExtrudeGeometry(new THREE.Shape(PROFIL.map(([z, y]) => new THREE.Vector2(z, y))), { depth: 0.8, bevelEnabled: false })
  .translate(0, 0, -0.4).rotateY(-Math.PI / 2);
const geoContour = new THREE.BufferGeometry().setFromPoints(PROFIL.map(([z, y]) => V3(0, y, z)));
const geoEcran = new THREE.PlaneGeometry(0.66, 0.495);
const ecranJeu = creerEcranJeu();
const texJeu = new THREE.CanvasTexture(ecranJeu.canvas);
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
  ajouter(geoBorne, [brillant(couleur.clone().multiplyScalar(0.6), 0.2, 0.3), LAQUE], 0, 0, 0, 0, g);
  for (const cote of [-0.405, 0.405]) {
    const contour = new THREE.LineLoop(geoContour, new THREE.LineBasicMaterial({ color: HDR(couleur.clone().lerp(new THREE.Color("#fff"), 0.3), 2.5) }));
    contour.position.x = cote;
    g.add(contour);
  }
  const ecran = ajouter(geoEcran, new THREE.MeshBasicMaterial({ map: p.numero === 10 ? texJeu : ecranAttente(p), color: HDR("#fff", 1.15) }), 0, 1.425, 0.252, 0, g);
  ecran.rotation.x = -0.211;
  ajouter(new THREE.PlaneGeometry(0.78, 0.25), new THREE.MeshBasicMaterial({ map: marquee(p), color: HDR("#fff", 1.15) }), 0, 1.915, 0.362, 0, g);
  ajouter(new THREE.SphereGeometry(0.035, 10, 8), neon("#ff3b3b", 2), -0.2, 1.2, 0.42, 0, g);
  ajouter(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), NOIR, -0.2, 1.15, 0.42, 0, g);
  [["#22f5ff", 0.02], ["#ffc83d", 0.12], ["#7dff3a", 0.22]].forEach(([c, bx]) => ajouter(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), neon(c, 2), bx, 1.125, 0.42, 0, g));
  ajouter(new THREE.BoxGeometry(0.8, 0.03, 0.02), neon(p.couleur, 3), 0, 0.05, 0.33, 0, g);
  for (const cx of [-0.07, 0.07]) ajouter(new THREE.PlaneGeometry(0.05, 0.09), neon("#ff7a1a", 3), cx, 0.55, 0.322, 0, g);
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
  creerBorne(p, gauche ? -4.6 : 4.6, 2.5 - (gauche ? i : i - 5) * 3.3, gauche ? Math.PI / 2 : -Math.PI / 2);
});

// ---------- Scène de la borne 10 : estrade, enseigne, guirlandes d'ampoules, faisceaux ----------
ajouter(new THREE.BoxGeometry(7, 0.3, 4.6), LAQUE, 0, 0.15, -21.5);
ajouter(new THREE.BoxGeometry(7, 0.04, 0.04), neon("#ff2bd6", 4), 0, 0.3, -19.2);
creerBorne(projets.find((p) => p.numero === 10), 0, -21, 0, 1.2, 0.3);
ajouter(new THREE.BoxGeometry(8.6, 2.3, 0.1), LAQUE, 0, 3.95, Z1 + 0.06);
enseigne("EUGENIA", "#ff2bd6", 5.4, 0, 4.4, Z1 + 0.15, 0, 120, 1.1);
enseigne("ARCADE", "#22f5ff", 4.4, 0, 3.4, Z1 + 0.15, 0, 120, 1.1);
enseigne("JACKPOT", "#ffc83d", 5, -LX + 0.06, 3.9, -6, Math.PI / 2, 120, 0.9);
enseigne("777 CASINO", "#ff3b3b", 5, LX - 0.06, 3.9, -6, -Math.PI / 2, 120, 0.9);
enseigne("INSERT COIN", "#7dff3a", 4, 0, 4.2, Z0 - 0.06, Math.PI, 90, 1);
const faisceaux = [];
for (const cote of [-1, 1]) {
  const haut = V3(cote * 3, HT, -20.2), bas = V3(0, 0.3, -21);
  const faisceau = new THREE.Mesh(new THREE.ConeGeometry(1.1, haut.distanceTo(bas), 24, 1, true),
    new THREE.MeshBasicMaterial({ color: "#ffcf8a", transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  faisceau.position.copy(haut).add(bas).multiplyScalar(0.5);
  faisceau.quaternion.setFromUnitVectors(V3(0, 1, 0), haut.clone().sub(bas).normalize());
  scene.add(faisceau);
  faisceaux.push(faisceau);
}
const positionsAmpoules = [];
for (let x = -4.2; x <= 4.2; x += 0.28) positionsAmpoules.push(pose(x, 5.0, Z1 + 0.15), pose(x, 2.9, Z1 + 0.15));
for (let y = 3.18; y < 5.0; y += 0.28) positionsAmpoules.push(pose(-4.2, y, Z1 + 0.15), pose(4.2, y, Z1 + 0.15));
for (let x = -3.4; x <= 3.4; x += 0.3) positionsAmpoules.push(pose(x, 0.36, -19.2));
for (let i = 0; i < 48; i++) positionsAmpoules.push(pose(Math.cos((i / 48) * 6.283) * 2.2, HT - 0.25, -5 + Math.sin((i / 48) * 6.283) * 2.2));
const ampoules = instances(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial(), positionsAmpoules);
const boule = ajouter(new THREE.IcosahedronGeometry(0.45, 2), new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.05, flatShading: true }), 0, HT - 0.9, -5);

// Poteaux et cordons de velours devant l'estrade
const poteaux = [];
for (const x of [-1.2, 1.2]) for (let z = -18.6; z < -10; z += 2.2) poteaux.push(pose(x, 0, z));
instances(new THREE.CylinderGeometry(0.035, 0.13, 0.95, 12), OR, poteaux, pose(0, 0.47, 0));
instances(new THREE.SphereGeometry(0.06, 10, 8), OR, poteaux, pose(0, 0.97, 0));
instances(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), brillant("#b0102a", 0.6), poteaux.filter((p, i) => i % 4 !== 3), pose(0, 0.85, 1.1, 0, Math.PI / 2));

// Lumières : peu nombreuses, l'ambiance vient des néons + bloom
scene.add(new THREE.HemisphereLight("#8f6bff", "#2a0a24", 0.35));
for (const [c, x, y, z, i] of [["#ff2bd6", -8, 3, -6, 22], ["#22f5ff", 8, 3, -6, 22], ["#ffcf7a", 0, 3.4, -18, 26], ["#ffcf7a", 0, 3.2, 2, 14]]) {
  const l = new THREE.PointLight(c, i, 0, 2);
  l.position.set(x, y, z);
  scene.add(l);
}

// ---------- Flux du jeu Python ----------
let etatJeu = null;
new EventSource("/api/flux").onmessage = (m) => {
  etatJeu = JSON.parse(m.data);
  ecranJeu.recevoir(etatJeu);
};
const envoyer = (route, donnees = {}) => fetch(route, { method: "POST", body: JSON.stringify(donnees) }).then((r) => r.json());

// ---------- Contrôles ----------
let mode = "salle", lacet = 0, tangage = 0, cible = null, transition = null, retour = null, pas = 0, minuterieInfo = 0;
const touches = {}, touchesJeu = { gauche: false, droite: false, tir: false };
const TOUCHES_JEU = { ArrowLeft: "gauche", ArrowRight: "droite", Space: "tir" };
camera.position.set(0, 1.65, 6.5);

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
  if (e.code === "KeyF") bloom.enabled = !bloom.enabled;
  if (mode === "salle" && e.code === "KeyE" && cible && document.pointerLockElement) utiliser(cible);
  if (mode !== "jeu") return;
  if (e.code === "Escape") return sortirDuJeu();
  if (e.code === "KeyP" && etatJeu) envoyer("/api/pause", { pause: !etatJeu.pause });
  changerTouche(e, true);
});
addEventListener("blur", () => {
  for (const nom in touchesJeu) touchesJeu[nom] = false;
  if (mode === "jeu") envoyer("/api/touches", touchesJeu);
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
  retour = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
  transition = { de: retour.position, deQ: retour.quaternion, vers: borne.vue.position, versQ: borne.vue.quaternion, t: 0, puis: "jeu" };
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
  $("aide").textContent = "ZQSD BOUGER · SOURIS REGARDER · E JOUER · F EFFETS";
}
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
  p.x = Math.max(-LX + 1.4, Math.min(LX - 1.4, p.x));
  p.z = Math.max(Z1 + 0.6, Math.min(Z0 - 0.6, p.z));
  if (Math.abs(p.x) < 3.8 && p.z < -18.9) p.z = -18.9;
  pas += avant || cote ? dt * 9 : 0;
  p.y = 1.65 + Math.sin(pas) * 0.025;
  camera.rotation.set(tangage, lacet, 0);
}

function viser() {
  const regard = camera.getWorldDirection(V3());
  cible = null;
  for (const b of bornes) {
    const vers = b.position.clone().sub(camera.position);
    if (vers.length() < 3 && vers.normalize().dot(regard) > 0.8) cible = b;
  }
  $("viseur").classList.toggle("actif", !!cible);
  if (minuterieInfo > 0) return $("info").classList.remove("cache");
  $("info").classList.toggle("cache", !cible);
  if (cible) $("info").textContent = `[E] ${cible.p.numero === 10 ? "JOUER" : "LANCER"} · ${cible.p.numero} · ${cible.p.nom} · ${cible.p.binome}`;
}

if (location.hash === "#jeu") utiliser(bornes.at(-1));

// ---------- Boucle ----------
const couleur = new THREE.Color(), CHAUD = HDR("#ffcf7a", 4), TIEDE = HDR("#ffcf7a", 0.25), GYROS = ["#ff2030", "#ffc83d", "#22f5ff", "#ff2bd6"];
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
  bloom.strength += ((mode === "jeu" ? 0.15 : 0.7) - bloom.strength) * 0.1;
  for (const f of faisceaux) f.visible = mode === "salle";
  const tic = Math.floor(maintenant / 120);
  for (let i = 0; i < ampoules.count; i++) ampoules.setColorAt(i, (i + tic) % 3 ? CHAUD : TIEDE);
  ampoules.instanceColor.needsUpdate = true;
  for (let i = 0; i < gyros.count; i++) gyros.setColorAt(i, couleur.set(GYROS[i % 4]).multiplyScalar((i + tic) % 6 < 2 ? 4 : 0.4));
  gyros.instanceColor.needsUpdate = true;
  rouleaux.offset.y = (maintenant / 900) % 1;
  for (const r of roues) r.rotation.y += dt * 1.5;
  boule.rotation.y += dt * 0.5;
  ecranJeu.dessiner(maintenant);
  texJeu.needsUpdate = true;
  composeur.render();
});

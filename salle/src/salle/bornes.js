// Fabrique de bornes d'arcade procédurales : caisson extrudé, marquee, écran, panneau de contrôle.
import * as THREE from "three";
import { textureCanvas } from "./textures.js";

// Profil latéral d'une borne (x = profondeur vers l'avant, y = hauteur), en mètres.
const PROFIL = [
  [-0.72, 0], [0.04, 0], [0.04, 0.84], [0.24, 0.94], [0.24, 0.99], [0.0, 1.08],
  [-0.05, 1.12], [-0.13, 1.64], [0.03, 1.7], [0.03, 1.96], [-0.72, 1.96],
];
const LARGEUR = 0.74;
const ECRAN = { y: 1.38, z: -0.08, inclinaison: -Math.atan2(0.08, 0.52), largeur: 0.6, hauteur: 0.45 };

function assombrir(hex, facteur) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(facteur);
  return c;
}

function geometrieCaisson() {
  const forme = new THREE.Shape();
  PROFIL.forEach(([x, y], i) => (i === 0 ? forme.moveTo(x, y) : forme.lineTo(x, y)));
  const geo = new THREE.ExtrudeGeometry(forme, {
    depth: LARGEUR,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(LARGEUR / 2, 0, 0);
  return geo;
}

function lisereNeon(cote, materiau) {
  const chemin = new THREE.CurvePath();
  for (let i = 1; i < PROFIL.length; i++) {
    const [z1, y1] = PROFIL[i - 1];
    const [z2, y2] = PROFIL[i];
    chemin.add(new THREE.LineCurve3(new THREE.Vector3(0, y1, z1), new THREE.Vector3(0, y2, z2)));
  }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(chemin, 160, 0.009, 6, false), materiau);
  tube.position.x = cote * (LARGEUR / 2 + 0.014);
  return tube;
}

function textureMarquee(projet) {
  return textureCanvas(1024, 320, (ctx, l, h) => {
    const g = ctx.createLinearGradient(0, 0, l, h);
    g.addColorStop(0, projet.couleur);
    g.addColorStop(1, "#12051f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, h);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, h - 70, l, 70);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, l - 20, h - 20);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 18;
    ctx.font = '900 150px "Orbitron", "Arial Black", sans-serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(String(projet.numero).padStart(2, "0"), 40, 128);
    ctx.shadowBlur = 10;
    let taille = 82;
    ctx.font = `900 ${taille}px "Orbitron", "Arial Black", sans-serif`;
    while (ctx.measureText(projet.nom.toUpperCase()).width > l - 370 && taille > 30) {
      taille -= 4;
      ctx.font = `900 ${taille}px "Orbitron", "Arial Black", sans-serif`;
    }
    ctx.fillText(projet.nom.toUpperCase(), 330, 128);
    ctx.shadowBlur = 0;
    ctx.font = '600 44px "Orbitron", "Arial", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(`${projet.binome} · ${projet.difficulte}`, l / 2, h - 36);
  });
}

export function creerBorne(projet, ecranCanvas) {
  const groupe = new THREE.Group();
  const couleur = new THREE.Color(projet.couleur);
  const estVedette = projet.type === "integre";

  const matCaisson = new THREE.MeshPhysicalMaterial({
    color: assombrir(projet.couleur, 0.26),
    roughness: 0.32,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const caisson = new THREE.Mesh(geometrieCaisson(), matCaisson);
  caisson.castShadow = true;
  caisson.receiveShadow = true;
  groupe.add(caisson);

  const matNeon = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: couleur, emissiveIntensity: estVedette ? 5 : 2.6 });
  groupe.add(lisereNeon(-1, matNeon), lisereNeon(1, matNeon));

  // Marquee lumineuse
  const marquee = new THREE.Mesh(
    new THREE.PlaneGeometry(LARGEUR - 0.04, 0.23),
    new THREE.MeshStandardMaterial({ color: 0x000000, emissiveMap: textureMarquee(projet), emissive: 0xffffff, emissiveIntensity: estVedette ? 1.6 : 1.1 }),
  );
  marquee.position.set(0, 1.83, 0.044);
  groupe.add(marquee);

  // Écran (texture canvas animée) + cadre noir
  const texture = new THREE.CanvasTexture(ecranCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const ecran = new THREE.Mesh(
    new THREE.PlaneGeometry(ECRAN.largeur, ECRAN.hauteur),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  const supportEcran = new THREE.Group();
  supportEcran.position.set(0, ECRAN.y, ECRAN.z + 0.012);
  supportEcran.rotation.x = ECRAN.inclinaison;
  const cadre = new THREE.Mesh(new THREE.PlaneGeometry(ECRAN.largeur + 0.06, ECRAN.hauteur + 0.05), new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.3 }));
  cadre.position.z = -0.002;
  supportEcran.add(cadre, ecran);
  groupe.add(supportEcran);

  // Panneau de contrôle : joystick + boutons
  const matManche = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.3 });
  const manche = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.09), matManche);
  manche.position.set(-0.17, 1.07, 0.12);
  const boule = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xff1d3a, clearcoat: 1, roughness: 0.2 }));
  boule.position.set(-0.17, 1.12, 0.12);
  groupe.add(manche, boule);
  const couleursBoutons = [0x22f5ff, 0xff2bd6, 0xffc83d, 0x7dff3a];
  couleursBoutons.forEach((c, i) => {
    const bouton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.014, 16),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9 }),
    );
    bouton.position.set(0.02 + (i % 2) * 0.07 + Math.floor(i / 2) * 0.03, 1.06 - Math.floor(i / 2) * 0.02, 0.1 + Math.floor(i / 2) * 0.06);
    bouton.rotation.x = -0.4;
    groupe.add(bouton);
  });

  // Monnayeur lumineux
  const porte = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.3), new THREE.MeshStandardMaterial({ color: 0x0a0a0d, metalness: 0.7, roughness: 0.35 }));
  porte.position.set(0, 0.48, 0.056);
  groupe.add(porte);
  for (const dx of [-0.07, 0.07]) {
    const fente = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.07), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff7a1a, emissiveIntensity: 2.2 }));
    fente.position.set(dx, 0.52, 0.058);
    groupe.add(fente);
  }

  // Zone de visée invisible (raycast)
  const zoneVisee = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR + 0.1, 1.96, 0.96), new THREE.MeshBasicMaterial({ visible: false }));
  zoneVisee.position.set(0, 0.98, -0.24);
  zoneVisee.userData.numero = projet.numero;
  groupe.add(zoneVisee);

  const animations = [];
  if (estVedette) ajouterPodium(groupe, animations, matNeon);

  return {
    groupe,
    projet,
    texture,
    ecran,
    zoneVisee,
    matNeon,
    animer(t) {
      for (const f of animations) f(t);
    },
  };
}

function ajouterPodium(groupe, animations, matNeon) {
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.32, 0.14, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0710, roughness: 0.15, clearcoat: 1 }),
  );
  podium.position.set(0, 0.07, -0.3);
  podium.receiveShadow = true;
  groupe.add(podium);
  const anneauOr = new THREE.Mesh(new THREE.TorusGeometry(1.29, 0.02, 8, 96), new THREE.MeshPhysicalMaterial({ color: 0xc9a046, metalness: 1, roughness: 0.25 }));
  anneauOr.rotation.x = Math.PI / 2;
  anneauOr.position.set(0, 0.14, -0.3);
  const anneauNeon = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.012, 6, 96), matNeon);
  anneauNeon.rotation.x = Math.PI / 2;
  anneauNeon.position.set(0, 0.145, -0.3);
  groupe.add(anneauOr, anneauNeon);
  for (const y of [0, 0.75]) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.008, 6, 64),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2bd6, emissiveIntensity: 3, transparent: true, opacity: 0.8 }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 2.2 + y * 0.15, -0.3);
    groupe.add(halo);
    animations.push((t) => {
      halo.position.y = 2.15 + 0.08 * Math.sin(t * 1.6 + y * 3);
      halo.rotation.z = t * (0.5 + y);
      halo.rotation.x = Math.PI / 2 + 0.15 * Math.sin(t + y);
    });
  }
  animations.push((t) => {
    matNeon.emissiveIntensity = 4.2 + Math.sin(t * 2.4) * 1.3;
  });
}

// ---- Écrans d'attente des bornes 1 à 9 (canvas 2D 320x240) ----
export function creerEcranAttente(projet) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");
  const memoire = { vie: creerVie(), serpent: [[8, 6], [7, 6], [6, 6], [5, 6]], dir: [1, 0], pomme: [14, 9], pasSerpent: 0, pasVie: 0 };
  let message = null;
  let finMessage = 0;

  function dessiner(t) {
    ctx.fillStyle = "#04020b";
    ctx.fillRect(0, 0, 320, 240);
    const dessins = [null, pendu, calculatrice, morpion, aventure, blackjack, vie, puissance4, bataille, snake];
    const f = dessins[projet.numero];
    if (f) f(ctx, t, memoire);
    ctx.fillStyle = "rgba(4,2,11,0.75)";
    ctx.fillRect(0, 196, 320, 44);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '10px "Press Start 2P", monospace';
    let texte = projet.disponible ? "APPUIE SUR E POUR LANCER" : "BIENTOT DISPONIBLE";
    let couleur = projet.disponible ? "#7dff3a" : "#ffc83d";
    if (message && t < finMessage) {
      texte = message;
      couleur = "#22f5ff";
    }
    if (t % 1.2 < 0.85) {
      ctx.fillStyle = couleur;
      ctx.fillText(texte, 160, 218);
    }
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < 240; y += 3) ctx.fillRect(0, y, 320, 1);
  }

  return {
    canvas,
    dessiner,
    afficherMessage(texte, t, duree = 6) {
      message = texte;
      finMessage = t + duree;
    },
  };
}

function titre(ctx, texte, couleur) {
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = couleur;
  ctx.shadowColor = couleur;
  ctx.shadowBlur = 8;
  ctx.fillText(texte, 160, 18);
  ctx.shadowBlur = 0;
}

function pendu(ctx, t) {
  titre(ctx, "LE PENDU", "#7dff3a");
  const etape = Math.floor(t * 0.8) % 9;
  ctx.strokeStyle = "#e8e8ff";
  ctx.lineWidth = 3;
  const traits = [
    [60, 170, 140, 170], [80, 170, 80, 50], [80, 50, 150, 50], [150, 50, 150, 70],
  ];
  traits.forEach(([a, b, c, d]) => {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
  });
  if (etape > 0) {
    ctx.beginPath();
    ctx.arc(150, 82, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  const corps = [[150, 94, 150, 130], [150, 104, 134, 118], [150, 104, 166, 118], [150, 130, 138, 152], [150, 130, 162, 152]];
  corps.slice(0, Math.max(0, etape - 1)).forEach(([a, b, c, d]) => {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
  });
  const mot = "PYTHON";
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  const lettres = mot.split("").map((l, i) => (i < etape - 2 ? l : "_")).join(" ");
  ctx.fillText(lettres, 182, 120);
}

function calculatrice(ctx, t) {
  titre(ctx, "CALCULATRICE", "#7dff3a");
  const calculs = ["12 + 30 = 42", "7 * 6 = 42", "84 / 2 = 42", "50 - 8 = 42"];
  const c = calculs[Math.floor(t / 2.5) % calculs.length];
  const n = Math.min(c.length, Math.floor((t % 2.5) * 10));
  ctx.fillStyle = "#0e2a1a";
  ctx.fillRect(40, 50, 240, 50);
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.textAlign = "right";
  ctx.fillStyle = "#7dff3a";
  ctx.fillText(c.slice(0, n), 270, 76);
  const touches = "789/456*123-0.=+";
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  for (let i = 0; i < 16; i++) {
    const x = 70 + (i % 4) * 60;
    const y = 118 + Math.floor(i / 4) * 19;
    ctx.fillStyle = "#1a1530";
    ctx.fillRect(x - 24, y - 8, 48, 16);
    ctx.fillStyle = "#cfd3ff";
    ctx.fillText(touches[i], x, y);
  }
}

function morpion(ctx, t) {
  titre(ctx, "MORPION VS ORDI", "#ffc83d");
  const ordre = [4, 0, 8, 2, 6, 3, 5, 1, 7];
  const n = Math.floor(t * 1.2) % 11;
  ctx.strokeStyle = "#ffc83d";
  ctx.lineWidth = 3;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(100 + i * 40, 45);
    ctx.lineTo(100 + i * 40, 165);
    ctx.moveTo(100, 45 + i * 40);
    ctx.lineTo(220, 45 + i * 40);
    ctx.stroke();
  }
  ordre.slice(0, n).forEach((c, i) => {
    const x = 120 + (c % 3) * 40;
    const y = 65 + Math.floor(c / 3) * 40;
    ctx.strokeStyle = i % 2 === 0 ? "#22f5ff" : "#ff2bd6";
    ctx.beginPath();
    if (i % 2 === 0) {
      ctx.moveTo(x - 10, y - 10);
      ctx.lineTo(x + 10, y + 10);
      ctx.moveTo(x + 10, y - 10);
      ctx.lineTo(x - 10, y + 10);
    } else {
      ctx.arc(x, y, 11, 0, Math.PI * 2);
    }
    ctx.stroke();
  });
}

function aventure(ctx, t) {
  titre(ctx, "AVENTURE TEXTUELLE", "#ffc83d");
  const lignes = [
    "Tu es dans un couloir sombre.",
    "> aller nord",
    "Une porte doree t'attend.",
    "> ouvrir porte",
    "Un dragon dort sur un tresor...",
    "> prendre tresor",
  ];
  const total = Math.floor(t * 18) % 200;
  ctx.font = "13px Consolas, 'Courier New', monospace";
  ctx.textAlign = "left";
  let reste = total;
  lignes.forEach((ligne, i) => {
    if (reste <= 0) return;
    ctx.fillStyle = ligne.startsWith(">") ? "#7dff3a" : "#e8e8ff";
    ctx.fillText(ligne.slice(0, reste), 20, 52 + i * 22);
    reste -= ligne.length;
  });
}

function carte(ctx, x, y, valeur, rouge) {
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(x, y, 44, 62);
  ctx.fillStyle = rouge ? "#d61c3a" : "#111";
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "left";
  ctx.fillText(valeur, x + 5, y + 14);
  ctx.font = "26px serif";
  ctx.textAlign = "center";
  ctx.fillText(rouge ? "♥" : "♠", x + 22, y + 40);
}

function blackjack(ctx, t) {
  ctx.fillStyle = "#0b3d22";
  ctx.fillRect(0, 0, 320, 196);
  titre(ctx, "BLACKJACK", "#ffc83d");
  const n = Math.floor(t * 0.9) % 6;
  const main = [["A", true], ["K", false], ["7", true], ["9", false]];
  main.slice(0, Math.min(n, 4)).forEach(([v, r], i) => carte(ctx, 60 + i * 52, 70, v, r));
  if (n >= 2) {
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = "#ffc83d";
    ctx.textAlign = "center";
    ctx.fillText(n === 2 ? "BLACKJACK !" : "21 ?", 160, 160);
  }
}

function creerVie() {
  const grille = [];
  for (let y = 0; y < 22; y++) {
    grille.push([]);
    for (let x = 0; x < 32; x++) grille[y].push(Math.random() < 0.28 ? 1 : 0);
  }
  return grille;
}

function vie(ctx, t, m) {
  titre(ctx, "JEU DE LA VIE", "#ffc83d");
  if (t - m.pasVie > 0.18) {
    m.pasVie = t;
    const g = m.vie;
    const n = g.map((ligne, y) =>
      ligne.map((c, x) => {
        let voisins = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx || dy) voisins += g[(y + dy + 22) % 22][(x + dx + 32) % 32];
        }
        return voisins === 3 || (c && voisins === 2) ? 1 : 0;
      }),
    );
    const vivantes = n.flat().reduce((a, b) => a + b, 0);
    m.vie = vivantes < 30 ? creerVie() : n;
  }
  ctx.fillStyle = "#ffc83d";
  m.vie.forEach((ligne, y) => ligne.forEach((c, x) => c && ctx.fillRect(16 + x * 9, 32 + y * 7.4, 8, 6.4)));
}

function puissance4(ctx, t) {
  titre(ctx, "PUISSANCE 4", "#ff2bd6");
  ctx.fillStyle = "#1838b8";
  ctx.fillRect(70, 40, 180, 150);
  const coups = [3, 3, 2, 4, 4, 1, 5, 2, 5, 4];
  const n = Math.floor(t * 1.4) % (coups.length + 3);
  const hauteurs = [0, 0, 0, 0, 0, 0, 0];
  const pions = [];
  coups.slice(0, n).forEach((c, i) => {
    pions.push([c, 5 - hauteurs[c], i % 2]);
    hauteurs[c]++;
  });
  for (let y = 0; y < 6; y++) for (let x = 0; x < 7; x++) {
    ctx.fillStyle = "#04020b";
    const p = pions.find(([px, py]) => px === x && py === y);
    if (p) ctx.fillStyle = p[2] ? "#ffc83d" : "#ff2b4a";
    ctx.beginPath();
    ctx.arc(88 + x * 24, 55 + y * 24, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function bataille(ctx, t) {
  titre(ctx, "BATAILLE NAVALE", "#ff2bd6");
  ctx.strokeStyle = "rgba(34,245,255,0.5)";
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(96 + i * 16, 40);
    ctx.lineTo(96 + i * 16, 168);
    ctx.moveTo(96, 40 + i * 16);
    ctx.lineTo(224, 40 + i * 16);
    ctx.stroke();
  }
  ctx.fillStyle = "#6a7a99";
  ctx.fillRect(113, 57, 46, 14);
  ctx.fillRect(193, 89, 14, 62);
  const tirs = [[2, 1, 1], [5, 5, 0], [6, 3, 1], [1, 6, 0], [3, 1, 1], [6, 4, 1], [4, 3, 0]];
  tirs.slice(0, Math.floor(t * 1.5) % (tirs.length + 2)).forEach(([x, y, touche]) => {
    ctx.fillStyle = touche ? "#ff3b3b" : "#ffffff";
    ctx.beginPath();
    ctx.arc(104 + x * 16, 48 + y * 16, touche ? 6 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function snake(ctx, t, m) {
  titre(ctx, "SNAKE", "#ff2bd6");
  if (t - m.pasSerpent > 0.12) {
    m.pasSerpent = t;
    const tete = m.serpent[0];
    const [px, py] = m.pomme;
    if (tete[0] !== px) m.dir = [Math.sign(px - tete[0]), 0];
    else m.dir = [0, Math.sign(py - tete[1])];
    const nouvelle = [tete[0] + m.dir[0], tete[1] + m.dir[1]];
    m.serpent.unshift(nouvelle);
    if (nouvelle[0] === px && nouvelle[1] === py) {
      m.pomme = [1 + Math.floor(Math.random() * 24), 1 + Math.floor(Math.random() * 14)];
      if (m.serpent.length > 22) m.serpent.length = 4;
    } else {
      m.serpent.pop();
    }
  }
  ctx.fillStyle = "#ff3b3b";
  ctx.fillRect(10 + m.pomme[0] * 12, 30 + m.pomme[1] * 10, 10, 9);
  m.serpent.forEach(([x, y], i) => {
    ctx.fillStyle = i === 0 ? "#b6ff8a" : "#7dff3a";
    ctx.fillRect(10 + x * 12, 30 + y * 10, 11, 9);
  });
}

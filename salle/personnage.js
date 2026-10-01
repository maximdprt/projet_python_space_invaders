// Mascottes de la salle : corps en haricot, grosses lunettes et accessoires, modélisées en primitives Three.js.
// Version allégée pour les PC faibles : matériaux simples (Lambert) partagés, peu de facettes, pas d'ombres.
import * as THREE from "three";

const PROFIL = [
  [0.0, 0.06], [0.2, 0.02], [0.29, 0.08], [0.34, 0.22], [0.36, 0.42], [0.355, 0.62],
  [0.35, 0.8], [0.34, 0.96], [0.3, 1.1], [0.22, 1.2], [0.12, 1.25], [0.0, 1.265],
];

export function rayonA(y) {
  for (let i = 1; i < PROFIL.length; i++) {
    const [r0, y0] = PROFIL[i - 1];
    const [r1, y1] = PROFIL[i];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return 0;
}

function profilLisse(echelle, yMin, yMax) {
  const courbe = new THREE.SplineCurve(PROFIL.map(([r, y]) => new THREE.Vector2(r, y)));
  return courbe
    .getPoints(24)
    .filter((p) => p.y >= yMin && p.y <= yMax)
    .map((p) => new THREE.Vector2(p.x * echelle, p.y));
}

// Un seul matériau par couleur, partagé par toutes les mascottes.
const materiaux = new Map();
function mat(couleur, { transparent = false, opacity = 1, side = THREE.FrontSide } = {}) {
  const cle = `${couleur}-${opacity}-${side}`;
  // Légère lueur propre : les mascottes restent visibles même loin des lampes, sans lumière en plus.
  if (!materiaux.has(cle)) materiaux.set(cle, new THREE.MeshLambertMaterial({ color: couleur, emissive: couleur, emissiveIntensity: 0.2, transparent, opacity, side }));
  return materiaux.get(cle);
}

function neon(couleur) {
  const cle = `neon-${couleur}`;
  if (!materiaux.has(cle)) materiaux.set(cle, new THREE.MeshBasicMaterial({ color: couleur }));
  return materiaux.get(cle);
}

function texteBouche(dents) {
  const cle = `bouche-${dents}`;
  if (materiaux.has(cle)) return materiaux.get(cle);
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2a0d14";
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.quadraticCurveTo(64, 10, 120, 6);
  ctx.quadraticCurveTo(110, 62, 64, 60);
  ctx.quadraticCurveTo(18, 62, 8, 6);
  ctx.fill();
  if (dents) {
    ctx.fillStyle = "#fff8ee";
    for (let i = 0; i < 4; i++) ctx.fillRect(28 + i * 19, 8, 15, 14);
  }
  ctx.fillStyle = "#ff6b7d";
  ctx.beginPath();
  ctx.ellipse(64, 54, 26, 9, 0, Math.PI, 0);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  materiaux.set(cle, new THREE.MeshLambertMaterial({ map: t, transparent: true }));
  return materiaux.get(cle);
}

function surSurface(objet, y, angle, avance = 0) {
  const r = rayonA(y) + avance;
  objet.position.set(Math.sin(angle) * r, y, Math.cos(angle) * r);
  objet.rotation.y = angle;
  return objet;
}

function creerVisage(perso, d) {
  const visage = new THREE.Group();
  const blanc = mat(0xffffff);
  const noir = mat(0x111018);
  const yeux = [];
  for (const cote of [-1, 1]) {
    const angle = cote * 0.4;
    const oeil = new THREE.Group();
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 8), blanc);
    globe.scale.z = 0.45;
    const pupille = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 6), noir);
    pupille.position.set(-cote * 0.01, -0.006, 0.036);
    pupille.scale.z = 0.5;
    const reflet = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), blanc);
    reflet.position.set(0.016, 0.02, 0.056);
    oeil.add(globe, pupille, reflet);
    surSurface(oeil, 0.93, angle, -0.01);
    visage.add(oeil);
    yeux.push(oeil);
  }
  const bouche = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.085), texteBouche(!!d.dents));
  surSurface(bouche, 0.76, 0, 0.004);
  bouche.rotation.x = -0.12;
  const joues = mat(d.joues ?? 0xff7f9c, { transparent: true, opacity: 0.55 });
  for (const cote of [-1, 1]) {
    const joue = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), joues);
    surSurface(joue, 0.81, cote * 0.62, 0.003);
    visage.add(joue);
  }
  visage.add(bouche);
  perso.yeux = yeux;
  return visage;
}

function creerLunettes(d) {
  const g = new THREE.Group();
  const monture = mat(d.monture ?? 0x15131c);
  const verre = mat(d.verres ?? 0xffb347, { transparent: true, opacity: 0.42 });
  const carree = d.lunettes === "carrees";
  for (const cote of [-1, 1]) {
    const angle = cote * 0.4;
    const cadre = new THREE.Group();
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 6, carree ? 4 : 16), monture);
    const disque = new THREE.Mesh(new THREE.CircleGeometry(0.13, carree ? 4 : 16), verre);
    if (carree) {
      anneau.rotation.z = Math.PI / 4;
      disque.rotation.z = Math.PI / 4;
      anneau.scale.set(1.05, 0.92, 1);
      disque.scale.set(1.05, 0.92, 1);
    }
    cadre.add(anneau, disque);
    surSurface(cadre, 0.93, angle, 0.045);
    g.add(cadre);
  }
  const branches = new THREE.Mesh(new THREE.TorusGeometry(rayonA(0.95) + 0.012, 0.012, 4, 20, Math.PI * 2 - 2.4), monture);
  branches.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 + 1.2);
  branches.position.y = 0.95;
  const pont = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 6), monture);
  pont.rotation.z = Math.PI / 2;
  pont.position.set(0, 0.96, rayonA(0.95) + 0.05);
  g.add(branches, pont);
  return g;
}

function creerChapeau(d) {
  const g = new THREE.Group();
  const tissu = mat(d.chapeau);
  const accent = mat(d.accent);
  if (d.coiffe === "casquette") {
    const calotte = new THREE.Mesh(new THREE.SphereGeometry(0.315, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tissu);
    calotte.position.y = 1.04;
    calotte.scale.y = 0.85;
    const visiere = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 14, 1, false, -Math.PI / 2, Math.PI), accent);
    visiere.scale.z = 1.05;
    visiere.position.set(0, 1.06, d.casquetteInversee ? -0.26 : 0.26);
    visiere.rotation.x = d.casquetteInversee ? -0.15 : 0.15;
    if (d.casquetteInversee) visiere.rotation.y = Math.PI;
    const bouton = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), accent);
    bouton.position.y = 1.31;
    g.add(calotte, visiere, bouton);
  } else if (d.coiffe === "bob") {
    const haut = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.31, 0.22, 16), tissu);
    haut.position.y = 1.17;
    const bord = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.47, 0.06, 18), tissu);
    bord.position.y = 1.06;
    const ruban = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.32, 0.05, 16), accent);
    ruban.position.y = 1.1;
    g.add(haut, bord, ruban);
  } else if (d.coiffe === "bonnet") {
    const bonnet = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tissu);
    bonnet.position.y = 1.02;
    const revers = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.045, 6, 18), accent);
    revers.rotation.x = Math.PI / 2;
    revers.position.y = 1.04;
    const pompon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), accent);
    pompon.position.y = 1.36;
    g.add(bonnet, revers, pompon);
  } else if (d.coiffe === "casque") {
    const arceau = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 6, 18, Math.PI), tissu);
    arceau.position.y = 0.94;
    for (const cote of [-1, 1]) {
      const ecouteur = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14), tissu);
      ecouteur.rotation.z = Math.PI / 2;
      ecouteur.position.set(cote * 0.35, 0.94, 0);
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 4, 14), neon(d.accent));
      anneau.rotation.y = Math.PI / 2;
      anneau.position.set(cote * 0.395, 0.94, 0);
      g.add(ecouteur, anneau);
    }
    g.add(arceau);
  }
  return g;
}

function creerVetements(d) {
  const g = new THREE.Group();
  const haut = new THREE.Mesh(new THREE.LatheGeometry(profilLisse(1.045, 0.15, 0.66), 20), mat(d.haut, { side: THREE.DoubleSide }));
  g.add(haut);
  const col = new THREE.Mesh(new THREE.TorusGeometry(rayonA(0.66) * 1.04, 0.025, 6, 20), mat(d.col ?? d.haut));
  col.rotation.x = Math.PI / 2;
  col.position.y = 0.66;
  g.add(col);
  if (d.bretelles) {
    const bretelle = mat(d.bretelles);
    for (const cote of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.02), bretelle);
      surSurface(b, 0.52, cote * 0.42, 0.025);
      const bouton = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 8), mat(0xffd34d));
      bouton.rotation.x = Math.PI / 2;
      surSurface(bouton, 0.4, cote * 0.42, 0.04);
      g.add(b, bouton);
    }
  }
  if (d.badge) {
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 12), neon(d.badge));
    badge.rotation.x = Math.PI / 2;
    surSurface(badge, 0.5, -0.45, 0.025);
    g.add(badge);
  }
  if (d.echarpe) {
    const echarpe = new THREE.Mesh(new THREE.TorusGeometry(rayonA(0.68) * 1.06, 0.05, 6, 20), mat(d.echarpe));
    echarpe.rotation.x = Math.PI / 2;
    echarpe.position.y = 0.7;
    const pan = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.04), mat(d.echarpe));
    surSurface(pan, 0.56, 0.5, 0.06);
    pan.rotation.z = 0.15;
    g.add(echarpe, pan);
  }
  if (d.sac) {
    const sac = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.12, 3, 10), mat(d.sac));
    sac.scale.z = 0.55;
    sac.position.set(0, 0.5, -0.4);
    g.add(sac);
  }
  return g;
}

function creerBras(d) {
  const peau = mat(d.peau);
  const manche = mat(d.haut);
  const bras = [];
  for (const cote of [-1, 1]) {
    const epaule = new THREE.Group();
    epaule.position.set(cote * (rayonA(0.6) - 0.02), 0.6, 0);
    const haut = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.12, 2, 8), manche);
    haut.position.y = -0.09;
    const avant = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.12, 2, 8), peau);
    avant.position.y = -0.22;
    const main = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), peau);
    main.scale.set(1, 1.1, 0.8);
    main.position.y = -0.33;
    const pouce = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), peau);
    pouce.position.set(-cote * 0.06, -0.3, 0.04);
    epaule.add(haut, avant, main, pouce);
    epaule.rotation.z = cote * 0.35;
    bras.push(epaule);
  }
  return bras;
}

function creerJambes(d) {
  const g = new THREE.Group();
  for (const cote of [-1, 1]) {
    const jambe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.16, 8), mat(d.bas ?? 0x2c2a3a));
    jambe.position.set(cote * 0.13, 0.1, 0);
    const chaussure = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), mat(d.chaussures ?? 0x6b3b22));
    chaussure.scale.set(1, 0.6, 1.5);
    chaussure.position.set(cote * 0.13, 0.04, 0.05);
    g.add(jambe, chaussure);
  }
  return g;
}

export const MASCOTTES = {
  ziggy: {
    nom: "Ziggy", peau: 0xff8a3d, haut: 0x2d5bd8, col: 0x2d5bd8, bretelles: 0x1b3a94, bas: 0x1b3a94,
    coiffe: "casquette", chapeau: 0x8a3ffc, accent: 0xffd23f, lunettes: "rondes", verres: 0x7fe7ff, dents: true,
  },
  nova: {
    nom: "Nova", peau: 0x9b6bff, haut: 0xff4fa3, bas: 0x2a2140, chaussures: 0xf4f4f4,
    coiffe: "casque", chapeau: 0x22202c, accent: 0x22f5ff, lunettes: "carrees", verres: 0xff4fd8, joues: 0xffa3d6,
  },
  bobby: {
    nom: "Bobby", peau: 0xffd23f, haut: 0xe8413c, bas: 0x3a3a48, echarpe: 0x2fbf71,
    coiffe: "bob", chapeau: 0x2fbf71, accent: 0x146b3e, lunettes: "rondes", verres: 0xffe08a, dents: true,
  },
  mochi: {
    nom: "Mochi", peau: 0x3fe0c5, haut: 0xf5efe0, col: 0xe8413c, bas: 0x4a3b7a, sac: 0xffc83d,
    coiffe: "bonnet", chapeau: 0xe8413c, accent: 0xf5efe0, lunettes: "carrees", verres: 0xb0ffef,
  },
  pepite: {
    nom: "Pépite", peau: 0xff6fae, haut: 0x1d1b26, bas: 0x1d1b26, chaussures: 0xffd23f, badge: 0x7dff3a,
    coiffe: "casquette", casquetteInversee: true, chapeau: 0xffd23f, accent: 0x1d1b26, lunettes: "rondes",
    verres: 0xffd0e6, joues: 0xff3d7f, dents: true,
  },
};

export function creerMascotte(cle) {
  const d = MASCOTTES[cle];
  const perso = { cle, nom: d.nom };
  const racine = new THREE.Group();
  racine.name = d.nom;
  const corps = new THREE.Group();
  corps.position.y = 0.14;
  const haricot = new THREE.Mesh(new THREE.LatheGeometry(profilLisse(1, 0, 1.3), 24), mat(d.peau));
  corps.add(haricot, creerVetements(d), creerVisage(perso, d), creerLunettes(d), creerChapeau(d));
  const bras = creerBras(d);
  corps.add(...bras);
  racine.add(creerJambes(d), corps);
  return Object.assign(perso, { racine, corps, bras });
}

export function animerMascotte(p, t, decalage, joue) {
  const souffle = Math.sin(t * 1.8 + decalage);
  p.corps.scale.set(1 - souffle * 0.012, 1 + souffle * 0.02, 1 - souffle * 0.012);
  p.corps.rotation.y = Math.sin(t * 0.5 + decalage) * (joue ? 0.06 : 0.3);
  p.corps.rotation.z = Math.sin(t * 0.9 + decalage) * 0.03;
  const cligne = (t + decalage) % 3.7 < 0.12 ? 0.1 : 1;
  for (const oeil of p.yeux) oeil.scale.y = cligne;
  if (joue) {
    p.bras.forEach((b, i) => {
      b.rotation.x = -1.25 + Math.sin(t * 11 + i * 2) * 0.08;
      b.rotation.z = (i ? 1 : -1) * 0.2;
    });
  } else {
    const salut = Math.max(0, Math.sin(t * 0.6 + decalage)) ** 6;
    p.bras[1].rotation.z = 0.35 + salut * 2.2;
    p.bras[1].rotation.x = Math.sin(t * 8) * 0.25 * salut;
    p.bras[0].rotation.z = -0.35;
  }
}

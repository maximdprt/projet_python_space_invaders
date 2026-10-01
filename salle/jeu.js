// Affiche le jeu Python sur un canvas 800x600 et lui envoie les touches. Aucune règle du jeu ici.
import { demarrerMoteur } from "./moteurs.js";

const L = 800, H = 600;

const COULEURS = {
  meduse: "#22f5ff", crabe: "#ff2bd6", poulpe: "#7dff3a", tir: "#22f5ff", plasma: "#ff2bd6", bonus: "#ffc83d",
  chasseur: "#22f5ff", intercepteur: "#3aa8ff", faucon: "#a85cff", croiseur: "#ffc83d", dreadnought: "#ff2bd6",
};
const PALETTE = { O: "#fff6c8", W: "#eef8ff", C: "#22f5ff", B: "#3a7bff", V: "#a85cff", G: "#ffc83d", D: "#5a5f7a", R: "#ff2bd6" };
const ECHELLES = { chasseur: 4, intercepteur: 3.4 };

// Pixel art : "/" sépare les lignes, "." = vide, X = couleur de l'entité.
const SPRITES = {
  poulpe: ["...XX.../..XXXX../.XXXXXX./XX.XX.XX/XXXXXXXX/..X..X../.X.XX.X./X.X..X.X",
    "...XX.../..XXXX../.XXXXXX./XX.XX.XX/XXXXXXXX/.X.XX.X./X......X/.X....X."],
  crabe: ["..X.....X../...X...X.../..XXXXXXX../.XX.XXX.XX./XXXXXXXXXXX/X.XXXXXXX.X/X.X.....X.X/...XX.XX...",
    "..X.....X../X..X...X..X/X.XXXXXXX.X/XXX.XXX.XXX/XXXXXXXXXXX/.XXXXXXXXX./..X.....X../.X.......X."],
  meduse: ["....XXXX..../.XXXXXXXXXX./XXXXXXXXXXXX/XXX..XX..XXX/XXXXXXXXXXXX/...XX..XX.../..XX.XX.XX../XX........XX",
    "....XXXX..../.XXXXXXXXXX./XXXXXXXXXXXX/XXX..XX..XXX/XXXXXXXXXXXX/..XXX..XXX../.XX..XX..XX./..XX....XX.."],
  bonus: ["..XXXX../.XXOOXX./XXXOOXXX/XOOOOOOX/XOOOOOOX/XXXOOXXX/.XXOOXX./..XXXX..",
    "......../..XXXX../.XXOOXX./XXOOOOXX/XXOOOOXX/.XXOOXX./..XXXX../........"],
  chasseur: ["......W....../.....WCW...../.....WCW...../....WWWWW..../.C..WWBWW..C./.W.WWWWWWW.W./WWWWWWWWWWWWW/WWWWW...WWWWW/.CC.......CC."],
  intercepteur: ["........W......../.......WCW......./.......WCW......./......WWWWW....../.....WWBBBWW...../W...WWWWWWWWW...W/WW.WWWWWWWWWWW.WW/WWWWWCWWWWWCWWWWW/.WWW..WW.WW..WWW./.C.....C.C.....C."],
  faucon: [".........W........./........WVW......../........VVV......../.......WVVVW......./......WWWWWWW....../..C..WWWBBBWWW..C../..W.WWWWWWWWWWW.W../.WWWWWWWWWWWWWWWWW./WWWCWWWWWWWWWWWCWWW/WWW.WWWW...WWWW.WWW/.W...WW.....WW...W."],
  croiseur: ["..........W........../.........WCW........./........WWCWW......../.......GWWWWWG......./......GGWBBBWGG....../...G.WWWWWWWWWWW.G.../..GG.WWGWWWWWGWW.GG../.GGWWWWWWWWWWWWWWWGG./GGWWWGWWWWWWWWWGWWWGG/GWWWWWWWGGGGGWWWWWWWG/.WWWW.WWW...WWW.WWWW./..WW...WW...WW...WW.."],
  dreadnought: ["............W............/...........WCW.........../..........WWCWW........../.........RWWCWWR........./........RRWBBBWRR......../.......RWWWBBBWWWR......./...R..RWWWWWWWWWWWR..R.../..RR.RWWWWDWWWDWWWWR.RR../.RRWWWWWWWWDWDWWWWWWWWRR./RRWWWWDWWWWWWWWWWWDWWWWRR/RWWWWWWWWRRRRRRRWWWWWWWWR/RWWDWWWWWWWWWWWWWWWWWDWWR/.WWWW.WWWW.....WWWW.WWWW./..WW....WW.....WW....WW.."],
};

const cache = {};
function sprite(sorte, image) {
  const cle = sorte + image;
  if (!cache[cle]) {
    const motifs = SPRITES[sorte];
    const lignes = motifs[image % motifs.length].split("/");
    const e = ECHELLES[sorte] || 3, m = 10;
    const c = document.createElement("canvas");
    c.width = lignes[0].length * e + 2 * m;
    c.height = lignes.length * e + 2 * m;
    const g = c.getContext("2d");
    g.shadowColor = COULEURS[sorte];
    g.shadowBlur = 10;
    lignes.forEach((ligne, y) => [...ligne].forEach((p, x) => {
      if (p === ".") return;
      g.fillStyle = PALETTE[p] || COULEURS[sorte];
      g.fillRect(m + x * e, m + y * e, Math.ceil(e), Math.ceil(e));
    }));
    cache[cle] = c;
  }
  return cache[cle];
}

function centrer(ctx, img, x, y, taille = 1) {
  ctx.drawImage(img, x - (img.width * taille) / 2, y - (img.height * taille) / 2, img.width * taille, img.height * taille);
}

// Calque CRT (scanlines + vignette) calculé une seule fois.
const crt = document.createElement("canvas");
crt.width = L; crt.height = H;
{
  const g = crt.getContext("2d");
  g.fillStyle = "rgba(0,0,0,.18)";
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, L, 1);
  const v = g.createRadialGradient(L / 2, H / 2, H / 3, L / 2, H / 2, H * 0.85);
  v.addColorStop(0, "transparent");
  v.addColorStop(1, "rgba(0,0,0,.6)");
  g.fillStyle = v;
  g.fillRect(0, 0, L, H);
}
const etoiles = Array.from({ length: 90 }, () => ({ x: Math.random() * L, y: Math.random() * H, v: 0.2 + Math.random() * 1.2 }));

export function creerJeu() {
  const canvas = document.createElement("canvas");
  canvas.width = L; canvas.height = H;
  const ctx = canvas.getContext("2d");
  let etat = null, avant = null, particules = [], secousse = 0, banniere = null;
  let record = Number(localStorage.getItem("record") || 0);

  function texte(t, x, y, taille = 16, couleur = "#fff", align = "center") {
    ctx.font = `${taille}px Pixel`;
    ctx.textAlign = align;
    ctx.fillStyle = ctx.shadowColor = couleur;
    ctx.shadowBlur = taille >= 20 ? 12 : 0;
    ctx.fillText(t, x, y);
    ctx.shadowBlur = 0;
  }

  // Les animations se déduisent de la différence entre deux états reçus de Python.
  function recevoir(nouveau) {
    if (!nouveau.statut) return;
    avant = etat;
    etat = nouveau;
    for (const e of etat.explosions) for (let i = 0; i < 16; i++) {
      const a = Math.random() * 6.28, v = 1 + Math.random() * 4;
      particules.push({ x: e.x + 18, y: e.y + 13, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 30, c: COULEURS[e.sorte] });
    }
    if (!avant || etat.statut !== "en_cours" || avant.statut !== "en_cours") return;
    if (etat.vies < avant.vies) secousse = 14;
    if (etat.forme > avant.forme) banniere = { t: 120, texte: "NOUVELLE FORME", sorte: etat.vaisseau.sorte };
    else if (etat.forme < avant.forme) banniere = { t: 90, texte: "FORME PERDUE", sorte: etat.vaisseau.sorte };
    else if (etat.vague !== avant.vague) banniere = { t: 90, texte: `VAGUE ${etat.vague}`, sorte: etat.vaisseau.sorte };
    if (etat.score > record) localStorage.setItem("record", (record = etat.score));
  }

  function hud(temps) {
    texte(`SCORE ${etat.score}`, 16, 30, 14, "#fff", "left");
    texte(`RECORD ${record}`, L / 2, 30, 14, "#ffc83d");
    texte(`VAGUE ${etat.vague}`, L - 16, 30, 14, "#22f5ff", "right");
    texte(`FORME ${etat.forme}/5 ${etat.vaisseau.sorte.toUpperCase()}`, 16, 56, 10, COULEURS[etat.vaisseau.sorte], "left");
    if (etat.duree_forme > 0) texte(`TEMPS ${(etat.duree_forme / 60).toFixed(1)}s`, 16, 72, 10, COULEURS[etat.vaisseau.sorte], "left");
    const icone = sprite(etat.vaisseau.sorte, 0);
    for (let i = 0; i < etat.vies; i++) centrer(ctx, icone, 30 + i * 40, H - 14, 0.4);
    ctx.fillStyle = "#ff2bd6";
    ctx.fillRect(0, 575, L, 2);
    if (banniere && banniere.t-- > 0) {
      texte(banniere.texte, L / 2, 260, 26, COULEURS[banniere.sorte]);
      if (banniere.texte.startsWith("NOUVELLE")) centrer(ctx, sprite(banniere.sorte, 0), L / 2, 330, 1.6);
    }
  }

  function ecranTitre(temps) {
    ctx.fillStyle = "rgba(5,0,15,.75)";
    ctx.fillRect(0, 0, L, H);
    if (etat.pause) return texte("PAUSE", L / 2, H / 2, 32, "#22f5ff");
    const perdu = etat.statut === "perdu";
    texte(perdu ? "GAME OVER" : "SPACE INVADERS", L / 2, 160, perdu ? 40 : 36, perdu ? "#ff3b3b" : "#ff2bd6");
    if (perdu) texte(`SCORE ${etat.score}   RECORD ${record}`, L / 2, 220, 16, "#ffc83d");
    ["poulpe", "crabe", "meduse", "bonus"].forEach((sorte, i) => {
      centrer(ctx, sprite(sorte, Math.floor(temps / 500)), 300, 280 + i * 46);
      texte(sorte === "bonus" ? "= NOUVELLE FORME" : `= ${[30, 20, 10][i]} PTS`, 340, 288 + i * 46, 14, COULEURS[sorte], "left");
    });
    if (Math.floor(temps / 500) % 2) texte(perdu ? "ESPACE POUR REJOUER" : "APPUIE SUR ESPACE", L / 2, 500, 18);
  }

  function dessiner(temps) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05010d";
    ctx.fillRect(0, 0, L, H);
    for (const e of etoiles) {
      ctx.fillStyle = `rgba(200,220,255,${e.v / 1.6})`;
      ctx.fillRect(e.x, (e.y + temps * e.v * 0.03) % H, e.v > 1 ? 2 : 1, e.v > 1 ? 2 : 1);
    }
    if (!etat) return texte("CHARGEMENT DU JEU PYTHON...", L / 2, H / 2, 16, "#22f5ff");
    if (secousse > 0) ctx.translate((Math.random() - 0.5) * secousse, (Math.random() - 0.5) * secousse--);
    const image = Math.floor(temps / 400);
    for (const e of etat.ennemis) centrer(ctx, sprite(e.sorte, image), e.x + e.largeur / 2, e.y + e.hauteur / 2);
    for (const b of etat.bonus) centrer(ctx, sprite("bonus", image), b.x + b.largeur / 2, b.y + b.hauteur / 2);
    ctx.globalCompositeOperation = "lighter";
    for (const m of etat.missiles) {
      ctx.fillStyle = COULEURS[m.sorte] + "55";
      ctx.fillRect(m.x - 3, m.y - 3, m.largeur + 6, m.hauteur + 6);
      ctx.fillStyle = COULEURS[m.sorte];
      ctx.fillRect(m.x, m.y, m.largeur, m.hauteur);
    }
    particules = particules.filter((p) => p.vie-- > 0);
    for (const p of particules) {
      p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.vie / 30;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const v = etat.vaisseau;
    if (etat.statut !== "accueil" && !(v.invincible && image % 2)) {
      ctx.fillStyle = Math.random() < 0.5 ? "#ff9d2b" : "#22f5ff";
      ctx.fillRect(v.x + v.largeur / 2 - 4, v.y + v.hauteur + 2, 8, 4 + Math.random() * 8);
      centrer(ctx, sprite(v.sorte, 0), v.x + v.largeur / 2, v.y + v.hauteur / 2);
    }
    hud(temps);
    if (etat.statut !== "en_cours" || etat.pause) ecranTitre(temps);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(crt, 0, 0);
  }

  // ---------- Connexion au jeu Python et touches ----------
  const moteur = demarrerMoteur(recevoir);
  const TOUCHES = { ArrowLeft: "gauche", ArrowRight: "droite", KeyA: "gauche", KeyD: "droite", Space: "tir" };
  const touches = { gauche: false, droite: false, tir: false };
  let actif = false, quitter = () => {};
  function changer(e, appuye) {
    const nom = TOUCHES[e.code];
    if (!nom) return;
    e.preventDefault();
    if (touches[nom] !== appuye) {
      touches[nom] = appuye;
      moteur.touches(touches);
    }
  }
  function relacher() {
    for (const nom in touches) touches[nom] = false;
    moteur.touches(touches);
  }
  addEventListener("keydown", (e) => {
    if (!actif) return;
    if (e.code === "Escape") return quitter();
    if (e.code === "KeyP" && etat) moteur.pause(!etat.pause);
    changer(e, true);
  });
  addEventListener("keyup", (e) => actif && changer(e, false));
  addEventListener("blur", () => actif && relacher());
  function activer(oui) {
    actif = oui;
    relacher();
    moteur.pause(!oui);
  }

  return { canvas, dessiner, activer, surQuitter: (f) => (quitter = f) };
}

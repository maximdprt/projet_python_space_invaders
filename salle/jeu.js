// Dessine sur un canvas 800x600 l'état envoyé par Python. Aucune règle du jeu ici.
const L = 800, H = 600;

const COULEURS = {
  meduse: "#22f5ff", crabe: "#ff2bd6", poulpe: "#7dff3a", blinde: "#ffc83d", soucoupe: "#ff3b3b",
  chasseur: "#22f5ff", intercepteur: "#3aa8ff", faucon: "#a85cff", croiseur: "#ffc83d", dreadnought: "#ff2bd6",
  tir: "#22f5ff", laser: "#bfe6ff", plasma: "#ff2bd6", bombe: "#ff9d2b",
};
const PALETTE = { O: "#7a4b00", W: "#eef8ff", C: "#22f5ff", B: "#3a7bff", V: "#a85cff", G: "#ffc83d", D: "#5a5f7a", R: "#ff2bd6" };
const ECHELLES = { soucoupe: 3.5, chasseur: 4, intercepteur: 3.4 };

// Pixel art : "/" sépare les lignes, "." = vide, X = couleur de l'entité.
const SPRITES = {
  poulpe: ["...XX.../..XXXX../.XXXXXX./XX.XX.XX/XXXXXXXX/..X..X../.X.XX.X./X.X..X.X",
    "...XX.../..XXXX../.XXXXXX./XX.XX.XX/XXXXXXXX/.X.XX.X./X......X/.X....X."],
  crabe: ["..X.....X../...X...X.../..XXXXXXX../.XX.XXX.XX./XXXXXXXXXXX/X.XXXXXXX.X/X.X.....X.X/...XX.XX...",
    "..X.....X../X..X...X..X/X.XXXXXXX.X/XXX.XXX.XXX/XXXXXXXXXXX/.XXXXXXXXX./..X.....X../.X.......X."],
  meduse: ["....XXXX..../.XXXXXXXXXX./XXXXXXXXXXXX/XXX..XX..XXX/XXXXXXXXXXXX/...XX..XX.../..XX.XX.XX../XX........XX",
    "....XXXX..../.XXXXXXXXXX./XXXXXXXXXXXX/XXX..XX..XXX/XXXXXXXXXXXX/..XXX..XXX../.XX..XX..XX./..XX....XX.."],
  blinde: ["..XXXXXXXX../.XOOOOOOOOX./XXOXXXXXXOXX/XOX.XXXX.XOX/XXXXXXXXXXXX/XOOXXOOXXOOX/.XX.XXXX.XX./XX..X..X..XX",
    "..XXXXXXXX../.XOOOOOOOOX./XXOXXXXXXOXX/XOX.XXXX.XOX/XXXXXXXXXXXX/XOOXXOOXXOOX/.XX.XXXX.XX./.XX.X..X.XX."],
  soucoupe: [".....XXXXXX...../...XXXXXXXXXX.../..XXXXXXXXXXXX../.XX.XX.XX.XX.XX./XXXXXXXXXXXXXXXX/..XXX..XX..XXX../...X........X..."],
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
    const motifs = SPRITES[sorte] || SPRITES.meduse;
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

function centrer(ctx, img, e, taille = 1) {
  const l = img.width * taille, h = img.height * taille;
  ctx.drawImage(img, e.x + e.largeur / 2 - l / 2, e.y + e.hauteur / 2 - h / 2, l, h);
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

export function creerEcranJeu() {
  const canvas = document.createElement("canvas");
  canvas.width = L; canvas.height = H;
  const ctx = canvas.getContext("2d");
  let etat = null, particules = [], secousse = 0, palier = 1, banniere = null;

  function texte(t, x, y, taille = 16, couleur = "#fff", align = "center") {
    ctx.font = `${taille}px Pixel`;
    ctx.textAlign = align;
    ctx.fillStyle = couleur;
    ctx.shadowColor = couleur;
    ctx.shadowBlur = 12;
    ctx.fillText(t, x, y);
    ctx.shadowBlur = 0;
  }

  function recevoir(nouvelEtat) {
    etat = nouvelEtat;
    if (etat.statut === "accueil") banniere = null;
    for (const ev of etat.evenements) {
      if (ev.type === "touche") secousse = 14;
      if (ev.type === "explosion") for (let i = 0; i < 16; i++) {
        const a = Math.random() * 6.28, v = 1 + Math.random() * 4;
        particules.push({ x: ev.x + 18, y: ev.y + 13, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 30, c: COULEURS[ev.sorte] });
      }
    }
    if (etat.palier > palier) banniere = { t: 150, texte: `PALIER ${etat.palier} - ${etat.nom_palier}`, sorte: etat.vaisseau.sorte };
    palier = etat.palier;
  }

  function hud(etat, temps) {
    texte(`SCORE ${etat.score}`, 16, 30, 14, "#fff", "left");
    texte(`HI ${Math.max(etat.score, etat.meilleur_score)}`, L / 2, 30, 14, "#ffc83d");
    texte(`VAGUE ${etat.vague}`, L - 16, 30, 14, "#22f5ff", "right");
    texte(etat.nom_palier, 16, 56, 10, COULEURS[etat.vaisseau.sorte], "left");
    if (etat.prochain_seuil > 0) {
      ctx.fillStyle = "#ffffff22";
      ctx.fillRect(120, 48, 160, 8);
      ctx.fillStyle = COULEURS[etat.vaisseau.sorte];
      ctx.fillRect(120, 48, 160 * Math.min(1, etat.ennemis_tues / etat.prochain_seuil), 8);
    }
    const icone = sprite(etat.vaisseau.sorte, 0);
    for (let i = 0; i < etat.vies; i++) ctx.drawImage(icone, 12 + i * 40, H - 28, icone.width * 0.4, icone.height * 0.4);
    ctx.fillStyle = "#ff2bd6";
    ctx.fillRect(0, 575, L, 2);
    if (banniere && banniere.t-- > 0) {
      texte(banniere.texte, L / 2, 250, 22, COULEURS[banniere.sorte]);
      centrer(ctx, sprite(banniere.sorte, 0), { x: L / 2, y: 320, largeur: 0, hauteur: 0 }, 1.6);
    }
    if (etat.attente && etat.statut === "en_cours") texte(`VAGUE ${etat.vague}`, L / 2, H / 2 + 120, 26, "#22f5ff");
  }

  function ecranTitre(etat, temps) {
    ctx.fillStyle = "rgba(5,0,15,.75)";
    ctx.fillRect(0, 0, L, H);
    if (etat.statut === "pause") return texte("PAUSE", L / 2, H / 2, 32, "#22f5ff");
    const perdu = etat.statut === "perdu";
    texte(perdu ? "GAME OVER" : "SPACE INVADERS", L / 2, 150, perdu ? 40 : 36, perdu ? "#ff3b3b" : "#ff2bd6");
    if (perdu) texte(`SCORE ${etat.score}   HI ${etat.meilleur_score}`, L / 2, 210, 16, "#ffc83d");
    ["poulpe", "crabe", "meduse", "blinde", "soucoupe"].forEach((sorte, i) => {
      centrer(ctx, sprite(sorte, Math.floor(temps / 500)), { x: 300, y: 250 + i * 46, largeur: 0, hauteur: 0 });
      texte(`= ${[30, 20, 10, 40, 150][i]} PTS`, 350, 258 + i * 46, 14, COULEURS[sorte], "left");
    });
    if (Math.floor(temps / 500) % 2) texte(perdu ? "ESPACE POUR REJOUER" : "APPUIE SUR ESPACE", L / 2, 520, 18, "#fff");
  }

  function dessiner(temps) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#05010d";
    ctx.fillRect(0, 0, L, H);
    for (const e of etoiles) {
      ctx.fillStyle = `rgba(200,220,255,${e.v / 1.6})`;
      ctx.fillRect(e.x, (e.y + temps * e.v * 0.03) % H, e.v > 1 ? 2 : 1, e.v > 1 ? 2 : 1);
    }
    if (!etat) return texte("CONNEXION AU JEU PYTHON...", L / 2, H / 2, 16, "#22f5ff");
    if (secousse > 0) ctx.translate((Math.random() - 0.5) * secousse, (Math.random() - 0.5) * secousse--);

    const image = Math.floor(temps / 400);
    for (const e of etat.ennemis) centrer(ctx, sprite(e.sorte, image), e);
    ctx.globalCompositeOperation = "lighter";
    for (const m of etat.missiles) {
      const laser = m.sorte === "laser", l = laser ? 6 : m.largeur, h = laser ? 34 : m.hauteur;
      ctx.fillStyle = COULEURS[m.sorte] + "55";
      ctx.fillRect(m.x - 3, m.y - 3, l + 6, h + 6);
      ctx.fillStyle = COULEURS[m.sorte];
      ctx.fillRect(m.x, m.y, l, h);
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
      centrer(ctx, sprite(v.sorte, 0), v);
    }
    hud(etat, temps);
    if (etat.statut !== "en_cours") ecranTitre(etat, temps);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(crt, 0, 0);
  }

  return { canvas, recevoir, dessiner };
}

// Dessin pixel-art néon de partie.etat() sur un canvas 2D (800x600 logique).
// Ce module ne prend aucune décision de jeu : il dessine ce que Python renvoie.
import {
  ENNEMIS, PALETTE_ENNEMI, COULEURS_SORTES, VAISSEAUX, PALETTES_VAISSEAUX, LUEUR_VAISSEAUX, dimensions,
} from "./sprites.js";
import { dessinerParticules, decalageTremblement, creerOverlayCRT } from "./effets.js";

const L = 800;
const H = 600;
const POLICE = '"Press Start 2P", monospace';
const TAILLES_ENNEMIS = { poulpe: 3.4, crabe: 3.1, meduse: 3, blinde: 3, soucoupe: 3.3 };

export function creerRenduJeu(facteurInitial = 2) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let facteur = 0;
  let cache = new Map();
  let overlay = null;
  let fond = null;
  const etoiles = creerEtoiles();
  let temps = 0;

  function definirFacteur(f) {
    if (f === facteur) return;
    facteur = f;
    canvas.width = L * f;
    canvas.height = H * f;
    cache = new Map();
    overlay = creerOverlayCRT(canvas.width, canvas.height);
    fond = creerFond(f);
  }
  definirFacteur(facteurInitial);

  function sprite(cle, lignes, palette, couleur, taille, lueur) {
    let c = cache.get(cle);
    if (c) return c;
    c = rendreSprite(lignes, palette, couleur, taille, lueur, facteur);
    cache.set(cle, c);
    return c;
  }

  function dessinerSprite(c, cx, cy, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(c, cx - c.largeurLogique / 2, cy - c.hauteurLogique / 2, c.largeurLogique, c.hauteurLogique);
    ctx.globalAlpha = 1;
  }

  function spriteEnnemi(sorte, image) {
    const images = ENNEMIS[sorte] || ENNEMIS.crabe;
    const couleur = COULEURS_SORTES[sorte] || "#ffffff";
    return sprite(`e-${sorte}-${image}`, images[image % images.length], PALETTE_ENNEMI, couleur, TAILLES_ENNEMIS[sorte] || 3, couleur);
  }

  function spriteVaisseau(apparence, tick, echelle = 1) {
    const def = VAISSEAUX[apparence] || VAISSEAUX.chasseur;
    const palette = { ...PALETTES_VAISSEAUX[apparence] };
    let lueur = LUEUR_VAISSEAUX[apparence] || "#22f5ff";
    let variante = 0;
    if (apparence === "dreadnought") {
      variante = Math.floor(tick / 5) % 12;
      palette.R = `hsl(${variante * 30}, 100%, 62%)`;
      lueur = `hsl(${variante * 30 + 60}, 100%, 60%)`;
    }
    return sprite(`v-${apparence}-${variante}-${echelle}`, def.lignes, palette, "#ffffff", def.taille * echelle, lueur);
  }

  function dessinerFond(dt, intensite = 1) {
    ctx.drawImage(fond, 0, 0, L, H);
    for (const couche of etoiles) {
      ctx.fillStyle = couche.couleur;
      for (const e of couche.liste) {
        e.y += couche.vitesse * dt * intensite;
        if (e.y > H) {
          e.y -= H;
          e.x = Math.random() * L;
        }
        const scintille = 0.6 + 0.4 * Math.sin(temps * 3 + e.x);
        ctx.globalAlpha = couche.alpha * scintille;
        ctx.fillRect(e.x, e.y, couche.taille, couche.taille);
      }
    }
    ctx.globalAlpha = 1;
    dessinerGrille();
  }

  function dessinerGrille() {
    const horizon = 520;
    ctx.save();
    ctx.strokeStyle = "rgba(255,43,214,0.28)";
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(L / 2 + i * 22, horizon);
      ctx.lineTo(L / 2 + i * 110, H);
      ctx.stroke();
    }
    const defilement = (temps * 0.6) % 1;
    for (let i = 0; i < 7; i++) {
      const p = (i + defilement) / 7;
      const y = horizon + (H - horizon) * p * p;
      ctx.globalAlpha = 0.15 + p * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(L, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function dessinerEnnemis(etat) {
    const image = Math.floor(etat.tick / 30) % 2;
    for (const e of etat.ennemis) {
      const cx = e.x + e.largeur / 2;
      const cy = e.y + e.hauteur / 2;
      dessinerSprite(spriteEnnemi(e.sorte, image), cx, cy);
      if (e.sorte === "blinde" && e.pv < 3) dessinerFissures(e, cx, cy);
    }
    for (const s of etat.soucoupes) {
      const cx = s.x + s.largeur / 2;
      const cy = s.y + s.hauteur / 2;
      dessinerSprite(spriteEnnemi("soucoupe", Math.floor(etat.tick / 8) % 2), cx, cy);
      ctx.fillStyle = `rgba(255,59,59,${0.25 + 0.2 * Math.sin(temps * 12)})`;
      ctx.fillRect(cx - 20, cy + 12, 40, 3);
    }
  }

  function dessinerFissures(e, cx, cy) {
    ctx.save();
    ctx.strokeStyle = "rgba(20,8,0,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10);
    ctx.lineTo(cx - 3, cy - 2);
    ctx.lineTo(cx - 8, cy + 6);
    if (e.pv <= 1) {
      ctx.moveTo(cx + 12, cy - 9);
      ctx.lineTo(cx + 4, cy);
      ctx.lineTo(cx + 10, cy + 9);
      ctx.moveTo(cx - 3, cy - 2);
      ctx.lineTo(cx + 4, cy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function dessinerVaisseau(v, tick, alpha = 1) {
    if (v.invincible && Math.floor(tick / 5) % 2 === 0) alpha *= 0.35;
    const def = VAISSEAUX[v.apparence] || VAISSEAUX.chasseur;
    const c = spriteVaisseau(v.apparence, tick);
    const cx = v.x + v.largeur / 2;
    const bas = v.y + v.hauteur;
    const cy = bas - c.hauteurLogique / 2 + 10;
    if (v.apparence === "dreadnought") dessinerHalo(cx, cy, tick, alpha);
    dessinerFlammes(def, cx, cy + c.hauteurLogique / 2 - 12, alpha);
    dessinerSprite(c, cx, cy, alpha);
  }

  function dessinerHalo(cx, cy, tick, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const debut = (i / 12) * Math.PI * 2 + tick * 0.05;
      ctx.strokeStyle = `hsla(${i * 30 + tick * 4}, 100%, 60%, ${0.55 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 50, 30, 0, debut, debut + Math.PI / 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function dessinerFlammes(def, cx, yBas, alpha) {
    const largeur = def.lignes[0].length * def.taille;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    for (const r of def.reacteurs) {
      const x = cx - largeur / 2 + r * def.taille;
      const longueur = 10 + Math.random() * 9;
      const g = ctx.createLinearGradient(0, yBas, 0, yBas + longueur);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.3, "rgba(255,190,60,0.9)");
      g.addColorStop(1, "rgba(255,40,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 4, yBas);
      ctx.lineTo(x + 4, yBas);
      ctx.lineTo(x, yBas + longueur);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function dessinerMissiles(etat) {
    ctx.save();
    for (const m of etat.missiles) {
      const cx = m.x + m.largeur / 2;
      if (m.sorte === "simple") {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(34,245,255,0.25)";
        ctx.fillRect(m.x - 3, m.y - 2, m.largeur + 6, m.hauteur + 10);
        ctx.fillStyle = "#22f5ff";
        ctx.fillRect(m.x, m.y, m.largeur, m.hauteur);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(m.x + 1, m.y, m.largeur - 2, m.hauteur * 0.5);
      } else if (m.sorte === "laser") {
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createLinearGradient(0, m.y, 0, m.y + m.hauteur + 50);
        g.addColorStop(0, "rgba(140,200,255,0.9)");
        g.addColorStop(1, "rgba(60,120,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(m.x - 6, m.y, m.largeur + 12, m.hauteur + 50);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(m.x, m.y, m.largeur, m.hauteur);
      } else if (m.sorte === "plasma") {
        const pulse = 1 + 0.25 * Math.sin(temps * 20 + m.x);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,43,214,0.35)";
        ctx.beginPath();
        ctx.arc(cx, m.y + m.hauteur / 2, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff8af0";
        ctx.beginPath();
        ctx.arc(cx, m.y + m.hauteur / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.sorte === "bombe") {
        const cy = m.y + m.hauteur / 2;
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,140,30,0.35)";
        ctx.fillRect(cx - 10, cy - 10, 20, 20);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#ff9a1f";
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx + 7, cy);
        ctx.lineTo(cx, cy + 8);
        ctx.lineTo(cx - 7, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff1c2";
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      } else {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "#ffe14d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 3, m.y);
        ctx.lineTo(cx + 3, m.y + 5);
        ctx.lineTo(cx - 3, m.y + 10);
        ctx.lineTo(cx + 3, m.y + m.hauteur);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  }

  function texte(chaine, x, y, taille, couleur, alignement = "left", lueur = 0) {
    ctx.font = `${taille}px ${POLICE}`;
    ctx.textAlign = alignement;
    ctx.textBaseline = "middle";
    if (lueur > 0) {
      ctx.shadowColor = couleur;
      ctx.shadowBlur = lueur * facteur;
    }
    ctx.fillStyle = couleur;
    ctx.fillText(chaine, x, y);
    ctx.shadowBlur = 0;
  }

  function score6(n) {
    return String(Math.max(0, n | 0)).padStart(6, "0");
  }

  function dessinerHUD(etat) {
    ctx.fillStyle = "rgba(5,0,20,0.55)";
    ctx.fillRect(0, 0, L, 26);
    texte(`SCORE ${score6(etat.score)}`, 12, 14, 12, "#ffffff");
    texte(`HI ${score6(etat.meilleur_score)}`, L / 2, 14, 12, "#ffc83d", "center");
    texte(`VAGUE ${etat.vague}`, L - 12, 14, 12, "#22f5ff", "right");
    ctx.strokeStyle = "rgba(255,59,59,0.35)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.lineTo(L, 520);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(5,0,20,0.6)";
    ctx.fillRect(0, 576, L, 24);
    for (let i = 0; i < etat.vies; i++) {
      const icone = spriteVaisseau(etat.vaisseau.apparence, etat.tick, 0.42);
      dessinerSprite(icone, 22 + i * 34, 588);
    }
    dessinerProgression(etat);
  }

  function dessinerProgression(etat) {
    const couleur = LUEUR_VAISSEAUX[etat.vaisseau.apparence] || "#22f5ff";
    texte(`P${etat.palier} ${etat.nom_palier}`, 470, 588, 10, couleur, "right");
    const x = 482;
    const largeur = 300;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x, 583, largeur, 10);
    let part = 1;
    if (etat.prochain_seuil > 0) {
      part = Math.min(1, etat.ennemis_tues / etat.prochain_seuil);
    }
    ctx.fillStyle = couleur;
    ctx.fillRect(x, 583, largeur * part, 10);
    const libelle = etat.prochain_seuil > 0 ? `${etat.ennemis_tues}/${etat.prochain_seuil}` : "MAX";
    texte(libelle, x + largeur / 2, 588.5, 8, "#05020f", "center");
  }

  function dessinerBanniere(effets, tick) {
    const b = effets.banniere;
    if (!b) return;
    const t = 1 - b.vie / b.duree;
    const entree = Math.min(1, t * 6);
    const sortie = Math.min(1, b.vie * 3);
    const alpha = Math.min(entree, sortie);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (b.type === "palier") {
      ctx.fillStyle = "rgba(10,0,30,0.7)";
      ctx.fillRect(0, 200, L, 200);
      const c = spriteVaisseau(b.apparence, tick, 2.2);
      dessinerSprite(c, L / 2, 265 + Math.sin(temps * 4) * 4, alpha);
      texte(b.texte, L / 2, 345, 22 + (1 - entree) * 30, "#ffffff", "center", 18);
      texte("NOUVEAU VAISSEAU · NOUVELLE ARME", L / 2, 378, 10, LUEUR_VAISSEAUX[b.apparence] || "#22f5ff", "center", 6);
    } else {
      texte(b.texte, L / 2, 300, 34 + (1 - entree) * 30, "#22f5ff", "center", 20);
    }
    ctx.restore();
  }

  function voile(alpha) {
    ctx.fillStyle = `rgba(4,0,16,${alpha})`;
    ctx.fillRect(0, 0, L, H);
  }

  function clignote(periode = 0.9) {
    return temps % periode < periode * 0.62;
  }

  function dessinerAccueil(etat) {
    voile(0.35);
    texte("SPACE", L / 2, 108, 54, "#7dff3a", "center", 24);
    texte("INVADERS", L / 2, 172, 54, "#22f5ff", "center", 24);
    texte("EUGENIA ARCADE · PROJET 10", L / 2, 222, 11, "#ff2bd6", "center", 8);
    const lignes = [
      ["soucoupe", "= ? MYSTERE", "#ff3b3b"],
      ["blinde", "= 40 PTS (3 PV)", "#ffc83d"],
      ["poulpe", "= 30 PTS", "#7dff3a"],
      ["crabe", "= 20 PTS", "#ff2bd6"],
      ["meduse", "= 10 PTS", "#22f5ff"],
    ];
    lignes.forEach(([sorte, libelle, couleur], i) => {
      const y = 272 + i * 38;
      dessinerSprite(spriteEnnemi(sorte, Math.floor(etat.tick / 30) % 2), 312, y);
      texte(libelle, 350, y, 13, couleur);
    });
    if (clignote()) texte("APPUIE SUR ESPACE", L / 2, 488, 18, "#ffffff", "center", 12);
    texte("FLECHES BOUGER   ESPACE TIRER   P PAUSE   ECHAP QUITTER", L / 2, 530, 9, "#9aa3c7", "center");
    if (etat.meilleur_score > 0) texte(`MEILLEUR SCORE ${score6(etat.meilleur_score)}`, L / 2, 556, 10, "#ffc83d", "center");
  }

  function dessinerPause() {
    voile(0.55);
    texte("PAUSE", L / 2, 270, 44, "#ffffff", "center", 18);
    if (clignote()) texte("P POUR REPRENDRE", L / 2, 335, 14, "#22f5ff", "center", 8);
  }

  function dessinerGameOver(etat) {
    voile(0.6);
    texte("GAME OVER", L / 2, 200, 48, "#ff3b3b", "center", 24);
    texte(`SCORE ${score6(etat.score)}`, L / 2, 280, 18, "#ffffff", "center");
    texte(`MEILLEUR ${score6(etat.meilleur_score)}`, L / 2, 318, 14, "#ffc83d", "center");
    texte(`VAGUE ${etat.vague} · PALIER ${etat.palier} ${etat.nom_palier}`, L / 2, 352, 11, "#9aa3c7", "center");
    if (etat.score > 0 && etat.score >= etat.meilleur_score && clignote(0.5)) {
      texte("NOUVEAU RECORD !", L / 2, 392, 16, "#7dff3a", "center", 12);
    }
    if (clignote()) texte("ESPACE POUR REJOUER", L / 2, 450, 16, "#ffffff", "center", 10);
  }

  function commencer(dt) {
    temps += dt;
    ctx.setTransform(facteur, 0, 0, facteur, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  }

  function finir(effets) {
    if (effets && effets.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${effets.flash * 0.5})`;
      ctx.fillRect(0, 0, L, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(overlay, 0, 0);
  }

  function dessiner(etat, effets, dt) {
    commencer(dt);
    const jeuVisible = etat.statut !== "accueil";
    const choc = decalageTremblement(effets);
    ctx.save();
    ctx.translate(choc.x, choc.y);
    dessinerFond(dt, etat.statut === "en_cours" ? 1 : 0.3);
    if (jeuVisible) {
      dessinerEnnemis(etat);
      dessinerMissiles(etat);
      if (etat.statut !== "perdu") dessinerVaisseau(etat.vaisseau, etat.tick);
    }
    dessinerParticules(ctx, effets);
    ctx.restore();
    if (jeuVisible) dessinerHUD(etat);
    if (etat.statut === "accueil") dessinerAccueil(etat);
    if (etat.statut === "pause") dessinerPause();
    if (etat.statut === "perdu") dessinerGameOver(etat);
    if (etat.statut === "en_cours" || etat.statut === "pause") dessinerBanniere(effets, etat.tick);
    finir(effets);
  }

  function dessinerChargement(progression, message, dt) {
    commencer(dt);
    dessinerFond(dt, 0.5);
    texte("SPACE INVADERS", L / 2, 220, 34, "#22f5ff", "center", 16);
    texte(message, L / 2, 300, 12, "#ffffff", "center");
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(200, 330, 400, 14);
    ctx.fillStyle = "#ff2bd6";
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 12 * facteur;
    ctx.fillRect(200, 330, 400 * progression, 14);
    ctx.shadowBlur = 0;
    texte("Le jeu tourne en Python dans le navigateur (Pyodide)", L / 2, 380, 9, "#9aa3c7", "center");
    finir(null);
  }

  function dessinerErreur(message, dt) {
    commencer(dt);
    ctx.fillStyle = "#12000a";
    ctx.fillRect(0, 0, L, H);
    texte("ERREUR PYTHON", 24, 30, 18, "#ff3b3b", "left", 8);
    ctx.font = "13px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "#ff8080";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const lignes = [];
    for (const brute of String(message).split("\n")) {
      for (let i = 0; i < Math.max(1, brute.length); i += 100) lignes.push(brute.slice(i, i + 100));
    }
    lignes.slice(-34).forEach((ligne, i) => ctx.fillText(ligne, 24, 62 + i * 15));
    finir(null);
  }

  return { canvas, dessiner, dessinerChargement, dessinerErreur, definirFacteur, spriteVaisseau };
}

function rendreSprite(lignes, palette, couleur, taille, lueur, facteur) {
  const { largeur, hauteur } = dimensions(lignes);
  const marge = 10;
  const largeurLogique = largeur * taille + marge * 2;
  const hauteurLogique = hauteur * taille + marge * 2;
  const net = document.createElement("canvas");
  net.width = Math.ceil(largeurLogique * facteur);
  net.height = Math.ceil(hauteurLogique * facteur);
  const n = net.getContext("2d");
  const p = taille * facteur;
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const car = lignes[y][x];
      if (car === ".") continue;
      n.fillStyle = car === "X" ? couleur : palette[car] || couleur;
      n.fillRect(Math.floor(marge * facteur + x * p), Math.floor(marge * facteur + y * p), Math.ceil(p), Math.ceil(p));
    }
  }
  const final = document.createElement("canvas");
  final.width = net.width;
  final.height = net.height;
  const f = final.getContext("2d");
  f.shadowColor = lueur;
  f.shadowBlur = 9 * facteur;
  f.drawImage(net, 0, 0);
  f.globalAlpha = 0.6;
  f.drawImage(net, 0, 0);
  f.shadowBlur = 0;
  f.globalAlpha = 1;
  f.drawImage(net, 0, 0);
  final.largeurLogique = largeurLogique;
  final.hauteurLogique = hauteurLogique;
  return final;
}

function creerEtoiles() {
  const couches = [
    { nombre: 90, vitesse: 8, taille: 1, alpha: 0.5, couleur: "#9fb4ff" },
    { nombre: 50, vitesse: 20, taille: 2, alpha: 0.7, couleur: "#ffffff" },
    { nombre: 18, vitesse: 45, taille: 2, alpha: 0.9, couleur: "#ffd1f5" },
  ];
  return couches.map((c) => ({
    ...c,
    liste: Array.from({ length: c.nombre }, () => ({ x: Math.random() * L, y: Math.random() * H })),
  }));
}

function creerFond(facteur) {
  const c = document.createElement("canvas");
  c.width = L * facteur;
  c.height = H * facteur;
  const ctx = c.getContext("2d");
  ctx.scale(facteur, facteur);
  const ciel = ctx.createLinearGradient(0, 0, 0, H);
  ciel.addColorStop(0, "#03010d");
  ciel.addColorStop(0.7, "#0a0322");
  ciel.addColorStop(1, "#1a0530");
  ctx.fillStyle = ciel;
  ctx.fillRect(0, 0, L, H);
  const nebuleuses = [
    [180, 160, 220, "rgba(120,40,200,0.18)"],
    [640, 260, 260, "rgba(255,43,214,0.10)"],
    [420, 420, 300, "rgba(34,120,255,0.10)"],
  ];
  for (const [x, y, r, couleur] of nebuleuses) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, couleur);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, H);
  }
  return c;
}

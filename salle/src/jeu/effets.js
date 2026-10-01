// Effets visuels déclenchés par etat.evenements (purement décoratifs).
import { COULEURS_SORTES } from "./sprites.js";

export function creerEffets() {
  return {
    particules: [],
    anneaux: [],
    flash: 0,
    tremblement: 0,
    banniere: null,
  };
}

function exploser(effets, x, y, couleur, nombre, force) {
  for (let i = 0; i < nombre; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vitesse = (0.4 + Math.random()) * force;
    effets.particules.push({
      x,
      y,
      vx: Math.cos(angle) * vitesse,
      vy: Math.sin(angle) * vitesse,
      vie: 1,
      duree: 0.5 + Math.random() * 0.6,
      taille: Math.random() < 0.3 ? 4 : 3,
      couleur,
    });
  }
}

export function appliquerEvenements(effets, evenements) {
  for (const ev of evenements) {
    if (ev.type === "explosion") {
      const couleur = COULEURS_SORTES[ev.sorte] || "#ffffff";
      const grosse = ev.sorte === "soucoupe" || ev.sorte === "blinde";
      exploser(effets, ev.x + 18, ev.y + 13, couleur, grosse ? 46 : 26, grosse ? 260 : 190);
      exploser(effets, ev.x + 18, ev.y + 13, "#ffffff", 8, 120);
      effets.anneaux.push({ x: ev.x + 18, y: ev.y + 13, r: 4, vie: 1, couleur, vitesse: 160 });
      effets.flash = Math.max(effets.flash, grosse ? 0.25 : 0.08);
    } else if (ev.type === "impact") {
      exploser(effets, ev.x, ev.y, "#ffe9a8", 6, 120);
    } else if (ev.type === "annulation") {
      exploser(effets, ev.x, ev.y, "#ffffff", 10, 140);
    } else if (ev.type === "vaisseau_touche") {
      exploser(effets, ev.x + 26, ev.y + 15, "#ff4d6d", 40, 230);
      effets.tremblement = 0.5;
      effets.flash = 0.45;
    } else if (ev.type === "palier") {
      effets.banniere = { type: "palier", texte: `PALIER ${ev.numero} — ${ev.nom}`, apparence: ev.apparence, vie: 3.2, duree: 3.2 };
      effets.anneaux.push({ x: 400, y: 555, r: 10, vie: 1, couleur: "#ffffff", vitesse: 650 });
      effets.anneaux.push({ x: 400, y: 555, r: 4, vie: 1, couleur: "#ff2bd6", vitesse: 480 });
      effets.flash = 0.7;
    } else if (ev.type === "vague") {
      if (!effets.banniere || effets.banniere.type !== "palier") {
        effets.banniere = { type: "vague", texte: `VAGUE ${ev.numero}`, vie: 1.6, duree: 1.6 };
      }
    } else if (ev.type === "defaite") {
      effets.tremblement = 0.8;
      effets.flash = 0.6;
    }
  }
}

export function mettreAJourEffets(effets, dt) {
  const restantes = [];
  for (const p of effets.particules) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy = p.vy * 0.96 + 30 * dt;
    p.vie -= dt / p.duree;
    if (p.vie > 0) restantes.push(p);
  }
  effets.particules = restantes;
  effets.anneaux = effets.anneaux.filter((a) => {
    a.r += a.vitesse * dt;
    a.vie -= dt * 1.6;
    return a.vie > 0;
  });
  effets.flash = Math.max(0, effets.flash - dt * 2.2);
  effets.tremblement = Math.max(0, effets.tremblement - dt);
  if (effets.banniere) {
    effets.banniere.vie -= dt;
    if (effets.banniere.vie <= 0) effets.banniere = null;
  }
}

export function dessinerParticules(ctx, effets) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of effets.particules) {
    ctx.globalAlpha = Math.max(0, p.vie);
    ctx.fillStyle = p.couleur;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.taille, p.taille);
  }
  for (const a of effets.anneaux) {
    ctx.globalAlpha = Math.max(0, a.vie) * 0.8;
    ctx.strokeStyle = a.couleur;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function decalageTremblement(effets) {
  if (effets.tremblement <= 0) return { x: 0, y: 0 };
  const force = effets.tremblement * 14;
  return { x: (Math.random() - 0.5) * force, y: (Math.random() - 0.5) * force };
}

// Overlay CRT pré-calculé : scanlines, vignette, légère aberration chromatique sur les bords.
export function creerOverlayCRT(largeur, hauteur) {
  const c = document.createElement("canvas");
  c.width = largeur;
  c.height = hauteur;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  for (let y = 0; y < hauteur; y += 4) ctx.fillRect(0, y, largeur, 2);
  const vignette = ctx.createRadialGradient(largeur / 2, hauteur / 2, hauteur * 0.35, largeur / 2, hauteur / 2, hauteur * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, largeur, hauteur);
  const gauche = ctx.createLinearGradient(0, 0, largeur * 0.08, 0);
  gauche.addColorStop(0, "rgba(255,0,60,0.10)");
  gauche.addColorStop(1, "rgba(255,0,60,0)");
  ctx.fillStyle = gauche;
  ctx.fillRect(0, 0, largeur * 0.08, hauteur);
  const droite = ctx.createLinearGradient(largeur, 0, largeur * 0.92, 0);
  droite.addColorStop(0, "rgba(0,120,255,0.12)");
  droite.addColorStop(1, "rgba(0,120,255,0)");
  ctx.fillStyle = droite;
  ctx.fillRect(largeur * 0.92, 0, largeur * 0.08, hauteur);
  return c;
}

// Textures procédurales dessinées en canvas (aucun fichier image à télécharger).
import * as THREE from "three";

export function textureCanvas(largeur, hauteur, dessiner, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  dessiner(canvas.getContext("2d"), largeur, hauteur);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = options.lineaire ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (options.repetition) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(options.repetition[0], options.repetition[1]);
  }
  return texture;
}

export function textureMoquette(rx, ry) {
  return textureCanvas(512, 512, (ctx, l, h) => {
    ctx.fillStyle = "#14061f";
    ctx.fillRect(0, 0, l, h);
    const pas = 128;
    for (let y = 0; y < h; y += pas) {
      for (let x = 0; x < l; x += pas) {
        ctx.save();
        ctx.translate(x + pas / 2, y + pas / 2);
        ctx.strokeStyle = "#3b0f4a";
        ctx.lineWidth = 6;
        ctx.strokeRect(-46, -46, 92, 92);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = "#b8862b";
        ctx.lineWidth = 3;
        ctx.strokeRect(-28, -28, 56, 56);
        ctx.fillStyle = "#6b1340";
        ctx.fillRect(-10, -10, 20, 20);
        ctx.restore();
        ctx.fillStyle = "#22f5ff";
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }, { repetition: [rx, ry] });
}

export function textureDalles(rx, ry) {
  return textureCanvas(256, 256, (ctx, l, h) => {
    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, l, h);
    ctx.strokeStyle = "rgba(180,140,60,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, l - 3, h - 3);
  }, { repetition: [rx, ry] });
}

export function textureTapisRouge(longueur) {
  return textureCanvas(128, 512, (ctx, l, h) => {
    const g = ctx.createLinearGradient(0, 0, l, 0);
    g.addColorStop(0, "#4a0610");
    g.addColorStop(0.5, "#8a0d1e");
    g.addColorStop(1, "#4a0610");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, h);
    ctx.fillStyle = "#d4a43a";
    ctx.fillRect(6, 0, 5, h);
    ctx.fillRect(l - 11, 0, 5, h);
    for (let y = 0; y < h; y += 64) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ffd27a";
      ctx.beginPath();
      ctx.moveTo(l / 2, y + 10);
      ctx.lineTo(l / 2 + 18, y + 32);
      ctx.lineTo(l / 2, y + 54);
      ctx.lineTo(l / 2 - 18, y + 32);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, { repetition: [1, longueur / 2] });
}

export function textureMur(rx) {
  return textureCanvas(512, 512, (ctx, l, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0b0614");
    g.addColorStop(1, "#130a20");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, h);
    for (let x = 0; x < l; x += 128) {
      const p = ctx.createLinearGradient(x, 0, x + 128, 0);
      p.addColorStop(0, "rgba(255,255,255,0.02)");
      p.addColorStop(0.5, "rgba(255,255,255,0.06)");
      p.addColorStop(1, "rgba(0,0,0,0.2)");
      ctx.fillStyle = p;
      ctx.fillRect(x + 6, 40, 116, h - 80);
      ctx.strokeStyle = "rgba(200,155,70,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, 40, 116, h - 80);
    }
  }, { repetition: [rx, 1] });
}

export function textureEnseigne(lignes, largeur = 2048, hauteur = 512) {
  return textureCanvas(largeur, hauteur, (ctx, l, h) => {
    ctx.clearRect(0, 0, l, h);
    const n = lignes.length;
    lignes.forEach((ligne, i) => {
      const y = (h / (n + 1)) * (i + 1);
      ctx.font = `900 ${ligne.taille}px "Orbitron", "Arial Black", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.shadowColor = ligne.couleur;
      ctx.shadowBlur = 40;
      ctx.strokeStyle = ligne.couleur;
      ctx.lineWidth = ligne.taille * 0.09;
      ctx.strokeText(ligne.texte, l / 2, y);
      ctx.shadowBlur = 12;
      ctx.lineWidth = ligne.taille * 0.035;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(ligne.texte, l / 2, y);
    });
  });
}

// Déplacement FPS : ZQSD / WASD / flèches + souris (PointerLock), collisions 2D au sol.
import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { SALLE } from "./architecture.js";

const HAUTEUR_YEUX = 1.65;
const RAYON = 0.32;
const VITESSE_MARCHE = 2.6;
const VITESSE_COURSE = 4.6;

export function creerControles(camera, domElement, obstacles) {
  const controles = new PointerLockControls(camera, domElement);
  controles.pointerSpeed = 0.8;
  const touches = new Set();
  let actif = true;
  let phase = 0;
  const avant = new THREE.Vector3();
  const droite = new THREE.Vector3();

  window.addEventListener("keydown", (e) => {
    if (!actif) return;
    touches.add(e.code);
    touches.add(e.key.toLowerCase());
  });
  window.addEventListener("keyup", (e) => {
    touches.delete(e.code);
    touches.delete(e.key.toLowerCase());
  });
  window.addEventListener("blur", () => touches.clear());

  const appui = (...noms) => noms.some((n) => touches.has(n));

  function bloque(x, z) {
    if (x < SALLE.minX + RAYON || x > SALLE.maxX - RAYON || z < SALLE.minZ + RAYON || z > SALLE.maxZ - RAYON) return true;
    for (const o of obstacles) {
      if (x > o.minX - RAYON && x < o.maxX + RAYON && z > o.minZ - RAYON && z < o.maxZ + RAYON) return true;
    }
    return false;
  }

  function miseAJour(dt) {
    if (!actif || !controles.isLocked) return;
    let dirAvant = 0;
    let dirCote = 0;
    if (appui("KeyW", "z", "w", "ArrowUp")) dirAvant += 1;
    if (appui("KeyS", "s", "ArrowDown")) dirAvant -= 1;
    if (appui("KeyD", "d", "ArrowRight")) dirCote += 1;
    if (appui("KeyA", "q", "a", "ArrowLeft")) dirCote -= 1;
    const enMouvement = dirAvant !== 0 || dirCote !== 0;
    const vitesse = appui("ShiftLeft", "ShiftRight") ? VITESSE_COURSE : VITESSE_MARCHE;

    camera.getWorldDirection(avant);
    avant.y = 0;
    avant.normalize();
    droite.crossVectors(avant, camera.up).normalize();
    const deplacement = new THREE.Vector3()
      .addScaledVector(avant, dirAvant)
      .addScaledVector(droite, dirCote);
    if (deplacement.lengthSq() > 0) deplacement.normalize().multiplyScalar(vitesse * dt);

    const p = camera.position;
    if (!bloque(p.x + deplacement.x, p.z)) p.x += deplacement.x;
    if (!bloque(p.x, p.z + deplacement.z)) p.z += deplacement.z;

    if (enMouvement) phase += dt * vitesse * 3.2;
    const balancement = enMouvement ? Math.sin(phase) * 0.028 : 0;
    p.y += (HAUTEUR_YEUX + balancement - p.y) * Math.min(1, dt * 12);
  }

  return {
    controles,
    miseAJour,
    definirActif(oui) {
      actif = oui;
      if (!oui) touches.clear();
    },
    verrouiller() {
      controles.lock();
    },
    deverrouiller() {
      controles.unlock();
    },
    estVerrouille: () => controles.isLocked,
  };
}

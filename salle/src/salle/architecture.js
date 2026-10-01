// La salle : sol, murs, plafond, néons et décor casino-arcade.
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { textureMoquette, textureDalles, textureTapisRouge, textureMur, textureEnseigne, textureCanvas } from "./textures.js";

export const SALLE = { minX: -9, maxX: 9, minZ: -13, maxZ: 9, hauteur: 4.6 };

const OR = new THREE.MeshPhysicalMaterial({ color: 0xc9a046, metalness: 1, roughness: 0.28 });
const LAQUE_NOIRE = new THREE.MeshPhysicalMaterial({ color: 0x050308, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
const VELOURS = new THREE.MeshStandardMaterial({ color: 0x5c0b2a, roughness: 0.95 });

function neon(couleur, intensite = 3) {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: couleur, emissiveIntensity: intensite });
}

export function creerArchitecture(scene) {
  const obstacles = [];
  const animes = [];
  const largeur = SALLE.maxX - SALLE.minX;
  const profondeur = SALLE.maxZ - SALLE.minZ;
  const centreZ = (SALLE.maxZ + SALLE.minZ) / 2;

  function bloquer(x, z, lx, lz) {
    obstacles.push({ minX: x - lx / 2, maxX: x + lx / 2, minZ: z - lz / 2, maxZ: z + lz / 2 });
  }

  // --- Sol : moquette casino + allée centrale de dalles noires réfléchissantes ---
  const moquette = new THREE.Mesh(
    new THREE.PlaneGeometry(largeur, profondeur),
    new THREE.MeshStandardMaterial({ map: textureMoquette(largeur / 2.2, profondeur / 2.2), roughness: 0.92 }),
  );
  moquette.rotation.x = -Math.PI / 2;
  moquette.position.set(0, 0, centreZ);
  moquette.receiveShadow = true;
  scene.add(moquette);

  const largeurAllee = 7.2;
  const miroir = new Reflector(new THREE.PlaneGeometry(largeurAllee, profondeur), {
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x6a6a7a,
  });
  miroir.rotation.x = -Math.PI / 2;
  miroir.position.set(0, 0.002, centreZ);
  scene.add(miroir);

  const dalles = new THREE.Mesh(
    new THREE.PlaneGeometry(largeurAllee, profondeur),
    new THREE.MeshStandardMaterial({
      map: textureDalles(largeurAllee / 1.2, profondeur / 1.2),
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.78,
    }),
  );
  dalles.rotation.x = -Math.PI / 2;
  dalles.position.set(0, 0.004, centreZ);
  dalles.receiveShadow = true;
  scene.add(dalles);

  for (const cote of [-1, 1]) {
    const liseré = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, profondeur), OR);
    liseré.position.set((cote * largeurAllee) / 2, 0.006, centreZ);
    scene.add(liseré);
  }

  // Tapis rouge vers la borne 10
  const longueurTapis = 13.2;
  const tapis = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, longueurTapis),
    new THREE.MeshStandardMaterial({ map: textureTapisRouge(longueurTapis), roughness: 0.9 }),
  );
  tapis.rotation.x = -Math.PI / 2;
  tapis.position.set(0, 0.008, 5.8 - longueurTapis / 2);
  tapis.receiveShadow = true;
  scene.add(tapis);

  // --- Murs ---
  const matMur = (rx) => new THREE.MeshStandardMaterial({ map: textureMur(rx), roughness: 0.6, metalness: 0.2 });
  const murs = [
    { l: largeur, pos: [0, SALLE.hauteur / 2, SALLE.minZ], rot: 0 },
    { l: largeur, pos: [0, SALLE.hauteur / 2, SALLE.maxZ], rot: Math.PI },
    { l: profondeur, pos: [SALLE.minX, SALLE.hauteur / 2, centreZ], rot: Math.PI / 2 },
    { l: profondeur, pos: [SALLE.maxX, SALLE.hauteur / 2, centreZ], rot: -Math.PI / 2 },
  ];
  for (const m of murs) {
    const mur = new THREE.Mesh(new THREE.PlaneGeometry(m.l, SALLE.hauteur), matMur(m.l / 4));
    mur.position.set(...m.pos);
    mur.rotation.y = m.rot;
    scene.add(mur);
  }

  // Bandes LED qui respirent
  const ledMagenta = neon(0xff2bd6, 2.2);
  const ledCyan = neon(0x22f5ff, 2.2);
  animes.push((t) => {
    ledMagenta.emissiveIntensity = 1.6 + Math.sin(t * 0.9) * 0.9;
    ledCyan.emissiveIntensity = 1.6 + Math.sin(t * 0.9 + Math.PI) * 0.9;
  });
  for (const y of [0.35, 3.55]) {
    const mat = y < 1 ? ledCyan : ledMagenta;
    for (const cote of [-1, 1]) {
      const bande = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, profondeur - 0.4), mat);
      bande.position.set(cote * (largeur / 2 - 0.02), y, centreZ);
      scene.add(bande);
    }
    const fond = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.4, 0.04, 0.03), mat);
    fond.position.set(0, y, SALLE.minZ + 0.02);
    scene.add(fond);
    const entree = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.4, 0.04, 0.03), mat);
    entree.position.set(0, y, SALLE.maxZ - 0.02);
    scene.add(entree);
  }

  // --- Plafond à caissons lumineux ---
  const plafond = new THREE.Mesh(new THREE.PlaneGeometry(largeur, profondeur), new THREE.MeshStandardMaterial({ color: 0x07040c, roughness: 0.8 }));
  plafond.rotation.x = Math.PI / 2;
  plafond.position.set(0, SALLE.hauteur, centreZ);
  scene.add(plafond);
  const matCaisson = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x9b7bff, emissiveIntensity: 0.55 });
  const matCadre = neon(0xffc27a, 0.75);
  for (let ix = -1; ix <= 1; ix++) {
    for (let iz = 0; iz < 4; iz++) {
      const x = ix * 5;
      const z = SALLE.minZ + 3 + iz * 5.4;
      const caisson = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.6), matCaisson);
      caisson.rotation.x = Math.PI / 2;
      caisson.position.set(x, SALLE.hauteur - 0.02, z);
      scene.add(caisson);
      const cadre = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.05, 3.9), matCadre);
      cadre.position.set(x, SALLE.hauteur - 0.06, z);
      cadre.scale.set(1, 1, 1);
      const creux = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.08, 3.75), new THREE.MeshBasicMaterial({ color: 0x07040c }));
      creux.position.copy(cadre.position);
      creux.position.y -= 0.005;
      scene.add(cadre, creux);
    }
  }

  // --- Colonnes laquées noires à liserés dorés ---
  for (const x of [SALLE.minX + 0.45, SALLE.maxX - 0.45]) {
    for (const z of [-11.2, -7.7, -2.3, 3.1, 7.9]) {
      const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, SALLE.hauteur, 24), LAQUE_NOIRE);
      colonne.position.set(x, SALLE.hauteur / 2, z);
      scene.add(colonne);
      for (const y of [0.15, 2.4, SALLE.hauteur - 0.2]) {
        const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.025, 8, 32), OR);
        anneau.rotation.x = Math.PI / 2;
        anneau.position.set(x, y, z);
        scene.add(anneau);
      }
      bloquer(x, z, 0.7, 0.7);
    }
  }

  // --- Grande enseigne néon « EUGENIA ARCADE » ---
  const texEnseigne = textureEnseigne([
    { texte: "EUGENIA", taille: 190, couleur: "#ff2bd6" },
    { texte: "ARCADE", taille: 150, couleur: "#22f5ff" },
  ]);
  const matEnseigne = new THREE.MeshBasicMaterial({ map: texEnseigne, transparent: true, toneMapped: false, color: 0xffffff });
  const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), matEnseigne);
  enseigne.position.set(0, 3.45, SALLE.minZ + 0.06);
  scene.add(enseigne);
  const panneau = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.1, 0.06), new THREE.MeshStandardMaterial({ color: 0x060309, roughness: 0.4 }));
  panneau.position.set(0, 3.45, SALLE.minZ + 0.03);
  scene.add(panneau);
  for (const [lx, ly, x, y] of [[7.8, 0.04, 0, 4.5], [7.8, 0.04, 0, 2.4], [0.04, 2.1, -3.9, 3.45], [0.04, 2.1, 3.9, 3.45]]) {
    const baguette = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, 0.04), OR);
    baguette.position.set(x, y, SALLE.minZ + 0.07);
    scene.add(baguette);
  }
  let prochainClignotement = 3;
  animes.push((t) => {
    if (t > prochainClignotement) {
      const phase = t - prochainClignotement;
      const allume = phase > 0.35 || Math.floor(phase * 22) % 2 === 0;
      matEnseigne.color.setScalar(allume ? 1 : 0.25);
      if (phase > 0.4) prochainClignotement = t + 4 + Math.random() * 7;
    }
  });

  // --- Boules à facettes + faisceaux colorés ---
  const matDisco = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.05, flatShading: true, envMapIntensity: 2.5 });
  const spots = [];
  for (const x of [-3.2, 3.2]) {
    const boule = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 2), matDisco);
    boule.position.set(x, SALLE.hauteur - 0.75, -1.5);
    const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.45), OR);
    fil.position.set(x, SALLE.hauteur - 0.22, -1.5);
    scene.add(boule, fil);
    animes.push((t) => (boule.rotation.y = t * 0.6));
  }
  const couleursSpots = [0xff2bd6, 0x22f5ff, 0xa85cff];
  couleursSpots.forEach((couleur, i) => {
    const spot = new THREE.SpotLight(couleur, 18, 14, 0.22, 0.6, 1.4);
    spot.position.set(i === 0 ? -3.2 : i === 1 ? 3.2 : 0, SALLE.hauteur - 0.8, -1.5);
    scene.add(spot, spot.target);
    spots.push(spot);
    animes.push((t) => {
      const a = t * (0.35 + i * 0.12) + i * 2.1;
      spot.target.position.set(Math.cos(a) * 4.5, 0, -2 + Math.sin(a * 1.3) * 5);
    });
  });

  // --- Machines à sous décoratives éteintes (fond de salle) ---
  const matMachine = new THREE.MeshPhysicalMaterial({ color: 0x1a0f24, roughness: 0.35, clearcoat: 0.8 });
  const matEcranEteint = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.05, metalness: 0.6 });
  const matLampe = neon(0xff3b3b, 0.6);
  for (const cote of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = cote * (4.6 + i * 1.05);
      const z = SALLE.minZ + 0.55;
      const caisson = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.7), matMachine);
      caisson.position.set(x, 0.8, z);
      const ecran = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), matEcranEteint);
      ecran.position.set(x, 1.1, z + 0.355);
      const bordure = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.72), OR);
      bordure.position.set(x, 1.6, z);
      const lampe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), matLampe);
      lampe.position.set(x, 1.62, z);
      const levier = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), OR);
      levier.position.set(x + 0.48, 1.05, z + 0.1);
      const pommeau = new THREE.Mesh(new THREE.SphereGeometry(0.05), neon(0xff2b2b, 1.5));
      pommeau.position.set(x + 0.48, 1.27, z + 0.1);
      scene.add(caisson, ecran, bordure, lampe, levier, pommeau);
    }
    bloquer(cote * 6.2, SALLE.minZ + 0.55, 4.4, 0.9);
  }

  // --- Banquettes en velours ---
  for (const cote of [-1, 1]) {
    const banquette = new THREE.Group();
    const assise = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.7), VELOURS);
    assise.position.y = 0.225;
    const dossier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.18), VELOURS);
    dossier.position.set(0, 0.7, -0.3);
    const socle = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.06, 0.75), OR);
    socle.position.y = 0.03;
    banquette.add(assise, dossier, socle);
    banquette.position.set(cote * 5.2, 0, SALLE.maxZ - 0.6);
    banquette.rotation.y = Math.PI;
    scene.add(banquette);
    bloquer(cote * 5.2, SALLE.maxZ - 0.6, 2.5, 0.9);
  }

  // --- Plantes ---
  const matPot = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.25, clearcoat: 1 });
  const matFeuille = new THREE.MeshStandardMaterial({ color: 0x0f5a32, roughness: 0.7, flatShading: true });
  for (const [x, z] of [[-2.6, SALLE.minZ + 0.6], [2.6, SALLE.minZ + 0.6], [-8.2, SALLE.maxZ - 0.7], [8.2, SALLE.maxZ - 0.7]]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.55, 20), matPot);
    pot.position.set(x, 0.275, z);
    scene.add(pot);
    for (let i = 0; i < 7; i++) {
      const feuille = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9, 5), matFeuille);
      const a = (i / 7) * Math.PI * 2;
      feuille.position.set(x + Math.cos(a) * 0.08, 0.95, z + Math.sin(a) * 0.08);
      feuille.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      scene.add(feuille);
    }
    bloquer(x, z, 0.65, 0.65);
  }

  // --- Comptoir TOKENS ---
  const comptoir = new THREE.Group();
  const corps = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.05, 2.6), LAQUE_NOIRE);
  corps.position.y = 0.525;
  const dessus = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 2.7), OR);
  dessus.position.y = 1.08;
  const bandeau = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 2.5), neon(0xffc83d, 3));
  bandeau.position.set(-0.46, 0.85, 0);
  comptoir.add(corps, dessus, bandeau);
  comptoir.position.set(6.4, 0, 5.2);
  scene.add(comptoir);
  bloquer(6.4, 5.2, 1.0, 2.7);
  const texTokens = textureEnseigne([{ texte: "TOKENS", taille: 200, couleur: "#ffc83d" }], 1024, 256);
  const tokens = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: texTokens, transparent: true, toneMapped: false }));
  tokens.position.set(SALLE.maxX - 0.05, 2.5, 5.2);
  tokens.rotation.y = -Math.PI / 2;
  scene.add(tokens);
  const pileJetons = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), OR);
  pileJetons.position.set(6.4, 1.17, 4.7);
  scene.add(pileJetons);

  // --- Poteaux dorés et cordons le long du tapis rouge ---
  const matCordon = new THREE.MeshStandardMaterial({ color: 0x8a0d1e, roughness: 0.6 });
  const zPoteaux = [3.6, 1.4, -0.8, -3.0, -5.2];
  for (const x of [-1.15, 1.15]) {
    zPoteaux.forEach((z, i) => {
      const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 12), OR);
      poteau.position.set(x, 0.475, z);
      const boule = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), OR);
      boule.position.set(x, 0.98, z);
      const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.04, 20), OR);
      pied.position.set(x, 0.02, z);
      scene.add(poteau, boule, pied);
      if (i < zPoteaux.length - 1) {
        const z2 = zPoteaux[i + 1];
        const courbe = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x, 0.9, z),
          new THREE.Vector3(x, 0.55, (z + z2) / 2),
          new THREE.Vector3(x, 0.9, z2),
        );
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(courbe, 20, 0.022, 8), matCordon));
      }
    });
    bloquer(x, (zPoteaux[0] + zPoteaux[zPoteaux.length - 1]) / 2, 0.3, zPoteaux[0] - zPoteaux[zPoteaux.length - 1] + 0.3);
  }

  // --- Poussière dans les faisceaux ---
  const nbPoussieres = 500;
  const positions = new Float32Array(nbPoussieres * 3);
  for (let i = 0; i < nbPoussieres; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = Math.random() * SALLE.hauteur;
    positions[i * 3 + 2] = SALLE.minZ + Math.random() * profondeur;
  }
  const geoPoussiere = new THREE.BufferGeometry();
  geoPoussiere.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const poussiere = new THREE.Points(
    geoPoussiere,
    new THREE.PointsMaterial({ color: 0xffd9f4, size: 0.01, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  scene.add(poussiere);
  animes.push((t, dt) => {
    const p = geoPoussiere.attributes.position.array;
    for (let i = 0; i < nbPoussieres; i++) {
      p[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0008 - dt * 0.02;
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] = SALLE.hauteur;
    }
    geoPoussiere.attributes.position.needsUpdate = true;
  });

  // --- Lumières d'ambiance ---
  scene.add(new THREE.HemisphereLight(0x6a4aa8, 0x12040c, 0.55));
  const lumMagenta = new THREE.PointLight(0xff2bd6, 9, 12, 1.6);
  lumMagenta.position.set(-6.5, 3, -2);
  const lumCyan = new THREE.PointLight(0x22f5ff, 9, 12, 1.6);
  lumCyan.position.set(6.5, 3, -2);
  const lumChaude = new THREE.PointLight(0xffb070, 6, 14, 1.4);
  lumChaude.position.set(0, 3.8, 4);
  const lumEnseigne = new THREE.PointLight(0xff4fe0, 6, 8, 1.5);
  lumEnseigne.position.set(0, 3.2, SALLE.minZ + 1.2);
  scene.add(lumMagenta, lumCyan, lumChaude, lumEnseigne);

  return {
    obstacles,
    miseAJour(t, dt) {
      for (const f of animes) f(t, dt);
    },
    definirQualite(q) {
      miroir.visible = q.reflets;
      dalles.material.opacity = q.reflets ? 0.78 : 1;
      spots.forEach((s) => (s.visible = q.bloom));
    },
  };
}

export { textureCanvas };

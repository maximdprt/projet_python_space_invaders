// Silhouettes d'ambiance low-poly à liserés néon, avec une respiration simple.
import * as THREE from "three";

const POSES = [
  { x: -5.2, z: -3.5, rot: -Math.PI / 2, couleur: 0x22f5ff, joue: true },
  { x: 5.25, z: 1.5, rot: Math.PI / 2, couleur: 0xff2bd6, joue: true },
  { x: 5.3, z: 4.4, rot: -Math.PI / 2 - 0.4, couleur: 0xffc83d, joue: false },
  { x: -3.6, z: 7.0, rot: Math.PI + 0.5, couleur: 0xa85cff, joue: false },
  { x: -2.8, z: 6.4, rot: -0.6, couleur: 0x7dff3a, joue: false },
];

function creerSilhouette(couleur) {
  const corps = new THREE.MeshStandardMaterial({ color: 0x0c0a12, roughness: 0.55, metalness: 0.3 });
  const neon = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: couleur, emissiveIntensity: 2.4 });
  const g = new THREE.Group();
  const jambes = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.85, 8), corps);
  jambes.position.y = 0.43;
  const buste = new THREE.Group();
  buste.position.y = 0.86;
  const torse = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 10), corps);
  torse.position.y = 0.32;
  const ceinture = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 24), neon);
  ceinture.rotation.x = Math.PI / 2;
  ceinture.position.y = 0.08;
  const tete = new THREE.Group();
  tete.position.y = 0.78;
  const crane = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), corps);
  const visiere = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.05), neon);
  visiere.position.set(0, 0.02, 0.1);
  tete.add(crane, visiere);
  const bras = [];
  for (const cote of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.42, 4, 8), corps);
    b.position.set(cote * 0.25, 0.32, 0.05);
    b.rotation.z = cote * 0.12;
    buste.add(b);
    bras.push(b);
  }
  buste.add(torse, ceinture, tete);
  g.add(jambes, buste);
  return { g, buste, tete, bras };
}

export function creerPersonnages(scene) {
  const liste = POSES.map((pose, i) => {
    const s = creerSilhouette(pose.couleur);
    s.g.position.set(pose.x, 0, pose.z);
    s.g.rotation.y = pose.rot;
    if (pose.joue) s.bras.forEach((b) => (b.rotation.x = -1.1));
    scene.add(s.g);
    return { ...s, decalage: i * 1.7, joue: pose.joue };
  });
  return {
    obstacles: POSES.map((p) => ({ minX: p.x - 0.3, maxX: p.x + 0.3, minZ: p.z - 0.3, maxZ: p.z + 0.3 })),
    miseAJour(t) {
      for (const p of liste) {
        p.buste.scale.y = 1 + Math.sin(t * 1.8 + p.decalage) * 0.015;
        p.tete.rotation.y = Math.sin(t * 0.5 + p.decalage) * (p.joue ? 0.1 : 0.45);
        if (p.joue) p.bras.forEach((b, i) => (b.rotation.z = (i ? 1 : -1) * 0.12 + Math.sin(t * 9 + i * 2) * 0.05));
      }
    },
  };
}

// Visée des bornes (raycast depuis le centre de l'écran) et zoom caméra vers un écran.
import * as THREE from "three";

const PORTEE = 2.5;

export function creerInteraction(camera, bornes) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = PORTEE;
  const centre = new THREE.Vector2(0, 0);
  const zones = bornes.map((b) => b.zoneVisee);
  let transition = null;

  function borneVisee() {
    raycaster.setFromCamera(centre, camera);
    const touches = raycaster.intersectObjects(zones, false);
    if (touches.length === 0) return null;
    const numero = touches[0].object.userData.numero;
    return bornes.find((b) => b.projet.numero === numero) || null;
  }

  // Position de caméra qui cadre l'écran de la borne en plein écran.
  function cadrageEcran(borne) {
    const ecran = borne.ecran;
    ecran.updateWorldMatrix(true, false);
    const centreEcran = new THREE.Vector3();
    ecran.getWorldPosition(centreEcran);
    const normale = new THREE.Vector3(0, 0, 1).applyQuaternion(ecran.getWorldQuaternion(new THREE.Quaternion()));
    const hauteurEcran = 0.45;
    const largeurEcran = 0.6;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distHauteur = (hauteurEcran / 2) / Math.tan(fov / 2);
    const distLargeur = (largeurEcran / 2) / (Math.tan(fov / 2) * camera.aspect);
    const distance = Math.max(distHauteur, distLargeur) * 1.04;
    const position = centreEcran.clone().addScaledVector(normale, distance);
    // Matrix4.lookAt suit la convention caméra (on regarde vers -z).
    const rotation = new THREE.Matrix4().lookAt(position, centreEcran, new THREE.Vector3(0, 1, 0));
    return { position, quaternion: new THREE.Quaternion().setFromRotationMatrix(rotation) };
  }

  function lancerTransition(cible, duree, fin) {
    transition = {
      depuisPos: camera.position.clone(),
      depuisQuat: camera.quaternion.clone(),
      versPos: cible.position.clone(),
      versQuat: cible.quaternion.clone(),
      t: 0,
      duree,
      fin,
    };
  }

  function miseAJour(dt) {
    if (!transition) return false;
    transition.t = Math.min(1, transition.t + dt / transition.duree);
    const x = transition.t;
    const lisse = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    camera.position.lerpVectors(transition.depuisPos, transition.versPos, lisse);
    camera.quaternion.slerpQuaternions(transition.depuisQuat, transition.versQuat, lisse);
    if (transition.t >= 1) {
      const fin = transition.fin;
      transition = null;
      if (fin) fin();
    }
    return true;
  }

  return {
    borneVisee,
    cadrageEcran,
    lancerTransition,
    miseAJour,
    enTransition: () => transition !== null,
  };
}

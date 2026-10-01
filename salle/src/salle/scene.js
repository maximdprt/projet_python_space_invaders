// Renderer, caméra, post-traitement (bloom) et réglage qualité.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const QUALITES = {
  bas: { pixelRatio: 1, bloom: false, ombres: false, reflets: false, facteurJeu: 1 },
  moyen: { pixelRatio: 1.25, bloom: true, ombres: false, reflets: true, facteurJeu: 2 },
  haut: { pixelRatio: 2, bloom: true, ombres: true, reflets: true, facteurJeu: 2 },
};

export function creerScene(conteneur) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  conteneur.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05030c);
  scene.fog = new THREE.FogExp2(0x07030f, 0.028);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 80);
  camera.position.set(0, 1.65, 6.5);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.75, 0.55, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let qualite = "moyen";
  const abonnes = [];

  function appliquerQualite(nom) {
    qualite = nom;
    const q = QUALITES[nom];
    const ratio = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
    renderer.setPixelRatio(ratio);
    composer.setPixelRatio(ratio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.enabled = q.bloom;
    abonnes.forEach((f) => f(q, nom));
  }

  function surQualite(f) {
    abonnes.push(f);
  }

  function qualiteSuivante() {
    const noms = Object.keys(QUALITES);
    appliquerQualite(noms[(noms.indexOf(qualite) + 1) % noms.length]);
    return qualite;
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  function rendre() {
    if (QUALITES[qualite].bloom) composer.render();
    else renderer.render(scene, camera);
  }

  return { renderer, scene, camera, composer, bloom, rendre, appliquerQualite, qualiteSuivante, surQualite, qualite: () => qualite };
}

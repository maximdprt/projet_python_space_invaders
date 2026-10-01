// État des touches du jeu (flèches, Espace, P, Échap). Ne lit que le clavier.
const enfoncees = new Set();
const ecouteurs = { pause: [], quitter: [] };
let actif = false;

const TOUCHES_JEU = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];

window.addEventListener("keydown", (e) => {
  if (!actif) return;
  if (TOUCHES_JEU.includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  enfoncees.add(e.code);
  if (e.code === "KeyP") ecouteurs.pause.forEach((f) => f());
  if (e.code === "Escape") ecouteurs.quitter.forEach((f) => f());
});

window.addEventListener("keyup", (e) => enfoncees.delete(e.code));
window.addEventListener("blur", () => enfoncees.clear());

export function activerClavierJeu(oui) {
  actif = oui;
  if (!oui) enfoncees.clear();
}

export function lireCommandes() {
  return {
    gauche: enfoncees.has("ArrowLeft") || enfoncees.has("KeyA"),
    droite: enfoncees.has("ArrowRight") || enfoncees.has("KeyD"),
    tir: enfoncees.has("Space") || enfoncees.has("ArrowUp"),
  };
}

export function surPause(f) {
  ecouteurs.pause.push(f);
}

export function surQuitter(f) {
  ecouteurs.quitter.push(f);
}

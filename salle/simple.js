// Mode simple pour les PC sans carte graphique : le jeu seul, en 2D, sans la salle 3D.
import { creerJeu } from "./jeu.js";

await document.fonts.load("16px Pixel");
for (const id of ["accueil", "viseur", "info"]) document.getElementById(id).classList.add("cache");
document.body.classList.add("enjeu");
document.getElementById("aide").textContent = "← → BOUGER · ESPACE TIRER · P PAUSE · ÉCHAP SALLE 3D";

const jeu = creerJeu();
jeu.canvas.className = "plein";
document.body.append(jeu.canvas);
jeu.activer(true);
jeu.surQuitter(() => {
  location.hash = "";
  location.reload();
});
requestAnimationFrame(function boucle(temps) {
  jeu.dessiner(temps);
  requestAnimationFrame(boucle);
});

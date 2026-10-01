// Écran d'accueil de la salle (logo, bouton ENTRER, touches) + progression du chargement de Python.
export function creerEcranAccueil(surEntrer) {
  const el = document.createElement("div");
  el.id = "accueil";
  el.innerHTML = `
    <div class="logo">EUGENIA<span>ARCADE</span></div>
    <div class="sous-titre">ATELIER PYTHON · 10 PROJETS · À VOUS DE JOUER</div>
    <button id="bouton-entrer" type="button">ENTRER DANS LA SALLE</button>
    <div class="touches">
      <div><b>ZQSD</b> se déplacer</div><div><b>SOURIS</b> regarder</div>
      <div><b>MAJ</b> courir</div><div><b>E</b> jouer à une borne</div>
      <div><b>H</b> aide</div><div><b>F1</b> qualité</div>
    </div>
    <div class="chargement">
      <div id="texte-chargement">Préparation de Python…</div>
      <div class="barre"><div id="barre-chargement"></div></div>
    </div>
  `;
  document.body.appendChild(el);
  const barre = el.querySelector("#barre-chargement");
  const texte = el.querySelector("#texte-chargement");
  el.querySelector("#bouton-entrer").addEventListener("click", () => surEntrer());

  const reprendre = document.createElement("div");
  reprendre.id = "reprendre";
  reprendre.innerHTML = `<div>CLIQUE POUR REPRENDRE</div><small>ZQSD + SOURIS · E POUR JOUER · H AIDE</small>`;
  reprendre.addEventListener("click", () => surEntrer());
  document.body.appendChild(reprendre);

  return {
    progression(valeur, message) {
      barre.style.width = `${Math.round(valeur * 100)}%`;
      texte.textContent = message;
    },
    cacher() {
      el.classList.add("cache");
      reprendre.classList.remove("visible");
    },
    afficherReprendre(oui) {
      if (!el.classList.contains("cache")) return;
      reprendre.classList.toggle("visible", oui);
    },
  };
}

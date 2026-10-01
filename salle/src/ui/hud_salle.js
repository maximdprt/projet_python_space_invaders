// Interface de la salle : viseur, info-bulle, aide, messages.
export function creerHudSalle() {
  const racine = document.createElement("div");
  racine.className = "calque";
  racine.innerHTML = `
    <div id="viseur"></div>
    <div id="infobulle"></div>
    <div id="aide">
      <h3>AIDE</h3>
      <div><b>Z Q S D</b> / WASD / flèches : se déplacer</div>
      <div><b>Maj</b> : courir · <b>Souris</b> : regarder</div>
      <div><b>E</b> : jouer à la borne visée</div>
      <div><b>Dans le jeu</b> : ← → bouger, Espace tirer, P pause</div>
      <div><b>Échap</b> : quitter la borne / libérer la souris</div>
      <div><b>F1</b> : qualité graphique · <b>H</b> : cette aide</div>
    </div>
    <div id="indications">H AIDE · F1 QUALITE <span id="qualite"></span></div>
    <div id="mode-jeu">FLECHES BOUGER · ESPACE TIRER · P PAUSE · ECHAP QUITTER LA BORNE</div>
    <div id="toast"></div>
  `;
  document.body.appendChild(racine);
  const viseur = racine.querySelector("#viseur");
  const infobulle = racine.querySelector("#infobulle");
  const aide = racine.querySelector("#aide");
  const toast = racine.querySelector("#toast");
  const qualite = racine.querySelector("#qualite");
  const modeJeu = racine.querySelector("#mode-jeu");
  const indications = racine.querySelector("#indications");
  let minuteurToast = null;
  let derniereBorne = null;

  return {
    afficherVisee(borne) {
      if (borne === derniereBorne) return;
      derniereBorne = borne;
      viseur.classList.toggle("actif", Boolean(borne));
      infobulle.classList.toggle("visible", Boolean(borne));
      if (borne) {
        const p = borne.projet;
        const action = p.type === "integre" ? "Jouer" : p.disponible ? "Lancer" : "Bientôt";
        infobulle.innerHTML = `<span class="touche">[E]</span> ${action} — ${p.numero} · ${p.nom} · ${p.binome}`;
      }
    },
    basculerAide() {
      aide.classList.toggle("visible");
    },
    message(texte, duree = 3000) {
      toast.textContent = texte;
      toast.classList.add("visible");
      clearTimeout(minuteurToast);
      minuteurToast = setTimeout(() => toast.classList.remove("visible"), duree);
    },
    afficherQualite(nom) {
      qualite.textContent = `(${nom.toUpperCase()})`;
    },
    modeJeu(oui) {
      viseur.style.display = oui ? "none" : "";
      infobulle.style.display = oui ? "none" : "";
      indications.style.display = oui ? "none" : "";
      modeJeu.classList.toggle("visible", oui);
      if (oui) derniereBorne = undefined;
    },
  };
}

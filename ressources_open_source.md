# Ressources open source pour la salle Eugenia Arcade

Sélection pour la partie Three.js / Vite (dossier `salle/`), pas pour les fichiers Python du jeu (qui doivent rester dans les notions du cours).
Licences vérifiées sur la page de chaque projet le 2026-10-01, sauf mention « à vérifier ».

## 1. Modèles 3D de bornes

| Ressource | Licence | Ce que tu peux reprendre |
|---|---|---|
| [Kenney Mini Arcade](https://kenney.nl/assets/mini-arcade) | CC0 (domaine public, aucune attribution obligatoire) | 10 bornes d'arcade, 2 personnages animés, caisse et présentoir à lots. Fourni en glTF, FBX et OBJ : le glTF se charge directement avec `GLTFLoader`. Le plus simple pour remplacer des bornes faites en cubes. |
| [Poly Pizza](https://poly.pizza) (recherche « arcade ») | CC0 ou CC-BY selon le modèle | Bornes, flippers, néons. Pour un modèle CC-BY, mettre le nom de l'auteur dans un fichier CREDITS. |

## 2. Salle 3D et écran de borne

| Projet | Licence | Ce que tu peux reprendre |
|---|---|---|
| [henryjeff/portfolio-website](https://github.com/henryjeff/portfolio-website) | MIT | Pièce 3D avec un vieil ordinateur dont l'écran affiche une vraie page web (CSS3DRenderer superposé au WebGL) et zoom caméra vers l'écran au clic. C'est exactement le principe « on s'approche de la borne 10 et le jeu Pyodide s'affiche dedans ». |
| [brunosimon/folio-2019](https://github.com/brunosimon/folio-2019) | MIT | Portfolio 3D très connu (Three.js + Vite, comme ta salle). Bon modèle pour l'organisation du code, le chargement des ressources avec écran de progression et les animations d'objets. |
| [Exemples officiels three.js](https://threejs.org/examples/) | MIT | `webgl_postprocessing_unreal_bloom` (néons qui brillent), `webgl_lights_rectarealight` (lumière d'écran sur le sol), `webgl_mirror` / `Reflector` (sol brillant), `css3d_*` (iframe dans la scène), `webgl_materials_video` (texture vidéo ou canvas sur un écran). |

## 3. Effet écran cathodique (CRT) et post-processing

| Projet | Licence | Ce que tu peux reprendre |
|---|---|---|
| [OutThisLife/crt-shader](https://github.com/OutThisLife/crt-shader) | MIT | Effet CRT complet (scanlines, courbure, halo) avec un `CRTPass` prêt pour `EffectComposer` (`crt-shader/three`). Projet récent et peu suivi (1 étoile) : à tester avant de compter dessus. |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | zlib (à vérifier, permissive) | Bibliothèque de référence : bloom, scanlines, bruit, aberration chromatique, vignette. Plus fiable que la précédente si tu veux juste des scanlines + bloom. |

## 4. Caméra et animations

| Projet | Licence | Ce que tu peux reprendre |
|---|---|---|
| [yomotsu/camera-controls](https://github.com/yomotsu/camera-controls) | MIT | Remplace OrbitControls avec des transitions fluides : `setLookAt(..., true)` ou `fitToBox(borne, true)` pour glisser vers une borne, avec des Promises pour enchaîner les mouvements. |
| [tweenjs/tween.js](https://github.com/tweenjs/tween.js) | MIT (à vérifier) | Animations simples : clignotement des néons, apparition des titres, rotation des bornes en attente. |

## 5. Sons rétro

| Projet | Licence | Ce que tu peux reprendre |
|---|---|---|
| [KilledByAPixel/ZzFX](https://github.com/KilledByAPixel/ZzFX) | MIT | Génère des bruitages 8 bits en JavaScript sans fichier audio (moins de 1 Ko). Idéal pour les sons de la salle : bip de sélection, pièce insérée. |
| [chr15m/jsfxr](https://github.com/chr15m/jsfxr) + [sfxr.me](https://sfxr.me) | Unlicense (domaine public) | Interface web pour créer laser, explosion, pièce, et exporter en WAV. Les WAV peuvent servir aussi côté jeu. |
| [Kenney Audio](https://kenney.nl/assets/category:Audio) | CC0 | Packs de sons d'interface et sons « digital » prêts à l'emploi. |

## 6. Police

- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (SIL OFL) : police pixel classique pour les écrans d'accueil, scores et panneaux de la salle.

## Règles pour rester en règle

- MIT / zlib : garder le texte de licence et le copyright si tu copies du code (un fichier `salle/LICENSES-TIERS.md` suffit).
- CC0 / Unlicense : rien d'obligatoire, une mention dans les crédits est appréciée.
- CC-BY : nom de l'auteur obligatoire dans les crédits.
- Ne pas reprendre de sprites, sons ou logos officiels de Space Invaders (Taito) : ils ne sont pas libres.

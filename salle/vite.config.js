import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { fileURLToPath } from "node:url";

const racineProjet = fileURLToPath(new URL("..", import.meta.url));
const fichiersPyodide = [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
].map((nom) => `node_modules/pyodide/${nom}`);

export default defineConfig({
  // Chemins relatifs : le build marche servi par main.py comme ouvert depuis n'importe quel dossier.
  base: "./",
  optimizeDeps: { exclude: ["pyodide"] },
  plugins: [
    viteStaticCopy({
      targets: [{ src: fichiersPyodide, dest: "pyodide", rename: { stripBase: true } }],
    }),
  ],
  server: {
    // Autorise l'import ?raw des fichiers Python de ../src/space_invaders (source unique du jeu).
    fs: { allow: [racineProjet] },
    proxy: { "/api": "http://localhost:8000" },
  },
  build: { chunkSizeWarningLimit: 1500 },
});

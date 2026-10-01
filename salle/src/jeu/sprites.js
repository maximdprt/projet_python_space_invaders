// Pixel art : une chaîne par ligne, un caractère par pixel ("." = vide).
// Les couleurs de chaque caractère sont données dans `palette`.

export const COULEURS_SORTES = {
  meduse: "#22f5ff",
  crabe: "#ff2bd6",
  poulpe: "#7dff3a",
  blinde: "#ffc83d",
  soucoupe: "#ff3b3b",
};

export const ENNEMIS = {
  poulpe: [
    [
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      "XX.XX.XX",
      "XXXXXXXX",
      "..X..X..",
      ".X.XX.X.",
      "X.X..X.X",
    ],
    [
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      "XX.XX.XX",
      "XXXXXXXX",
      ".X.XX.X.",
      "X......X",
      ".X....X.",
    ],
  ],
  crabe: [
    [
      "..X.....X..",
      "...X...X...",
      "..XXXXXXX..",
      ".XX.XXX.XX.",
      "XXXXXXXXXXX",
      "X.XXXXXXX.X",
      "X.X.....X.X",
      "...XX.XX...",
    ],
    [
      "..X.....X..",
      "X..X...X..X",
      "X.XXXXXXX.X",
      "XXX.XXX.XXX",
      "XXXXXXXXXXX",
      ".XXXXXXXXX.",
      "..X.....X..",
      ".X.......X.",
    ],
  ],
  meduse: [
    [
      "....XXXX....",
      ".XXXXXXXXXX.",
      "XXXXXXXXXXXX",
      "XXX..XX..XXX",
      "XXXXXXXXXXXX",
      "...XX..XX...",
      "..XX.XX.XX..",
      "XX........XX",
    ],
    [
      "....XXXX....",
      ".XXXXXXXXXX.",
      "XXXXXXXXXXXX",
      "XXX..XX..XXX",
      "XXXXXXXXXXXX",
      "..XXX..XXX..",
      ".XX..XX..XX.",
      "..XX....XX..",
    ],
  ],
  blinde: [
    [
      "..XXXXXXXX..",
      ".XOOOOOOOOX.",
      "XXOXXXXXXOXX",
      "XOX.XXXX.XOX",
      "XXXXXXXXXXXX",
      "XOOXXOOXXOOX",
      ".XX.XXXX.XX.",
      "XX..X..X..XX",
    ],
    [
      "..XXXXXXXX..",
      ".XOOOOOOOOX.",
      "XXOXXXXXXOXX",
      "XOX.XXXX.XOX",
      "XXXXXXXXXXXX",
      "XOOXXOOXXOOX",
      ".XX.XXXX.XX.",
      ".XX.X..X.XX.",
    ],
  ],
  soucoupe: [
    [
      ".....XXXXXX.....",
      "...XXXXXXXXXX...",
      "..XXXXXXXXXXXX..",
      ".XX.XX.XX.XX.XX.",
      "XXXXXXXXXXXXXXXX",
      "..XXX..XX..XXX..",
      "...X........X...",
    ],
    [
      ".....XXXXXX.....",
      "...XXXXXXXXXX...",
      "..XXXXXXXXXXXX..",
      ".X.XX.XX.XX.XX.X",
      "XXXXXXXXXXXXXXXX",
      "..XXX..XX..XXX..",
      "...X........X...",
    ],
  ],
};

export const PALETTE_ENNEMI = { O: "#7a4b00" };

// Vaisseaux : W blanc, C cyan, B bleu, V violet, G or, D sombre, R arc-en-ciel animé.
export const VAISSEAUX = {
  chasseur: {
    taille: 3.6,
    reacteurs: [6.5],
    lignes: [
      "......W......",
      ".....WCW.....",
      ".....WCW.....",
      "....WWWWW....",
      ".C..WWBWW..C.",
      ".W.WWWWWWW.W.",
      "WWWWWWWWWWWWW",
      "WWWWW...WWWWW",
      ".CC.......CC.",
    ],
  },
  intercepteur: {
    taille: 3.2,
    reacteurs: [6, 11],
    lignes: [
      "........W........",
      ".......WCW.......",
      ".......WCW.......",
      "......WWWWW......",
      ".....WWBBBWW.....",
      "W...WWWWWWWWW...W",
      "WW.WWWWWWWWWWW.WW",
      "WWWWWCWWWWWCWWWWW",
      ".WWW..WW.WW..WWW.",
      ".C.....C.C.....C.",
    ],
  },
  faucon: {
    taille: 3.2,
    reacteurs: [6, 9.5, 13],
    lignes: [
      ".........W.........",
      "........WVW........",
      "........VVV........",
      ".......WVVVW.......",
      "......WWWWWWW......",
      "..C..WWWBBBWWW..C..",
      "..W.WWWWWWWWWWW.W..",
      ".WWWWWWWWWWWWWWWWW.",
      "WWWCWWWWWWWWWWWCWWW",
      "WWW.WWWW...WWWW.WWW",
      ".W...WW.....WW...W.",
    ],
  },
  croiseur: {
    taille: 3.2,
    reacteurs: [3.5, 8, 13, 17.5],
    lignes: [
      "..........W..........",
      ".........WCW.........",
      "........WWCWW........",
      ".......GWWWWWG.......",
      "......GGWBBBWGG......",
      "...G.WWWWWWWWWWW.G...",
      "..GG.WWGWWWWWGWW.GG..",
      ".GGWWWWWWWWWWWWWWWGG.",
      "GGWWWGWWWWWWWWWGWWWGG",
      "GWWWWWWWGGGGGWWWWWWWG",
      ".WWWW.WWW...WWW.WWWW.",
      "..WW...WW...WW...WW..",
    ],
  },
  dreadnought: {
    taille: 3.0,
    reacteurs: [3, 9, 12.5, 16, 22],
    lignes: [
      "............W............",
      "...........WCW...........",
      "..........WWCWW..........",
      ".........RWWCWWR.........",
      "........RRWBBBWRR........",
      ".......RWWWBBBWWWR.......",
      "...R..RWWWWWWWWWWWR..R...",
      "..RR.RWWWWDWWWDWWWWR.RR..",
      ".RRWWWWWWWWDWDWWWWWWWWRR.",
      "RRWWWWDWWWWWWWWWWWDWWWWRR",
      "RWWWWWWWWRRRRRRRWWWWWWWWR",
      "RWWDWWWWWWWWWWWWWWWWWDWWR",
      ".WWWW.WWWW.....WWWW.WWWW.",
      "..WW....WW.....WW....WW..",
    ],
  },
};

export const PALETTES_VAISSEAUX = {
  chasseur: { W: "#e8f6ff", C: "#22f5ff", B: "#3a7bff" },
  intercepteur: { W: "#cfe9ff", C: "#22f5ff", B: "#2f6bff" },
  faucon: { W: "#e9e2ff", C: "#22f5ff", B: "#5d8bff", V: "#a85cff" },
  croiseur: { W: "#fff4dc", C: "#22f5ff", B: "#3a7bff", G: "#ffc83d" },
  dreadnought: { W: "#ffffff", C: "#22f5ff", B: "#3a7bff", D: "#5a5f7a", R: "#ff2bd6" },
};

export const LUEUR_VAISSEAUX = {
  chasseur: "#22f5ff",
  intercepteur: "#3aa8ff",
  faucon: "#a85cff",
  croiseur: "#ffc83d",
  dreadnought: "#ff2bd6",
};

export const NOMS_PALIERS = ["RECRUE", "PILOTE", "AS", "ELITE", "LEGENDE"];
export const APPARENCES = ["chasseur", "intercepteur", "faucon", "croiseur", "dreadnought"];

export function dimensions(lignes) {
  return { largeur: lignes[0].length, hauteur: lignes.length };
}

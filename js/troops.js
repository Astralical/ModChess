/* ============================================================
   Mod Chess — custom summonable TROOPS
   Each troop has unique art (emoji token), a SAN letter, a value,
   and movement defined as:
     leap:  [[dr,dc], ...]           one-cell jumps (ignores blockers)
     slide: [[dr,dc,max?], ...]      slides along a compass direction up to max (8 = any)
   Engine (js/engine.js) already knows how to move + attack-check these.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD || (root.MD = {});

  // compass helpers
  const ALL8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const KNIGHT = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const ORTH = [[1,0],[-1,0],[0,1],[0,-1]];
  const DIAG = [[1,1],[1,-1],[-1,1],[-1,-1]];
  const WAZIR = [[1,0],[-1,0],[0,1],[0,-1]];
  const FERZ = [[1,1],[1,-1],[-1,1],[-1,-1]];
  const DABBABA = [[2,0],[-2,0],[0,2],[0,-2]];
  const ALFIL = [[2,2],[2,-2],[-2,2],[-2,-2]];
  const CAMEL = [[3,1],[3,-1],[-3,1],[-3,-1],[1,3],[1,-3],[-1,3],[-1,-3]];

  const T = {
    // — the five classic summons, now real creatures —
    imp:       { name: 'Imp',          icon: '😈', letter: 'I', value: 260,  leap: ALL8 },
    warhorse:  { name: 'Warhorse',     icon: '🐎', letter: 'W', value: 430,  leap: KNIGHT.concat(FERZ) },
    guardian:  { name: 'Guardian',     icon: '🛡️', letter: 'G', value: 640,  leap: FERZ, slide: ORTH },
    archmage:  { name: 'Archmage',     icon: '🧙', letter: 'A', value: 640,  leap: WAZIR, slide: DIAG },
    phoenix:   { name: 'Phoenix',      icon: '🐦‍🔥', letter: 'X', value: 1250, leap: KNIGHT, slide: ALL8 },

    // — 20 brand-new summoned troops —
    goblin:    { name: 'Goblin',       icon: '🧌', letter: 'Z', value: 340,  leap: DABBABA.concat(ALFIL) },
    ranger:    { name: 'Ranger',       icon: '🏹', letter: 'R', value: 460,  slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3],[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]] },
    dwarf:     { name: 'Dwarf',        icon: '⛏️', letter: 'D', value: 330,  slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]] },
    harpy:     { name: 'Harpy',        icon: '🕊️', letter: 'Y', value: 540,  leap: WAZIR, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]] },
    golem:     { name: 'Golem',        icon: '🗿', letter: 'H', value: 540,  leap: ALL8, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]] },
    sphinx:    { name: 'Sphinx',       icon: '🦁', letter: 'C', value: 680,  leap: KNIGHT.concat(ALFIL) },
    lich:      { name: 'Lich',         icon: '💀', letter: 'V', value: 720,  leap: DABBABA, slide: [[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5]] },
    treant:    { name: 'Treant',       icon: '🌳', letter: 'T', value: 380,  leap: WAZIR.concat(DABBABA) },
    griffon:   { name: 'Griffon',      icon: '🦅', letter: 'F', value: 1000, leap: KNIGHT, slide: ORTH },
    manticore: { name: 'Manticore',    icon: '🦂', letter: 'E', value: 1000, leap: KNIGHT, slide: DIAG },
    vampire:   { name: 'Vampire',      icon: '🧛', letter: 'J', value: 600,  leap: KNIGHT.concat(WAZIR) },
    basilisk:  { name: 'Basilisk',     icon: '🐍', letter: 'M', value: 640,  slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2],[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]] },
    djinn:     { name: 'Djinn',        icon: '🧞', letter: 'O', value: 1150, leap: FERZ, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4],[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]] },
    owlbear:   { name: 'Owlbear',      icon: '🦉', letter: 'U', value: 760,  leap: KNIGHT, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]] },
    banshee:   { name: 'Banshee',      icon: '👻', letter: 'L', value: 820,  leap: KNIGHT.concat(ALL8) },
    hydra:     { name: 'Hydra',        icon: '🐲', letter: 'S', value: 1100, leap: WAZIR, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5],[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5]] },
    tiger:     { name: 'Tiger',        icon: '🐅', letter: 'P', value: 850,  leap: CAMEL, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]] },
    unicorn:   { name: 'Unicorn',      icon: '🦄', letter: 'U', value: 720, leap: WAZIR, slide: [[1,1,6],[1,-1,6],[-1,1,6],[-1,-1,6]] },
    turtle:    { name: 'Turtle',       icon: '🐢', letter: 'T', value: 420,  slide: [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]] },
    reaper:    { name: 'Reaper',       icon: '⚰️', letter: 'R', value: 1600, leap: DABBABA, slide: ALL8 }
  };

  MD.TROOPS = T;
  // each troop's vector glyph key = its type (see js/icons.js)
  Object.keys(T).forEach(k => { T[k].icon = k; });
  // list in summon order for reference
  MD.TROOP_KEYS = Object.keys(T);
})();

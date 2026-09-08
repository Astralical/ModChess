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
    phoenix:   { name: 'Phoenix',      icon: '🐦‍🔥', letter: 'X', value: 1250, leap: KNIGHT, slide: ALL8, hatch: { egg: 'phoenixegg', after: 3 } },

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
    hydra:     { name: 'Hydra',        icon: '🐲', letter: 'S', value: 1100, leap: WAZIR, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5],[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5]], hatch: { egg: 'hydraling', after: 2 } },
    tiger:     { name: 'Tiger',        icon: '🐅', letter: 'P', value: 850,  leap: CAMEL, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]] },
    unicorn:   { name: 'Unicorn',      icon: '🦄', letter: 'U', value: 720, leap: WAZIR, slide: [[1,1,6],[1,-1,6],[-1,1,6],[-1,-1,6]] },
    turtle:    { name: 'Turtle',       icon: '🐢', letter: 'T', value: 420,  slide: [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]] },
    reaper:    { name: 'Reaper',       icon: '⚰️', letter: 'R', value: 1600, leap: DABBABA, slide: ALL8 },

    // — growth-stage lings: weak, mature into the adult after a round —
    hydraling: { name: 'Hydraling',    icon: '🐣', letter: 's', value: 460,  leap: WAZIR, slide: [[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]], growTo: 'hydra', growAfter: 2 },
    phoenixegg:{ name: 'Phoenix Egg',  icon: '🥚', letter: 'x', value: 240,  leap: FERZ, growTo: 'phoenix', growAfter: 3 },

    // — brand-new summoned troops (unique TRAITS — none repeat the roster above) —
    // Spriggan: a living thicket — it heals itself every turn and, when "destroyed",
    //   splits into two loyal pawns that crawl from its roots. It is never truly gone.
    spriggan:  { name: 'Spriggan',     icon: '🌱', letter: 's', value: 620,  leap: FERZ, slide: [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]], regen: true, onDeath: 'split' },
    // Gremlin: a volatile little saboteur — when it dies it EXPLODES, blasting every
    //   adjacent enemy. Fragile, but nobody wants to kill it.
    gremlin:   { name: 'Gremlin',      icon: '👺', letter: 'g', value: 420,  leap: DABBABA.concat(CAMEL), onDeath: 'burst' },
    // Warden: a walking law of nature — at the end of each of its owner's turns it
    //   FREEZES an adjacent foe in place (they skip a turn). Advance carefully.
    warden:    { name: 'Warden',       icon: '🧊', letter: 'w', value: 980,  leap: FERZ, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4]], aura: 'freeze' },
    // Samurai: a lone blade spirit — an elegant knight-jump that also cuts two squares
    //   straight. No trait, pure duelist — a rare "clean" summon.
    samurai:   { name: 'Samurai',      icon: '⚔️', letter: 'Q', value: 760,  leap: KNIGHT, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]] },
    // Siren: a sea-witch — at the end of its owner's turn it POISONS an adjacent foe.
    siren:     { name: 'Siren',        icon: '🧜‍♀️', letter: 'y', value: 900,  leap: WAZIR, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], aura: 'poison' },

    // ================= THEME TROOPS =================
    // — Jujutsu Kaisen: cursed spirits & shikigami —
    divinedog: { name: 'Divine Dog',   icon: '🐕', letter: 'D', value: 720,  leap: KNIGHT, slide: [[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]] },
    nue:       { name: 'Nue',          icon: '🦅', letter: 'N', value: 880,  leap: KNIGHT, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4]] },
    mahoraga:  { name: 'Mahoraga',     icon: '⚙️', letter: 'M', value: 1500, leap: CAMEL.concat(DABBABA), slide: [[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]] },
    // — Wuxia heroes: sword immortals & mystic beasts —
    jianke:    { name: 'Sword Immortal', icon: '🗡️', letter: 'J', value: 900, leap: FERZ, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5]] },
    qilin:     { name: 'Qilin',        icon: '🦌', letter: 'Q', value: 1000, leap: KNIGHT, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3],[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], regen: true },
    yasha:     { name: 'Yasha',        icon: '👹', letter: 'Y', value: 800,  leap: DABBABA.concat(FERZ), onDeath: 'split' },
    // — Ocean: monsters of the abyss —
    seaserpent:{ name: 'Sea Serpent',  icon: '🐍', letter: 'S', value: 1050, leap: CAMEL, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]] },
    leviathan: { name: 'Leviathan',    icon: '🐋', letter: 'L', value: 1500, leap: CAMEL, slide: ALL8 },
    coralqueen:{ name: 'Coral Queen',  icon: '🪸', letter: 'C', value: 1100, leap: WAZIR, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]], aura: 'freeze' },
    // — World War II: iron engines of war —
    siegetank: { name: 'Siege Tank',   icon: '🛡️', letter: 'T', value: 1000, leap: FERZ, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4]], onDeath: 'burst', artillery: { range: 3, radius: 1, cd: 3 } },
    zeppelin:  { name: 'War Zeppelin', icon: '🎈', letter: 'Z', value: 1150, leap: KNIGHT, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]], artillery: { range: 5, radius: 0, cd: 2 } },
    howitzer:  { name: 'Howitzer',     icon: '💣', letter: 'H', value: 880, leap: CAMEL, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], artillery: { range: 4, radius: 1, cd: 2 } },
    infantry:  { name: 'Rifleman',     icon: '🎖️', letter: 'I', value: 420, leap: WAZIR, artillery: { range: 2, radius: 0, cd: 1 } },
    // — counter troops: destroy them by capturing and you are COUNTERED —
    //   (data-driven: counter: true='kill' | 'poison' | 'freeze' | 'doom')
    porcupine: { name: 'Porcupine',   icon: '🦔', letter: 'P', value: 360, leap: WAZIR, counter: true },
    scorpion:  { name: 'Scorpion',    icon: '🦂', letter: 'S', value: 620, leap: CAMEL, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]], counter: 'poison' },
    urchin:    { name: 'Sea Urchin',  icon: '🌊', letter: 'U', value: 300, slide: [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]], counter: true },
    plaguebearer: { name: 'Plague Bearer', icon: '☣️', letter: 'B', value: 520, leap: WAZIR, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]], counter: 'doom' },
    // — THE OUTBREAK (Zombie / biohazard, set 19) —
    zombie:    { name: 'Zombie',      icon: '🧟', letter: 'Z', value: 200, leap: WAZIR, counter: 'poison' },
    ghoul:     { name: 'Ghoul',       icon: '👺', letter: 'G', value: 430, leap: FERZ, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]], counter: true },
    bloater:   { name: 'Bloater',     icon: '🎈', letter: 'B', value: 520, slide: [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]], onDeath: 'burst' },
    plaguehound:{ name: 'Plague Hound', icon: '🐕', letter: 'H', value: 560, leap: KNIGHT, counter: 'poison' },
    necrolord: { name: 'Necrolord',   icon: '💀', letter: 'N', value: 1250, leap: FERZ, slide: [[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5]] },
    // — SCI-FI MACHINES (set 9) —
    servodrone:{ name: 'Servo-Drone', icon: '🤖', letter: 'D', value: 380, leap: WAZIR, slide: [[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]] },
    warbot:    { name: 'Warbot',      icon: '🦾', letter: 'W', value: 700, leap: KNIGHT, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]] },
    // — THE VOID (set 8) —
    voidwisp:  { name: 'Voidwisp',    icon: '🫥', letter: 'V', value: 300, leap: FERZ, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], onDeath: 'split' },
    starspawn: { name: 'Starspawn',   icon: '🌟', letter: 'S', value: 900, leap: CAMEL, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]], regen: true },
    // — THE SHOW (carnival, set 10) —
    strongman: { name: 'Strongman',   icon: '💪', letter: 'S', value: 520, leap: FERZ, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]] },
    firebreather: { name: 'Fire-Breather', icon: '🔥', letter: 'F', value: 460, leap: WAZIR, artillery: { range: 2, radius: 0, cd: 1 } },
    // — THREE KINGDOMS (三国, set 20): sworn-oath (义) heroes —
    //   def.sworn = faction tag; sworn allies adjacent at end of your turn
    //   cleanse & shield one another (watching each other's backs).
    liubei:   { name: 'Liu Bei',      icon: '👑', letter: 'L', value: 1200, leap: WAZIR, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4],[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], sworn: 'shu' },
    guanyu:   { name: 'Guan Yu',      icon: '🗡️', letter: 'Y', value: 1250, leap: KNIGHT, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4],[1,0,4],[-1,0,4]], sworn: 'shu' },
    zhangfei: { name: 'Zhang Fei',    icon: '😡', letter: 'F', value: 1100, leap: CAMEL, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]], sworn: 'shu', onDeath: 'burst' },
    zhugeliang: { name: 'Zhuge Liang', icon: '🪶', letter: 'Q', value: 1400, leap: FERZ, sworn: 'shu', artillery: { range: 4, radius: 0, cd: 1 } },
    caocao:   { name: 'Cao Cao',      icon: '🎭', letter: 'C', value: 1150, leap: KNIGHT, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5]], sworn: 'wei' },
    xiahoudun:{ name: 'Xiahou Dun',   icon: '🦾', letter: 'X', value: 980, leap: CAMEL, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]], sworn: 'wei', counter: true },
    guojia:   { name: 'Guo Jia',      icon: '🌧️', letter: 'J', value: 1000, leap: FERZ, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]], sworn: 'wei', artillery: { range: 5, radius: 0, cd: 2 } },
    sunquan:  { name: 'Sun Quan',     icon: '🐉', letter: 'N', value: 1100, leap: WAZIR, slide: [[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5]], sworn: 'wu' },
    zhouyu:   { name: 'Zhou Yu',      icon: '🔥', letter: 'R', value: 1050, leap: KNIGHT, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]], sworn: 'wu', aura: 'poison' },
    taishici: { name: 'Tai Shi Ci',   icon: '🏹', letter: 'T', value: 950, leap: CAMEL, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3],[1,0,3],[-1,0,3]], sworn: 'wu', artillery: { range: 3, radius: 0, cd: 1 } },
    huangzhong: { name: 'Huang Zhong', icon: '🎯', letter: 'H', value: 900, leap: WAZIR, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]], sworn: 'shu', artillery: { range: 5, radius: 0, cd: 1 } },
    ganning:  { name: 'Gan Ning',     icon: '🏴', letter: 'G', value: 940, leap: KNIGHT, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], sworn: 'wu', counter: 'poison' },
    diaochan: { name: 'Diao Chan',    icon: '🌙', letter: 'D', value: 820, leap: FERZ, slide: [[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]], aura: 'freeze' },
    lubu:     { name: 'Lu Bu',        icon: '⚡', letter: 'B', value: 1600, leap: KNIGHT.concat(CAMEL), slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4],[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4]], onDeath: 'split' },
    // — HEROES (set 21): legendary heroes from everywhere. Each is a Mythic summon
    //   with its own UNIQUE banner trick (`hero:true`, engine dispatches def.hp at
    //   the end of its owner's turn via MD.Heroes.ownTurn). Strong & rare.
    alexander:{ name: 'Alexander the Great', icon: '🦁', letter: 'A', value: 1500, leap: KNIGHT, slide: [[1,0,6],[-1,0,6],[0,1,6],[0,-1,6]], hero: true, hp: 'alexander' },
    caesar:   { name: 'Julius Caesar', icon: '🏛️', letter: 'C', value: 1350, leap: WAZIR, slide: [[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5]], hero: true, hp: 'caesar' },
    spartacus:{ name: 'Spartacus',    icon: '⛓️', letter: 'S', value: 1300, leap: CAMEL, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3],[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]], hero: true, hp: 'spartacus' },
    hannibal: { name: 'Hannibal Barca', icon: '🐘', letter: 'H', value: 1400, leap: FERZ, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5],[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]], hero: true, hp: 'hannibal' },
    genghis:  { name: 'Genghis Khan', icon: '🏹', letter: 'G', value: 1600, leap: KNIGHT, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4],[1,0,3],[-1,0,3]], hero: true, hp: 'genghis' },
    napoleon: { name: 'Napoleon',     icon: '🎩', letter: 'N', value: 1350, leap: CAMEL, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5]], hero: true, hp: 'napoleon' },
    sunzu:    { name: 'Sun Tzu',      icon: '📜', letter: 'T', value: 1250, leap: FERZ, slide: [[1,1,4],[1,-1,4],[-1,1,4],[-1,-1,4],[1,0,2],[-1,0,2]], hero: true, hp: 'sunzu' },
    leonidas: { name: 'Leonidas',     icon: '🛡️', letter: 'L', value: 1400, leap: WAZIR, slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]], hero: true, hp: 'leonidas' },
    gilgamesh:{ name: 'Gilgamesh',    icon: '🗿', letter: 'G', value: 1550, leap: KNIGHT, slide: [[1,1,6],[1,-1,6],[-1,1,6],[-1,-1,6],[1,0,3],[-1,0,3]], hero: true, hp: 'gilgamesh' },
    hercules: { name: 'Hercules',     icon: '💪', letter: 'H', value: 1600, leap: KNIGHT.concat(CAMEL), slide: [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2]], hero: true, hp: 'hercules' },
    odin:     { name: 'Odin',         icon: '🐦‍⬛', letter: 'O', value: 1700, leap: KNIGHT, slide: [[1,1,5],[1,-1,5],[-1,1,5],[-1,-1,5],[1,0,4],[-1,0,4]], hero: true, hp: 'odin' },
    thor:     { name: 'Thor',         icon: '🔨', letter: 'R', value: 1650, leap: FERZ, slide: [[1,0,5],[-1,0,5],[0,1,5],[0,-1,5]], hero: true, hp: 'thor' },
    sunwukong:{ name: 'Sun Wukong',   icon: '🐒', letter: 'W', value: 1500, leap: CAMEL.concat(DABBABA), slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]], hero: true, hp: 'sunwukong' },
    momotaro: { name: 'Momotaro',     icon: '🍑', letter: 'M', value: 1250, leap: WAZIR, slide: [[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], hero: true, hp: 'momotaro' },
    anansi:   { name: 'Anansi',       icon: '🕷️', letter: 'A', value: 1300, leap: FERZ, slide: [[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2],[1,0,2],[-1,0,2]], hero: true, hp: 'anansi' },
    robinhood:{ name: 'Robin Hood',   icon: '🎯', letter: 'R', value: 1350, leap: KNIGHT, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4],[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]], hero: true, hp: 'robinhood' },
    arthur:   { name: 'King Arthur',  icon: '⚔️', letter: 'K', value: 1550, leap: KNIGHT, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4],[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]], hero: true, hp: 'arthur' },
    beowulf:  { name: 'Beowulf',      icon: '🐻', letter: 'B', value: 1500, leap: CAMEL, slide: [[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]], hero: true, hp: 'beowulf' },
    goku:     { name: 'Goku',         icon: '🟠', letter: 'K', value: 1650, leap: KNIGHT, slide: ALL8, hero: true, hp: 'goku' },
    mulan:    { name: 'Mulan',        icon: '🌸', letter: 'M', value: 1300, leap: FERZ, slide: [[1,0,4],[-1,0,4],[0,1,4],[0,-1,4],[1,1,2],[1,-1,2],[-1,1,2],[-1,-1,2]], hero: true, hp: 'mulan' }
  };

  MD.TROOPS = T;
  // each troop's vector glyph key = its type (see js/icons.js)
  Object.keys(T).forEach(k => { T[k].icon = k; });
  // list in summon order for reference
  MD.TROOP_KEYS = Object.keys(T);
})();

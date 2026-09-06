/* Mod Chess — ability registry (merges the 4 data sets) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const ALL = []
    .concat(MD.AB_1 || [], MD.AB_2 || [], MD.AB_3 || [], MD.AB_4 || [],
      MD.AB_5 || [], MD.AB_6 || [], MD.AB_7 || [], MD.AB_8 || [],
      MD.AB_9 || [], MD.AB_10 || [], MD.AB_11 || []);

  // dedupe + validate
  const seenIds = new Set(), seenNames = new Set();
  MD.ABILITIES = ALL.filter(a => {
    if (!a || seenIds.has(a.id)) { console.warn('dup id', a && a.id); return false; }
    if (seenNames.has(a.name)) { console.warn('dup name', a.name); return false; }
    seenIds.add(a.id); seenNames.add(a.name);
    return true;
  });

  // sort by id for the codex
  MD.ABILITIES.sort((a, b) => a.id - b.id);

  // remap each ability's icon to a vector icon key (no emojis)
  if (MD.assignAbilityIcons) MD.assignAbilityIcons(MD.ABILITIES);

  MD.RARITY = {
    1: { label: 'Common', color: '#9aa4b2' },
    2: { label: 'Rare', color: '#5bb9ff' },
    3: { label: 'Epic', color: '#c17bf0' },
    4: { label: 'Legendary', color: '#ffc55a' }
  };

  MD.CATS = ['Attack', 'Curse', 'Buff', 'Summon', 'Transform', 'Chaos', 'Status', 'Time', 'Kingship', 'Economy', 'Luck', 'Wild', 'Void', 'SciFi', 'Show', 'Myth'];

  // distinct hand-size for bonus/reduced draws is handled in main.js via g.lowHand

  // draw `n` distinct random abilities for a hand
  MD.drawHand = function (n) {
    const pool = MD.ABILITIES.slice();
    const out = [];
    while (out.length < n && pool.length) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  };

  // draw `n` abilities that can actually be CAST right now for `side`
  // (targeted spells are only dealt when a valid target exists).
  MD.drawPlayable = function (g, side, n) {
    const Fx = MD.Fx;
    const playable = MD.ABILITIES.filter(a =>
      !MD.needsTarget(a) || (Fx && Fx.targetList(g, side, a.target).length > 0)
    );
    const pool = playable.slice();
    const out = [];
    while (out.length < n && pool.length) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  };

  MD.abilityById = function (id) { return MD.ABILITIES.find(a => a.id === id); };

  // Resolve an ability on the live game state.
  // Returns { lines, marks } and sets g.lastCast.
  MD.cast = function (g, ab, side, targetSq) {
    g.fxevents = [];
    let lines = [];
    let error = false;
    try {
      const res = ab.run(g, side, targetSq || null);
      lines = (res || []).map(String);
    } catch (err) {
      error = true;
      console.warn('Ability error', ab && ab.id, ab && ab.name, err);
      lines = ['The spell fizzles mysteriously (' + (ab && ab.name) + ').'];
    }
    // wild magic chains one level only
    if (g.wildChain) { delete g.wildChain; }
    g.lastCast = {
      abilityId: ab.id, abilityName: ab.name, abilityIcon: ab.icon,
      rarity: ab.rarity, side,
      lines: lines.slice(), marks: (g.fxevents || []).slice()
    };
    g.fxevents = [];
    return { lines, marks: g.lastCast.marks, error };
  };

  // Auto-pick a target square for a bot (or any headless caller)
  MD.botTarget = function (g, ab, side) {
    if (!ab || ab.target === 'auto') return null;
    return MD.Fx.autoTarget(g, side, ab.target);
  };

  // whether ability needs a click target from the player
  MD.needsTarget = ab => ab && ab.target && ab.target !== 'auto';
})();

/* ============================================================
   Mod Chess — ITEM MODE
   A random treasure/item spawns on a random EMPTY square each turn.
   When ANY piece (either side) lands on the square the item is
   claimed and its effect triggers for that side / collector.
   Spawn cadence: with x items left unclaimed on the board the next
   item waits 2^x turns (the board floods, then slows).
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const pick = arr => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
  const pname = t => (MD.pieceName ? MD.pieceName(t) : t);
  const sname = c => (c === 'w' ? 'White' : 'Black');

  /* ---------------- item catalogue (110+) ---------------- */
  const I = [];
  const def = (name, kind, power, icon, flavor, rarity) => I.push({ id: I.length + 1, name, kind, power: power || 1, icon, flavor: flavor || '', rarity: rarity || 1 });
  // rarity 1 common · 2 rare · 3 epic · 4 legendary (flavor only)

  // --- wards & cloaks: protect the collector ---
  def('Iron Aegis', 'ward', 2, 'shield', 'A heavy shield settles on the piece that takes it.', 2);
  def('Cracked Shield', 'ward', 1, 'shield', 'Better than nothing.');
  def('Bastion Sigil', 'ward', 3, 'shield', 'A king\'s own ward — nearly unbreakable.', 3);
  def('Mist Mantle', 'cloak', 2, 'wind', 'The collector vanishes into drifting fog.', 3);
  def('Ghillie Wrap', 'cloak', 1, 'wind', 'Hard to see, harder to hit.');
  def('Shadow Cloak', 'cloak', 2, 'void', 'Made from midnight itself.');
  def('Halo of Dawn', 'mend', 1, 'spark', 'Cleanses and wards the one who claims it.');
  def('Regrowth Salve', 'mend', 1, 'leaf', 'Wounds close, frost melts.');
  def('Phoenix Tear', 'mend', 1, 'drop', 'A single tear of rebirth.');
  def('Knight\'s Blessing', 'anoint', 1, 'spark', 'Faith elevates a pawn — or hardens a lord.');
  def('Crown of Valor', 'anoint', 2, 'crown', 'The claimant is marked for greatness.', 3);

  // --- shapeshifts & summons ---
  def('Trickster Mask', 'shapeshift', 1, 'rune', 'Wear it and become something else.', 3);
  def('Werewolf Pelt', 'shapeshift', 2, 'paw', 'Fury takes a new shape.', 3);
  def('Dragon Scale', 'shapeshift', 3, 'fire', 'A scale that longs to be a dragon.', 4);
  def('Summoning Scroll', 'summon', 1, 'portal', 'Unfurls into a loyal creature.');
  def('Dire Horn', 'summon', 2, 'bone', 'Calls a beast from the wilds.', 2);
  def('Royal Warrant', 'summon', 3, 'crown', 'A champion answers the warrant.', 3);
  def('Spare Pawn', 'reinforce', 1, 'target', 'A lone soldier marches in.');
  def('Conscript Order', 'reinforce', 2, 'flag', 'Two fresh spears join the line.');

  // --- army-wide boons ---
  def('Field Kit', 'healarmy', 1, 'heart', 'Menders sweep your whole army.');
  def('Sanctuary Bell', 'healarmy', 2, 'crown', 'Peace, briefly — the army is healed and the king warded.', 2);
  def('Royal Physician', 'bastion', 1, 'heart', 'The king is healed and warded.', 2);
  def('War Banner', 'haste', 1, 'flag', 'Your troops shake off frost and torpor.');
  def('Alchemist Fire', 'venom', 1, 'fire', 'Green flames lick at the enemy ranks.', 2);
  def('Caltrop Bag', 'nova', 1, 'target', 'Freezes every foe nearby.');
  def('Pavise Rack', 'armory', 1, 'shield', 'Your two strongest are shielded.', 2);
  def('Glory Forge', 'glory', 1, 'fire', 'Your most advanced pawn is crowned a queen.', 4);

  // --- enemy harm ---
  def('Bombard Shell', 'fireblast', 1, 'storm', 'A blast tears through enemy lines.', 2);
  def('Cluster Charge', 'fireblast', 2, 'storm', 'More shrapnel, more sorrow.', 3);
  def('Ballista Bolt', 'exec', 1, 'target', 'A clean shot at a strong foe.', 2);
  def('Assassin\'s Blade', 'exec', 2, 'sword', 'It finds the most dangerous throat.', 3);
  def('Witchfire', 'venom', 1, 'fire', 'It clings and burns.');
  def('Pestilent Flask', 'venom', 2, 'drop', 'A plague in a bottle.', 2);
  def('Frost Cog', 'nova', 1, 'ice', 'Ancient ice machinery that bites.');
  def('Storm Caller', 'nova', 2, 'storm', 'A howling gust freezes the foe.', 3);
  def('Doom Omen', 'banshee', 1, 'skull', 'The strongest enemy hears a death knell.', 4);
  def('Rust Hex', 'frailty', 1, 'rune', 'Their finest steel grows brittle.', 2);
  def('Hex of Weakness', 'frailty', 2, 'skull', 'Strength drains from the enemy host.', 3);
  def('Whirlwind Charm', 'scatter', 1, 'wind', 'A foe is flung back to its own lines.');
  def('Vortex Stone', 'scatter', 2, 'void', 'The battlefield itself rejects a foe.', 2);
  def('Cursed Idol', 'bolt', 1, 'target', 'The nearest threat is smote.', 3);

  // --- dark / risk items (may harm the collector) ---
  def('Cursed Coin', 'curse', 1, 'coin', 'Greed has a price.');
  def('Leech Ring', 'curse', 1, 'drop', 'It drinks whoever wears it.');
  def('Fever Gem', 'curse', 1, 'gem', 'Pretty, and poisonous.');
  def('Doomed Relic', 'curse', 2, 'void', 'Touched by death itself.', 2);
  def('Ticking Bomb', 'curse', 1, 'clock', 'Bad idea. Very bad idea.', 2);

  // --- blessings & miracles ---
  def('Ancestral Shrine', 'miracle', 1, 'star', 'The fallen return, briefly.', 3);
  def('Soul Lantern', 'miracle', 1, 'heart', 'A light for the dead.', 2);
  def('Lucky Rabbit Foot', 'gambit', 1, 'dice', 'A burst of impossible speed.', 4);
  def('Temporal Cog', 'gambit', 1, 'clock', 'Time bends for the claimant.', 4);
  def('Defector\'s Pardon', 'tempt', 1, 'swap', 'An enemy pawn switches coats.', 2);
  def('Silver Tongue', 'tempt', 1, 'heart', 'Someone on the other side listens.', 3);

  // --- elementals & flavour extras to pad past 100 ---
  def('Ember Shard', 'venom', 1, 'fire', 'Still warm from the mountain.');
  def('Frostfang', 'nova', 1, 'ice', 'A tooth of winter.');
  def('Thunderstone', 'fireblast', 1, 'storm', 'Humming with static.');
  def('Oakheart', 'ward', 2, 'leaf', 'The heart of an old tree.', 2);
  def('Ironbark', 'ward', 1, 'leaf', 'Bark hard as iron.');
  def('Starfall', 'bolt', 1, 'star', 'A piece of a fallen star.', 3);
  def('Gravemoss', 'banshee', 1, 'leaf', 'Grows only on the doomed.', 3);
  def('Seafoam Veil', 'cloak', 1, 'drop', 'Thin as sea-spray.');
  def('Pirate\'s Chest', 'glory', 1, 'coin', 'Plunder funds a promotion.', 3);
  def('King\'s Ransom', 'bastion', 1, 'coin', 'Enough to shield a crown.', 2);
  def('Court Jester Mask', 'scatter', 1, 'dice', 'Laughter sends a foe flying.');
  def('Fireworks', 'nova', 1, 'storm', 'Loud, bright, and briefly blinding.');
  def('Gatling Gear', 'exec', 1, 'boltring', 'A crank-driven hail of bolts.', 2);
  def('Tesla Coil', 'fireblast', 1, 'boltring', 'Arc lightning leaps between foes.', 3);
  def('Nanite Swarm', 'mend', 1, 'gear', 'Machines repair the holder.', 3);
  def('Servo Gauntlet', 'anoint', 1, 'gear', 'Hydraulics for a lucky pawn.', 3);
  def('Jetpack', 'gambit', 1, 'gear', 'One glorious burst of thrust.', 3);
  def('Hoverdisc', 'scatter', 1, 'gear', 'Knocks a foe clean off the field.');
  def('Stealth Rig', 'cloak', 2, 'gear', 'Active camouflage.', 3);
  def('Reactor Core', 'bolt', 1, 'storm', 'An unstable heart of power.', 4);
  def('Naga Fang', 'venom', 1, 'bone', 'Sea-serpent venom.');
  def('Kraken Ink', 'cloak', 1, 'drop', 'A cloud of dark water.');
  def('Coral Crown', 'anoint', 1, 'crown', 'The reef\'s blessing.', 2);
  def('Tidal Charm', 'scatter', 1, 'drop', 'A wave washes a foe away.');
  def('Abyssal Pearl', 'bastion', 1, 'gem', 'Deep, and full of calm.', 2);
  def('Harpoon', 'exec', 1, 'sword', 'One throw, one catch.');
  def('Neptune\'s Trident', 'fireblast', 1, 'drop', 'The sea strikes.', 3);
  def('Siren Song', 'tempt', 1, 'heart', 'An enemy hears the melody.', 3);
  def('Shell Shield', 'ward', 1, 'shield', 'A hermit\'s borrowed home.');
  def('Coral Spike', 'venom', 1, 'leaf', 'Barbed and venomous.');
  def('Saltbloom', 'healarmy', 1, 'leaf', 'The hardy flower of the shore.');
  def('Ghost Anchor', 'banshee', 1, 'bone', 'It drags the strongest down.', 3);
  def('Davy\'s Ledger', 'glory', 1, 'coin', 'A debt paid in promotion.', 3);
  def('Barnacle Plate', 'ward', 1, 'shield', 'Accreted armour.');
  def('Tidecaller', 'nova', 1, 'drop', 'Cold water surges.');

  // more mythic / exotic variety
  def('Griffon Feather', 'summon', 1, 'bone', 'Calls a winged guardian.', 2);
  def('Basilisk Eye', 'nova', 1, 'target', 'A gaze that stills.', 3);
  def('Phoenix Down', 'miracle', 1, 'fire', 'Rebirth from ash.', 4);
  def('Manticore Quill', 'venom', 1, 'bone', 'Tail-spikes, bottled.');
  def('Golem Core', 'ward', 3, 'rune', 'The heart of a stone giant.', 4);
  def('Sprite Dew', 'healarmy', 1, 'leaf', 'Fey kindness.');
  def('Treant Bark', 'ward', 2, 'leaf', 'Older than the kingdom.', 2);
  def('Djinn Lamp', 'gambit', 1, 'void', 'One wish for speed.', 4);
  def('Hydra Blood', 'mend', 1, 'drop', 'It fights off any poison.', 3);
  def('Sphinx Riddle', 'scatter', 1, 'target', 'Answer wrongly and you are flung.', 3);
  def('Imp Contract', 'summon', 1, 'skull', 'A tiny devil owes you.', 2);
  def('Lich Phylactery', 'banshee', 1, 'skull', 'Taps the power of the dead.', 4);
  def('Goblin Grenade', 'fireblast', 1, 'storm', 'Loud, crude, effective.');
  def('Dwarven Anvil', 'armory', 1, 'shield', 'Forged steel for your best.', 2);
  def('Elven Bow', 'exec', 1, 'target', 'Silent and true.', 2);
  def('Archmage Focus', 'bolt', 1, 'spark', 'Raw magic, aimed.', 3);
  def('Tome of the Wild', 'shapeshift', 1, 'leaf', 'Nature\'s many forms.', 3);
  def('Beast Charm', 'summon', 2, 'paw', 'The forest answers.', 2);
  def('Witch\'s Brew', 'venom', 1, 'drop', 'It never agrees with the enemy.', 2);
  def('Paladin Oath', 'anoint', 2, 'spark', 'A vow of steel and light.', 3);
  def('Ranger\'s Net', 'scatter', 1, 'target', 'Entangles and drags a foe.');
  def('Druid Vines', 'haste', 1, 'leaf', 'The undergrowth untangles your troops.');
  def('Bardic Lilt', 'haste', 1, 'dice', 'A rousing tune quickens the army.');
  def('Alchemist\'s Gold', 'glory', 1, 'coin', 'Transmutation pays for a queen.', 3);

  MD.ITEMS = I;
  MD.itemById = id => I.find(x => x.id === id);

  /* ---------------- board state helpers ---------------- */
  function countOn(g) { return (g.items || []).length; }
  function itemAt(g, r, c) { return (g.items || []).find(it => it.r === r && it.c === c) || null; }

  function dropItem(g) {
    if (!g || !g.itemEnabled) return null;
    if (countOn(g) >= 6) return null;              // keep the board readable
    const n = (g.n | 0) || 8;
    const empt = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (g.board[r][c]) continue;
      if (E.isTerrain && E.isTerrain(g, r, c)) continue;
      if (itemAt(g, r, c)) continue;
      empt.push({ r, c });
    }
    if (!empt.length) return null;
    const sq = pick(empt);
    const weighted = I[Math.floor(Math.random() * I.length)]; // uniform for now
    if (!g.items) g.items = [];
    const it = { r: sq.r, c: sq.c, id: weighted.id };
    g.items.push(it);
    return it;
  }

  // call once per completed move-turn (either side). If the field is clear a
  // new treasure appears; if any item is still unclaimed the next spawn waits
  // 2^x turns (x = number of items currently on the board).
  function spawnCheck(g) {
    if (!g || !g.itemEnabled || g.over) return;
    if (!g.items) g.items = [];
    if (g.items.length === 0) { const it = dropItem(g); if (it) g.itemCd = 2; return; }
    if (g.itemCd == null) g.itemCd = 0;
    if (g.itemCd > 0) { g.itemCd--; return; }
    const x = g.items.length;
    if (dropItem(g)) g.itemCd = Math.pow(2, x); else g.itemCd = 2;
  }

  /* ---------------- effect resolution ---------------- */
  const ADJ = (g, r, c, radius) => {
    const n = (g.n | 0) || 8;
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      const cell = g.board[rr][cc];
      if (cell) out.push({ r: rr, c: cc, cell });
    }
    return out;
  };
  const ownL = (g, s) => Fx.own(g, s);
  const enL = (g, s) => Fx.enemy(g, s);
  const randEnemy = (g, s, only) => {
    let pool = enL(g, s).filter(q => q.cell.t !== 'k');
    if (only === 'minor') pool = pool.filter(q => q.cell.t === 'n' || q.cell.t === 'b');
    if (only === 'pawn') pool = pool.filter(q => q.cell.t === 'p');
    return pick(pool);
  };
  const troopsT1 = () => ['imp', 'goblin', 'ranger', 'warhorse', 'spriggan', 'divinedog'][Math.floor(Math.random() * 6)];
  const troopsT2 = () => ['samurai', 'jianke', 'nue', 'siegetank', 'seaserpent', 'golem'][Math.floor(Math.random() * 6)];
  const troopsT3 = () => ['qilin', 'siren', 'coralqueen', 'leviathan', 'griffon', 'archmage'][Math.floor(Math.random() * 6)];

  function resolve(g, def, side, r, c) {
    const lines = [];
    const cell = g.board[r] && g.board[r][c];
    const me = cell ? { r, c, cell } : null;
    const p = def.power || 1;
    const L = txt => { lines.push(txt); };

    switch (def.kind) {
      case 'ward': {
        if (me) { Fx.mod(me.cell, 's', Math.max(1, 1 + p)); L('The ' + def.name + ' wards the ' + pname(me.cell.t) + '.'); }
        else L('The ' + def.name + ' shatters, unclaimed.');
        break;
      }
      case 'cloak': {
        if (me) { Fx.mod(me.cell, 'v', Math.max(1, 1 + p)); L('The ' + def.name + ' veils the ' + pname(me.cell.t) + ' in mist.'); }
        break;
      }
      case 'mend': {
        if (me) {
          if (me.cell.b) { me.cell.b.p = 0; me.cell.b.f = 0; }
          Fx.mod(me.cell, 's', 1);
          L('The ' + def.name + ' cleanses and wards the ' + pname(me.cell.t) + '.');
        }
        break;
      }
      case 'anoint': {
        if (!me) break;
        if (me.cell.t === 'p') { me.cell.t = 'q'; L('The ' + def.name + ' elevates a pawn into a QUEEN!'); }
        else { Fx.mod(me.cell, 's', 1); Fx.mod(me.cell, 'v', 1); L('The ' + def.name + ' blesses the ' + pname(me.cell.t) + '.'); }
        break;
      }
      case 'shapeshift': {
        if (!me || me.cell.t === 'k') { L('The ' + def.name + ' slips away unused.'); break; }
        const t = p >= 3 ? troopsT3() : p === 2 ? troopsT2() : troopsT1();
        Fx.transformSq(g, [me], t, () => {});
        L('The ' + def.name + ' reshapes the ' + pname(t) + '... wait, it becomes a ' + MD.pieceName(t) + '!');
        break;
      }
      case 'summon':
      case 'reinforce': {
        const t = def.kind === 'reinforce' ? 'p' : (p >= 3 ? troopsT3() : p === 2 ? troopsT2() : troopsT1());
        const spots = [];
        const n = (g.n | 0) || 8;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
          if (!g.board[rr][cc] && !(E.isTerrain && E.isTerrain(g, rr, cc))) spots.push({ r: rr, c: cc });
        }
        const q = pick(spots.length ? spots : null);
        if (q) { Fx.place(g, side, t, q.r, q.c, {}); L('The ' + def.name + ' summons a ' + MD.pieceName(t) + ' to the field.'); }
        else L('The ' + def.name + ' finds no room to summon.');
        break;
      }
      case 'healarmy': {
        let n = 0;
        for (const q of ownL(g, side)) if (q.cell.b && (q.cell.b.p > 0 || q.cell.b.f > 0)) { q.cell.b.p = 0; q.cell.b.f = 0; n++; }
        const k = E.findKing(g, side);
        if (k) Fx.mod(g.board[k.r][k.c], 's', 1);
        L('The ' + def.name + ' heals the army' + (n ? ' (' + n + ' cleansed)' : '') + ' and wards the king.');
        break;
      }
      case 'bastion': {
        const k = E.findKing(g, side);
        if (k) { const kb = g.board[k.r][k.c].b; if (kb) { kb.p = 0; kb.f = 0; } Fx.mod(g.board[k.r][k.c], 's', 2); L('The ' + def.name + ' guards the crown.'); }
        else L('The ' + def.name + ' finds no king to protect.');
        break;
      }
      case 'haste': {
        let n = 0;
        for (const q of ownL(g, side)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.z > 0)) { q.cell.b.f = 0; q.cell.b.z = 0; n++; }
        L('The ' + def.name + ' rouses ' + n + ' of your troops from torpor.');
        break;
      }
      case 'armory': {
        const top = ownL(g, side).filter(q => q.cell.t !== 'k').sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t)).slice(0, 2);
        let n = 0;
        for (const q of top) { Fx.mod(q.cell, 's', 1); n++; }
        L('The ' + def.name + ' shields ' + n + ' of your strongest.');
        break;
      }
      case 'glory': {
        const pawns = ownL(g, side).filter(q => q.cell.t === 'p');
        if (pawns.length) {
          const ad = pawns.slice().sort((a, b) => a.r - b.r)[0];
          ad.cell.t = 'q';
          L('The ' + def.name + ' crowns your most advanced pawn a QUEEN!');
        } else L('The ' + def.name + ' fizzles — no pawn to crown.');
        break;
      }
      case 'venom': {
        let n = 0;
        for (let i = 0; i < p; i++) { const q = randEnemy(g, side); if (q) { Fx.mod(q.cell, 'p', 1); n++; } }
        L('The ' + def.name + ' poisons ' + n + ' enemy piece' + (n === 1 ? '' : 's') + '.');
        break;
      }
      case 'nova': {
        const foes = ADJ(g, r, c, 1).filter(q => q.cell.c !== side && q.cell.t !== 'k');
        let n = 0;
        for (const q of foes.slice(0, 1 + p)) { Fx.mod(q.cell, 'f', 1); n++; }
        L('The ' + def.name + ' freezes ' + n + ' adjacent foe' + (n === 1 ? '' : 's') + '.');
        break;
      }
      case 'fireblast': {
        const foes = ADJ(g, r, c, 2).filter(q => q.cell.c !== side && q.cell.t !== 'k');
        const picks = foes.slice().sort(() => Math.random() - 0.5).slice(0, 1 + p);
        let n = 0;
        for (const q of picks) { Fx.removeAt(g, q.r, q.c, {}); n++; }
        L('The ' + def.name + ' blasts ' + n + ' enemy piece' + (n === 1 ? '' : 's') + '!');
        break;
      }
      case 'exec': {
        const q = randEnemy(g, side, p >= 2 ? 'minor' : null);
        if (q) { Fx.removeAt(g, q.r, q.c, {}); L('The ' + def.name + ' destroys the enemy ' + pname(q.cell.t) + '.'); }
        else L('The ' + def.name + ' finds no worthy target.');
        break;
      }
      case 'banshee': {
        const pool = enL(g, side).filter(q => q.cell.t !== 'k').sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        if (pool.length) { Fx.mod(pool[0].cell, 'doom', 1); L('The ' + def.name + ' dooms the enemy ' + pname(pool[0].cell.t) + '.'); }
        else L('The ' + def.name + ' wails into the void.');
        break;
      }
      case 'frailty': {
        let n = 0;
        for (let i = 0; i < p; i++) {
          const pool = enL(g, side).filter(q => q.cell.t !== 'k' && { q: 'r', r: 'b', b: 'n', n: 'p' }[q.cell.t]);
          const q = pick(pool);
          if (q) { const map = { q: 'r', r: 'b', b: 'n', n: 'p' }; const t = map[q.cell.t]; if (t) { q.cell.t = t; n++; } }
        }
        L('The ' + def.name + ' weakens ' + n + ' enemy piece' + (n === 1 ? '' : 's') + '.');
        break;
      }
      case 'scatter': {
        const q = randEnemy(g, side);
        if (q) {
          const n = (g.n | 0) || 8;
          const home = q.cell.c === 'w' ? [n - 3, n - 2, n - 1] : [0, 1, 2];
          const spots = [];
          for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) {
            if (!g.board[rr][cc] && (home.indexOf(rr) >= 0) && !(E.isTerrain && E.isTerrain(g, rr, cc))) spots.push({ r: rr, c: cc });
          }
          const d = pick(spots.length ? spots : null);
          if (d) { Fx.relocate(g, q.r, q.c, d.r, d.c, { text: 'scattered' }); L('The ' + def.name + ' flings the enemy ' + pname(q.cell.t) + ' back toward its lines.'); }
          else L('The ' + def.name + ' stirs but nothing moves.');
        } else L('The ' + def.name + ' finds no foe to scatter.');
        break;
      }
      case 'bolt': {
        const k = E.findKing(g, side);
        let target = null, bd = 1e9;
        for (const q of enL(g, side)) {
          if (q.cell.t === 'k') continue;
          const d = Math.abs(q.r - (k ? k.r : r)) + Math.abs(q.c - (k ? k.c : c));
          if (d < bd) { bd = d; target = q; }
        }
        if (target) { Fx.removeAt(g, target.r, target.c, {}); L('The ' + def.name + ' smites the nearest foe, ' + pname(target.cell.t) + '.'); }
        else L('The ' + def.name + ' blazes but finds no target.');
        break;
      }
      case 'miracle': {
        const rv = Fx.revive(g, side, 1);
        L(rv.length ? 'The ' + def.name + ' returns a fallen champion to the field.' : 'The ' + def.name + ' has no corpse to raise.');
        break;
      }
      case 'gambit': {
        Fx.grantExtra(g, side, 1);
        L('The ' + def.name + ' grants an extra move!');
        break;
      }
      case 'tempt': {
        const pawn = pick(enL(g, side).filter(q => q.cell.t === 'p'));
        if (pawn) { pawn.cell.c = side; L('The ' + def.name + ' turns an enemy pawn to your cause.'); }
        else L('The ' + def.name + ' finds no wavering heart.');
        break;
      }
      case 'curse': {
        if (me) {
          Fx.mod(me.cell, 'p', 1);
          if (me.cell.t !== 'k') Fx.mod(me.cell, 'f', 1);
          L('A trap! The ' + def.name + ' is cursed — the collector is poisoned' + (me.cell.t !== 'k' ? ' and frozen' : '') + '!');
        }
        break;
      }
      default:
        L('The ' + def.name + ' does something mysterious.');
    }
    return lines;
  }

  /* ---------------- public API ---------------- */
  const Items = {
    defs: I,
    count: () => I.length,
    enabled: g => !!(g && g.itemEnabled),
    countOn,
    itemAt,
    spawnCheck,
    // any piece landing on the square claims it
    tryPickup(g, r, c, side) {
      if (!g || !g.itemEnabled) return null;
      const it = itemAt(g, r, c);
      if (!it) return null;
      const def = MD.itemById(it.id);
      g.items = (g.items || []).filter(x => x !== it);
      if (!def) return null;
      try {
        const lines = resolve(g, def, side, r, c);
        if (g.fxevents) g.fxevents.push({ r, c, kind: 'item', text: (lines[0] || '') });
        return lines;
      } catch (e) {
        console.warn('Item error', def.name, e);
        return ['The item shatters uselessly.'];
      }
    }
  };
  MD.Items = Items;
})();

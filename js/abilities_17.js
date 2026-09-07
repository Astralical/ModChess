/* ============================================================
   Mod Chess — Ability set 17: THE TWELVE TALISMANS
   (JACKIE CHAN ADVENTURES / 十二生肖符咒, 成龙历险记)
   IDs 717-728. Each of the twelve zodiac talismans grants its
   signature power: Life(Rat) Strength(Ox) Balance(Tiger)
   Speed(Rabbit) Fire(Dragon) Invisibility(Snake) Healing(Horse)
   Projection(Goat) Shapeshift(Monkey) Levitation(Rooster)
   Immortality(Dog) Heat-Vision(Pig).
   Snake & Dog showcase the new VEIL / mist mechanic; a bonus
   wildcard #729 (Fog of War) lays FOG zones.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const pname = t => MD.pieceName ? MD.pieceName(t) : t;
  const nameOf = q => pname(q.cell.t);
  const nonKing = list => list.filter(q => q.cell.t !== 'k');
  const strongFirst = list => list.slice().sort((a, b) => E.val(b.cell.t) - E.val(a.cell.t));
  const strongest = (g, s, list) => strongFirst(nonKing(list || en(g, s)))[0];
  const adv = (list, s) => list.slice().sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
  const adj = (a, b) => Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1;
  const halfRows = s => (s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7]); // enemy half
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(717, 'The Rat Talisman', 2, 'Myth', 'heart',
    'The talisman of LIFE: your most valuable fallen piece is animated and rises again on your back rank, ready to fight.',
    'Life is a spark that refuses to die.', (g, s) => {
      const lines = Fx.revive(g, s, 1);
      return lines.length ? ['The Rat Talisman sparks with life!'].concat(lines) : ['No fallen body answers the call of the Rat.'];
    });

  def(718, 'The Ox Talisman', 2, 'Myth', 'shield',
    'The talisman of STRENGTH: ward your two strongest pieces with an unbreakable hide — they cannot be captured for two of the enemy\'s turns.',
    'Strength that bows to nothing.', (g, s) => {
      const picks = strongFirst(nonKing(own(g, s))).slice(0, 2);
      const n = Fx.statusOn(g, picks, 's', 2, 'shield');
      return n ? ['The Ox Talisman steels ' + n + ' of your mightiest piece' + (n > 1 ? 's' : '') + '.'] : ['The Ox finds no champion to empower.'];
    });

  def(719, 'The Tiger Talisman', 3, 'Myth', 'swap',
    'The talisman of BALANCE: the strongest of your pieces and the strongest of the enemy\'s change places — yin and yang, made equal.',
    'Two halves of one force, perfectly balanced.', (g, s) => {
      const me = strongest(g, s, own(g, s));
      const foe = strongest(g, s, en(g, s));
      if (!me || !foe) return ['Balance demands two worthy souls.'];
      Fx.swapSq(g, { r: me.r, c: me.c }, { r: foe.r, c: foe.c });
      return ['The Tiger Talisman balances the scales — your ' + pname(me.cell.t) + ' and their ' + pname(foe.cell.t) + ' change places.'];
    });

  def(720, 'The Rabbit Talisman', 2, 'Myth', 'storm',
    'The talisman of SPEED: a blur of haste wakes every frozen or groggy piece of your army at once, and one enemy pawn is left frozen in your wake.',
    'Too fast to be touched.', (g, s) => {
      let woke = 0;
      for (const q of own(g, s)) {
        if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.z > 0)) { q.cell.b.f = 0; q.cell.b.z = 0; woke++; }
      }
      const pawns = en(g, s).filter(q => q.cell.t === 'p');
      const lines = [];
      if (woke) lines.push('The Rabbit Talisman wakes ' + woke + ' of your piece' + (woke > 1 ? 's' : '') + ' from torpor.');
      if (pawns.length) {
        const p = Fx.rand(pawns);
        Fx.mod(p.cell, 'f', 1);
        lines.push('An enemy pawn is left frozen in your dust.');
      }
      return lines.length ? lines : ['The Rabbit Talisman finds nothing to hurry.'];
    });

  def(721, 'The Dragon Talisman', 3, 'Myth', 'fire',
    'The talisman of COMBUSTION: a random enemy warrior bursts into dragonfire — destroyed, and every enemy standing beside it is poisoned by the blast.',
    'What the eye sees, the heart burns.', (g, s) => {
      const pool = nonKing(en(g, s)).filter(q => q.cell.t !== 'p');
      const foe = Fx.rand(pool.length ? pool : nonKing(en(g, s)));
      if (!foe) return ['The Dragon finds no fuel to burn.'];
      const lines = [];
      lines.push('The Dragon Talisman ignites the enemy ' + nameOf(foe) + '!');
      Fx.removeAt(g, foe.r, foe.c, { kind: 'fire' });
      let seared = 0;
      for (const q of en(g, s)) {
        if (q.cell.t === 'k') continue;
        if (adj(q, foe)) { Fx.mod(q.cell, 'p', 1); seared++; }
      }
      if (seared) lines.push('The blast poisons ' + seared + ' enemy piece' + (seared > 1 ? 's' : '') + ' nearby.');
      return lines;
    });

  def(722, 'The Snake Talisman', 3, 'Myth', 'wind',
    'The talisman of INVISIBILITY: shroud your strongest piece in living mist. While veiled it is hidden — it can only be captured by a piece on an adjacent square. The mist lasts two of your turns.',
    'To vanish is to be untouchable.', (g, s) => {
      const me = strongest(g, s, own(g, s));
      if (!me) return ['The Snake finds no one to conceal.'];
      Fx.veilOn(g, [me], 1, 2);
      return ['The Snake Talisman veils your ' + nameOf(me) + ' in living mist — hidden from ranged blades.'];
    });

  def(723, 'The Horse Talisman', 2, 'Myth', 'heart',
    'The talisman of HEALING: the curative hoof sweeps your army — every friendly piece is cleansed of poison and frost, and your king is warded.',
    'A healer\'s hoof knows every wound.', (g, s) => {
      let healed = 0;
      for (const q of own(g, s)) {
        if (q.cell.b && (q.cell.b.p > 0 || q.cell.b.f > 0)) { q.cell.b.p = 0; q.cell.b.f = 0; healed++; }
      }
      const lines = [];
      if (healed) lines.push('The Horse Talisman cleanses ' + healed + ' of your piece' + (healed > 1 ? 's' : '') + '.');
      const k = E.findKing(g, s);
      if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is warded against harm.'); }
      return lines.length ? lines : ['The Horse finds no wounds to heal — it wards your king anyway.'];
    });

  def(724, 'The Goat Talisman', 4, 'Myth', 'void',
    'The talisman of ASTRAL PROJECTION: your king\'s spirit steps free of its body and rematerializes on a random empty square of your own half — a royal escape even from check.',
    'The soul steps free of the body.', (g, s) => {
      const k = E.findKing(g, s);
      if (!k) return [];
      const rows = s === 'w' ? [4, 5, 6, 7] : [0, 1, 2, 3];
      let spots = Fx.emptySq(g, (r) => rows.indexOf(r) >= 0).filter(q => !(Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1));
      if (!spots.length) spots = Fx.emptySq(g);
      const d = Fx.rand(spots);
      if (!d) return ['The king\'s spirit finds no room to land.'];
      Fx.relocate(g, k.r, k.c, d.r, d.c, { text: 'projected' });
      return ['The Goat Talisman projects your king\'s soul to ' + E.sqName(d.r, d.c) + '.'];
    });

  def(725, 'The Monkey Talisman', 4, 'Myth', 'rune',
    'The talisman of SHAPESHIFTING: the enemy\'s strongest piece is scrambled into a lowly pawn — all that power, lost in a new body.',
    'Power is only a shape.', (g, s) => {
      const foe = strongest(g, s, en(g, s));
      if (!foe) return ['The Monkey finds nothing to reshape.'];
      const was = nameOf(foe);
      Fx.transformSq(g, [foe], 'p', () => {});
      return ['The Monkey Talisman reshapes the enemy ' + was + ' into a mere pawn.'];
    });

  def(726, 'The Rooster Talisman', 2, 'Myth', 'wind',
    'The talisman of LEVITATION: lift the enemy\'s most advanced piece into the air and drop it onto a random empty square of its own half — dazed and frozen by the flight.',
    'What is lifted, the wind may keep.', (g, s) => {
      const foe = adv(nonKing(en(g, s)), s);
      if (!foe) return ['The Rooster finds nothing to lift.'];
      const was = nameOf(foe);
      const home = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
      Fx.mod(foe.cell, 'f', 1); // dazed before it is flung
      const lines = Fx.teleportToEmpty(g, { r: foe.r, c: foe.c }, { rows: home });
      if (!lines.length) return ['The Rooster cannot find a place to set the piece down.'];
      return ['The Rooster Talisman levitates the enemy ' + was + '!'].concat(lines).concat(['It lands dazed and frozen.']);
    });

  def(727, 'The Dog Talisman', 4, 'Myth', 'shield',
    'The talisman of IMMORTALITY: your strongest piece cannot die — ward it against capture for two of the enemy\'s turns, veil it in mist, and cleanse its every wound.',
    'Immortal, until the stars go out.', (g, s) => {
      const me = strongest(g, s, own(g, s));
      if (!me) return ['The Dog finds no worthy body to bless.'];
      Fx.mod(me.cell, 's', 2);
      Fx.mod(me.cell, 'v', 2);
      if (me.cell.b) { me.cell.b.p = 0; me.cell.b.f = 0; }
      return ['The Dog Talisman makes your ' + nameOf(me) + ' immortal — warded, veiled, and cleansed.'];
    });

  def(728, 'The Pig Talisman', 3, 'Myth', 'fire',
    'The talisman of HEAT VISION: your king\'s eyes blaze — the enemy piece standing closest to the throne is vaporized on the spot (never the king).',
    'A glare that melts stone.', (g, s) => {
      const k = E.findKing(g, s);
      if (!k) return [];
      const foes = nonKing(en(g, s));
      if (!foes.length) return ['The Pig finds no enemy in its sight.'];
      const dist = q => Math.max(Math.abs(q.r - k.r), Math.abs(q.c - k.c));
      const closest = Math.min.apply(null, foes.map(dist));
      const cands = foes.filter(q => dist(q) === closest);
      const foe = Fx.rand(cands);
      Fx.removeAt(g, foe.r, foe.c, { kind: 'fire' });
      return ['The Pig Talisman vaporizes the enemy ' + nameOf(foe) + ' with a searing glare.'];
    });

  def(729, 'Fog of War', 3, 'Chaos', 'wind',
    'A cold bank of mist rolls across the enemy\'s half — cover up to FIVE empty squares there with FOG. Any piece standing in the fog is hidden: it can only be captured by a piece on an adjacent square. Shroud your vanguard, or blind their lines.',
    'War is easiest when the enemy cannot see it coming.', (g, s) => {
      const n = Fx.layZone(g, 'fog', 5, { rows: halfRows(s) });
      return n ? ['Fog of war swallows ' + n + ' empty square' + (n > 1 ? 's' : '') + ' of the enemy\'s half.'] : ['The mist finds no open ground to settle on.'];
    });

  MD.AB_17 = A;
})();

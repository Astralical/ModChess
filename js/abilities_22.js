/* ============================================================
   Mod Chess — Ability set 22: TAROT (塔罗牌)
   IDs 1030-1107. The full 78-card deck:
     • 22 Major Arcana (ids 1030-1051)  — grand, polarity-driven trump cards
     • 40 Minor Arcana pips (1052-1103) — Ace..Ten of Wands/Cups/Swords/Pentacles
     • 16 Minor Arcana court (1104-1107) — Page/Knight/Queen/King of each suit

   THREE NEW MECHANICS (see js/tarot.js):
     1. ARCANA POLARITY — every card resolves UPRIGHT or REVERSED.
     2. SUIT ATTUNEMENT  — Wands/Cups/Swords/Pentacles markers with passives
        and alignment bonuses.
     3. PROPHECY         — delayed, conditional fates laid on a square.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const pn = t => (MD.pieceName ? MD.pieceName(t) : t);
  const foes = (g, s) => Fx.enemy(g, s).filter(q => q.cell.t !== 'k');
  const own = (g, s) => Fx.own(g, s);
  const mine = (g, s) => Fx.own(g, s).filter(q => q.cell.t !== 'k');
  const strongFoe = (g, s) => foes(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0];
  const weakFoe = (g, s) => foes(g, s).sort((a, b) => Fx.value(a.cell.t) - Fx.value(b.cell.t))[0];
  const advOwn = (g, s) => mine(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
  const advFoe = (g, s) => foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
  const kill = (g, q) => { if (q) Fx.removeAt(g, q.r, q.c, {}); return !!q; };
  const shieldList = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list.slice(), Math.min(n == null ? list.length : n, list.length)), 's', 1, 'shield');
  const freezeList = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list.slice(), Math.min(n == null ? list.length : n, list.length)), 'f', 1, 'freeze');
  const poisonList = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list.slice(), Math.min(n == null ? list.length : n, list.length)), 'p', 1, 'poison');
  const doomList = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list.slice(), Math.min(n == null ? list.length : n, list.length)), 'doom', 1, 'poison');
  const summon = (g, s, t, n) => Fx.summonN(g, s, t, n || 1, {});
  const attune = (g, list, suit) => Fx.attune(g, list, suit);
  const say = (lines, rev, txt) => lines.push((rev ? 'REVERSED — ' : 'UPRIGHT — ') + txt);
  const kingSq = (g, s) => E.findKing(g, s);

  const A = [];
  const def = (id, name, rarity, icon, desc, flavor, run) => A.push({ id, name, rarity, cat: 'Tarot', icon, desc, flavor, target: 'auto', run });

  /* ==================== 22 MAJOR ARCANA ==================== */
  def(1030, 'The Fool', 3, 'spark', 'Polarity decides your leap of faith. Upright: your most advanced piece teleports to a random empty square and you take an extra move. Reversed: recklessness costs you your least advanced pawn.', 'The journey begins with a step off the cliff.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const t = advOwn(g, s);
      if (t) { lines.push(...Fx.teleportToEmpty(g, t, {})); }
      Fx.grantExtra(g, s, 1);
      say(lines, rev, 'A leap of faith — your vanguard warps away and you move again.');
    } else {
      const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).pop();
      if (p) { kill(g, p); lines.push('The fall claims a stray pawn.'); }
      say(lines, rev, 'Recklessness — a pawn stumbles off the edge.');
    }
    return lines;
  });

  def(1031, 'The Magician', 4, 'rune', 'Always upright: the Magician commands polarity. Attune two of your pieces to a suit of their own will and shield them both — then cast again this turn.', 'As above, so below.', (g, s) => {
    const rev = Fx.tarotFlip(g, { force: false });
    const lines = [];
    const suits = ['wand', 'cup', 'sword', 'pent'];
    const suit = Fx.rand(suits);
    const list = Fx.uniqN(foes(g, s).length ? own(g, s) : own(g, s), Math.min(2, own(g, s).length));
    const n = attune(g, list, suit);
    shieldList(g, list, 2);
    Fx.grantExtra(g, s, 1);
    say(lines, rev, 'Two pieces are attuned to ' + MD.Tarot.suitLabel(suit) + ' (' + n + '), warded, and you cast on.');
    return lines;
  });

  def(1032, 'The High Priestess', 4, 'eye', 'Upright: lay a PROPHECY — after two of your turns, mist veils two enemies. Reversed: keep your own secret — veil your strongest piece for two turns instead.', 'The veil between the seen and the unseen.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const t = Fx.rand(foes(g, s)) || kingSq(g, s) || { r: 0, c: 0 };
      Fx.prophesy(g, { side: s, r: t.r, c: t.c, trigger: 'turn', turns: 2, act: 'veilEnemies', n: 2 });
      lines.push('A prophecy is laid upon ' + E.sqName(t.r, t.c) + '.');
      say(lines, rev, 'In two turns, mist will shroud two foes.');
    } else {
      const st = strongFoe(g, s) ? null : null;
      const ownStrong = mine(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0];
      if (ownStrong) Fx.statusOn(g, [ownStrong], 'v', 2, 'wind');
      say(lines, rev, 'Your strongest piece slips into living mist.');
    }
    return lines;
  });

  def(1033, 'The Empress', 4, 'heart', 'Upright: abundance — summon TWO Cup courtiers and shield them. Reversed: barren ground — every shield on your side is stripped away.', 'Nurture, and the garden answers.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const opts = ['cuppage', 'cupknight', 'cupqueen'];
      const a = Fx.rand(opts), b = Fx.rand(opts);
      lines.push(...summon(g, s, a, 1));
      lines.push(...summon(g, s, b, 1));
      shieldList(g, own(g, s), 4);
      say(lines, rev, 'Two cup-bearers answer the call, shielded.');
    } else {
      let n = 0;
      for (const q of own(g, s)) if (q.cell.b && q.cell.b.s > 0) { q.cell.b.s = 0; n++; }
      say(lines, rev, 'The garden withers — ' + n + ' of your shields fall away.');
    }
    return lines;
  });

  def(1034, 'The Emperor', 4, 'crown', 'Upright: martial order — attune three of your pieces to Pentacles and shield your king. Reversed: authority breaks — your own strongest piece is frozen in indecision.', 'A throne of stone and iron.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const n = attune(g, Fx.uniqN(mine(g, s), Math.min(3, mine(g, s).length)), 'pent');
      const k = kingSq(g, s);
      if (k) Fx.statusOn(g, [k], 's', 1, 'shield');
      say(lines, rev, n + ' pieces are attuned to Pentacles and the king is warded.');
    } else {
      const st = mine(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0];
      if (st) Fx.statusOn(g, [st], 'f', 1, 'freeze');
      say(lines, rev, 'Command falters — your strongest piece freezes.');
    }
    return lines;
  });

  def(1035, 'The Hierophant', 3, 'book', 'Upright: lay a PROPHECY on your king\'s square — after one turn a Pentacle Knight is delivered there. Reversed: dogma binds you — your most advanced piece is frozen.', 'Tradition hands down the key.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const k = kingSq(g, s) || { r: 0, c: 0 };
      Fx.prophesy(g, { side: s, r: k.r, c: k.c, trigger: 'turn', turns: 1, act: 'summon', type: 'pentknight' });
      say(lines, rev, 'A knight of earth will arrive at the throne next turn.');
    } else {
      const t = advOwn(g, s);
      if (t) Fx.statusOn(g, [t], 'f', 1, 'freeze');
      say(lines, rev, 'Rigid doctrine roots your vanguard in place.');
    }
    return lines;
  });

  def(1036, 'The Lovers', 3, 'heart', 'Upright: union — swap two of your own pieces anywhere and shield them both. Reversed: a choice unmade — the ENEMY chooses, swapping two of your pieces.', 'Two paths, one heart.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    const two = Fx.uniqN(own(g, s), Math.min(2, own(g, s).length));
    if (two.length === 2) {
      Fx.swapSq(g, two[0], two[1]);
      shieldList(g, two, 2);
      say(lines, rev, rev ? 'A forced union shuffles your two pieces.' : 'Two pieces exchange places, shielded.');
    } else lines.push('There is no one to unite.');
    return lines;
  });

  def(1037, 'The Chariot', 3, 'flag', 'Upright: victory charge — take an EXTRA move and shield your most advanced piece. Reversed: the wheels lock — your most advanced piece is frozen.', 'The will drives the wheels.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    const t = advOwn(g, s);
    if (!rev) {
      if (t) Fx.statusOn(g, [t], 's', 1, 'shield');
      Fx.grantExtra(g, s, 1);
      say(lines, rev, 'Your vanguard is warded and you ride again.');
    } else {
      if (t) Fx.statusOn(g, [t], 'f', 1, 'freeze');
      say(lines, rev, 'The chariot is mired — your vanguard cannot move.');
    }
    return lines;
  });

  def(1038, 'Strength', 3, 'shield', 'Upright: fortitude — shield ALL your pieces and cleanse them. Reversed: pride — your strongest piece is poisoned.', 'Patience tames the lion.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const n = own(g, s).length;
      for (const q of own(g, s)) { if (!q.cell.b) q.cell.b = { f: 0, s: 0, p: 0 }; q.cell.b.s = 1; q.cell.b.p = 0; q.cell.b.f = 0; }
      say(lines, rev, 'Your whole army is steadied — ' + n + ' pieces warded and cleansed.');
    } else {
      const st = mine(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0];
      if (st) Fx.mod(st.cell, 'p', 1);
      say(lines, rev, 'Pride poisons your strongest piece.');
    }
    return lines;
  });

  def(1039, 'The Hermit', 3, 'hourglass', 'Upright: lay a PROPHECY on a random enemy square — after two turns it detonates, consuming the neighbours. Reversed: the lamp goes out — your king is frozen.', 'The lantern lights one step ahead.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const t = Fx.rand(foes(g, s)) || Fx.rand(Fx.emptySq(g)) || kingSq(g, s) || { r: 0, c: 0 };
      Fx.prophesy(g, { side: s, r: t.r, c: t.c, trigger: 'turn', turns: 2, act: 'blast' });
      say(lines, rev, 'A lantern is set at ' + E.sqName(t.r, t.c) + '; in two turns it bursts.');
    } else {
      const k = kingSq(g, s);
      if (k) Fx.statusOn(g, [k], 'f', 1, 'freeze');
      say(lines, rev, 'The hermit\'s light fails — your king is frozen.');
    }
    return lines;
  });

  def(1040, 'Wheel of Fortune', 4, 'dice', 'Upright: a windfall — shield your whole army and attune three of them to a random suit. Reversed: the wheel turns down — two of your pieces are frozen.', 'Round and round the fortunes go.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      shieldList(g, own(g, s), own(g, s).length);
      const suit = Fx.rand(['wand', 'cup', 'sword', 'pent']);
      const n = attune(g, Fx.uniqN(mine(g, s), Math.min(3, mine(g, s).length)), suit);
      say(lines, rev, 'Fortune smiles — the army is warded and ' + n + ' are attuned to ' + MD.Tarot.suitLabel(suit) + '.');
    } else {
      const n = freezeList(g, mine(g, s), 2);
      say(lines, rev, 'Fortune turns — ' + n + ' of your pieces are frozen.');
    }
    return lines;
  });

  def(1041, 'Justice', 4, 'scale', 'Upright: the scales balance — destroy the enemy\'s strongest piece, and your own weakest falls in payment. Reversed: injustice — it is YOUR strongest that falls.', 'Every debt is weighed.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const e = strongFoe(g, s); if (kill(g, e)) lines.push('Justice claims the enemy ' + pn(e.cell.t) + '.');
      const w = mine(g, s).sort((a, b) => Fx.value(a.cell.t) - Fx.value(b.cell.t))[0];
      if (kill(g, w)) lines.push('The scales take your ' + pn(w.cell.t) + ' in return.');
      say(lines, rev, 'The balance is struck.');
    } else {
      const st = mine(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0];
      if (kill(g, st)) lines.push('The verdict falls on your ' + pn(st.cell.t) + '.');
      say(lines, rev, 'Judgement turns against you.');
    }
    return lines;
  });

  def(1042, 'The Hanged Man', 3, 'lock', 'Always reversed: suspension. Your strongest piece is petrified for a turn — but the upside-down view grants insight: attune two of your pieces to Swords.', 'A pause, a price, a new perspective.', (g, s) => {
    const rev = Fx.tarotFlip(g, { force: true });
    const lines = [];
    const st = mine(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0];
    if (st) Fx.statusOn(g, [st], 'st', 1, 'freeze');
    const n = attune(g, Fx.uniqN(mine(g, s), Math.min(2, mine(g, s).length)), 'sword');
    say(lines, rev, 'Suspended: your strongest is petrified a turn, while ' + n + ' pieces are attuned to Swords.');
    return lines;
  });

  def(1043, 'Death', 4, 'skull', 'Upright: an ending and a beginning — destroy the enemy\'s strongest piece, then revive one of your fallen. Reversed: death inverted — cleanse your army and destroy every enemy already poisoned.', 'The end is only a gate.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const e = strongFoe(g, s); if (kill(g, e)) lines.push('Death takes the enemy ' + pn(e.cell.t) + '.');
      const rv = Fx.revive(g, s, 1, {}); if (rv && rv.length) lines.push(...rv);
      say(lines, rev, 'One falls; one returns.');
    } else {
      for (const q of own(g, s)) if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; }
      const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
      targets.forEach(q => kill(g, q));
      say(lines, rev, 'The plague-eaten (' + targets.length + ') are released; your army is cleansed.');
    }
    return lines;
  });

  def(1044, 'Temperance', 3, 'drop', 'Upright: balance — cleanse your whole army and shield up to three pieces. Reversed: excess — poison two of your own pieces.', 'Everything in measure.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      for (const q of own(g, s)) if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; }
      const n = shieldList(g, own(g, s), 3);
      say(lines, rev, 'Your army is cleansed and ' + n + ' pieces warded.');
    } else {
      const n = poisonList(g, mine(g, s), 2);
      say(lines, rev, 'The cup overflows — ' + n + ' of your pieces are poisoned.');
    }
    return lines;
  });

  def(1045, 'The Devil', 4, 'lock', 'Upright: lay a PROPHECY — whoever LEAVES the enemy\'s strongest square is doomed. Reversed: the chains bind you — your own most advanced piece is doomed.', 'Temptation always sends a bill.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const t = strongFoe(g, s) || Fx.rand(foes(g, s)) || kingSq(g, s) || { r: 0, c: 0 };
      Fx.prophesy(g, { side: s, r: t.r, c: t.c, trigger: 'leave', act: 'doomMover' });
      say(lines, rev, 'A pact waits at ' + E.sqName(t.r, t.c) + ' — leave it and be doomed.');
    } else {
      const t = advOwn(g, s);
      if (t) Fx.statusOn(g, [t], 'doom', 1, 'poison');
      say(lines, rev, 'The chains close on your vanguard — it is doomed.');
    }
    return lines;
  });

  def(1046, 'The Tower', 4, 'storm', 'Upright: catastrophe — destroy a random enemy major and blast the pieces around it. Reversed: the tower falls inward — three of your own pieces are frozen in the rubble.', 'Lightning does not ask permission.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const majors = foes(g, s).filter(q => ['r', 'q', 'b', 'n'].includes(q.cell.t) || (MD.TROOPS[q.cell.t]));
      const t = Fx.rand(majors) || strongFoe(g, s);
      if (t) {
        const { r, c } = t;
        kill(g, t);
        const blast = Fx.bomb(g, r, c, 1, { only: (s === 'w' ? 'b' : 'w') });
        lines.push(...blast);
        lines.push('The Tower falls at ' + E.sqName(r, c) + '.');
      }
      say(lines, rev, 'Catastrophe strikes the enemy.');
    } else {
      const n = freezeList(g, mine(g, s), 3);
      say(lines, rev, 'The rubble buries ' + n + ' of your pieces.');
    }
    return lines;
  });

  def(1047, 'The Star', 4, 'star', 'Upright: hope — revive one of your fallen pieces and shield your whole army. Reversed: the light is dimmed — veil three enemy pieces in mist.', 'A light that guides the lost.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const rv = Fx.revive(g, s, 1, {}); if (rv && rv.length) lines.push(...rv);
      shieldList(g, own(g, s), own(g, s).length);
      say(lines, rev, 'A fallen piece returns and the army is warded.');
    } else {
      const n = Fx.statusOn(g, Fx.uniqN(foes(g, s), Math.min(3, foes(g, s).length)), 'v', 2, 'wind');
      say(lines, rev, 'The dimmed light hides ' + n + ' enemy pieces in mist.');
    }
    return lines;
  });

  def(1048, 'The Moon', 3, 'void', 'Upright: lay a PROPHECY on an enemy piece — the moment it LEAVES its square it is frozen. Reversed: your own most advanced piece is veiled in illusion for two turns.', 'What you see is not what is.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const t = Fx.rand(foes(g, s)) || kingSq(g, s) || { r: 0, c: 0 };
      Fx.prophesy(g, { side: s, r: t.r, c: t.c, trigger: 'leave', act: 'freezeMover' });
      say(lines, rev, 'A moonlit trap waits on ' + E.sqName(t.r, t.c) + '.');
    } else {
      const t = advOwn(g, s);
      if (t) Fx.statusOn(g, [t], 'v', 2, 'wind');
      say(lines, rev, 'Your vanguard walks in illusion, hidden two turns.');
    }
    return lines;
  });

  def(1049, 'The Sun', 4, 'fire', 'Upright: radiance — cleanse and shield your whole army, then take an EXTRA move. Reversed: blinding glare — your two least advanced pieces are frozen.', 'Nothing is hidden in the light.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      for (const q of own(g, s)) { if (!q.cell.b) q.cell.b = { f: 0, s: 0, p: 0 }; q.cell.b.p = 0; q.cell.b.f = 0; q.cell.b.s = 1; }
      Fx.grantExtra(g, s, 1);
      say(lines, rev, 'Sunlight cleanses and wards the army — and you shine on.');
    } else {
      const least = mine(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
      const n = freezeList(g, least, 2);
      say(lines, rev, 'The glare blinds — ' + n + ' pieces are frozen.');
    }
    return lines;
  });

  def(1050, 'Judgement', 5, 'crown', 'Upright: the last trumpet — revive up to THREE of your fallen pieces. Reversed: the reckoning — DOOM every enemy pawn.', 'The dead are called to answer.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      const rv = Fx.revive(g, s, 3, {}); if (rv && rv.length) lines.push(...rv);
      say(lines, rev, 'The trumpet sounds — the fallen rise.');
    } else {
      const pawns = foes(g, s).filter(q => q.cell.t === 'p');
      const n = doomList(g, pawns, pawns.length);
      say(lines, rev, 'The reckoning dooms ' + n + ' enemy pawns.');
    }
    return lines;
  });

  def(1051, 'The World', 5, 'star', 'Upright: completion — shield your whole army, attune four of them to a random suit, and take an EXTRA move. Reversed: the cycle shatters — EVERY one of your pieces is frozen for a turn.', 'The end of the road, and the start.', (g, s) => {
    const rev = Fx.tarotFlip(g, {});
    const lines = [];
    if (!rev) {
      shieldList(g, own(g, s), own(g, s).length);
      const suit = Fx.rand(['wand', 'cup', 'sword', 'pent']);
      const n = attune(g, Fx.uniqN(mine(g, s), Math.min(4, mine(g, s).length)), suit);
      Fx.grantExtra(g, s, 1);
      say(lines, rev, 'The world turns: the army is warded, ' + n + ' attuned to ' + MD.Tarot.suitLabel(suit) + ', and you move again.');
    } else {
      const n = freezeList(g, own(g, s), own(g, s).length);
      say(lines, rev, 'The cycle breaks — your entire army (' + n + ') is frozen.');
    }
    return lines;
  });

  /* ==================== 40 MINOR ARCANA (pips) ==================== */
  const NUM_NAMES = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const rarityFor = r => (r <= 3 ? 1 : r <= 7 ? 2 : 3);

  const SUIT_DEF = {
    Wands: {
      suit: 'wand', icon: 'fire',
      desc: r => 'Attune a piece to Wands, then wand-fire POISONS up to ' + r + ' enemies. Aligned Wands (2+ attuned) burn one extra and FREEZE the strongest foe.',
      run: (g, s, r) => {
        const lines = [];
        attune(g, Fx.uniqN(mine(g, s), 1), 'wand');
        const aligned = Fx.suitAligned(g, s, 'wand');
        const n = r + (aligned ? 1 : 0);
        const k = poisonList(g, foes(g, s), n);
        lines.push('Wand-fire scorches ' + k + ' enemy ' + (k === 1 ? 'piece' : 'pieces') + '.');
        if (aligned) { const st = strongFoe(g, s); if (st) { Fx.mod(st.cell, 'f', 1); lines.push('Aligned Wands freeze the strongest foe.'); } }
        return lines;
      }
    },
    Cups: {
      suit: 'cup', icon: 'drop',
      desc: r => 'Attune a piece to Cups, then cleanse and SHIELD up to ' + r + ' of your pieces. Aligned Cups (2+ attuned) also raise one of your fallen.',
      run: (g, s, r) => {
        const lines = [];
        attune(g, Fx.uniqN(mine(g, s), 1), 'cup');
        const aligned = Fx.suitAligned(g, s, 'cup');
        const n = r + (aligned ? 1 : 0);
        const list = Fx.uniqN(own(g, s), Math.min(n, own(g, s).length));
        for (const q of list) { if (!q.cell.b) q.cell.b = { f: 0, s: 0, p: 0 }; q.cell.b.p = 0; q.cell.b.f = 0; q.cell.b.s = 1; Fx.flash(g, q.r, q.c, 'shield', ''); }
        lines.push('Cups cleanse and ward ' + list.length + ' of your pieces.');
        if (aligned) { const rv = Fx.revive(g, s, 1, {}); if (rv && rv.length) lines.push(...rv); }
        return lines;
      }
    },
    Swords: {
      suit: 'sword', icon: 'wind',
      desc: r => 'Attune a piece to Swords, then FREEZE up to ' + r + ' enemies. Aligned Swords (2+ attuned) cut down one frozen foe.',
      run: (g, s, r) => {
        const lines = [];
        attune(g, Fx.uniqN(mine(g, s), 1), 'sword');
        const aligned = Fx.suitAligned(g, s, 'sword');
        const k = freezeList(g, foes(g, s), r);
        lines.push('Swords bind ' + k + ' enemy ' + (k === 1 ? 'piece' : 'pieces') + ' in stillness.');
        if (aligned) { const fr = foes(g, s).filter(q => q.cell.b && q.cell.b.f > 0); if (fr.length) { const t = Fx.rand(fr); kill(g, t); lines.push('Aligned Swords cut down a bound foe.'); } }
        return lines;
      }
    },
    Pentacles: {
      suit: 'pent', icon: 'coin',
      desc: r => 'Attune a piece to Pentacles, then SHIELD up to ' + r + ' of your pieces. Aligned Pentacles (2+ attuned) attune one more to earth.',
      run: (g, s, r) => {
        const lines = [];
        attune(g, Fx.uniqN(mine(g, s), 1), 'pent');
        const aligned = Fx.suitAligned(g, s, 'pent');
        const k = shieldList(g, own(g, s), r);
        lines.push('Pentacles fortify ' + k + ' of your pieces with shields.');
        if (aligned) { const n2 = attune(g, Fx.uniqN(mine(g, s), 1), 'pent'); lines.push('Aligned Pentacles attune ' + n2 + ' more to earth.'); }
        return lines;
      }
    }
  };

  let id = 1052;
  for (const suitName of Object.keys(SUIT_DEF)) {
    const sd = SUIT_DEF[suitName];
    for (let i = 0; i < 10; i++) {
      const r = i + 1;
      const name = NUM_NAMES[i] + ' of ' + suitName;
      const desc = sd.desc(r);
      def(id++, name, rarityFor(r), sd.icon, desc, 'The ' + name.toLowerCase() + ' turns in the reading.', (g, s) => sd.run(g, s, r));
    }
  }

  /* ==================== 16 MINOR ARCANA (court) ==================== */
  const COURTS = ['Page', 'Knight', 'Queen', 'King'];
  const COURT_UNIT = { Wands: ['wandpage', 'wandknight', 'wandqueen', 'wandking'], Cups: ['cuppage', 'cupknight', 'cupqueen', 'cupking'], Swords: ['swordpage', 'swordknight', 'swordqueen', 'swordking'], Pentacles: ['pentpage', 'pentknight', 'pentqueen', 'pentking'] };
  const COURT_RAR = [2, 3, 4, 4];
  const COURT_DESC = {
    Wands: t => 'Call the ' + t + ' of Wands — a fire-attuned courtier joins your ranks and its arrival poisons a random enemy.',
    Cups: t => 'Call the ' + t + ' of Cups — a water-attuned courtier joins you and its coming shields two of your pieces.',
    Swords: t => 'Call the ' + t + ' of Swords — an air-attuned courtier joins you and its coming freezes a random enemy.',
    Pentacles: t => 'Call the ' + t + ' of Pentacles — an earth-attuned courtier joins you and its coming shields your king.'
  };
  for (const suitName of Object.keys(COURT_UNIT)) {
    for (let i = 0; i < 4; i++) {
      const t = COURTS[i], unit = COURT_UNIT[suitName][i], suit = SUIT_DEF[suitName].suit;
      const name = t + ' of ' + suitName;
      def(id++, name, COURT_RAR[i], SUIT_DEF[suitName].icon, COURT_DESC[suitName](t), 'The court of ' + suitName + ' answers.', (g, s) => {
        const lines = summon(g, s, unit, 1);
        if (!lines.length) return ['There is no room for ' + pn(unit) + '.'];
        attune(g, Fx.uniqN(mine(g, s), 1), suit);
        if (suit === 'wand') { const n = poisonList(g, foes(g, s), 1); if (n) lines.push('Wand-fire poisons an enemy.'); }
        else if (suit === 'cup') { shieldList(g, own(g, s), 2); lines.push('Cups shield two of your pieces.'); }
        else if (suit === 'sword') { const n = freezeList(g, foes(g, s), 1); if (n) lines.push('Swords freeze an enemy.'); }
        else { const k = kingSq(g, s); if (k) Fx.statusOn(g, [k], 's', 1, 'shield'); lines.push('Pentacles shield your king.'); }
        return lines;
      });
    }
  }

  MD.AB_22 = A;
})();

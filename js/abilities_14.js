/* ============================================================
   Mod Chess — Ability set 14: PIRATES & THE DEEP  IDs 607-656
   Signature ideas:
     • Abyssal troops: Sea Serpent, Leviathan, Coral Queen.
     • TIDE magic — push/pull whole ranks/files, whirlpools.
     • REEF / TRAP HAZARDS laid in the shallows.
     • CREW & PLUNDER — convert, board, and ransom enemy units.
     • The DEEP — storms, wrecks, and things that come back.
   No card is a plain copy of another pool's spell.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const E = MD.Engine, Fx = MD.Fx, O = Fx.opp;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);
  const rnd = a => Fx.rand(a);
  const val = t => E.val(t);
  const foes = (g, s) => en(g, s).filter(q => q.cell.t !== 'k');
  const mine = (g, s) => own(g, s).filter(q => q.cell.t !== 'k');
  const adv = (g, s) => mine(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
  const advP = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
  const strong = (g, s) => foes(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
  const weak = (g, s) => foes(g, s).sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
  const kill = (g, q) => { Fx.removeAt(g, q.r, q.c, {}); };
  const summon = (g, s, t, n, rows) => Fx.summonN(g, s, t, n, rows ? { rows } : {});
  const shore = (g, q) => q.c === 0 || q.c === Fx.bd(g) - 1;
  const A = [];
  const def = (id, name, rarity, icon, desc, flavor, run) => A.push({ id, name, rarity, cat: 'Ocean', icon, desc, flavor, target: 'auto', run });

  def(607, 'Sea Serpent Rising', 3, 'drop', 'The great serpent breaches: summon a Sea Serpent, and drag one random enemy piece from an EDGE file into the deep (destroy it).', 'The water bulges, then it strikes.', (g, s) => {
    const lines = summon(g, s, 'seaserpent', 1);
    const t = rnd(foes(g, s).filter(q => shore(g, q)));
    if (t) { kill(g, t); lines.push('A serpent drags the edge sentry below.'); }
    return lines.length ? lines : ['The deep is quiet.'];
  });

  def(608, 'Leviathan', 4, 'void', 'Older than the sea: summon a Leviathan — a titan that slithers like a queen and reaps any piece it touches.', 'The abyss has a name.', (g, s) => summon(g, s, 'leviathan', 1));

  def(609, 'Coral Queen', 3, 'leaf', 'The reef monarch takes the board: summon a Coral Queen — at the end of each of your turns she FREEZES an adjacent foe.', 'Beautiful, patient, frozen.', (g, s) => summon(g, s, 'coralqueen', 1, s === 'w' ? [4, 5] : [2, 3]));

  def(610, 'Board the Prize', 2, 'swap', 'Swing aboard and take her: convert a random enemy ROOK or BISHOP — it becomes YOUR piece.', 'She sails for us now.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'b'));
    if (!t) return ['No prize worth boarding.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['You board and claim the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(611, 'Walk the Plank', 2, 'target', 'Marched to the edge: relocate a random enemy piece to an empty square on the edge file of its OWN side (the plank).', 'One step too far.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return [];
    const back = t.cell.c === 'w' ? 7 : 0;
    const rows = [back];
    const dest = rnd(Fx.emptySq(g, r => rows.includes(r)));
    if (!dest) return ['The plank is crowded.'];
    Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is marched to the plank.'];
  });

  def(612, 'Full Broadside', 3, 'fire', 'A full broadside down a RANK: destroy every enemy piece on the rank of your most advanced piece.', 'Fire, reload, fire.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const t = foes(g, s).filter(q => q.r === p.r);
    const lines = [];
    for (const x of t) { kill(g, x); lines.push('The broadside sinks an enemy ' + MD.pieceName(x.cell.t) + '.'); }
    return lines.length ? lines : ['The broadside hits open water.'];
  });

  def(613, 'Tidal Wave', 3, 'drop', 'A wall of water: push EVERY enemy piece one square toward their own side (a whole-rank shove).', 'The sea rearranges armies.', (g, s) => {
    const dir = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const q of foes(g, s)) {
      const nr = q.r + dir;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][q.c]) { Fx.relocate(g, q.r, q.c, nr, q.c, {}); moved++; }
    }
    return moved ? ['The tide shoves ' + moved + ' enemy' + (moved > 1 ? 's' : '') + ' back.'] : ['The wave breaks on a wall.'];
  });

  def(614, 'Whirlpool', 2, 'swap', 'Spin two enemies around each other: swap two random enemy pieces.', 'Round and round and under.', (g, s) => {
    const es = Fx.uniqN(foes(g, s), 2);
    if (es.length < 2) return ['The vortex finds nothing to spin.'];
    Fx.swapSq(g, es[0], es[1]);
    return ['A whirlpool yanks two enemy pieces into each other\'s places!'];
  });

  def(615, 'Coral Reef', 2, 'leaf', 'A reef grows where the enemy advances: lay a freezing REEF hazard on up to three empty squares in front of your most advanced pawn.', 'Sharp, patient, unyielding.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const rows = [p.r + (s === 'w' ? -1 : 1)];
    const n = Fx.layHazards(g, 'freeze', 3, { rows, name: 'coral reef' });
    return n ? ['A reef blooms across ' + n + ' empty square' + (n > 1 ? 's' : '') + ' — anything stepping there is frozen.'] : ['The reef cannot take root.'];
  });

  def(616, 'Davy Jones\' Locker', 3, 'skull', 'One to the locker: destroy a random enemy piece worth a rook or more — or the strongest piece if none.', 'The deep keeps what it takes.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) t = strong(g, s);
    if (!t) return ['The locker is already full.'];
    kill(g, t);
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is locked below the waves!'];
  });

  def(617, 'Ghost Ship', 3, 'skull', 'She sails without wind: revive your most valuable fallen piece — or summon a Sea Serpent if none have fallen.', 'The Dutchman always collects.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    return summon(g, s, 'seaserpent', 1);
  });

  def(618, 'Plunder', 1, 'coin', 'Pillage the convoy: destroy a random enemy pawn and gain a shield on your king (plundered gold pays for repairs).', 'Gold is heavier than mercy.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    const lines = [];
    if (t) { kill(g, t); lines.push('Your crew plunders an enemy pawn.'); }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The plunder pays to armor the king.'); }
    return lines.length ? lines : ['The sea yields nothing.'];
  });

  def(619, 'Siren Song', 2, 'eye', 'The sirens call: FREEZE the enemy\'s strongest piece (they stop to listen).', 'Sailors weep and follow.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['The sirens\' song freezes the enemy ' + MD.pieceName(t.cell.t) + ' in place.'];
  });

  def(620, 'Harpoon and Haul', 2, 'target', 'A harpoon, a rope, a prize: destroy a random enemy piece, and pull YOUR most advanced piece one step forward.', 'One pull, two results.', (g, s) => {
    const t = rnd(foes(g, s));
    const lines = [];
    if (t) { kill(g, t); lines.push('The harpoon pierces an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = advP(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('The line hauls your vanguard forward.'); }
    }
    return lines.length ? lines : ['The harpoon finds open water.'];
  });

  def(621, 'Kraken\'s Grip', 4, 'drop', 'Tentacles from the abyss: FREEZE every enemy piece on the two center files, then destroy the strongest one among them.', 'The water turns black with ink.', (g, s) => {
    const trapped = foes(g, s).filter(q => q.c === 3 || q.c === 4);
    const lines = [];
    const n = Fx.statusOn(g, trapped, 'f', 1, 'freeze');
    if (n) lines.push('The Kraken\'s grip seals ' + n + ' enemy in the middle.');
    const star = trapped.sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (star) { kill(g, star); lines.push('A tentacle drags the ' + MD.pieceName(star.cell.t) + ' into the deep.'); }
    return lines.length ? lines : ['The Kraken sleeps.'];
  });

  def(622, 'Mutiny', 2, 'swap', 'Bad rum, worse officers: one random enemy PAWN mutinies and joins your crew.', 'Every crew is one meal from mutiny.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The crew stays loyal.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['An enemy pawn mutinies and joins you!'];
  });

  def(623, 'Monsoon', 3, 'storm', 'The sky opens: FREEZE every enemy piece on your two most advanced FILES.', 'The rain turns the field to mud.', (g, s) => {
    const n6 = g.n || 8;
    const counts = [];
    for (let c = 0; c < n6; c++) { let sum = 0; for (const q of foes(g, s)) if (q.c === c) sum += (s === 'w' ? q.r : (n6 - 1) - q.r); counts.push({ c, sum }); }
    const order = counts.sort((a, b) => b.sum - a.sum);
    const files = order.slice(0, 2).map(o => o.c);
    const t = foes(g, s).filter(q => files.includes(q.c));
    const n = Fx.statusOn(g, t, 'f', 1, 'freeze');
    return n ? ['The monsoon mires ' + n + ' enemy on the crowded files.'] : ['The storm passes at sea.'];
  });

  def(624, 'Powder Room', 2, 'fire', 'A lucky shot into the magazine: destroy a random enemy piece and lay an ember HAZARD where it stood (burns shields, poisons).', 'The whole ship goes.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return ['The powder is dry.'];
    kill(g, t);
    E.setHaz(g, t.r, t.c, 'ember', 'burning wreck');
    return ['An enemy ' + MD.pieceName(t.cell.t) + ' explodes, and the square now BURNS.'];
  });

  def(625, 'Jellyfish Veil', 1, 'skull', 'A drifting veil of stingers: poison TWO random enemy pieces.', 'Beautiful, then burning.', (g, s) => {
    const n = Fx.poisonN(g, s, 2);
    return n ? ['Jellyfish venom stings ' + n + ' enemy.'] : ['The current carries the veil away.'];
  });

  def(626, 'Shark Frenzy', 2, 'paw', 'Blood in the water: destroy a random enemy pawn AND poison a random enemy piece.', 'They smell it from a mile.', (g, s) => {
    const lines = [];
    const p = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (p) { kill(g, p); lines.push('A fin takes an enemy pawn.'); }
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); lines.push('A frenzy poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines.length ? lines : ['The water is still.'];
  });

  def(627, 'Treasure Map', 2, 'key', 'X marks the spot: take an EXTRA move and your most advanced pawn is shielded (the crew found a cache).', 'The map is half the treasure.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const p = advP(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); return ['X marks the spot — an extra move, and your vanguard is armored with gold.']; }
    return ['The map leads only to an extra move.'];
  });

  def(628, 'Bilge Rats', 1, 'skull', 'Rats in the enemy hold: poison a random enemy piece, then your most advanced pawn scurries forward.', 'Rats always survive.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); lines.push('Rats poison an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = advP(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('Your vanguard scurries forward.'); }
    }
    return lines.length ? lines : ['The rats have fled.'];
  });

  def(629, 'Barrel Roll', 2, 'wind', 'Dodge the grapeshot: your most advanced piece rolls to the side (any adjacent empty square) and gains a shield.', 'Roll, roll, roll.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = p.r + dr, c = p.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
    }
    const q = rnd(spots);
    if (!q) return ['No sea room to roll.'];
    Fx.relocate(g, p.r, p.c, q.r, q.c, {});
    Fx.mod(g.board[q.r][q.c], 's', 1);
    Fx.flash(g, q.r, q.c, 'shield', '');
    return ['Your piece barrels to ' + sn(q.r, q.c) + ', shielded.'];
  });

  def(630, 'Buccaneer\'s Boldness', 2, 'crown', 'No plan, no fear: destroy a random enemy piece, then your king is shielded (the crew fights harder to protect you).', 'Fortune favors the bold.', (g, s) => {
    const t = rnd(foes(g, s));
    const lines = [];
    if (t) { kill(g, t); lines.push('A bold charge destroys an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your crew rallies to shield the king.'); }
    return lines.length ? lines : ['Even boldness needs a target.'];
  });

  def(631, 'Treasure Fleet', 2, 'coin', 'A fleet heavy with gold: shield every friendly piece on the two ranks in front of your king.', 'The richest line afloat.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const rows = s === 'w' ? [k.r - 1, k.r - 2] : [k.r + 1, k.r + 2];
    const guard = own(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    return n ? ['The treasure fleet shields ' + n + ' defender' + (n > 1 ? 's' : '') + '.'] : ['The fleet sails empty.'];
  });

  def(632, 'Ghost of the Flying Dutchman', 4, 'void', 'Doomed to sail forever: summon a Sea Serpent AND a Coral Queen — and the ghost crew FREEZES the enemy nearest your king.', 'Damned crew, immortal ship.', (g, s) => {
    const lines = [];
    lines.push(...summon(g, s, 'seaserpent', 1));
    lines.push(...summon(g, s, 'coralqueen', 1));
    const k = E.findKing(g, s);
    if (k) {
      const near = Fx.enemy(g, s).filter(q => q.cell.t !== 'k').map(q => ({ q, d: Math.abs(q.r - k.r) + Math.abs(q.c - k.c) })).sort((a, b) => a.d - b.d)[0];
      if (near) { Fx.mod(near.q.cell, 'f', 1); Fx.flash(g, near.q.r, near.q.c, 'freeze', ''); lines.push('The ghost crew freezes the nearest enemy.'); }
    }
    return lines.length ? lines : ['The Dutchman sails past.'];
  });

  def(633, 'Storm God\'s Wrath', 3, 'storm', 'Hurricane winds: every enemy piece on the center RANKS is pushed one square sideways (toward the nearest edge).', 'The sky and sea agree.', (g, s) => {
    let moved = 0;
    const ng = g.n || 8;
    for (const q of foes(g, s).filter(x => Fx.inCenterRows(g, x.r))) {
      const nc = q.c < Fx.half(g) ? q.c - 1 : q.c + 1;
      if (nc >= 0 && nc < ng && !g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); moved++; }
    }
    return moved ? ['The hurricane hurls ' + moved + ' enemy sideways.'] : ['The storm is still offshore.'];
  });

  def(634, 'Longboat Raid', 2, 'swap', 'Marines hit the beach: relocate your most advanced piece to an empty square BESIDE the enemy\'s most advanced piece.', 'Hit the beach running.', (g, s) => {
    const p = adv(g, s)[0];
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!p || !lead) return [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = lead.r + dr, c = lead.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) near.push({ r, c });
    }
    const q = rnd(near);
    if (!q) return ['No beach to land on.'];
    Fx.relocate(g, p.r, p.c, q.r, q.c, {});
    return ['Your vanguard raids right beside the enemy vanguard!'];
  });

  def(635, 'Squall', 2, 'wind', 'A sudden squall scatters the vanguard: FREEZE the enemy\'s two most advanced pieces.', 'The wind changes without warning.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).slice(0, 2);
    const n = Fx.statusOn(g, t, 'f', 1, 'freeze');
    return n ? ['The squall freezes ' + n + ' enemy vanguard.'] : ['The wind is calm.'];
  });

  def(636, 'Anchors Aweigh', 1, 'shield', 'Hold the line: shield your king.', 'The fleet holds fast.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1);
    return ['The king is anchored in safety.'];
  });

  def(637, 'Powder Monkey', 2, 'fire', 'A small hand with a big match: destroy a random enemy pawn, then freeze the enemy beside it.', 'Little hands, big booms.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['No powder for the monkey.'];
    const lines = [];
    kill(g, t);
    lines.push('A keg explodes — an enemy pawn is gone.');
    const near = foes(g, s).find(q => Math.abs(q.r - t.r) + Math.abs(q.c - t.c) === 1);
    if (near) { Fx.mod(near.cell, 'f', 1); Fx.flash(g, near.r, near.c, 'freeze', ''); lines.push('The blast stuns a neighbor.'); }
    return lines;
  });

  def(638, 'Reef Minefield', 3, 'target', 'Sow the shallows with TRAP hazards: three hidden reefs on random empty squares in the enemy\'s half that DESTROY the next piece to step there.', 'Step where the chart is blank.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const n = Fx.layHazards(g, 'trap', 3, { rows, name: 'hidden reef' });
    return n ? ['Three hidden reefs now guard the deep — any piece that steps on one is destroyed.'] : ['The reef will not settle.'];
  });

  def(639, 'Cutlass and Parrot', 1, 'paw', 'A pirate and his bird: your most advanced piece surges forward and is shielded.', 'Squawk!', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const nr = p.r + (s === 'w' ? -1 : 1);
    let moved = false;
    if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved = true; }
    const r2 = moved ? nr : p.r;
    if (!g.board[r2] || !g.board[r2][p.c]) return [];
    Fx.mod(g.board[r2][p.c], 's', 1);
    Fx.flash(g, r2, p.c, 'shield', '');
    return ['With a squawk, your vanguard advances, shielded.'];
  });

  def(640, 'Ship\'s Doctor', 2, 'heart', 'Saw, rum, stitch: cleanse your whole army and revive a fallen pawn.', 'The infirmary is the busiest deck.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = n ? ['The doctor cleanses ' + n + ' of your crew.'] : [];
    const r = Fx.revive(g, s, 1, { type: 'p' });
    if (r.length) lines.push(...r);
    return lines.length ? lines : ['The infirmary is empty.'];
  });

  def(641, 'Crow\'s Nest', 2, 'eye', 'From the mast, all is seen: shield your king and FREEZE the enemy piece FARTHEST from it.', 'The lookout never blinks.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1);
    let best = null, bd = -1;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d > bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); return ['Your king is guarded and the distant foe is spotted and frozen.']; }
    return ['Your king is guarded.'];
  });

  def(642, 'Davy\'s Bargain', 3, 'coin', 'The sea offers a deal: sacrifice your least advanced pawn, then revive your STRONGEST fallen piece — or summon a Leviathan if none have fallen.', 'Everything has a price, mate.', (g, s) => {
    const p = advP(g, s).slice(-1)[0];
    if (p) { kill(g, p); }
    const lines = [];
    if (p) lines.push('You pay the sea a pawn.');
    const r = Fx.revive(g, s, 1);
    if (r.length) lines.push(...r);
    else lines.push(...summon(g, s, 'leviathan', 1));
    return lines.length ? lines : ['The sea wants more than you have.'];
  });

  def(643, 'Pegleg Charge', 2, 'paw', 'Stumping forward anyway: your most advanced piece moves two squares forward (or one, if blocked).', 'Wood doesn\'t slow a pirate.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    let r = p.r, moved = 0;
    while (moved < 2) {
      const nr = r + dr;
      if (nr < 0 || nr >= Fx.bd(g) || g.board[nr][p.c]) break;
      Fx.relocate(g, r, p.c, nr, p.c, {}); r = nr; moved++;
    }
    return moved ? ['Your vanguard stumps ' + moved + ' square' + (moved > 1 ? 's' : '') + ' forward.'] : ['The peglegged one is stuck.'];
  });

  def(644, 'Glass Water', 2, 'clock', 'Perfectly calm seas: take an EXTRA move — but only if your king is not in check.', 'Not a ripple.', (g, s) => {
    if (E.inCheck(g, s)) return ['The water is too rough to sail.'];
    Fx.grantExtra(g, s, 1);
    return ['Glass-calm water — an extra move is yours.'];
  });

  def(645, 'Dead Men Tell No Tales', 3, 'skull', 'Silence the witness: destroy the enemy piece that moved LAST.', 'The sea keeps secrets.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { kill(g, { r: last.to.r, c: last.to.c }); return ['The last mover is thrown overboard!']; }
    }
    return ['The tale finds no teller.'];
  });

  def(646, 'Barnacle Armor', 1, 'shield', 'The hull grows armor: shield your most advanced piece.', 'Slow, but unbreakable.', (g, s) => {
    const p = advP(g, s)[0] || adv(g, s)[0];
    if (!p) return [];
    Fx.mod(p.cell, 's', 1);
    return ['Barnacles armor your vanguard.'];
  });

  def(647, 'Pirate King', 4, 'crown', 'One king, many flags: summon a Sea Serpent AND a Coral Queen, and shield your king.', 'The black flag flies over all.', (g, s) => {
    const lines = [];
    lines.push(...summon(g, s, 'seaserpent', 1));
    lines.push(...summon(g, s, 'coralqueen', 1));
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is warded under the black flag.'); }
    return lines.length ? lines : ['The pirate king sails an empty sea.'];
  });

  def(648, 'Stormcaller\'s Tide', 3, 'drop', 'Call the high tide: EVERY enemy piece on your half is pushed to the enemy\'s half (one row at a time if blocked).', 'The sea takes back the shore.', (g, s) => {
    const nt = g.n || 8;
    let moved = 0;
    for (const q of foes(g, s).filter(x => Fx.inOwnHalf(g, s, x.r)).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))) {
      const dir = s === 'w' ? -1 : 1;
      const nr = q.r + dir;
      if (nr >= 0 && nr < nt && !g.board[nr][q.c]) { Fx.relocate(g, q.r, q.c, nr, q.c, {}); moved++; }
    }
    return moved ? ['The tide sweeps ' + moved + ' enemy off your half.'] : ['The water is low.'];
  });

  def(649, 'Sunken Gold', 3, 'key', 'Divers bring up a lost fortune: revive your most valuable fallen piece — or if none have fallen, summon a Coral Queen.', 'Gold sleeps with the fish.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    return summon(g, s, 'coralqueen', 1);
  });

  def(650, 'Crew Discipline', 2, 'shield', 'A sharp word and a sharper blade: shield every friendly piece standing on an EDGE file (the bulwarks).', 'The rails are where discipline lives.', (g, s) => {
    const edge = own(g, s).filter(q => shore(g, q));
    const n = Fx.statusOn(g, edge, 's', 1, 'shield');
    return n ? ['The bulwarks shield ' + n + ' of your crew on the edges.'] : ['No crew on the rails.'];
  });

  def(651, 'Boarding Party', 3, 'swap', 'Over the rail: convert a random enemy MINOR piece (knight/bishop), and freeze a random enemy piece.', 'For the captain!', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (t) { t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', ''); lines.push('Your crew takes the enemy ' + MD.pieceName(t.cell.t) + ' as a prize.'); }
    const u = rnd(foes(g, s).filter(q => q !== t));
    if (u) { Fx.mod(u.cell, 'f', 1); Fx.flash(g, u.r, u.c, 'freeze', ''); lines.push('Another is pinned by the assault.'); }
    return lines.length ? lines : ['The boarding party is repelled.'];
  });

  def(652, 'Tide Turner', 3, 'swap', 'Turn the tide: swap your most advanced piece with the enemy\'s most advanced piece.', 'What was theirs is now yours.', (g, s) => {
    const p = adv(g, s)[0];
    const t = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!p || !t) return [];
    Fx.swapSq(g, p, t);
    return ['The tide turns — the two vanguards trade places!'];
  });

  def(653, 'Maelstrom', 3, 'drop', 'The sea opens beneath the king\'s guard: FREEZE every enemy piece adjacent to your king.', 'Down they go, all at once.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = foes(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, near, 'f', 1, 'freeze');
    return n ? ['The maelstrom swallows ' + n + ' enemy around your king.'] : ['The king stands on calm water.'];
  });

  def(654, 'Pirate\'s Code', 1, 'book', 'Honor among thieves: cleanse your whole crew and shield your king.', 'The code is the only law.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const k = E.findKing(g, s);
    const lines = [];
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The code guards your king.'); }
    if (n) lines.push('The code cleanses ' + n + ' of your crew.');
    return lines.length ? lines : ['The code needs no enforcing.'];
  });

  def(655, 'Kraken Rises', 4, 'drop', 'THE KRAKEN: summon a Leviathan AND freeze every enemy piece on an edge file.', 'Tentacles eclipse the sun.', (g, s) => {
    const lines = summon(g, s, 'leviathan', 1);
    const edge = foes(g, s).filter(q => shore(g, q));
    const n = Fx.statusOn(g, edge, 'f', 1, 'freeze');
    if (n) lines.push('The Kraken\'s shadow freezes ' + n + ' edge enemy.');
    return lines.length ? lines : ['The deep stays quiet.'];
  });

  def(656, 'Queen Anne\'s Revenge', 4, 'fire', 'Blackbeard\'s own ship takes all: destroy a random enemy piece worth a rook or more, poison another, and take an EXTRA move.', 'The Revenge collects.', (g, s) => {
    const lines = [];
    let t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (t) { kill(g, t); lines.push('The Revenge\'s guns sink an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const u = rnd(foes(g, s).filter(q => q !== t));
    if (u) { Fx.mod(u.cell, 'p', 1); lines.push('Another is poisoned by her guns.'); }
    Fx.grantExtra(g, s, 1);
    lines.push('You take another move under the black flag.');
    return lines.length ? lines : ['The Revenge sails on.'];
  });

  // counter troops: take them and you are COUNTER-ATTACKED
  def(782, 'Spine Reef', 2, 'drop', 'A Sea Urchin anchors beside your most advanced pawn — anything that captures it is skewered in kind.', 'Sharp patience, hidden in the surf.', (g, s) => {
    const p = advP(g, s)[0];
    const lines = [];
    let placed = false;
    if (p) {
      const nb = Fx.bd(g);
      const near = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = p.r + dr, c = p.c + dc;
        if (r >= 0 && r < nb && c >= 0 && c < nb && !g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) near.push({ r, c });
      }
      if (near.length) {
        const q = near[Math.floor(Math.random() * near.length)];
        Fx.place(g, s, 'urchin', q.r, q.c, {});
        lines.push('A sea urchin anchors at ' + sn(q.r, q.c) + '.');
        placed = true;
      }
    }
    if (!placed) lines.push(...summon(g, s, 'urchin', 1));
    return lines.length ? lines : ['The tide brings no urchin.'];
  });

  MD.AB_14 = A;
})();

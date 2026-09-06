/* ============================================================
   Mod Chess — Ability set 14: PIRATES & THE DEEP (Ocean)
   IDs 607-656. Black flags, cannons, treasure, storms, and the
   monsters under the keel. Every card is 'auto' with a fallback,
   and never removes a king.
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
  const nonKing = q => q.cell.t !== 'k';
  const foes = (g, s) => en(g, s).filter(nonKing);
  const mine = (g, s) => own(g, s).filter(q => q.cell.t !== 'k');
  const advPawns = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
  const strong = (g, s) => foes(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
  const weak = (g, s) => foes(g, s).sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
  const kill = (g, q, lines, what) => { Fx.removeAt(g, q.r, q.c, {}); lines.push(what || 'destroyed'); };
  const shore = q => q.c === 0 || q.c === 7;
  const summon = (g, s, type, n) => Fx.summonN(g, s, type, n);
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(607, 'Broadside', 2, 'Ocean', 'fire', 'The cannons roar as one: destroy a random enemy piece standing on the same rank as your most advanced piece.', 'Fire everything.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const t = rnd(foes(g, s).filter(q => q.r === p.r));
    if (!t) return ['The broadside finds no hull at that range.'];
    kill(g, t, [], '');
    return ['A full broadside sinks the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(608, 'Walk the Plank', 2, 'Ocean', 'swap', 'Force an enemy piece to the edge: move a random enemy piece to the edge file on its own side.', 'One step too far.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return [];
    const c = t.c >= 4 ? 7 : 0;
    const dest = Fx.rand(Fx.emptySq(g, r => (t.cell.c === 'w' ? r === 7 : r === 0)));
    if (!dest) return ['The plank is crowded.'];
    Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is marched to the plank on the edge.'];
  });

  def(609, 'Jolly Roger', 1, 'Ocean', 'skull', 'Hoist the black flag: poison a random enemy piece.', 'Death to all who resist.', (g, s) => {
    const n = Fx.poisonN(g, s, 1);
    return n ? ['The black flag flies — an enemy is poisoned.'] : ['No prey in sight.'];
  });

  def(610, 'Treasure Map', 2, 'Ocean', 'key', 'X marks the spot: reveal a buried treasure — take an extra move AND your most advanced pawn gains a shield.', 'The map is half the treasure.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const p = advPawns(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); return ['X marks the spot — an extra move, and your vanguard finds a golden shield.']; }
    return ['The map leads only to an extra move.'];
  });

  def(611, 'Yo Ho Ho', 1, 'Ocean', 'users', 'A bottle of rum and the whole crew: summon two Imps (your ship rats) onto empty squares.', 'Fifteen men on a dead man\'s chest.', (g, s) => summon(g, s, 'imp', 2));

  def(612, 'Powder Monkey', 2, 'Ocean', 'fire', 'The powder kegs ignite: destroy a random enemy pawn, then the blast scorches the square beside it (destroy another if there).', 'Small hands, big booms.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['No powder for the monkey.'];
    const lines = [];
    kill(g, t, lines, 'A keg explodes — an enemy pawn is gone.');
    const near = foes(g, s).find(q => Math.abs(q.r - t.r) + Math.abs(q.c - t.c) === 1);
    if (near) kill(g, near, lines, 'The blast catches a neighbor.');
    return lines;
  });

  def(613, 'Siren Song', 3, 'Ocean', 'eye', 'The sirens call the crew overboard: summon a Siren on an empty square (it poisons adjacent foes each turn).', 'Sailors weep and follow.', (g, s) => {
    const lines = Fx.summonN(g, s, 'siren', 1, { rows: s === 'w' ? [3, 4, 5] : [2, 3, 4] });
    return lines.length ? lines : ['The song finds no willing water.'];
  });

  def(614, 'Kraken Rising', 4, 'Ocean', 'drop', 'The great Kraken surfaces: summon a Hydraling (it grows into a Hydra) and drag one enemy piece to the depths (destroy a random enemy minor).', 'Tentacles from the abyss.', (g, s) => {
    const lines = Fx.summonN(g, s, 'hydra', 1);
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'r'));
    if (t) kill(g, t, lines, 'A tentacle drags an enemy ' + MD.pieceName(t.cell.t) + ' into the deep.');
    return lines.length ? lines : ['The sea is eerily calm.'];
  });

  def(615, 'Tidal Wave', 3, 'Ocean', 'drop', 'A wall of water rolls in: push every enemy piece one square back toward their own side.', 'The sea rearranges the board.', (g, s) => {
    const dir = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const q of foes(g, s)) {
      const nr = q.r + dir;
      if (nr >= 0 && nr < 8 && !g.board[nr][q.c]) { Fx.relocate(g, q.r, q.c, nr, q.c, {}); moved++; }
    }
    return moved ? ['The tide shoves ' + moved + ' enemy piece' + (moved > 1 ? 's' : '') + ' backward.'] : ['The wave breaks on a wall.'];
  });

  def(616, 'Whirlpool', 2, 'Ocean', 'swap', 'A sucking vortex spins two enemy pieces around each other (swap them).', 'Round and round and down.', (g, s) => {
    const es = Fx.uniqN(foes(g, s), 2);
    if (es.length < 2) return ['The vortex finds nothing to spin.'];
    Fx.swapSq(g, { r: es[0].r, c: es[0].c }, { r: es[1].r, c: es[1].c });
    return ['A whirlpool yanks two enemy pieces into each other\'s places!'];
  });

  def(617, 'Davy Jones\' Locker', 3, 'Ocean', 'skull', 'Send one to the locker: destroy a random enemy piece worth a rook or more — or the strongest piece if none.', 'The deep keeps its own.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) t = strong(g, s);
    if (!t) return ['The locker is already full.'];
    kill(g, t, [], '');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is locked below the waves!'];
  });

  def(618, 'Ghost Ship', 3, 'Ocean', 'skull', 'The Flying Dutchman appears: summon a Banshee and revive one of your fallen pieces from the deep.', 'She sails without wind.', (g, s) => {
    const lines = Fx.summonN(g, s, 'banshee', 1);
    const r = Fx.revive(g, s, 1);
    if (r.length) lines.push(...r);
    return lines.length ? lines : ['The ghost ship passes without a wake.'];
  });

  def(619, 'Mermaid\'s Grace', 2, 'Ocean', 'drop', 'The mermaids weave a ward: shield your king and cleanse your front-line pieces.', 'Beautiful and merciful.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('Your king is guarded.'); }
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; }
    return lines.length ? lines : ['The mermaids sing elsewhere.'];
  });

  def(620, 'Harpoon and Haul', 2, 'Ocean', 'target', 'A harpoon line sinks deep: destroy a random enemy piece and haul a friendly one forward — your most advanced pawn advances a step.', 'One pull, two results.', (g, s) => {
    const t = rnd(foes(g, s));
    const lines = [];
    if (t) kill(g, t, lines, 'The harpoon pierces an enemy ' + MD.pieceName(t.cell.t) + '.');
    const p = advPawns(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('The line hauls your vanguard forward.'); }
    }
    return lines.length ? lines : ['The harpoon finds open water.'];
  });

  def(621, 'Pirate King', 4, 'Ocean', 'crown', 'The king of pirates rallies the fleet: summon a Samurai AND a Siren on empty squares, and shield your king.', 'One king, many flags.', (g, s) => {
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'samurai', 1));
    lines.push(...Fx.summonN(g, s, 'siren', 1));
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is warded under the black flag.'); }
    return lines.length ? lines : ['The pirate king sails an empty sea.'];
  });

  def(622, 'Mutiny', 2, 'Ocean', 'swap', 'Stir unrest in the enemy crew: one random enemy PAWN throws off its captain and joins you.', 'Every crew is one bad meal from mutiny.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The crew stays loyal.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['An enemy pawn mutinies and joins your crew!'];
  });

  def(623, 'Storm at Sea', 3, 'Ocean', 'storm', 'A monsoon scatters the fleet: shuffle every enemy piece to a random empty square on its own half.', 'The sky opens.', (g, s) => {
    const es = foes(g, s);
    if (!es.length) return [];
    const rows = s === 'w' ? [0, 1, 2, 3, 4] : [3, 4, 5, 6, 7];
    let moved = 0;
    for (const q of es) {
      if (!g.board[q.r][q.c]) continue;
      const pool = Fx.emptySq(g, (r, c) => rows.includes(r));
      const d = rnd(pool);
      if (!d) continue;
      Fx.relocate(g, q.r, q.c, d.r, d.c, {});
      moved++;
    }
    return moved ? ['The storm hurls ' + moved + ' enemy piece' + (moved > 1 ? 's' : '') + ' across the sea.'] : ['The storm passes overhead.'];
  });

  def(624, 'Coral Reef', 2, 'Ocean', 'leaf', 'A reef grows in front of your king: summon three thorn pawns beside it (a wall of coral).', 'Sharp and unyielding.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const q of Fx.uniqN(spots, 3)) { Fx.place(g, s, 'p', q.r, q.c, {}); lines.push('Coral grows at ' + sn(q.r, q.c) + '.'); }
    return lines.length ? lines : ['The reef cannot find water.'];
  });

  def(625, 'Shark Frenzy', 2, 'Ocean', 'paw', 'Blood in the water: poison a random enemy piece and destroy a random enemy pawn.', 'They smell it from a mile away.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('Sharks poison an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (p) kill(g, p, lines, 'A fin takes an enemy pawn.');
    return lines.length ? lines : ['The water is still.'];
  });

  def(626, 'Jellyfish Sting', 1, 'Ocean', 'skull', 'A drifting veil of stingers: poison two random enemy pieces.', 'Beautiful, then burning.', (g, s) => {
    const n = Fx.poisonN(g, s, 2);
    return n ? ['Jellyfish venom stings ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '.'] : ['The current carries the veil away.'];
  });

  def(627, 'Anglerfish Lure', 2, 'Ocean', 'eye', 'A light in the dark: freeze the enemy\'s most valuable piece (the one drawn to the glow).', 'Come closer. Closer.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['No fish is tempted.'];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['The angler\'s lure freezes the enemy ' + MD.pieceName(t.cell.t) + ' in place.'];
  });

  def(628, 'Anchors Aweigh', 2, 'Ocean', 'shield', 'Heave the anchor to protect the flagship: shield every friendly piece on the same file as your king.', 'The fleet holds fast.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const file = own(g, s).filter(q => q.c === k.c);
    const n = Fx.statusOn(g, file, 's', 1, 'shield');
    return n ? ['The anchor line wards ' + n + ' piece' + (n > 1 ? 's' : '') + ' on your king\'s file.'] : ['The anchor finds nothing to hold.'];
  });

  def(629, 'Bilge Rat', 1, 'Ocean', 'skull', 'Rats swarm the enemy hold: poison a random enemy piece and move your most advanced pawn forward.', 'Rats always survive.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('Rats poison an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = advPawns(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('Your vanguard scuttles forward.'); }
    }
    return lines.length ? lines : ['The rats have fled.'];
  });

  def(630, 'Doubloons', 2, 'Ocean', 'coin', 'Pay the crew: sacrifice nothing — instead your most advanced pawn is promoted to a QUEEN, paid for with plundered gold.', 'Gold talks.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return ['The coffers are empty.'];
    p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['Plundered gold crowns your vanguard a QUEEN!'];
  });

  def(631, 'Cannonball Chain', 3, 'Ocean', 'fire', 'Chain shot rips through two masts: destroy two enemy pieces that stand on the same file.', 'It cuts the rigging and the crew.', (g, s) => {
    const files = {};
    for (const q of foes(g, s)) (files[q.c] = files[q.c] || []).push(q);
    let best = null;
    for (const c in files) if (files[c].length >= 2 && (!best || files[c].length > files[best].length)) best = c;
    if (best === null) return ['No two enemies share a file to chain.'];
    const picks = Fx.uniqN(files[best], 2);
    const lines = [];
    for (const q of picks) kill(g, q, lines, 'Chain shot destroys an enemy ' + MD.pieceName(q.cell.t) + '.');
    return lines;
  });

  def(632, 'Sea Shanty', 1, 'Ocean', 'heart', 'A rousing shanty steadies the crew: cleanse all your pieces of poison and freeze.', 'Heave ho, me hearties.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    return n ? ['The shanty steadies ' + n + ' of your crew.'] : ['The crew needs no steadying.'];
  });

  def(633, 'Blackbeard\'s Fury', 4, 'Ocean', 'fire', 'The dread pirate burns the coast: destroy a random enemy ROOK and poison the enemy piece nearest to your king.', 'Fuses lit in his beard.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (t) kill(g, t, lines, 'Blackbeard\'s blade takes an enemy rook!');
    const k = E.findKing(g, s);
    let best = null, bd = 99;
    if (k) for (const q of foes(g, s)) { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'p', 1); Fx.flash(g, best.r, best.c, 'poison', ''); lines.push('The nearest foe to your king is poisoned.'); }
    return lines.length ? lines : ['The fury finds an empty coast.'];
  });

  def(634, 'Sunken Treasure', 3, 'Ocean', 'key', 'Divers bring up a lost fortune: revive your most valuable fallen piece — or if nothing has fallen, summon a Siren.', 'Gold sleeps with the fish.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    return Fx.summonN(g, s, 'siren', 1);
  });

  def(635, 'Fog Bank', 2, 'Ocean', 'void', 'Thick fog swallows the enemy vanguard: freeze every enemy piece in the two ranks closest to your side.', 'The sea disappears.', (g, s) => {
    const rows = s === 'w' ? [4, 5] : [2, 3];
    const t = foes(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, t, 'f', 1, 'freeze');
    return n ? ['Fog freezes ' + n + ' enemy' + (n > 1 ? 's' : '') + ' at your doorstep.'] : ['The fog rolls off the board.'];
  });

  def(636, 'Pirate\'s Cutlass', 2, 'Ocean', 'sword', 'A quick blade across the throat: destroy a random enemy minor piece (knight or bishop).', 'No parley, no quarter.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (!t) return ['The cutlass finds no duelist.'];
    kill(g, t, [], '');
    return ['A cutlass slash fells the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(637, 'Maelstrom', 3, 'Ocean', 'drop', 'The sea opens beneath the enemy king\'s guards: freeze every enemy piece adjacent to your king.', 'Down they go.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const guards = foes(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, guards, 'f', 1, 'freeze');
    return n ? ['The maelstrom swallows ' + n + ' enemy around your king.'] : ['Your king stands alone on calm water.'];
  });

  def(638, 'Longboat Raid', 2, 'Ocean', 'sword', 'Marines swing aboard: summon a Warhorse beside the enemy\'s most advanced piece.', 'Hit the beach running.', (g, s) => {
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!lead) return [];
    const rows = [lead.r];
    const lines = Fx.summonN(g, s, 'warhorse', 1, { rows });
    return lines.length ? lines : ['The longboats find no landing.'];
  });

  def(639, 'Barrel of Rum', 2, 'Ocean', 'dice', 'The crew drinks and fights better: your most advanced piece takes an extra step forward and is shielded.', 'Liquid courage.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    let targetR = p.r;
    const nr = p.r + dr;
    const lines = [];
    if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); targetR = nr; lines.push('Your piece lurches forward.'); }
    Fx.mod(g.board[targetR][p.c], 's', 1);
    Fx.flash(g, targetR, p.c, 'shield', '');
    lines.push('Rum courage wards it.');
    return lines;
  });

  def(640, 'Leviathan', 4, 'Ocean', 'drop', 'The primordial serpent: summon a Hydra AND push every enemy edge piece one square inward.', 'Older than the gods of the sea.', (g, s) => {
    const lines = Fx.summonN(g, s, 'hydra', 1);
    let moved = 0;
    for (const q of foes(g, s)) {
      if (!shore(q)) continue;
      const nc = q.c === 0 ? 1 : 6;
      if (!g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); moved++; }
    }
    if (moved) lines.push('The leviathan\'s passage drags ' + moved + ' edge piece' + (moved > 1 ? 's' : '') + ' inward.');
    return lines.length ? lines : ['The deep stays quiet.'];
  });

  def(641, 'Cutlass and Parrot', 1, 'Ocean', 'paw', 'A pirate and his parrot: summon an Imp (the parrot) and your most advanced pawn squawks forward one step.', 'Squawk!', (g, s) => {
    const lines = Fx.summonN(g, s, 'imp', 1);
    const p = advPawns(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('The parrot leads your vanguard forward.'); }
    }
    return lines.length ? lines : ['The parrot has flown.'];
  });

  def(642, 'Dead Men Tell No Tales', 3, 'Ocean', 'skull', 'Silence the witness: destroy the enemy piece that moved last.', 'The sea keeps secrets.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { kill(g, { r: last.to.r, c: last.to.c }, [], ''); return ['The last mover is thrown overboard!']; }
    }
    return ['The tale finds no teller.'];
  });

  def(643, 'Glass Water', 1, 'Ocean', 'drop', 'Perfectly calm seas: take an extra move, but only if your king is not in check.', 'Not a ripple.', (g, s) => {
    if (E.inCheck(g, s)) return ['The water is too rough to sail.'];
    Fx.grantExtra(g, s, 1);
    return ['Glass-calm water — an extra move is yours.'];
  });

  def(644, 'Barrel Roll', 2, 'Ocean', 'dice', 'Dodge the grapeshot: every friendly piece on the edge files scampers one square inward (a full evasive maneuver).', 'Roll, roll, roll.', (g, s) => {
    const edge = own(g, s).filter(q => shore(q));
    let moved = 0;
    for (const q of edge) {
      const nc = q.c === 0 ? 1 : 6;
      if (!g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); moved++; }
    }
    return moved ? ['Your edge pieces roll ' + moved + ' square' + (moved > 1 ? 's' : '') + ' inward to safety.'] : ['Your line is already tucked in.'];
  });

  def(645, 'Pegleg Charge', 2, 'Ocean', 'paw', 'Stumping forward anyway: your most advanced pawn moves two squares forward (or one, if blocked).', 'Wood doesn\'t slow a pirate.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    for (const dist of [2, 1]) {
      const nr = p.r + dr * dist;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) {
        if (dist === 2 && g.board[p.r + dr][p.c]) continue;
        Fx.relocate(g, p.r, p.c, nr, p.c, {});
        return ['Your vanguard stumps ' + dist + ' square' + (dist > 1 ? 's' : '') + ' forward.'];
      }
    }
    return ['The peglegged one is stuck in the sand.'];
  });

  def(646, 'Ship\'s Doctor', 2, 'Ocean', 'heart', 'Amputate the rot: cleanse your army AND revive a fallen pawn.', 'The saw, the rum, the stitch.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = [];
    if (n) lines.push('The doctor cleanses ' + n + ' of your crew.');
    const r = Fx.revive(g, s, 1, { type: 'p' });
    if (r.length) lines.push(...r);
    return lines.length ? lines : ['The infirmary is empty.'];
  });

  def(647, 'Crow\'s Nest', 2, 'Ocean', 'eye', 'Sight from the top: shield your king and freeze the enemy piece farthest from it.', 'From the mast, all is seen.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1);
    let best = null, bd = -1;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d > bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); return ['Your king is guarded and the distant foe is spotted and frozen.']; }
    return ['Your king is guarded.'];
  });

  def(648, 'Powder Room', 3, 'Ocean', 'fire', 'A lucky shot into the magazine: destroy a random enemy piece, then destroy another random enemy piece on an adjacent square if present.', 'The whole ship goes.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return ['The magazine is empty.'];
    const lines = [];
    kill(g, t, lines, 'The powder room detonates — an enemy ' + MD.pieceName(t.cell.t) + ' is gone.');
    const near = foes(g, s).find(q => Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    if (near) kill(g, near, lines, 'The blast chain reaches a neighbor.');
    return lines;
  });

  def(649, 'Barnacle Armor', 1, 'Ocean', 'shield', 'The hull grows armor: shield your most advanced piece and cleanse it.', 'Slow, but unbreakable.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    if (p.cell.b) { p.cell.b.f = 0; p.cell.b.p = 0; }
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    return ['Barnacles armor your vanguard.'];
  });

  def(650, 'Flying Dutchman', 4, 'Ocean', 'void', 'The doomed ship sails forever: summon a Banshee AND a Lich — the undead crew answers.', 'Doomed to sail, damned to fight.', (g, s) => {
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'banshee', 1));
    lines.push(...Fx.summonN(g, s, 'lich', 1));
    return lines.length ? lines : ['The Dutchman sails past.'];
  });

  def(651, 'Boarding Party', 3, 'Ocean', 'sword', 'Swing across and take the deck: your three most advanced pawns each surge one step forward.', 'For the captain!', (g, s) => {
    const ps = advPawns(g, s).slice(0, 3);
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      if (!g.board[p.r][p.c]) continue;
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    return moved ? ['The boarding party surges — ' + moved + ' pawn' + (moved > 1 ? 's' : '') + ' forward.'] : ['The party is repelled.'];
  });

  def(652, 'Treasure Fleet', 2, 'Ocean', 'coin', 'A fleet heavy with gold: summon two Goblins (your greedy mariners) and shield your king.', 'The richest fleet afloat.', (g, s) => {
    const lines = Fx.summonN(g, s, 'goblin', 2);
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is guarded by the treasure fleet.'); }
    return lines.length ? lines : ['The fleet is waylaid.'];
  });

  def(653, 'Storm God\'s Wrath', 3, 'Ocean', 'storm', 'Call the hurricane: freeze every enemy piece on the two center ranks.', 'The sky and sea agree.', (g, s) => {
    const t = foes(g, s).filter(q => q.r === 3 || q.r === 4);
    const n = Fx.statusOn(g, t, 'f', 1, 'freeze');
    return n ? ['The hurricane freezes ' + n + ' enemy' + (n > 1 ? 's' : '') + ' in the storm\'s eye.'] : ['The storm wanders off.'];
  });

  def(654, 'Pirate\'s Code', 1, 'Ocean', 'book', 'Honor among thieves: every friendly piece that is poisoned or frozen is cleansed, and your king is shielded.', 'The code is the only law.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const k = E.findKing(g, s);
    const lines = [];
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The code guards your king.'); }
    if (n) lines.push('The code cleanses ' + n + ' of your crew.');
    return lines.length ? lines : ['The code needs no enforcing.'];
  });

  def(655, 'Captain\'s Orders', 2, 'Ocean', 'crown', 'The captain speaks and the crew moves: your most advanced piece takes an extra step forward and the piece behind it follows.', 'Orders are orders.', (g, s) => {
    const ps = advPawns(g, s);
    const p = ps[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const lines = [];
    const nr = p.r + dr;
    if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('The captain leads the vanguard forward.'); }
    const behind = ps[1];
    if (behind && g.board[behind.r][behind.c]) {
      const nr2 = behind.r + dr;
      if (nr2 >= 0 && nr2 < 8 && !g.board[nr2][behind.c]) { Fx.relocate(g, behind.r, behind.c, nr2, behind.c, {}); lines.push('The line follows behind.'); }
    }
    return lines.length ? lines : ['The crew stands fast.'];
  });

  def(656, 'Queen Anne\'s Revenge', 4, 'Ocean', 'skull', 'Blackbeard\'s own ship: destroy a random enemy piece worth a rook or more, poison another, and take an extra move.', 'The Revenge takes all.', (g, s) => {
    const lines = [];
    let t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (t) kill(g, t, lines, 'The Revenge\'s guns destroy an enemy ' + MD.pieceName(t.cell.t) + '.');
    const u = rnd(foes(g, s).filter(q => q !== t));
    if (u) { Fx.mod(u.cell, 'p', 1); Fx.flash(g, u.r, u.c, 'poison', ''); lines.push('Another is poisoned by the Revenge.'); }
    Fx.grantExtra(g, s, 1);
    lines.push('The Revenge grants you another move.');
    return lines.length ? lines : ['The Revenge sails on.'];
  });

  MD.AB_14 = A;
})();

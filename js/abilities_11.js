/* ============================================================
   Mod Chess — Ability set 11: LEGENDS & MYTHS (gods & titans)
   IDs 457-506. Olympus, Valhalla, the Underworld & the deep.
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
  const fwd = s => (s === 'w' ? -1 : 1);
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(457, 'Bolt of Zeus', 3, 'Myth', 'storm', 'Destroy the enemy piece that moved last, then freeze a random enemy piece.', 'The sky has a witness.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    const lines = [];
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, last.to.r, last.to.c, {}); lines.push('Zeus strikes down the last mover!'); }
    }
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('Another enemy freezes in awe.'); }
    return lines.length ? lines : ['The sky finds no target.'];
  });

  def(458, 'Titan\'s Fist', 2, 'Myth', 'storm', 'Destroy a random enemy ROOK — the mountain strikes the tower.', 'Earthquakes are just titans yawning.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'r'));
    if (!t) return ['No tower stands against the titan.'];
    Fx.removeAt(g, t.r, t.c, {});
    return ['The titan crushes the enemy tower!'];
  });

  def(459, 'Valhalla', 3, 'Myth', 'book', 'Resurrect your two most recently captured pieces and shield them — the fallen feast again.', 'They died well.', (g, s) => {
    const grave = (g.capt[s] || []).slice().reverse();
    const lines = [];
    for (const p of grave) {
      if (lines.length >= 2) break;
      if (p.t === 'k') continue;
      lines.push(...Fx.revive(g, s, 1, { type: p.t }));
    }
    if (lines.length) {
      const back = own(g, s);
      Fx.statusOn(g, back.slice(-2), 's', 1, 'shield');
      lines.push('The risen are warded.');
    }
    return lines.length ? lines : ['The hall is empty — none have fallen for you.'];
  });

  def(460, 'Medusa\'s Gaze', 2, 'Myth', 'eye', 'Freeze a random enemy minor piece and a random enemy pawn — stone, stone, stone.', 'Do not look.', (g, s) => {
    const lines = [];
    const m = rnd(en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (m) { Fx.mod(m.cell, 'f', 1); Fx.flash(g, m.r, m.c, 'freeze', ''); lines.push('A minor piece turns to stone.'); }
    const p = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.mod(p.cell, 'f', 1); Fx.flash(g, p.r, p.c, 'freeze', ''); lines.push('A pawn turns to stone.'); }
    return lines.length ? lines : ['No one meets her gaze.'];
  });

  def(461, 'Phoenix Rebirth', 3, 'Myth', 'fire', 'Resurrect your strongest captured piece OR, if none, summon a Phoenix on an empty square.', 'From the ashes.', (g, s) => {
    const lines = Fx.revive(g, s, 1);
    if (lines.length) return lines;
    return Fx.summonN(g, s, 'phoenix', 1);
  });

  def(462, 'Trident of Poseidon', 2, 'Myth', 'drop', 'Push every enemy piece on the edge files (a and h) one square inward, then poison one of them.', 'The sea takes the shore.', (g, s) => {
    const shore = en(g, s).filter(q => q.cell.t !== 'k' && (q.c === 0 || q.c === Fx.bd(g) - 1));
    let moved = 0;
    for (const q of shore) {
      const nc = q.c === 0 ? 1 : 6;
      if (!g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); moved++; }
    }
    const lines = moved ? ['The tide shoves ' + moved + ' enemy' + (moved > 1 ? 's' : '') + ' off the shore.'] : ['The shore is already clear.'];
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('A foe is poisoned by the deep.'); }
    return lines;
  });

  def(463, 'Hammer of Thor', 3, 'Myth', 'storm', 'Destroy every enemy piece on the same rank as your most advanced piece, then your most advanced piece is shielded.', 'Returning… to you.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!mine) return [];
    const gone = [];
    for (const q of en(g, s)) if (q.cell.t !== 'k' && q.r === mine.r) { Fx.removeAt(g, q.r, q.c, {}); gone.push(q); }
    Fx.mod(mine.cell, 's', 1);
    return gone.length ? ['Mjölnir clears the rank of ' + gone.length + ' enemy unit' + (gone.length > 1 ? 's' : '') + '!'] : ['The hammer finds the rank empty.'];
  });

  def(464, 'Hydra\'s Breath', 2, 'Myth', 'fire', 'Poison every enemy piece adjacent to any of your pawns (up to three).', 'Seven heads, one venom.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const foes = [];
    for (const p of pawns) for (const q of en(g, s)) if (q.cell.t !== 'k' && Math.abs(q.r - p.r) <= 1 && Math.abs(q.c - p.c) <= 1 && !foes.includes(q)) foes.push(q);
    const n = Fx.statusOn(g, Fx.uniqN(foes, 3), 'p', 1, 'poison');
    return n ? ['The hydra\'s breath poisons ' + n + ' enemy unit' + (n > 1 ? 's' : '') + '.'] : ['The hydra sleeps.'];
  });

  def(465, 'Oracle', 2, 'Myth', 'eye', 'If you are losing material, shield your king and upgrade your most advanced pawn; otherwise freeze the enemy\'s strongest piece.', 'The prophecy adjusts.', (g, s) => {
    if (Fx.material(g, s) < Fx.material(g, O(s))) {
      const k = E.findKing(g, s);
      const lines = [];
      if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('The oracle wards your king.'); }
      const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
      const p = pawns[0];
      if (p) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('Your vanguard is knighted by fate.'); }
      return lines;
    }
    const star = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!star) return [];
    Fx.mod(star.cell, 'f', 1); Fx.flash(g, star.r, star.c, 'freeze', '');
    return ['The oracle freezes the enemy\'s ' + MD.pieceName(star.cell.t) + '.'];
  });

  def(466, 'Gorgon Shield', 1, 'Myth', 'eye', 'Shield your king, and the gorgon face of the shield PETRIFIES the enemy piece nearest to it.', 'Look at the shield, not the snake.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', '');
    let best = null, bd = 99;
    for (const q of en(g, s)) if (q.cell.t !== 'k') { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'st', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); return ['Your king is warded and the nearest foe is petrified.']; }
    return ['Your king is warded.'];
  });

  def(467, 'Sword in the Stone', 3, 'Myth', 'spark', 'Your most advanced pawn draws the sword: it becomes a QUEEN. Truly, it was always meant to.', 'Who pulls it, rules.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return ['No worthy hand remains.'];
    p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['The stone yields! Your vanguard is a Queen!'];
  });

  def(468, 'Pandora\'s Box', 2, 'Myth', 'dice', 'Open the box: a random good or ill thing emerges — 50% shield all your pawns, 50% poison a random enemy piece.', 'Hope remains.', (g, s) => {
    if (Math.random() < 0.5) {
      const n = Fx.statusOn(g, own(g, s).filter(q => q.cell.t === 'p'), 's', 1, 'shield');
      return n ? ['Hope spills out — your pawns are shielded.'] : [];
    }
    const n2 = Fx.poisonN(g, s, 1);
    return n2 ? ['Ill fortune spills out — an enemy is poisoned.'] : [];
  });

  def(469, 'Fenrir', 4, 'Myth', 'paw', 'Summon a Griffon (the great wolf) on an empty square, and it immediately devours the enemy adjacent to it with the highest value.', 'The chains never held.', (g, s) => {
    const lines = Fx.summonN(g, s, 'griffon', 1);
    const got = own(g, s).filter(q => q.cell.t === 'griffon').slice(-1)[0];
    if (got) {
      const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - got.r) <= 1 && Math.abs(q.c - got.c) <= 1).sort((a, b) => val(b.cell.t) - val(a.cell.t));
      const t = foes[0];
      if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('Fenrir devours the ' + MD.pieceName(t.cell.t) + '!'); }
    }
    return lines;
  });

  def(470, 'Fountain of Youth', 1, 'Myth', 'drop', 'Cleanse all your frozen and poisoned pieces, and unfreeze your king.', 'Drink deep.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; if (q.cell.b.s <= 0) q.cell.b = undefined; n++; }
    return n ? ['The fountain cleanses ' + n + ' of your units.'] : ['The fountain bubbles clean water.'];
  });

  def(471, 'Cerberus', 3, 'Myth', 'paw', 'Summon three Imps (the three heads) beside your king\'s three open squares.', 'Three heads, one gate.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return Fx.summonN(g, s, 'imp', 3);
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const sp of Fx.uniqN(spots, 3)) { Fx.place(g, s, 'imp', sp.r, sp.c, {}); lines.push('A head-imp guards ' + sn(sp.r, sp.c) + '.'); }
    return lines.length ? lines : Fx.summonN(g, s, 'imp', 3);
  });

  def(472, 'Golden Fleece', 2, 'Myth', 'spark', 'Shield your three most advanced pieces and freeze the enemy piece threatening your king.', 'Worth the voyage.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 3);
    const n = Fx.statusOn(g, mine, 's', 1, 'shield');
    const lines = n ? ['The fleece wards your vanguard.'] : [];
    let threat = null;
    for (const q of en(g, s)) { if (q.cell.t === 'k') continue; const cg = E.clone(g); cg.board[q.r][q.c] = null; if (!E.inCheck(cg, s)) { threat = q; break; } }
    if (threat) { Fx.mod(threat.cell, 'f', 1); Fx.flash(g, threat.r, threat.c, 'freeze', ''); lines.push('The threat to your king is frozen.'); }
    return lines.length ? lines : ['The fleece hangs unused.'];
  });

  def(473, 'Chimera', 3, 'Myth', 'fire', 'Destroy a random enemy piece and freeze another random enemy piece — lion, goat, serpent.', 'Part of each.', (g, s) => {
    const lines = Fx.destroyN(g, s, 1);
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('Another foe is frozen by the serpent head.'); }
    return lines.length ? lines : ['The chimera finds no prey.'];
  });

  def(474, 'Aegis', 2, 'Myth', 'shield', 'Shield every friendly piece adjacent to your king, and your king.', 'The shield of the gods.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = own(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, near, 's', 1, 'shield');
    return n ? ['The aegis guards ' + n + ' of your pieces around the king.'] : ['The aegis gleams over an empty court.'];
  });

  def(475, 'Sirens', 2, 'Myth', 'drop', 'Freeze every enemy piece on the edge of the board — their ships are lured in.', 'Come closer…', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && (q.r === 0 || q.r === Fx.bd(g) - 1 || q.c === 0 || q.c === Fx.bd(g) - 1));
    const n = Fx.statusOn(g, foes, 'f', 1, 'freeze');
    return n ? ['The sirens\' song freezes the enemy fleet on the rim.'] : ['No enemies sail the rim.'];
  });

  def(476, 'Midas Touch', 3, 'Myth', 'spark', 'Upgrade two random friendly pawns into ROOKS — everything you touch turns to gold (and iron).', 'Gold is heavy.', (g, s) => {
    const pawns = Fx.uniqN(own(g, s).filter(q => q.cell.t === 'p'), 2);
    const lines = [];
    for (const p of pawns) { p.cell.t = 'r'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A pawn turns to golden Rook!'); }
    return lines;
  });

  def(477, 'Labors of Heroes', 2, 'Myth', 'swap', 'Your most advanced piece completes a labor: leap it two squares straight in any direction, then shield it.', 'Twelve labors, one turn.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!mine) return [];
    const spots = [];
    for (const [dr, dc] of [[0, 2], [0, -2], [2, 0], [-2, 0]]) {
      const r = mine.r + dr, c = mine.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
    }
    const d = rnd(spots);
    if (d) { Fx.relocate(g, mine.r, mine.c, d.r, d.c, {}); Fx.mod(g.board[d.r][d.c], 's', 1); return ['Your hero leaps two squares and is shielded!']; }
    Fx.mod(mine.cell, 's', 1);
    return ['No ground to leap to — your hero is shielded in place.'];
  });

  def(478, 'Underworld', 2, 'Myth', 'void', 'Resurrect a captured piece of the SAME type as the last piece you lost, and poison the enemy\'s strongest piece.', 'Even death has a tax.', (g, s) => {
    const last = (g.capt[s] || [])[(g.capt[s] || []).length - 1];
    const lines = last && last.t !== 'k' ? Fx.revive(g, s, 1, { type: last.t }) : [];
    const star = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (star) { Fx.mod(star.cell, 'p', 1); Fx.flash(g, star.r, star.c, 'poison', ''); lines.push('Their strongest is cursed by the deep.'); }
    return lines.length ? lines : ['The underworld has nothing to trade.'];
  });

  def(479, 'Norse Raiders', 2, 'Myth', 'swap', 'Teleport your two most advanced pawns one file inward (toward the center).', 'They came from the sea.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    let moved = 0;
    for (const p of pawns) {
      const nc = p.c < Fx.half(g) ? p.c + 1 : p.c - 1;
      if (!g.board[p.r][nc]) { Fx.relocate(g, p.r, p.c, p.r, nc, {}); moved++; }
    }
    return moved ? ['Your raiders slip one file toward the center.'] : ['No room to raid inward.'];
  });

  def(480, 'Echo of Olympus', 4, 'Myth', 'storm', 'Destroy the enemy queen OR their strongest non-king piece, then shield your king. The gods weigh in.', 'Even gods have favorites.', (g, s) => {
    const lines = [];
    const q = en(g, s).filter(x => x.cell.t === 'q');
    const star = q[0] || en(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (star) { Fx.removeAt(g, star.r, star.c, {}); lines.push('Olympus smites the ' + MD.pieceName(star.cell.t) + '!'); }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('Your king is warded.'); }
    return lines;
  });

  def(481, 'Guardian Angel', 2, 'Myth', 'shield', 'Shield your king and your two most valuable pieces for the enemy\'s next turn.', 'Wings overhead.', (g, s) => {
    const k = E.findKing(g, s);
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t)).slice(0, 2);
    const list = [];
    if (k) list.push({ r: k.r, c: k.c });
    list.push(...mine);
    const n = Fx.statusOn(g, list, 's', 1, 'shield');
    return n ? ['The guardian angel wards your crown and champions.'] : [];
  });

  def(482, 'Trojan Gift', 3, 'Myth', 'spark', 'Summon a Golem (the horse) on an empty square inside enemy territory — it lumbers among them.', 'It\'s a gift. Open it.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    return Fx.summonN(g, s, 'golem', 1, { rows });
  });

  def(483, 'Oracle of Delphi', 2, 'Myth', 'eye', 'Look ahead and dodge: if your king is in check, teleport it to a random safe square; otherwise freeze the enemy\'s most advanced piece.', 'The future is not fixed.', (g, s) => {
    if (E.inCheck(g, s)) {
      const lines = Fx.kingTeleport(g, s, true);
      return lines.length ? lines : ['The oracle finds no escape.'];
    }
    const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const t = pool[0];
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['The oracle freezes the enemy\'s vanguard.'];
  });

  def(484, 'Feast of Gods', 3, 'Myth', 'drop', 'Shield ALL of your pieces and cleanse all your pawns\' poison — the gods feast and bless.', 'Ambrosia for everyone.', (g, s) => {
    const lines = [];
    let cleaned = 0;
    for (const q of own(g, s)) if (q.cell.b && q.cell.b.p > 0) { q.cell.b.p = 0; if (q.cell.b.f <= 0 && q.cell.b.s <= 0) q.cell.b = undefined; cleaned++; }
    if (cleaned) lines.push(cleaned + ' poison' + (cleaned > 1 ? 's' : '') + ' cleansed.');
    const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    if (n) lines.push('Your whole host is blessed and shielded.');
    return lines.length ? lines : ['The gods feast in silence.'];
  });

  def(485, 'Kraken', 4, 'Myth', 'drop', 'Destroy every enemy piece on the two edge files (a & h) — the leviathan takes the coast.', 'From the deep.', (g, s) => {
    const gone = [];
    for (const q of en(g, s)) if (q.cell.t !== 'k' && (q.c === 0 || q.c === Fx.bd(g) - 1)) { Fx.removeAt(g, q.r, q.c, {}); gone.push(q); }
    return gone.length ? ['The kraken drags ' + gone.length + ' enemy unit' + (gone.length > 1 ? 's' : '') + ' from the shores!'] : ['The kraken finds no coast to raid.'];
  });

  def(486, 'Blessing of War', 1, 'Myth', 'spark', 'Upgrade two random friendly pawns into knights — blessed steel.', 'Victory favors the bold.', (g, s) => {
    const pawns = Fx.uniqN(own(g, s).filter(q => q.cell.t === 'p'), 2);
    const lines = [];
    for (const p of pawns) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A pawn is blessed into a knight.'); }
    return lines;
  });

  def(487, 'Minotaur', 2, 'Myth', 'paw', 'Your most advanced piece charges forward until it hits an enemy, then that enemy is destroyed.', 'The labyrinth echoes.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k' && (q.cell.t === 'r' || q.cell.t === 'p' || E.isTroop(q.cell.t))).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0] ||
      own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!mine) return [];
    let r = mine.r + fwd(s);
    while (r >= 0 && r < Fx.bd(g)) {
      const cell = g.board[r] && g.board[r][mine.c];
      if (cell) {
        if (cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, r, mine.c, {}); return ['The minotaur charges down the ' + MD.pieceName(cell.t) + '!']; }
        return ['The minotaur meets a wall.'];
      }
      r += fwd(s);
    }
    return ['The minotaur charges into open air.'];
  });

  def(488, 'Ambrosia', 1, 'Myth', 'drop', 'Shield a random friendly piece and unfreeze it.', 'Tastes like victory.', (g, s) => {
    const t = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    if (t.cell.b) t.cell.b.f = 0;
    Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', '');
    return ['Ambrosia shields and thaws your ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(489, 'Twilight of the Gods', 4, 'Myth', 'fire', 'Destroy every enemy piece worth at least a rook, but one of your pawns also falls in the twilight.', 'The end begins.', (g, s) => {
    const gone = [];
    for (const q of en(g, s)) if (q.cell.t !== 'k' && (q.cell.t === 'q' || q.cell.t === 'r')) { Fx.removeAt(g, q.r, q.c, {}); gone.push(q); }
    const lines = gone.length ? ['Ragnarok claims ' + gone.length + ' major piece' + (gone.length > 1 ? 's' : '') + '!'] : ['The twilight spares the majors.'];
    const p = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.removeAt(g, p.r, p.c, {}); lines.push('A pawn is lost to the twilight.'); }
    return lines;
  });

  def(490, 'Pegasus', 3, 'Myth', 'paw', 'Summon a Griffon (the winged horse) and shield it, then your most advanced pawn flies to join it.', 'Sky-bound.', (g, s) => {
    const lines = Fx.summonN(g, s, 'griffon', 1);
    const got = own(g, s).filter(q => q.cell.t === 'griffon').slice(-1)[0];
    if (got) Fx.mod(got.cell, 's', 1);
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (p && got) {
      const spots = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = got.r + dr, c = got.c + dc;
        if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
      }
      const d = rnd(spots);
      if (d) { Fx.relocate(g, p.r, p.c, d.r, d.c, {}); lines.push('A pawn rides up beside it.'); }
    }
    return lines.length ? lines : ['Pegasus finds no stable.'];
  });

  def(491, 'Curse of Achilles', 2, 'Myth', 'target', 'Freeze the enemy\'s strongest piece and downgrade their most advanced piece — strike the heel.', 'One weakness. Everyone has one.', (g, s) => {
    const star = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    const lead = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    const lines = [];
    if (star) { Fx.mod(star.cell, 'f', 1); Fx.flash(g, star.r, star.c, 'freeze', ''); lines.push('Their strongest is frozen — the heel is struck.'); }
    if (lead && lead !== star) { const dl = Fx.downgradeSq(g, [lead]); if (dl.length) lines.push(dl[0]); }
    return lines.length ? lines : ['Achilles finds no heel.'];
  });

  def(492, 'Nemean Lion', 2, 'Myth', 'paw', 'Shield your most advanced piece AND freeze the enemy piece directly in front of it.', 'Its hide cannot be pierced.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!mine) return [];
    Fx.mod(mine.cell, 's', 1); Fx.flash(g, mine.r, mine.c, 'shield', '');
    const r = mine.r + fwd(s);
    if (r >= 0 && r < Fx.bd(g) && g.board[r] && g.board[r][mine.c] && g.board[r][mine.c].c === O(s) && g.board[r][mine.c].t !== 'k') {
      Fx.mod(g.board[r][mine.c], 'f', 1); Fx.flash(g, r, mine.c, 'freeze', '');
      return ['The lion\'s roar shields your vanguard and freezes the foe in front.'];
    }
    return ['Your vanguard wears the lion\'s hide.'];
  });

  def(493, 'River Styx', 2, 'Myth', 'drop', 'Your most advanced pawn crosses the river: it may not be captured next turn (shielded), and every enemy adjacent is frozen.', 'Crossing is one-way.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return [];
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - p.r) <= 1 && Math.abs(q.c - p.c) <= 1);
    Fx.statusOn(g, foes, 'f', 1, 'freeze');
    return ['The Styx shields your vanguard and chills the shores.'];
  });

  def(494, 'Prometheus', 3, 'Myth', 'fire', 'Steal fire from the gods: destroy a random enemy piece, then give fire to your most advanced pawn — it is shielded and can\'t be frozen.', 'Gifted flame.', (g, s) => {
    const lines = Fx.destroyN(g, s, 1);
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); if (p.cell.b) p.cell.b.f = 0; lines.push('Your vanguard bears the stolen fire.'); }
    return lines.length ? lines : ['The fire is not worth the chains.'];
  });

  def(495, 'Hydra Reborn', 4, 'Myth', 'fire', 'If you have lost a piece worth a rook or more, revive it AND summon a Hydra. Otherwise summon two Hydras.', 'Two heads where one fell.', (g, s) => {
    const had = (g.capt[s] || []).some(p => p.t === 'q' || p.t === 'r');
    const lines = [];
    if (had) lines.push(...Fx.revive(g, s, 1));
    lines.push(...Fx.summonN(g, s, 'hydra', had ? 1 : 2));
    return lines.length ? lines : ['The swamp is empty.'];
  });

  def(496, 'Gryphon of Dawn', 2, 'Myth', 'paw', 'Summon a Griffon on an empty square and freeze every enemy on the same rank as it.', 'The dawn blinds the night.', (g, s) => {
    const lines = Fx.summonN(g, s, 'griffon', 1);
    const got = own(g, s).filter(q => q.cell.t === 'griffon').slice(-1)[0];
    if (got) {
      const foes = en(g, s).filter(q => q.cell.t !== 'k' && q.r === got.r);
      const n = Fx.statusOn(g, foes, 'f', 1, 'freeze');
      if (n) lines.push('The gryphon\'s cry freezes its whole rank.');
    }
    return lines.length ? lines : ['The gryphon finds no perch.'];
  });

  def(497, 'Staff of Hermes', 2, 'Myth', 'swap', 'Your messenger piece travels: teleport your most advanced piece to the far side of the board (beyond the enemy).', 'Swift as the wind.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!mine) return [];
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const d = rnd(Fx.emptySq(g, (r, c) => rows.includes(r)));
    if (!d) return ['No messenger route is open.'];
    Fx.relocate(g, mine.r, mine.c, d.r, d.c, {});
    return ['Hermes carries your ' + MD.pieceName(mine.cell.t) + ' to ' + sn(d.r, d.c) + '!'];
  });

  def(498, 'Colossus', 2, 'Myth', 'spark', 'Summon a Golem (the colossus) beside your most advanced pawn.', 'A monument that moves.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return Fx.summonN(g, s, 'golem', 1);
    return Fx.summonN(g, s, 'golem', 1, { rows: [p.r] });
  });

  def(499, 'Wrath of the Sea', 3, 'Myth', 'drop', 'Every enemy piece on your half of the board slides one square DOWN toward you (like a wave) — then the most advanced is destroyed.', 'The tide turns.', (g, s) => {
    const dir = s === 'w' ? 1 : -1;
    let moved = 0;
    for (const q of en(g, s).filter(x => x.cell.t !== 'k' && (s === 'w' ? x.r >= 4 : x.r <= 3)).slice()) {
      const nr = q.r + dir;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][q.c]) { Fx.relocate(g, q.r, q.c, nr, q.c, {}); moved++; }
    }
    const lead = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    const lines = [];
    if (moved) lines.push('The wave drags ' + moved + ' invader' + (moved > 1 ? 's' : '') + ' closer.');
    if (lead) { Fx.removeAt(g, lead.r, lead.c, {}); lines.push('The sea swallows the vanguard!'); }
    return lines.length ? lines : ['The sea is calm.'];
  });

  def(500, 'Oracle\'s Gambit', 4, 'Myth', 'clock', 'Take an extra move AND freeze every enemy piece — except their king. No new spell on the bonus turn.', 'Time and stone.', (g, s) => {
    const targets = en(g, s).filter(q => q.cell.t !== 'k');
    Fx.statusOn(g, targets, 'f', 1, 'freeze');
    Fx.grantExtra(g, s, 1);
    return ['The oracle stops the enemy clock — move again!'];
  });

  def(501, 'Asclepius', 2, 'Myth', 'drop', 'Revive your most recently lost pawn, and if your king is poisoned or frozen, cleanse it.', 'Heal the flesh.', (g, s) => {
    const lines = Fx.revive(g, s, 1, { type: 'p' });
    const k = E.findKing(g, s);
    if (k) { const kc = g.board[k.r] && g.board[k.r][k.c]; if (kc) { kc.b = kc.b || {}; kc.b.f = 0; kc.b.p = 0; if (kc.b.s <= 0) kc.b = undefined; lines.push('The king is healed.'); } }
    return lines.length ? lines : ['Asclepius finds no one to heal.'];
  });

  def(502, 'Tyrant Giant', 3, 'Myth', 'paw', 'Upgrade your most advanced pawn into a Golem and a random friendly knight into a Griffon — giants join the war.', 'They were always here.', (g, s) => {
    const lines = [];
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    const n = rnd(own(g, s).filter(q => q.cell.t === 'n'));
    if (p) { p.cell.t = 'golem'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A vanguard becomes a Golem.'); }
    if (n) { n.cell.t = 'griffon'; Fx.flash(g, n.r, n.c, 'transform', ''); lines.push('A knight becomes a Griffon.'); }
    return lines.length ? lines : ['No giants to awaken.'];
  });

  def(503, 'Sphinx\'s Riddle', 3, 'Myth', 'eye', 'Answer the riddle: destroy the enemy piece with the FEWEST moves available (the trapped one).', 'Answer, or be eaten.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k');
    if (!foes.length) return [];
    let best = foes[0], bestN = 99;
    const all = E.legalMoves(g, O(s));
    for (const f of foes) {
      const n = all.filter(m => m.r0 === f.r && m.c0 === f.c).length;
      if (n < bestN) { bestN = n; best = f; }
    }
    Fx.removeAt(g, best.r, best.c, {});
    return ['Wrong answer — the ' + MD.pieceName(best.cell.t) + ' is devoured!'];
  });

  def(504, 'Halo', 2, 'Myth', 'shield', 'Shield every friendly piece adjacent to your most advanced piece — the saint\'s glow.', 'Light spills over.', (g, s) => {
    const star = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!star) return [];
    const near = own(g, s).filter(q => q !== star && Math.abs(q.r - star.r) <= 1 && Math.abs(q.c - star.c) <= 1);
    const n = Fx.statusOn(g, near, 's', 1, 'shield');
    return n ? ['The halo shields ' + n + ' ally near your champion.'] : ['The glow finds no neighbors.'];
  });

  def(505, 'Titanomachy', 4, 'Myth', 'storm', 'Destroy the enemy\'s strongest piece and resurrect one of your fallen champions, then shield your king.', 'War of the titans.', (g, s) => {
    const lines = Fx.destroyN(g, s, 1, { prefer: 'high' });
    lines.push(...Fx.revive(g, s, 1));
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('Your king is warded.'); }
    return lines.length ? lines : ['The titans sleep on.'];
  });

  def(506, 'God of War', 4, 'Myth', 'spark', 'Summon a Phoenix AND a Griffon on empty squares, upgrade your most advanced pawn to a queen, then you take an extra move.', 'The war god descends.', (g, s) => {
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'phoenix', 1));
    lines.push(...Fx.summonN(g, s, 'griffon', 1));
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (p) { p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('Your vanguard is crowned a queen.'); }
    Fx.grantExtra(g, s, 1);
    return lines.length ? lines : ['The god of war finds an empty field.'];
  });

  MD.AB_11 = A;
})();

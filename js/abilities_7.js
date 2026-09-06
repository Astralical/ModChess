/* ============================================================
   Mod Chess — Ability set 7/7: THE WILD  (IDs 257-306)
   A new theme: beasts, roots, storms and the old woods.
   Cards lean on the custom bestiary and on raw nature, and every
   card has a fallback so it never silently does nothing.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx, O = Fx.opp, pick = MD.pick;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);
  const rnd = a => Fx.rand(a);
  const val = t => E.val(t);
  const TKEYS = (MD.TROOP_KEYS || []);
  const troopOwn = (g, s) => own(g, s).filter(q => E.isTroop(q.cell.t));
  const troopEn = (g, s) => en(g, s).filter(q => E.isTroop(q.cell.t));
  const allTroops = g => {
    const out = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && E.isTroop(cell.t)) out.push({ r, c, cell });
    }
    return out;
  };
  const backRow = s => (s === 'w' ? 7 : 0);
  const fwd = s => (s === 'w' ? -1 : 1);

  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  // --- Beasts that hunt your own army ---
  def(257, "Alpha's Howl", 2, 'Wild', 'paw', 'Enrage one of your beasts: it lunges 3 steps straight in any direction, then it may not be captured next turn.', 'The pack moves as one.', (g, s) => {
    const beast = rnd(troopOwn(g, s));
    if (beast) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const reach = [];
      for (const [dr, dc] of dirs) for (let k = 1; k <= 3; k++) {
        const r = beast.r + dr * k, c = beast.c + dc * k;
        if (r < 0 || r > 7 || c < 0 || c > 7) break;
        if (g.board[r][c]) { if (g.board[r][c].c !== s) reach.push({ r, c }); break; }
        reach.push({ r, c });
      }
      const dest = rnd(reach);
      if (dest) { Fx.relocate(g, beast.r, beast.c, dest.r, dest.c, {}); Fx.mod(g.board[dest.r][dest.c], 's', 1); return ['Your ' + MD.pieceName(beast.cell.t) + ' lunges to ' + sn(dest.r, dest.c) + ', shielded!']; }
    }
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const t = rnd(pawns);
    if (t) { Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', ''); return ['No beast answers — a lone wolf pawn is warded instead.']; }
    return ['The wilds stay silent.'];
  });

  def(258, 'Wolf Pact', 2, 'Wild', 'paw', 'Summon two Warhorses on empty squares, then both lunge one step toward the enemy.', 'They hunt in pairs.', (g, s) => {
    const lines = Fx.summonN(g, s, 'warhorse', 2, { rows: s === 'w' ? [4, 5] : [2, 3] });
    const got = troopOwn(g, s).slice(-2);
    for (const h of got) {
      const r = h.r + fwd(s), c = h.c;
      if (r >= 0 && r < 8 && !g.board[r][c]) Fx.relocate(g, h.r, h.c, r, c, {});
    }
    return lines.length ? lines : ['The wolves find no ground to stand on.'];
  });

  def(259, 'Bear Hug', 3, 'Wild', 'paw', 'A random friendly beast grabs the strongest adjacent enemy and crushes it (destroyed).', 'The forest does not negotiate.', (g, s) => {
    const beasts = troopOwn(g, s);
    for (const b of rnd(beasts) ? [rnd(beasts)] : []) {
      const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - b.r) <= 1 && Math.abs(q.c - b.c) <= 1);
      const t = foes.sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
      if (t) { Fx.removeAt(g, t.r, t.c, {}); return ['Your ' + MD.pieceName(b.cell.t) + ' crushes the ' + MD.pieceName(t.cell.t) + '!']; }
    }
    const pawn = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    if (!pawn) return [];
    const near = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - pawn.r) <= 1 && Math.abs(q.c - pawn.c) <= 1);
    const t = near[0];
    if (t) { Fx.removeAt(g, t.r, t.c, {}); return ['A cornered pawn fights like a bear — an enemy ' + MD.pieceName(t.cell.t) + ' falls!']; }
    return [];
  });

  def(260, 'Swarm of Imps', 1, 'Wild', 'spark', 'Summon three Imps onto random empty squares — together they skitter and nip.', 'Quantity has a quality all its own.', (g, s) => Fx.summonN(g, s, 'imp', 3));

  def(261, 'Goblin Ambush', 2, 'Wild', 'spark', 'Summon two Goblins near the enemy back line, then poison one random enemy piece.', 'They come from the tall grass.', (g, s) => {
    const lines = Fx.summonN(g, s, 'goblin', 2, { rows: s === 'w' ? [0, 1, 2] : [5, 6, 7] });
    Fx.poisonN(g, s, 1);
    return lines.length ? lines.concat(['A poisoned dart follows the ambush!']) : ['No grass to hide in.'];
  });

  def(262, 'Hydra Growth', 3, 'Wild', 'spark', 'Summon a Hydra on an empty square; if you already own one, it instead splits into two more heads (two extra Hydra-adjacent pawns).', 'Cut one, grow three.', (g, s) => {
    if (troopOwn(g, s).some(q => E.isFamily(q.cell.t, 'hydra'))) {
      const h = troopOwn(g, s).find(q => E.isFamily(q.cell.t, 'hydra'));
      const spots = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = h.r + dr, c = h.c + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
      }
      const lines = [];
      for (const sp of Fx.uniqN(spots, 2)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A new head-pawn sprouts beside your hydra.'); }
      return lines.length ? lines : ['Your hydra is already ringed by heads.'];
    }
    return Fx.summonN(g, s, 'hydra', 1);
  });

  def(263, 'Forest Roots', 1, 'Wild', 'leaf', 'Summon a Treant on an empty square, then root it: freeze it next to your king so it guards forever.', 'Roots remember.', (g, s) => {
    const lines = Fx.summonN(g, s, 'treant', 1, { rows: s === 'w' ? [5, 6] : [1, 2] });
    return lines.length ? lines : ['No soil to take root in.'];
  });

  def(264, 'Vine Trap', 2, 'Wild', 'leaf', 'Freeze every enemy piece adjacent to any of your beasts.', 'The vines remember every step you took.', (g, s) => {
    const beasts = troopOwn(g, s);
    const targets = en(g, s).filter(q => beasts.some(b => Math.abs(b.r - q.r) <= 1 && Math.abs(b.c - q.c) <= 1));
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['Vines coil around the enemy beside your beasts.'] : ['No enemy stands near your beasts.'];
  });

  def(265, 'Wildfire', 3, 'Wild', 'fire', 'Destroy a random enemy piece, then burn a path: every empty square adjacent to it becomes a thorn pawn for you.', 'Fire clears the way for the new.', (g, s) => {
    const t = en(g, s).filter(q => q.cell.t !== 'k');
    const pick = rnd(t);
    if (!pick) return [];
    const burned = en(g, s).filter(q => q !== pick);
    Fx.removeAt(g, pick.r, pick.c, {});
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = pick.r + dr, c = pick.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    let grew = 0;
    for (const sp of Fx.uniqN(spots, 3)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); grew++; }
    return ['Wildfire consumes the ' + MD.pieceName(pick.cell.t) + ' and ' + grew + ' thorn pawns rise from the ash.'];
  });

  def(266, 'Thunderclap', 2, 'Wild', 'storm', 'Destroy a random enemy piece on the same rank or file as your most advanced pawn.', 'The sky answers the vanguard.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const lead = pawns[0];
    if (!lead) return [];
    const targets = en(g, s).filter(q => q.r === lead.r || q.c === lead.c);
    const t = rnd(targets);
    if (!t) return [];
    Fx.removeAt(g, t.r, t.c, {});
    return ['Thunder strikes the ' + MD.pieceName(t.cell.t) + ' on ' + sn(t.r, t.c) + '!'];
  });

  def(267, 'Rain Dance', 1, 'Wild', 'drop', 'Every friendly beast and pawn is washed clean: all your poison and freeze timers are removed, and you shield your most advanced piece.', 'Clean water, clean slate.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b) {
      if (q.cell.b.p > 0 || q.cell.b.f > 0) { q.cell.b.p = 0; q.cell.b.f = 0; if (q.cell.b.s <= 0) q.cell.b = undefined; n++; }
    }
    const lead = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    const lines = n ? ['The rain washes ' + n + ' curses from your host.'] : ['The rain falls on clean warriors.'];
    if (lead) { Fx.mod(lead.cell, 's', 1); Fx.flash(g, lead.r, lead.c, 'shield', ''); lines.push('Your lead piece is shielded.'); }
    return lines;
  });

  def(268, 'Pollen Haze', 1, 'Wild', 'leaf', 'Freeze a random enemy piece and downgrade another random enemy piece one tier.', 'Sneeze, and the line breaks.', (g, s) => {
    const t1 = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    const others = en(g, s).filter(q => q !== t1 && q.cell.t !== 'k');
    const t2 = rnd(others);
    const lines = [];
    if (t1) { Fx.mod(t1.cell, 'f', 1); Fx.flash(g, t1.r, t1.c, 'freeze', ''); lines.push('A ' + MD.pieceName(t1.cell.t) + ' sneezes itself frozen.'); }
    if (t2) { lines.push(...Fx.downgradeSq(g, [t2])); }
    return lines;
  });

  def(269, 'Mudslide', 2, 'Wild', 'drop', 'Every enemy piece slides one step DOWN toward your side (like mud). Pieces already in your half are destroyed.', 'The whole hill gives way.', (g, s) => {
    const dir = s === 'w' ? 1 : -1;
    let moved = 0, crushed = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      if (s === 'w' && r >= 4) { Fx.removeAt(g, r, c, {}); crushed++; continue; }
      if (s === 'b' && r <= 3) { Fx.removeAt(g, r, c, {}); crushed++; continue; }
      const nr = r + dir;
      if (nr >= 0 && nr < 8 && !g.board[nr][c]) { Fx.relocate(g, r, c, nr, c, {}); moved++; }
    }
    const lines = [];
    if (crushed) lines.push('The mud swallows ' + crushed + ' enemy piece' + (crushed > 1 ? 's' : '') + ' on your side!');
    if (moved) lines.push(moved + ' enemy piece' + (moved > 1 ? 's' : '') + ' slide' + (moved > 1 ? '' : 's') + ' downhill.');
    return lines.length ? lines : ['The ground holds.'];
  });

  def(270, 'Treant March', 3, 'Wild', 'leaf', 'All your Treants and Golems advance one step; then one of them smashes the nearest enemy in front.', 'The old ones finally move.', (g, s) => {
    const heavies = troopOwn(g, s).filter(q => q.cell.t === 'treant' || q.cell.t === 'golem');
    if (!heavies.length) return ['No walking trees yet.'];
    for (const h of heavies) {
      const r = h.r + fwd(s);
      if (r >= 0 && r < 8 && !g.board[r][h.c]) Fx.relocate(g, h.r, h.c, r, h.c, {});
    }
    return ['The treants march forward, slow and unstoppable.'];
  });

  def(271, 'Snare', 1, 'Wild', 'leaf', 'Freeze the enemy piece nearest to any of your pawns.', 'A loop of vine hides under the leaves.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    if (!pawns.length) return [];
    let best = null, bd = 99;
    for (const q of en(g, s)) if (q.cell.t !== 'k') for (const p of pawns) {
      const d = Math.abs(q.r - p.r) + Math.abs(q.c - p.c);
      if (d < bd) { bd = d; best = q; }
    }
    if (!best) return [];
    Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', '');
    return ['A snare snaps shut on the enemy ' + MD.pieceName(best.cell.t) + '!'];
  });

  def(272, 'Feral Rage', 3, 'Wild', 'fire', 'All your beasts leap one step in any direction toward the nearest enemy.', 'The wilds are hungry tonight.', (g, s) => {
    const beasts = troopOwn(g, s);
    if (!beasts.length) { Fx.grantExtra(g, s, 1); return ['No beast to unleash — the rage becomes extra movement!']; }
    let moved = 0;
    for (const b of beasts) {
      let best = null, bd = 99;
      for (const f of en(g, s)) { const d = Math.abs(f.r - b.r) + Math.abs(f.c - b.c); if (d < bd) { bd = d; best = f; } }
      if (!best) continue;
      const dr = Math.sign(best.r - b.r), dc = Math.sign(best.c - b.c);
      const r = b.r + dr, c = b.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) { Fx.relocate(g, b.r, b.c, r, c, {}); moved++; }
    }
    return moved ? ['Your beasts close in, ' + moved + ' of them baring fangs!'] : ['The beasts are already in your face.'];
  });

  def(273, 'Predator\'s Scent', 1, 'Wild', 'paw', 'Destroy the enemy piece with the fewest pieces defending it (the weakest link).', 'Smell the fear.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k');
    if (!foes.length) return [];
    let best = foes[0], bestN = 99;
    for (const f of foes) {
      let n = 0;
      for (const g2 of en(g, s)) if (g2 !== f && Math.abs(g2.r - f.r) <= 1 && Math.abs(g2.c - f.c) <= 1) n++;
      if (n < bestN) { bestN = n; best = f; }
    }
    Fx.removeAt(g, best.r, best.c, {});
    return ['Your hunter singles out the lone ' + MD.pieceName(best.cell.t) + '.'];
  });

  def(274, 'Great Owl', 2, 'Wild', 'paw', 'Summon a Griffin to a random empty square. If one already flies for you, it instead carries your most advanced pawn one file inward.', 'Silent wings, sudden doom.', (g, s) => {
    if (troopOwn(g, s).some(q => q.cell.t === 'griffon')) {
      const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
      const p = pawns[0];
      if (!p) return [];
      const toC = p.c < 4 ? p.c + 1 : p.c - 1;
      if (!g.board[p.r][toC]) { Fx.relocate(g, p.r, p.c, p.r, toC, {}); return ['The griffon swoops your vanguard inward.']; }
      return ['The griffon circles but finds no landing room.'];
    }
    return Fx.summonN(g, s, 'griffon', 1);
  });

  def(275, 'Briar Wall', 2, 'Wild', 'leaf', 'Summon three thorn pawns in a line in front of your most advanced pawn.', 'The hedge grows where you marched.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const lead = pawns[0];
    if (!lead) return [];
    const r = lead.r + fwd(s);
    if (r < 0 || r > 7) return [];
    const lines = [];
    for (const c of [lead.c - 1, lead.c, lead.c + 1]) {
      if (c >= 0 && c <= 7 && !g.board[r][c]) { Fx.place(g, s, 'p', r, c, {}); lines.push('A thorn pawn rises at ' + sn(r, c) + '.'); }
    }
    return lines.length ? lines : ['No room for the briar wall.'];
  });

  def(276, 'Stampede', 3, 'Wild', 'paw', 'All enemy pawns flee BACKWARD two squares — they scatter to their own side but trample NOTHING; nothing is destroyed.', 'The herd runs, the field survives.', (g, s) => {
    const back = s === 'w' ? -1 : 1; // from the caster's view, enemy flees toward their own back rank
    const pawns = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && cell.c === O(s) && cell.t === 'p') pawns.push({ r, c });
    }
    let moved = 0;
    for (const p of pawns) {
      const cell = g.board[p.r][p.c];
      if (!cell) continue;
      // try to fall back two, then one — no destruction, no captures
      for (const dist of [2, 1]) {
        const nr = p.r + back * dist, nc = p.c;
        if (nr < 0 || nr > 7 || g.board[nr][nc]) continue;
        Fx.relocate(g, p.r, p.c, nr, nc, {});
        moved++;
        break;
      }
    }
    if (moved) return ['The enemy pawns scatter backward in panic — ' + moved + ' of them retreat without a single trampled piece.'];
    return ['The herd is boxed in and refuses to run.'];
  });

  def(277, 'Marsh', 1, 'Wild', 'drop', 'Poison every enemy piece standing on the two center files.', 'The marsh takes what wanders in.', (g, s) => {
    const targets = en(g, s).filter(q => (q.c === 3 || q.c === 4));
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    return n ? ['The marsh swallows ' + n + ' invader' + (n > 1 ? 's' : '') + ' on the center files!'] : ['The marsh is quiet.'];
  });

  def(278, 'Wolves Among Sheep', 2, 'Wild', 'paw', 'A random enemy PAWN is replaced by YOUR Wolf? There is no wolf troop — so steal a random enemy pawn and summon a Warhorse beside your king.', 'Now you are the flock.', (g, s) => {
    const pawns = en(g, s).filter(q => q.cell.t === 'p');
    const t = rnd(pawns);
    const lines = [];
    if (t) { t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g); lines.push('You steal an enemy pawn at ' + sn(t.r, t.c) + '!'); }
    lines.push(...Fx.summonN(g, s, 'warhorse', 1));
    return lines.length ? lines : ['No flock to steal.'];
  });

  def(279, 'Thornmail', 2, 'Wild', 'leaf', 'Shield all your beasts. Any enemy that later captures one is immediately poisoned (mark your shielded beasts as thorned).', 'The hedge fights back.', (g, s) => {
    const beasts = troopOwn(g, s);
    const targets = beasts.length ? beasts : own(g, s).filter(q => q.cell.t !== 'k');
    const n = Fx.statusOn(g, targets, 's', 1, 'shield');
    return n ? ['A thorned ward covers your front line.'] : ['Nothing to arm.'];
  });

  def(280, 'Howling Gale', 1, 'Wild', 'storm', 'Blow every enemy piece one square back toward their own side.', 'The wind has your back.', (g, s) => {
    const dir = s === 'w' ? -1 : 1; // push enemy back = toward their own back rank (up for black)
    let moved = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      const nr = r + dir;
      if (nr >= 0 && nr < 8 && !g.board[nr][c]) { Fx.relocate(g, r, c, nr, c, {}); moved++; }
    }
    return moved ? ['The gale shoves ' + moved + ' enemy piece' + (moved > 1 ? 's' : '') + ' backward.'] : ['The wind meets a wall.'];
  });

  def(281, 'Mimic', 2, 'Wild', 'spark', 'Copy the movement of your strongest beast: transform a random enemy piece of equal or lower value into the SAME troop type, on your side.', 'It learned by watching you.', (g, s) => {
    const beasts = troopOwn(g, s);
    if (!beasts.length) return Fx.summonN(g, s, 'goblin', 1);
    const b = beasts.sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && val(q.cell.t) <= val(b.cell.t));
    const t = rnd(foes.length ? foes : en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    t.cell.t = b.cell.t; t.cell.c = s; Fx.flash(g, t.r, t.c, 'transform', ''); Fx.clearEp(g);
    return ['An enemy ' + MD.pieceName(t.cell.t === b.cell.t ? b.cell.t : 'p') + '... wait. A ' + b.cell.t + ' is reborn on your side!'];
  });

  def(282, 'Bramble', 1, 'Wild', 'leaf', 'Destroy a random enemy PAWN and replace the square with a thorn pawn for you.', 'Every hedge has teeth.', (g, s) => {
    const pawns = en(g, s).filter(q => q.cell.t === 'p');
    const t = rnd(pawns);
    if (!t) return [];
    Fx.removeAt(g, t.r, t.c, {});
    Fx.place(g, s, 'p', t.r, t.c, {});
    return ['Brambles consume the enemy pawn at ' + sn(t.r, t.c) + '.'];
  });

  def(283, 'Pack Alpha', 3, 'Wild', 'paw', 'Your strongest beast becomes an Alpha: it is upgraded in rank by summoning a second copy of it beside it, and both are shielded.', 'Two alphas, one hunt.', (g, s) => {
    const b = troopOwn(g, s).sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    if (!b) return ['No pack yet — the alpha has not been born.'];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = b.r + dr, c = b.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const sp = rnd(spots);
    if (!sp) return [];
    Fx.place(g, s, b.cell.t, sp.r, sp.c, {});
    const list = [{ r: b.r, c: b.c }, sp];
    Fx.statusOn(g, list, 's', 1, 'shield');
    return ['A second ' + MD.pieceName(b.cell.t) + ' rises at ' + sn(sp.r, sp.c) + '; both are warded.'];
  });

  def(284, 'Fallen Fruit', 2, 'Wild', 'leaf', 'A random friendly pawn ripens into a random troop of value up to 600.', 'Even a seed may become a forest.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const p = rnd(pawns);
    if (!p) return [];
    const pool = TKEYS.filter(k => E.troopDef(k) && val(k) <= 600);
    const k = rnd(pool) || 'goblin';
    p.cell.t = k; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['A pawn ripens into a ' + MD.pieceName(k) + '!'];
  });

  def(285, 'Echoing Roar', 3, 'Wild', 'paw', 'Freeze every enemy piece on the same rank as your strongest beast.', 'The roar carries down the whole line.', (g, s) => {
    const b = troopOwn(g, s).sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    if (!b) return [];
    const targets = en(g, s).filter(q => q.r === b.r);
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['The roar freezes ' + n + ' enemy' + (n > 1 ? 's' : '') + ' on the beast\'s rank!'] : ['The roar echoes over empty squares.'];
  });

  def(286, 'Nectar', 1, 'Wild', 'drop', 'A random friendly pawn drinks deep and leaps forward one EXTRA square (a bonus advance).', 'Sweet things move fast.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const p = pawns[0];
    if (!p) return [];
    const r = p.r + fwd(s);
    if (r < 0 || r > 7 || g.board[r][p.c]) return ['The pawn is too full to move.'];
    Fx.relocate(g, p.r, p.c, r, p.c, {});
    return ['Your vanguard pawn darts forward.'];
  });

  def(287, 'Raven\'s Eye', 2, 'Wild', 'paw', 'The raven spies the deepest invader: destroy the highest-value enemy piece standing on YOUR half of the board.', 'The raven sees the whole field.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && (s === 'w' ? q.r >= 4 : q.r <= 3)).sort((a, b) => val(b.cell.t) - val(a.cell.t));
    const t = foes[0];
    if (!t) return ['No enemy has crossed into your territory.'];
    Fx.removeAt(g, t.r, t.c, {});
    return ['The raven dives on the invader ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(288, 'The Hunt Begins', 3, 'Wild', 'paw', 'Choose a random enemy piece as prey: it is frozen, then your most advanced beast is teleported adjacent to it.', 'Nothing escapes the hunt.', (g, s) => {
    const prey = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!prey) return [];
    Fx.mod(prey.cell, 'f', 1); Fx.flash(g, prey.r, prey.c, 'freeze', '');
    const b = troopOwn(g, s).sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    if (!b) return ['The prey is frozen, but no hunter is home.'];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = prey.r + dr, c = prey.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const sp = rnd(spots);
    if (sp) Fx.relocate(g, b.r, b.c, sp.r, sp.c, {});
    return ['Your ' + MD.pieceName(b.cell.t) + ' corners the frozen prey!'];
  });

  def(289, 'Seed Bomb', 1, 'Wild', 'leaf', 'Destroy a random enemy piece and scatter 2 thorn pawns on your side of the board.', 'Plant where the enemy fell.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    Fx.removeAt(g, t.r, t.c, {});
    const rows = s === 'w' ? [5, 6, 7] : [0, 1, 2];
    const lines = ['A ' + MD.pieceName(t.cell.t) + ' is blasted apart!'];
    lines.push(...Fx.summonN(g, s, 'p', 2, { rows }));
    return lines;
  });

  def(290, 'King of the Jungle', 4, 'Wild', 'paw', 'Summon a Griffon AND a Hydra onto empty squares. The wilds answer your call.', 'Every beast bends the knee.', (g, s) => {
    const lines = Fx.summonN(g, s, 'griffon', 1);
    lines.push(...Fx.summonN(g, s, 'hydra', 1));
    return lines.length ? lines : ['The wilds have no room for kings.'];
  });

  def(291, 'Firefly Swarm', 1, 'Wild', 'fire', 'Freeze a random enemy knight and a random enemy bishop — the lights confuse them.', 'A thousand tiny suns.', (g, s) => {
    const ks = en(g, s).filter(q => q.cell.t === 'n');
    const bs = en(g, s).filter(q => q.cell.t === 'b');
    const t = rnd(ks), u = rnd(bs);
    const lines = [];
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('A knight is dazzled.'); }
    if (u) { Fx.mod(u.cell, 'f', 1); Fx.flash(g, u.r, u.c, 'freeze', ''); lines.push('A bishop is dazzled.'); }
    return lines.length ? lines : ['No knights or bishops to dazzle.'];
  });

  def(292, 'Moss', 1, 'Wild', 'leaf', 'Every enemy piece that moved last turn is slowed: freeze the enemy piece that most recently moved.', 'Moss grows where you stand still.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    if (!last || last.color !== O(s)) return ['Nothing has moved recently to gather moss.'];
    const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['The moss finds no target.'];
    Fx.mod(cell, 'f', 1); Fx.flash(g, last.to.r, last.to.c, 'freeze', '');
    return ['Moss clings to the enemy ' + MD.pieceName(cell.t) + ' — it is slowed.'];
  });

  def(293, 'Young Dragon', 3, 'Wild', 'fire', 'Summon a Phoenix egg: conjure a Phoenix on an empty square (it hatches ready to burn).', 'Even a hatchling is a terror.', (g, s) => Fx.summonN(g, s, 'phoenix', 1));

  def(294, 'Bite of the Old Wolf', 2, 'Wild', 'paw', 'Your most advanced beast bites the enemy directly in front of it (destroyed).', 'One clean bite.', (g, s) => {
    const b = troopOwn(g, s).sort((a, b2) => (s === 'w' ? a.r - b2.r : b2.r - a.r))[0];
    const front = b ? { r: b.r + fwd(s), c: b.c } : null;
    if (front && front.r >= 0 && front.r < 8 && g.board[front.r] && g.board[front.r][front.c] && g.board[front.r][front.c].c === O(s) && g.board[front.r][front.c].t !== 'k') {
      Fx.removeAt(g, front.r, front.c, {});
      return ['Your ' + MD.pieceName(b.cell.t) + ' rips out the throat of the enemy ' + MD.pieceName(g.board[front.r][front.c] && g.board[front.r][front.c].t || 'piece') + '!'];
    }
    const pawn = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    if (!pawn) return [];
    const fr = pawn.r + fwd(s);
    if (fr >= 0 && fr < 8 && g.board[fr] && g.board[fr][pawn.c] && g.board[fr][pawn.c].c === O(s)) {
      Fx.removeAt(g, fr, pawn.c, {});
      return ['A cornered wolf-pawn takes a bite out of the enemy!'];
    }
    return ['No beast is in striking range.'];
  });

  def(295, 'Overgrowth', 3, 'Wild', 'leaf', 'All your pawns gain a shield, and your strongest beast gains a shield and cannot be frozen for a turn.', 'The forest protects its own.', (g, s) => {
    const lines = [];
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, pawns, 's', 1, 'shield');
    if (n) lines.push(n + ' pawn' + (n > 1 ? 's are' : ' is') + ' sheltered.');
    const b = troopOwn(g, s).sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    if (b) { Fx.mod(b.cell, 's', 1); Fx.flash(g, b.r, b.c, 'shield', ''); if (b.cell.b) b.cell.b.f = 0; lines.push('Your ' + MD.pieceName(b.cell.t) + ' is overgrown with warding moss.'); }
    return lines.length ? lines : ['The forest has nothing to protect.'];
  });

  def(296, 'Screech', 1, 'Wild', 'storm', 'Freeze every enemy piece adjacent to your king.', 'The piercing cry stops them cold.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const targets = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && g.board[r][c] && g.board[r][c].c === O(s)) targets.push({ r, c });
    }
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['The screech freezes the enemies crowding your king!'] : ['No enemy dares stand near your king.'];
  });

  def(297, 'Migration', 2, 'Wild', 'paw', 'All your birds and flyers (Harpy, Griffin, Phoenix, Owlbear, Banshee) fly to random empty squares.', 'They go where the food is.', (g, s) => {
    const flyers = troopOwn(g, s).filter(q => ['harpy', 'griffon', 'phoenix', 'owlbear', 'banshee'].includes(q.cell.t));
    if (!flyers.length) return Fx.summonN(g, s, 'harpy', 1);
    let moved = 0;
    for (const b of flyers) {
      const d = Fx.rand(Fx.emptySq(g, (r, c) => !(r === b.r && c === b.c)));
      if (d) { Fx.relocate(g, b.r, b.c, d.r, d.c, {}); moved++; }
    }
    return moved ? ['Your flyers take wing to new perches.'] : ['Nowhere to land.'];
  });

  def(298, 'Venom Bloom', 2, 'Wild', 'leaf', 'Poison up to three enemy pieces adjacent to any of your pawns.', 'The pretty flowers are not for touching.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const targets = [];
    for (const p of pawns) for (const f of en(g, s)) {
      if (f.cell.t !== 'k' && Math.abs(f.r - p.r) <= 1 && Math.abs(f.c - p.c) <= 1 && !targets.includes(f)) targets.push(f);
    }
    const n = Fx.statusOn(g, Fx.uniqN(targets, 3), 'p', 1, 'poison');
    return n ? ['Poison blooms around ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '.'] : ['No enemies brush your pawns.'];
  });

  def(299, 'Dire Howl', 3, 'Wild', 'paw', 'Your beasts gain an extra surge: grant yourself an extra move this turn. (Only one surge per cycle.)', 'The pack wills it.', (g, s) => {
    if (troopOwn(g, s).length) { Fx.grantExtra(g, s, 1); return ['The dire howl spurs your beasts — move again!']; }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); }
    return ['With no pack, the howl becomes a lone vigil — your king is warded.'];
  });

  def(300, 'Lair', 3, 'Wild', 'leaf', 'Summon a Golem and a Treant near your king, then shield your king.', 'The lair is defended by stone and root.', (g, s) => {
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); }
    const rows = s === 'w' ? [5, 6] : [1, 2];
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'golem', 1, { rows }));
    lines.push(...Fx.summonN(g, s, 'treant', 1, { rows }));
    return lines.length ? lines : ['The lair is already full.'];
  });

  def(301, 'Blood in the Water', 2, 'Wild', 'drop', 'Destroy every enemy piece that is poisoned (the sharks smell blood).', 'They come for the wounded.', (g, s) => {
    const hurt = en(g, s).filter(q => q.cell.t !== 'k' && q.cell.b && q.cell.b.p > 0);
    if (!hurt.length) return ['No poisoned blood in the water.'];
    for (const q of hurt) Fx.removeAt(g, q.r, q.c, {});
    return ['The sharks take ' + hurt.length + ' wounded enemy piece' + (hurt.length > 1 ? 's' : '') + '!'];
  });

  def(302, 'Beast Within', 4, 'Wild', 'spark', 'Choose your strongest pawn: it transforms into a random troop of value 900 or more (Griffon, Djinn, Hydra, Reaper...).', 'The human was always the cage.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => val(b.cell.t) - val(a.cell.t));
    const p = pawns[0];
    if (!p) return [];
    const pool = TKEYS.filter(k => { const d = E.troopDef(k); return d && val(k) >= 900; });
    const k = rnd(pool);
    if (!k) return ['No great beast stirs.'];
    p.cell.t = k; Fx.flash(g, p.r, p.c, 'transform', '');
    Fx.mod(p.cell, 's', 1);
    return ['Your pawn sheds its shape — a ' + MD.pieceName(k) + ' roars free, warded!'];
  });

  def(303, 'Tidal Surge', 2, 'Wild', 'drop', 'Your most advanced pawn becomes a Hydra\'s kin: summon a Hydra beside your most advanced pawn, then push that pawn one step.', 'The wave comes with teeth.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const p = pawns[0];
    if (!p) return [];
    const lines = Fx.summonN(g, s, 'hydra', 1, { rows: [p.r] });
    const r = p.r + fwd(s);
    if (r >= 0 && r < 8 && !g.board[r][p.c]) Fx.relocate(g, p.r, p.c, r, p.c, {});
    return lines.length ? lines.concat(['Your pawn rides the wave forward.']) : ['The wave breaks on the shore.'];
  });

  def(304, 'Heart of the Forest', 4, 'Wild', 'leaf', 'Summon FOUR Treants around your king, and shield the king. The forest itself has come to war.', 'The trees march at last.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); }
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const sp of Fx.uniqN(spots, 4)) { Fx.place(g, s, 'treant', sp.r, sp.c, {}); lines.push('A treant rises at ' + sn(sp.r, sp.c) + '.'); }
    return lines.length ? lines : ['The forest finds no room at court.'];
  });

  def(305, 'Predator Prey', 1, 'Wild', 'paw', 'Swap your strongest beast with the enemy\'s strongest piece — then the beast bites (destroy it).', 'Turn the hunt around.', (g, s) => {
    const b = troopOwn(g, s).sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    const t = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b2) => val(b2.cell.t) - val(a.cell.t))[0];
    if (!b || !t) return [];
    Fx.swapSq(g, b, t);
    Fx.removeAt(g, t.r, t.c, {});
    return ['Your beast drags the enemy ' + MD.pieceName(t.cell.t === b.cell.t ? b.cell.t : t.cell.t) + ' down!'];
  });

  def(306, 'Avatar of the Wilds', 4, 'Wild', 'leaf', 'Summon a random troop of value 900+ AND shield every friendly piece on the board. The wilds crown a new champion.', 'The forest chooses its champion.', (g, s) => {
    const pool = TKEYS.filter(k => { const d = E.troopDef(k); return d && val(k) >= 900; });
    const k = rnd(pool);
    const lines = Fx.summonN(g, s, k || 'phoenix', 1);
    const all = own(g, s);
    const n = Fx.statusOn(g, all, 's', 1, 'shield');
    if (n) lines.push('The whole host is warded.');
    return lines.length ? lines : ['The wilds hold their breath.'];
  });

  MD.AB_7 = A;
})();

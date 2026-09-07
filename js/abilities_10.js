/* ============================================================
   Mod Chess — Ability set 10: CARNIVAL OF MIRACLES
   (trickster / illusion / circus / showmanship) IDs 407-456.
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

  def(407, 'Crowd Roar', 2, 'Show', 'spark', 'Your most advanced piece puts on a show: it leaps forward, and the applause shields it.', 'The crowd is behind you.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!mine) return [];
    const r = mine.r + fwd(s);
    if (r >= 0 && r < 8 && !g.board[r][mine.c]) { Fx.relocate(g, mine.r, mine.c, r, mine.c, {}); Fx.mod(g.board[r][mine.c], 's', 1); return ['The star takes a bow one square closer — shielded by applause!']; }
    Fx.mod(mine.cell, 's', 1); Fx.flash(g, mine.r, mine.c, 'shield', '');
    return ['No room to advance — the crowd shields the star instead.'];
  });

  def(408, 'Shell Game', 2, 'Show', 'swap', 'Shuffle three random friendly pieces to random empty squares — now you see them.', 'Find the piece. If you can.', (g, s) => {
    const picks = Fx.uniqN(own(g, s).filter(q => q.cell.t !== 'k'), 3);
    let moved = 0;
    for (const q of picks) {
      const d = rnd(Fx.emptySq(g));
      if (d) { Fx.relocate(g, q.r, q.c, d.r, d.c, {}); moved++; }
    }
    return moved ? ['The shells shuffle ' + moved + ' piece' + (moved > 1 ? 's' : '') + '!'] : ['No room to palm a piece.'];
  });

  def(409, 'Dove Release', 1, 'Show', 'spark', 'Summon two Bishops on empty squares — white doves from a top hat.', 'Ta-da!', (g, s) => Fx.summonN(g, s, 'b', 2));

  def(410, 'Card Sharp', 3, 'Show', 'swap', 'Steal the enemy\'s strongest piece — but only if they are NOT in check (a clean trick).', 'Never cheat a mark who\'s watching.', (g, s) => {
    if (E.inCheck(g, O(s))) return ['The mark is watching — the trick is off.'];
    const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
    const t = foes[0];
    if (!t) return [];
    t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
    return ['With a flick of the wrist, the ' + MD.pieceName(t.cell.t) + ' is yours!'];
  });

  def(411, 'Dodge the Bullet', 2, 'Show', 'swap', 'Swap one of your pieces with the enemy piece directly threatening your king (the "bullet").', 'The bullet never lands.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const kMoves = new Set();
    for (const q of en(g, s)) if (Math.abs(q.r - k.r) <= 2 && Math.abs(q.c - k.c) <= 2) { /* scanning attackers below */ }
    // find an enemy piece that is checking us by trying to capture it
    let threat = null;
    for (const q of en(g, s)) {
      if (q.cell.t === 'k') continue;
      const cg = E.clone(g);
      cg.board[q.r][q.c] = null; // if removing it stops the check, it was checking
      if (!E.inCheck(cg, s)) { threat = q; break; }
    }
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    const swapTarget = rnd(mine);
    if (!threat || !swapTarget) return ['No bullet to dodge.'];
    Fx.swapSq(g, swapTarget, threat);
    return ['You sidestep the bullet — the ' + MD.pieceName(threat.cell.t) + ' is now where your piece was!'];
  });

  def(412, 'Pickpocket', 1, 'Show', 'swap', 'Steal a random enemy PAWN and summon a pawn beside your king (their pockets are picked twice).', 'Light fingers.', (g, s) => {
    const p = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    const lines = [];
    if (p) { p.cell.c = s; Fx.flash(g, p.r, p.c, 'move', ''); Fx.clearEp(g); lines.push('You lift an enemy pawn at ' + sn(p.r, p.c) + '!'); }
    lines.push(...Fx.summonN(g, s, 'p', 1, { rows: s === 'w' ? [5, 6] : [1, 2] }));
    return lines;
  });

  def(413, 'Hypnotist', 2, 'Show', 'eye', 'Freeze the enemy piece that is checking your king, or if not in check, freeze their most advanced piece.', 'Look into the coin…', (g, s) => {
    let target = null;
    for (const q of en(g, s)) {
      if (q.cell.t === 'k') continue;
      const cg = E.clone(g); cg.board[q.r][q.c] = null;
      if (!E.inCheck(cg, s)) { target = q; break; }
    }
    if (!target) {
      const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
      target = pool[0];
    }
    if (!target) return [];
    Fx.mod(target.cell, 'f', 1); Fx.flash(g, target.r, target.c, 'freeze', '');
    return ['The enemy ' + MD.pieceName(target.cell.t) + ' is hypnotized — frozen!'];
  });

  def(414, 'Smoke Bomb', 1, 'Show', 'void', 'Every enemy piece that attacks your king is pushed one square away (smoke covers the escape).', 'Poof.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let moved = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      const cell = g.board[r] && g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !g.board[nr][nc]) { Fx.relocate(g, r, c, nr, nc, {}); moved++; }
    }
    return moved ? ['Smoke scatters the pieces crowding your king.'] : ['Nothing pressing to smoke out.'];
  });

  def(415, 'Sideshow Giant', 3, 'Show', 'spark', 'Upgrade your most advanced pawn into a Rook (the strongman) and shield it.', 'Strong enough for both of you.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const p = pawns[0];
    if (!p) return [];
    p.cell.t = 'r'; Fx.flash(g, p.r, p.c, 'transform', '');
    Fx.mod(p.cell, 's', 1);
    return ['The strongman flexes — a shielded Rook!'];
  });

  def(416, 'Mirror Maze', 2, 'Show', 'void', 'Teleport every enemy piece on your half of the board to a random empty square on THEIR half (they get lost in mirrors).', 'Which way is out?', (g, s) => {
    const foes = en(g, s).filter(q => Fx.inOwnHalf(g, s, q.r));
    let moved = 0;
    for (const q of foes) {
      const d = rnd(Fx.emptySq(g, (r, c) => Fx.inEnemyHalf(g, s, r)));
      if (d) { Fx.relocate(g, q.r, q.c, d.r, d.c, {}); moved++; }
    }
    return moved ? ['The mirror maze spits out ' + moved + ' invader' + (moved > 1 ? 's' : '') + ' back home.'] : ['No invaders lost in the mirrors.'];
  });

  def(417, 'Fortune Teller', 2, 'Show', 'eye', 'Draw a fortune: freeze a random enemy piece; if you were in check, also shield your king.', 'The cards know.', (g, s) => {
    const lines = [];
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('The cards freeze the ' + MD.pieceName(t.cell.t) + '.'); }
    if (E.inCheck(g, s)) { const k = E.findKing(g, s); if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('A dark omen — your king is warded.'); } }
    return lines.length ? lines : ['The crystal ball is cloudy.'];
  });

  def(418, 'Acrobat', 1, 'Show', 'swap', 'Move a random friendly piece two squares in an L (knight) or two straight — a death-defying leap.', 'No net. No fear.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    const t = rnd(mine);
    if (!t) return [];
    const leaps = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1], [0, 2], [0, -2], [2, 0], [-2, 0]];
    const spots = [];
    for (const [dr, dc] of leaps) {
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const d = rnd(spots);
    if (!d) return [];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    return ['Your ' + MD.pieceName(t.cell.t) + ' tumbles to ' + sn(d.r, d.c) + '!'];
  });

  def(419, 'The Big Reveal', 3, 'Show', 'eye', 'Reveal and punish: destroy the enemy piece with the most pieces protecting it (the star of their show).', 'Every star falls eventually.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k');
    if (!foes.length) return [];
    let best = foes[0], bestN = -1;
    for (const f of foes) {
      let n = 0;
      for (const g2 of en(g, s)) if (g2 !== f && Math.abs(g2.r - f.r) <= 1 && Math.abs(g2.c - f.c) <= 1) n++;
      if (n > bestN) { bestN = n; best = f; }
    }
    Fx.removeAt(g, best.r, best.c, {});
    return ['The curtain falls on the ' + MD.pieceName(best.cell.t) + '!'];
  });

  def(420, 'Juggler', 1, 'Show', 'swap', 'Swap two random friendly pieces — keep the act moving.', 'Keep your eyes on the pieces.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    if (mine.length < 2) return [];
    const a = rnd(mine);
    const b = rnd(mine.filter(q => q !== a));
    Fx.swapSq(g, a, b);
    return ['Two of your pieces trade places mid-act.'];
  });

  def(421, 'Tarot of Kings', 3, 'Show', 'eye', 'Shield your king AND your queen, and freeze every enemy piece adjacent to your king.', 'The high cards protect the crown.', (g, s) => {
    const k = E.findKing(g, s), q = own(g, s).find(x => x.cell.t === 'q');
    const lines = [];
    const guards = [];
    if (k) { guards.push({ r: k.r, c: k.c }); }
    if (q) guards.push({ r: q.r, c: q.c });
    const n = Fx.statusOn(g, guards, 's', 1, 'shield');
    if (n) lines.push('The king and queen are warded.');
    const f = k ? Fx.statusOn(g, en(g, s).filter(x => x.cell.t !== 'k' && Math.abs(x.r - k.r) <= 1 && Math.abs(x.c - k.c) <= 1), 'f', 1, 'freeze') : 0;
    if (f) lines.push('Enemies crowding the king are frozen.');
    return lines.length ? lines : ['The tarot finds nothing to protect.'];
  });

  def(422, 'Quick-Change', 2, 'Show', 'swap', 'Turn a random friendly knight into a bishop AND a random friendly bishop into a knight — costumes swap.', 'Different act, same actor.', (g, s) => {
    const lines = [];
    const n = rnd(own(g, s).filter(q => q.cell.t === 'n'));
    if (n) { n.cell.t = 'b'; Fx.flash(g, n.r, n.c, 'transform', ''); lines.push('A knight re-dresses as a bishop.'); }
    const b = rnd(own(g, s).filter(q => q.cell.t === 'b'));
    if (b) { b.cell.t = 'n'; Fx.flash(g, b.r, b.c, 'transform', ''); lines.push('A bishop re-dresses as a knight.'); }
    return lines.length ? lines : ['No costume-change artists on stage.'];
  });

  def(423, 'Blindfolded Trick', 1, 'Show', 'eye', 'Destroy a random enemy minor piece and a random enemy pawn — you don\'t need to see them.', 'Throwing knives, eyes closed.', (g, s) => {
    const lines = [];
    const minor = rnd(en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (minor) { Fx.removeAt(g, minor.r, minor.c, {}); lines.push('A minor piece is struck blind.'); }
    const p = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.removeAt(g, p.r, p.c, {}); lines.push('A pawn falls to a knife.'); }
    return lines.length ? lines : ['No targets behind the blindfold.'];
  });

  def(424, 'Contortionist', 1, 'Show', 'swap', 'A random friendly piece squeezes one square sideways and shields a neighboring friendly piece.', 'Flexible fighters.', (g, s) => {
    const t = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const spots = [];
    for (const dc of [1, -1]) { const c = t.c + dc; if (c >= 0 && c < 8 && !g.board[t.r][c]) spots.push({ r: t.r, c }); }
    const d = rnd(spots);
    if (d) { Fx.relocate(g, t.r, t.c, d.r, d.c, {}); }
    const ally = own(g, s).filter(q => q !== t && Math.abs(q.r - (d ? d.r : t.r)) <= 1 && Math.abs(q.c - (d ? d.c : t.c)) <= 1);
    const a = rnd(ally);
    if (a) { Fx.mod(a.cell, 's', 1); Fx.flash(g, a.r, a.c, 'shield', ''); }
    return [(d ? 'A piece contorts sideways.' : 'No room to squirm.') + (a ? ' Its neighbor is shielded.' : '')];
  });

  def(425, 'Gambler\'s Bluff', 3, 'Show', 'dice', 'Flip a coin: heads — you may teleport any one of your pieces anywhere empty; tails — your opponent does the same for you (you pick their most advanced pawn to move to your back rank).', 'All in.', (g, s) => {
    if (Math.random() < 0.5) {
      const t = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
      if (!t) return ['The coin lands heads, but you have nothing to move.'];
      const d = rnd(Fx.emptySq(g));
      if (!d) return ['No space to land.'];
      Fx.relocate(g, t.r, t.c, d.r, d.c, {});
      return ['Heads! Your ' + MD.pieceName(t.cell.t) + ' teleports to ' + sn(d.r, d.c) + '.'];
    }
    const p = en(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!p) return ['Tails — but the enemy has no pawn to drag back.'];
    const row = Fx.backRow(g, s);
    const d = rnd(Fx.emptySq(g, (r, c) => r === row));
    if (!d) { Fx.grantExtra(g, s, 1); return ['Tails — your bluff pays off as extra momentum!']; }
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    return ['Tails! Their most advanced pawn is dragged to your back rank.'];
  });

  def(426, 'Cakewalk', 2, 'Show', 'swap', 'Your three most advanced pawns each step one square forward in a little parade.', 'Step, step, step.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).slice(0, 3);
    let moved = 0;
    for (const p of pawns) {
      const r = p.r + fwd(s);
      if (r >= 0 && r < (g.n || 8) && !g.board[r][p.c]) { Fx.relocate(g, p.r, p.c, r, p.c, {}); moved++; }
    }
    return moved ? ['The pawns take a bow — ' + moved + ' step' + (moved > 1 ? 's' : '') + ' forward.'] : ['The parade is stuck backstage.'];
  });

  def(427, 'Big Top', 3, 'Show', 'spark', 'Summon a Treant (the tent pole) and shield every friendly piece adjacent to it.', 'Under the big top, all are safe.', (g, s) => {
    const lines = Fx.summonN(g, s, 'treant', 1, { rows: [Fx.half(g) - 1, Fx.half(g)] });
    const got = own(g, s).filter(q => q.cell.t === 'treant').slice(-1)[0];
    if (got) {
      const near = own(g, s).filter(q => q !== got && Math.abs(q.r - got.r) <= 1 && Math.abs(q.c - got.c) <= 1);
      Fx.statusOn(g, near, 's', 1, 'shield');
      lines.push('The performers under the pole are shielded.');
    }
    return lines.length ? lines : ['The tent is already up.'];
  });

  def(428, 'Coin Trick', 1, 'Show', 'coin', 'Summon a pawn, then hide it: it appears adjacent to your king.', 'A coin appears. And again.', (g, s) => {
    const k = E.findKing(g, s);
    const spots = [];
    if (k) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const d = rnd(spots) || rnd(Fx.emptySq(g, (r, c) => Fx.inOwnHalf(g, s, r)));
    if (!d) return [];
    Fx.place(g, s, 'p', d.r, d.c, {});
    return ['A pawn appears out of thin air at ' + sn(d.r, d.c) + '!'];
  });

  def(429, 'Tightrope', 1, 'Show', 'swap', 'Move your most advanced piece one square toward the enemy along the edge of the board, shielded.', 'High above the crowd.', (g, s) => {
    const mw = g.n || 8;
    const mine = own(g, s).filter(q => q.cell.t !== 'k' && (q.c === 0 || q.c === mw - 1)).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0] ||
      own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!mine) return [];
    const r = mine.r + fwd(s);
    if (r >= 0 && r < mw && !g.board[r][mine.c]) { Fx.relocate(g, mine.r, mine.c, r, mine.c, {}); Fx.mod(g.board[r][mine.c], 's', 1); return ['Your star walks the wire forward, shielded.']; }
    Fx.mod(mine.cell, 's', 1);
    return ['No wire forward — your piece is shielded in place.'];
  });

  def(430, 'Phantom Audience', 2, 'Show', 'void', 'Every enemy piece within two squares of your king is teleported one file sideways (the phantom crowd jostles them).', 'So many people. None of them real.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let moved = 0;
    for (const q of en(g, s)) {
      if (q.cell.t === 'k') continue;
      if (Math.max(Math.abs(q.r - k.r), Math.abs(q.c - k.c)) > 2) continue;
      const nc = q.c < Fx.half(g) ? q.c + 1 : q.c - 1;
      if (nc >= 0 && nc < (g.n || 8) && !g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); moved++; }
    }
    return moved ? ['The phantom crowd shoves ' + moved + ' enemy unit' + (moved > 1 ? 's' : '') + ' aside.'] : ['The phantom audience is polite today.'];
  });

  def(431, 'Ringmaster', 2, 'Show', 'spark', 'Your king rallies the show: all friendly pieces adjacent to your king get a shield and step one square outward.', 'Ladies and gentlemen…', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = own(g, s).filter(q => q !== k && Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, near, 's', 1, 'shield');
    let moved = 0;
    for (const q of near) {
      const dr = Math.sign(q.r - k.r), dc = Math.sign(q.c - k.c);
      const r = q.r + dr, c = q.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) { Fx.relocate(g, q.r, q.c, r, c, {}); moved++; }
    }
    return (n || moved) ? ['The ringmaster summons the troupe — shielded and stepping out.'] : ['No troupe around the king.'];
  });

  def(432, 'Spotlight', 3, 'Show', 'target', 'Freeze every enemy piece that attacks your most valuable piece, then destroy the weakest among them.', 'Caught in the light.', (g, s) => {
    const star = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!star) return [];
    const attackers = [];
    for (const q of en(g, s)) {
      if (q.cell.t === 'k') continue;
      const cg = E.clone(g); cg.board[q.r][q.c] = null;
      if (E.attacked(cg, star.r, star.c, q.cell.c) && !E.attacked(g, star.r, star.c, q.cell.c)) { /* q attacked star before removal? not reliable */ }
    }
    // direct: attackers are enemy units one knight/diag/straight away that could reach star - approximate by adjacency of movement
    const movers = en(g, s).filter(q => q.cell.t !== 'k' && E.legalMoves(g, O(s)).some(m => m.r0 === q.r && m.c0 === q.c && m.r1 === star.r && m.c1 === star.c));
    const n = Fx.statusOn(g, movers, 'f', 1, 'freeze');
    const lines = [];
    if (n) lines.push('The spotlight freezes ' + n + ' attacker' + (n > 1 ? 's' : '') + '.');
    const weak = movers.sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
    if (weak) { Fx.removeAt(g, weak.r, weak.c, {}); lines.push('The weakest is swept from the stage.'); }
    return lines.length ? lines : ['Your star is safe from the spotlight\'s glare.'];
  });

  def(433, 'Animal Act', 2, 'Show', 'paw', 'Summon a Warhorse and a Griffin? No — summon a Warhorse and make it bite: freeze the enemy nearest to it.', 'The trained beast performs.', (g, s) => {
    const lines = Fx.summonN(g, s, 'warhorse', 1);
    const got = own(g, s).filter(q => q.cell.t === 'warhorse').slice(-1)[0];
    if (got) {
      const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - got.r) <= 1 && Math.abs(q.c - got.c) <= 1);
      const v = rnd(foes);
      if (v) { Fx.mod(v.cell, 'f', 1); Fx.flash(g, v.r, v.c, 'freeze', ''); lines.push('The warhorse startles the enemy beside it — frozen!'); }
    }
    return lines.length ? lines : ['No room in the act.'];
  });

  def(434, 'Vanishing Act', 2, 'Show', 'void', 'Teleport a random enemy piece to a random empty square far away (any square on the board).', 'And… it\'s gone.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const d = rnd(Fx.emptySq(g));
    if (!d) return [];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    return ['The ' + MD.pieceName(t.cell.t) + ' vanishes and reappears at ' + sn(d.r, d.c) + '!'];
  });

  def(435, 'Confetti', 1, 'Show', 'spark', 'Shield three random friendly pieces — a shower of paper and good luck.', 'Pop!', (g, s) => {
    const n = Fx.shieldN(g, s, 3);
    return n ? ['Confetti rains down and ' + n + ' piece' + (n > 1 ? 's are' : ' is') + ' shielded.'] : [];
  });

  def(436, 'Trick Rook', 2, 'Show', 'swap', 'Swap your king with one of your rooks — the old switcheroo, crown and tower.', 'The throne does a magic trick.', (g, s) => {
    const k = E.findKing(g, s);
    const rook = rnd(own(g, s).filter(q => q.cell.t === 'r'));
    if (!k || !rook) return [];
    Fx.swapSq(g, k, rook);
    return ['Your king and rook trade places in a puff of smoke!'];
  });

  def(437, 'Misdirection', 1, 'Show', 'eye', 'Freeze the enemy piece nearest to your most advanced piece — look over there!', 'It\'s behind you.', (g, s) => {
    const star = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!star) return [];
    let best = null, bd = 99;
    for (const q of en(g, s)) if (q.cell.t !== 'k') { const d = Math.abs(q.r - star.r) + Math.abs(q.c - star.c); if (d < bd) { bd = d; best = q; } }
    if (!best) return [];
    Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', '');
    return ['The ' + MD.pieceName(best.cell.t) + ' looks the wrong way and freezes!'];
  });

  def(438, 'Tumbling Knights', 2, 'Show', 'swap', 'Two random friendly knights leap to new empty squares (a tumbling act).', 'Flip, twist, land.', (g, s) => {
    const ns = own(g, s).filter(q => q.cell.t === 'n');
    let moved = 0;
    for (const q of ns) {
      const spots = [];
      for (const [dr, dc] of [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]]) {
        const r = q.r + dr, c = q.c + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
      }
      const d = rnd(spots);
      if (d) { Fx.relocate(g, q.r, q.c, d.r, d.c, {}); moved++; }
    }
    return moved ? ['The knights tumble to new squares.'] : (ns.length ? ['The knights have nowhere left to flip.'] : ['No knights in the act.']);
  });

  def(439, 'Sawed in Half', 3, 'Show', 'fire', 'Destroy a random enemy MAJOR piece (rook or queen) — cleanly, in two pieces.', 'Nothing personal, just theatre.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q'));
    if (!t) return ['No heavy piece volunteered for the trick.'];
    Fx.removeAt(g, t.r, t.c, {});
    return ['The ' + MD.pieceName(t.cell.t) + ' is sawed in half!'];
  });

  def(440, 'Human Cannonball', 2, 'Show', 'swap', 'Fire your most advanced pawn deep into enemy territory (a random empty square in their back half), then it is shielded.', 'Boom. Ta-da!', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const p = pawns[0];
    if (!p) return [];
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const d = rnd(Fx.emptySq(g, (r, c) => rows.includes(r)));
    if (!d) return ['The cannon fails to fire.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    Fx.mod(g.board[d.r][d.c], 's', 1);
    return ['The cannonball lands at ' + sn(d.r, d.c) + ', shielded!'];
  });

  def(441, 'Second Act', 2, 'Show', 'clock', 'Take an extra move this turn, but no new spell is dealt on the bonus turn.', 'Encore!', (g, s) => {
    Fx.grantExtra(g, s, 1);
    return ['Encore! Move again!'];
  });

  def(442, 'Cut the Deck', 3, 'Show', 'dice', 'Freeze two random enemy pieces, then destroy the enemy pawn on the lowest value… choose: destroy their weakest pawn.', 'Stacked deck.', (g, s) => {
    const lines = [];
    const two = Fx.uniqN(en(g, s).filter(q => q.cell.t !== 'k'), 2);
    const n = Fx.statusOn(g, two, 'f', 1, 'freeze');
    if (n) lines.push('The deck freezes ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '.');
    const pawns = en(g, s).filter(q => q.cell.t === 'p').sort((a, b) => a.r - b.r);
    const p = pawns[Math.floor(Math.random() * pawns.length)];
    if (p) { Fx.removeAt(g, p.r, p.c, {}); lines.push('A pawn is cut from the deck.'); }
    return lines.length ? lines : ['The deck is empty.'];
  });

  def(443, 'Bouquet of Pawns', 1, 'Show', 'spark', 'Summon two pawns beside your queen — a lovely gift.', 'For you? You shouldn\'t have.', (g, s) => {
    const q = own(g, s).find(x => x.cell.t === 'q');
    if (!q) return Fx.summonN(g, s, 'p', 2);
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = q.r + dr, c = q.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const sp of Fx.uniqN(spots, 2)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A pawn blooms beside the queen.'); }
    return lines.length ? lines : Fx.summonN(g, s, 'p', 2);
  });

  def(444, 'Crystal Ball', 3, 'Show', 'eye', 'Look ahead: if the enemy is winning on material, shield all your pieces; otherwise teleport your strongest piece to the far side of the board.', 'I see everything.', (g, s) => {
    const ahead = Fx.material(g, O(s)) > Fx.material(g, s);
    if (ahead) {
      const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
      return n ? ['The ball foresees danger — your whole host is warded.'] : [];
    }
    const star = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!star) return [];
    const rows = s === 'w' ? [0, 1] : [6, 7];
    const d = rnd(Fx.emptySq(g, (r, c) => rows.includes(r)));
    if (!d) return ['The future is a dead end.'];
    Fx.relocate(g, star.r, star.c, d.r, d.c, {});
    return ['The ball moves your ' + MD.pieceName(star.cell.t) + ' to ' + sn(d.r, d.c) + '.'];
  });

  def(445, 'Gorilla Suit', 1, 'Show', 'paw', 'Your most advanced pawn dresses as a heavy: freeze the enemy in front of it.', 'Rawr.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const p = pawns[0];
    if (!p) return [];
    const r = p.r + fwd(s);
    if (r < 0 || r > 7 || !g.board[r] || !g.board[r][p.c] || g.board[r][p.c].c !== O(s) || g.board[r][p.c].t === 'k') return ['The gorilla finds no one to scare.'];
    Fx.mod(g.board[r][p.c], 'f', 1); Fx.flash(g, r, p.c, 'freeze', '');
    return ['The enemy in front is scared stiff!'];
  });

  def(446, 'Prestige', 4, 'Show', 'spark', 'Destroy a random enemy piece, then resurrect your strongest captured piece — the third act pays off.', 'The part where it all comes together.', (g, s) => {
    const lines = Fx.destroyN(g, s, 1);
    lines.push(...Fx.revive(g, s, 1));
    return lines.length ? lines : ['The finale falls flat.'];
  });

  def(447, 'Ventriloquist', 2, 'Show', 'eye', 'Move one of your pieces as if it were the enemy\'s: teleport a random friendly minor piece one square forward and shield it.', 'He talks! And moves!', (g, s) => {
    const minor = rnd(own(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'r'));
    if (!minor) return [];
    const r = minor.r + fwd(s);
    if (r >= 0 && r < 8 && !g.board[r][minor.c]) { Fx.relocate(g, minor.r, minor.c, r, minor.c, {}); Fx.mod(g.board[r][minor.c], 's', 1); return ['Your ' + MD.pieceName(minor.cell.t) + ' steps forward, shielded.']; }
    Fx.mod(minor.cell, 's', 1);
    return ['No room forward — your piece is shielded in place.'];
  });

  def(448, 'Trapeze Swap', 3, 'Show', 'swap', 'Swap any two of your pieces (even pawns) — the high-flying act.', 'Grab the bar!', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    if (mine.length < 2) return [];
    const a = rnd(mine);
    const b = rnd(mine.filter(q => q !== a));
    Fx.swapSq(g, a, b);
    return ['Two of your pieces trade places on the trapeze!'];
  });

  def(449, 'Fire Eater', 2, 'Show', 'fire', 'Poison a random enemy piece and shield a random friendly pawn — hot stuff.', 'Brave. Foolish. Effective.', (g, s) => {
    const lines = [];
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('An enemy is doused in fire.'); }
    const p = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); lines.push('A pawn is fire-proofed.'); }
    return lines.length ? lines : ['The fire eater swallows nothing.'];
  });

  def(450, 'Curtain Call', 4, 'Show', 'clock', 'Every friendly piece on the board takes a bow and is shielded, and you take an extra move (no new spell on the bonus turn).', 'Thank you, thank you!', (g, s) => {
    const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    Fx.grantExtra(g, s, 1);
    return ['Curtain call! Your host is warded and you take an extra move.'];
  });

  def(451, 'Balancing Act', 1, 'Show', 'swap', 'A random friendly piece moves one step in any direction to balance the act.', 'Steady now.', (g, s) => {
    const t = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const d = rnd(spots);
    if (!d) return [];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    return ['Your ' + MD.pieceName(t.cell.t) + ' shifts to balance the act.'];
  });

  def(452, 'Snake Charmer', 2, 'Show', 'paw', 'Freeze every enemy piece adjacent to your bishop — the serpent sways.', 'They cannot look away.', (g, s) => {
    const bishops = own(g, s).filter(q => q.cell.t === 'b');
    if (!bishops.length) return Fx.freezeN(g, s, 1);
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && bishops.some(b => Math.abs(b.r - q.r) <= 1 && Math.abs(b.c - q.c) <= 1));
    const n = Fx.statusOn(g, foes, 'f', 1, 'freeze');
    return n ? ['The serpent\'s gaze freezes ' + n + ' enemy near your bishop.'] : ['No one is watching the snake.'];
  });

  def(453, 'Kabuki Drop', 2, 'Show', 'spark', 'Summon a pawn on every empty square directly in front of your most advanced pawn line (up to three).', 'The backdrop falls.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const lead = pawns[0];
    if (!lead) return [];
    const r = lead.r + fwd(s);
    if (r < 0 || r > 7) return [];
    const lines = [];
    for (const c of [lead.c - 1, lead.c, lead.c + 1]) {
      if (c >= 0 && c <= 7 && !g.board[r][c]) { Fx.place(g, s, 'p', r, c, {}); lines.push('A pawn drops in at ' + sn(r, c) + '.'); }
    }
    return lines.length ? lines : ['The backdrop finds no landing spots.'];
  });

  def(454, 'Magic Mirror', 3, 'Show', 'void', 'Reflect the enemy\'s strongest piece: if it is shielded or frozen, copy its fate onto them; otherwise swap two of their pieces.', 'What you see is what you get.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k');
    if (!foes.length) return [];
    const star = foes.sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (star.cell.b && (star.cell.b.f > 0 || star.cell.b.s > 0)) {
      if (star.cell.b.f > 0) { star.cell.b.f = 0; if (star.cell.b.s <= 0 && star.cell.b.p <= 0) star.cell.b = undefined; }
      Fx.mod(star.cell, 'p', 1); Fx.flash(g, star.r, star.c, 'poison', '');
      return ['The mirror turns their own ward against them — the star is poisoned!'];
    }
    const other = foes.filter(q => q !== star);
    const b = rnd(other);
    if (b) { Fx.swapSq(g, star, b); return ['The mirror swaps their two strongest pieces.']; }
    return ['The mirror shows only the star, unbothered.'];
  });

  def(455, 'Grand Finale', 4, 'Show', 'fire', 'Destroy every enemy piece worth at least a rook, then resurrect one of your strongest captured pieces. Applause.', 'The fireworks bring the house down.', (g, s) => {
    const gone = [];
    for (const q of en(g, s)) if (q.cell.t !== 'k' && (q.cell.t === 'q' || q.cell.t === 'r')) { Fx.removeAt(g, q.r, q.c, {}); gone.push(q); }
    const lines = gone.length ? ['The finale destroys ' + gone.length + ' major piece' + (gone.length > 1 ? 's' : '') + '!'] : ['The fireworks fizzle — no major targets.'];
    lines.push(...Fx.revive(g, s, 1));
    return lines;
  });

  def(456, 'Encore of Kings', 4, 'Show', 'spark', 'If your king is still on its starting square, upgrade your two most advanced pawns to rooks AND shield them; otherwise take an extra move.', 'The show must go on.', (g, s) => {
    const k = E.findKing(g, s);
    const home = k && k.r === Fx.backRow(g, s) && k.c === Fx.homeCol(g);
    if (home) {
      const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).slice(0, 2);
      const lines = [];
      for (const p of pawns) { p.cell.t = 'r'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A vanguard pawn becomes a Rook.'); }
      Fx.statusOn(g, pawns, 's', 1, 'shield');
      return lines.length ? lines.concat(['The royal encore is shielded.']) : ['No pawns for the encore.'];
    }
    Fx.grantExtra(g, s, 1);
    return ['The king has left the stage — you take an extra move instead.'];
  });

  MD.AB_10 = A;
})();

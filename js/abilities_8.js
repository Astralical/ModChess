/* ============================================================
   Mod Chess — Ability set 8/8: THE VOID  (IDs 307-356)
   A second new theme: stars, entropy, fate and the spaces
   between. Cards fold standard pieces into cosmic events and
   always have a graceful fallback.
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
  const ring = (g, r, c, rad) => {
    const out = [];
    for (let rr = 0; rr < Fx.bd(g); rr++) for (let cc = 0; cc < Fx.bd(g); cc++) {
      const d = Math.max(Math.abs(rr - r), Math.abs(cc - c));
      if (d === rad && g.board[rr][cc]) out.push({ r: rr, c: cc, cell: g.board[rr][cc] });
    }
    return out;
  };

  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(307, 'Starfall', 2, 'Void', 'star', 'Destroy two random enemy pawns, and one random enemy minor piece.', 'The sky sheds its dead.', (g, s) => {
    const lines = Fx.destroyN(g, s, 2, { only: 'p' });
    const minor = en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b');
    const t = rnd(minor);
    if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('A minor piece is consumed by the fall.'); }
    return lines.length ? lines : ['The sky is empty tonight.'];
  });

  def(308, 'Gravity Lens', 2, 'Void', 'void', 'Swap your queen with the enemy\'s strongest non-king piece — gravity bends the light between them.', 'What goes up must come... elsewhere.', (g, s) => {
    const q = own(g, s).find(x => x.cell.t === 'q');
    const t = en(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!q || !t) return [];
    Fx.swapSq(g, q, t);
    return ['Space warps: your queen and the enemy ' + MD.pieceName(t.cell.t) + ' trade places!'];
  });

  def(309, 'Event Horizon', 4, 'Void', 'void', 'Destroy EVERY enemy piece within two squares of your king (the singularity is here).', 'Do not approach the light.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const gone = [];
    for (let rr = 0; rr < Fx.bd(g); rr++) for (let cc = 0; cc < Fx.bd(g); cc++) {
      const cell = g.board[rr][cc];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      const d = Math.max(Math.abs(rr - k.r), Math.abs(cc - k.c));
      if (d <= 2) { Fx.removeAt(g, rr, cc, {}); gone.push(cell); }
    }
    return gone.length ? ['The event horizon swallows ' + gone.length + ' enemy piece' + (gone.length > 1 ? 's' : '') + '!'] : ['Nothing dares approach your king.'];
  });

  def(310, 'Redshift', 2, 'Void', 'star', 'Every enemy piece slides one square toward the far edge (their own side is retreating away from you).', 'The universe is expanding — away from you.', (g, s) => {
    const dir = s === 'w' ? -1 : 1;
    let moved = 0;
    for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      const nr = r + dir;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][c]) { Fx.relocate(g, r, c, nr, c, {}); moved++; }
    }
    return moved ? ['The enemy recedes as the cosmos expands.'] : ['The universe holds its ground.'];
  });

  def(311, 'Cosmic Ray', 1, 'Void', 'star', 'Destroy a random enemy piece on a random file, then burn a random file: all enemy pieces there are poisoned.', 'Radiation has no favorites.', (g, s) => {
    const file = Math.floor(Math.random() * Fx.bd(g));
    const t = rnd(en(g, s).filter(q => q.c === file && q.cell.t !== 'k'));
    const lines = [];
    if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('A ray vaporizes the ' + MD.pieceName(t.cell.t) + ' on file ' + 'abcdefghijkl'[file] + '.'); }
    const hurt = en(g, s).filter(q => q.c === file && q.cell.t !== 'k');
    const n = Fx.statusOn(g, hurt, 'p', 1, 'poison');
    if (n) lines.push('Radiation lingers on the file.');
    return lines.length ? lines : ['The ray hits nothing.'];
  });

  def(312, 'Entropy', 3, 'Void', 'void', 'Downgrade three random enemy pieces one tier each.', 'All order decays.', (g, s) => {
    const foes = Fx.uniqN(en(g, s).filter(q => q.cell.t !== 'k'), 3);
    if (!foes.length) return [];
    return Fx.downgradeSq(g, foes);
  });

  def(313, 'Nebula', 2, 'Void', 'void', 'Freeze every enemy piece on the d and e files — a cloud of cosmic dust slows the center.', 'The middle of the board forgets how to move.', (g, s) => {
    const targets = en(g, s).filter(q => q.c === 3 || q.c === 4);
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['A nebula congeals over the center files.'] : ['The center is clear of enemies.'];
  });

  def(314, 'Supernova', 3, 'Void', 'star', 'Destroy a random enemy piece and everything adjacent to it, then a pawn is born in its place.', 'A star dies; a seed is planted.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    Fx.removeAt(g, t.r, t.c, {});
    let gone = 1;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && g.board[r][c] && g.board[r][c].c === O(s) && g.board[r][c].t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
    }
    if (!g.board[t.r][t.c]) Fx.place(g, s, 'p', t.r, t.c, {});
    return ['The nova claims ' + gone + ' enemy piece' + (gone > 1 ? 's' : '') + ', and new life sparks in the ashes.'];
  });

  def(315, 'White Dwarf', 1, 'Void', 'star', 'Shield two random friendly pieces — the last light of a dead star protects them.', 'Cold light, warm shelter.', (g, s) => {
    const n = Fx.shieldN(g, s, 2);
    return n ? ['Faint starlight wards your pieces.'] : [];
  });

  def(316, 'Orbit', 2, 'Void', 'void', 'Rotate the four friendly pieces nearest to your king around it one step clockwise.', 'They swing around their sun.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && g.board[r][c] && g.board[r][c].c === s) near.push({ r, c });
    }
    if (near.length < 2) return [];
    const ord = near.slice(0, 4);
    const cells = ord.map(q => g.board[q.r][q.c]);
    const back = ord.map(q => ({ r: k.r + (q.c - k.c), c: k.c - (q.r - k.r) }));
    for (let i = 0; i < ord.length; i++) { g.board[ord[i].r][ord[i].c] = null; }
    let placed = 0;
    for (let i = 0; i < ord.length; i++) {
      const t = back[i];
      if (t.r >= 0 && t.r < Fx.bd(g) && t.c >= 0 && t.c < Fx.bd(g) && !g.board[t.r][t.c]) { g.board[t.r][t.c] = cells[i]; Fx.flash(g, t.r, t.c, 'move', ''); placed++; }
      else { g.board[ord[i].r][ord[i].c] = cells[i]; }
    }
    Fx.clearEp(g);
    return placed ? ['Your pieces wheel around the king.'] : ['The orbit is blocked.'];
  });

  def(317, 'Dark Matter', 3, 'Void', 'void', 'Every enemy piece on the edge of the board is drawn inward one square (they cannot hide on the rim).', 'The rim of the universe is hungry.', (g, s) => {
    const n = g.n || 8;
    let moved = 0;
    const edges = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if ((r === 0 || r === n - 1 || c === 0 || c === n - 1) && g.board[r][c] && g.board[r][c].c === O(s) && g.board[r][c].t !== 'k') edges.push({ r, c });
    for (const q of edges) {
      const nr = Math.max(1, Math.min(n - 2, q.r)), nc = Math.max(1, Math.min(n - 2, q.c));
      if (!g.board[nr][nc]) { Fx.relocate(g, q.r, q.c, nr, nc, {}); moved++; }
    }
    return moved ? ['Dark matter drags the rim pieces inward.'] : ['No enemy hides on the edge.'];
  });

  def(318, 'Quantum Leap', 2, 'Void', 'void', 'Teleport your strongest piece to a random empty square, then it attacks: destroy the enemy adjacent to its landing spot with the highest value.', 'It was here. Now it is there.', (g, s) => {
    const t = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!t) return [];
    const d = Fx.rand(Fx.emptySq(g));
    if (!d) return [];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    const near = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - d.r) <= 1 && Math.abs(q.c - d.c) <= 1).sort((a, b) => val(b.cell.t) - val(a.cell.t));
    const v = near[0];
    if (v) { Fx.removeAt(g, v.r, v.c, {}); return ['Your piece blinks to ' + sn(d.r, d.c) + ' and crushes the ' + MD.pieceName(v.cell.t) + ' beside it!']; }
    return ['Your piece blinks to ' + sn(d.r, d.c) + '.'];
  });

  def(319, 'Chronoshift', 3, 'Void', 'clock', 'Undo one enemy move: move their last-moved piece back to where it stood.', 'Time rewinds, but only for them.', (g, s) => {
    const hist = g.hist;
    for (let i = hist.length - 1; i >= 0; i--) {
      const h = hist[i];
      if (h.color === O(s) && g.board[h.to.r] && g.board[h.to.r][h.to.c] && g.board[h.to.r][h.to.c].c === O(s) && !g.board[h.from.r][h.from.c]) {
        Fx.relocate(g, h.to.r, h.to.c, h.from.r, h.from.c, {});
        return ['The enemy\'s last move is rewound to ' + sn(h.from.r, h.from.c) + '.'];
      }
    }
    return ['The timeline offers nothing to rewind.'];
  });

  def(320, 'Doppleganger', 2, 'Void', 'void', 'Copy the enemy\'s strongest piece: summon a pawn that becomes a mirror copy of it (same type) for you.', 'Two of everything.', (g, s) => {
    const t = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!t) return [];
    const spot = rnd(Fx.emptySq(g, (r, c) => s === 'w' ? r >= Fx.half(g) - 1 : r <= Fx.half(g)));
    if (!spot) return [];
    Fx.place(g, s, t.cell.t, spot.r, spot.c, {});
    return ['A mirror of the enemy ' + MD.pieceName(t.cell.t) + ' appears at ' + sn(spot.r, spot.c) + '!'];
  });

  def(321, 'Solar Flare', 2, 'Void', 'star', 'Destroy the enemy piece on the same file as your king, and freeze the one on the same rank.', 'The sun lashes out.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const lines = [];
    const fileFoe = en(g, s).filter(q => q.c === k.c && q.cell.t !== 'k' && q.r !== k.r).sort((a, b) => Math.abs(b.r - k.r) - Math.abs(a.r - k.r))[0];
    if (fileFoe) { Fx.removeAt(g, fileFoe.r, fileFoe.c, {}); lines.push('A flare vaporizes the ' + MD.pieceName(fileFoe.cell.t) + ' on your file.'); }
    const rankFoe = en(g, s).filter(q => q.r === k.r && q.cell.t !== 'k' && q.c !== k.c);
    const n = Fx.statusOn(g, rankFoe, 'f', 1, 'freeze');
    if (n) lines.push('The rank beside the king is scorched frozen.');
    return lines.length ? lines : ['The sun finds nothing to strike.'];
  });

  def(322, 'Vacuum', 1, 'Void', 'void', 'Poison two random enemy pieces — in the void there is no air to scream.', 'Silence, then nothing.', (g, s) => {
    const n = Fx.poisonN(g, s, 2);
    return n ? ['Two enemies are exposed to the void.'] : [];
  });

  def(323, 'Twin Suns', 3, 'Void', 'star', 'Summon two friendly bishops AND two friendly rooks on empty squares — a second army of light.', 'When one sun sets, another rises.', (g, s) => {
    const lines = Fx.summonN(g, s, 'b', 2);
    lines.push(...Fx.summonN(g, s, 'r', 2));
    return lines.length ? lines : ['No room for twin suns.'];
  });

  def(324, 'Graviton', 1, 'Void', 'void', 'Pull the enemy piece nearest your king one square closer to it.', 'Gravity is a leash.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let best = null, bd = 99;
    for (const q of en(g, s)) if (q.cell.t !== 'k') { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; best = q; } }
    if (!best) return [];
    const dr = Math.sign(k.r - best.r), dc = Math.sign(k.c - best.c);
    const r = best.r + dr, c = best.c + dc;
    if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) { Fx.relocate(g, best.r, best.c, r, c, {}); return ['The enemy ' + MD.pieceName(best.cell.t) + ' is dragged closer.']; }
    return ['The graviton cannot find purchase.'];
  });

  def(325, 'Pulsar', 1, 'Void', 'star', 'Freeze the enemy piece that is on the same diagonal as your queen.', 'The pulse travels the light-lines.', (g, s) => {
    const q = own(g, s).find(x => x.cell.t === 'q');
    if (!q) return [];
    const foes = en(g, s).filter(x => x.cell.t !== 'k' && Math.abs(x.r - q.r) === Math.abs(x.c - q.c));
    const t = rnd(foes);
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['A pulse down the diagonal freezes the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(326, 'Meteor Moth', 2, 'Void', 'star', 'A random enemy piece is lifted and dropped on a random empty square; anything it lands next to is destroyed.', 'Moths chase the flame. This one is the flame.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const dest = Fx.rand(Fx.emptySq(g));
    if (!dest) return [];
    Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
    let gone = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = dest.r + dr, c = dest.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && g.board[r][c] && g.board[r][c].c === O(s) && g.board[r][c] !== t && g.board[r][c].t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
    }
    return ['The ' + MD.pieceName(t.cell.t) + ' crash-lands at ' + sn(dest.r, dest.c) + (gone ? ', crushing ' + gone + ' allies!' : '.')];
  });

  def(327, 'Star Chart', 2, 'Void', 'star', 'Your two most advanced pieces gain the ability to leap anywhere: teleport both to random empty squares.', 'The chart shows every path.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    let moved = 0;
    for (const t of mine) {
      const d = Fx.rand(Fx.emptySq(g));
      if (d) { Fx.relocate(g, t.r, t.c, d.r, d.c, {}); moved++; }
    }
    return moved ? ['Your vanguard follows the star chart to new squares.'] : ['No empty space on the chart.'];
  });

  def(328, 'Antimatter', 3, 'Void', 'void', 'Annihilate: destroy the enemy piece with the HIGHEST value on your side of the board, and the friendly piece nearest to it vanishes too.', 'Matter and antimatter touch.', (g, s) => {
    const t = en(g, s).filter(q => q.cell.t !== 'k' && (s === 'w' ? q.r >= 4 : q.r <= 3)).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!t) return ['No enemy has breached your lines.'];
    Fx.removeAt(g, t.r, t.c, {});
    const friend = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (Math.abs(a.r - t.r) + Math.abs(a.c - t.c)) - (Math.abs(b.r - t.r) + Math.abs(b.c - t.c)))[0];
    const lines = ['Antimatter consumes the enemy ' + MD.pieceName(t.cell.t) + '!'];
    if (friend) { Fx.removeAt(g, friend.r, friend.c, {}); lines.push('The blast takes your own ' + MD.pieceName(friend.cell.t) + ' as well.'); }
    return lines;
  });

  def(329, 'Eclipse', 2, 'Void', 'star', 'Freeze the enemy king for a turn — darkness falls on the throne.', 'The sun hides its face.', (g, s) => {
    const k = E.findKing(g, O(s));
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 'f', 1); Fx.flash(g, k.r, k.c, 'freeze', '');
    return ['An eclipse freezes the enemy king in shadow.'];
  });

  def(330, 'The Long Night', 3, 'Void', 'void', 'Every enemy piece that is not a pawn is frozen for a turn; pawns alone remember the light.', 'The night forgets the lords and ladies.', (g, s) => {
    const targets = en(g, s).filter(q => q.cell.t !== 'p' && q.cell.t !== 'k');
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['The long night stills ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '.'] : ['The night finds only pawns.'];
  });

  def(331, 'Comet', 2, 'Void', 'star', 'Your most advanced pawn streaks across the board to a random empty square in the enemy\'s back half.', 'Borrowed fire, stolen speed.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return [];
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const d = rnd(Fx.emptySq(g, (r, c) => rows.includes(r)));
    if (!d) return ['The comet finds no landing field.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    return ['Your pawn burns across the sky to ' + sn(d.r, d.c) + '!'];
  });

  def(332, 'Solar Wind', 1, 'Void', 'star', 'Push every enemy pawn one square forward (toward you) — the wind blows them into your trap.', 'The gale herds them in.', (g, s) => {
    const dir = s === 'w' ? 1 : -1;
    let moved = 0;
    for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t !== 'p') continue;
      const nr = r + dir;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][c]) { Fx.relocate(g, r, c, nr, c, {}); moved++; }
    }
    return moved ? ['The solar wind drives enemy pawns forward.'] : ['The wind pushes against a wall.'];
  });

  def(333, 'Wormhole', 4, 'Void', 'void', 'Swap your strongest piece with your weakest piece, then teleport both to random empty squares.', 'The fabric of the board is torn.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    const strong = mine.slice().sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    const weak = mine.slice().sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
    if (!strong || !weak || strong === weak) return [];
    Fx.swapSq(g, strong, weak);
    const d1 = Fx.rand(Fx.emptySq(g)), d2 = Fx.rand(Fx.emptySq(g));
    const lines = [];
    if (d1) { Fx.relocate(g, weak.r, weak.c, d1.r, d1.c, {}); lines.push('One piece is spat out at ' + sn(d1.r, d1.c) + '.'); }
    if (d2) { Fx.relocate(g, strong.r, strong.c, d2.r, d2.c, {}); lines.push('The other arrives at ' + sn(d2.r, d2.c) + '.'); }
    return lines.length ? lines : ['The wormhole collapses.'];
  });

  def(334, 'Cryostasis', 2, 'Void', 'drop', 'Freeze the enemy\'s two most advanced pieces — deep freeze stops the advance.', 'Cold enough to stop time itself.', (g, s) => {
    const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).slice(0, 2);
    const n = Fx.statusOn(g, pool, 'f', 1, 'freeze');
    return n ? ['The vanguard is sealed in cryostasis.'] : [];
  });

  def(335, 'Dark Star', 3, 'Void', 'star', 'Destroy a random enemy piece; if it was a major piece (rook or queen), also summon a pawn on its square.', 'The dark star devours and leaves a seed.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const major = t.cell.t === 'r' || t.cell.t === 'q';
    const name = t.cell.t;
    Fx.removeAt(g, t.r, t.c, {});
    if (major) Fx.place(g, s, 'p', t.r, t.c, {});
    return ['The dark star swallows the ' + MD.pieceName(name) + (major ? ' and leaves a new pawn in its place.' : '.')];
  });

  def(336, 'Focal Point', 1, 'Void', 'star', 'Destroy the enemy piece nearest to your queen.', 'Every light bends toward her.', (g, s) => {
    const q = own(g, s).find(x => x.cell.t === 'q');
    const foes = en(g, s).filter(x => x.cell.t !== 'k');
    if (!q || !foes.length) return [];
    const t = foes.slice().sort((a, b) => (Math.abs(a.r - q.r) + Math.abs(a.c - q.c)) - (Math.abs(b.r - q.r) + Math.abs(b.c - q.c)))[0];
    Fx.removeAt(g, t.r, t.c, {});
    return ['Light converges and the ' + MD.pieceName(t.cell.t) + ' is undone.'];
  });

  def(337, 'Void Shift', 2, 'Void', 'void', 'Teleport a random enemy piece to a random EMPTY square far from the action (any corner of the board).', 'Away. Just... away.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const d = Fx.rand(Fx.emptySq(g));
    if (!d) return [];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    return ['The ' + MD.pieceName(t.cell.t) + ' is displaced to ' + sn(d.r, d.c) + '.'];
  });

  def(338, 'Reflection', 1, 'Void', 'star', 'If the enemy is shielded or frozen anywhere, reflect it: freeze one random enemy frozen piece... or shield your strongest if none.', 'The mirror never forgives.', (g, s) => {
    const cursed = en(g, s).filter(q => q.cell.b && (q.cell.b.f > 0 || q.cell.b.s > 0 || q.cell.b.p > 0));
    if (cursed.length) {
      const t = rnd(cursed);
      Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
      return ['Their own magic reflects — the enemy ' + MD.pieceName(t.cell.t) + ' is frozen!'];
    }
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (mine) { Fx.mod(mine.cell, 's', 1); Fx.flash(g, mine.r, mine.c, 'shield', ''); return ['The mirror finds nothing to return; it shields your champion instead.']; }
    return [];
  });

  def(339, 'Light Echo', 2, 'Void', 'star', 'All your rooks fire a light beam down their rank: destroy the first enemy piece each rook sees.', 'The light arrives after the army has moved.', (g, s) => {
    const rooks = own(g, s).filter(q => q.cell.t === 'r');
    const lines = [];
    for (const rook of rooks) {
      for (const [dr, dc] of [[0, 1], [0, -1]]) {
        let r = rook.r + dr, c = rook.c + dc;
        while (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g)) {
          if (g.board[r][c]) { if (g.board[r][c].c === O(s) && g.board[r][c].t !== 'k') { Fx.removeAt(g, r, c, {}); lines.push('A rook beam strikes ' + sn(r, c) + '.'); } break; }
          r += dr; c += dc;
        }
      }
    }
    return lines.length ? lines : ['The beams find no targets.'];
  });

  def(340, 'Entropy Well', 3, 'Void', 'void', 'All enemy status effects (freeze/poison/shield) are REMOVED and instead applied randomly to your side? No — reverse: your frozen and poisoned pieces are healed, and their curses jump to random enemies.', 'Misfortune is conserved.', (g, s) => {
    const cursedOwn = own(g, s).filter(q => q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0));
    let healed = 0;
    const targets = [];
    for (const q of cursedOwn) { targets.push(q); if (q.cell.b.f > 0) q.cell.b.f = 0; if (q.cell.b.p > 0) q.cell.b.p = 0; if (q.cell.b.s <= 0) q.cell.b = undefined; healed++; }
    const n = Fx.statusOn(g, Fx.uniqN(en(g, s), Math.min(healed, 3)), 'f', 1, 'freeze');
    return healed ? ['The well reverses ' + healed + ' curse' + (healed > 1 ? 's' : '') + ' onto your enemies!'] : ['No curses to recycle.'];
  });

  def(341, 'Nova Knight', 2, 'Void', 'star', 'Upgrade a random friendly knight into a queen that radiates: every enemy adjacent to it is frozen.', 'A star in the shape of a horse.', (g, s) => {
    const ns = own(g, s).filter(q => q.cell.t === 'n');
    const t = rnd(ns);
    if (!t) return [];
    t.cell.t = 'q'; Fx.flash(g, t.r, t.c, 'transform', '');
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    Fx.statusOn(g, foes, 'f', 1, 'freeze');
    return ['A nova-knight ignites into a queen and freezes the pieces around it!'];
  });

  def(342, 'Ion Storm', 1, 'Void', 'storm', 'Freeze a random enemy rook or queen, and downgrade a random enemy bishop.', 'The storm scrambles the heavy pieces.', (g, s) => {
    const major = rnd(en(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q'));
    const lines = [];
    if (major) { Fx.mod(major.cell, 'f', 1); Fx.flash(g, major.r, major.c, 'freeze', ''); lines.push('A heavy piece is scrambled.'); }
    const bp = rnd(en(g, s).filter(q => q.cell.t === 'b'));
    if (bp) { lines.push(...Fx.downgradeSq(g, [bp])); }
    return lines.length ? lines : ['The storm rolls past harmlessly.'];
  });

  def(343, 'Second Sun', 3, 'Void', 'star', 'Shield ALL of your pieces AND freeze all enemy pawns.', 'Two suns: one to guard, one to blind.', (g, s) => {
    const lines = [];
    const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    if (n) lines.push('Your host is bathed in light.');
    const p = Fx.statusOn(g, en(g, s).filter(q => q.cell.t === 'p'), 'f', 1, 'freeze');
    if (p) lines.push('The enemy pawns are dazzled blind.');
    return lines.length ? lines : ['The second sun rises on an empty field.'];
  });

  def(344, 'Black Ice', 2, 'Void', 'drop', 'Freeze every enemy piece on the two most crowded enemy files.', 'It is black, it is cold, it is everywhere they stand.', (g, s) => {
    const counts = Array.from({ length: Fx.bd(g) }, () => 0);
    for (const q of en(g, s)) counts[q.c]++;
    const files = Array.from({ length: Fx.bd(g) }, (_, i) => i).sort((a, b) => counts[b] - counts[a]).slice(0, 2);
    const targets = en(g, s).filter(q => files.includes(q.c));
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['Black ice forms where the enemy clusters.'] : [];
  });

  def(345, 'Singularity', 4, 'Void', 'void', 'Pull every piece (both sides) one square toward the center square d4/e5, then destroy any piece that cannot move.', 'All roads lead to the center.', (g, s) => {
    let moved = 0, crushed = 0;
    for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
      const cell = g.board[r][c];
      if (!cell || cell.t === 'k') continue;
      const dr = Math.sign(3.5 - r), dc = Math.sign(3.5 - c);
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < Fx.bd(g) && nc >= 0 && nc < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, r, c, nr, nc, {}); moved++; }
    }
    // after the pull, destroy pieces sitting on the central four squares that are now overloaded
    for (const [r, c] of [[3, 3], [3, 4], [4, 3], [4, 4]]) {
      const cell = g.board[r] && g.board[r][c];
      if (cell && cell.t !== 'k') { Fx.removeAt(g, r, c, {}); crushed++; }
    }
    const lines = [];
    if (moved) lines.push(moved + ' piece' + (moved > 1 ? 's' : '') + ' drawn toward the center.');
    if (crushed) lines.push('The singularity devours ' + crushed + ' overloaded piece' + (crushed > 1 ? 's' : '') + '!');
    return lines.length ? lines : ['The center is already silent.'];
  });

  def(346, 'Cold Quasar', 1, 'Void', 'star', 'Freeze a random enemy piece and poison a random enemy pawn.', 'Bright, cold, and slow to forgive.', (g, s) => {
    const lines = [];
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('A piece is frozen by the quasar.'); }
    const p = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.mod(p.cell, 'p', 1); Fx.flash(g, p.r, p.c, 'poison', ''); lines.push('A pawn is poisoned by its light.'); }
    return lines.length ? lines : ['The quasar spins silently.'];
  });

  def(347, 'Twin Worlds', 2, 'Void', 'void', 'Duplicate your king\'s protection: shield the king and summon a pawn beside it (a decoy world).', 'For every throne, a decoy.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', '');
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
    }
    const sp = rnd(spots);
    if (sp) Fx.place(g, s, 'p', sp.r, sp.c, {});
    return ['Your king is warded' + (sp ? ' and a decoy pawn stands at ' + sn(sp.r, sp.c) : '') + '.'];
  });

  def(348, 'Star Thief', 3, 'Void', 'star', 'Steal the enemy\'s queen — but only if she is UNDEFENDED (no friendly piece protects her). Otherwise steal their highest undefended piece.', 'Some stars are unguarded.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
    const undef = foes.filter(q => !E.attacked(g, q.r, q.c, q.cell.c));
    const t = undef[0] || null;
    if (!t) return ['Every star is guarded tonight.'];
    t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
    return ['You pluck the unguarded ' + MD.pieceName(t.cell.t) + ' from the sky!'];
  });

  def(349, 'Nebula of Doubt', 1, 'Void', 'void', 'Downgrade a random enemy minor piece and freeze another random enemy piece.', 'Doubt freezes; decay follows.', (g, s) => {
    const lines = [];
    const m = rnd(en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (m) lines.push(...Fx.downgradeSq(g, [m]));
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t && !(m && m.r === t.r && m.c === t.c)) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('A piece is lost in doubt.'); }
    return lines.length ? lines : ['The nebula drifts by.'];
  });

  def(350, 'Gravity of Kings', 2, 'Void', 'void', 'Every enemy piece adjacent to your king is pulled one square further away.', 'The throne repels all.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let moved = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      const cell = g.board[r] && g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < Fx.bd(g) && nc >= 0 && nc < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, r, c, nr, nc, {}); moved++; }
    }
    return moved ? ['The enemy crowding your king is shoved back.'] : ['No one dares crowd the throne.'];
  });

  def(351, 'Prism', 2, 'Void', 'star', 'Split a random enemy queen into three pawns: destroy her and summon three pawns on your side.', 'Break the light, lose the power.', (g, s) => {
    const q = en(g, s).filter(x => x.cell.t === 'q');
    const t = rnd(q);
    if (!t) return ['The enemy has no queen to refract.'];
    Fx.removeAt(g, t.r, t.c, {});
    const rows = s === 'w' ? [3, 4, 5] : [2, 3, 4];
    const lines = ['The enemy queen is split through a prism!'];
    lines.push(...Fx.summonN(g, s, 'p', 3, { rows }));
    return lines;
  });

  def(352, 'Solar Cradle', 1, 'Void', 'star', 'Your most advanced pawn is shielded and pushed one square forward.', 'Warm enough to grow.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return [];
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    const r = p.r + fwd(s);
    if (r >= 0 && r < Fx.bd(g) && !g.board[r][p.c]) Fx.relocate(g, p.r, p.c, r, p.c, {});
    return ['The cradle sun shields and urges your vanguard onward.'];
  });

  def(353, 'Cosmic Dust', 1, 'Void', 'star', 'Freeze two random enemy pieces and downgrade your own most advanced pawn? No — downgrade a random enemy PAWN to nothing is too cruel: freeze two and shield one of your pawns.', 'Dust settles on the frozen.', (g, s) => {
    const lines = [];
    const n = Fx.statusOn(g, Fx.uniqN(en(g, s).filter(q => q.cell.t !== 'k'), 2), 'f', 1, 'freeze');
    if (n) lines.push('Cosmic dust settles on ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '.');
    const p = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); lines.push('A pawn is sheltered from the dust.'); }
    return lines.length ? lines : [];
  });

  def(354, 'Event Twister', 2, 'Void', 'void', 'Swap the positions of every pair: your king swaps with your queen, then your two rooks swap.', 'Reality is re-shuffled.', (g, s) => {
    const k = E.findKing(g, s), q = own(g, s).find(x => x.cell.t === 'q');
    const lines = [];
    if (k && q) { Fx.swapSq(g, k, q); lines.push('The king and queen trade places.'); }
    const rooks = own(g, s).filter(x => x.cell.t === 'r');
    if (rooks.length >= 2) { Fx.swapSq(g, rooks[0], rooks[1]); lines.push('The towers mirror each other.'); }
    return lines.length ? lines : ['Reality holds firm.'];
  });

  def(355, 'Quasar Flare', 2, 'Void', 'star', 'Destroy a random enemy minor piece and freeze a random enemy major piece.', 'Small lights die; large lights freeze.', (g, s) => {
    const lines = [];
    const m = rnd(en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (m) { Fx.removeAt(g, m.r, m.c, {}); lines.push('A minor piece is vaporized.'); }
    const M = rnd(en(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q'));
    if (M) { Fx.mod(M.cell, 'f', 1); Fx.flash(g, M.r, M.c, 'freeze', ''); lines.push('A major piece is frozen by the flare.'); }
    return lines.length ? lines : ['The quasar flares into empty space.'];
  });

  def(356, 'Heat Death', 4, 'Void', 'void', 'The universe winds down: freeze every enemy piece, but do NOT touch their king — and grant yourself an extra move as the last gasp of order.', 'Even the last star will tire.', (g, s) => {
    const targets = en(g, s).filter(q => q.cell.t !== 'k');
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    Fx.grantExtra(g, s, 1);
    return n ? ['Heat death stills ' + n + ' enemy piece' + (n > 1 ? 's' : '') + ' — and entropy grants you one last move!'] : ['The universe is already still.'];
  });

  // — THE VOID'S OWN CREATURES —
  def(783, 'Void Drift', 1, 'Void', 'void', 'Summon a Voidwisp — a small tear in space that splits when destroyed.', 'It was never quite here.', (g, s) => {
    const lines = Fx.summonN(g, s, 'voidwisp', 1, { rows: Fx.ownHalfRows(g, s) });
    return lines.length ? lines : ['The void refuses to open here.'];
  });
  def(784, 'Dark Star Hatch', 3, 'Void', 'star', 'Summon a Starspawn from a dying sun — it regenerates poison and frost.', 'Born in the last light of a dead star.', (g, s) => {
    const lines = Fx.summonN(g, s, 'starspawn', 1, { rows: Fx.ownHalfRows(g, s) });
    return lines.length ? lines : ['The star will not be reborn here.'];
  });

  MD.AB_8 = A;
})();

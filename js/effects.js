/* ============================================================
   Mod Chess — ability effect toolkit (Fx)
   Mutations go through setAt/removeAt/relocate so engine
   invariants (castling rights, en passant) are preserved.
   Every public Fx.* returns line text or an array of lines.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine;
  const opp = c => (c === 'w' ? 'b' : 'w');

  const Fx = {};

  /* ---------- square listing ---------- */
  const allSq = () => { const a = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) a.push({ r, c }); return a; };
  const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  Fx.squares = (g, pred) => {
    const out = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && pred(cell, r, c)) out.push({ r, c, cell });
    }
    return out;
  };
  Fx.color = (g, color) => Fx.squares(g, cell => cell.c === color);
  Fx.enemy = (g, side) => Fx.color(g, opp(side));
  Fx.own = (g, side) => Fx.color(g, side);
  Fx.emptySq = (g, pred) => {
    const out = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (g.board[r][c]) continue;
      if (E.isTerrain && E.isTerrain(g, r, c)) continue;
      if (!pred || pred(r, c)) out.push({ r, c, cell: null });
    }
    return out;
  };
  Fx.rand = arr => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
  Fx.uniqN = (arr, n) => {
    const a = arr.slice();
    const out = [];
    while (out.length < n && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    return out;
  };
  Fx.value = t => E.val(t);

  /* ---------- low-level board mutations ---------- */
  function flash(g, r, c, kind, text) {
    g.fxevents = g.fxevents || [];
    g.fxevents.push({ r, c, kind: kind || 'fx', text: text || '' });
  }
  Fx.flash = flash;

  function note(g, side, text) {
    g.fxevents = g.fxevents || [];
    g.fxevents.push({ kind: 'note', text });
    return text;
  }
  Fx.note = note;

  function setAt(g, r, c, cell, opts) {
    opts = opts || {};
    if (!onBoard(r, c)) return null;
    const prev = g.board[r][c];
    if (prev) E.revokeLeave(g, r, c, prev);
    g.board[r][c] = cell;
    g.ep = null;
    if (!opts.noFlash) flash(g, r, c, opts.kind || 'set', opts.text || '');
    return prev;
  }
  Fx.setAt = setAt;

  function removeAt(g, r, c, opts) {
    opts = opts || {};
    if (!onBoard(r, c)) return null;
    const cell = g.board[r][c];
    if (!cell) return null;
    E.revokeLeave(g, r, c, cell);
    g.board[r][c] = null;
    g.ep = null;
    flash(g, r, c, opts.kind || 'destroy', opts.text || '');
    if (E.deathRattle) E.deathRattle(g, r, c, cell); // dying troops can leave a mark
    return cell;
  }
  Fx.removeAt = removeAt;

  // move a cell from->to, capturing whatever sits on `to` if it is enemy (returns captured)
  function relocate(g, r0, c0, r1, c1, opts) {
    opts = opts || {};
    const cell = g.board[r0] && g.board[r0][c0];
    if (!cell) return { moved: false, captured: null };
    if (E.isTerrain && E.isTerrain(g, r1, c1)) return { moved: false, captured: null, blocked: true };
    const dest = g.board[r1] && g.board[r1][c1];
    let captured = null;
    if (dest) {
      if (!opts.allowOwn && dest.c === cell.c) return { moved: false, captured: null, ownBlocked: true };
      captured = removeAt(g, r1, c1, { kind: 'destroy', noFlash: false, text: opts.capText });
    }
    E.revokeLeave(g, r0, c0, cell);
    g.board[r0][c0] = null;
    g.board[r1][c1] = cell;
    g.ep = null;
    flash(g, r1, c1, opts.kind || 'move', opts.text || '');
    return { moved: true, captured, from: { r: r0, c: c0 }, to: { r: r1, c: c1 } };
  }
  Fx.relocate = relocate;

  function place(g, color, type, r, c, opts) {
    opts = opts || {};
    if (!onBoard(r, c)) return null;
    if (E.isTerrain && E.isTerrain(g, r, c)) return null; // cannot summon onto walls/rivers
    if (g.board[r][c]) { if (opts.overwrite) removeAt(g, r, c); else return null; }
    // adults with `hatch` arrive as their weak egg; eggs grow back into the adult
    const plan = E.spawnPlan ? E.spawnPlan(type) : { type, growTo: null, mature: 0 };
    const cell = { c: color, t: plan.type };
    if (E.isTroop(plan.type)) g.anyTroop = true;
    if (!opts.noStatus) {
      const st = { f: 0, s: 0, p: 0 };
      // summoning sickness: a fresh piece can't act until it survives its owner's turn
      if (!opts.noRecruit) st.z = E.recruitDelay ? E.recruitDelay(plan.type) : 1;
      if (plan.growTo && plan.mature > 0) { st.mature = plan.mature; cell.b = st; cell.b.growTo = plan.growTo; }
      else if (st.z > 0 || st.s > 0 || st.p > 0) cell.b = st;
    }
    g.board[r][c] = cell;
    g.ep = null;
    flash(g, r, c, 'summon', opts.text || '');
    return cell;
  }
  Fx.place = place;

  // status helpers
  function mod(cell, k, v) {
    if (!cell.b) cell.b = { f: 0, s: 0, p: 0 };
    cell.b[k] = v;
    return cell;
  }
  Fx.mod = mod;
  function statusOn(g, sqList, k, v, kind) {
    let n = 0;
    for (const q of sqList) {
      const cell = g.board[q.r] && g.board[q.r][q.c];
      if (!cell) continue;
      mod(cell, k, v); n++;
      flash(g, q.r, q.c, kind, '');
    }
    return n;
  }
  Fx.statusOn = statusOn;

  /* ---------- targeting helpers ---------- */
  function targetList(g, side, mode) {
    const en = Fx.enemy(g, side), own = Fx.own(g, side);
    switch (mode) {
      case 'enemyAny': return en;
      case 'enemyNonKing': return en.filter(q => q.cell.t !== 'k');
      case 'ownAny': return own;
      case 'anyPiece': return en.concat(own);
      case 'enemyPawn': return en.filter(q => q.cell.t === 'p');
      case 'ownPawn': return own.filter(q => q.cell.t === 'p');
      case 'enemyMinor': return en.filter(q => q.cell.t === 'n' || q.cell.t === 'b');
      case 'ownMinor': return own.filter(q => q.cell.t === 'n' || q.cell.t === 'b');
      case 'enemyMajor': return en.filter(q => q.cell.t === 'r' || q.cell.t === 'q');
      case 'ownMajor': return own.filter(q => q.cell.t === 'r' || q.cell.t === 'q');
      case 'enemyKnight': return en.filter(q => q.cell.t === 'n');
      case 'ownKnight': return own.filter(q => q.cell.t === 'n');
      case 'enemyBishop': return en.filter(q => q.cell.t === 'b');
      case 'ownBishop': return own.filter(q => q.cell.t === 'b');
      case 'enemyRook': return en.filter(q => q.cell.t === 'r');
      case 'ownRook': return own.filter(q => q.cell.t === 'r');
      case 'enemyQueen': return en.filter(q => q.cell.t === 'q');
      case 'ownQueen': return own.filter(q => q.cell.t === 'q');
      case 'emptyAny': return Fx.emptySq(g);
      default: return [];
    }
  }
  Fx.targetList = targetList;

  // heuristic auto-pick for bots & defaults
  function autoTarget(g, side, mode) {
    const list = targetList(g, side, mode);
    if (!list.length) return null;
    if (mode === 'emptyAny') return Fx.rand(list);
    // bias toward enemy high value, own high value, or random
    if (mode.startsWith('enemy') || mode.startsWith('own')) {
      const sorted = list.slice().sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
      const top = sorted[0];
      const next = sorted[1];
      if (top && next && Math.random() < 0.55) return top;
      return Fx.rand(list);
    }
    return Fx.rand(list);
  }
  Fx.autoTarget = autoTarget;

  /* ---------- generic composite powers (return line arrays) ---------- */
  const L = lines => (Array.isArray(lines) ? lines : [lines]);

  // Destroy enemy pieces matching predicate (fn(cell,r,c)->bool). Never king unless allowKing.
  Fx.destroyAll = (g, side, pred, opts) => {
    opts = opts || {};
    const targets = Fx.enemy(g, side).filter(q => pred(q.cell, q.r, q.c) && (opts.allowKing || q.cell.t !== 'k'));
    const lines = [];
    for (const q of targets) {
      removeAt(g, q.r, q.c, { text: opts.text });
      lines.push(opts.text || 'destroyed');
    }
    return lines;
  };

  // Destroy up to n enemy pieces with preference 'high'|'low'|'pawn'|null
  Fx.destroyN = (g, side, n, opts) => {
    opts = opts || {};
    let pool = Fx.enemy(g, side).filter(q => (opts.allowKing || opts.only === 'k') || q.cell.t !== 'k');
    if (opts.only) pool = pool.filter(q => q.cell.t === opts.only);
    if (opts.minVal) pool = pool.filter(q => Fx.value(q.cell.t) >= opts.minVal);
    if (opts.prefer === 'high') pool.sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
    if (opts.prefer === 'low') pool.sort((a, b) => Fx.value(a.cell.t) - Fx.value(b.cell.t));
    let picks;
    if (opts.prefer) picks = pool.slice(0, Math.min(n, pool.length));
    else picks = Fx.uniqN(pool, Math.min(n, pool.length));
    const lines = [];
    for (const q of picks) {
      removeAt(g, q.r, q.c, {});
      lines.push('Destroyed ' + sideName(opp(side)) + ' ' + pname(q.cell.t) + ' on ' + E.sqName(q.r, q.c) + '.');
    }
    return lines;
  };

  function sideName(c) { return c === 'w' ? 'White' : 'Black'; }
  Fx.sideName = sideName;
  const PIECE_LABEL = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const pname = t => { const tr = (root.MD && root.MD.TROOPS && root.MD.TROOPS[t]); return tr ? tr.name : (PIECE_LABEL[t] || t); };
  const art = n => (/^[aeiou]/i.test(String(n || '')) ? 'an' : 'a');
  Fx.pname = pname;
  Fx.pieceName = t => pname(t) || t;

  // transform (retarget) a set of squares to a new type
  Fx.transformSq = (g, sqList, toType, linesFn) => {
    const lines = [];
    for (const q of sqList) {
      const cell = g.board[q.r] && g.board[q.r][q.c];
      if (!cell) continue;
      cell.t = toType;
      flash(g, q.r, q.c, 'transform', linesFn ? linesFn(cell, q) : '');
      lines.push(linesFn ? linesFn(cell, q) : '');
    }
    return lines;
  };
  Fx.transformSq = Fx.transformSq;

  // random subset transform
  Fx.transformN = (g, sqList, n, toType) => {
    const picks = Fx.uniqN(sqList.slice(), Math.min(n, sqList.length));
    const lines = [];
    for (const q of picks) {
      const cell = g.board[q.r] && g.board[q.r][q.c];
      if (!cell) continue;
      cell.t = toType;
      flash(g, q.r, q.c, 'transform', '');
      lines.push(sideName(cell.c) + ' ' + pname(toType) + ' conjured on ' + E.sqName(q.r, q.c) + '.');
    }
    return lines;
  };

  // summon n pieces of a type for a side at random EMPTY squares; prefer given rows
  Fx.summonN = (g, side, type, n, opts) => {
    opts = opts || {};
    const prefer = opts.rows || null; // array of rows to prefer
    let empties = Fx.emptySq(g);
    if (prefer) {
      const p = empties.filter(q => prefer.includes(q.r));
      if (p.length) empties = p;
    }
    const picks = Fx.uniqN(empties, n);
    const lines = [];
    for (const q of picks) {
      place(g, side, type, q.r, q.c, { text: 'summoned ' + pname(type) });
      lines.push('Summoned ' + art(pname(type)) + ' ' + pname(type) + ' for ' + sideName(side) + ' on ' + E.sqName(q.r, q.c) + '.');
    }
    return lines;
  };
  Fx.summonN = Fx.summonN;

  // upgrade: transform chosen own pieces up one tier (p->n/b or n/b->r or r->q)
  Fx.upgradeSq = (g, sqList, tier) => {
    const map = tier === 1 ? { p: 'n' } : tier === 2 ? { p: 'b', n: 'r', b: 'r' } : { p: 'q', n: 'q', b: 'q', r: 'q' };
    const lines = [];
    for (const q of sqList) {
      const cell = g.board[q.r] && g.board[q.r][q.c];
      if (!cell) continue;
      const to = map[cell.t];
      if (!to) continue;
      cell.t = to;
      flash(g, q.r, q.c, 'transform', '');
      lines.push(sideName(cell.c) + ' ' + pname(to) + ' ascends on ' + E.sqName(q.r, q.c) + '.');
    }
    return lines;
  };
  Fx.upgradeSq = Fx.upgradeSq;

  // downgrade enemy one tier
  Fx.downgradeSq = (g, sqList) => {
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const lines = [];
    for (const q of sqList) {
      const cell = g.board[q.r] && g.board[q.r][q.c];
      if (!cell) continue;
      const to = map[cell.t];
      if (!to) continue;
      cell.t = to;
      flash(g, q.r, q.c, 'transform', '');
      lines.push(sideName(cell.c) + ' piece weakens on ' + E.sqName(q.r, q.c) + '.');
    }
    return lines;
  };
  Fx.downgradeSq = Fx.downgradeSq;

  // promote one chosen pawn -> queen
  Fx.promotePawn = (g, sq) => {
    const cell = g.board[sq.r] && g.board[sq.r][sq.c];
    if (!cell || cell.t !== 'p') return [];
    cell.t = 'q';
    flash(g, sq.r, sq.c, 'transform', '');
    return [sideName(cell.c) + ' pawn ascends to Queen on ' + E.sqName(sq.r, sq.c) + '.'];
  };
  Fx.promotePawn = Fx.promotePawn;

  // revive captured pieces back onto the board for `side`
  // A side's own fallen pieces (g.lost) are raised first; if nothing of yours
  // has fallen, enemy pieces you captured may be CONSCRIPTED to your cause.
  Fx.revive = (g, side, count, opts) => {
    opts = opts || {};
    if (!g.lost) g.lost = { w: [], b: [] };
    const mine = g.lost[side] || (g.lost[side] = []);
    let pool = mine.filter(p => p.t !== 'k');
    if (!pool.length) pool = (g.capt[side] || []).filter(p => p.t !== 'k');
    if (opts.type) pool = pool.filter(p => p.t === opts.type);
    // no corpse of the wanted kind: conjure a fresh creature instead
    if (!pool.length && opts.type) {
      const rows = side === 'w' ? [3, 4, 5, 6] : [1, 2, 3, 4];
      const lines = [];
      for (let i = 0; i < count; i++) {
        let empties = Fx.emptySq(g, (r, c) => rows.includes(r));
        if (!empties.length) empties = Fx.emptySq(g);
        const sq = Fx.rand(empties);
        if (!sq) break;
        place(g, side, opts.type, sq.r, sq.c, {});
        lines.push(sideName(side) + ' ' + pname(opts.type) + ' is conjured from the aether on ' + E.sqName(sq.r, sq.c) + '.');
      }
      return lines;
    }
    if (!pool.length) return [];
    // revive most valuable first
    pool.sort((a, b) => Fx.value(b.t) - Fx.value(a.t));
    const lines = [];
    let revived = 0;
    const backRank = side === 'w' ? 7 : 0;
    for (let gi = 0; gi < pool.length && revived < count; gi++) {
      const p = pool[gi];
      let empties = Fx.emptySq(g, (r) => r === backRank);
      if (!empties.length) empties = Fx.emptySq(g);
      const sq = Fx.rand(empties);
      if (!sq) break;
      const wasMine = mine.indexOf(p) >= 0;
      place(g, side, p.t, sq.r, sq.c, { noRecruit: true });
      if (wasMine) { const ii = mine.indexOf(p); if (ii >= 0) mine.splice(ii, 1); }
      else { const ci = (g.capt[side] || []).indexOf(p); if (ci >= 0) g.capt[side].splice(ci, 1); }
      lines.push(sideName(side) + ' ' + pname(p.t) + (wasMine ? ' rises from the grave on ' : ' is conscripted to your banner on ') + E.sqName(sq.r, sq.c) + '.');
      revived++;
    }
    return lines;
  };
  Fx.revive = Fx.revive;

  // freeze N enemy pieces for one of their turns
  Fx.freezeN = (g, side, n) => {
    const pool = Fx.enemy(g, side).filter(q => q.cell.t !== 'k');
    const picks = Fx.uniqN(pool, n);
    statusOn(g, picks, 'f', 1, 'freeze');
    return picks.length ? ['Glacial chill binds ' + picks.length + ' enemy piece' + (picks.length > 1 ? 's' : '') + '.'] : [];
  };
  Fx.freezeN = Fx.freezeN;

  Fx.shieldN = (g, side, n, includeKing) => {
    let pool = Fx.own(g, side);
    if (!includeKing) pool = pool.filter(q => q.cell.t !== 'k');
    const picks = Fx.uniqN(pool, n);
    statusOn(g, picks, 's', 1, 'shield');
    return picks.length ? ['Aegis wards ' + picks.length + ' of your piece' + (picks.length > 1 ? 's' : '') + '.'] : [];
  };
  Fx.shieldN = Fx.shieldN;

  Fx.poisonN = (g, side, n) => {
    const pool = Fx.enemy(g, side).filter(q => q.cell.t !== 'k');
    const picks = Fx.uniqN(pool, n);
    statusOn(g, picks, 'p', 1, 'poison');
    return picks.length ? ['Venom courses through ' + picks.length + ' enemy piece' + (picks.length > 1 ? 's' : '') + '.'] : [];
  };
  Fx.poisonN = Fx.poisonN;

  // swap contents of two squares
  Fx.swapSq = (g, a, b) => {
    const ca = g.board[a.r] && g.board[a.r][a.c];
    const cb = g.board[b.r] && g.board[b.r][b.c];
    if (ca) E.revokeLeave(g, a.r, a.c, ca);
    if (cb) E.revokeLeave(g, b.r, b.c, cb);
    g.board[a.r][a.c] = cb;
    g.board[b.r][b.c] = ca;
    g.ep = null;
    if (ca) flash(g, b.r, b.c, 'move', '');
    if (cb) flash(g, a.r, a.c, 'move', '');
    return [];
  };
  Fx.swapSq = Fx.swapSq;

  // send an enemy piece back to its home square type-appropriate
  Fx.returnHome = (g, side, sq) => {
    const cell = g.board[sq.r] && g.board[sq.r][sq.c];
    if (!cell || cell.c !== opp(side)) return [];
    const row = cell.c === 'w' ? 7 : 0;
    const col = cell.t === 'p' ? sq.c : { q: 3, k: 4, b: sq.c >= 4 ? 5 : 2, n: sq.c >= 4 ? 6 : 1, r: sq.c >= 4 ? 7 : 0 }[cell.t];
    if (g.board[row] && g.board[row][col]) return [];
    relocate(g, sq.r, sq.c, row, col, { text: 'returned' });
    return [sideName(cell.c) + ' ' + pname(cell.t) + ' is banished home to ' + E.sqName(row, col) + '.'];
  };
  Fx.returnHome = Fx.returnHome;

  // teleport any piece (own or enemy) to an empty square in given region/random
  Fx.teleportToEmpty = (g, sq, opts) => {
    opts = opts || {};
    const cell = g.board[sq.r] && g.board[sq.r][sq.c];
    if (!cell) return [];
    let empties = Fx.emptySq(g);
    if (opts.rows) { const p = empties.filter(q => opts.rows.includes(q.r)); if (p.length) empties = p; }
    const dest = Fx.rand(empties);
    if (!dest) return [];
    relocate(g, sq.r, sq.c, dest.r, dest.c, { text: 'teleported' });
    return [sideName(cell.c) + ' ' + pname(cell.t) + ' warps to ' + E.sqName(dest.r, dest.c) + '.'];
  };
  Fx.teleportToEmpty = Fx.teleportToEmpty;

  // explode a square (used by bombs)
  Fx.bomb = (g, r, c, radius, opts) => {
    opts = opts || {};
    const lines = [];
    for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
      if (!opts.diag && Math.abs(dr) + Math.abs(dc) > radius) continue;
      if (opts.diag && !(Math.abs(dr) <= radius && Math.abs(dc) <= radius)) continue;
      const nr = r + dr, nc = c + dc;
      if (!onBoard(nr, nc) || (!dr && !dc)) continue;
      const cell = g.board[nr][nc];
      if (!cell || cell.t === 'k') continue; // blasts never take the king
      if (opts.only && cell.c !== opts.only) continue;
      removeAt(g, nr, nc, {});
      lines.push('Boom! ' + sideName(cell.c) + ' ' + pname(cell.t) + ' destroyed.');
    }
    return lines;
  };
  Fx.bomb = Fx.bomb;

  // push all pieces of color in a direction by 1 if empty landing
  Fx.gravity = (g, side, dir) => {
    // dir: {dr, dc}; process order so sliding works
    const order = allSq();
    if (dir.dr > 0) order.sort((a, b) => b.r - a.r);
    else if (dir.dr < 0) order.sort((a, b) => a.r - b.r);
    if (dir.dc > 0) order.sort((a, b) => b.c - a.c);
    else if (dir.dc < 0) order.sort((a, b) => a.c - b.c);
    let moved = 0;
    for (const q of order) {
      const cell = g.board[q.r][q.c];
      if (!cell || (side && cell.c !== side)) continue;
      let cr = q.r, cc = q.c;
      while (true) {
        const nr = cr + dir.dr, nc = cc + dir.dc;
        if (!onBoard(nr, nc)) break;
        const t = g.board[nr][nc];
        if (t) break;
        relocate(g, cr, cc, nr, nc, { text: 'pushed', noFlash: false });
        cr = nr; cc = nc; moved++;
      }
    }
    return moved;
  };
  Fx.gravity = Fx.gravity;

  // rotate the entire board 180 (with mirror) — flavor: chaos
  Fx.mirrorBoard = (g) => {
    const nb = [];
    for (let r = 0; r < 8; r++) {
      nb.push([]);
      for (let c = 0; c < 8; c++) nb[r].push(null);
    }
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell) { E.revokeLeave(g, r, c, cell); nb[7 - r][7 - c] = cell; }
    }
    g.board = nb;
    g.ep = null;
    g.castle = { wk: false, wq: false, bk: false, bq: false };
    return ['The world turns upside down — every piece is mirrored!'];
  };
  Fx.mirrorBoard = Fx.mirrorBoard;

  // Let side act again (an extra move) - managed by game loop
  Fx.grantExtra = (g, side, n) => {
    g.extra[side] = (g.extra[side] || 0) + (n || 1);
    return [];
  };
  Fx.grantExtra = Fx.grantExtra;

  // give side's king a random teleport to any safe square far away
  Fx.kingTeleport = (g, side, preferHalf) => {
    const king = E.findKing(g, side);
    if (!king) return [];
    let empties = Fx.emptySq(g);
    if (preferHalf) {
      const rows = side === 'w' ? [0, 1, 2, 3, 4] : [3, 4, 5, 6, 7];
      const p = empties.filter(q => rows.includes(q.r));
      if (p.length) empties = p;
    }
    empties = empties.filter(q => !(Math.abs(q.r - king.r) <= 1 && Math.abs(q.c - king.c) <= 1));
    const dest = Fx.rand(empties);
    if (!dest) return [];
    relocate(g, king.r, king.c, dest.r, dest.c, { text: 'blinked' });
    return [sideName(side) + ' king blinks to ' + E.sqName(dest.r, dest.c) + '.'];
  };
  Fx.kingTeleport = Fx.kingTeleport;

  // conjure a "wall" of allied pawns on a given rank
  Fx.wallOfPawns = (g, side, rank, cols) => {
    const lines = [];
    for (const c of cols) {
      if (!g.board[rank][c]) place(g, side, 'p', rank, c, {});
      else if (g.board[rank][c].c === opp(side)) {
        removeAt(g, rank, c, {});
        place(g, side, 'p', rank, c, {});
      }
      lines.push('A spectral pawn rises on ' + E.sqName(rank, c) + '.');
    }
    return lines;
  };
  Fx.wallOfPawns = Fx.wallOfPawns;

  // enemy must discard — not used; instead 'cursed' = they draw fewer. Kept as flavor-only guard.
  Fx.clearEp = g => { g.ep = null; };

  /* ---- hazard / terrain squares (engine-backed) ---- */
  Fx.hazardAt = (g, r, c, kind, name) => E.setHaz(g, r, c, kind, name || kind);
  // lay `n` hidden hazards on random EMPTY squares (optionally restricted rows)
  Fx.layHazards = function (g, kind, n, opts) {
    opts = opts || {};
    const empt = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (g.board[r][c]) continue;
      if (E.hazAt(g, r, c)) continue;
      if (opts.rows && !opts.rows.includes(r)) continue;
      empt.push({ r, c });
    }
    const picks = Fx.uniqN(empt, n);
    picks.forEach(q => E.setHaz(g, q.r, q.c, kind, opts.name || kind));
    return picks.length;
  };
  Fx.hazardKinds = ['poison', 'freeze', 'trap', 'ward', 'ember'];
  Fx.clearAllHaz = function (g) { if (g.haz) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.haz[r][c] = null; };
  // lay a 3x3 ring/zone of hazards centred on (cr,cc) — spells that reshape the ground
  Fx.layHazardZone = function (g, cr, cc, kind, opts) {
    opts = opts || {};
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (opts.ring && !dr && !dc) continue;
      const r = cr + dr, c = cc + dc;
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      if (E.isTerrain && E.isTerrain(g, r, c)) continue;
      if (E.setHaz(g, r, c, kind, opts.name || kind)) n++;
    }
    return n;
  };

  /* ---- statuses & ground zones & turn-modifiers (engine-backed) ---- */
  Fx.stoneOn = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list, n == null ? list.length : n), 'st', 1, 'freeze'); // petrify/seal
  Fx.doomOn = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list, n == null ? list.length : n), 'doom', 1, 'poison'); // death-mark
  Fx.frailOn = (g, list, n) => Fx.statusOn(g, Fx.uniqN(list, n == null ? list.length : n), 'frail', true, 'transform'); // armor-shred
  Fx.limitMove = function (g, side, type) { g.moveLimit = g.moveLimit || { w: null, b: null }; g.moveLimit[side] = type; };
  Fx.noCaptures = function (g, side) { g.noCap = g.noCap || { w: false, b: false }; g.noCap[side] = true; };
  Fx.zoneKind = g => E.zoneAt(g, 0, 0); // (deprecated marker) — use helpers below
  Fx.layZone = function (g, kind, n, opts) {
    opts = opts || {};
    const empt = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (g.board[r][c]) continue;
      if (E.isTerrain && E.isTerrain(g, r, c)) continue;
      if (E.zoneAt(g, r, c)) continue;
      if (opts.rows && !opts.rows.includes(r)) continue;
      empt.push({ r, c });
    }
    const picks = Fx.uniqN(empt, n);
    picks.forEach(q => E.setZone(g, q.r, q.c, kind, opts.c || null));
    return picks.length;
  };
  Fx.layZoneZone = function (g, cr, cc, kind, opts) {
    opts = opts || {};
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (opts.ring && !dr && !dc) continue;
      const r = cr + dr, c = cc + dc;
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      if (g.board[r][c]) continue;
      if (E.isTerrain && E.isTerrain(g, r, c)) continue;
      if (E.setZone(g, r, c, kind, opts.c || null)) n++;
    }
    return n;
  };
  Fx.clearAllZones = function (g) { if (E.clearAllZones) E.clearAllZones(g); };

  // evaluate raw material balance for side (for bot/effects that use it)
  Fx.material = (g, side) => {
    let v = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell) v += (cell.c === side ? 1 : -1) * Fx.value(cell.t);
    }
    return v;
  };
  Fx.material = Fx.material;

  Fx.opp = opp;
  Fx.PIECE_LABEL = PIECE_LABEL;

  // squares of enemy pieces currently giving check to `side`'s king
  Fx.checkers = function (g, side) {
    const k = E.findKing(g, side);
    if (!k) return [];
    const out = [];
    const b = g.board;
    const pr = side === 'w' ? k.r + 1 : k.r - 1;
    for (const dc of [-1, 1]) {
      const cell = b[pr] && b[pr][k.c + dc];
      if (cell && cell.c === opp(side) && cell.t === 'p') out.push({ r: pr, c: k.c + dc });
    }
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const cell = b[k.r + dr] && b[k.r + dr][k.c + dc];
      if (cell && cell.c === opp(side) && cell.t === 'n') out.push({ r: k.r + dr, c: k.c + dc });
    }
    const straight = [[1,0],[-1,0],[0,1],[0,-1]], diag = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const dirs of [straight, diag]) {
      for (const [dr, dc] of dirs) {
        let r = k.r + dr, c = k.c + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const cell = b[r][c];
          if (cell) {
            if (cell.c === opp(side)) {
              const t = cell.t;
              const ok = dirs === straight ? (t === 'r' || t === 'q') : (t === 'b' || t === 'q');
              if (ok) out.push({ r, c });
            }
            break;
          }
          r += dr; c += dc;
        }
      }
    }
    return out;
  };

  // helper used by ability closures: resolve a target square (or auto-pick)
  MD.pick = (g, side, sq, mode) => {
    if (sq) {
      if (sq.cell === undefined) {
        const cell = g.board[sq.r] && g.board[sq.r][sq.c];
        sq.cell = cell || null;
      }
      return sq;
    }
    return Fx.autoTarget(g, side, mode || 'enemyAny');
  };
  MD.pieceName = t => pname(t) || t;
  MD.sideName = sideName;

  MD.Fx = Fx;
})();

/* ============================================================
   Mod Chess — AI: move search + ability selection
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine;
  const opp = c => (c === 'w' ? 'b' : 'w');
  const V = t => E.val(t);

  // piece-square tables (white perspective, index r=c-row from 0..7 top)
  const PST_P = [
    0, 0, 0, 0, 0, 0, 0, 0,
    60, 60, 60, 60, 60, 60, 60, 60,
    12, 14, 22, 32, 32, 22, 14, 12,
    6, 10, 12, 26, 26, 12, 10, 6,
    2, 6, 10, 22, 22, 10, 6, 2,
    0, 2, 4, -4, -4, 4, 2, 0,
    4, -6, -6, -10, -10, -6, -6, 4,
    0, 0, 0, 0, 0, 0, 0, 0];
  const PST_N = [
    -50, -36, -28, -28, -28, -28, -36, -50,
    -40, -18, 0, 6, 6, 0, -18, -40,
    -28, 6, 12, 16, 16, 12, 6, -28,
    -22, 10, 20, 26, 26, 20, 10, -22,
    -22, 8, 22, 30, 30, 22, 8, -22,
    -28, 6, 16, 22, 22, 16, 6, -28,
    -40, -18, 2, 10, 10, 2, -18, -40,
    -50, -36, -28, -28, -28, -28, -36, -50];
  const PST_B = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 6, 4, 4, 4, 4, 6, -10,
    -10, 4, 10, 12, 12, 10, 4, -10,
    -10, 8, 12, 16, 16, 12, 8, -10,
    -10, 6, 12, 16, 16, 12, 6, -10,
    -10, 4, 8, 12, 12, 8, 4, -10,
    -10, 6, 4, 4, 4, 4, 6, -10,
    -20, -10, -10, -10, -10, -10, -10, -20];
  const PST_R = [
    0, 4, 4, 6, 6, 4, 4, 0,
    -4, 0, 2, 6, 6, 2, 0, -4,
    -4, -2, 2, 4, 4, 2, -2, -4,
    -4, -2, 2, 4, 4, 2, -2, -4,
    -4, -2, 2, 4, 4, 2, -2, -4,
    -4, 0, 2, 6, 6, 2, 0, -4,
    -4, 2, 4, 6, 6, 4, 2, -4,
    0, 4, 4, 6, 6, 4, 4, 0];
  const PST_Q = [
    -18, -8, -8, -6, -6, -8, -8, -18,
    -8, 0, 0, 2, 2, 0, 0, -8,
    -8, 2, 4, 6, 6, 4, 2, -8,
    -8, 2, 4, 8, 8, 4, 2, -8,
    -6, 2, 4, 8, 8, 4, 2, -6,
    -8, 2, 4, 6, 6, 4, 2, -8,
    -8, 0, 0, 2, 2, 0, 0, -8,
    -18, -8, -8, -6, -6, -8, -8, -18];
  const PST_K_MID = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    10, 10, 0, 0, 0, 0, 10, 10,
    20, 30, 10, 0, 0, 10, 30, 20];
  const PST = { p: PST_P, n: PST_N, b: PST_B, r: PST_R, q: PST_Q, k: PST_K_MID };

  function pstIdx(r, c, color) {
    if (color === 'w') return r * 8 + c;
    return (7 - r) * 8 + c;
  }

  // static eval from white's perspective (positive = good for white)
  function evaluate(g) {
    const n = (g.n | 0) >= 4 ? g.n | 0 : 8;
    const usePST = n === 8; // PST tables are 8x8 only; off-8 use material+mobility
    let score = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = g.board[r][c];
      if (!cell) continue;
      const pst = usePST ? PST[cell.t] : null;
      const base = V(cell.t) + (pst ? (pst[pstIdx(r, c, cell.c)] || 0) : 0);
      score += cell.c === 'w' ? base : -base;
    }
    // mobility (light)
    score += (E.legalMoves(g, 'w').length - E.legalMoves(g, 'b').length) * 2;
    return score;
  }

  // eval ability / bot state from `side` perspective
  function evalSide(g, side) {
    const mat = MD.Fx.material(g, side);
    if (!E.hasKing(g, opp(side))) return mat + 1e6;
    if (!E.hasKing(g, side)) return mat - 1e6;
    const n = (g.n | 0) >= 4 ? g.n | 0 : 8;
    let extra = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = g.board[r][c];
      if (!cell || !cell.b) continue;
      const owner = cell.c === side;
      const v = V(cell.t);
      if (cell.b.f > 0) extra += owner ? -v : +v * 0.45;
      if (cell.b.s > 0) extra += owner ? v * 0.3 : 0;
      if (cell.b.p > 0) extra += owner ? -v : +v * 0.35;
    }
    return mat + extra;
  }

  const MATE = 1000000;

  function orderMoves(g, moves) {
    return moves.map(m => {
      let s = 0;
      const dest = g.board[m.r1][m.c1];
      if (dest) s += 10 * V(dest.t) - V(g.board[m.r0][m.c0].t) / 10;
      if (m.promo) s += V(m.promo);
      return { m, s };
    }).sort((a, b) => b.s - a.s).map(x => x.m);
  }

  let nodes = 0;
  const NODE_CAP = 18000; // keep search snappy even with many custom troops on the board

  function staticTerm(g, side) {
    return (side === 'w' ? 1 : -1) * evaluate(g);
  }

  function negamax(g, depth, alpha, beta, side) {
    nodes++;
    if (nodes > NODE_CAP) return staticTerm(g, side);
    const moves = E.legalMoves(g, side);
    if (moves.length === 0) {
      if (E.inCheck(g, side)) return -MATE + depth;
      return 0; // stalemate
    }
    if (depth === 0) {
      // small quiescence: extend if a capture exists
      const anyCap = moves.some(m => m.capture);
      if (!anyCap) return staticTerm(g, side);
      return qsearch(g, alpha, beta, side, 6);
    }
    let best = -Infinity;
    for (const m of orderMoves(g, moves)) {
      const child = E.clone(g);
      E.applyMove(child, m, { silent: true });
      const val = -negamax(child, depth - 1, -beta, -alpha, opp(side));
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  function qsearch(g, alpha, beta, side, depth) {
    nodes++;
    if (nodes > NODE_CAP) return staticTerm(g, side);
    if (depth <= 0) return staticTerm(g, side);
    const moves = E.legalMoves(g, side).filter(m => m.capture);
    const stand = staticTerm(g, side);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    for (const m of orderMoves(g, moves)) {
      const child = E.clone(g);
      E.applyMove(child, m, { silent: true });
      const val = -qsearch(child, -beta, -alpha, opp(side), depth - 1);
      if (val >= beta) return beta;
      if (val > alpha) alpha = val;
    }
    return alpha;
  }

  function chooseMove(g, side, depth) {
    nodes = 0;
    const moves = E.legalMoves(g, side);
    if (!moves.length) return null;
    if (depth <= 1) {
      // easy: prefer captures/checks with randomness
      const scored = orderMoves(g, moves).map(m => {
        const child = E.clone(g);
        E.applyMove(child, m, { silent: true });
        const v = evalSide(child, side);
        return { m, v };
      });
      scored.sort((a, b) => b.v - a.v);
      const top = scored.slice(0, Math.max(1, Math.floor(scored.length * 0.25)));
      return top[Math.floor(Math.random() * top.length)].m;
    }
    let bestMoves = [];
    let best = -Infinity;
    const ordered = orderMoves(g, moves);
    // tiny aspiration/root-specific
    for (const m of ordered) {
      const child = E.clone(g);
      E.applyMove(child, m, { silent: true });
      const val = -negamax(child, depth - 1, -Infinity, Infinity, opp(side));
      if (val > best + 1) { best = val; bestMoves = [m]; }
      else if (val > best - 1 && val <= best + 1) bestMoves.push(m);
      if (nodes > NODE_CAP * 2) break; // still answer promptly on huge boards
    }
    // randomness among near-equal moves
    const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return pick || ordered[0];
  }

  MD.AI = {
    chooseMove: (g, side, depth) => chooseMove(g, side, depth),
    chooseAbility: function (g, side, hand) {
      if (!hand || !hand.length) return null;
      let chosen = null, chosenScore = -Infinity;
      for (const ab of hand) {
        let score = 0;
        const tries = 2;
        for (let i = 0; i < tries; i++) {
          const cg = E.clone(g);
          const t = MD.botTarget(cg, ab, side);
          const res = MD.cast(cg, ab, side, t);
          if (res.error) { score += -100000; continue; }
          let s = evalSide(cg, side);
          // incentive to actually use abilities sparingly vs move value
          if (cg.extra[side] > g.extra[side]) s += 400;
          score += s / tries;
        }
        if (score > chosenScore) { chosenScore = score; chosen = ab; }
      }
      const base = evalSide(g, side);
      // Only cast if it looks non-harmful (allow small gamble); prefer casting something 60% of time if it helps
      if (chosen && chosenScore > base - 30) {
        // avoid pure-waste randomness sometimes
        return chosen;
      }
      return null;
    },
    // expose node counter for perf info
    nodes: () => nodes
  };
})();

/* ============================================================
   Mod Chess — core chess engine (vanilla, pure data state)
   Board: board[r][c] with r0=rank8(top) .. r7=rank1(bottom); c0=file a.
   cell = { c:'w'|'b', t:'p|n|b|r|q|k', b?:{f,s,p,z,mature,growTo} } | null
     b.f  = frozen (pieces of owner can't move for f of owner's own turns)
     b.s  = shielded (CANNOT BE CAPTURED for s of opponent's turns)
     b.p  = poisoned (detonates at end of owner's next turn)
     b.z  = recruit delay — a just-summoned piece can't move/capture until
            it has survived `z` of its OWNER's own turn-ends (summoning
            sickness, scaled by troop strength).
     b.mature / b.growTo = growth: after `mature` half-moves the piece
            transforms into its adult troop type `growTo` (eggs, lings).
     Troop traits (read from MD.TROOPS defs, data-driven):
       recruit        fixed recruit delay (overrides strength-based)
       hatch {egg,after}  summoning an adult places its weak `egg` which
                          grows into the adult after `after` half-moves
       growTo/growAfter   weak form that matures into growTo
       onDeath 'split'    when destroyed leaves 2 pawns behind
       onDeath 'burst'    when destroyed blasts adjacent enemies
       regen true         clears own poison/freeze at end of owner's turn
       aura 'freeze'|'poison' applies once per own turn-end to an adjacent foe
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  root.MD = root.MD || {};
  const E = {};

  const DIRS = { n: [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] };
  const FILES = 'abcdefgh';

  // ---- custom troop definitions live in MD.TROOPS (js/troops.js) ----
  function TROOP(t) {
    const MD = root.MD;
    return (MD && MD.TROOPS && MD.TROOPS[t]) || null;
  }
  E.troopDef = TROOP;
  E.isTroop = t => !!TROOP(t);
  E.troopLetter = t => { const d = TROOP(t); return d ? (d.letter || '?') : '?'; };
  E.val = t => (E.PIECE_VAL[t] || (TROOP(t) && TROOP(t).value) || 0);

  // how many of the OWNER's own turn-ends a freshly placed piece must wait
  // before it may move/capture (summoning sickness, scaled by strength)
  E.recruitDelay = function (t) {
    const d = TROOP(t);
    if (!d) return 1;
    if (d.recruit != null) return Math.max(1, d.recruit);
    return (d.value || 0) >= 1000 ? 2 : 1;
  };
  // resolve what actually lands on the board when type is summoned
  // (an adult with `hatch` places its weaker egg, which later matures)
  E.spawnPlan = function (type) {
    const d = TROOP(type);
    if (d && d.hatch) return { type: d.hatch.egg, growTo: type, mature: (d.hatch.after || 2) };
    if (d && d.growTo) return { type, growTo: d.growTo, mature: (d.growAfter || 2) };
    return { type, growTo: null, mature: 0 };
  };
  // is this troop type (or one of its growth forms) part of family `family`?
  E.isFamily = function (type, family) {
    if (type === family) return true;
    const d = TROOP(type);
    if (d && d.growTo === family) return true;
    const fam = TROOP(family);
    if (fam && fam.hatch && fam.hatch.egg === type) return true;
    return false;
  };

  // does the troop at (pr,pc) attack square (r,c)? (leaps + limited slides, path-aware)
  function troopHits(g, t, pr, pc, r, c) {
    const def = TROOP(t);
    if (!def) return false;
    if (def.leap) {
      for (const [x, y] of def.leap) { if (pr + x === r && pc + y === c) return true; }
    }
    if (def.slide) {
      for (const s of def.slide) {
        const dx = s[0], dy = s[1];
        const mx = s.length > 2 ? s[2] : 8;
        let nr = pr + dx, nc = pc + dy, k = 1;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && k <= mx) {
          if (nr === r && nc === c) return true;
          const cell = g.board[nr][nc];
          if (cell) break;
          nr += dx; nc += dy; k++;
        }
      }
    }
    return false;
  }
  E.troopHits = troopHits;

  E.opp = c => c === 'w' ? 'b' : 'w';
  E.sqName = (r, c) => FILES[c] + (8 - r);
  E.FILES = FILES;

  function mkCell(color, type) { return { c: color, t: type }; }

  function newGame() {
    const b = [];
    const back = 'rnbqkbnr';
    for (let r = 0; r < 8; r++) {
      b.push([]);
      for (let c = 0; c < 8; c++) {
        if (r === 0) b[r][c] = mkCell('b', back[c]);
        else if (r === 1) b[r][c] = mkCell('b', 'p');
        else if (r === 6) b[r][c] = mkCell('w', 'p');
        else if (r === 7) b[r][c] = mkCell('w', back[c]);
        else b[r][c] = null;
      }
    }
    return {
      board: b, turn: 'w', castle: { wk: true, wq: true, bk: true, bq: true },
      ep: null, half: 0, full: 1, plies: 0,
      capt: { w: [], b: [] }, lost: { w: [], b: [] }, hist: [], lastMove: null,
      extra: { w: 0, b: 0 }, extraCycle: { w: false, b: false },
      anyTroop: false,
      over: false, result: null, reason: null, winner: null,
      silence: { w: false, b: false }, warded: { w: false, b: false },
      skipTurn: { w: false, b: false }, lowHand: { w: false, b: false },
      moveOnly: { w: false, b: false }, echo: { w: null, b: null },
      fxevents: []
    };
  }

  E.newGame = newGame;

  function clone(g) {
    // state is plain JSON; structuredClone is fastest + preserves everything
    if (typeof structuredClone === 'function') return structuredClone(g);
    return JSON.parse(JSON.stringify(g));
  }
  E.clone = clone;

  E.at = (g, r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8) ? g.board[r][c] : null;

  function findKing(g, color) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && cell.c === color && cell.t === 'k') return { r, c };
    }
    return null;
  }
  E.findKing = findKing;

  function hasKing(g, color) { return !!findKing(g, color); }
  E.hasKing = hasKing;

  /* -------- attacks -------- */
  function attacked(g, r, c, by) {
    // is square (r,c) attacked by 'by'?
    // pawns
    if (by === 'w') {
      const p1 = g.board[r + 1] && g.board[r + 1][c - 1];
      const p2 = g.board[r + 1] && g.board[r + 1][c + 1];
      if ((p1 && p1.c === 'w' && p1.t === 'p') || (p2 && p2.c === 'w' && p2.t === 'p')) return true;
    } else {
      const p1 = g.board[r - 1] && g.board[r - 1][c - 1];
      const p2 = g.board[r - 1] && g.board[r - 1][c + 1];
      if ((p1 && p1.c === 'b' && p1.t === 'p') || (p2 && p2.c === 'b' && p2.t === 'p')) return true;
    }
    // knights
    for (const [dr, dc] of DIRS.n) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const k = g.board[nr][nc];
        if (k && k.c === by && k.t === 'n') return true;
      }
    }
    // king
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const k = g.board[nr][nc];
        if (k && k.c === by && k.t === 'k') return true;
      }
    }
    // sliders
    const straight = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of straight) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const cell = g.board[nr][nc];
        if (cell) {
          if (cell.c === by && (cell.t === 'r' || cell.t === 'q')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    for (const [dr, dc] of diag) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const cell = g.board[nr][nc];
        if (cell) {
          if (cell.c === by && (cell.t === 'b' || cell.t === 'q')) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    // custom summoned creatures (only if any are on the board)
    if (g.anyTroop) {
      const T = root.MD && root.MD.TROOPS;
      if (T) {
        for (let rr = 0; rr < 8; rr++) for (let cc = 0; cc < 8; cc++) {
          const cell = g.board[rr][cc];
          if (cell && cell.c === by && T[cell.t] && troopHits(g, cell.t, rr, cc, r, c)) return true;
        }
      }
    }
    return false;
  }
  E.attacked = attacked;

  function inCheck(g, color) {
    const k = findKing(g, color);
    if (!k) return false;
    return attacked(g, k.r, k.c, E.opp(color));
  }
  E.inCheck = inCheck;

  function isFrozen(g, r, c) {
    const cell = g.board[r][c];
    return !!(cell && cell.b && cell.b.f > 0);
  }
  E.isFrozen = isFrozen;
  E.isRecruit = (g, r, c) => !!(g.board[r][c] && g.board[r][c].b && g.board[r][c].b.z > 0);
  E.isShielded = (g, r, c) => !!(g.board[r][c] && g.board[r][c].b && g.board[r][c].b.s > 0);
  E.isPoisoned = (g, r, c) => !!(g.board[r][c] && g.board[r][c].b && g.board[r][c].b.p > 0);

  /* -------- pseudo-legal moves -------- */
  function genPseudo(g, color) {
    const moves = [];
    const b = g.board;
    const en = color === 'w' ? -1 : 1;   // white moves up (r-1)
    const home = color === 'w' ? 6 : 1;  // pawn start row
    const promoRow = color === 'w' ? 0 : 7;

    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = b[r][c];
      if (!cell || cell.c !== color) continue;
      const t = cell.t;
      const push = (nr, nc, flags) => moves.push(Object.assign({ r0: r, c0: c, r1: nr, c1: nc }, flags));

      if (t === 'p') {
        const fwd = r + en;
        // quiet advance
        if (fwd >= 0 && fwd < 8 && !b[fwd][c]) {
          if (fwd === promoRow) {
            for (const pt of ['q', 'r', 'b', 'n']) push(fwd, c, { promo: pt });
          } else push(fwd, c, {});
          // double
          if (r === home && !b[r + 2 * en][c]) push(r + 2 * en, c, { double: true });
        }
        // captures
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc < 0 || nc > 7) continue;
          const target = b[fwd] && b[fwd][nc];
          if (target && target.c !== color) {
            if (fwd === promoRow) for (const pt of ['q', 'r', 'b', 'n']) push(fwd, nc, { promo: pt, capture: true });
            else push(fwd, nc, { capture: true });
          } else if (g.ep && g.ep.r === fwd && g.ep.c === nc) {
            push(fwd, nc, { ep: true, capture: true });
          }
        }
      } else if (t === 'n') {
        for (const [dr, dc] of DIRS.n) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const target = b[nr][nc];
          if (!target) push(nr, nc, {});
          else if (target.c !== color) push(nr, nc, { capture: true });
        }
      } else if (t === 'k') {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const target = b[nr][nc];
          if (!target) push(nr, nc, {});
          else if (target.c !== color) push(nr, nc, { capture: true });
        }
        // castling
        const opp = E.opp(color);
        if (color === 'w' && r === 7 && c === 4) {
          if (g.castle.wk && !b[7][5] && !b[7][6] && b[7][7] && b[7][7].c === 'w' && b[7][7].t === 'r'
            && !attacked(g, 7, 4, opp) && !attacked(g, 7, 5, opp) && !attacked(g, 7, 6, opp))
            push(7, 6, { castle: 'k' });
          if (g.castle.wq && !b[7][3] && !b[7][2] && !b[7][1] && b[7][0] && b[7][0].c === 'w' && b[7][0].t === 'r'
            && !attacked(g, 7, 4, opp) && !attacked(g, 7, 3, opp) && !attacked(g, 7, 2, opp))
            push(7, 2, { castle: 'q' });
        } else if (color === 'b' && r === 0 && c === 4) {
          if (g.castle.bk && !b[0][5] && !b[0][6] && b[0][7] && b[0][7].c === 'b' && b[0][7].t === 'r'
            && !attacked(g, 0, 4, opp) && !attacked(g, 0, 5, opp) && !attacked(g, 0, 6, opp))
            push(0, 6, { castle: 'k' });
          if (g.castle.bq && !b[0][3] && !b[0][2] && !b[0][1] && b[0][0] && b[0][0].c === 'b' && b[0][0].t === 'r'
            && !attacked(g, 0, 4, opp) && !attacked(g, 0, 3, opp) && !attacked(g, 0, 2, opp))
            push(0, 2, { castle: 'q' });
        }
      } else if (E.isTroop(t)) {
        // custom summoned creatures
        const def = TROOP(t);
        if (def) {
          if (def.leap) {
            for (const [dr, dc] of def.leap) {
              const nr = r + dr, nc = c + dc;
              if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
              const target = b[nr][nc];
              if (!target) push(nr, nc, {});
              else if (target.c !== color) push(nr, nc, { capture: true });
            }
          }
          if (def.slide) {
            for (const s of def.slide) {
              const dr = s[0], dc = s[1];
              const mx = s.length > 2 ? s[2] : 8;
              let nr = r + dr, nc = c + dc, k = 1;
              while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && k <= mx) {
                const target = b[nr][nc];
                if (!target) push(nr, nc, {});
                else { if (target.c !== color) push(nr, nc, { capture: true }); break; }
                nr += dr; nc += dc; k++;
              }
            }
          }
        }
      } else {
        // bishop, rook, queen rays
        const dirs = [];
        if (t === 'b' || t === 'q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        if (t === 'r' || t === 'q') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = b[nr][nc];
            if (!target) push(nr, nc, {});
            else {
              if (target.c !== color) push(nr, nc, { capture: true });
              break;
            }
            nr += dr; nc += dc;
          }
        }
      }
    }
    return moves;
  }

  /* -------- apply / unapply (low level) -------- */
  function revokeLeave(g, r, c, cell) {
    if (!cell) return;
    const ct = cell.t, cc = cell.c;
    if (cc === 'w') {
      if (r === 7 && c === 4 && ct === 'k') { g.castle.wk = false; g.castle.wq = false; }
      else if (r === 7 && c === 7 && ct === 'r') g.castle.wk = false;
      else if (r === 7 && c === 0 && ct === 'r') g.castle.wq = false;
    } else {
      if (r === 0 && c === 4 && ct === 'k') { g.castle.bk = false; g.castle.bq = false; }
      else if (r === 0 && c === 7 && ct === 'r') g.castle.bk = false;
      else if (r === 0 && c === 0 && ct === 'r') g.castle.bq = false;
    }
  }
  E.revokeLeave = revokeLeave;

  function applyMove(g, mv, opts) {
    opts = opts || {};
    const b = g.board;
    const moving = b[mv.r0][mv.c0];
    if (!moving) return null;
    const color = moving.c;
    const sanText = opts.silent ? null : san(g, mv);
    const undo = {
      mv: Object.assign({}, mv),
      fromCell: moving, toCell: b[mv.r1][mv.c1],
      castle: Object.assign({}, g.castle), ep: g.ep,
      extra: Object.assign({}, g.extra), half: g.half, full: g.full,
      epPawn: null, rookMove: null
    };

    // --- en passant bookkeeping / pawn capture ---
    g.ep = null;
    if (mv.ep) {
      const pr = mv.r0, pc = mv.c1;          // captured pawn is beside the moving pawn
      undo.epPawn = { r: pr, c: pc, cell: b[pr][pc] };
      b[pr][pc] = null;
    }

    // --- capture ---
    const captured = b[mv.r1][mv.c1];
    if (captured) {
      g.capt[color].push({ t: captured.t, c: captured.c, at: { r: mv.r1, c: mv.c1 }, b: captured.b || null });
      // the captured colour also remembers what it lost (for resurrection)
      if (g.lost) g.lost[captured.c] = g.lost[captured.c] || [];
      else g.lost = { w: [], b: [] };
      g.lost[captured.c].push({ t: captured.t, c: captured.c, at: { r: mv.r1, c: mv.c1 } });
      revokeLeave(g, mv.r1, mv.c1, captured);
      deathRattle(g, mv.r1, mv.c1, captured); // dying troops can leave a mark
    }

    // --- move piece ---
    if (mv.castle) {
      b[mv.r0][mv.c0] = null;
      b[mv.r1][mv.c1] = moving;
      if (mv.castle === 'k') {
        undo.rookMove = { from: { r: mv.r0, c: 7 }, to: { r: mv.r0, c: 5 }, cell: b[mv.r0][7] };
        b[mv.r0][7] = null;
        b[mv.r0][5] = undo.rookMove.cell;
      } else {
        undo.rookMove = { from: { r: mv.r0, c: 0 }, to: { r: mv.r0, c: 3 }, cell: b[mv.r0][0] };
        b[mv.r0][0] = null;
        b[mv.r0][3] = undo.rookMove.cell;
      }
    } else {
      b[mv.r1][mv.c1] = moving;
      b[mv.r0][mv.c0] = null;
    }

    // --- promotion ---
    if (mv.promo && moving.t === 'p') moving.t = mv.promo;

    // --- castling rights ---
    if (!mv.castle) revokeLeave(g, mv.r0, mv.c0, moving);
    else { g.castle.wk = false; g.castle.wq = false; if (mv.r0 === 0) { g.castle.bk = false; g.castle.bq = false; } }

    // --- en passant target for double push ---
    if (mv.double) {
      const rr = mv.r0 === 1 ? 2 : 5; // row between
      g.ep = { r: rr, c: mv.c0 };
    }

    // --- clocks ---
    const pawnOrCapture = moving.t === 'p' || captured || mv.ep;
    g.half = pawnOrCapture ? 0 : g.half + 1;
    if (color === 'b') g.full++;
    g.plies++;

    if (!opts.silent) {
      g.lastMove = {
        from: { r: mv.r0, c: mv.c0 }, to: { r: mv.r1, c: mv.c1 },
        piece: moving.t, color: color, promo: mv.promo || null,
        castle: mv.castle || null, capture: !!(captured || mv.ep),
        capturedPiece: captured ? captured.t : null,
        san: sanText
      };
      g.hist.push(g.lastMove);
    }
    return undo;
  }
  E.applyMove = applyMove;

  function unapplyMove(g, undo) {
    const b = g.board;
    const mv = undo.mv;
    // restore destination
    if (mv.castle) {
      b[mv.r0][mv.c0] = undo.fromCell;
      b[mv.r1][mv.c1] = undo.toCell;
      const rm = undo.rookMove;
      if (rm) { b[rm.to.r][rm.to.c] = null; b[rm.from.r][rm.from.c] = rm.cell; }
    } else {
      b[mv.r0][mv.c0] = undo.fromCell;
      b[mv.r1][mv.c1] = undo.toCell;
    }
    if (undo.epPawn) b[undo.epPawn.r][undo.epPawn.c] = undo.epPawn.cell;
    g.castle = undo.castle; g.ep = undo.ep; g.extra = undo.extra;
    g.half = undo.half; g.full = undo.full; g.plies--;
    return undo;
  }
  E.unapplyMove = unapplyMove;

  /* -------- legal moves -------- */
  function legalMoves(g, color, opts) {
    opts = opts || {};
    color = color || g.turn;
    const pseudo = genPseudo(g, color);
    const out = [];
    const w = clone(g);
    for (const mv of pseudo) {
      const piece = w.board[mv.r0][mv.c0];
      if (!piece) continue;
      // frozen or newly-summoned (recruiting) pieces cannot move
      if (piece.b && (piece.b.f > 0 || piece.b.z > 0)) continue;
      // shielded enemy pieces cannot be captured (a shield is a wall)
      if (mv.capture && !mv.ep) {
        const dest = w.board[mv.r1][mv.c1];
        if (dest && dest.c !== color && dest.b && dest.b.s > 0) continue;
      }
      const und = applyMove(w, mv, { silent: true });
      const k = findKing(w, color);
      const ok = k && !attacked(w, k.r, k.c, E.opp(color));
      unapplyMove(w, und);
      if (ok) out.push(mv);
    }
    return out;
  }
  E.legalMoves = legalMoves;

  /* -------- SAN -------- */
  const PIECE_LETTER = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
  function san(g, mv) {
    const moving = g.board[mv.r0][mv.c0];
    const color = moving.c;
    const name = E.sqName(mv.r1, mv.c1);
    if (mv.castle) return mv.castle === 'k' ? 'O-O' : 'O-O-O';
    let s = PIECE_LETTER[moving.t] || (E.isTroop(moving.t) ? E.troopLetter(moving.t) : '');
    if (moving.t === 'p' && mv.capture) s = E.sqName(mv.r0, mv.c0)[0];
    if (mv.capture) s += 'x';
    s += name;
    if (mv.promo) s += '=' + mv.promo.toUpperCase();
    // disambiguation minimal (exclude same move & castling)
    if (moving.t !== 'p' && moving.t !== 'k') {
      const pseudo = genPseudo(g, color);
      const others = pseudo.filter(m => !m.castle && m.c1 === mv.c1 && m.r1 === mv.r1 &&
        !(m.r0 === mv.r0 && m.c0 === mv.c0) && g.board[m.r0][m.c0].t === moving.t);
      if (others.length) {
        const sameFile = others.some(m => m.c0 === mv.c0);
        if (!sameFile) s = E.sqName(mv.r0, mv.c0)[0] + s;
        else if (others.some(m => m.r0 === mv.r0)) s = E.sqName(mv.r0, mv.c0) + s;
        else s = E.sqName(mv.r0, mv.c0)[1] + s;
      }
    }
    // check / mate markers
    const w = clone(g);
    const und = applyMove(w, mv, { silent: true });
    const opp = E.opp(color);
    if (findKing(w, opp) && attacked(w, findKing(w, opp).r, findKing(w, opp).c, color)) {
      const resps = legalMoves(w, opp);
      s += resps.length === 0 ? '#' : '+';
    }
    unapplyMove(w, und);
    return s;
  }
  E.san = san;

  /* -------- game end / status ticks -------- */
  function evaluateEnd(g, sideToMove) {
    // kings present?
    if (!hasKing(g, 'w')) return { over: true, result: '0-1', winner: 'b', reason: 'White king has fallen' };
    if (!hasKing(g, 'b')) return { over: true, result: '1-0', winner: 'w', reason: 'Black king has fallen' };
    const moves = legalMoves(g, sideToMove);
    if (moves.length === 0) {
      if (inCheck(g, sideToMove)) {
        const win = E.opp(sideToMove);
        return { over: true, result: win === 'w' ? '1-0' : '0-1', winner: win, reason: (win === 'w' ? 'White' : 'Black') + ' wins by checkmate' };
      }
      return { over: true, result: '1/2-1/2', winner: null, reason: 'Stalemate' };
    }
    if (g.half >= 100) return { over: true, result: '1/2-1/2', winner: null, reason: '50-move rule' };
    // insufficient material draw
    const pieces = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && cell.t !== 'k') pieces.push(cell.t);
    }
    if (pieces.length === 0) return { over: true, result: '1/2-1/2', winner: null, reason: 'Insufficient material' };
    if (pieces.length === 1 && pieces[0] === 'n') return { over: true, result: '1/2-1/2', winner: null, reason: 'Insufficient material' };
    if (pieces.length === 1 && pieces[0] === 'b') return { over: true, result: '1/2-1/2', winner: null, reason: 'Insufficient material' };
    return { over: false };
  }
  E.evaluateEnd = evaluateEnd;

  /* Poison explosion: poison counts down at end of owner's move-turn. */
  function explodeCell(g, r, c) {
    const cell = g.board[r][c];
    if (!cell) return;
    const lines = [];
    revokeLeave(g, r, c, cell);
    g.board[r][c] = null;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
      const t = g.board[nr][nc];
      if (t && t.c !== cell.c) {
        lines.push({ r: nr, c: nc, kind: 'destroy' });
        revokeLeave(g, nr, nc, t);
        g.board[nr][nc] = null;
      }
    }
    return lines;
  }
  E.explodeCell = explodeCell;

  /* when a troop with an on-death trait is removed (captured or destroyed)
     its corpse does something — data-driven via MD.TROOPS[t].onDeath */
  function deathRattle(g, r, c, cell) {
    if (!cell) return;
    const d = TROOP(cell.t);
    if (!d) return;
    const events = [];
    if (d.onDeath === 'split') {
      // it splits into two loyal pawns crawling out of the wreckage
      let placed = 0;
      const near = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !g.board[nr][nc]) near.push({ r: nr, c: nc });
      }
      for (const q of near) {
        if (placed >= 2) break;
        g.board[q.r][q.c] = { c: cell.c, t: 'p', b: { f: 0, s: 0, p: 0 } };
        placed++;
        events.push({ kind: 'rattle', r: q.r, c: q.c, text: cell.c === 'w' ? 'White' : 'Black' + ' pawn crawls from the wreck' });
      }
    } else if (d.onDeath === 'burst') {
      // dying volatile: blast every adjacent ENEMY (never the king)
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
        const t = g.board[nr][nc];
        if (t && t.c !== cell.c && t.t !== 'k') {
          g.capt ? g.capt : null;
          revokeLeave(g, nr, nc, t);
          g.board[nr][nc] = null;
          events.push({ kind: 'rattle', r: nr, c: nc, text: 'Death-burst destroys a ' + pieceLabel(t.t) });
        }
      }
    }
    return events;
  }
  E.deathRattle = deathRattle;
  const pieceLabel = t => { const d = TROOP(t); return d ? d.name : (E.PIECE_LABEL ? E.PIECE_LABEL[t] : t); };

  // tick statuses after `mover` has completed their turn
  function tickAfterMove(g, mover) {
    const events = [];
    const bList = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (!cell || !cell.b) continue;
      bList.push({ r, c, cell });
    }
    const T = root.MD && root.MD.TROOPS;
    for (const { r, c, cell } of bList) {
      if (!g.board[r][c] || g.board[r][c] !== cell) continue; // removed meanwhile (rattle)
      const b = cell.b;
      const def = T ? T[cell.t] : null;
      if (cell.c === mover) {
        // owner finished their turn
        if (b.f > 0) b.f--;
        // a regenerating troop cleanses itself before poison can bite
        if (def && def.regen && (b.p > 0 || b.f > 0)) {
          b.p = 0; b.f = 0;
          events.push({ kind: 'regen', r, c, text: sideLabel(cell.c) + ' ' + (def.name || cell.t) + ' regenerates' });
        }
        if (b.p > 0) {
          b.p = 0;
          events.push({ kind: 'poison', r, c });
          const boom = explodeCell(g, r, c);
          if (boom) events.push(...boom);
          continue;
        }
        // recruit countdown — summoning sickness fades as the owner's turns pass
        if (b.z > 0) b.z--;
      } else {
        // opponent's shield wears off after this turn
        if (b.s > 0) b.s--;
      }
      // owner-turn-end auras: pressure an adjacent foe
      if (cell.c === mover && def && def.aura && g.board[r][c] === cell) {
        const foes = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          const t = g.board[nr][nc];
          if (t && t.c !== cell.c && t.t !== 'k') foes.push({ r: nr, c: nc, cell: t });
        }
        if (foes.length) {
          const pick = foes[Math.floor(Math.random() * foes.length)];
          const key = def.aura === 'freeze' ? 'f' : def.aura === 'poison' ? 'p' : null;
          if (key) {
            const bb = pick.cell.b || (pick.cell.b = { f: 0, s: 0, p: 0, z: 0 });
            bb[key] = Math.max(bb[key] || 0, 1);
            events.push({ kind: 'aura', r: pick.r, c: pick.c, aura: def.aura, text: (def.name || cell.t) + ' aura ' + def.aura + 's a foe' });
          }
        }
      }
      // growth: piece matures into its adult form
      if (g.board[r][c] === cell && b.mature > 0) {
        b.mature--;
        if (b.mature <= 0 && b.growTo && T && T[b.growTo]) {
          const adult = b.growTo;
          cell.t = adult;
          delete b.mature; delete b.growTo;
          events.push({ kind: 'grow', r, c, text: (T[adult].name || adult) + ' has grown into its adult form' });
        }
      }
      // clean up when every counter is spent
      if (g.board[r][c] === cell) {
        const bb = cell.b;
        const spent = (bb.f || 0) <= 0 && (bb.s || 0) <= 0 && (bb.p || 0) <= 0 && !(bb.z > 0) && !(bb.mature > 0);
        if (spent) cell.b = undefined;
      }
    }
    return events;
  }
  E.tickAfterMove = tickAfterMove;
  function sideLabel(c) { return c === 'w' ? 'White' : 'Black'; }

  /* piece value for AI / advantage */
  E.PIECE_VAL = { p: 100, n: 320, b: 330, r: 500, q: 950, k: 30000 };

  MD.Engine = E;
})();

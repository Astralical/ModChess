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
  const FILES = 'abcdefghijkl';

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
        const mx = s.length > 2 ? s[2] : CUR;
        let nr = pr + dx, nc = pc + dy, k = 1;
        while (nr >= 0 && nr < CUR && nc >= 0 && nc < CUR && k <= mx) {
          if (nr === r && nc === c) return true;
          const cell = g.board[nr][nc];
          if (cell) break;
          if (g.blocked && g.blocked[nr] && g.blocked[nr][nc]) break; // terrain blocks sight
          nr += dx; nc += dy; k++;
        }
      }
    }
    return false;
  }
  E.troopHits = troopHits;

  E.opp = c => c === 'w' ? 'b' : 'w';
  // ---- board dimension ---- even square boards (6..12, default 8). newGame()
  // sets CUR and records g.n; every scan/bound below reads CUR. ----
  let CUR = 8;
  E.size = () => CUR;
  E.setSize = n => { const v = n | 0; if (v >= 4 && v <= 14) CUR = v; };
  E.sqName = (r, c) => FILES[c] + (CUR - r);
  E.FILES = FILES;

  function mkCell(color, type) { return { c: color, t: type }; }

  // back-rank composition for an even n x n board. Rooks stay on the edge files
  // so castling works; knights/bishops then the monarch sit toward the centre
  // (queen n/2-1, king n/2). Standard 8x8 = rnbqkbnr.
  function backRank(n) {
    if (n === 6) return ['r', 'n', 'q', 'k', 'n', 'r'];
    if (n === 4) return ['r', 'q', 'k', 'r'];
    const K = n >> 1;
    const a = new Array(n).fill(null);
    a[0] = 'r'; a[n - 1] = 'r';
    a[1] = 'n'; a[n - 2] = 'n';
    a[2] = 'b'; a[n - 3] = 'b';
    a[K - 1] = 'q'; a[K] = 'k';
    return a;
  }
  E.backRank = backRank;

  function newGame(size) {
    const n = ((size | 0) >= 4 && (size | 0) <= 14) ? (size | 0) : 8;
    CUR = n;
    const back = backRank(n);
    const b = [];
    for (let r = 0; r < n; r++) {
      b.push([]);
      for (let c = 0; c < n; c++) {
        if (r === 0) b[r][c] = back[c] ? mkCell('b', back[c]) : null;
        else if (r === 1) b[r][c] = mkCell('b', 'p');
        else if (r === n - 2) b[r][c] = mkCell('w', 'p');
        else if (r === n - 1) b[r][c] = back[c] ? mkCell('w', back[c]) : null;
        else b[r][c] = null;
      }
    }
    // Small boards: keep 8 rows present (padded with empties) so legacy 8x8
    // ability scans can never hit an undefined row; columns past n read empty.
    if (n < 8) { while (b.length < 8) b.push(new Array(n).fill(null)); }
    const grid = () => { const a = []; const rows = n < 8 ? 8 : n; for (let r = 0; r < rows; r++) a.push(new Array(n).fill(null)); return a; };
    return {
      n, board: b, turn: 'w',
      castle: n >= 8 ? { wk: true, wq: true, bk: true, bq: true } : { wk: false, wq: false, bk: false, bq: false },
      ep: null, half: 0, full: 1, plies: 0,
      capt: { w: [], b: [] }, lost: { w: [], b: [] }, hist: [], lastMove: null,
      extra: { w: 0, b: 0 }, extraCycle: { w: false, b: false },
      anyTroop: false,
      haz: grid(), blocked: grid(), zone: grid(),
      moveLimit: { w: null, b: null }, noCap: { w: false, b: false },
      over: false, result: null, reason: null, winner: null,
      silence: { w: false, b: false }, warded: { w: false, b: false },
      skipTurn: { w: false, b: false }, lowHand: { w: false, b: false },
      moveOnly: { w: false, b: false }, echo: { w: null, b: null },
      shells: [],
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

  E.at = (g, r, c) => (r >= 0 && r < CUR && c >= 0 && c < CUR) ? g.board[r][c] : null;

  /* ---- hazard / terrain squares ----
     g.haz[r][c] = null | { kind, name }  — a hidden trap on the square.
     When a piece MOVES onto a hazard it springs once (and is consumed).
     kinds: poison|freeze|trap|ward|ember */
  function hazInit(g) { if (!g.haz) { g.haz = []; for (let r = 0; r < CUR; r++) g.haz.push(new Array(CUR).fill(null)); } return g.haz; }
  E.setHaz = function (g, r, c, kind, name) {
    if (r < 0 || r >= CUR || c < 0 || c >= CUR) return false;
    const h = hazInit(g);
    if (h[r][c]) return false; // one hazard per square
    h[r][c] = { kind, name: name || kind };
    return true;
  };
  E.clearHaz = function (g, r, c) { if (g.haz && g.haz[r]) g.haz[r][c] = null; };
  E.hazAt = (g, r, c) => (g.haz && g.haz[r] && g.haz[r][c]) || null;

  /* ---- terrain (walls / rivers) — for special boards & the campaign ----
     g.blocked[r][c] = null | {t:'wall'} | {t:'river'}
     Pieces can never occupy a terrain square; terrain blocks sliding sight. */
  function terInit(g) { if (!g.blocked) { g.blocked = []; for (let r = 0; r < CUR; r++) g.blocked.push(new Array(CUR).fill(null)); } return g.blocked; }
  E.setTerrain = function (g, r, c, t) {
    if (r < 0 || r >= CUR || c < 0 || c >= CUR) return false;
    const tb = terInit(g);
    tb[r][c] = t ? { t: t === 'river' ? 'river' : 'wall' } : null;
    return true;
  };
  E.clearTerrain = function (g) { if (g.blocked) for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) g.blocked[r][c] = null; };
  E.terrainAt = (g, r, c) => (g.blocked && g.blocked[r] && g.blocked[r][c]) || null;
  E.isTerrain = (g, r, c) => !!(g.blocked && g.blocked[r] && g.blocked[r][c]);
  E.terrainList = function (g) {
    terInit(g);
    const out = [];
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) if (g.blocked[r][c]) out.push({ r, c, t: g.blocked[r][c].t });
    return out;
  };

  /* ---- ground ZONES ---- persistent squares a piece may stand on, that bite
     at the END of the standing piece's own turn.
     g.zone[r][c] = null | { kind, c? }   (c = owning side, for sanctuaries)
     kinds: fire|thorns|mire|sanctum|rift|fog.  FOG is passive: it hides
     (see E.obscured) but never fires at turn-end. */
  function zoneInit(g) { if (!g.zone) { g.zone = []; for (let r = 0; r < CUR; r++) g.zone.push(new Array(CUR).fill(null)); } return g.zone; }
  E.setZone = function (g, r, c, kind, side) {
    if (r < 0 || r >= CUR || c < 0 || c >= CUR) return false;
    if (g.blocked && g.blocked[r] && g.blocked[r][c]) return false; // not on walls/rivers
    zoneInit(g);
    if (g.zone[r][c]) return false;
    g.zone[r][c] = { kind, c: side || null };
    return true;
  };
  E.zoneAt = (g, r, c) => (g.zone && g.zone[r] && g.zone[r][c]) || null;
  E.clearZone = function (g, r, c) { if (g.zone && g.zone[r]) g.zone[r][c] = null; };
  E.clearAllZones = function (g) { if (g.zone) for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) g.zone[r][c] = null; };
  E.zoneList = function (g) {
    zoneInit(g);
    const out = [];
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) if (g.zone[r][c]) out.push({ r, c, z: g.zone[r][c] });
    return out;
  };
  // called at the end of `mover`'s turn for every piece of that side standing on a zone
  E.tickZones = function (g, mover) {
    const events = [];
    if (!g.zone) return events;
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) {
      const z = g.zone[r][c];
      if (!z) continue;
      const cell = g.board[r][c];
      if (!cell || cell.c !== mover) continue;
      if (z.kind === 'fire') {
        if (cell.t !== 'k') {
          const b = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
          b.p = Math.max(b.p || 0, 1); b.s = 0;
          events.push({ kind: 'zone', r, c, text: 'The burning ground sears a piece standing on it!' });
        }
      } else if (z.kind === 'thorns') {
        if (cell.t !== 'k') {
          const b = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
          b.doom = 1;
          events.push({ kind: 'zone', r, c, text: 'Thorns open a wound — the piece is doomed.' });
        }
      } else if (z.kind === 'mire') {
        const b = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
        b.f = Math.max(b.f || 0, 1);
        events.push({ kind: 'zone', r, c, text: 'The mire clings — the piece will be stuck next turn.' });
      } else if (z.kind === 'sanctum') {
        if (z.c === mover) {
          const b = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
          b.f = 0; b.p = 0; b.s = Math.max(b.s || 0, 1);
          events.push({ kind: 'zone', r, c, text: 'Sanctified ground heals and wards your piece.' });
        } else {
          // enemies cannot rest on holy ground: shove them back toward their side
          const dir = mover === 'w' ? 1 : -1;
          const nr = r + dir;
          if (nr >= 0 && nr < CUR && !g.board[nr][c]) {
            revokeLeave(g, r, c, cell);
            g.board[nr][c] = cell; g.board[r][c] = null;
            events.push({ kind: 'zone', r: nr, c, text: 'Holy ground pushes the intruder away.' });
          } else events.push({ kind: 'zone', r, c, text: 'Holy ground burns the intruder — it is poisoned.' });
        }
      } else if (z.kind === 'rift') {
        if (cell.t !== 'k') {
          const spots = [];
          for (let rr = 0; rr < CUR; rr++) for (let cc = 0; cc < CUR; cc++) {
            if ((rr !== r || cc !== c) && !g.board[rr][cc] && !(g.blocked && g.blocked[rr] && g.blocked[rr][cc])) spots.push({ r: rr, c: cc });
          }
          if (spots.length) {
            const q = spots[Math.floor(Math.random() * spots.length)];
            revokeLeave(g, r, c, cell);
            g.board[r][c] = null; g.board[q.r][q.c] = cell;
            events.push({ kind: 'zone', r: q.r, c: q.c, text: 'The rift tears the standing piece to ' + E.sqName(q.r, q.c) + '!' });
          }
        }
      }
    }
    return events;
  };
  E.hazList = function (g) {
    hazInit(g);
    const out = [];
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) if (g.haz[r][c]) out.push({ r, c, haz: g.haz[r][c] });
    return out;
  };
  function springHazard(g, r, c, cell) {
    const h = (g.haz && g.haz[r] && g.haz[r][c]) || null;
    if (!h || !cell) return null;
    g.haz[r][c] = null;
    const b = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
    let text = '';
    if (h.kind === 'poison') { b.p = 1; text = 'A ' + h.name + ' poisons the piece that stepped on it!'; }
    else if (h.kind === 'freeze') { b.f = Math.max(b.f || 0, 1); text = 'A ' + h.name + ' freezes the piece that stepped on it!'; }
    else if (h.kind === 'ward') { b.s = Math.max(b.s || 0, 1); b.p = 0; b.f = 0; text = 'A ' + h.name + ' wards the piece that stepped on it.'; }
    else if (h.kind === 'ember') { b.p = 1; if (b.s > 0) b.s = 0; text = 'A ' + h.name + ' sears through the piece that stepped on it (shield lost, poison!).'; }
    else if (h.kind === 'trap') {
      if (cell.t !== 'k') {
        revokeLeave(g, r, c, cell);
        g.board[r][c] = null;
        text = 'A ' + h.name + ' TRAPS and destroys the piece that stepped on it!';
      } else text = 'A ' + h.name + ' snaps shut on the king — but the crown holds.';
    }
    if (!(g.fxevents)) g.fxevents = [];
    g.fxevents.push({ r, c, kind: h.kind === 'trap' ? 'destroy' : 'fx', text });
    if (!g.hazLog) g.hazLog = [];
    if (text) g.hazLog.push(text);
    return text;
  }
  E.springHazard = springHazard;

  /* ---- mortar / siege SHELLS (delayed area attacks) ----
     A shell is a pending strike on a square that detonates after `fuse` of
     its FIRING side's own turns (ticked via E.tickShells(g, side)). It hits
     whatever enemy piece is on/near the square when it lands. */
  function engineBomb(g, r, c, radius, owner) {
    const lines = [];
    const n = g.n || CUR;
    for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      const cell = g.board[rr][cc];
      if (!cell || cell.c === owner || cell.t === 'k') continue;
      revokeLeave(g, rr, cc, cell);
      g.board[rr][cc] = null;
      lines.push({ r: rr, c: cc });
    }
    return lines;
  }
  E.addShell = function (g, r, c, owner, fuse, radius) {
    if (!g) return null;
    const n = g.n || CUR;
    if (r < 0 || r >= n || c < 0 || c >= n) return null;
    if (!g.shells) g.shells = [];
    const sh = { r, c, owner, fuse: Math.max(1, (fuse | 0) || 1), radius: Math.max(0, (radius | 0) || 1) };
    g.shells.push(sh);
    return sh;
  };
  E.shellList = g => (g && g.shells) || [];
  E.clearShells = function (g) { if (g) g.shells = []; };
  // detonate the firing side's shells whose fuse has expired
  E.tickShells = function (g, side) {
    const evs = [];
    const s = (g.shells || []).slice();
    const alive = [];
    for (const sh of s) {
      if (sh.owner !== side) { alive.push(sh); continue; }
      sh.fuse--;
      if (sh.fuse <= 0) {
        const hit = engineBomb(g, sh.r, sh.c, sh.radius, sh.owner);
        evs.push({ kind: 'shell', r: sh.r, c: sh.c, radius: sh.radius, hit: hit.length, text: 'A shell strikes with a thunderous blast!' });
      } else alive.push(sh);
    }
    g.shells = alive;
    return evs;
  };

  /* ---- RANGED artillery troops: fire at range without moving ----
     A troop with `artillery: {range, radius, cd}` (or legacy `range`) can
     strike enemies on a clear straight/diagonal line within range. The owner
     auto-fires at the start of their turn and then cools down `cd` own turns. */
  E.rangeCandidates = function (g, r, c, range) {
    const n = g.n || CUR;
    const me = g.board[r] && g.board[r][c];
    const out = [];
    if (!me) return out;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc, d = 1;
      while (rr >= 0 && rr < n && cc >= 0 && cc < n && d <= range) {
        if (E.terrainAt && E.terrainAt(g, rr, cc)) break;
        const cell = g.board[rr][cc];
        if (cell) { if (cell.c !== me.c && cell.t !== 'k') out.push({ r: rr, c: cc, cell, d }); break; }
        rr += dr; cc += dc; d++;
      }
    }
    return out;
  };
  // immediate ranged strike (radius 0 = destroy the one target)
  E.strike = function (g, r, c, radius, side) {
    const hits = engineBomb(g, r, c, Math.max(0, radius | 0 || 0), side);
    return hits.length;
  };
  // lower artillery cooldowns at the start of the owner's own turns
  E.tickArtillery = function (g, side) {
    const T = root.MD && root.MD.TROOPS;
    if (!T || !g.anyTroop) return;
    const n = g.n || CUR;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== side) continue;
      const d = T[cell.t];
      if (!d || !(d.artillery || d.range)) continue;
      const bb = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
      if ((bb.ac || 0) > 0) bb.ac--;
    }
  };

  function findKing(g, color) {
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) {
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
      if (nr >= 0 && nr < CUR && nc >= 0 && nc < CUR) {
        const k = g.board[nr][nc];
        if (k && k.c === by && k.t === 'n') return true;
      }
    }
    // king
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < CUR && nc >= 0 && nc < CUR) {
        const k = g.board[nr][nc];
        if (k && k.c === by && k.t === 'k') return true;
      }
    }
    // sliders
    const straight = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const diag = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of straight) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < CUR && nc >= 0 && nc < CUR) {
        if (E.terrainAt(g, nr, nc)) break; // walls & rivers block sight
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
      while (nr >= 0 && nr < CUR && nc >= 0 && nc < CUR) {
        if (E.terrainAt(g, nr, nc)) break; // walls & rivers block sight
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
        for (let rr = 0; rr < CUR; rr++) for (let cc = 0; cc < CUR; cc++) {
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

  /* ---- fog & veil (invisibility) ----
     A piece is OBSCURED when it stands on a FOG zone OR carries a veil
     (b.v > 0). An obscured piece can only be CAPTURED by an enemy piece on
     an ADJACENT square — range strikes cannot find it in the mist. Spells
     still pierce mist; only blades are blind. Veil counts down as its
     owner's own turns pass. */
  E.obscured = function (g, r, c) {
    const cell = g.board[r] && g.board[r][c];
    if (!cell) return false;
    if (cell.b && cell.b.v > 0) return true;
    const z = E.zoneAt(g, r, c);
    return !!(z && z.kind === 'fog');
  };
  E.isVeiled = (g, r, c) => !!(g.board[r][c] && g.board[r][c].b && g.board[r][c].b.v > 0);
  E.isFogSq = (g, r, c) => { const z = E.zoneAt(g, r, c); return !!(z && z.kind === 'fog'); };

  /* -------- pseudo-legal moves -------- */
  function genPseudo(g, color) {
    const moves = [];
    const b = g.board;
    const n = g.n || CUR;
    const en = color === 'w' ? -1 : 1;          // white moves up (r-1)
    const homeRow = color === 'w' ? n - 2 : 1;  // pawn start row (double push)
    const promoRow = color === 'w' ? 0 : n - 1; // promotion rank
    const kRow = color === 'w' ? n - 1 : 0;     // king's home rank
    const K = n >> 1;                           // king's home file
    const ter = (rr, cc) => !!(g.blocked && g.blocked[rr] && g.blocked[rr][cc]); // terrain = cannot land & blocks sight

    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = b[r][c];
      if (!cell || cell.c !== color) continue;
      const t = cell.t;
      const push = (nr, nc, flags) => moves.push(Object.assign({ r0: r, c0: c, r1: nr, c1: nc }, flags));

      if (t === 'p') {
        const fwd = r + en;
        // quiet advance (cannot step into terrain)
        if (fwd >= 0 && fwd < n && !b[fwd][c] && !ter(fwd, c)) {
          if (fwd === promoRow) {
            for (const pt of ['q', 'r', 'b', 'n']) push(fwd, c, { promo: pt });
          } else push(fwd, c, {});
          // double (both squares clear of pieces AND terrain)
          if (r === homeRow && !b[r + 2 * en][c] && !ter(r + 2 * en, c)) push(r + 2 * en, c, { double: true });
        }
        // captures (targets only ever sit on non-terrain squares)
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc < 0 || nc >= n) continue;
          const target = b[fwd] && b[fwd][nc];
          if (target && target.c !== color) {
            if (fwd === promoRow) for (const pt of ['q', 'r', 'b', 'n']) push(fwd, nc, { promo: pt, capture: true });
            else push(fwd, nc, { capture: true });
          } else if (g.ep && g.ep.r === fwd && g.ep.c === nc) {
            push(fwd, nc, { ep: true, capture: true });
          }
        }
      } else if (t === 'n' || t === 'k' || E.isTroop(t) && (TROOP(t) && TROOP(t).leap)) {
        // leapers (knights, kings, and every troop leap) may jump walls/rivers but never LAND on them
        const leaps = t === 'n' ? DIRS.n : t === 'k'
          ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
          : TROOP(t).leap;
        for (const [dr, dc] of leaps) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
          if (ter(nr, nc)) continue;
          const target = b[nr][nc];
          if (!target) push(nr, nc, {});
          else if (target.c !== color) push(nr, nc, { capture: true });
        }
      }
      // troop & standard sliders
      const slideSets = [];
      if (E.isTroop(t) && TROOP(t) && TROOP(t).slide) slideSets.push(...TROOP(t).slide);
      if (t === 'b' || t === 'q') slideSets.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      if (t === 'r' || t === 'q') slideSets.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      for (const s of slideSets) {
        const dr = s[0], dc = s[1];
        const mx = s.length > 2 ? s[2] : n;
        let nr = r + dr, nc = c + dc, k = 1;
        while (nr >= 0 && nr < n && nc >= 0 && nc < n && k <= mx) {
          if (ter(nr, nc)) break; // walls & rivers end the ray (cannot occupy)
          const target = b[nr][nc];
          if (!target) push(nr, nc, {});
          else { if (target.c !== color) push(nr, nc, { capture: true }); break; }
          nr += dr; nc += dc; k++;
        }
      }
      // castling (needs at least an 8-wide board)
      if (t === 'k' && r === kRow && c === K) {
        const opp = E.opp(color);
        const wk = color === 'w';
        const cK = wk ? 'wk' : 'bk', cQ = wk ? 'wq' : 'bq';
        // kingside — clear K+1..n-2, rook on the kingside edge
        if (g.castle[cK]) {
          let free = true;
          for (let cc = K + 1; cc <= n - 2; cc++) { if (b[kRow][cc] || ter(kRow, cc)) { free = false; break; } }
          const rook = b[kRow][n - 1];
          if (free && rook && rook.c === color && rook.t === 'r'
            && !attacked(g, kRow, K, opp) && !attacked(g, kRow, K + 1, opp) && !attacked(g, kRow, K + 2, opp)) {
            push(kRow, K + 2, { castle: 'k' });
          }
        }
        // queenside — clear 1..K-1, rook on the queenside edge
        if (g.castle[cQ]) {
          let free = true;
          for (let cc = K - 1; cc >= 1; cc--) { if (b[kRow][cc] || ter(kRow, cc)) { free = false; break; } }
          const rook = b[kRow][0];
          if (free && rook && rook.c === color && rook.t === 'r'
            && !attacked(g, kRow, K, opp) && !attacked(g, kRow, K - 1, opp) && !attacked(g, kRow, K - 2, opp)) {
            push(kRow, K - 2, { castle: 'q' });
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
    const n = g.n || CUR;
    const K = n >> 1;
    const home = cc === 'w' ? n - 1 : 0;
    if (ct === 'k' && r === home && c === K) { g.castle[cc + 'k'] = false; g.castle[cc + 'q'] = false; }
    else if (ct === 'r' && r === home && c === 0) g.castle[cc + 'q'] = false;
    else if (ct === 'r' && r === home && c === n - 1) g.castle[cc + 'k'] = false;
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
      const n = g.n || CUR;
      const K = n >> 1;
      if (mv.castle === 'k') {
        const rc = n - 1;
        undo.rookMove = { from: { r: mv.r0, c: rc }, to: { r: mv.r0, c: K + 1 }, cell: b[mv.r0][rc] };
        b[mv.r0][rc] = null;
        b[mv.r0][K + 1] = undo.rookMove.cell;
      } else {
        undo.rookMove = { from: { r: mv.r0, c: 0 }, to: { r: mv.r0, c: K - 1 }, cell: b[mv.r0][0] };
        b[mv.r0][0] = null;
        b[mv.r0][K - 1] = undo.rookMove.cell;
      }
    } else {
      b[mv.r1][mv.c1] = moving;
      b[mv.r0][mv.c0] = null;
    }

    // --- promotion ---
    if (mv.promo && moving.t === 'p') moving.t = mv.promo;

    // --- castling rights ---
    if (!mv.castle) revokeLeave(g, mv.r0, mv.c0, moving);
    else if (color === 'w') { g.castle.wk = false; g.castle.wq = false; }
    else { g.castle.bk = false; g.castle.bq = false; }

    // --- en passant target for double push ---
    if (mv.double) {
      const rr = (mv.r0 + mv.r1) / 2; // row between
      g.ep = { r: rr, c: mv.c0 };
    }

    // --- clocks ---
    const pawnOrCapture = moving.t === 'p' || captured || mv.ep;
    g.half = pawnOrCapture ? 0 : g.half + 1;
    if (color === 'b') g.full++;
    g.plies++;

    // hidden hazards spring when a piece moves onto them
    if (g.haz && g.haz[mv.r1] && g.haz[mv.r1][mv.c1]) {
      const stepper = b[mv.r1][mv.c1];
      if (stepper) springHazard(g, mv.r1, mv.c1, stepper);
    }

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
    let pseudo = genPseudo(g, color);
    // global one-turn restrictions (set by abilities): only a given type may move
    if (g.moveLimit && g.moveLimit[color]) {
      const only = g.moveLimit[color];
      if (only === 'none') pseudo = [];
      else pseudo = pseudo.filter(mv => {
        const piece = g.board[mv.r0][mv.c0];
        return piece && piece.t === only;
      });
    }
    if (g.noCap && g.noCap[color]) pseudo = pseudo.filter(mv => !mv.capture && !mv.ep);
    const out = [];
    const w = clone(g);
    for (const mv of pseudo) {
      const piece = w.board[mv.r0][mv.c0];
      if (!piece) continue;
      // frozen, newly-summoned, or petrified pieces cannot move
      if (piece.b && (piece.b.f > 0 || piece.b.z > 0 || piece.b.st > 0)) continue;
      // shielded or petrified enemy pieces cannot be captured (a frail piece loses this)
      if (mv.capture && !mv.ep) {
        const dest = w.board[mv.r1][mv.c1];
        if (dest && dest.c !== color && dest.b && !dest.b.frail && (dest.b.s > 0 || dest.b.st > 0)) continue;
      }
      // obscured pieces (fog / veil) can only be captured from an ADJACENT square
      if (mv.capture && !mv.ep) {
        const dest = w.board[mv.r1][mv.c1];
        if (dest && dest.c !== color && E.obscured(w, mv.r1, mv.c1)) {
          const adj = Math.abs(mv.r0 - mv.r1) <= 1 && Math.abs(mv.c0 - mv.c1) <= 1;
          if (!adj) continue;
        }
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
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) {
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
      if (nr < 0 || nr >= CUR || nc < 0 || nc >= CUR) continue;
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
        if (nr >= 0 && nr < CUR && nc >= 0 && nc < CUR && !g.board[nr][nc]) near.push({ r: nr, c: nc });
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
        if (nr < 0 || nr >= CUR || nc < 0 || nc >= CUR) continue;
        const t = g.board[nr][nc];
        if (t && t.c !== cell.c && t.t !== 'k') {
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
    for (let r = 0; r < CUR; r++) for (let c = 0; c < CUR; c++) {
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
        if (b.st > 0) b.st--; // petrification erodes only as the owner's own turns pass
        if (b.v > 0) b.v--;   // veil (mist/invisibility) thins as its owner's turns pass
        // a regenerating troop cleanses itself before poison can bite
        if (def && def.regen && (b.p > 0 || b.f > 0)) {
          b.p = 0; b.f = 0;
          events.push({ kind: 'regen', r, c, text: sideLabel(cell.c) + ' ' + (def.name || cell.t) + ' regenerates' });
        }
        // DOOM: the death-mark claims the piece quietly at the end of its own turn
        if (b.doom > 0) {
          b.doom = 0;
          events.push({ kind: 'doom', r, c, text: sideLabel(cell.c) + ' ' + pieceLabel(cell.t) + ' succumbs to its doom.' });
          revokeLeave(g, r, c, cell);
          g.board[r][c] = null;
          continue;
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
        // opponent's shield wears off as their turns pass
        if (b.s > 0) b.s--;
      }
      // owner-turn-end auras: pressure an adjacent foe
      if (cell.c === mover && def && def.aura && g.board[r][c] === cell) {
        const foes = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= CUR || nc < 0 || nc >= CUR) continue;
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
        const spent = (bb.f || 0) <= 0 && (bb.s || 0) <= 0 && (bb.p || 0) <= 0 && !(bb.z > 0) && !(bb.mature > 0) && !(bb.st > 0) && !(bb.doom > 0) && !(bb.v > 0) && !bb.frail;
        if (spent) cell.b = undefined;
      }
    }
    // ground zones bite anything left standing at the end of the mover's turn
    if (E.tickZones) { const zev = E.tickZones(g, mover); if (zev && zev.length) events.push(...zev); }
    // one-turn global restrictions expire once that side has moved
    if (g.moveLimit) g.moveLimit[mover] = null;
    if (g.noCap) g.noCap[mover] = false;
    return events;
  }
  E.tickAfterMove = tickAfterMove;
  function sideLabel(c) { return c === 'w' ? 'White' : 'Black'; }

  /* piece value for AI / advantage */
  E.PIECE_VAL = { p: 100, n: 320, b: 330, r: 500, q: 950, k: 30000 };

  MD.Engine = E;
})();

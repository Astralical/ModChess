/* ============================================================
   Mod Chess — TAROT mechanics (set 22 support).

   Three brand-new systems live here:
     1. ARCANA POLARITY — every Tarot card resolves UPRIGHT or REVERSED
        (a coin flip, or forced by The Magician / The Hanged Man / Wheel).
        Reversed outcomes are usually inverted or costlier.
     2. SUIT ATTUNEMENT — a piece can be attuned to Wands (fire), Cups
        (water), Swords (air) or Pentacles (earth). Attuned pieces carry a
        passive resolved at the end of their owner's turn, and suit spells
        grow stronger while two or more of that suit stand ("aligned").
     3. PROPHECY — a delayed, CONDITIONAL fate laid on a square. It resolves
        after N of the caster's turns, or the moment a piece LEAVES / ENTERS
        the marked square. (Shells are timed & fixed; doom is unconditional;
        prophecy is conditional foresight.)

   Plain-data only: everything stored on `g` is serialisable.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  if (!MD) return;
  const E = MD.Engine, Fx = MD.Fx;
  const opp = c => (c === 'w' ? 'b' : 'w');

  const SUITS = {
    wand: { key: 'wand', label: 'Wands', icon: 'fire', verb: 'scorches' },
    cup: { key: 'cup', label: 'Cups', icon: 'drop', verb: 'mends' },
    sword: { key: 'sword', label: 'Swords', icon: 'wind', verb: 'wards' },
    pent: { key: 'pent', label: 'Pentacles', icon: 'coin', verb: 'fortifies' }
  };

  /* ================= 1. ARCANA POLARITY ================= */
  // Flip (or force) a card's polarity. Returns true when REVERSED.
  Fx.tarotFlip = function (g, opts) {
    opts = opts || {};
    let rev;
    if (opts.force === true) rev = true;
    else if (opts.force === false) rev = false;
    else rev = Math.random() < 0.5;
    if (g) g.tarot = { rev: rev, forced: (opts.force === true || opts.force === false) };
    return rev;
  };
  Fx.tarotReversed = g => !!(g && g.tarot && g.tarot.rev);
  // describe the outcome for the battle log
  Fx.tarotLine = (rev, upright, reversed) => (rev ? ('REVERSED — ' + reversed) : ('UPRIGHT — ' + upright));

  /* ================= 2. SUIT ATTUNEMENT ================= */
  // Attune a list of squares to a suit (creates the status bag if needed).
  Fx.attune = function (g, list, suit) {
    let n = 0;
    for (const q of (list || [])) {
      const cell = g.board[q.r] && g.board[q.r][q.c];
      if (!cell) continue;
      if (!cell.b) cell.b = { f: 0, s: 0, p: 0 };
      cell.b.suit = suit;
      Fx.flash(g, q.r, q.c, 'transform', '');
      n++;
    }
    return n;
  };
  // A piece's suit: an explicit attunement OR a court troop's built-in suit.
  Fx.suitOf = function (g, q) {
    const cell = g.board[q.r] && g.board[q.r][q.c];
    if (!cell) return null;
    if (cell.b && cell.b.suit) return cell.b.suit;
    const d = (MD.TROOPS || {})[cell.t];
    return (d && d.suit) || null;
  };
  Fx.suitPower = (g, side, suit) => Fx.own(g, side).filter(q => Fx.suitOf(g, q) === suit).length;
  Fx.attunedList = (g, side) => Fx.own(g, side).filter(q => !!Fx.suitOf(g, q));
  // "aligned" = 2+ pieces of that suit stand together (spells get a bonus).
  Fx.suitAligned = (g, side, suit) => Fx.suitPower(g, side, suit) >= 2;

  /* ================= 3. PROPHECY ================= */
  Fx.prophesy = function (g, p) {
    if (!g.proph) g.proph = [];
    const pr = Object.assign({ turns: 1, trigger: 'turn', side: g.turn || 'w' }, p);
    if (pr.trigger === 'turn') pr.turns = Math.max(1, pr.turns | 0 || 1);
    g.proph.push(pr);
    return pr;
  };
  Fx.prophecies = g => (g && g.proph) || [];

  function purge(g) {
    // drop prophecies whose marked square no longer exists on this board size
    const n = g.n || 8;
    if (g.proph) g.proph = g.proph.filter(p => p.r >= 0 && p.r < n && p.c >= 0 && p.c < n);
  }

  // Resolve a prophecy's ACT. Returns log strings. `ctx` carries the mover/landing.
  function applyAct(g, p, ctx, events) {
    const side = p.side, act = p.act, out = [];
    if (act === 'shieldOwn') {
      const n = Fx.statusOn(g, Fx.own(g, side).filter(q => q.cell.t !== 'k'), 's', 1, 'shield');
      out.push('The prophecy shields ' + n + ' of your pieces.');
    } else if (act === 'summon') {
      let sq = g.board[p.r] && g.board[p.r][p.c] ? null : { r: p.r, c: p.c };
      if (!sq) { const e = Fx.emptySq(g); sq = e.length ? Fx.rand(e) : null; }
      if (sq) { Fx.place(g, side, p.type, sq.r, sq.c, {}); out.push('The prophecy delivers ' + Fx.pname(p.type) + ' on ' + E.sqName(sq.r, sq.c) + '.'); }
    } else if (act === 'blast') {
      let k = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = p.r + dr, cc = p.c + dc;
        const cell = g.board[rr] && g.board[rr][cc];
        if (!cell || cell.c === side || cell.t === 'k') continue;
        Fx.removeAt(g, rr, cc, {});
        k++;
      }
      out.push('The prophecy detonates — ' + k + ' enemy ' + (k === 1 ? 'piece is' : 'pieces are') + ' consumed.');
    } else if (act === 'freezeMover' || act === 'doomMover' || act === 'poisonMover') {
      const sq = ctx && ctx.landing;
      const cell = sq && g.board[sq.r] && g.board[sq.r][sq.c];
      if (cell) {
        const key = act === 'freezeMover' ? 'f' : act === 'doomMover' ? 'doom' : 'p';
        Fx.mod(cell, key, 1);
        Fx.flash(g, sq.r, sq.c, key === 'f' ? 'freeze' : 'poison', '');
        out.push('The prophecy claims the ' + (MD.pieceName ? MD.pieceName(cell.t) : cell.t) + ' that crossed it!');
      }
    } else if (act === 'veilEnemies') {
      const foes = Fx.enemy(g, side).filter(q => q.cell.t !== 'k');
      const n = Fx.statusOn(g, Fx.uniqN(foes, Math.min(p.n || 2, foes.length)), 'v', 2, 'wind');
      out.push('The prophecy veils ' + n + ' enemy ' + (n === 1 ? 'piece' : 'pieces') + ' in mist.');
    }
    return out;
  }

  // Called from engine.applyMove for real (non-silent) moves.
  MD.Tarot = MD.Tarot || {};
  MD.Tarot.onMove = function (g, mv) {
    if (!g.proph || !g.proph.length) return;
    purge(g);
    const kept = [];
    for (const p of g.proph) {
      const leaves = (p.trigger === 'leave' && p.r === mv.r0 && p.c === mv.c0);
      const enters = (p.trigger === 'enter' && p.r === mv.r1 && p.c === mv.c1);
      if (!leaves && !enters) { kept.push(p); continue; }
      const lines = applyAct(g, p, { landing: { r: mv.r1, c: mv.c1 }, mover: mv.color }, []);
      if (lines.length) { if (!g.hazLog) g.hazLog = []; lines.forEach(t => g.hazLog.push(t)); }
    }
    g.proph = kept;
  };

  // Called from engine.tickAfterMove: suit passives + turn-based prophecies.
  MD.Tarot.ownTurn = function (g, mover, events) {
    events = events || [];
    const T = MD.TROOPS || {};
    // --- suit passives for the mover's attuned pieces ---
    for (let r = 0; r < (g.n || 8); r++) for (let c = 0; c < (g.n || 8); c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== mover) continue;
      const d = T[cell.t];
      const suit = (cell.b && cell.b.suit) || (d && d.suit);
      if (!suit) continue;
      if (cell.b && (cell.b.z > 0 || cell.b.f > 0)) continue; // waking or frozen
      const b = cell.b || (cell.b = { f: 0, s: 0, p: 0 });
      const nm = (d && d.name) || cell.t;
      if (suit === 'wand') {
        const fo = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const t = g.board[r + dr] && g.board[r + dr][c + dc];
          if (t && t.c !== mover && t.t !== 'k') fo.push({ r: r + dr, c: c + dc, cell: t });
        }
        if (fo.length) {
          const pick = Fx.rand(fo);
          const bb = pick.cell.b || (pick.cell.b = { f: 0, s: 0, p: 0 });
          bb.p = Math.max(bb.p || 0, 1);
          events.push({ kind: 'tarot', r: pick.r, c: pick.c, text: nm + ' scorches a neighbour with wand-fire.' });
        }
      } else if (suit === 'cup') {
        if (b.p > 0 || b.f > 0) {
          const was = (b.p > 0);
          b.p = 0; b.f = 0;
          events.push({ kind: 'tarot', r, c, text: nm + (was ? ' washes away its poison.' : ' thaws its own frost.') });
        }
      } else if (suit === 'sword') {
        if (!(b.s > 0)) {
          b.s = 1;
          events.push({ kind: 'tarot', r, c, text: nm + ' raises an airy sword-ward.' });
        }
      } else if (suit === 'pent') {
        let ally = null;
        for (let dr = -1; dr <= 1 && !ally; dr++) for (let dc = -1; dc <= 1 && !ally; dc++) {
          if (!dr && !dc) continue;
          const t = g.board[r + dr] && g.board[r + dr][c + dc];
          if (t && t.c === mover && !(t.b && t.b.s > 0)) ally = t;
        }
        if (ally) {
          if (!ally.b) ally.b = { f: 0, s: 0, p: 0 };
          ally.b.s = 1;
          events.push({ kind: 'tarot', r, c, text: nm + ' fortifies an ally with earth.' });
        }
      }
    }
    // --- prophecy countdowns owned by this side ---
    return MD.Tarot.tickProphecies(g, mover, events);
  };

  MD.Tarot.tickProphecies = function (g, mover, events) {
    events = events || [];
    if (!g.proph || !g.proph.length) return events;
    purge(g);
    const kept = [];
    for (const p of g.proph) {
      if (p.side !== mover || p.trigger !== 'turn') { kept.push(p); continue; }
      p.turns = (p.turns | 0) - 1;
      if (p.turns > 0) { kept.push(p); continue; }
      const lines = applyAct(g, p, null, events);
      lines.forEach(t => events.push({ kind: 'prophecy', r: p.r, c: p.c, text: t }));
    }
    g.proph = kept;
    return events;
  };

  // label helper for the Pedia / card text
  MD.Tarot.suitLabel = s => (SUITS[s] ? SUITS[s].label : s);
  MD.Tarot.suitIcon = s => (SUITS[s] ? SUITS[s].icon : 'gem');
  MD.Tarot.SUITS = SUITS;
})();

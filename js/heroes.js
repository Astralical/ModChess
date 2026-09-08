/* ============================================================
   Mod Chess — LEGENDARY HERO POWERS (set 21: HEROES)
   Twenty heroes from history, myth, legend, folklore & anime,
   each carrying ONE unique banner trick. Powers resolve at the
   end of their OWNER's turn (engine calls Heroes.ownTurn from
   inside tickAfterMove) or right after the hero makes a CAPTURE
   (main.js calls Heroes.onCapture). None of these tricks repeat
   the existing troop vocabulary (counter / aura / artillery /
   regen / sworn / hatch / split / burst / veil / petrify / doom).
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const opp = c => (c === 'w' ? 'b' : 'w');
  const val = t => E.val(t);
  const bd = g => (Fx.bd ? Fx.bd(g) : (g && g.n) || 8);
  const pname = t => (MD.pieceName ? MD.pieceName(t) : t);
  const own = (g, s) => Fx.own(g, s);
  const foe = (g, s) => Fx.enemy(g, s).filter(q => q.cell.t !== 'k'); // never target kings
  const bz = cell => (cell.b || (cell.b = { f: 0, s: 0, p: 0 }));
  const alive = (g, r, c) => !!(g.board[r] && g.board[r][c]);
  const say = (ev, text) => { ev.push({ kind: 'hero', text }); return text; };
  const nameOf = (cell) => { const d = MD.TROOPS[cell.t]; return (d && d.name) || cell.t; };

  // 4-neighbour present cells of a given side around (r,c)
  function near(g, r, c, side, all8) {
    const n = bd(g), out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!all8 && dr && dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      const cell = g.board[rr] && g.board[rr][cc];
      if (cell && (!side || cell.c === side)) out.push({ r: rr, c: cc, cell });
    }
    return out;
  }
  // empty cells (not terrain) among neighbours of (r,c)
  function nearEmpty(g, r, c, all8) {
    const n = bd(g), out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!all8 && dr && dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      if (g.board[rr][cc]) continue;
      if (E.isTerrain && E.isTerrain(g, rr, cc)) continue;
      out.push({ r: rr, c: cc });
    }
    return out;
  }
  function destroy(g, r, c) { Fx.removeAt(g, r, c, { kind: 'hero' }); }
  function grantShield(g, r, c) {
    const cell = g.board[r] && g.board[r][c];
    if (!cell) return false;
    const b = bz(cell); const was = b.s > 0; b.s = 1; return !was;
  }
  function freeze(cell) {
    if (!cell || cell.t === 'k') return false;
    const b = bz(cell); b.f = Math.max(b.f || 0, 1); return true;
  }
  function doomIt(g, cell) {
    if (!cell || cell.t === 'k') return false;
    const b = bz(cell); b.doom = (b.doom || 0) + 1; return true;
  }
  function cleanse(cell) {
    if (!cell || !cell.b) return false;
    const was = cell.b.p > 0 || cell.b.f > 0;
    cell.b.p = 0; cell.b.f = 0; return was;
  }
  function veilIt(cell, t) {
    if (!cell || cell.t === 'k') return false;
    const b = bz(cell); b.v = Math.max(b.v || 0, t || 1); return true;
  }
  function myOwnHalf(g, s, r) {
    const n = bd(g); return s === 'w' ? r >= Math.floor(n / 2) : r < Math.ceil(n / 2);
  }
  function myBackRank(g, s) {
    const n = bd(g); return s === 'w' ? n - 1 : 0;
  }
  function dist(r1, c1, r2, c2) { return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)); }
  function distMan(r1, c1, r2, c2) { return Math.abs(r1 - r2) + Math.abs(c1 - c2); }
  // first enemy along each of 8 straight lines within `range` (unblocked), kings skipped
  function lineTargets(g, r, c, range) {
    const n = bd(g), out = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc, d = 1;
      while (rr >= 0 && rr < n && cc >= 0 && cc < n && d <= range) {
        if (E.terrainAt && E.terrainAt(g, rr, cc)) break;
        const cell = g.board[rr] && g.board[rr][cc];
        if (cell) { if (cell.t !== 'k') out.push({ r: rr, c: cc, cell, d }); break; }
        rr += dr; cc += dc; d++;
      }
    }
    return out;
  }

  // ---------- each hero's unique banner trick ----------
  const H = {
    // ALEXANDER THE GREAT — 'conquest': every capture feeds his legend; each own
    // turn he presses the war onward, smashing the weakest enemy army on the board.
    alexander(g, cell, r, c, def, s, ev) {
      const p = bz(cell).pw | 0;
      if (p <= 0) return;
      const pool = foe(g, s);
      if (!pool.length) return;
      pool.sort((a, b) => val(a.cell.t) - val(b.cell.t));
      const t = pool[0];
      destroy(g, t.r, t.c);
      say(ev, nameOf(cell) + ' crushes the routed ' + nameOf(t.cell) + ' — war never ends.');
    },
    // JULIUS CAESAR — 'imperium': he reads the field; the foe nearest his line is
    // caught — frozen, or if it is a mere pawn it defects and marches for Rome.
    caesar(g, cell, r, c, def, s, ev) {
      const pool = foe(g, s);
      if (!pool.length) return;
      pool.sort((a, b) => dist(r, c, a.r, a.c) - dist(r, c, b.r, b.c) || (val(b.cell.t) - val(a.cell.t)));
      const t = pool[0];
      if (t.cell.t === 'p') {
        t.cell.c = s; t.cell.b = undefined;
        Fx.flash(g, t.r, t.c, 'transform', '');
        say(ev, 'A pawn of ' + nameOf(cell) + '\'s foe sees the eagle and defects to Rome.');
      } else if (freeze(t.cell)) {
        say(ev, nameOf(cell) + ' catches ' + nameOf(t.cell) + ' in his net — it is frozen in place.');
      }
    },
    // SPARTACUS — 'revolt': enslaved pawns beside him break their chains and join him.
    spartacus(g, cell, r, c, def, s, ev) {
      const adj = near(g, r, c, opp(s), false).filter(q => q.cell.t === 'p');
      if (!adj.length) return;
      const pick = adj[Math.floor(Math.random() * adj.length)];
      pick.cell.c = s; pick.cell.b = undefined;
      Fx.flash(g, pick.r, pick.c, 'transform', '');
      say(ev, 'An enslaved pawn rises up and joins ' + nameOf(cell) + '\'s revolt!');
    },
    // HANNIBAL — 'stampede': when he takes a square, the elephants trample every
    // neighbour of that square into frozen terror.
    hannibal(g, cell, r, c, def, s, ev) {
      const adj = near(g, r, c, opp(s), false);
      let n = 0;
      for (const q of adj) if (freeze(q.cell)) n++;
      if (n) say(ev, nameOf(cell) + '\'s stampede freezes ' + n + ' neighbouring enemy piece' + (n > 1 ? 's' : '') + '.');
    },
    // GENGHIS KHAN — 'horde': the steppe answers — each own turn he calls another
    // warhorse to his banner while fewer than three ride.
    genghis(g, cell, r, c, def, s, ev) {
      const horses = own(g, s).filter(q => q.cell.t === 'warhorse');
      if (horses.length >= 3) return;
      const n = bd(g);
      const rows = s === 'w' ? [Math.floor(n / 2), Math.floor(n / 2) + 1, n - 2] : [1, 2, Math.ceil(n / 2) - 1];
      const lines = Fx.summonN(g, s, 'warhorse', 1, { rows });
      if (lines.length) say(ev, nameOf(cell) + ' calls down another warhorse — the horde swells.');
    },
    // NAPOLEON — 'marshal': he leads by column — every friendly on his file and
    // the two adjacent files is braced with a shield (his corps holds the line).
    napoleon(g, cell, r, c, def, s, ev) {
      let n = 0;
      const allies = own(g, s);
      for (const q of allies) {
        if (Math.abs(q.c - c) > 1) continue;
        if (grantShield(g, q.r, q.c)) n++;
      }
      say(ev, nameOf(cell) + '\'s corps holds the line — ' + n + ' friendly piece' + (n === 1 ? ' is' : 's are') + ' shielded.');
    },
    // SUN TZU — 'art of war': victory without battle; the enemy closest to your
    // own King is quietly marked — at the end of ITS own turn it succumbs.
    sunzu(g, cell, r, c, def, s, ev) {
      const king = E.findKing ? E.findKing(g, s) : null;
      const pool = foe(g, s);
      if (!king || !pool.length) return;
      pool.sort((a, b) => dist(king.r, king.c, a.r, a.c) - dist(king.r, king.c, b.r, b.c));
      const t = pool[0];
      if (doomIt(g, t.cell)) say(ev, nameOf(cell) + ' sees the hidden thread — ' + nameOf(t.cell) + ' is marked and will fall.');
    },
    // LEONIDAS — 'phalanx': while brothers stand shoulder to shoulder beside him
    // they all hold the shield wall; alone, he is exposed.
    leonidas(g, cell, r, c, def, s, ev) {
      const adj = near(g, r, c, s, false);
      if (!adj.length) { say(ev, nameOf(cell) + ' stands alone — even a Spartan king needs his phalanx.'); return; }
      let n = 0;
      for (const q of adj) { if (grantShield(g, q.r, q.c)) n++; cleanse(q.cell); }
      if (grantShield(g, r, c)) n++;
      say(ev, nameOf(cell) + ' locks the phalanx — ' + n + ' shield' + (n > 1 ? 's' : '') + ' raised!');
    },
    // GILGAMESH — 'hunt': the king of heroes hunts in straight lines — each own
    // turn he brings down the nearest beast he can see down any line.
    gilgamesh(g, cell, r, c, def, s, ev) {
      const t = lineTargets(g, r, c, 6).sort((a, b) => a.d - b.d || (val(b.cell.t) - val(a.cell.t)))[0];
      if (!t) return;
      destroy(g, t.r, t.c);
      say(ev, nameOf(cell) + ' hunts down ' + nameOf(t.cell) + ' — no monster escapes the king of heroes.');
    },
    // HERCULES — 'labours': each own turn he completes another labour, growing
    // mightier — at 4 he smashes an adjacent foe, at 8 he is warded, at 12 unstoppable.
    hercules(g, cell, r, c, def, s, ev) {
      const b = bz(cell);
      const l = Math.min((b.l || 0) + 1, 12);
      b.l = l;
      let note = ' completes his ' + l + (l === 1 ? 'st' : l === 2 ? 'nd' : l === 3 ? 'rd' : 'th') + ' labour.';
      if (l >= 4) {
        const adj = near(g, r, c, opp(s), false);
        if (adj.length) {
          adj.sort((a, b2) => val(b2.cell.t) - val(a.cell.t));
          destroy(g, adj[0].r, adj[0].c);
          note = ' crushes ' + nameOf(adj[0].cell) + ' and completes his ' + l + (l === 4 ? 'th' : '') + ' labour!';
        }
      }
      if (l >= 8 && grantShield(g, r, c)) note += ' The gods ward his back.';
      say(ev, nameOf(cell) + note);
    },
    // ODIN — 'valhalla': the Allfather calls fallen warriors back — each own turn a
    // slain friend is raised to fight again.
    odin(g, cell, r, c, def, s, ev) {
      const lost = (g.lost && g.lost[s]) || [];
      if (!lost.length) return;
      const lines = Fx.revive(g, s, 1, {});
      if (lines.length) say(ev, nameOf(cell) + ' summons a fallen warrior from Valhalla.');
    },
    // THOR — 'storm': every other own turn Mjölnir arcs — every enemy on his file
    // and rank is frozen in thunder.
    thor(g, cell, r, c, def, s, ev) {
      const b = bz(cell);
      b.alt = (b.alt || 0) + 1;
      if (b.alt % 2 === 0) return;
      const pool = foe(g, s);
      let n = 0;
      for (const q of pool) if (q.r === r || q.c === c) if (freeze(q.cell)) n++;
      if (n) say(ev, nameOf(cell) + ' calls down the storm — ' + n + ' enemy' + (n > 1 ? 's are' : ' is') + ' frozen on his line!');
    },
    // SUN WUKONG — 'clones': plucks a hair — a monkey-clone (Imp) appears beside him.
    sunwukong(g, cell, r, c, def, s, ev) {
      const clones = own(g, s).filter(q => q.cell.t === 'imp');
      if (clones.length >= 2) return;
      const spots = nearEmpty(g, r, c, false);
      if (!spots.length) return;
      const sp = spots[Math.floor(Math.random() * spots.length)];
      Fx.place(g, s, 'imp', sp.r, sp.c, {});
      say(ev, nameOf(cell) + ' plucks a hair — a monkey-clone springs into being.');
    },
    // MOMOTARO — 'companions': the Peach Boy travels with his dog, monkey & pheasant.
    momotaro(g, cell, r, c, def, s, ev) {
      const want = ['divinedog', 'imp', 'harpy'].filter(t => !own(g, s).some(q => q.cell.t === t));
      if (!want.length) return;
      const spots = nearEmpty(g, r, c, true);
      if (!spots.length) return;
      const sp = spots[Math.floor(Math.random() * spots.length)];
      const type = want[Math.floor(Math.random() * want.length)];
      Fx.place(g, s, type, sp.r, sp.c, {});
      say(ev, 'A companion (' + pname(type) + ') rallies to ' + nameOf(cell) + '.');
    },
    // ANANSI — 'web': the spider freezes the nearest foe in silk; a caught neighbour
    // is also bitten with venom.
    anansi(g, cell, r, c, def, s, ev) {
      const pool = foe(g, s);
      if (!pool.length) return;
      pool.sort((a, b) => dist(r, c, a.r, a.c) - dist(r, c, b.r, b.c));
      const t = pool[0];
      let ok = false;
      if (dist(r, c, t.r, t.c) === 1) {
        ok = freeze(t.cell) | 0;
        const b = bz(t.cell); b.p = Math.max(b.p || 0, 1); ok = 1;
        say(ev, nameOf(cell) + ' snares ' + nameOf(t.cell) + ' in silk and venom.');
      } else if (freeze(t.cell)) {
        ok = 1;
        say(ev, nameOf(cell) + ' weaves — ' + nameOf(t.cell) + ' is caught fast.');
      }
      if (!ok) return;
    },
    // ROBIN HOOD — 'outlaw': while any richer foe stands, he takes from the rich —
    // the mightiest enemy is robbed of its power.
    robinhood(g, cell, r, c, def, s, ev) {
      const pool = foe(g, s).filter(q => val(q.cell.t) >= val(cell.t) || val(q.cell.t) >= 500);
      if (!pool.length) return;
      pool.sort((a, b) => val(b.cell.t) - val(a.cell.t));
      const t = pool[0];
      grantShield(g, r, c);
      if (MD.TROOPS[t.cell.t]) { if (doomIt(g, t.cell)) say(ev, nameOf(cell) + ' robs the rich — ' + nameOf(t.cell) + ' is marked for the poor.'); }
      else {
        Fx.downgradeSq(g, [{ r: t.r, c: t.c }]);
        say(ev, nameOf(cell) + ' takes from the rich — ' + nameOf(t.cell) + ' is robbed of its power.');
      }
    },
    // KING ARTHUR — 'excalibur': the sword in the stone cleaves whatever stands
    // directly before him.
    arthur(g, cell, r, c, def, s, ev) {
      const fwd = s === 'w' ? -1 : 1; // toward enemy side (white toward row0)
      const n = bd(g);
      for (let rr = r + fwd, d = 1; rr >= 0 && rr < n && d <= 4; rr += fwd, d++) {
        if (E.terrainAt && E.terrainAt(g, rr, c)) break;
        const t = g.board[rr] && g.board[rr][c];
        if (t) {
          if (t.c !== s && t.t !== 'k') { destroy(g, rr, c); say(ev, nameOf(cell) + ' draws Excalibur — ' + nameOf(t) + ' falls before the sword in the stone.'); }
          break;
        }
      }
    },
    // BEOWULF — 'slayer': he grapples monsters, not men — an adjacent custom troop
    // is destroyed, an ordinary man is merely frozen in awe.
    beowulf(g, cell, r, c, def, s, ev) {
      const adj = near(g, r, c, opp(s), false);
      if (!adj.length) return;
      const monster = adj.find(q => MD.TROOPS[q.cell.t]);
      if (monster) { destroy(g, monster.r, monster.c); say(ev, nameOf(cell) + ' tears the monster ' + nameOf(monster.cell) + ' apart with his bare hands!'); return; }
      const man = adj[Math.floor(Math.random() * adj.length)];
      if (freeze(man.cell)) say(ev, nameOf(cell) + '\'s roar freezes ' + nameOf(man.cell) + ' in place.');
    },
    // GOKU — 'zenkai': every capture charges his spirit; once it reaches two bars
    // he unleashes a spirit wave that blasts the mightiest reachable foe.
    goku(g, cell, r, c, def, s, ev) {
      const b = bz(cell);
      b.ki = (b.ki || 0) + (b.pw || 0);
      if ((b.ki || 0) < 2) return;
      const targets = lineTargets(g, r, c, 6);
      if (!targets.length) { b.ki = Math.min(b.ki || 0, 1); return; }
      targets.sort((a, b2) => val(b2.cell.t) - val(a.cell.t) || a.d - b2.d);
      const t = targets[0];
      b.ki = 0; // spirit spent
      destroy(g, t.r, t.c);
      say(ev, nameOf(cell) + ' fires a spirit wave — ' + nameOf(t.cell) + ' is blasted away!');
    },
    // MULAN — 'disguise': she slips into the enemy host — the foe in front of her is
    // frozen by her ruse and she hides herself in living mist.
    mulan(g, cell, r, c, def, s, ev) {
      const fwd = s === 'w' ? -1 : 1;
      const n = bd(g);
      let hidden = false;
      for (let rr = r + fwd; rr >= 0 && rr < n; rr += fwd) {
        const t = g.board[rr] && g.board[rr][c];
        if (t) {
          if (t.c !== s && t.t !== 'k' && freeze(t)) {
            veilIt(cell, 1);
            say(ev, nameOf(cell) + ' slips into the enemy line — ' + nameOf(t) + ' hesitates, and she vanishes into mist.');
            hidden = true;
          }
          break;
        }
      }
      if (!hidden) { say(ev, nameOf(cell) + ' scans the field, waiting for the right moment.'); }
    }
  };

  // called from engine tickAfterMove for each own hero at end of its owner's turn
  function ownTurn(g, cell, r, c, def, s, events) {
    const fn = H[def.hp];
    if (fn) fn(g, cell, r, c, def, s, events);
  }

  // called from main.js right after a hero makes a capture. Every hero grows in
  // legend from each conquest (b.pw); specific heroes spend that power at the end
  // of their own turns (Alexanders conquest, Goku's spirit wave). Keeping the
  // *visible* tricks on the own-turn hook means they fire identically in every
  // mode (two-player, vs AI and campaign) without extra per-capture wiring.
  function onCapture(g, r, c, s) {
    const cell = g.board[r] && g.board[r][c];
    if (!cell || cell.c !== s) return;
    const def = MD.TROOPS[cell.t];
    if (!def || !def.hero) return;
    bz(cell).pw = (bz(cell).pw || 0) + 1;
    return [];
  }

  MD.Heroes = { ownTurn, onCapture, powerList: Object.keys(H) };
})();

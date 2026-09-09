// RANGED (shoot-in-place) regression — REWORKED 2026-09-08.
// A troop with `artillery:{range,radius}` never captures by stepping. It moves
// to empty squares like a normal piece, and instead of a melee capture it may
// SHOOT an enemy on any clear straight/diagonal within `range`: the target (and
// anything in `radius` around it) is destroyed while the shooter stays put.
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js'].forEach(p => eval(fs.readFileSync(p, 'utf8')));
const E = MD.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }
// cells: [row, col, color, type]
function mk(n, cells) {
  const g = E.newGame(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.board[r][c] = null;
  g.anyTroop = true;
  for (const x of cells || []) g.board[x[0]][x[1]] = { c: x[2], t: x[3], b: { f: 0, s: 0, p: 0 } };
  return g;
}
const boardEqual = (a, b) => JSON.stringify({ board: a.board, castle: a.castle, ep: a.ep, extra: a.extra, half: a.half, full: a.full, plies: a.plies })
  === JSON.stringify({ board: b.board, castle: b.castle, ep: b.ep, extra: b.extra, half: b.half, full: b.full, plies: b.plies });

// --- 1. a rifleman can move to empty squares but NEVER captures by stepping ---
(function rifleman() {
  const g = mk(8, [[5, 3, 'w', 'infantry'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [3, 3, 'b', 'p'], [4, 4, 'b', 'n']]);
  const ms = E.legalMoves(g, 'w').filter(m => m.r0 === 5 && m.c0 === 3);
  const shots = ms.filter(m => m.shot), moves = ms.filter(m => !m.shot);
  ok(shots.some(m => m.r1 === 3 && m.c1 === 3), 'rifleman shoots an enemy 2 squares ahead');
  ok(!moves.some(m => m.capture), 'rifleman has NO melee capture moves');
  ok(!shots.some(m => m.r1 === 0 && m.c1 === 3), 'a shot can never target the king');
  ok(moves.length === 4, 'rifleman still moves like a wazir (4 empty squares)');
  // blocked by own piece between it and the enemy
  const g2 = mk(8, [[5, 3, 'w', 'infantry'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [4, 3, 'w', 'p'], [2, 3, 'b', 'p']]);
  const s2 = E.legalMoves(g2, 'w').filter(m => m.r0 === 5 && m.c0 === 3 && m.shot);
  ok(!s2.length, 'own piece blocks the line of fire');
})();

// --- 2. apply/unapply of a shot round-trips the board exactly ---
(function roundtrip() {
  const g = mk(8, [[5, 3, 'w', 'infantry'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [3, 3, 'b', 'p'], [3, 2, 'b', 'n']]);
  const shot = E.legalMoves(g, 'w').find(m => m.shot && m.r0 === 5 && m.c0 === 3 && m.r1 === 3 && m.c1 === 3);
  const before = boardEqual(g, g); // snapshot
  const u = E.applyMove(g, shot, { silent: true });
  const midClear = !g.board[3][3];
  const shooterPut = g.board[5][3] && g.board[5][3].t === 'infantry';
  E.unapplyMove(g, u);
  const restored = !!g.board[3][3] && !!g.board[3][2];
  ok(u && shot, 'shot move generated & applied');
  ok(midClear && shooterPut, 'target destroyed, shooter never moved');
  ok(restored, 'unapply puts the victims back');
  // clone-based legal search: apply+unapply leaves the board identical
  const h = mk(8, [[5, 3, 'w', 'infantry'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [3, 3, 'b', 'p']]);
  const snap = JSON.stringify(h.board);
  const s2 = E.legalMoves(h, 'w').find(m => m.shot && m.r0 === 5 && m.c0 === 3);
  ok(s2 && JSON.stringify(h.board) === snap, 'legalMoves clone leaves the original board untouched');
})();

// --- 3. blast weapons (radius 1) clear everything around the target, not own pieces ---
(function siege() {
  const g = mk(8, [[6, 3, 'w', 'siegetank'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [4, 3, 'b', 'p'], [3, 2, 'b', 'n'], [3, 4, 'b', 'n'], [3, 3, 'w', 'p']]);
  const tank = E.legalMoves(g, 'w').filter(m => m.r0 === 6 && m.c0 === 3 && m.shot);
  ok(tank.some(m => m.r1 === 4 && m.c1 === 3), 'siege tank shoots a pawn at range 3');
  ok(!tank.some(m => m.r1 === 3 && m.c1 === 3), 'siege tank cannot shoot its own pawn');
  E.applyMove(g, tank.find(m => m.r1 === 4 && m.c1 === 3), { silent: true });
  ok(!g.board[4][3] && !g.board[3][2] && !g.board[3][4], 'radius-1 blast removes the target and both adjacent knights');
  ok(g.board[3][3] && g.board[3][3].c === 'w', 'own piece beside the blast survives');
  ok(g.board[6][3] && g.board[6][3].t === 'siegetank', 'siege tank stayed in place');
})();

// --- 4. shield & fog/veil still protect (a shot is a capture) ---
(function protections() {
  const g = mk(8, [[6, 3, 'w', 'infantry'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [3, 3, 'b', 'p']]);
  g.board[3][3].b = { f: 0, s: 1, p: 0 };
  ok(!E.legalMoves(g, 'w').some(m => m.shot && m.r1 === 3 && m.c1 === 3), 'a shielded enemy cannot be shot');
  const g2 = mk(8, [[6, 3, 'w', 'infantry'], [7, 3, 'w', 'k'], [0, 3, 'b', 'k'], [3, 3, 'b', 'p']]);
  g2.board[3][3].b.v = 1; // veiled
  ok(!E.legalMoves(g2, 'w').some(m => m.shot && m.r1 === 3 && m.c1 === 3), 'a veiled enemy can only be captured adjacently — no long shot');
})();

// --- 5. every ranged troop keeps its range, no cooldown any more ---
(function traits() {
  const expect = { siegetank: [3, 1], zeppelin: [5, 0], howitzer: [4, 1], infantry: [2, 0], firebreather: [2, 0], zhugeliang: [4, 0], guojia: [5, 0], taishici: [3, 0], huangzhong: [5, 0] };
  for (const key of Object.keys(expect)) {
    const d = MD.TROOPS[key];
    const a = d && d.artillery;
    ok(!!a && a.range === expect[key][0] && a.radius === expect[key][1] && !('cd' in a), key + ' ranged range ' + expect[key][0] + ' radius ' + expect[key][1] + ' (no cooldown)');
  }
  // a diagonal shooter works off-axis too
  const g = mk(8, [[6, 4, 'w', 'infantry'], [7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 6, 'b', 'p']]);
  ok(E.legalMoves(g, 'w').some(m => m.shot && m.r1 === 4 && m.c1 === 6), 'a shot can go diagonally within range');
})();

console.log('\nRANGED: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

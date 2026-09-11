// PUSH/SLIDE regression — abilities that move whole groups of pieces must move
// each piece EXACTLY as documented (one square), and must treat both colours
// identically. The old code scanned the board and relocated pieces inline, so a
// piece could be re-visited after it moved and slide many squares — and only for
// whichever colour moved in the scan direction (the reported "black pawn shoved
// from 6 to 3 while white never moved" bug). Fx.shove() fixes that.
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/heroes.js', 'js/tarot.js',
  'js/abilities_1.js', 'js/abilities_2.js', 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js',
  'js/abilities_7.js', 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js', 'js/abilities_12.js',
  'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js', 'js/abilities_17.js', 'js/abilities_18.js',
  'js/abilities_19.js', 'js/abilities_20.js', 'js/abilities_21.js', 'js/abilities_22.js', 'js/abilities_index.js', 'js/rebalance.js'].forEach(p => eval(fs.readFileSync(p, 'utf8')));
const M = globalThis.MD, E = M.Engine, N = 8;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }
function seeded(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// one piece of each type per colour (no value/type ties → unambiguous tracking)
const BASE = [[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [6, 2, 'w', 'p'], [6, 6, 'b', 'p'],
  [5, 0, 'w', 'n'], [2, 7, 'b', 'n'], [5, 2, 'w', 'b'], [2, 5, 'b', 'b'],
  [3, 1, 'w', 'r'], [3, 6, 'b', 'r']];
function build(mirror) {
  const g = E.newGame(N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g.board[r][c] = null;
  for (const [r, c, col, t] of BASE) {
    const rr = mirror ? N - 1 - r : r, cl = mirror ? (col === 'w' ? 'b' : 'w') : col;
    g.board[rr][c] = { c: cl, t: t, b: { f: 0, s: 0, p: 0 } };
  }
  g.anyTroop = true; g.anyHero = true;
  return g;
}
const origins = mirror => BASE.map(([r, c, col, t]) => ({ r: mirror ? N - 1 - r : r, c, col: mirror ? (col === 'w' ? 'b' : 'w') : col, t }));
function disp(g, o, color) {
  const out = [];
  for (const x of o) {
    if (x.col !== color) continue;
    let f = null;
    for (let r = 0; r < N && !f; r++) for (let c = 0; c < N; c++) { const q = g.board[r][c]; if (q && q.c === x.col && q.t === x.t) { f = { r, c }; break; } }
    if (f) out.push([Math.abs(f.r - x.r), Math.abs(f.c - x.c)]);
  }
  return out;
}

// abilities that move groups of pieces, each documented as ONE square
const SINGLE_STEP = [18, 19, 74, 134, 194, 195, 269, 280, 310, 332, 345, 403];
const flag = [];
for (const id of SINGLE_STEP.concat([93])) {
  const ab = MD.abilityById(id);
  if (!ab) { flag.push(id + ' missing'); continue; }
  // --- run A (white, upright board) ---
  Math.random = seeded(1357);
  const oA = origins(false), gA = build(false);
  MD.cast(gA, ab, 'w', null);
  const aOwn = disp(gA, oA, 'w'), aFoe = disp(gA, oA, 'b');
  // --- run B (black, mirrored board) — must be the identical picture ---
  Math.random = seeded(1357);
  const oB = origins(true), gB = build(true);
  MD.cast(gB, ab, 'b', null);
  const bOwn = disp(gB, oB, 'b'), bFoe = disp(gB, oB, 'w');
  // 1) no piece may move more than one square
  const maxOwn = Math.max(0, ...aOwn.map(d => Math.max(d[0], d[1])), ...aFoe.map(d => Math.max(d[0], d[1])));
  if (maxOwn > 1) flag.push(id + ' ' + ab.name + ': piece moved ' + maxOwn + ' squares (max 1 allowed)');
  // 2) both colours must be treated identically (mirror symmetry)
  const key = arr => arr.map(d => d[0] + ':' + d[1]).sort().join(',');
  if (key(aOwn) !== key(bOwn) || key(aFoe) !== key(bFoe)) {
    flag.push(id + ' ' + ab.name + ': asymmetric  own[' + key(aOwn) + '] vs mirrored[' + key(bOwn) + ']  foe[' + key(aFoe) + '] vs [' + key(bFoe) + ']');
  }
}

ok(flag.length === 0, 'all push abilities move each piece at most ONE square and are colour-symmetric' + (flag.length ? '\n      ' + flag.join('\n      ') : ''));

// --- the exact reported case: Tide of War must not fling a black pawn from 6 to 3 ---
(function tide() {
  const g = build(false);
  Math.random = seeded(99);
  MD.cast(g, MD.abilityById(134), 'w', null);
  let col = -1;
  for (let c = 0; c < N; c++) { const q = g.board[6][c]; if (q && q.c === 'b' && q.t === 'p') col = c; }
  const before = 6;
  const after = [5, 6, 7].map(r => (g.board[r][6] && g.board[r][6].c === 'b' && g.board[r][6].t === 'p') ? r : -1).find(r => r >= 0);
  ok(after === 5 || after === 7, 'Tide of War pushes the black pawn exactly one square (6 -> ' + (after === undefined ? 'stayed' : after) + ')');
})();

// --- Fx.shove itself never processes a piece twice ---
(function shoveUnit() {
  const g = E.newGame(N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g.board[r][c] = null;
  g.board[0][0] = { c: 'w', t: 'n', b: { f: 0, s: 0, p: 0 } };
  const moved = MD.Fx.shove(g, [{ r: 0, c: 0 }], { dr: 1, dc: 0 }, { steps: 8 });
  ok(moved === 7 && g.board[7][0] && g.board[7][0].t === 'n', 'shove honours an explicit multi-step request (7 squares)');
  const g2 = E.newGame(N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g2.board[r][c] = null;
  g2.board[3][0] = { c: 'w', t: 'n', b: { f: 0, s: 0, p: 0 } };
  const one = MD.Fx.shove(g2, [{ r: 3, c: 0 }], { dr: 1, dc: 0 }, { steps: 1 });
  ok(one === 1 && g2.board[4][0], 'shove with steps:1 moves exactly one square');
  // a blocked piece stays put
  const g3 = E.newGame(N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) g3.board[r][c] = null;
  g3.board[3][0] = { c: 'w', t: 'n', b: { f: 0, s: 0, p: 0 } };
  g3.board[4][0] = { c: 'b', t: 'p', b: { f: 0, s: 0, p: 0 } };
  ok(MD.Fx.shove(g3, [{ r: 3, c: 0 }], { dr: 1, dc: 0 }, { steps: 1 }) === 0, 'a blocked piece does not move (and never jumps)');
})();

console.log('\nPUSH: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

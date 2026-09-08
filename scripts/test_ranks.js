// Dimensional back/front-rank regression: rank-summoning abilities must place
// pieces on the correct rows for board sizes 6/8/10/12.
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/heroes.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js',
 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js', 'js/abilities_18.js', 'js/abilities_19.js', 'js/abilities_20.js', 'js/abilities_21.js',
 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const lib = globalThis.MD, E = lib.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }

function blank(n, side) {
  const g = E.newGame(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.board[r][c] = null;
  // kings out of the way (rank helpers still fine without them)
  g.board[n - 1][0] = { c: 'w', t: 'k' };
  g.board[0][n - 1] = { c: 'b', t: 'k' };
  return g;
}
const h = n => n >> 1;

// id -> (n, side) => allowed row set for newly summoned pieces of expected type
const cases = [
  { id: 72, type: 'q', rows: (n, s) => [s === 'w' ? n - 1 : 0] },            // back rank
  { id: 73, type: 'p', rows: (n, s) => s === 'w' ? [h(n) - 1, h(n), h(n) + 1] : [h(n) - 2, h(n) - 1, h(n)] }, // front three
  { id: 402, type: 'r', rows: (n, s) => s === 'w' ? [n - 1, n - 2] : [0, 1] }, // back two ranks
  { id: 399, type: 'p', rows: (n, s) => s === 'w' ? Array.from({ length: h(n) }, (_, i) => i) : Array.from({ length: n - h(n) }, (_, i) => h(n) + i) }, // enemy half
  { id: 145, type: 'r', rows: (n, s) => [s === 'w' ? n - 1 : 0] },            // back rank corners
  { id: 137, type: 'p', rows: (n, s) => [s === 'w' ? n - 2 : 1] },            // pawn home rank
  { id: 427, type: 'treant', rows: (n, s) => [h(n) - 1, h(n)] },              // centre rows
];

for (const n of [6, 8, 10, 12]) {
  for (const side of ['w', 'b']) {
    for (const cse of cases) {
      const ab = lib.abilityById(cse.id);
      if (!ab) { ok(false, 'ability ' + cse.id + ' exists'); continue; }
      const g = blank(n, side);
      const before = new Set();
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g.board[r][c]) before.add(r + ',' + c);
      const t = lib.botTarget(g, ab, side);
      const res = lib.cast(g, ab, side, t);
      if (res.error) { ok(false, '#' + cse.id + ' ' + ab.name + ' n=' + n + ' ' + side + ' error: ' + (res.lines || []).join('|')); continue; }
      const allowed = cse.rows(n, side);
      const newOnes = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const cell = g.board[r][c];
        if (cell && cell.c === side && cell.t === cse.type && !before.has(r + ',' + c)) newOnes.push({ r, c });
      }
      if (!newOnes.length) { ok(false, '#' + cse.id + ' ' + ab.name + ' n=' + n + ' ' + side + ': nothing summoned'); continue; }
      const bad = newOnes.filter(q => !allowed.includes(q.r));
      ok(bad.length === 0, '#' + cse.id + ' ' + ab.name + ' n=' + n + ' ' + side + ' rows within ' + JSON.stringify(allowed) + (bad.length ? ' -> BAD ' + JSON.stringify(bad) : ' (' + newOnes.length + ' placed)'));
    }
  }
}
console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

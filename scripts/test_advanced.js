// Most-advanced direction + summon-sick-no-attack regression.
const fs = require('fs');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(p, 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js',
 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js', 'js/abilities_18.js', 'js/abilities_19.js', 'js/abilities_20.js', 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const MD2 = globalThis.MD, E = MD2.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }
function clean(n) { const g = E.newGame(n); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.board[r][c] = null; return g; }

// --- 1. most advanced OWN pawn (ability 592: promote most advanced pawn to QUEEN)
{
  const g = clean(8);
  g.board[7][4] = { c: 'w', t: 'k' };   // white king home
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[6][0] = { c: 'w', t: 'p' };   // back-rank pawn (b1) — NOT most advanced
  g.board[4][3] = { c: 'w', t: 'p' };   // advanced pawn (d4) — should be promoted
  const ab = MD2.abilityById(592);
  MD2.cast(g, ab, 'w', MD2.botTarget(g, ab, 'w'));
  const queen = (() => { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].c === 'w' && g.board[r][c].t === 'q') return { r, c }; return null; })();
  ok(queen && queen.r === 4 && queen.c === 3, 'most advanced OWN pawn promoted (d4) -> got ' + (queen ? queen.r + ',' + queen.c : 'none'));
  ok(g.board[6][0] && g.board[6][0].t === 'p', 'back-rank pawn left untouched');
}

// --- 2. most advanced ENEMY (ability 578: destroy enemy's most advanced piece)
{
  const g = clean(8);
  g.board[7][4] = { c: 'w', t: 'k' };
  g.board[0][7] = { c: 'b', t: 'k' };
  g.board[1][0] = { c: 'b', t: 'p' };   // black pawn still near its home (top)
  g.board[5][0] = { c: 'b', t: 'r' };   // black rook advanced deep toward white -> most advanced
  const ab = MD2.abilityById(578);
  MD2.cast(g, ab, 'w', MD2.botTarget(g, ab, 'w'));
  ok(!g.board[5][0], 'most advanced ENEMY destroyed (rook at r5)');
  ok(g.board[1][0] && g.board[1][0].t === 'p', 'rearmost enemy pawn survives');
}

// --- 3. summon-sick pieces do NOT attack (knight can't check a king while sick)
{
  const g = clean(8);
  g.board[4][4] = { c: 'w', t: 'k' };
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[2][3] = { c: 'b', t: 'n', b: { f: 0, s: 0, p: 0, z: 1 } }; // sick knight attacks (4,4)
  ok(E.inCheck(g, 'w') === false, 'sick knight gives NO check (inCheck=false)');
  ok(E.attacked(g, 4, 4, 'b') === false, 'sick knight attacks nothing (attacked=false)');
  g.board[2][3].b.z = 0; // it wakes up
  ok(E.inCheck(g, 'w') === true, 'awake knight gives check');
}

// --- 4. summon-sick custom TROOP does not attack either
{
  const g = clean(8);
  g.board[4][4] = { c: 'w', t: 'k' };
  g.board[0][7] = { c: 'b', t: 'k' };
  g.board[1][6] = { c: 'b', t: 'seaserpent', b: { f: 0, s: 0, p: 0, z: 1 } };
  g.anyTroop = true;
  ok(E.attacked(g, 4, 4, 'b') === false, 'sick Sea Serpent attacks nothing');
}

console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

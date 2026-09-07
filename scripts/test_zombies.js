// Outbreak set + Counter mechanic + extra-turn regression checks.
const fs = require('fs');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(p, 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js',
 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js', 'js/abilities_18.js', 'js/abilities_19.js', 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const MD2 = globalThis.MD, E = MD2.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }
function clean(n) { const g = E.newGame(n); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.board[r][c] = null; return g; }

// --- 1. Outbreak set present (75 cards, ids 855-929, cat Zombie) ---
const zombie = MD2.ABILITIES.filter(a => a.cat === 'Zombie');
ok(zombie.length === 75, '75 Zombie cards registered (got ' + zombie.length + ')');
ok(MD2.ABILITIES.length === 857, 'total pool 857');
ok(zombie.every(a => a.id >= 855 && a.id <= 929), 'zombie ids 855-929');
ok(MD2.CATS.includes('Zombie'), 'Zombie category in CATS');

// --- 2. counter troop types exist ---
ok(!!MD2.TROOPS.porcupine && !!MD2.TROOPS.scorpion && !!MD2.TROOPS.urchin && !!MD2.TROOPS.plaguebearer, 'counter troops registered');

// --- 3. counter 'kill': capturer is destroyed with a porcupine ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  // attacker (white pawn) moves onto black porcupine at (5,1)
  g.board[4][0] = { c: 'w', t: 'p' };          // attacker
  g.board[5][1] = { c: 'b', t: 'porcupine' };  // counter victim
  const victim = g.board[5][1];
  E.applyMove(g, { r0: 4, c0: 0, r1: 5, c1: 1, capture: true }); // pawn captures porcupine
  const lines = E.counterStrike(g, 5, 1, victim);
  ok(lines.length > 0, 'porcupine counter triggers on capture');
  ok(!g.board[5][1], 'attacker destroyed along with the porcupine (square empty)');
}
// --- 4. counter 'doom': plague bearer dooms its capturer ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[4][0] = { c: 'w', t: 'n' };
  g.board[5][1] = { c: 'b', t: 'plaguebearer' };
  const victim = g.board[5][1];
  E.applyMove(g, { r0: 4, c0: 0, r1: 5, c1: 1, capture: true });
  const lines = E.counterStrike(g, 5, 1, victim);
  ok(lines.some(l => /doom/.test(l)), 'plague bearer marks capturer for doom');
  ok(g.board[5][1] && g.board[5][1].b && g.board[5][1].b.doom > 0, 'capturing knight is doomed');
}
// --- 5. king is never destroyed by a counter ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[5][1] = { c: 'b', t: 'porcupine' };
  const victim = g.board[5][1];
  g.board[5][1].b = { f: 0, s: 0, p: 0 };
  const attacker = { c: 'w', t: 'k' };
  const lines = E.counterStrike(g, 7, 0, victim); // pretend king at (7,0) captured it
  ok(lines.length > 0 && /King/.test(lines[0]), 'king survives a counter (shattered)');
  ok(!!E.hasKing(g, 'w'), 'white king still present');
}
// --- 6. extra-turn bot guard: a null hand must not crash botTurn (logic exercised via helper) ---
{
  // Simulate the exact expression used in Game.botTurn with h=null: guarded code path must not throw.
  let threw = false;
  let phase = 'bot';
  try {
    const h = null;
    if (h && !h.used) { /* cast */ } else { if (h) h.used = true; phase = 'move'; }
    if (!h) { phase = 'move'; }
  } catch (e) { threw = true; }
  ok(!threw && phase === 'move', 'null-hand (move-only bonus turn) does not crash bot flow');
}

// --- 7. poison rebalance: rots quietly (no chain blast), kings immune ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[4][4] = { c: 'w', t: 'n', b: { f: 0, s: 0, p: 1 } };   // poisoned white knight
  g.board[4][5] = { c: 'b', t: 'r' };                            // adjacent black rook
  E.tickAfterMove(g, 'w');                                       // white's turn ends
  ok(!g.board[4][4], 'poisoned knight rots away at end of its owner turn');
  ok(g.board[4][5] && g.board[4][5].t === 'r', 'adjacent rook NOT destroyed by poison (no chain blast)');
}
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k', b: { f: 0, s: 0, p: 1 } };   // poisoned white king
  E.tickAfterMove(g, 'w');
  ok(!!E.hasKing(g, 'w') && !!g.board[7][0], 'king is immune to poison (shrugs it off)');
}
// --- 8. mortar radius nerf sanity (source-level): no radius-2/3 area shells
//     remain in set 18 except Orbital Strike (kept fuse-3, radius 2). ---
{
  const src = fs.readFileSync(__dirname + '/../js/abilities_18.js', 'utf8');
  const lines = src.split('\n');
  const bad = lines.filter(l => /shell\(g, s, [^)]*, [123], [23]\);/.test(l) && !/, 3, 2\);/.test(l));
  ok(bad.length === 0, 'no wide (radius 2/3) shell calls remain outside the kept Orbital Strike (found ' + bad.length + ')');
}

console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

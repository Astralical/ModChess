// Validate the 200 abilities: syntax, count, uniqueness, and no crashes on dry-runs.
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js',
 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js',
 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const lib = globalThis.MD, E = lib.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }

ok(Array.isArray(MD.ABILITIES), 'ABILITIES is array');
ok(MD.ABILITIES.length === 729, 'exactly 729 abilities (got ' + MD.ABILITIES.length + ')');

// build a lively mid-game-ish board via random legal plies
function lively() {
  const g = E.newGame();
  let guard = 0;
  while (guard++ < 40 && !g.over) {
    const side = g.turn;
    const moves = E.legalMoves(g, side);
    if (!moves.length) break;
    const m = moves[Math.floor(Math.random() * moves.length)];
    E.applyMove(g, m);
    g.turn = E.opp(side);
    if (guard % 4 === 0) {
      // sprinkle statuses occasionally
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const cell = g.board[r][c];
        if (cell && Math.random() < 0.1) cell.b = { f: Math.random() < .5 ? 1 : 0, s: Math.random() < .5 ? 1 : 0, p: Math.random() < .4 ? 1 : 0 };
      }
    }
  }
  return g;
}

let crashes = 0, kingsLost = 0;
const crashList = {};
lib.ABILITIES.forEach(ab => {
  for (let iter = 0; iter < 3; iter++) {
    const g = lively();
    const side = iter % 2 ? 'w' : 'b';
    const t = lib.botTarget(g, ab, side);
    const res = lib.cast(g, ab, side, t);
    if (!Array.isArray(res.lines)) { crashes++; crashList[ab.id + ' ' + ab.name] = 'no lines'; }
    if (res.error) { crashes++; crashList[ab.id + ' ' + ab.name] = res.lines.join('|'); }
    try { E.legalMoves(g, side); } catch (e) { crashes++; crashList[ab.id + ' ' + ab.name] = 'legalMoves: ' + e.message; }
    // no spell may remove a king directly (no instant wins)
    if (!E.hasKing(g, 'w') || !E.hasKing(g, 'b')) { kingsLost++; crashList[ab.id + ' ' + ab.name] = 'removed a king'; }
  }
});
ok(crashes === 0, 'no ability crashed across dry-runs (crashes=' + crashes + ')');
ok(kingsLost === 0, 'no ability removes a king (instant-win) across dry-runs');
if (crashes) Object.entries(crashList).slice(0, 20).forEach(([k, v]) => console.log('   ✗', k, '::', v));

// Assassinate must NOT remove the king (no instant wins) but should hit the court
{
  const g = E.newGame();
  const ab = lib.abilityById(47);
  lib.cast(g, ab, 'w', null);
  ok(E.hasKing(g, 'b'), 'Assassinate no longer removes the king');
  let rooks = 0, queens = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const cell = g.board[r][c];
    if (cell && cell.c === 'b') { if (cell.t === 'r') rooks++; if (cell.t === 'q') queens++; }
  }
  ok(rooks === 0 && queens === 0, 'Assassinate destroys the enemy court (rooks+queens)');
}

// Wild Magic never calls itself infinitely (guarded in index via id filter + single chain)
{
  const g = E.newGame();
  const ab = lib.abilityById(177);
  const res = lib.cast(g, ab, 'w', null);
  ok(Array.isArray(res.lines), 'Wild Magic returns lines');
}

// troop summons actually place custom creatures; fresh summons cannot act until their owner's next turn
{
  const g = E.newGame();
  lib.cast(g, lib.abilityById(12), 'w', null); // Summon Imp
  let imps = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].t === 'imp') imps++;
  ok(imps === 1 && g.anyTroop, 'Summon Imp places an Imp troop');
  const movesNow = E.legalMoves(g, 'w').some(m => g.board[m.r0][m.c0].t === 'imp');
  ok(!movesNow, 'freshly summoned Imp cannot move/capture on its first turn');
  // after the owner finishes a turn the summon is ready
  const any = E.legalMoves(g, 'w');
  if (any.length) { E.applyMove(g, any[0]); E.tickAfterMove(g, 'w'); }
  const movesNext = E.legalMoves(g, 'w').some(m => g.board[m.r0][m.c0] && g.board[m.r0][m.c0].t === 'imp');
  ok(movesNext, 'the Imp can act from the owner\'s next turn');
}
{
  const g = E.newGame();
  lib.cast(g, lib.abilityById(201), 'w', null); // Summon Goblin
  let gobs = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].t === 'goblin') gobs++;
  ok(gobs === 1, 'Summon Goblin places a Goblin');
}
{
  const g = E.newGame();
  lib.cast(g, lib.abilityById(221), 'w', null); // stratagem Deceive the Sky (teleport) must not crash
  ok(!g.over, 'stratagem runs without ending the game');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail || crashes ? 1 : 0);

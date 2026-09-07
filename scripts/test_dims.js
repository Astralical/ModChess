// Cross-size dry-run: every ability must cast cleanly (no crash, kings kept)
// on 6/10/12 boards, exercising the board-size-aware scan rewrites.
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js',
 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js', 'js/abilities_18.js', 'js/abilities_19.js',
 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const lib = globalThis.MD, E = lib.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }

function lively(n) {
  const g = E.newGame(n);
  let guard = 0;
  while (guard++ < 60 && !g.over) {
    const side = g.turn;
    const moves = E.legalMoves(g, side);
    if (!moves.length) break;
    E.applyMove(g, moves[Math.floor(Math.random() * moves.length)]);
    g.turn = E.opp(side);
  }
  return g;
}

for (const n of [6, 10, 12]) {
  let crashes = 0, kingsLost = 0;
  const crashList = {};
  for (const ab of lib.ABILITIES) {
    for (let iter = 0; iter < 2; iter++) {
      const g = lively(n);
      const side = iter % 2 ? 'w' : 'b';
      const t = lib.botTarget(g, ab, side);
      const res = lib.cast(g, ab, side, t);
      if (!Array.isArray(res.lines)) { crashes++; crashList[ab.id + ' ' + ab.name] = 'no lines'; }
      if (res.error) { crashes++; crashList[ab.id + ' ' + ab.name] = res.lines.join('|'); }
      if (!E.hasKing(g, 'w') || !E.hasKing(g, 'b')) { kingsLost++; crashList[ab.id + ' ' + ab.name] = 'removed a king'; }
    }
  }
  ok(crashes === 0, 'n=' + n + ': no ability crashed across cross-size dry-runs');
  ok(kingsLost === 0, 'n=' + n + ': no ability removes a king');
  if (crashes) Object.entries(crashList).slice(0, 8).forEach(([k, v]) => console.log('   ✗', k, '::', v));
}
console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

// Summon-sickness regression: a troop summoned during your turn must clear its
// recruit delay by the END of that same turn, so it can MOVE on your NEXT turn
// (after the opponent's turn). Covers high- and low-value troops + hatch eggs.
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js'].forEach(p => eval(fs.readFileSync(p, 'utf8')));
const E = MD.Engine, Fx = MD.Fx;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }

function roundFor(type, r0, c0) {
  const g = E.newGame();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null;
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[0][7] = { c: 'b', t: 'k' };
  g.board[5][4] = { c: 'w', t: 'p' };
  g.board[1][4] = { c: 'b', t: 'p' };
  const placed = Fx.place(g, 'w', type, r0, c0, {});
  const zAtPlace = placed && placed.b ? placed.b.z : -1;
  const wm = E.legalMoves(g, 'w').find(m => m.r0 === 5 && m.c0 === 4);
  if (!wm) return { zAtPlace, err: 'no white pawn move' };
  E.applyMove(g, wm);
  E.tickAfterMove(g, 'w');
  const cell = g.board[r0][c0];
  const zEnd = cell && cell.b ? (cell.b.z || 0) : 0; // b is deleted entirely once cleared
  const canMove = !!E.legalMoves(g, 'w').find(m => m.r0 === r0 && m.c0 === c0);
  return { zAtPlace, zEnd, canMove };
}

const cases = [
  ['seaserpent', 2, 2, 'Sea Serpent (value 1050)'],
  ['reaper', 3, 3, 'Reaper (value 1600)'],
  ['griffon', 3, 3, 'Griffon (value 1000)'],
  ['imp', 3, 3, 'Imp (value 260)'],
  ['zeppelin', 3, 3, 'War Zeppelin'],
  ['phoenixegg', 3, 3, 'Phoenix Egg (hatch)'],
];
for (const [type, r, c, name] of cases) {
  const x = roundFor(type, r, c);
  ok(x.zAtPlace === 1, name + ': recruit delay is 1 at summon (got ' + x.zAtPlace + ')');
  ok(!(x.zEnd > 0), name + ': sickness cleared by the end of the summoning turn (z=' + x.zEnd + ')');
  ok(x.canMove, name + ': can move on the next own turn');
  if (x.err) console.log('   (note: ' + x.err + ')');
}
console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

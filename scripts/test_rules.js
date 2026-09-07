// Validate terrain + standard rules (castling, en passant)
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js']
  .forEach(p => eval(fs.readFileSync(p, 'utf8')));
const E = MD.Engine, Fx = MD.Fx;
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : (fail++, console.log('  ✗ FAIL:', n)); };

let g = E.newGame();
ok(E.legalMoves(g, 'w').some(m => m.r0 === 6 && m.c0 === 4 && m.r1 === 4 && m.c1 === 4), 'e2e4 exists on plain board');

// wall in front of e2 pawn blocks it, d-pawn unaffected
g = E.newGame(); E.setTerrain(g, 5, 4, 'wall');
const wm = E.legalMoves(g, 'w');
ok(!wm.some(m => m.r0 === 6 && m.c0 === 4), 'pawn blocked by wall in front');
ok(wm.some(m => m.r0 === 6 && m.c0 === 3 && m.r1 === 4 && m.c1 === 3), 'd-pawn still free');

// wall blocks rook sight
g = E.newGame();
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null;
g.board[7][0] = { c: 'w', t: 'r' }; g.board[7][4] = { c: 'w', t: 'k' }; g.board[0][4] = { c: 'b', t: 'k' };
E.setTerrain(g, 4, 0, 'wall');
const rm = E.legalMoves(g, 'w').filter(m => m.r0 === 7 && m.c0 === 0);
ok(rm.some(m => m.r1 === 5 && m.c1 === 0), 'rook reaches a3');
ok(!rm.some(m => m.r1 === 3 && m.c1 === 0), 'rook cannot see past wall to a5');

// cannot summon onto river
g = E.newGame(); E.setTerrain(g, 3, 4, 'river');
Fx.place(g, 'w', 'imp', 3, 4, {});
ok(!g.board[3][4], 'cannot summon onto river');

// castling kingside after clearing f1,g1
g = E.newGame(); g.board[7][5] = null; g.board[7][6] = null;
const kg2 = E.legalMoves(g, 'w').some(m => m.r0 === 7 && m.c0 === 4 && m.r1 === 7 && m.c1 === 6 && m.castle === 'k');
ok(kg2, 'castling kingside legal after clearing f1,g1');

// en passant: black pawn b7-b5, white pawn a5 may capture b6 ep
g = E.newGame();
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null;
g.board[7][4] = { c: 'w', t: 'k' }; g.board[0][4] = { c: 'b', t: 'k' };
g.board[3][0] = { c: 'w', t: 'p' };
g.board[1][1] = { c: 'b', t: 'p' };
E.applyMove(g, { r0: 1, c0: 1, r1: 3, c1: 1, double: true });
g.ep = { r: 2, c: 1 };
const epM = E.legalMoves(g, 'w').some(m => m.r0 === 3 && m.c0 === 0 && m.r1 === 2 && m.c1 === 1 && m.ep);
ok(epM, 'en passant capture available after double push');

console.log('pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

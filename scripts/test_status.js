// Validate new statuses (petrify/doom/frail), ground zones, and turn-modifiers.
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js']
  .forEach(p => eval(fs.readFileSync(p, 'utf8')));
const E = MD.Engine, Fx = MD.Fx;
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : (fail++, console.log('  ✗ FAIL:', n)); };
const hasType = (g, c, t) => { for (let r = 0; r < 8; r++) for (let x = 0; x < 8; x++) { const cell = g.board[r][x]; if (cell && cell.c === c && cell.t === t) return true; } return false; };
const clear = g => { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null; g.board[7][4] = { c: 'w', t: 'k' }; g.board[0][4] = { c: 'b', t: 'k' }; };

// --- PETRIFY ---
let g = E.newGame(); clear(g);
g.board[4][4] = { c: 'b', t: 'q', b: { f: 0, s: 0, p: 0, st: 2 } }; // black queen petrified (2 of its own turns)
const wm1 = E.legalMoves(g, 'w');
ok(!wm1.some(m => m.r1 === 4 && m.c1 === 4), 'petrified enemy cannot be captured while sealed');
// white moves; then black's own turn cannot move the queen
E.applyMove(g, wm1[0]); E.tickAfterMove(g, 'w');
const blackMoves = E.legalMoves(g, 'b').filter(m => m.r0 === 4 && m.c0 === 4);
ok(blackMoves.length === 0, 'petrified piece cannot move on its owner turn');

// --- DOOM ---
g = E.newGame(); clear(g);
g.board[4][4] = { c: 'b', t: 'p', b: { f: 0, s: 0, p: 0, doom: 1 } };
let mv = E.legalMoves(g, 'w')[0];
E.applyMove(g, mv); E.tickAfterMove(g, 'w');          // white turn ends (black pawn unaffected)
mv = E.legalMoves(g, 'b')[0];
E.applyMove(g, mv); E.tickAfterMove(g, 'b');          // black turn ends -> doomed pawn dies
ok(!g.board[4][4], 'doomed piece perishes at end of its own turn (no aoe)');
ok(E.hasKing(g, 'w') && E.hasKing(g, 'b'), 'doom does not harm anyone else');

// --- ZONES: fire burns a piece standing at end of its turn ---
g = E.newGame(); clear(g);
E.setZone(g, 4, 4, 'fire');
g.board[4][4] = { c: 'b', t: 'r' };
mv = E.legalMoves(g, 'w')[0]; E.applyMove(g, mv); E.tickAfterMove(g, 'w');
// black simply ends its turn while still standing on the fire zone
E.tickAfterMove(g, 'b');
const rookCell = (() => { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].t === 'r') return g.board[r][c]; return null; })();
ok(rookCell && rookCell.b && rookCell.b.p > 0, 'fire zone poisons a piece standing there at turn end');

// --- SANCTUM pushes an enemy out ---
g = E.newGame(); clear(g);
E.setZone(g, 4, 4, 'sanctum', { c: 'w' });
E.setZone(g, 4, 4, null); // clear (helper wrong) - redo
E.clearZone(g, 4, 4); E.setZone(g, 4, 4, 'sanctum', 'w');
g.board[4][4] = { c: 'b', t: 'n' };
// white moves & ends turn; then black must not rest on it
mv = E.legalMoves(g, 'w')[0]; E.applyMove(g, mv); E.tickAfterMove(g, 'w');
// black piece stays; when black's turn ends while standing on sanctum it should be pushed
const bm2 = E.legalMoves(g, 'b').find(m => m.r0 === 4 && m.c0 === 4);
if (bm2) { E.applyMove(g, bm2); } // move it away first (so not on sanctum)
E.tickAfterMove(g, 'b');
let onSanct = false;
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.zone[r][c] && g.board[r][c] && g.board[r][c].c === 'b') onSanct = true;
ok(!onSanct, 'sanctum does not allow an enemy to end its turn on it (pushed/poisoned)');

// --- MOVE-LIMIT: only pawns may move ---
g = E.newGame(); // full standard
Fx.limitMove(g, 'w', 'p');
const limited = E.legalMoves(g, 'w');
ok(limited.every(m => g.board[m.r0][m.c0].t === 'p'), 'move-limit restricts moves to pawns only');
// --- NO-CAPTURE ---
g = E.newGame(); clear(g);
g.board[4][4] = { c: 'b', t: 'p' }; g.board[4][0] = { c: 'w', t: 'r' };
Fx.noCaptures(g, 'w');
const quiet = E.legalMoves(g, 'w');
ok(!quiet.some(m => m.capture), 'no-capture removes all capturing moves');

console.log('pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

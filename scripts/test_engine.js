// Quick engine sanity checks (run with node scripts/test_engine.js)
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'js/engine.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'js/troops.js'), 'utf8'));
const E = MD.Engine;

function cell(g, sq) { const c = sq.charCodeAt(0) - 97, r = 8 - +sq[1]; return g.board[r][c]; }
function mvFromTo(g, from, to, promo) {
  const c0 = from.charCodeAt(0) - 97, r0 = 8 - +from[1];
  const c1 = to.charCodeAt(0) - 97, r1 = 8 - +to[1];
  const legal = E.legalMoves(g, g.turn);
  const found = legal.find(m => m.r0 === r0 && m.c0 === c0 && m.r1 === r1 && m.c1 === c1 && (promo ? m.promo === promo : true));
  if (!found) throw new Error('Illegal move: ' + from + '-' + to + ' turn=' + g.turn);
  E.applyMove(g, found);
  g.turn = E.opp(g.turn);
  return found;
}

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name); }
}

// 1) start position
let g = E.newGame();
ok(E.legalMoves(g, 'w').length === 20, 'start: 20 white moves');
ok(E.legalMoves(g, 'b').length === 20, 'start: 20 black moves');
ok(E.sqName(0, 0) === 'a8' && E.sqName(7, 4) === 'e1', 'sqName mapping');

// 2) scholar's mate Qxf7#
g = E.newGame();
mvFromTo(g, 'e2', 'e4'); mvFromTo(g, 'e7', 'e5');
mvFromTo(g, 'd1', 'h5'); mvFromTo(g, 'b8', 'c6');
mvFromTo(g, 'f1', 'c4'); mvFromTo(g, 'g8', 'f6');
mvFromTo(g, 'h5', 'f7');
const end = E.evaluateEnd(g, 'b');
ok(end.over && end.winner === 'w' && end.reason.includes('checkmate'), 'scholar mate: ' + end.reason);
ok(cell(g, 'f7') && cell(g, 'f7').c === 'w' && cell(g, 'f7').t === 'q', 'white queen on f7');
ok(!!E.findKing(g, 'b'), 'black king still exists (in mate)');

// 3) castling O-O
g = E.newGame();
mvFromTo(g, 'e2', 'e4'); mvFromTo(g, 'e7', 'e5');
mvFromTo(g, 'g1', 'f3'); mvFromTo(g, 'b8', 'c6');
mvFromTo(g, 'f1', 'c4'); mvFromTo(g, 'g8', 'f6');
mvFromTo(g, 'e1', 'g1');
ok(g.castle.wk === false && g.castle.wq === false, 'white castle rights revoked after O-O');
ok(cell(g, 'f1') && cell(g, 'f1').t === 'r', 'rook moved to f1');
ok(cell(g, 'g1') && cell(g, 'g1').t === 'k', 'king on g1');
ok(cell(g, 'h1') === null, 'h1 empty after castle');
ok(g.hist[g.hist.length - 1].san === 'O-O', 'SAN O-O');

// 4) en passant
g = E.newGame();
mvFromTo(g, 'e2', 'e4'); mvFromTo(g, 'a7', 'a6');
mvFromTo(g, 'e4', 'e5'); mvFromTo(g, 'd7', 'd5');
ok(g.ep && g.ep.r === 2 && g.ep.c === 3, 'ep target d6 recorded');
const epMoves = E.legalMoves(g, 'w').filter(m => m.ep);
ok(epMoves.length === 1 && E.sqName(epMoves[0].r1, epMoves[0].c1) === 'd6', 'en passant exd6 available');
if (epMoves.length) { E.applyMove(g, epMoves[0]); g.turn = 'b'; }
ok(cell(g, 'e5') === null && cell(g, 'd6') && cell(g, 'd6').c === 'w', 'ep captured d5 pawn correctly');

// 5) SAN basic
g = E.newGame();
mvFromTo(g, 'e2', 'e4'); ok(g.hist[g.hist.length - 1].san === 'e4', 'SAN e4');
mvFromTo(g, 'g8', 'f6'); ok(g.hist[g.hist.length - 1].san === 'Nf6', 'SAN Nf6');
g = E.newGame();
mvFromTo(g, 'e2', 'e4'); mvFromTo(g, 'd7', 'd5');
mvFromTo(g, 'e4', 'd5');
ok(g.hist[g.hist.length - 1].san === 'exd5', 'SAN exd5');
g = E.newGame(); g.board = [];
for (let r = 0; r < 8; r++) { g.board.push([]); for (let c = 0; c < 8; c++) g.board[r].push(null); }
g.board[1][4] = { c: 'w', t: 'p' };
g.board[0][0] = { c: 'b', t: 'k' };
g.board[7][0] = { c: 'w', t: 'k' };
g.turn = 'w';
const promo = E.legalMoves(g, 'w').find(m => m.promo);
ok(!!promo, 'promotion generated');
if (promo) {
  E.applyMove(g, promo);
  ok(g.hist[g.hist.length - 1].san === 'e8=Q+', 'SAN promo with check: ' + g.hist[g.hist.length - 1].san);
}

// 6) fool's mate
g = E.newGame();
mvFromTo(g, 'f2', 'f3'); mvFromTo(g, 'e7', 'e5');
mvFromTo(g, 'g2', 'g4'); mvFromTo(g, 'd8', 'h4');
const end2 = E.evaluateEnd(g, 'w');
ok(end2.over && end2.winner === 'b' && end2.reason.includes('checkmate'), 'fool mate: ' + end2.reason);

// 7) king cannot move into check
g = E.newGame(); g.board = [];
for (let r = 0; r < 8; r++) { g.board.push([]); for (let c = 0; c < 8; c++) g.board[r].push(null); }
g.board[7][3] = { c: 'w', t: 'k' }; g.board[0][3] = { c: 'b', t: 'k' };
g.board[1][6] = { c: 'b', t: 'r' };
g.turn = 'w';
const kmoves = E.legalMoves(g, 'w').filter(m => g.board[m.r0][m.c0].t === 'k');
ok(kmoves.every(m => E.sqName(m.r1, m.c1) !== 'd7'), 'king cannot move into rook line on d-file');
ok(kmoves.length > 0, 'king has some legal moves');

// 8) frozen piece cannot move
g = E.newGame();
cell(g, 'e2').b = { f: 1, s: 0, p: 0 };
ok(!E.legalMoves(g, 'w').some(m => m.r0 === 6 && m.c0 === 4), 'frozen pawn cannot move');

// 9) freeze/poison ticks
g = E.newGame();
const bp = cell(g, 'e7'); bp.b = { f: 1, s: 0, p: 0 };
E.tickAfterMove(g, 'b');
ok(bp.b === undefined || bp.b.f === 0, 'freeze decremented after owner turn');
g = E.newGame();
g.board[4][4] = { c: 'b', t: 'p', b: { f: 0, s: 0, p: 1 } };
g.board[3][5] = { c: 'w', t: 'n' };
E.tickAfterMove(g, 'b');
ok(g.board[4][4] === null, 'poisoned piece removed at end of owner turn');
ok(g.board[3][5] && g.board[3][5].t === 'n', 'poison rots quietly — adjacent knight survives (no chain blast)');

// 11) custom troops move + give check
ok(MD.TROOPS.imp && MD.TROOPS.warhorse && MD.TROOPS.phoenix, 'troop defs present');
g = E.newGame(); g.board = [];
for (let r = 0; r < 8; r++) { g.board.push([]); for (let c = 0; c < 8; c++) g.board[r].push(null); }
g.board[7][0] = { c: 'w', t: 'k' }; g.board[0][7] = { c: 'b', t: 'k' };
g.board[4][3] = { c: 'w', t: 'imp' };
g.anyTroop = true;
let imm = E.legalMoves(g, 'w').filter(m => m.r0 === 4 && m.c0 === 3);
ok(imm.length === 8, 'imp reaches all 8 neighbours (got ' + imm.length + ')');
g = E.newGame(); g.board = [];
for (let r = 0; r < 8; r++) { g.board.push([]); for (let c = 0; c < 8; c++) g.board[r].push(null); }
g.board[7][0] = { c: 'w', t: 'k' }; g.board[2][3] = { c: 'b', t: 'k' };
g.board[2][2] = { c: 'w', t: 'imp' };
g.anyTroop = true;
ok(E.inCheck(g, 'b'), 'imp adjacent to enemy king gives check');
g = E.newGame(); g.board = [];
for (let r = 0; r < 8; r++) { g.board.push([]); for (let c = 0; c < 8; c++) g.board[r].push(null); }
g.board[7][0] = { c: 'w', t: 'k' }; g.board[0][7] = { c: 'b', t: 'k' };
g.board[4][3] = { c: 'w', t: 'warhorse' };
g.anyTroop = true;
let wh = E.legalMoves(g, 'w').filter(m => m.r0 === 4 && m.c0 === 3);
ok(wh.length === 12, 'warhorse reaches 12 (knight 8 + ferz 4) got ' + wh.length);
g = E.newGame(); g.board = [];
for (let r = 0; r < 8; r++) { g.board.push([]); for (let c = 0; c < 8; c++) g.board[r].push(null); }
g.board[7][0] = { c: 'w', t: 'k' }; g.board[0][7] = { c: 'b', t: 'k' };
g.board[4][3] = { c: 'w', t: 'phoenix' };
g.anyTroop = true;
let ph = E.legalMoves(g, 'w').filter(m => m.r0 === 4 && m.c0 === 3);
ok(ph.length === 34, 'phoenix = queen range (26, a1 king blocks one diagonal) + knight (8) = 34, got ' + ph.length);
ok(E.val('imp') === 260 && E.val('phoenix') === 1250 && E.val('q') === 950, 'E.val covers custom troops and standard pieces');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

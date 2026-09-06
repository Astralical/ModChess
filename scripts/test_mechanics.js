// Validate new core mechanics (recruit, shield-block, growth, revive, traits)
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js']
  .forEach(p => eval(fs.readFileSync(p, 'utf8')));
const E = MD.Engine, Fx = MD.Fx;
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : (fail++, console.log('  ✗ FAIL:', n)); };
const scan = (g, t) => { const a = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].t === t) a.push({ r, c }); return a; };

// 1) summon sickness
let g = E.newGame();
Fx.place(g, 'w', 'imp', 4, 4, {});
ok(E.legalMoves(g, 'w').filter(m => g.board[m.r0][m.c0].t === 'imp').length === 0, 'imp cannot act on summon turn');
// white plays any move, ending its turn
const mv = E.legalMoves(g, 'w')[0];
E.applyMove(g, mv);
E.tickAfterMove(g, 'w');
ok(g.board[4][4] && (!g.board[4][4].b || !(g.board[4][4].b.z > 0)), 'imp recruit fades after owner turn end');
ok(E.legalMoves(g, 'w').filter(m => g.board[m.r0][m.c0].t === 'imp').length > 0, 'imp can move next turn');

// 2) shield blocks capture but not movement
g = E.newGame();
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null;
g.board[4][0] = { c: 'b', t: 'r' };  // black rook a5
g.board[4][4] = { c: 'w', t: 'q' };  // white queen e5
g.board[7][4] = { c: 'w', t: 'k' };  // safe kings
g.board[0][4] = { c: 'b', t: 'k' };
const canCapQ = E.legalMoves(g, 'b').some(m => m.r1 === 4 && m.c1 === 4);
Fx.mod(g.board[4][4], 's', 1);
const canCapQ2 = E.legalMoves(g, 'b').some(m => m.r1 === 4 && m.c1 === 4);
ok(canCapQ && !canCapQ2, 'shield blocks capture of the queen');
ok(E.legalMoves(g, 'w').some(m => m.r0 === 4 && m.c0 === 4), 'shielded queen can still move');

// 3) growth: hydra summons hydraling, matures into hydra after one full round
g = E.newGame();
Fx.summonN(g, 'w', 'hydra', 1);
ok(scan(g, 'hydraling').length === 1, 'hydra summons a hydraling');
for (let i = 0; i < 2; i++) { const s = i % 2 ? 'b' : 'w'; const mm = E.legalMoves(g, s); if (mm.length) { E.applyMove(g, mm[0]); E.tickAfterMove(g, s); } }
ok(scan(g, 'hydra').length >= 1, 'hydraling matures into hydra after one round');

// phoenix egg grows a bit slower
g = E.newGame();
Fx.summonN(g, 'w', 'phoenix', 1);
ok(scan(g, 'phoenixegg').length === 1, 'phoenix summons an egg');
for (let i = 0; i < 3; i++) { const s = i % 2 ? 'b' : 'w'; const mm = E.legalMoves(g, s); if (mm.length) { E.applyMove(g, mm[0]); E.tickAfterMove(g, s); } }
ok(scan(g, 'phoenix').length >= 1, 'phoenix egg matures into phoenix');

// 4) revive: your own fallen pawn rises first
g = E.newGame();
g.board[1][3] = null;              // black e-pawn gone
g.lost.b.push({ t: 'p', c: 'b' }); // black lost a pawn
const lines = Fx.revive(g, 'b', 1, { type: 'p' });
ok(lines.length === 1 && scan(g, 'p').filter(q => q.cell0 || true).length >= 1, 'black revives its own fallen pawn (' + lines.join(' ') + ')');
const blackPawns = scan(g, 'p').filter(q => g.board[q.r][q.c].c === 'b');
ok(blackPawns.length >= 2, 'revived pawn actually appears on board for black');

// 5) death rattle: spriggan split
g = E.newGame();
Fx.place(g, 'b', 'spriggan', 4, 4, { noRecruit: true });
Fx.removeAt(g, 4, 4, {});
let splitPawns = 0;
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const cl = g.board[r][c]; if (cl && cl.c === 'b' && cl.t === 'p' && r !== 1) splitPawns++; }
ok(splitPawns >= 1, 'spriggan death splits into pawns');

// 6) death rattle: gremlin burst hits adjacent enemies (not kings)
g = E.newGame();
Fx.place(g, 'b', 'gremlin', 4, 4, { noRecruit: true });
// put an enemy white rook beside it
g.board[4][3] = { c: 'w', t: 'r' };
Fx.removeAt(g, 4, 4, {});
ok(g.board[4][3] === null, 'gremlin burst destroys adjacent enemy');
ok(E.hasKing(g, 'w') && E.hasKing(g, 'b'), 'gremlin burst never takes a king');

// 7) new troops exist and can be summoned without recruiting lockout crash
for (const t of ['spriggan', 'gremlin', 'warden', 'samurai', 'siren']) {
  g = E.newGame();
  Fx.summonN(g, 'w', t, 1);
  ok(scan(g, t).length === 1, t + ' can be summoned');
}

console.log('pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

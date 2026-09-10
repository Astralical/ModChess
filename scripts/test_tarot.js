// TAROT set (AB_22) regression — the 78-card deck plus its three new mechanics:
// ARCANA POLARITY (upright/reversed), SUIT ATTUNEMENT (wand/cup/sword/pent),
// and PROPHECY (delayed + conditional fates). Also covers the 16 court troops.
const fs = require('fs');
globalThis.MD = {};
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/heroes.js', 'js/tarot.js',
  'js/abilities_1.js', 'js/abilities_2.js', 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js',
  'js/abilities_7.js', 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js', 'js/abilities_12.js',
  'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js', 'js/abilities_17.js', 'js/abilities_18.js',
  'js/abilities_19.js', 'js/abilities_20.js', 'js/abilities_21.js', 'js/abilities_22.js', 'js/abilities_index.js', 'js/rebalance.js'].forEach(p => eval(fs.readFileSync(p, 'utf8')));
const MD2 = globalThis.MD, E = MD2.Engine, Fx = MD2.Fx;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }

// --- 1. the deck itself ---
const tarot = MD2.ABILITIES.filter(a => a.cat === 'Tarot');
ok(tarot.length === 78, '78 Tarot cards exist (got ' + tarot.length + ')');
ok(MD2.CATS.includes('Tarot'), 'Tarot category registered in CATS');
const ids = tarot.map(a => a.id).sort((a, b) => a - b);
ok(ids[0] === 1030 && ids[ids.length - 1] === 1107 && new Set(ids).size === 78, 'ids span 1030..1107 uniquely');
ok(new Set(tarot.map(a => a.name)).size === 78, 'all 78 card names are unique');

// --- 2. the 16 court troops ---
const courts = ['wandpage', 'wandknight', 'wandqueen', 'wandking', 'cuppage', 'cupknight', 'cupqueen', 'cupking', 'swordpage', 'swordknight', 'swordqueen', 'swordking', 'pentpage', 'pentknight', 'pentqueen', 'pentking'];
ok(courts.every(k => MD2.TROOPS[k] && MD2.TROOPS[k].suit), 'all 16 court troops exist with a suit tag');
const suitNames = new Set(courts.map(k => MD2.TROOPS[k].suit));
ok(suitNames.size === 4 && ['wand', 'cup', 'sword', 'pent'].every(s => suitNames.has(s)), 'courts cover all four suits');

// --- 3. ARCANA POLARITY ---
(function polarity() {
  const g = E.newGame(8);
  ok(Fx.tarotFlip(g, { force: false }) === false, 'polarity can be forced UPRIGHT');
  ok(Fx.tarotFlip(g, { force: true }) === true, 'polarity can be forced REVERSED');
  let sawUp = false, sawDown = false;
  for (let i = 0; i < 200; i++) { if (Fx.tarotFlip(g, {})) sawDown = true; else sawUp = true; }
  ok(sawUp && sawDown, 'random polarity produces both outcomes');
  ok(typeof Fx.tarotLine(true, 'a', 'b') === 'string' && Fx.tarotLine(true, 'a', 'b').startsWith('REVERSED'), 'tarotLine labels reversed');
})();

// --- 4. SUIT ATTUNEMENT (markers, passives, alignment) ---
function board(cells) {
  const g = E.newGame(8);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null;
  g.anyTroop = true;
  for (const x of cells) g.board[x[0]][x[1]] = Object.assign({ c: x[2], t: x[3] }, x[4] ? { b: x[4] } : { b: { f: 0, s: 0, p: 0 } });
  return g;
}
(function attunement() {
  const g = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 4, 'w', 'p'], [3, 4, 'b', 'p']]);
  const n = Fx.attune(g, [{ r: 4, c: 4 }], 'wand');
  ok(n === 1 && g.board[4][4].b.suit === 'wand', 'attune marks a piece with a suit and persists');
  ok(Fx.suitOf(g, { r: 4, c: 4 }) === 'wand', 'suitOf reads the mark');
  ok(Fx.suitPower(g, 'w', 'wand') === 1 && !Fx.suitAligned(g, 'w', 'wand'), 'one attuned piece is not yet aligned');
  Fx.attune(g, [{ r: 7, c: 4 }], 'wand');
  ok(Fx.suitPower(g, 'w', 'wand') === 2 && Fx.suitAligned(g, 'w', 'wand'), 'two of a suit = ALIGNED');
  // SWORD passive: ward at end of turn
  const g2 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 4, 'w', 'p']]);
  Fx.attune(g2, [{ r: 4, c: 4 }], 'sword');
  E.tickAfterMove(g2, 'w');
  ok(g2.board[4][4].b.s > 0, 'Swords attunement raises a ward at turn end');
  // WAND passive: scorch a neighbour
  const g3 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 4, 'w', 'p'], [3, 3, 'b', 'p']]);
  Fx.attune(g3, [{ r: 4, c: 4 }], 'wand');
  E.tickAfterMove(g3, 'w');
  ok(g3.board[3][3].b && g3.board[3][3].b.p > 0, 'Wands attunement poisons an adjacent foe');
  // CUP passive: cleanse own poison
  const g4 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 4, 'w', 'p', { f: 0, s: 0, p: 1 }]]);
  Fx.attune(g4, [{ r: 4, c: 4 }], 'cup');
  E.tickAfterMove(g4, 'w');
  ok(g4.board[4][4].b.p === 0, 'Cups attunement cleanses its own poison');
  // PENT passive: fortify an ally
  const g5 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 4, 'w', 'p'], [4, 3, 'w', 'p']]);
  Fx.attune(g5, [{ r: 4, c: 4 }], 'pent');
  E.tickAfterMove(g5, 'w');
  ok(g5.board[4][3].b.s > 0, 'Pentacles attunement shields an adjacent ally');
  // a court troop counts as attuned via its def.suit
  const g6 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [4, 4, 'w', 'wandknight']]);
  ok(Fx.suitOf(g6, { r: 4, c: 4 }) === 'wand', 'a court troop is inherently attuned to its suit');
})();

// --- 5. PROPHECY (delayed + conditional) ---
(function prophecy() {
  // timed blast
  const g = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [3, 3, 'b', 'p'], [3, 4, 'b', 'p']]);
  Fx.prophesy(g, { side: 'w', r: 3, c: 4, trigger: 'turn', turns: 1, act: 'blast' });
  ok(Fx.prophecies(g).length === 1, 'a prophecy is laid');
  E.tickAfterMove(g, 'w');
  ok(Fx.prophecies(g).length === 0, 'a timed prophecy resolves on its countdown');
  ok(!g.board[3][3] || !g.board[3][4], 'the blast consumed an adjacent enemy');
  // conditional LEAVE trigger
  const g2 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [3, 4, 'b', 'p']]);
  Fx.prophesy(g2, { side: 'w', r: 3, c: 4, trigger: 'leave', act: 'freezeMover' });
  g2.board[2][4] = g2.board[3][4]; g2.board[3][4] = null; // the pawn moves away
  MD2.Tarot.onMove(g2, { r0: 3, c0: 4, r1: 2, c1: 4, color: 'b' });
  ok(Fx.prophecies(g2).length === 0, 'a leave-prophecy fires when the piece departs');
  ok(g2.board[2][4] && g2.board[2][4].b && g2.board[2][4].b.f > 0, 'the moving piece is frozen by the prophecy');
  // a prophecy that is not triggered stays
  const g3 = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'], [3, 4, 'b', 'p'], [3, 1, 'b', 'p']]);
  Fx.prophesy(g3, { side: 'w', r: 3, c: 4, trigger: 'enter', act: 'doomMover' });
  MD2.Tarot.onMove(g3, { r0: 3, c0: 1, r1: 2, c1: 1, color: 'b' });
  ok(Fx.prophecies(g3).length === 1, 'an untriggered prophecy remains on the board');
})();

// --- 6. every Tarot card casts cleanly both upright and reversed ---
(function casts() {
  let errors = 0, kingLost = 0, empty = 0;
  for (const ab of tarot) {
    for (const force of [false, true]) {
      const g = board([[7, 4, 'w', 'k'], [0, 4, 'b', 'k'],
        [6, 3, 'w', 'p'], [6, 5, 'w', 'n'], [5, 4, 'w', 'b'], [7, 0, 'w', 'r'], [7, 7, 'w', 'q'],
        [1, 3, 'b', 'p'], [1, 5, 'b', 'n'], [2, 4, 'b', 'b'], [0, 0, 'b', 'r'], [0, 7, 'b', 'q'],
        [4, 2, 'w', 'wandknight'], [3, 5, 'b', 'cuppage']]);
      const res = MD2.cast(g, ab, 'w', null);
      if (res.error) { errors++; console.log('    ! error on', ab.id, ab.name, 'force=' + force); }
      if (!res.lines || !res.lines.length) empty++;
      try { E.tickAfterMove(g, 'w'); } catch (e) { errors++; console.log('    ! tick error', ab.id, e && e.message); }
      if (!E.findKing(g, 'w') || !E.findKing(g, 'b')) { kingLost++; console.log('    ! king lost by', ab.id, ab.name, 'force=' + force); }
    }
  }
  ok(errors === 0, 'all 78 cards cast & tick without error (upright + reversed)');
  ok(kingLost === 0, 'no Tarot card ever removes a king');
  ok(empty === 0, 'every Tarot card produces at least one log line');
})();

console.log('\nTAROT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

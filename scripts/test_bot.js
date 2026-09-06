// Headless bot-vs-bot smoke test replicating the main game loop.
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js', 'js/abilities_8.js',
 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_index.js', 'js/rebalance.js', 'js/ai.js'].forEach(load);
const lib = globalThis.MD, E = lib.Engine, opp = c => c === 'w' ? 'b' : 'w';

function runGame(seedSide, diff) {
  const g = E.newGame();
  g.battleLog = [];
  let plies = 0, casts = 0;
  while (plies < 500) {
    const side = g.turn;
    // a bonus (extra) turn is move-only — no fresh spell is drawn or cast
    if (g.moveOnly && g.moveOnly[side]) { g.moveOnly[side] = false; }
    else {
      // a Time Stop may erase this entire turn (skip move + cards)
      if (g.skipTurn && g.skipTurn[side]) { g.skipTurn[side] = false; g.turn = opp(side); plies++; continue; }
      const handSize = (g.lowHand && g.lowHand[side]) ? 2 : 3;
      if (g.lowHand) g.lowHand[side] = false;
      if (g.silence[side]) { g.silence[side] = false; }
      else {
        const hand = lib.drawHand(handSize);
        const before = g.extra[side];
        const ab = lib.AI.chooseAbility(g, side, hand);
        if (ab) {
          const t = lib.botTarget(g, ab, side);
          const res = lib.cast(g, ab, side, t);
          const gained = g.extra[side] - before;
          if (gained > 0) {
            if (g.extraCycle[side]) g.extra[side] -= gained;
            else g.extraCycle[side] = true;
          }
          if (res.error) return { error: 'ability crash ' + ab.id + ' ' + ab.name, plies, casts };
          casts++;
          const end = E.evaluateEnd(g, side);
          if (end.over) return { over: end, plies, casts };
        }
      }
    }
    const mv = lib.AI.chooseMove(g, side, diff);
    if (!mv) {
      const end = E.evaluateEnd(g, side);
      return { over: end, plies, casts };
    }
    E.applyMove(g, mv);
    E.tickAfterMove(g, side);
    let next = opp(side);
    if (g.extra[side] > 0) { g.extra[side]--; next = side; if (!g.moveOnly) g.moveOnly = { w: false, b: false }; g.moveOnly[side] = true; }
    if (next !== side) { g.extraCycle.w = false; g.extraCycle.b = false; }
    if (g.skipTurn && g.skipTurn[next]) { g.skipTurn[next] = false; next = opp(next); g.extraCycle.w = false; g.extraCycle.b = false; }
    const end = E.evaluateEnd(g, next);
    if (end.over) return { over: end, plies, casts };
    g.turn = next;
    plies++;
  }
  return { timeout: true, plies };
}

const results = [];
for (let i = 0; i < 4; i++) {
  const diff = (i % 2) + 1;
  const r = runGame(i % 2 ? 'w' : 'b', diff);
  results.push(r);
  const tag = r.timeout ? 'TIMEOUT(500 plies)' : (r.over ? (r.over.winner === null ? 'Draw: ' + r.over.reason : r.over.winner + ' wins: ' + r.over.reason) : '?');
  console.log(`game ${i} (diff ${diff}): ${tag}  plies=${r.plies} casts=${r.casts}`);
  if (r.error) console.log('   ERROR', r.error);
}
console.log('\nDone.');

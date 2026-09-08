// HEROES set (AB_21): 20 legendary troops each carry a unique banner trick
// (js/heroes.js -> MD.Heroes). Exercises every power through the engine's own
// tickAfterMove so the whole chain (place -> anyHero -> own-turn dispatch) runs.
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/heroes.js',
 'js/abilities_1.js', 'js/abilities_2.js', 'js/abilities_3.js', 'js/abilities_4.js',
 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js', 'js/abilities_8.js',
 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js', 'js/abilities_12.js',
 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js', 'js/abilities_18.js', 'js/abilities_19.js', 'js/abilities_20.js', 'js/abilities_21.js',
 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const M = globalThis.MD, E = M.Engine, Fx = M.Fx, Heroes = M.Heroes;
const opp = c => (c === 'w' ? 'b' : 'w');

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }
function clean(n) { const g = E.newGame(n); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.board[r][c] = null; return g; }
function heroAt(g, t, r, c, side, b) {
  g.board[r][c] = { c: side, t, b: b || { f: 0, s: 0, p: 0, z: 0 } };
  g.anyTroop = true; g.anyHero = true;
  return g.board[r][c];
}
const HEROES = ['alexander', 'caesar', 'spartacus', 'hannibal', 'genghis', 'napoleon', 'sunzu', 'leonidas',
  'gilgamesh', 'hercules', 'odin', 'thor', 'sunwukong', 'momotaro', 'anansi', 'robinhood',
  'arthur', 'beowulf', 'goku', 'mulan'];

// --- 1. every hero power runs at end-of-owner-turn without crashing or kings dying ---
{
  const events = [];
  let crashed = 0, kingLost = 0;
  for (const t of HEROES) {
    const g = clean(8);
    g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
    heroAt(g, t, 5, 3, 'w');
    // sprinkle a spread of enemies + one friendly pawn + one custom foe
    g.board[4][3] = { c: 'b', t: 'p' }; g.board[3][1] = { c: 'b', t: 'r' };
    g.board[6][5] = { c: 'b', t: 'zombie' }; g.board[5][4] = { c: 'w', t: 'p' };
    const before = [];
    try { const ev = E.tickAfterMove(g, 'w'); events.push(ev); }
    catch (e) { crashed++; console.log('    crash', t, e.message); }
    if (!(g.board[0][0] && g.board[0][0].c === 'b' && g.board[0][0].t === 'k')) kingLost++;
    if (!(g.board[7][0] && g.board[7][0].c === 'w' && g.board[7][0].t === 'k')) kingLost++;
    if (!g.board[5][3]) console.log('    note: hero', t, 'removed itself (ok for some designs?)');
    void before;
  }
  ok(crashed === 0, 'no hero power crashed during its own-turn tick');
  ok(kingLost === 0, 'no hero power destroyed a king');
}

// --- 2. Alexander: once he has conquered (b.pw), he crushes the weakest enemy ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'alexander', 5, 3, 'w', { f: 0, s: 0, p: 0, z: 0, pw: 1 });
  g.board[4][3] = { c: 'b', t: 'p' }; g.board[3][6] = { c: 'b', t: 'r' }; g.board[6][1] = { c: 'b', t: 'q' };
  E.tickAfterMove(g, 'w');
  const pawnGone = !g.board[4][3];
  ok(pawnGone, 'Alexander crushes the weakest enemy (a pawn)');
}
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'alexander', 5, 3, 'w', { f: 0, s: 0, p: 0, z: 0, pw: 0 });
  g.board[4][3] = { c: 'b', t: 'p' };
  E.tickAfterMove(g, 'w');
  ok(!!g.board[4][3], 'Alexander without a conquest does not act');
}

// --- 3. Spartacus: an adjacent enemy pawn defects ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'spartacus', 5, 3, 'w');
  g.board[5][4] = { c: 'b', t: 'p' }; g.board[5][2] = { c: 'b', t: 'n' };
  E.tickAfterMove(g, 'w');
  ok(g.board[5][4] && g.board[5][4].c === 'w' && g.board[5][4].t === 'p', 'Spartacus converts an adjacent enemy pawn');
}

// --- 4. Caesar: nearest foe frozen (non-pawn) ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'caesar', 5, 3, 'w');
  g.board[5][2] = { c: 'b', t: 'r' }; g.board[6][6] = { c: 'b', t: 'n' };
  E.tickAfterMove(g, 'w');
  ok(g.board[5][2].b && g.board[5][2].b.f > 0, 'Caesar freezes the nearest foe (rook at distance 1)');
}

// --- 5. Thor: enemies on his file/rank freeze every other turn ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'thor', 5, 3, 'w', { f: 0, s: 0, p: 0, z: 0, alt: 0 });
  g.board[5][7] = { c: 'b', t: 'r' }; g.board[2][3] = { c: 'b', t: 'n' }; g.board[4][6] = { c: 'b', t: 'p' };
  E.tickAfterMove(g, 'w');
  ok(g.board[5][7].b && g.board[5][7].b.f > 0, 'Thor freezes an enemy on his rank');
  ok(g.board[2][3].b && g.board[2][3].b.f > 0, 'Thor freezes an enemy on his file');
  ok(!(g.board[4][6].b && g.board[4][6].b.f > 0), 'off-line enemy (4,6) not frozen');
}

// --- 6. Beowulf: adjacent custom troop destroyed, standard piece frozen ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'beowulf', 5, 3, 'w');
  g.board[5][4] = { c: 'b', t: 'zombie' };
  E.tickAfterMove(g, 'w');
  ok(!g.board[5][4], 'Beowulf tears apart an adjacent monster (custom troop)');
}
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'beowulf', 5, 3, 'w');
  g.board[5][4] = { c: 'b', t: 'r' };
  E.tickAfterMove(g, 'w');
  ok(g.board[5][4] && g.board[5][4].b && g.board[5][4].b.f > 0, 'Beowulf freezes an ordinary man (standard piece) in awe');
}

// --- 7. Robin Hood: richest enemy demoted (queen -> rook) ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'robinhood', 5, 3, 'w');
  g.board[1][1] = { c: 'b', t: 'q' };
  E.tickAfterMove(g, 'w');
  ok(g.board[1][1] && g.board[1][1].t === 'r', 'Robin Hood robs the richest enemy (Queen becomes Rook)');
  ok(g.board[5][3].b && g.board[5][3].b.s > 0, 'Robin Hood wards himself while richer foes live');
}

// --- 8. Odin: raises a fallen warrior back onto the board ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  g.lost = { w: [{ t: 'r' }], b: [] }; g.capt = { w: [], b: [] };
  heroAt(g, 'odin', 5, 3, 'w');
  const wb = Object.keys(g.board).length;
  E.tickAfterMove(g, 'w');
  void wb;
  let revived = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].c === 'w' && g.board[r][c].t === 'r') revived++;
  ok(revived >= 1, 'Odin raises a fallen warrior (rook) back to fight');
}

// --- 9. Hercules grows labours over turns ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'hercules', 5, 3, 'w', { f: 0, s: 0, p: 0, z: 0, l: 3 });
  g.board[5][4] = { c: 'b', t: 'n' };
  E.tickAfterMove(g, 'w');
  ok(g.board[5][3].b && g.board[5][3].b.l >= 4, 'Hercules completes his 4th labour (b.l reaches 4)');
}

// --- 10. Napoleon: shields the friendly column (files c-1..c+1) ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  heroAt(g, 'napoleon', 5, 3, 'w');
  g.board[3][3] = { c: 'w', t: 'p' };   // same file
  g.board[5][5] = { c: 'w', t: 'p' };   // two files away
  E.tickAfterMove(g, 'w');
  ok(g.board[3][3].b && g.board[3][3].b.s > 0, 'Napoleon shields the friendly on his file');
  ok(!(g.board[5][5].b && g.board[5][5].b.s > 0), 'two-files-away friendly not shielded');
}

// --- 11. anyHero flag + summon through Fx.place sets it ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' }; g.board[7][0] = { c: 'w', t: 'k' };
  g.anyHero = false;
  Fx.place(g, 'w', 'alexander', 6, 3, {});
  ok(g.anyHero === true, 'Fx.place of a hero sets g.anyHero');
}

console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

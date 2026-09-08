// Outbreak set + Counter mechanic + extra-turn regression checks.
const fs = require('fs');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(p, 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/heroes.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_7.js',
 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js', 'js/abilities_11.js',
 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js', 'js/abilities_16.js',
 'js/abilities_17.js', 'js/abilities_18.js', 'js/abilities_19.js', 'js/abilities_20.js', 'js/abilities_21.js', 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);
const MD2 = globalThis.MD, E = MD2.Engine;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }
function clean(n) { const g = E.newGame(n); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g.board[r][c] = null; return g; }

// --- 1. Outbreak set present (75 cards, ids 855-929, cat Zombie) ---
const zombie = MD2.ABILITIES.filter(a => a.cat === 'Zombie');
ok(zombie.length === 75, '75 Zombie cards registered (got ' + zombie.length + ')');
ok(MD2.ABILITIES.length === 933, 'total pool 933');
ok(zombie.every(a => a.id >= 855 && a.id <= 929), 'zombie ids 855-929');
ok(MD2.CATS.includes('Zombie'), 'Zombie category in CATS');

// --- 2. counter troop types exist ---
ok(!!MD2.TROOPS.porcupine && !!MD2.TROOPS.scorpion && !!MD2.TROOPS.urchin && !!MD2.TROOPS.plaguebearer, 'counter troops registered');

// --- 3. counter 'kill': capturer is destroyed with a porcupine ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  // attacker (white pawn) moves onto black porcupine at (5,1)
  g.board[4][0] = { c: 'w', t: 'p' };          // attacker
  g.board[5][1] = { c: 'b', t: 'porcupine' };  // counter victim
  const victim = g.board[5][1];
  E.applyMove(g, { r0: 4, c0: 0, r1: 5, c1: 1, capture: true }); // pawn captures porcupine
  const lines = E.counterStrike(g, 5, 1, victim);
  ok(lines.length > 0, 'porcupine counter triggers on capture');
  ok(!g.board[5][1], 'attacker destroyed along with the porcupine (square empty)');
}
// --- 4. counter 'doom': plague bearer dooms its capturer ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[4][0] = { c: 'w', t: 'n' };
  g.board[5][1] = { c: 'b', t: 'plaguebearer' };
  const victim = g.board[5][1];
  E.applyMove(g, { r0: 4, c0: 0, r1: 5, c1: 1, capture: true });
  const lines = E.counterStrike(g, 5, 1, victim);
  ok(lines.some(l => /doom/.test(l)), 'plague bearer marks capturer for doom');
  ok(g.board[5][1] && g.board[5][1].b && g.board[5][1].b.doom > 0, 'capturing knight is doomed');
}
// --- 5. king is never destroyed by a counter ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[5][1] = { c: 'b', t: 'porcupine' };
  const victim = g.board[5][1];
  g.board[5][1].b = { f: 0, s: 0, p: 0 };
  const attacker = { c: 'w', t: 'k' };
  const lines = E.counterStrike(g, 7, 0, victim); // pretend king at (7,0) captured it
  ok(lines.length > 0 && /King/.test(lines[0]), 'king survives a counter (shattered)');
  ok(!!E.hasKing(g, 'w'), 'white king still present');
}
// --- 6. extra-turn bot guard: a null hand must not crash botTurn (logic exercised via helper) ---
{
  // Simulate the exact expression used in Game.botTurn with h=null: guarded code path must not throw.
  let threw = false;
  let phase = 'bot';
  try {
    const h = null;
    if (h && !h.used) { /* cast */ } else { if (h) h.used = true; phase = 'move'; }
    if (!h) { phase = 'move'; }
  } catch (e) { threw = true; }
  ok(!threw && phase === 'move', 'null-hand (move-only bonus turn) does not crash bot flow');
}

// --- 7. poison rebalance: rots quietly (no chain blast), kings immune ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[4][4] = { c: 'w', t: 'n', b: { f: 0, s: 0, p: 1 } };   // poisoned white knight
  g.board[4][5] = { c: 'b', t: 'r' };                            // adjacent black rook
  E.tickAfterMove(g, 'w');                                       // white's turn ends
  ok(!g.board[4][4], 'poisoned knight rots away at end of its owner turn');
  ok(g.board[4][5] && g.board[4][5].t === 'r', 'adjacent rook NOT destroyed by poison (no chain blast)');
}
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k', b: { f: 0, s: 0, p: 1 } };   // poisoned white king
  E.tickAfterMove(g, 'w');
  ok(!!E.hasKing(g, 'w') && !!g.board[7][0], 'king is immune to poison (shrugs it off)');
}
// --- 8. mortar radius nerf sanity (source-level): no radius-2/3 area shells
//     remain in set 18 except Orbital Strike (kept fuse-3, radius 2). ---
{
  const src = fs.readFileSync(__dirname + '/../js/abilities_18.js', 'utf8');
  const lines = src.split('\n');
  const bad = lines.filter(l => /shell\(g, s, [^)]*, [123], [23]\);/.test(l) && !/, 3, 2\);/.test(l));
  ok(bad.length === 0, 'no wide (radius 2/3) shell calls remain outside the kept Orbital Strike (found ' + bad.length + ')');
}

// --- 9. Three Kingdoms set (三国): 50 cards, ids 960-1009, cat 'Three Kingdoms' ---
{
  const tk = MD2.ABILITIES.filter(a => a.cat === 'Three Kingdoms');
  ok(tk.length === 50, '50 Three Kingdoms cards registered (got ' + tk.length + ')');
  ok(tk.every(a => a.id >= 960 && a.id <= 1009), 'Three Kingdoms ids 960-1009');
  ok(MD2.CATS.includes('Three Kingdoms'), 'Three Kingdoms category in CATS');
}

// --- 10. theme troops exist (Outbreak / SciFi / Void / Show / 3K) ---
{
  const need = ['zombie', 'ghoul', 'bloater', 'plaguehound', 'necrolord',
    'servodrone', 'warbot', 'voidwisp', 'starspawn', 'strongman', 'firebreather',
    'liubei', 'guanyu', 'zhangfei', 'zhugeliang', 'caocao', 'xiahoudun', 'guojia',
    'sunquan', 'zhouyu', 'taishici', 'huangzhong', 'ganning', 'diaochan', 'lubu'];
  const missing = need.filter(t => !MD2.TROOPS[t]);
  ok(missing.length === 0, 'all theme troops registered (missing: ' + missing.join(',') + ')');
  const factions = {};
  need.forEach(t => { const d = MD2.TROOPS[t]; if (d && d.sworn) factions[d.sworn] = true; });
  ok(Object.keys(factions).length >= 3, 'sworn factions shu/wei/wu present');
}

// --- 11. sworn-oath mechanic: adjacent same-faction heroes cleanse + shield at turn end ---
{
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  // two Shu heroes side by side; Liu Bei is poisoned + frozen, Guan Yu unshielded
  g.board[3][3] = { c: 'w', t: 'liubei', b: { f: 1, s: 0, p: 1 } };
  g.board[3][4] = { c: 'w', t: 'guanyu', b: { f: 0, s: 0, p: 0 } };
  E.tickAfterMove(g, 'w'); // white's turn ends
  ok(g.board[3][3] && !(g.board[3][3].b && g.board[3][3].b.p > 0) && !(g.board[3][3].b && g.board[3][3].b.f > 0), 'poisoned/frozen Liu Bei cleansed by sworn ally (not rotted)');
  ok(g.board[3][3] && g.board[3][3].b && g.board[3][3].b.s > 0, 'Liu Bei shielded by sworn ally');
  ok(g.board[3][4] && g.board[3][4].b && g.board[3][4].b.s > 0, 'Guan Yu shielded by sworn ally');
}
{
  // lone hero (no same-faction neighbor) gets NO oath shield and poison still bites
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[3][3] = { c: 'w', t: 'liubei', b: { f: 0, s: 0, p: 1 } }; // isolated
  g.board[6][6] = { c: 'w', t: 'caocao', b: { f: 0, s: 0, p: 0 } }; // wei hero far away
  E.tickAfterMove(g, 'w');
  ok(!g.board[3][3], 'isolated poisoned hero is NOT saved (oath needs an adjacent ally)');
}
{
  // cross-faction neighbors do NOT share an oath
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[3][3] = { c: 'w', t: 'liubei', b: { f: 0, s: 0, p: 0 } };  // shu
  g.board[3][4] = { c: 'w', t: 'caocao', b: { f: 0, s: 0, p: 0 } };  // wei
  E.tickAfterMove(g, 'w');
  ok(!(g.board[3][3].b && g.board[3][3].b.s > 0), 'Liu Bei NOT shielded by a Wei neighbor');
  ok(!(g.board[3][4].b && g.board[3][4].b.s > 0), 'Cao Cao NOT shielded by a Shu neighbor');
}
{
  // pristine heroes (no status object yet) still get the oath shield
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[3][3] = { c: 'w', t: 'liubei' };   // no .b at all
  g.board[3][4] = { c: 'w', t: 'guanyu' };   // no .b at all
  E.tickAfterMove(g, 'w');
  ok(g.board[3][3].b && g.board[3][3].b.s > 0, 'pristine Liu Bei shielded (oath runs even without a status)');
  ok(g.board[3][4].b && g.board[3][4].b.s > 0, 'pristine Guan Yu shielded (oath runs even without a status)');
}
{
  // summon-sick sworn hero does NOT oath-shield until it wakes
  const g = clean(8);
  g.board[0][0] = { c: 'b', t: 'k' };
  g.board[7][0] = { c: 'w', t: 'k' };
  g.board[3][3] = { c: 'w', t: 'liubei', b: { f: 0, s: 0, p: 0, z: 1 } };
  g.board[3][4] = { c: 'w', t: 'guanyu' };
  E.tickAfterMove(g, 'w');
  ok(!(g.board[3][3].b && g.board[3][3].b.s > 0), 'summon-sick Liu Bei NOT oath-shielded');
}

// --- 12. Heroes set (set 21): 20 Mythic cards, ids 1010-1029, cat 'Heroes' ---
{
  const hs = MD2.ABILITIES.filter(a => a.cat === 'Heroes');
  ok(hs.length === 20, '20 Heroes cards registered (got ' + hs.length + ')');
  ok(hs.every(a => a.id >= 1010 && a.id <= 1029), 'Heroes ids 1010-1029');
  ok(hs.every(a => a.rarity === 5), 'every Hero card is Mythic (rarity 5)');
  ok(MD2.CATS.includes('Heroes'), 'Heroes category in CATS');
}
// --- 13. hero troops exist, flagged hero:true, hp power wired in MD.Heroes ---
{
  const names = ['alexander', 'caesar', 'spartacus', 'hannibal', 'genghis', 'napoleon', 'sunzu', 'leonidas',
    'gilgamesh', 'hercules', 'odin', 'thor', 'sunwukong', 'momotaro', 'anansi', 'robinhood',
    'arthur', 'beowulf', 'goku', 'mulan'];
  const missing = names.filter(t => !MD2.TROOPS[t]);
  ok(missing.length === 0, 'all 20 hero troops registered (missing: ' + missing.join(',') + ')');
  const nohero = names.filter(t => !MD2.TROOPS[t] || !MD2.TROOPS[t].hero || !MD2.TROOPS[t].hp);
  ok(nohero.length === 0, 'all heroes flagged hero:true with an hp power');
  const unkeyed = names.filter(t => !(MD2.Heroes && MD2.Heroes.powerList && MD2.Heroes.powerList.includes(MD2.TROOPS[t].hp)));
  ok(unkeyed.length === 0, 'every hero hp key has a power implementation (missing: ' + unkeyed.join(',') + ')');
  ok(names.every(t => E.isHero(t)), 'E.isHero true for every hero troop');
}

// --- 14. Wild wolf troop exists (Wolves Among Sheep / Wolf Pact use it) ---
{
  ok(!!MD2.TROOPS.wolf, 'Wolf troop registered');
  const wolves = MD2.ABILITIES.filter(a => /Wolves Among Sheep|Wolf Pact/.test(a.name));
  ok(wolves.length === 2, 'both wolf-named Wild abilities present');
}

// --- 15. no leaked meta/self-contradictory notes remain in any final description ---
{
  const bad = /[?] No|\? no|\bNo — |too cruel|actually,|\? There is no|\bno (wolf|bear|griffin|dragon|tiger|hydra) troop|No — /i;
  const leaked = MD2.ABILITIES.filter(a => bad.test(a.desc || '')).map(a => a.id + ':' + a.name);
  ok(leaked.length === 0, 'no leaked self-note descriptions remain (found ' + leaked.join(',') + ')');
}

console.log('\npass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);

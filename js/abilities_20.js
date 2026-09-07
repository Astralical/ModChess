/* ============================================================
   Mod Chess — Ability set 20: THREE KINGDOMS (三国)
   IDs 960-1009. Generals of Wei / Shu / Wu take the field under
   the SWORN-OATH (义) banner: heroes tagged with the same faction
   (`sworn: 'wei'|'shu'|'wu'`) cleanse and shield one another when
   they stand adjacent at the end of your turn — brothers watching
   each other's backs. Call the heroes, forge alliances, and let
   the warring states decide the Throne.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const pname = t => (MD.pieceName ? MD.pieceName(t) : t);
  const sq = (r, c) => E.sqName(r, c);
  const bd = g => Fx.bd(g);
  const rand = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : null);
  const foes = (g, s) => Fx.enemy(g, s).filter(q => q.cell.t !== 'k');
  const mine = (g, s) => Fx.own(g, s).filter(q => q.cell.t !== 'k');
  const backRows = (g, s) => Fx.backRows(g, s);
  const ownRows = (g, s) => Fx.ownHalfRows(g, s);
  const value = t => (Fx.value ? Fx.value(t) : (E.val ? E.val(t) : 0));
  const generals = ['liubei', 'guanyu', 'zhangfei', 'zhugeliang', 'caocao', 'xiahoudun', 'guojia', 'sunquan', 'zhouyu', 'taishici', 'ganning', 'huangzhong', 'diaochan', 'lubu'];
  const summon = (g, s, type, rows) => Fx.summonN(g, s, type, 1, rows && rows.length ? { rows } : {}) || [];
  const myGeneral = (g, s, type) => Fx.own(g, s).filter(q => q.cell.t === type)[0];
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  // — 桃园/Shu brothers —
  def(960, 'Peach Garden Oath', 4, 'Three Kingdoms', 'heart', 'Summon Liu Bei, Guan Yu and Zhang Fei together — the sworn brothers take the field.', 'We three swear to live and die together.', (g, s) => {
    const near = [];
    const n = bd(g); const k = E.findKing(g, s);
    const cr = k ? k.r : n - 1, cc = k ? k.c : (n >> 1);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = cr + dr, c = cc + dc;
      if (r >= 0 && r < n && c >= 0 && c < n && !g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) near.push({ r, c });
    }
    const rows = ownRows(g, s);
    const lines = [];
    const spots = near.slice().sort(() => Math.random() - 0.5);
    const place = (type) => { const q = spots.pop(); if (q) { Fx.place(g, s, type, q.r, q.c, {}); lines.push(pname(type) + ' joins the oath.'); } else { const q2 = rand(Fx.emptySq(g, (r) => rows.includes(r))); if (q2) { Fx.place(g, s, type, q2.r, q2.c, {}); lines.push(pname(type) + ' joins the oath.'); } } };
    place('liubei'); place('guanyu'); place('zhangfei');
    return lines.length ? lines : ['The garden is already full.'];
  });
  def(961, 'Brother\'s Keeper', 2, 'Three Kingdoms', 'shield', 'Shield every friendly piece ADJACENT to one of your Shu heroes.', 'No brother falls while another stands.', (g, s) => {
    const shu = Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'shu'; });
    if (!shu.length) return ['No sworn brother to rally to.'];
    const guard = Fx.own(g, s).filter(q => shu.some(h => Math.abs(h.r - q.r) <= 1 && Math.abs(h.c - q.c) <= 1));
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    return n ? [n + ' defender' + (n > 1 ? 's are' : ' is') + ' shielded beside the brothers.'] : ['No one stands with the brothers yet.'];
  });
  def(962, 'Green Dragon Crescent', 3, 'Three Kingdoms', 'sword', 'Destroy the enemy piece in front of your most advanced Shu hero — Guan Yu\'s blade reaches far.', 'The blade that felled armies.', (g, s) => {
    const g2 = myGeneral(g, s, 'guanyu');
    const lead = g2 || (Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'shu'; }).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0]);
    if (!lead) return ['No hero to swing the blade.'];
    const dir = s === 'w' ? -1 : 1;
    let rr = lead.r + dir;
    while (rr >= 0 && rr < bd(g)) {
      const cell = g.board[rr][lead.c];
      if (cell) { if (cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, rr, lead.c, {}); return ['The Green Dragon blade cuts down the ' + pname(cell.t) + '.']; } break; }
      rr += dir;
    }
    return ['The blade finds empty air.'];
  });
  def(963, 'Zhang Fei\'s Roar', 3, 'Three Kingdoms', 'storm', 'Freeze every enemy adjacent to Zhang Fei, and any frozen enemy is destroyed.', 'A shout that stops an army.', (g, s) => {
    const z = myGeneral(g, s, 'zhangfei');
    if (!z) { const q = summon(g, s, 'zhangfei', backRows(g, s)); if (!q.length) return ['No Zhang Fei to roar.']; return ['Zhang Fei arrives, ready to roar.'].concat(q); }
    const near = foes(g, s).filter(q => Math.abs(q.r - z.r) <= 1 && Math.abs(q.c - z.c) <= 1);
    if (!near.length) return ['Zhang Fei roars at empty air.'];
    const lines = [];
    for (const q of near) { if (q.cell.b && q.cell.b.f > 0) { Fx.removeAt(g, q.r, q.c, {}); lines.push('A frozen enemy shatters at the roar.'); } else { Fx.mod(q.cell, 'f', 1); lines.push('An enemy is stunned by the roar.'); } }
    return lines;
  });
  def(964, 'Zhao Yun Rides', 3, 'Three Kingdoms', 'swap', 'Teleport your most advanced Shu hero to any empty square in the enemy\'s half, then shield it.', 'The lone general of Changban, unstoppable.', (g, s) => {
    const me = Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'shu'; }).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No Shu hero to ride forth.'];
    const dest = rand(Fx.emptySq(g, (r) => Fx.enemyHalfRows(g, s).includes(r)));
    if (!dest) return ['No landing ground behind the lines.'];
    Fx.relocate(g, me.r, me.c, dest.r, dest.c, {});
    Fx.mod(g.board[dest.r][dest.c], 's', 1);
    return ['A Shu hero gallops behind the lines, shielded.'];
  });
  def(965, 'Lord of Shu', 2, 'Three Kingdoms', 'crown', 'Summon Liu Bei beside your king; while he lives, your king is shielded.', 'The kindly lord who drew heroes to him.', (g, s) => {
    const lines = summon(g, s, 'liubei', backRows(g, s));
    if (!lines.length) return ['No room for the lord.'];
    const k = E.findKing(g, s);
    if (k) Fx.mod(g.board[k.r][k.c], 's', 1);
    return lines.concat(['Liu Bei shields his throne.']);
  });
  def(966, 'Shu Dynasty', 4, 'Three Kingdoms', 'crown', 'Every enemy piece on the same file as your most advanced Shu hero is destroyed.', 'The house of Liu takes its due.', (g, s) => {
    const me = Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'shu'; }).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No Shu hero to lead.'];
    const targets = foes(g, s).filter(q => q.c === me.c);
    if (!targets.length) return ['That file is clear.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('A foe on the hero\'s file falls.'); }
    return lines;
  });
  def(967, 'Empty Fort Strategy', 2, 'Three Kingdoms', 'void', 'Your king teleports anywhere safe on your back ranks, then every enemy piece on its old file is frozen.', 'An empty fort, a calm old man, and a routed army.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const old = { r: k.r, c: k.c };
    const dest = rand(Fx.emptySq(g, (r) => backRows(g, s).includes(r)));
    const lines = [];
    if (dest) { Fx.relocate(g, old.r, old.c, dest.r, dest.c, { text: 'move' }); lines.push('The king slips to an empty fort at ' + sq(dest.r, dest.c) + '.'); }
    const targets = foes(g, s).filter(q => q.c === old.c);
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    if (n) lines.push(n + ' pursuer' + (n > 1 ? 's are' : ' is') + ' frozen in the empty fort.');
    return lines.length ? lines : ['The fort stands silent.'];
  });
  def(968, 'Borrow Arrows', 2, 'Three Kingdoms', 'target', 'Every enemy piece that moved last turn is poisoned (their arrows are turned on them).', 'One hundred thousand arrows, courtesy of the enemy.', (g, s) => {
    const lm = g.lastMove;
    const hit = lm && lm.color !== s ? foes(g, s).filter(q => q.r === lm.to.r && q.c === lm.to.c) : [];
    const targets = hit.length ? hit : foes(g, s);
    const t = rand(targets);
    if (!t) return ['No target for the borrowed arrows.'];
    Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    return ['Borrowed arrows find the ' + pname(t.cell.t) + '.'];
  });
  def(969, 'Straw Boats', 2, 'Three Kingdoms', 'drop', 'Summon THREE husk "straw" pawns on your back ranks to draw the enemy\'s fire.', 'Decoys made of straw and spite.', (g, s) => {
    const lines = Fx.summonN(g, s, 'p', 3, { rows: backRows(g, s) });
    return lines.length ? lines : ['No straw left for decoys.'];
  });
  def(970, 'Zhuge\'s Banners', 3, 'Three Kingdoms', 'wind', 'Lay FOG over up to three squares of your own half, then shield your most advanced general.', 'Banners rise where none should be.', (g, s) => {
    const n = Fx.layZone(g, 'fog', 3, { rows: ownRows(g, s) }) || 0;
    const lines = [];
    if (n) lines.push('Deceptive banners shroud ' + n + ' squares.');
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (me) { Fx.mod(me.cell, 's', 1); lines.push(pname(me.cell.t) + ' is warded by the banners.'); }
    return lines.length ? lines : ['The banners hang still.'];
  });

  // — Wei / Cao Cao —
  def(971, 'Cao Cao\'s Ambition', 3, 'Three Kingdoms', 'crown', 'Summon Cao Cao, and every enemy piece worth more than a rook is frozen.', 'All under heaven is his to scheme for.', (g, s) => {
    const lines = summon(g, s, 'caocao', backRows(g, s));
    const big = foes(g, s).filter(q => value(q.cell.t) >= 900);
    const n = Fx.statusOn(g, big, 'f', 1, 'freeze');
    if (n) lines.push(n + ' mighty foe' + (n > 1 ? 's are' : ' is') + ' frozen by his schemes.');
    return lines.length ? lines : ['Cao Cao finds no stage.'];
  });
  def(972, 'Deceit of the South', 2, 'Three Kingdoms', 'swap', 'Swap the enemy\'s strongest piece with the enemy\'s weakest — their lines crumble.', 'Cao Cao confuses his foes with mirrors.', (g, s) => {
    const all = foes(g, s).filter(q => q.cell.t !== 'k');
    if (all.length < 2) return ['Not enough enemies to confound.'];
    const strong = all.slice().sort((a, b) => value(b.cell.t) - value(a.cell.t))[0];
    const weak = all.sort((a, b) => value(a.cell.t) - value(b.cell.t))[0];
    if (!strong || !weak || strong === weak) return ['The deceit fails.'];
    Fx.swapSq(g, strong, weak);
    return ['Their strongest and weakest change places in confusion.'];
  });
  def(973, 'Cao Cao\'s Warlords', 3, 'Three Kingdoms', 'storm', 'Summon a Wei warlord (Cao Cao, Xiahou Dun or Guo Jia) and give it a shield.', 'Hundreds of clans bend to one will.', (g, s) => {
    const pool = ['caocao', 'xiahoudun', 'guojia'];
    const type = pool[Math.floor(Math.random() * pool.length)];
    const lines = summon(g, s, type, backRows(g, s));
    const got = Fx.own(g, s).filter(q => q.cell.t === type).slice(-1)[0];
    if (got) Fx.mod(got.cell, 's', 1);
    return lines.length ? lines.concat([pname(type) + ' is shielded.']) : ['No Wei warlord answers.'];
  });
  def(974, 'Guo Jia\'s Forecast', 3, 'Three Kingdoms', 'rune', 'Poison every enemy in the enemy\'s back two ranks, and freeze their most advanced piece.', 'The strategist saw the storm before it came.', (g, s) => {
    const rows = s === 'w' ? [0, 1] : [bd(g) - 2, bd(g) - 1];
    const back = foes(g, s).filter(q => rows.includes(q.r));
    const lines = [];
    const n = Fx.statusOn(g, back, 'p', 1, 'poison');
    if (n) lines.push(n + ' foe' + (n > 1 ? 's' : '') + ' in their camp fall ill.');
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (lead) { Fx.mod(lead.cell, 'f', 1); lines.push('The vanguard is frozen by the forecast.'); }
    return lines.length ? lines : ['Guo Jia\'s forecast finds empty ground.'];
  });
  def(975, 'One-Eyed General', 2, 'Three Kingdoms', 'shield', 'Xiahou Dun bites the arrow: destroy the weakest enemy piece and shield your two most advanced heroes.', 'He ate his own eye and kept fighting.', (g, s) => {
    const weak = foes(g, s).sort((a, b) => value(a.cell.t) - value(b.cell.t))[0];
    const lines = [];
    if (weak) { Fx.removeAt(g, weak.r, weak.c, {}); lines.push('A weakling is cut down.'); }
    const heroes = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    const n = Fx.statusOn(g, heroes, 's', 1, 'shield');
    if (n) lines.push(n + ' hero' + (n > 1 ? 's' : '') + ' are shielded.');
    return lines.length ? lines : ['Xiahou Dun finds no battle.'];
  });
  def(976, 'Wei Campaign', 4, 'Three Kingdoms', 'sword', 'Destroy every enemy piece on the two files through your most advanced Wei hero.', 'The northern campaign rolls south.', (g, s) => {
    const me = Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'wei'; }).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No Wei general to lead the campaign.'];
    const targets = foes(g, s).filter(q => Math.abs(q.c - me.c) <= 1 && q.r !== me.r);
    if (!targets.length) return ['The campaign road is clear.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('The campaign claims a ' + pname(q.cell.t) + '.'); }
    return lines;
  });

  // — Wu / Sun Quan —
  def(977, 'Sun Quan Rises', 3, 'Three Kingdoms', 'crown', 'Summon Sun Quan and Zhou Yu together — the sons of the south.', 'The river kingdoms stand united.', (g, s) => {
    const lines = summon(g, s, 'sunquan', backRows(g, s));
    lines.push(...summon(g, s, 'zhouyu', backRows(g, s)));
    return lines.length ? lines : ['The south sends no sons.'];
  });
  def(978, 'Red Cliffs Fire', 4, 'Three Kingdoms', 'fire', 'Destroy every enemy piece on the enemy\'s two most advanced RANKS — the fire ships sail.', 'The wind blows east, and the river burns.', (g, s) => {
    const rows = s === 'w' ? [1, 2] : [bd(g) - 3, bd(g) - 2];
    const targets = foes(g, s).filter(q => rows.includes(q.r));
    if (!targets.length) return ['The fire ships find no fleet.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('The fire takes a ' + pname(q.cell.t) + '.'); }
    return lines;
  });
  def(979, 'Zhou Yu\'s Chariots', 3, 'Three Kingdoms', 'storm', 'Freeze every enemy adjacent to your most advanced Wu hero; then poison their second-line.', 'The governor commands fire and ice.', (g, s) => {
    const me = Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'wu'; }).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No Wu hero to command.'];
    const near = foes(g, s).filter(q => Math.abs(q.r - me.r) <= 1 && Math.abs(q.c - me.c) <= 1);
    const lines = [];
    const n = Fx.statusOn(g, near, 'f', 1, 'freeze');
    if (n) lines.push(n + ' nearby foe' + (n > 1 ? 's are' : ' is') + ' frozen.');
    const far = foes(g, s).filter(q => !(Math.abs(q.r - me.r) <= 1 && Math.abs(q.c - me.c) <= 1)).slice(0, 2);
    const p = Fx.statusOn(g, far, 'p', 1, 'poison');
    if (p) lines.push('The second line is poisoned.');
    return lines.length ? lines : ['Zhou Yu finds no enemy fleet.'];
  });
  def(980, 'Wu Generals', 3, 'Three Kingdoms', 'storm', 'Summon a Wu hero (Tai Shi Ci, Gan Ning or Zhou Yu) and shield the most advanced one you have.', 'The river delta breeds legends.', (g, s) => {
    const pool = ['taishici', 'ganning', 'zhouyu', 'huangzhong'];
    const type = pool[Math.floor(Math.random() * pool.length)];
    const lines = summon(g, s, type, backRows(g, s));
    const got = Fx.own(g, s).filter(q => q.cell.t === type).slice(-1)[0];
    if (got) Fx.mod(got.cell, 's', 1);
    return lines.length ? lines.concat([pname(type) + ' is shielded.']) : ['The delta sends no hero.'];
  });
  def(981, 'Borrow the Wind', 2, 'Three Kingdoms', 'wind', 'Poison every enemy on the file of your most advanced Wu hero — the east wind carries it.', 'The wind belongs to whoever needs it most.', (g, s) => {
    const me = Fx.own(g, s).filter(q => { const d = MD.TROOPS[q.cell.t]; return d && d.sworn === 'wu'; }).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No Wu hero to lend the wind.'];
    const targets = foes(g, s).filter(q => q.c === me.c);
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    return n ? [n + ' foe' + (n > 1 ? 's' : '') + ' on the wind file fall ill.'] : ['The east wind is still.'];
  });

  // — Cross-state stratagems & wildcards —
  def(982, 'Three Visits', 3, 'Three Kingdoms', 'rune', 'If you have no Zhuge Liang, summon him; otherwise he fires a long volley at the enemy\'s strongest piece.', 'Three visits, and the sleeping dragon wakes.', (g, s) => {
    const z = myGeneral(g, s, 'zhugeliang');
    if (!z) { const lines = summon(g, s, 'zhugeliang', backRows(g, s)); return lines.length ? lines : ['No hut to visit.']; }
    const t = foes(g, s).sort((a, b) => value(b.cell.t) - value(a.cell.t))[0];
    if (!t) return ['Zhuge Liang sees nothing worth his arrows.'];
    if (E.strike) { const hit = E.strike(g, t.r, t.c, 0, s); if (hit) return ['Zhuge Liang\'s volley destroys the ' + pname(t.cell.t) + '.']; }
    return ['Zhuge Liang declines to waste arrows.'];
  });
  def(983, 'Sleeping Dragon', 4, 'Three Kingdoms', 'void', 'Zhuge Liang foretells ruin: DOOM every enemy piece that shares a file or rank with your most advanced general.', 'He knew how this would end before it began.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No general to prophecy.'];
    const targets = foes(g, s).filter(q => q.r === me.r || q.c === me.c);
    const n = Fx.statusOn(g, targets, 'doom', 1, 'poison');
    return n ? ['The prophecy falls on ' + n + ' enemy' + (n > 1 ? 's' : '') + '.'] : ['The dragon sleeps undisturbed.'];
  });
  def(984, 'Lu Bu Among Men', 4, 'Three Kingdoms', 'fire', 'Summon Lu Bu — a monster of a warrior worth 1600. He shatters whoever he captures.', 'Among men, Lu Bu; among horses, Red Hare.', (g, s) => {
    const lines = summon(g, s, 'lubu', ownRows(g, s));
    return lines.length ? lines : ['No battlefield worthy of Lu Bu.'];
  });
  def(985, 'Red Hare', 2, 'Three Kingdoms', 'swap', 'Your most advanced hero surges two squares forward (or as far as it can go).', 'The finest horse in the realm.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No hero to mount.'];
    const dir = s === 'w' ? -1 : 1;
    const one = me.r + dir;
    if (one < 0 || one >= bd(g) || g.board[one][me.c]) return ['The path is blocked.'];
    const two = me.r + 2 * dir;
    if (two >= 0 && two < bd(g) && !g.board[two][me.c]) { Fx.relocate(g, me.r, me.c, two, me.c, {}); return [pname(me.cell.t) + ' charges two squares on Red Hare.']; }
    Fx.relocate(g, me.r, me.c, one, me.c, {});
    return [pname(me.cell.t) + ' surges forward on Red Hare.'];
  });
  def(986, 'Seven Retreats, Eight Formations', 3, 'Three Kingdoms', 'wind', 'Lay FOG over up to four squares of the enemy\'s half — the maze confounds their advance.', 'Zhuge Liang\'s stone maze swallows whole armies.', (g, s) => {
    const n = Fx.layZone(g, 'fog', 4, { rows: Fx.enemyHalfRows(g, s) }) || 0;
    return n ? ['The eight formations shroud ' + n + ' squares of their half.'] : ['No ground for the maze.'];
  });
  def(987, 'The Three Brothers', 2, 'Three Kingdoms', 'sword', 'If you control any two of Liu Bei, Guan Yu or Zhang Fei adjacent, destroy the enemy piece nearest them.', 'United, they were unstoppable.', (g, s) => {
    const trio = ['liubei', 'guanyu', 'zhangfei'];
    const owned = Fx.own(g, s).filter(q => trio.includes(q.cell.t));
    if (owned.length < 2) { const lines = summon(g, s, trio[Math.floor(Math.random() * trio.length)], backRows(g, s)); return lines.length ? lines : ['The brothers are scattered.']; }
    const pivot = owned[0];
    const near = foes(g, s).sort((a, b) => (Math.abs(a.r - pivot.r) + Math.abs(a.c - pivot.c)) - (Math.abs(b.r - pivot.r) + Math.abs(b.c - pivot.c)))[0];
    if (!near) return ['The brothers find no foe.'];
    Fx.removeAt(g, near.r, near.c, {});
    return ['The brothers strike down the nearest foe.'];
  });
  def(988, 'Romance of War', 3, 'Three Kingdoms', 'skull', 'Every enemy piece worth at least a rook is destroyed, but your most advanced hero is frozen (a duel costs both sides).', 'A duel between legends leaves both scarred.', (g, s) => {
    const big = foes(g, s).filter(q => value(q.cell.t) >= 500);
    const lines = [];
    for (const q of big) { Fx.removeAt(g, q.r, q.c, {}); lines.push('A mighty ' + pname(q.cell.t) + ' falls in the duel.'); }
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (me) { Fx.mod(me.cell, 'f', 1); lines.push('Your champion is spent by the duel.'); }
    return lines.length ? lines : ['The romance passes without blood.'];
  });
  def(989, 'Cavalry of the North', 2, 'Three Kingdoms', 'swap', 'Your two most advanced heroes each step one square sideways toward the centre, shielded.', 'The northern horsemen wheel in unison.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    if (!me.length) return ['No heroes to wheel.'];
    const lines = [];
    for (const q of me) {
      const half = Fx.half(g);
      const nc = q.c < half ? q.c + 1 : q.c - 1;
      if (nc >= 0 && nc < bd(g) && !g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); Fx.mod(g.board[q.r][nc], 's', 1); lines.push(pname(q.cell.t) + ' wheels inward, shielded.'); }
    }
    return lines.length ? lines : ['The cavalry is boxed in.'];
  });
  def(990, 'Ambush at Changban', 3, 'Three Kingdoms', 'leaf', 'Lay THORNS on up to three random empty squares beside your most advanced general.', 'The forest hides a hundred ambushes.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No general to set the ambush.'];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = me.r + dr, c = me.c + dc;
      if (r >= 0 && r < bd(g) && c >= 0 && c < bd(g) && !g.board[r][c] && !E.isTerrain(g, r, c)) spots.push({ r, c });
    }
    let n = 0;
    spots.sort(() => Math.random() - 0.5).slice(0, 3).forEach(q => { if (E.setZone(g, q.r, q.c, 'thorns')) n++; });
    return n ? ['Thorns spring up around the general\'s position.'] : ['No thicket can grow here.'];
  });
  def(991, 'Letters of Feint', 2, 'Three Kingdoms', 'void', 'Freeze two random enemy pieces, and if your king is threatened (adjacent enemy), shield it.', 'A letter of peace while the sword is drawn.', (g, s) => {
    const lines = [];
    const all = foes(g, s);
    const picks = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    const n = Fx.statusOn(g, picks, 'f', 1, 'freeze');
    if (n) lines.push(n + ' foe' + (n > 1 ? 's are' : ' is') + ' distracted by feints.');
    const k = E.findKing(g, s);
    if (k && foes(g, s).some(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1)) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is shielded from the lurking blade.'); }
    return lines.length ? lines : ['The letters go unanswered.'];
  });
  def(992, 'Diao Chan\'s Dance', 3, 'Three Kingdoms', 'moon', 'Freeze the enemy\'s two strongest pieces — the dance turns brother against brother.', 'A beauty that unmade an empire.', (g, s) => {
    const top = foes(g, s).sort((a, b) => value(b.cell.t) - value(a.cell.t)).slice(0, 2);
    const n = Fx.statusOn(g, top, 'f', 1, 'freeze');
    if (!n) return ['The dance captivates no one.'];
    const lines = [n + ' mighty foe' + (n > 1 ? 's are' : ' is') + ' frozen by the dance.'];
    const d = myGeneral(g, s, 'diaochan') || null;
    if (!d) lines.push(...summon(g, s, 'diaochan', backRows(g, s)));
    return lines;
  });
  def(993, 'Troop Rations', 1, 'Three Kingdoms', 'heart', 'Cleanse every friendly hero and shield your king.', 'An army marches on its stomach.', (g, s) => {
    const lines = [];
    for (const q of Fx.own(g, s)) if (MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn && q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is provisioned and shielded.'); }
    return lines.length ? lines : ['Rations are short today.'];
  });
  def(994, 'Conqueror\'s Edict', 3, 'Three Kingdoms', 'crown', 'If you control at least THREE sworn heroes, destroy a random enemy piece on each of three different files.', 'The realm trembles at the edict.', (g, s) => {
    const heroes = Fx.own(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn);
    if (heroes.length < 3) { const lines = summon(g, s, generals[Math.floor(Math.random() * generals.length)], backRows(g, s)); return lines.length ? ['A general answers the edict.'].concat(lines) : ['The edict goes unheard.']; }
    const lines = [];
    const files = foes(g, s).map(q => q.c).filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5).slice(0, 3);
    for (const c of files) {
      const onFile = foes(g, s).filter(q => q.c === c);
      const t = rand(onFile);
      if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('The edict claims a ' + pname(t.cell.t) + '.'); }
    }
    return lines.length ? lines : ['The edict finds no enemies.'];
  });
  def(995, 'Faithful Retainers', 2, 'Three Kingdoms', 'shield', 'Shield every sworn hero you control and give your most advanced one a free step forward.', 'Loyalty is the rarest coin.', (g, s) => {
    const heroes = Fx.own(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn);
    if (!heroes.length) return ['No retainers to reward.'];
    const lines = [];
    const n = Fx.statusOn(g, heroes, 's', 1, 'shield');
    if (n) lines.push(n + ' hero' + (n > 1 ? 's' : '') + ' are shielded.');
    const me = heroes.sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    const dir = s === 'w' ? -1 : 1;
    if (me) { const r = me.r + dir; if (r >= 0 && r < bd(g) && !g.board[r][me.c]) { Fx.relocate(g, me.r, me.c, r, me.c, {}); lines.push('Your champion steps forward.'); } }
    return lines;
  });
  def(996, 'Halo of the Heavens', 3, 'Three Kingdoms', 'star', 'A true ruler shields the board: every friendly hero gains a shield and every enemy piece adjacent to them is frozen.', 'Heaven favours the virtuous ruler.', (g, s) => {
    const heroes = Fx.own(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn);
    if (!heroes.length) { const q = summon(g, s, 'liubei', backRows(g, s)); return q.length ? q.concat(['A benevolent lord appears.']) : ['No hero answers heaven.']; }
    const lines = [];
    const n = Fx.statusOn(g, heroes, 's', 1, 'shield');
    if (n) lines.push(n + ' hero' + (n > 1 ? 's' : '') + ' are blessed.');
    const near = foes(g, s).filter(q => heroes.some(h => Math.abs(h.r - q.r) <= 1 && Math.abs(h.c - q.c) <= 1));
    const m = Fx.statusOn(g, near, 'f', 1, 'freeze');
    if (m) lines.push('Enemies beside the heroes are frozen.');
    return lines;
  });
  def(997, 'Divide the Kingdom', 4, 'Three Kingdoms', 'crown', 'Destroy every enemy piece worth less than a rook, then your strongest hero is shielded — the realm is yours to split.', 'Three kingdoms, one throne.', (g, s) => {
    const targets = foes(g, s).filter(q => value(q.cell.t) < 500);
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('A lesser ' + pname(q.cell.t) + ' is swept aside.'); }
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => value(b.cell.t) - value(a.cell.t))[0];
    if (me) { Fx.mod(me.cell, 's', 1); lines.push('Your greatest champion is shielded.'); }
    return lines.length ? lines : ['The kingdom is already divided.'];
  });
  def(998, 'Spear of the North', 2, 'Three Kingdoms', 'paw', 'Summon a Shu or Wei hero of your choice near your most advanced pawn.', 'The spear points where the army goes.', (g, s) => {
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!p) return ['No vanguard to lead.'];
    const type = ['zhangfei', 'xiahoudun', 'caocao', 'huangzhong'][Math.floor(Math.random() * 4)];
    const dir = s === 'w' ? 1 : -1;
    const r = p.r + dir;
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = p.r + dr, cc = p.c + dc;
      if (rr >= 0 && rr < bd(g) && cc >= 0 && cc < bd(g) && !g.board[rr][cc]) spots.push({ r: rr, c: cc });
    }
    const q = rand(spots);
    if (!q) return ['No room beside the vanguard.'];
    Fx.place(g, s, type, q.r, q.c, {});
    return [pname(type) + ' rallies at the front.'];
  });
  def(999, 'Crossbow Volley', 2, 'Three Kingdoms', 'target', 'Every enemy piece on the file of a random enemy piece is poisoned — Zhuge\'s repeating crossbows.', 'Ten bolts a breath.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['No target to sight.'];
    const targets = foes(g, s).filter(q => q.c === t.c);
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    return n ? ['The crossbows venom ' + n + ' foe' + (n > 1 ? 's' : '') + ' on file ' + 'abcdefghijkl'[t.c] + '.'] : ['The bolts find no flesh.'];
  });
  def(1000, 'The Governor of Wu', 2, 'Three Kingdoms', 'drop', 'Summon a Wu hero on the square where your most advanced pawn will soon stand, then advance that pawn past it.', 'The river governor\'s banners follow the fleet.', (g, s) => {
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!p) return ['No pawn to escort.'];
    const dir = s === 'w' ? -1 : 1;
    const r1 = p.r + dir;
    const type = ['sunquan', 'zhouyu', 'taishici', 'ganning'][Math.floor(Math.random() * 4)];
    const lines = [];
    if (r1 >= 0 && r1 < bd(g) && !g.board[r1][p.c]) {
      Fx.place(g, s, type, r1, p.c, {});
      Fx.relocate(g, p.r, p.c, p.r + dir, p.c, {});
      lines.push(pname(type) + ' escorts the vanguard forward.');
    } else { const q = summon(g, s, type, backRows(g, s)); if (q.length) lines.push(pname(type) + ' marches to the rear.'); }
    return lines.length ? lines : ['The escort cannot deploy.'];
  });
  def(1001, 'Barbarian Cavalry', 3, 'Three Kingdoms', 'swap', 'Teleport your strongest hero to the square of the enemy\'s most advanced piece, capturing it if they stand there.', 'The southern tribes answer the call.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => value(b.cell.t) - value(a.cell.t))[0];
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me || !lead) return ['No warrior to ride.'];
    Fx.relocate(g, me.r, me.c, lead.r, lead.c, {});
    Fx.removeAt(g, lead.r, lead.c, {});
    return ['The barbarian cavalry overruns the enemy vanguard.'];
  });
  def(1002, 'Burn the Grasslands', 2, 'Three Kingdoms', 'fire', 'Set fire to three random empty squares of your own half, then advance your most advanced hero one step.', 'Burn it all, and let the enemy inherit ashes.', (g, s) => {
    const n = Fx.layZone(g, 'fire', 3, { rows: ownRows(g, s) }) || 0;
    const lines = [];
    if (n) lines.push('You scorch ' + n + ' squares behind you.');
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (me) { const dir = s === 'w' ? -1 : 1; const r = me.r + dir; if (r >= 0 && r < bd(g) && !g.board[r][me.c]) { Fx.relocate(g, me.r, me.c, r, me.c, {}); lines.push('Your champion falls back through the fire.'); } }
    return lines.length ? lines : ['The earth stays green.'];
  });
  def(1003, 'Ironclad Vanguard', 3, 'Three Kingdoms', 'shield', 'Shield your two most advanced heroes and give them each a free step forward.', 'Steel cannot be unmade by arrows.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    if (!me.length) return ['No ironclad heroes to lead.'];
    const n = Fx.statusOn(g, me, 's', 1, 'shield');
    const lines = [];
    if (n) lines.push(n + ' hero' + (n > 1 ? 's' : '') + ' are shielded.');
    for (const q of me) { const dir = s === 'w' ? -1 : 1; const r = q.r + dir; if (r >= 0 && r < bd(g) && !g.board[r][q.c]) { Fx.relocate(g, q.r, q.c, r, q.c, {}); lines.push(pname(q.cell.t) + ' advances.'); } }
    return lines.length ? lines : ['The iron wall holds.'];
  });
  def(1004, 'The Final Duel', 4, 'Three Kingdoms', 'sword', 'Destroy the enemy\'s strongest piece, then your strongest hero duels the next — frozen as the price of glory.', 'Two champions, one clear sky.', (g, s) => {
    const t = foes(g, s).sort((a, b) => value(b.cell.t) - value(a.cell.t))[0];
    const lines = [];
    if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('The champion ' + pname(t.cell.t) + ' is slain in single combat.'); }
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => value(b.cell.t) - value(a.cell.t))[0];
    if (me) { Fx.mod(me.cell, 'f', 1); lines.push('Your champion is spent by the duel.'); }
    return lines.length ? lines : ['No duel is struck.'];
  });
  def(1005, 'Grass for Horses', 1, 'Three Kingdoms', 'leaf', 'Cleanse poison and freeze from your whole army and shield your most advanced hero.', 'Feed the horses; the war continues tomorrow.', (g, s) => {
    for (const q of Fx.own(g, s)) if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; }
    const lines = ['The army is rested and cleansed.'];
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (me) { Fx.mod(me.cell, 's', 1); lines.push('Your champion is fed and shielded.'); }
    return lines;
  });
  def(1006, 'Ambush General', 2, 'Three Kingdoms', 'void', 'Your most advanced hero swaps with your LEAST advanced one — an ambush from the rear.', 'They never see the blade behind them.', (g, s) => {
    const heroes = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn);
    if (heroes.length < 2) { const q = summon(g, s, generals[Math.floor(Math.random() * generals.length)], backRows(g, s)); return q.length ? q : ['No generals to ambush with.']; }
    const front = heroes.slice().sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    const back = heroes.sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (front === back) return ['Only one general answers.'];
    Fx.swapSq(g, front, back);
    return ['The front and rear generals spring an ambush.'];
  });
  def(1007, 'The Mandate of Heaven', 5, 'Three Kingdoms', 'star', 'Destroy every enemy piece standing in your half, then summon a random hero of every faction.', 'Heaven\'s mandate has passed to a new house.', (g, s) => {
    const lines = [];
    const inv = foes(g, s).filter(q => Fx.ownHalfRows(g, s).includes(q.r));
    for (const q of inv) { Fx.removeAt(g, q.r, q.c, {}); lines.push('An invader on your ground is smitten.'); }
    ['liubei', 'caocao', 'sunquan'].forEach(t => lines.push(...summon(g, s, t, backRows(g, s))));
    return lines.length ? lines : ['Heaven is silent.'];
  });
  def(1008, 'Feint to the East', 2, 'Three Kingdoms', 'wind', 'Veil your most advanced hero (only adjacent pieces can capture it), then it steps toward the enemy.', 'Strike east, march west.', (g, s) => {
    const me = mine(g, s).filter(q => MD.TROOPS[q.cell.t] && MD.TROOPS[q.cell.t].sworn).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No hero to feint with.'];
    Fx.veilOn(g, [me], null, 1);
    const dir = s === 'w' ? -1 : 1;
    const lines = [pname(me.cell.t) + ' slips into the mist.'];
    const r = me.r + dir;
    if (r >= 0 && r < bd(g) && !g.board[r][me.c]) { Fx.relocate(g, me.r, me.c, r, me.c, {}); lines.push('It drifts toward the enemy.'); }
    return lines;
  });
  def(1009, 'Unify the Realm', 5, 'Three Kingdoms', 'crown', 'The long war ends: destroy every enemy piece worth more than a pawn, then take an extra move under the new dynasty.', 'After a hundred years, one throne.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.t !== 'p');
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('The realm is claimed from the ' + pname(q.cell.t) + '.'); }
    Fx.grantExtra(g, s, 1);
    lines.push('A new dynasty begins — move again.');
    return lines;
  });

  MD.AB_20 = A;
})();

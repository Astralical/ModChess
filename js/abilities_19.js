/* ============================================================
   Mod Chess — Ability set 19: THE OUTBREAK (zombies, doomsday,
   virus & biohazards)   IDs 855-929.
   The dead do not stay dead. Poison spreads like a plague, the
   fallen rise again, and biohazard zones quarantine the board.
   Theme troop: Plague Bearer (counter: doom) — capture it and
   the capturer is death-marked.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const pname = t => (MD.pieceName ? MD.pieceName(t) : t);
  const sq = (r, c) => E.sqName(r, c);
  const N = g => (g.n | 0) || 8;
  const bd = g => Fx.bd(g);
  const rand = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : null);
  const foes = (g, s) => Fx.enemy(g, s).filter(q => q.cell.t !== 'k');
  const mine = (g, s) => Fx.own(g, s).filter(q => q.cell.t !== 'k');
  const undead = ['lich', 'banshee', 'reaper', 'gremlin', 'ghast', 'plaguebearer', 'nue', 'yasha'];
  const dead = t => Fx.value ? Fx.value(t) : (E.val ? E.val(t) : 0);
  const ownHalf = (g, s) => Fx.ownHalfRows ? Fx.ownHalfRows(g, s) : [];
  const enemyHalf = (g, s) => Fx.enemyHalfRows ? Fx.enemyHalfRows(g, s) : [];
  const emptiesIn = (g, rows) => {
    const n = N(g); const out = [];
    for (const r of rows) for (let c = 0; c < n; c++) if (!g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) out.push({ r, c });
    return out;
  };
  const raise = (g, s, type, rows) => Fx.summonN ? Fx.summonN(g, s, type, 1, rows && rows.length ? { rows } : {}) : [];
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });
  // helper: every enemy whose cell is poisoned/doomed/veiled/standing on a miasma zone
  const sick = (g, s) => foes(g, s).filter(q => {
    const b = q.cell.b || {};
    const z = E.zoneAt ? E.zoneAt(g, q.r, q.c) : null;
    return b.p > 0 || b.doom > 0 || (z && (z.kind === 'mire' || z.kind === 'fire' || z.kind === 'thorns'));
  });
  const layMiasma = (g, rows, kind, n) => { try { return Fx.layZone(g, kind || 'fire', n || 3, { rows: rows && rows.length ? rows : null }) || 0; } catch (e) { return 0; } };

  // ============ A. THE RISEN — undead summons & reanimation ============
  def(855, 'Rise From the Grave', 1, 'Zombie', 'skull', 'Raise a random undead (lich, banshee, reaper, gremlin…) into your service.', 'The soil turns and gives back its own.', (g, s) => {
    const lines = Fx.summonN(g, s, rand(undead) || 'lich', 1);
    return lines.length ? lines : ['No room for the dead to rise.'];
  });
  def(856, 'Graveyard Shift', 1, 'Zombie', 'skull', 'Summon three "husk" pawns on your back ranks — cheap labour for the outbreak.', 'The dead clock in.', (g, s) => {
    const lines = Fx.summonN(g, s, 'p', 3, { rows: Fx.backRows(g, s) });
    return lines.length ? lines : ['The graveyard is full.'];
  });
  def(857, 'Necromancer\'s Edict', 3, 'Zombie', 'rune', 'Destroy a random enemy piece; if it dies, raise a husk pawn in its place — for you.', 'Death is a doorway. The doorway swings both ways.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['The edict echoes into silence.'];
    Fx.removeAt(g, t.r, t.c, {});
    const lines = ['The enemy ' + pname(t.cell.t) + ' is cut down.'];
    if (!g.board[t.r][t.c]) { Fx.place(g, s, 'p', t.r, t.c, {}); lines.push('A husk rises from the corpse.'); }
    return lines;
  });
  def(858, 'Cadaver Conveyor', 2, 'Zombie', 'storm', 'Your two most advanced pawns are reanimated as a Gremlin and a Nue (they keep your colours).', 'Assembly line of the damned.', (g, s) => {
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    const lines = [];
    const kinds = ['gremlin', 'nue'];
    for (let i = 0; i < ps.length; i++) { ps[i].cell.t = kinds[i]; Fx.flash(g, ps[i].r, ps[i].c, 'transform', ''); lines.push('A pawn reanimates into a ' + pname(kinds[i]) + '.'); }
    return lines.length ? lines : ['No pawns to reanimate.'];
  });
  def(859, 'Rotten Tide', 2, 'Zombie', 'drop', 'Every enemy PAWN on the board becomes a husk under your command.', 'The horde turns your own pawns.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.t === 'p').sort(() => Math.random() - 0.5).slice(0, 6);
    if (!targets.length) return ['No enemy pawns to corrupt.'];
    const lines = [];
    for (const q of targets) { q.cell.c = s; Fx.flash(g, q.r, q.c, 'transform', ''); lines.push('An enemy pawn joins your rotting horde.'); }
    return lines;
  });
  def(860, 'The Horde Marches', 3, 'Zombie', 'storm', 'Summon a Plague Bearer AND two husk pawns at your front line.', 'One of them is patient. All of them are hungry.', (g, s) => {
    const rows = s === 'w' ? [3, 4, 5] : [2, 3, 4];
    const lines = raise(g, s, 'plaguebearer', rows);
    lines.push(...Fx.summonN(g, s, 'p', 2, { rows }));
    return lines.length ? lines : ['The horde finds no ground.']; 
  });
  def(861, 'Zombie Apocalypse', 4, 'Zombie', 'rune', 'Every husk pawn you control is upgraded to a random undead creature.', 'This is how it starts. This is how it always starts.', (g, s) => {
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p');
    const lines = [];
    const pool = ['gremlin', 'nue', 'banshee', 'yasha', 'plaguebearer'];
    for (const q of ps.slice(0, 8)) { q.cell.t = rand(pool) || 'gremlin'; Fx.flash(g, q.r, q.c, 'transform', ''); lines.push('A husk crawls into a ' + pname(q.cell.t) + '.'); }
    return lines.length ? lines : ['No husks to evolve.'];
  });
  def(862, 'Last Rites Denied', 2, 'Zombie', 'heart', 'Revive a fallen piece from YOUR graveyard, corrupted as a husk pawn if no champion remains.', 'The grave cannot keep them.', (g, s) => {
    const lines = Fx.revive(g, s, 1);
    return lines.length ? lines : Fx.summonN(g, s, 'p', 1) || ['Nothing worth digging up.'];
  });
  def(863, 'Grave Robber', 1, 'Zombie', 'coin', 'Conscript the strongest piece YOU captured this match (revive a prisoner to your side).', 'A coin for the dead, a blade for the living.', (g, s) => {
    const g2 = g;
    const pool = (g2.capt && g2.capt[s] ? g2.capt[s].filter(p => p.t !== 'k') : []);
    if (pool.length) { const t = pool.sort((a, b) => dead(b.t) - dead(a.t))[0]; const lines = Fx.summonN(g, s, t.t, 1, { rows: Fx.backRows(g, s) }); if (lines.length) { const ci = g2.capt[s].indexOf(t); if (ci >= 0) g2.capt[s].splice(ci, 1); return lines.concat(['A prisoner is conscripted to your horde.']); } }
    return Fx.summonN(g, s, 'gremlin', 1, { rows: Fx.backRows(g, s) }).concat ? Fx.summonN(g, s, 'gremlin', 1, { rows: Fx.backRows(g, s) }) : ['No prisoners to rob.'];
  });
  def(864, 'Morgue Muster', 2, 'Zombie', 'clock', 'Take an extra move — your husks shamble into position first (all husk pawns get one free step forward).', 'Even the dead keep to a schedule.', (g, s) => {
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    let moved = 0;
    for (const p of ps.slice(0, 5)) { const nr = p.r + (s === 'w' ? -1 : 1); if (nr >= 0 && nr < bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; } }
    Fx.grantExtra(g, s, 1);
    const lines = ['The horde shambles forward — extra move gained.'];
    if (moved) lines.unshift(moved + ' husk' + (moved > 1 ? 's' : '') + ' lurch forward.');
    return lines;
  });
  def(865, 'Buried Alive', 2, 'Zombie', 'target', 'Bury a random enemy piece under a mound: it is frozen (can\'t move) for a turn.', 'The earth has its own appetite.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['The ground is quiet.'];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['The enemy ' + pname(t.cell.t) + ' is buried and frozen.'];
  });
  def(866, 'Corpse Bomb', 3, 'Zombie', 'fire', 'A random husk pawn detonates like a bloated corpse, destroying every enemy beside it.', 'It was never going to stay down.', (g, s) => {
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p');
    const p = rand(ps);
    if (!p) return ['No corpse to sacrifice.'];
    Fx.removeAt(g, p.r, p.c, {});
    let gone = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = p.r + dr, c = p.c + dc;
      if (r < 0 || r >= bd(g) || c < 0 || c >= bd(g)) continue;
      const t = g.board[r][c];
      if (t && t.c !== s && t.t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
    }
    return ['The husk bursts — ' + gone + ' enemy' + (gone === 1 ? '' : 'ies') + (gone === 0 ? '' : (gone === 1 ? ' caught' : ' caught')) + ' in the blast.'];
  });
  def(867, 'Rigor Mortis', 1, 'Zombie', 'bolt', 'Freeze a random enemy piece and poison another.', 'Stiff joints and failing breath.', (g, s) => {
    const all = foes(g, s); const lines = [];
    const t1 = rand(all); if (t1) { Fx.mod(t1.cell, 'f', 1); Fx.flash(g, t1.r, t1.c, 'freeze', ''); lines.push('One enemy stiffens.'); }
    const t2 = rand(all.filter(q => q !== t1)); if (t2) { Fx.mod(t2.cell, 'p', 1); Fx.flash(g, t2.r, t2.c, 'poison', ''); lines.push('Another begins to rot.'); }
    return lines.length ? lines : ['No living targets.'];
  });
  def(868, 'Second Bite', 2, 'Zombie', 'paw', 'Every enemy piece that is ALREADY poisoned is destroyed.', 'Once is a wound. Twice is a feast.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    if (!targets.length) return ['No infected prey to finish.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('A rotting enemy is devoured.'); }
    return lines;
  });
  def(869, 'Infection Spreads', 3, 'Zombie', 'drop', 'Poison THREE random enemy pieces.', 'It does not need to be fast. It only needs to keep moving.', (g, s) => {
    const n = Fx.poisonN(g, s, 3);
    return n ? ['The infection claims ' + n + ' enemy' + (n > 1 ? 's' : '') + '.'] : ['No blood to infect.'];
  });
  def(870, 'Plague Ship', 2, 'Zombie', 'storm', 'Poison every enemy on the two files your most advanced piece stands on.', 'Rats. Fever. Then the quiet.', (g, s) => {
    const me = Fx.own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No carrier aboard.'];
    const targets = foes(g, s).filter(q => q.c === me.c);
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    return n ? [n + ' enemy' + (n > 1 ? 's' : '') + ' on file ' + 'abcdefghijkl'[me.c] + ' are infected.'] : ['The plague finds no hosts on that file.'];
  });
  def(871, 'Doomsayer', 3, 'Zombie', 'eye', 'DOOM the enemy\'s strongest piece — it dies at the end of its next turn, quietly.', 'He saw this coming. We should have listened.', (g, s) => {
    const t = foes(g, s).sort((a, b) => dead(b.cell.t) - dead(a.cell.t))[0];
    if (!t) return ['The prophet finds no one to warn.'];
    Fx.mod(t.cell, 'doom', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    return ['The ' + pname(t.cell.t) + ' is marked for doom.'];
  });
  def(872, 'Harbinger', 4, 'Zombie', 'void', 'DOOM every enemy piece standing on the front two ranks of the enemy\'s half.', 'What walks before the storm is worse than the storm.', (g, s) => {
    const rows = s === 'w' ? [1, 2] : [N(g) - 3, N(g) - 2];
    const targets = foes(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, targets, 'doom', 1, 'poison');
    return n ? ['The harbinger marks ' + n + ' enemy' + (n > 1 ? 's' : '') + ' for the end.'] : ['The harbinger passes by empty ground.'];
  });
  def(873, 'Feast of Crows', 2, 'Zombie', 'paw', 'Every enemy DOOMED piece is destroyed now, and one of your pawns gains a shield.', 'The birds know before we do.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.doom > 0);
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('A doomed enemy falls to the flock.'); }
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort(() => Math.random() - 0.5)[0];
    if (p) { Fx.mod(p.cell, 's', 1); lines.push('A vanguard husk is shielded.'); }
    return lines.length ? lines : ['The crows circle an empty field.'];
  });
  def(874, 'Necrotic Harvest', 2, 'Zombie', 'leaf', 'Gain a husk pawn for EVERY enemy piece currently poisoned, doomed, or frozen.', 'Death pays its tithe.', (g, s) => {
    const count = foes(g, s).filter(q => { const b = q.cell.b || {}; return b.p > 0 || b.doom > 0 || b.f > 0; }).length;
    if (!count) return ['The harvest is barren.'];
    const lines = Fx.summonN(g, s, 'p', Math.min(6, count), { rows: Fx.backRows(g, s) });
    return lines.length ? lines : ['No room to store the dead.'];
  });

  // ============ B. THE OUTBREAK — contagion, poison & quarantine ============
  def(875, 'Patient Zero', 2, 'Zombie', 'rune', 'Poison a random enemy piece; then all enemy pieces ADJACENT to it are poisoned too.', 'Every plague has a first body.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['No first body found.'];
    Fx.mod(t.cell, 'p', 1);
    const lines = ['Patient zero is infected.'];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = t.r + dr, c = t.c + dc;
      if (r < 0 || r >= bd(g) || c < 0 || c >= bd(g)) continue;
      const cell = g.board[r][c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.mod(cell, 'p', 1); lines.push('A neighbour is infected.'); }
    }
    return lines;
  });
  def(876, 'Airborne Strain', 3, 'Zombie', 'wind', 'Poison every enemy on the same RANK as the most crowded enemy file.', 'It travels on the breath.', (g, s) => {
    const ranks = [];
    for (const q of foes(g, s)) ranks.push(q.r);
    const target = foes(g, s).sort((a, b) => foes(g, s).filter(x => x.r === b.r).length - foes(g, s).filter(x => x.r === a.r).length)[0];
    if (!target) return ['No crowd to infect.'];
    const hits = foes(g, s).filter(q => q.r === target.r);
    const n = Fx.statusOn(g, hits, 'p', 1, 'poison');
    return n ? [n + ' enemy' + (n > 1 ? 's' : '') + ' on a crowded rank are infected.'] : ['The strain finds no lungs.'];
  });
  def(877, 'Contagion Cloud', 2, 'Zombie', 'fire', 'Blanket the enemy\'s half in MIRE zones — pieces that end their turn there are stuck.', 'The air itself turns thick and wrong.', (g, s) => {
    const n = layMiasma(g, enemyHalf(g, s), 'mire', 3);
    return n ? ['Mire seeps across ' + n + ' squares of the enemy\'s half.'] : ['Their half is too crowded to flood.'];
  });
  def(878, 'Quarantine', 2, 'Zombie', 'lock', 'The enemy may not CAPTURE this turn — they can only shuffle (quarantine orders).', 'No one in. No one out.', (g, s) => {
    Fx.noCaptures(g, O(s));
    const lines = ['The enemy is quarantined — no captures this turn.'];
    const t = rand(foes(g, s)); if (t) { Fx.mod(t.cell, 'f', 1); lines.push('One infected enemy is frozen in place.'); }
    return lines;
  });
  def(879, 'Biohazard Sign', 1, 'Zombie', 'shield', 'Shield a random husk pawn AND poison the enemy piece nearest to it.', 'Warning: toxic to the touch.', (g, s) => {
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!p) return ['No husk to tag.'];
    Fx.mod(p.cell, 's', 1);
    const near = foes(g, s).sort((a, b) => (Math.abs(a.r - p.r) + Math.abs(a.c - p.c)) - (Math.abs(b.r - p.r) + Math.abs(b.c - p.c)))[0];
    const lines = ['A husk is tagged and shielded.'];
    if (near) { Fx.mod(near.cell, 'p', 1); lines.push('The nearest enemy is exposed and poisoned.'); }
    return lines;
  });
  def(880, 'Viral Load', 2, 'Zombie', 'bolt', 'Double the poison on every already-poisoned enemy (they detonate sooner).', 'The load is too heavy.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    if (!targets.length) return ['No infected to overload.'];
    const lines = [];
    for (const q of targets) { q.cell.b.p = (q.cell.b.p || 1) + 1; lines.push('An infected enemy\'s venom deepens.'); }
    return lines;
  });
  def(881, 'Vaccine', 1, 'Zombie', 'heart', 'Cleanse one of YOUR poisoned or frozen pieces and shield it.', 'The cure arrives — barely.', (g, s) => {
    const sickOwn = Fx.own(g, s).filter(q => q.cell.b && (q.cell.b.p > 0 || q.cell.b.f > 0));
    const t = sickOwn[0] || rand(mine(g, s));
    if (!t) return ['No one needs the cure.'];
    if (t.cell.b) { t.cell.b.p = 0; t.cell.b.f = 0; }
    Fx.mod(t.cell, 's', 1);
    return ['A ' + pname(t.cell.t) + ' is cured and shielded.'];
  });
  def(882, 'Herd Immunity', 3, 'Zombie', 'shield', 'Shield every friendly husk pawn AND every friendly piece adjacent to a husk pawn.', 'Together, they cannot be stopped.', (g, s) => {
    const husks = Fx.own(g, s).filter(q => q.cell.t === 'p');
    if (!husks.length) return ['No husks to rally.'];
    const targets = Fx.own(g, s).filter(q => husks.some(h => Math.abs(h.r - q.r) <= 1 && Math.abs(h.c - q.c) <= 1) || q.cell.t === 'p');
    const n = Fx.statusOn(g, targets, 's', 1, 'shield');
    return n ? ['Herd immunity shields ' + n + ' unit' + (n > 1 ? 's' : '') + '.' ] : ['The herd stands exposed.'];
  });
  def(883, 'Outbreak', 4, 'Zombie', 'drop', 'Destroy EVERY enemy piece that is poisoned. This is the end of the line.', 'It was never about one body.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    if (!targets.length) return ['No infected to purge.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('An infected enemy succumbs.'); }
    return lines;
  });
  def(884, 'Typhoid Mary', 2, 'Zombie', 'storm', 'Give your most advanced piece the plague (poison) — and poison every enemy beside it.', 'She only wanted to cook.', (g, s) => {
    const me = Fx.own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!me) return ['No carrier to dispatch.'];
    Fx.mod(me.cell, 'p', 1);
    const lines = ['Your ' + pname(me.cell.t) + ' carries the plague.'];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = me.r + dr, c = me.c + dc;
      if (r < 0 || r >= bd(g) || c < 0 || c >= bd(g)) continue;
      const cell = g.board[r][c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.mod(cell, 'p', 1); lines.push('A nearby enemy is infected.'); }
    }
    return lines;
  });
  def(885, 'Virus Bomb', 3, 'Zombie', 'fire', 'Lay a poison HAZARD on every empty square around a random enemy piece.', 'The lab leaked. The lab always leaks.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['No test subject found.'];
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < bd(g) && c >= 0 && c < bd(g) && !g.board[r][c]) { if (E.setHaz(g, r, c, 'poison', 'spilled vial')) n++; }
    }
    return n ? [n + ' poison vials lie around the enemy ' + pname(t.cell.t) + '.' ] : ['The vials shatter on open ground.'];
  });
  def(886, 'Pestilence', 3, 'Zombie', 'leaf', 'Poison every enemy on your two most advanced FILES, and lay a fire hazard on one empty square.', 'The crops rot where they stand.', (g, s) => {
    const me = Fx.own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    if (!me.length) return ['No fields to blight.'];
    const files = me.map(q => q.c).filter((v, i, a) => a.indexOf(v) === i);
    const hits = foes(g, s).filter(q => files.includes(q.c));
    const lines = [];
    const n = Fx.statusOn(g, hits, 'p', 1, 'poison');
    if (n) lines.push(n + ' enemy' + (n > 1 ? 's' : '') + ' on your front files are blighted.');
    const e = Fx.emptySq(g); if (e.length && E.setHaz) { const q = rand(e); E.setHaz(g, q.r, q.c, 'ember', 'burning field'); lines.push('The field catches fire behind them.'); }
    return lines.length ? lines : ['Pestilence finds nothing.'];
  });
  def(887, 'Swine Flu', 1, 'Zombie', 'paw', 'Every enemy piece worth less than a rook is poisoned.', 'It jumps species. It always jumps species.', (g, s) => {
    const targets = foes(g, s).filter(q => dead(q.cell.t) < 500);
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    return n ? [n + ' lesser enemy' + (n > 1 ? 's' : '') + ' fall ill.'] : ['No weak hosts remain.'];
  });
  def(888, 'Bloodborne', 2, 'Zombie', 'drop', 'Poison the enemy piece that just MOVED last.', 'It travels in the blood.', (g, s) => {
    const lm = g.lastMove;
    const cell = lm && g.board[lm.to.r] && g.board[lm.to.r][lm.to.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['The blood finds no fresh wound.'];
    Fx.mod(cell, 'p', 1); Fx.flash(g, lm.to.r, lm.to.c, 'poison', '');
    return ['The last mover is infected.'];
  });
  def(889, 'Sanitize', 2, 'Zombie', 'heart', 'Cleanse your WHOLE army (remove poison & freeze) and destroy every enemy POISONED piece.', 'Wash your hands of the problem.', (g, s) => {
    for (const q of Fx.own(g, s)) if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; }
    const lines = ['Your army is cleansed.'];
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('An infected enemy is purged.'); }
    return lines;
  });
  def(890, 'Quarantine Breach', 2, 'Zombie', 'swap', 'Teleport a random enemy piece into the middle of your husk horde — then every adjacent husk bites it (destroyed).', 'They thought the walls would hold.', (g, s) => {
    const husks = Fx.own(g, s).filter(q => q.cell.t === 'p');
    if (!husks.length) return ['No horde to breach with.'];
    const t = rand(foes(g, s));
    if (!t) return ['No one to drag inside.'];
    const hub = husks[Math.floor(Math.random() * husks.length)];
    const spots = Fx.emptySq(g, (r, c) => Math.abs(r - hub.r) <= 1 && Math.abs(c - hub.c) <= 1);
    const d = rand(spots);
    if (!d) return ['The horde has no room.'];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    Fx.removeAt(g, d.r, d.c, {});
    return ['The enemy is dragged into the horde and torn apart.'];
  });
  def(891, 'Rot', 2, 'Zombie', 'leaf', 'FREEZE every enemy pawn and lay thorns in the enemy\'s half.', 'Everything softens and slows.', (g, s) => {
    const pawns = foes(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, pawns, 'f', 1, 'freeze');
    const lines = [];
    if (n) lines.push(n + ' enemy pawn' + (n > 1 ? 's are' : ' is') + ' slowed by rot.');
    const z = layMiasma(g, enemyHalf(g, s), 'thorns', 2);
    if (z) lines.push('Thorns claw up through ' + z + ' squares of their half.');
    return lines.length ? lines : ['The rot spreads over empty ground.'];
  });
  def(892, 'Carrion', 1, 'Zombie', 'paw', 'Poison a random enemy piece on an EDGE file.', 'The scavengers know where the weak fall.', (g, s) => {
    const targets = foes(g, s).filter(q => q.c === 0 || q.c === bd(g) - 1);
    const t = rand(targets) || rand(foes(g, s));
    if (!t) return ['No carrion to feed on.'];
    Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    return ['An enemy on the rim is poisoned.'];
  });
  def(893, 'Incubation', 3, 'Zombie', 'clock', 'All enemies poisoned this match are placed under a 2-turn DOOM (they will die quietly after their next turn).', 'The host barely notices at first.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    const n = Fx.statusOn(g, targets, 'doom', 1, 'poison');
    return n ? ['The infection incubates — ' + n + ' poisoned enemy' + (n > 1 ? 's' : '') + ' are doomed.'] : ['Nothing is incubating.'];
  });
  def(894, 'Pandemic', 4, 'Zombie', 'void', 'Poison EVERY enemy piece on the board.', 'There is no quarantine for the whole world.', (g, s) => {
    const targets = foes(g, s);
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    return n ? ['Pandemic! ' + n + ' enemy' + (n > 1 ? 's are' : ' is') + ' infected.'] : ['The world is already empty.'];
  });

  // ============ C. BIOHAZARD GROUND — zones, waste & war engines ============
  def(895, 'Waste Dump', 2, 'Zombie', 'drop', 'Flood THREE random empty squares of the enemy\'s half with MIRE (sticky quarantine sludge).', 'The dump does not drain.', (g, s) => {
    const n = layMiasma(g, enemyHalf(g, s), 'mire', 3);
    return n ? ['Sludge seeps over ' + n + ' squares.'] : ['No room to dump.'];
  });
  def(896, 'Chemical Fire', 3, 'Zombie', 'fire', 'Set FOUR random empty squares of the enemy\'s half alight with FIRE (burns shields, poisons).', 'The fire is the easy part. The air is the hard part.', (g, s) => {
    const n = layMiasma(g, enemyHalf(g, s), 'fire', 4);
    return n ? ['Toxic fire catches across ' + n + ' squares.'] : ['Their half has no open ground.'];
  });
  def(897, 'Fungus Bloom', 2, 'Zombie', 'leaf', 'Grow THORNS on three random empty squares of the enemy\'s half — pieces ending turns there are doomed.', 'It grows on anything. Including them.', (g, s) => {
    const n = layMiasma(g, enemyHalf(g, s), 'thorns', 3);
    return n ? ['Fungal thorns erupt across ' + n + ' squares.'] : ['No soil to bloom in.'];
  });
  def(898, 'Dead Air', 2, 'Zombie', 'wind', 'Roll FOG across the enemy\'s half — your husks advance unseen.', 'You cannot breathe it, but it breathes for you.', (g, s) => {
    const n = layMiasma(g, enemyHalf(g, s), 'fog', 4);
    if (!n) return ['Their half is too crowded for fog.'];
    const lines = ['Fog swallows ' + n + ' squares of their half.'];
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p');
    if (ps.length) { Fx.veilOn(g, ps.slice(0, 3), null, 1); lines.push('Your front husks slip into the mist.'); }
    return lines;
  });
  def(899, 'Toxic Sludge', 1, 'Zombie', 'drop', 'Lay a poison hazard on a random empty square in each of three different columns of the enemy\'s half.', 'Every puddle is a promise.', (g, s) => {
    const n = N(g); let count = 0; const used = [];
    for (let i = 0; i < 3; i++) {
      const cols = Array.from({ length: n }, (_, j) => j).filter(j => !used.includes(j)).sort(() => Math.random() - 0.5);
      const c = cols[0]; if (c === undefined) break;
      used.push(c);
      for (const r of enemyHalf(g, s)) { if (!g.board[r][c] && E.setHaz(g, r, c, 'poison', 'sludge')) { count++; break; } }
    }
    return count ? [count + ' sludge puddle' + (count > 1 ? 's' : '') + ' laid.'] : ['The sludge dries up.'];
  });
  def(900, 'Cordon', 2, 'Zombie', 'lock', 'Raise WALLS across two random files in the middle of the board — splitting their army.', 'Stay behind the line.', (g, s) => {
    const n = N(g);
    let built = 0;
    const cols = Array.from({ length: n }, (_, i) => i).filter(c => c > 1 && c < n - 2).sort(() => Math.random() - 0.5);
    for (const c of cols) {
      if (built >= 2) break;
      let ok = true;
      for (let r = 2; r < n - 1; r++) if (g.board[r][c]) { ok = false; break; }
      if (!ok) continue;
      for (let r = 2; r < n - 1; r++) E.setTerrain(g, r, c, 'wall');
      built++;
    }
    return built ? ['Cordon walls seal ' + built + ' file' + (built > 1 ? 's' : '') + '.'] : ['The cordon cannot be raised.'];
  });
  def(901, 'Biohazard Barrel', 2, 'Zombie', 'fire', 'Fire a barrel of waste at a random enemy square — it bursts (radius 1) after two of your turns, poisoning survivors.', 'Drum roll, please.', (g, s) => {
    const q = rand(foes(g, s));
    if (!q) return ['No target for the barrel.'];
    if (E.addShell) E.addShell(g, q.r, q.c, s, 2, 1);
    return ['A waste barrel lobs toward ' + sq(q.r, q.c) + ' — it bursts in two turns.'];
  });
  def(902, 'Mortar of Rot', 3, 'Zombie', 'fire', 'Fire a rotting shell at the enemy\'s strongest piece — wide blast (radius 2) after two of your turns.', 'It lands soft. It spreads fast.', (g, s) => {
    const q = foes(g, s).sort((a, b) => dead(b.cell.t) - dead(a.cell.t))[0];
    if (!q) return ['Nothing to shell.'];
    if (E.addShell) E.addShell(g, q.r, q.c, s, 2, 2);
    return ['A rotten shell is inbound on the ' + pname(q.cell.t) + '.'];
  });
  def(903, 'Chem Launcher', 2, 'Zombie', 'storm', 'Scatter THREE chemical shells at random empty squares of the enemy\'s half.', 'Gas, then silence.', (g, s) => {
    const empt = emptiesIn(g, enemyHalf(g, s));
    let n = 0;
    for (let i = 0; i < 3; i++) { const q = rand(empt); if (q && E.addShell) { E.addShell(g, q.r, q.c, s, 1, 1); empt.splice(empt.indexOf(q), 1); n++; } }
    return n ? [n + ' chemical shells are on the way.'] : ['No room to launch.'];
  });
  def(904, 'Necrotic Bomb', 4, 'Zombie', 'void', 'Detonate a random poisoned enemy: destroy it AND every enemy adjacent to it (never the king).', 'The bodies were the bombs all along.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    const t = rand(targets) || rand(foes(g, s));
    if (!t) return ['No corpse to detonate.'];
    Fx.removeAt(g, t.r, t.c, {});
    let gone = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = t.r + dr, c = t.c + dc;
      if (r < 0 || r >= bd(g) || c < 0 || c >= bd(g)) continue;
      const cell = g.board[r][c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
    }
    return ['The necrotic bomb tears through ' + (gone + 1) + ' enemy unit' + (gone + 1 > 1 ? 's' : '') + '.'];
  });
  def(905, 'Rat Swarm', 2, 'Zombie', 'paw', 'Destroy a random enemy pawn, then every enemy piece worth less than a bishop is poisoned.', 'The rats inherit the earth first.', (g, s) => {
    const lines = [];
    const p = rand(foes(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.removeAt(g, p.r, p.c, {}); lines.push('A swarm strips an enemy pawn.'); }
    const targets = foes(g, s).filter(q => dead(q.cell.t) < 400);
    const n = Fx.statusOn(g, targets, 'p', 1, 'poison');
    if (n) lines.push('And ' + n + ' lesser unit' + (n > 1 ? 's' : '') + ' are bitten.');
    return lines.length ? lines : ['The rats find nothing to eat.'];
  });
  def(906, 'Choking Gas', 2, 'Zombie', 'wind', 'Freeze every enemy on the enemy\'s two most advanced files — the gas is heaviest up front.', 'It hugs the ground, looking for breath.', (g, s) => {
    const rows = s === 'w' ? [1, 2] : [N(g) - 3, N(g) - 2];
    const targets = foes(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? [n + ' enemy' + (n > 1 ? 's' : '') + ' in the gas are frozen.'] : ['The gas finds clear air.'];
  });
  def(907, 'Quarantine Camp', 3, 'Zombie', 'shield', 'Shield every friendly piece, but your most advanced piece is quarantined (frozen) this turn — a necessary evil.', 'They\'ll thank you later. Probably not.', (g, s) => {
    const all = Fx.own(g, s);
    const n = Fx.statusOn(g, all, 's', 1, 'shield');
    const me = all.sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    const lines = [];
    if (n) lines.push('Your whole army is shielded.');
    if (me) { Fx.mod(me.cell, 'f', 1); lines.push('Your vanguard is quarantined for a turn.'); }
    return lines;
  });
  def(908, 'Bio-Lab', 3, 'Zombie', 'spark', 'Summon a Plague Bearer (counter: doom) and a Gremlin in your own half.', 'Where the experiments escaped.', (g, s) => {
    const lines = raise(g, s, 'plaguebearer', ownHalf(g, s));
    lines.push(...Fx.summonN(g, s, 'gremlin', 1, { rows: ownHalf(g, s) }));
    return lines.length ? lines : ['The lab is empty.'];
  });
  def(909, 'Containment Failure', 3, 'Zombie', 'skull', 'Summon TWO Plague Bearers on random squares of the board — even you aren\'t safe.', 'The cage door is open.', (g, s) => {
    const lines = Fx.summonN(g, s, 'plaguebearer', 2);
    return lines.length ? lines : ['The cages stay shut.'];
  });
  def(910, 'Reaper\'s Scythe', 4, 'Zombie', 'sword', 'Destroy EVERY enemy piece worth at least a rook, then raise a husk for each one destroyed.', 'The harvest is total.', (g, s) => {
    const targets = foes(g, s).filter(q => dead(q.cell.t) >= 500);
    if (!targets.length) return ['The scythe finds no worthy stalks.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('The scythe takes the ' + pname(q.cell.t) + '.'); }
    const raised = Fx.summonN(g, s, 'p', Math.min(4, targets.length), { rows: Fx.backRows(g, s) });
    if (raised.length) lines.push('The fields are re-seeded with the dead.');
    return lines;
  });
  def(911, 'Dawn of the Dead', 4, 'Zombie', 'clock', 'Resurrect up to THREE fallen pieces of yours — corrupted, they rise again.', 'The sun rises on a fuller graveyard.', (g, s) => {
    const lines = Fx.revive(g, s, 3);
    return lines.length ? lines : ['Your dead are at peace today.'];
  });
  def(912, 'Last Bite', 1, 'Zombie', 'paw', 'Your most advanced husk bites a random enemy: the enemy is poisoned AND frozen.', 'One bite is all it takes.', (g, s) => {
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!p) return ['No husk to bite.'];
    const t = rand(foes(g, s));
    if (!t) return ['Nothing to bite.'];
    Fx.mod(t.cell, 'p', 1); Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    return ['A husk bites the ' + pname(t.cell.t) + ' — poisoned and frozen.'];
  });
  def(913, 'Flesh Wound', 1, 'Zombie', 'sword', 'Destroy the weakest enemy piece, and your most advanced husk gains a shield.', 'Every wound feeds the horde.', (g, s) => {
    const t = foes(g, s).sort((a, b) => dead(a.cell.t) - dead(b.cell.t))[0];
    const lines = [];
    if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('The weakest enemy falls.'); }
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (p) { Fx.mod(p.cell, 's', 1); lines.push('Your vanguard husk is shielded.'); }
    return lines.length ? lines : ['The wound heals clean.'];
  });
  def(914, 'Grave Dirt', 1, 'Zombie', 'drop', 'Shield your king and lay a poison hazard in front of your most advanced piece.', 'Home soil, weaponized.', (g, s) => {
    const k = E.findKing(g, s);
    const lines = [];
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is warded with grave dirt.'); }
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (p) { const r = p.r + (s === 'w' ? -1 : 1); if (r >= 0 && r < bd(g) && !g.board[r][p.c] && E.setHaz) { E.setHaz(g, r, p.c, 'poison', 'grave dirt'); lines.push('A poisoned mound lies before your vanguard.'); } }
    return lines;
  });

  // ============ D. DOOMSDAY — finishers & last stands ============
  def(915, 'The Final Plague', 5, 'Zombie', 'void', 'Destroy every enemy piece on the board that is worth more than a pawn, then your army is cleansed.', 'There is no cure for the end.', (g, s) => {
    const targets = foes(g, s).filter(q => q.cell.t !== 'p');
    if (!targets.length) return ['Only pawns remain — the plague passes them by.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('The plague takes the ' + pname(q.cell.t) + '.'); }
    for (const q of Fx.own(g, s)) if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; }
    lines.push('Your own host is cleansed of the strain.');
    return lines;
  });
  def(916, 'Outlive Them All', 3, 'Zombie', 'heart', 'Your king cannot be captured next turn (shield), and revive a fallen piece.', 'The throne endures. The throne is patient.', (g, s) => {
    const k = E.findKing(g, s);
    const lines = [];
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The King is shielded.'); }
    lines.push(...Fx.revive(g, s, 1));
    return lines.length ? lines : ['The kingdom holds its breath.'];
  });
  def(917, 'They Keep Coming', 2, 'Zombie', 'clock', 'Behind your two most advanced husks, fresh corpses claw their way up — summon a husk pawn behind each.', 'You do not win by killing them. There is always another.', (g, s) => {
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    if (!ps.length) return ['No husks to multiply.'];
    const lines = [];
    const backDir = s === 'w' ? 1 : -1;
    for (const p of ps) {
      const r = p.r + backDir;
      if (r >= 0 && r < bd(g) && !g.board[r][p.c] && !(E.isTerrain && E.isTerrain(g, r, p.c))) {
        Fx.place(g, s, 'p', r, p.c, {});
        lines.push('A fresh corpse claws up behind the line.');
      }
    }
    return lines.length ? lines : ['No room behind the horde.'];
  });
  def(918, 'Necrotic Shield', 2, 'Zombie', 'shield', 'Shield three friendly pieces AND poison the three enemy pieces nearest your king.', 'Armor for us. Rot for them.', (g, s) => {
    const mine2 = Fx.own(g, s).filter(q => q.cell.t !== 'k').sort(() => Math.random() - 0.5);
    const n = Fx.statusOn(g, mine2.slice(0, 3), 's', 1, 'shield');
    const k = E.findKing(g, s);
    const lines = [];
    if (n) lines.push(n + ' of your units are shielded.');
    if (k) {
      const near = foes(g, s).sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c))).slice(0, 3);
      const p = Fx.statusOn(g, near, 'p', 1, 'poison');
      if (p) lines.push('The nearest ' + p + ' enemy' + (p > 1 ? 's are' : ' is') + ' poisoned.');
    }
    return lines.length ? lines : ['The necrotic shield flickers empty.'];
  });
  def(919, 'Mass Grave', 3, 'Zombie', 'rune', 'Revive a fallen piece of EVERY type you have lost (up to three), all as husk pawns if their champions are gone.', 'One pit, many tenants.', (g, s) => {
    const g2 = g;
    const mine2 = (g2.lost && g2.lost[s] ? g2.lost[s].filter(p => p.t !== 'k') : []);
    const types = [];
    for (const p of mine2) if (!types.includes(p.t)) types.push(p.t);
    const lines = [];
    for (const tp of types.slice(0, 3)) {
      const one = mine2.find(p => p.t === tp);
      if (one) {
        const lines2 = Fx.summonN(g, s, one.t, 1, { rows: Fx.backRows(g, s) });
        if (lines2.length) { const ii = g2.lost[s].indexOf(one); if (ii >= 0) g2.lost[s].splice(ii, 1); lines.push('A ' + pname(one.t) + ' climbs out of the mass grave.'); }
      }
    }
    return lines.length ? lines : ['The mass grave is empty.'];
  });
  def(920, 'Last Rites', 2, 'Zombie', 'sword', 'Destroy a random enemy piece; if it was a knight or bishop, also destroy the piece beside it.', 'Two for the price of one soul.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['No soul to claim.'];
    Fx.removeAt(g, t.r, t.c, {});
    const lines = ['The ' + pname(t.cell.t) + ' is claimed.'];
    if (t.cell.t === 'n' || t.cell.t === 'b') {
      const near = foes(g, s).filter(q => Math.abs(q.r - t.r) + Math.abs(q.c - t.c) === 1);
      const u = rand(near);
      if (u) { Fx.removeAt(g, u.r, u.c, {}); lines.push('And the ' + pname(u.cell.t) + ' beside it.'); }
    }
    return lines;
  });
  def(921, 'Plague Bearer Pact', 3, 'Zombie', 'rune', 'Sacrifice your most advanced husk: summon a Plague Bearer in its place AND doom a random enemy.', 'A fair trade, by some measure.', (g, s) => {
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    const lines = [];
    if (p) { Fx.removeAt(g, p.r, p.c, {}); Fx.place(g, s, 'plaguebearer', p.r, p.c, {}); lines.push('A husk is traded upward into a Plague Bearer.'); }
    const t = rand(foes(g, s));
    if (t) { Fx.mod(t.cell, 'doom', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('The ' + pname(t.cell.t) + ' is marked for doom.'); }
    return lines.length ? lines : ['The pact finds no flesh.'];
  });
  def(922, 'Tomb of the Rat King', 4, 'Zombie', 'void', 'Destroy the enemy\'s weakest piece, freeze their strongest, and poison a third.', 'One king, many little kings.', (g, s) => {
    const all = foes(g, s);
    if (!all.length) return ['The tomb is sealed.'];
    const lines = [];
    const weak1 = all.sort((a, b) => dead(a.cell.t) - dead(b.cell.t))[0];
    Fx.removeAt(g, weak1.r, weak1.c, {}); lines.push('The weakest is consumed.');
    const strong = foes(g, s).sort((a, b) => dead(b.cell.t) - dead(a.cell.t))[0];
    if (strong) { Fx.mod(strong.cell, 'f', 1); lines.push('The strongest is frozen.'); }
    const third = rand(foes(g, s));
    if (third) { Fx.mod(third.cell, 'p', 1); lines.push('A third is poisoned.'); }
    return lines;
  });
  def(923, 'Cure for Nothing', 2, 'Zombie', 'heart', 'Cleanse one enemy of shields and poison them; then cleanse yourself of poison.', 'Some cures are worse.', (g, s) => {
    const t = foes(g, s).sort(() => Math.random() - 0.5)[0];
    if (!t) return ['No patient to treat.'];
    if (t.cell.b) t.cell.b.s = 0;
    Fx.mod(t.cell, 'p', 1);
    const lines = ['An enemy is stripped of shields and infected.'];
    const own2 = Fx.own(g, s).filter(q => q.cell.b && q.cell.b.p > 0);
    if (own2.length) { for (const q of own2) q.cell.b.p = 0; lines.push('Your own poisoned units are cured.'); }
    return lines;
  });
  def(924, 'Viral Cascade', 3, 'Zombie', 'storm', 'Destroy an enemy piece; if it was poisoned, cascade: destroy the poisoned enemy nearest to its corpse.', 'One host, then the next, then the next.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['The cascade never starts.'];
    Fx.removeAt(g, t.r, t.c, {});
    const lines = ['The ' + pname(t.cell.t) + ' is destroyed.'];
    if (t.cell.b && t.cell.b.p > 0) {
      const near = foes(g, s).filter(q => q.cell.b && q.cell.b.p > 0).sort((a, b) => (Math.abs(a.r - t.r) + Math.abs(a.c - t.c)) - (Math.abs(b.r - t.r) + Math.abs(b.c - t.c)))[0];
      if (near) { Fx.removeAt(g, near.r, near.c, {}); lines.push('The cascade claims the nearest infected unit.'); }
    }
    return lines;
  });
  def(925, 'Apocalypse Now', 5, 'Zombie', 'fire', 'Destroy a random enemy on EVERY file, then detonate any of your husks that remain.', 'The end is thorough.', (g, s) => {
    const n = N(g);
    const lines = [];
    for (let c = 0; c < n; c++) {
      const onFile = foes(g, s).filter(q => q.c === c);
      const t = rand(onFile);
      if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('The file ' + 'abcdefghijkl'[c] + ' is cleansed.'); }
    }
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p');
    if (ps.length) { for (const p of ps.slice(0, 4)) { Fx.removeAt(g, p.r, p.c, {}); lines.push('A husk detonates in the end times.'); } }
    return lines.length ? lines : ['The apocalypse finds an empty board.'];
  });
  def(926, 'Rotting Crown', 3, 'Zombie', 'crown', 'Summon a Plague Bearer beside your king, and shield every piece adjacent to the king.', 'The crown rusts, but it endures.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return ['No throne to crown.'];
    const lines = [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < bd(g) && c >= 0 && c < bd(g) && !g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) near.push({ r, c });
    }
    if (near.length) { const q = rand(near); Fx.place(g, s, 'plaguebearer', q.r, q.c, {}); lines.push('A Plague Bearer guards the rotting crown.'); }
    const guard = Fx.own(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    if (n) lines.push('The royal guard is shielded.');
    return lines.length ? lines : ['The crown sits unguarded.'];
  });
  def(927, 'Infected Pawn Storm', 2, 'Zombie', 'drop', 'Every husk pawn may surge two squares forward this turn (move them now).', 'They do not tire. They do not stop.', (g, s) => {
    const ps = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).slice(0, 5);
    const dir = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const one = p.r + dir;
      if (one < 0 || one >= bd(g) || g.board[one][p.c]) continue; // nothing ahead
      const two = p.r + 2 * dir;
      if (two >= 0 && two < bd(g) && !g.board[two][p.c]) { Fx.relocate(g, p.r, p.c, two, p.c, {}); moved++; }
      else { Fx.relocate(g, p.r, p.c, one, p.c, {}); moved++; }
    }
    return moved ? [moved + ' husk' + (moved > 1 ? 's' : '') + ' surge forward.'] : ['The husks are boxed in.'];
  });
  def(928, 'Bio-Weapon', 4, 'Zombie', 'fire', 'Destroy every enemy piece on the rank or file through your most advanced husk.', 'The payload has your name on it.', (g, s) => {
    const p = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!p) return ['No husk to launch from.'];
    const targets = foes(g, s).filter(q => q.r === p.r || q.c === p.c);
    if (!targets.length) return ['The line is clear.'];
    const lines = [];
    for (const q of targets) { Fx.removeAt(g, q.r, q.c, {}); lines.push('The bio-weapon takes the ' + pname(q.cell.t) + '.'); }
    return lines;
  });
  def(929, 'Patient End', 2, 'Zombie', 'clock', 'Mark a random enemy piece as "patient": it cannot capture this turn and is doomed.', 'The sickness has a plan, and it is patient.', (g, s) => {
    const t = rand(foes(g, s));
    if (!t) return ['The sickness waits.'];
    Fx.mod(t.cell, 'doom', 1);
    const lines = ['The ' + pname(t.cell.t) + ' is marked as patient zero for doom.'];
    return lines;
  });

  MD.AB_19 = A;
})();

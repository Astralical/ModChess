/* ============================================================
   Mod Chess — Ability set 15: WORLD WAR II  IDs 657-706
   Signature ideas:
     • War engines: Siege Tank, War Zeppelin, Howitzer (new troops).
     • MINEFIELDS & BARBED WIRE laid as HAZARDS (trap / freeze / ember).
     • COMBINED ARMS — artillery zones, air strikes, armor spearheads.
     • WAR ECONOMY — supply lines, total war, morale & the home front.
   No card is a plain copy of another pool's spell.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const E = MD.Engine, Fx = MD.Fx, O = Fx.opp;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);
  const rnd = a => Fx.rand(a);
  const val = t => E.val(t);
  const foes = (g, s) => en(g, s).filter(q => q.cell.t !== 'k');
  const mine = (g, s) => own(g, s).filter(q => q.cell.t !== 'k');
  const adv = (g, s) => mine(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
  const advP = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
  const strong = (g, s) => foes(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
  const weak = (g, s) => foes(g, s).sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
  const kill = (g, q) => { Fx.removeAt(g, q.r, q.c, {}); };
  const summon = (g, s, t, n, rows) => Fx.summonN(g, s, t, n, rows ? { rows } : {});
  const A = [];
  const def = (id, name, rarity, icon, desc, flavor, run) => A.push({ id, name, rarity, cat: 'War', icon, desc, flavor, target: 'auto', run });

  def(657, 'Siege Tank', 3, 'boltring', 'Heavy armor rolls up: summon a Siege Tank — when it is destroyed it explodes, blasting adjacent enemies.', 'Steel and treads and fire.', (g, s) => summon(g, s, 'siegetank', 1, s === 'w' ? [4, 5] : [2, 3]));

  def(658, 'War Zeppelin', 4, 'wind', 'The sky goes to war: summon a War Zeppelin — it takes a moment to arm but then roams like a knight.', 'The shadow passes overhead.', (g, s) => summon(g, s, 'zeppelin', 1));

  def(659, 'Howitzer Battery', 2, 'fire', 'Batteries in the hills: summon a Howitzer, then shell a random enemy minor piece (destroy it).', 'Fire for effect.', (g, s) => {
    const lines = summon(g, s, 'howitzer', 1, s === 'w' ? [4, 5, 6] : [1, 2, 3]);
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (t) { kill(g, t); lines.push('The battery destroys an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines.length ? lines : ['The battery is still limbering.'];
  });

  def(660, 'Lay Minefield', 3, 'skull', 'Sow the field with TRAP hazards: two hidden mines on random empty squares in the enemy\'s half that destroy the next piece to step on them.', 'Every step could be the last.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const n = Fx.layHazards(g, 'trap', 2, { rows, name: 'minefield' });
    return n ? ['A minefield hides beneath ' + n + ' empty square' + (n > 1 ? 's' : '') + '.'] : ['The sappers refuse the field.'];
  });

  def(661, 'Barbed Wire', 2, 'ice', 'Teeth of wire before your line: lay FREEZE hazards (barbed wire) on up to three empty squares in front of your most advanced pawn.', 'It slows them; that is enough.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const rows = [p.r + (s === 'w' ? -1 : 1)];
    const n = Fx.layHazards(g, 'freeze', 3, { rows, name: 'barbed wire' });
    return n ? ['Barbed wire tangles across ' + n + ' square' + (n > 1 ? 's' : '') + '.'] : ['No ground to wire.'];
  });

  def(662, 'Blitzkrieg', 4, 'storm', 'Lightning war: every friendly pawn surges one square, then you take an EXTRA move.', 'Strike before they wake.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const nr = p.r + dr;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    Fx.grantExtra(g, s, 1);
    return ['Blitzkrieg! ' + moved + ' pawn' + (moved > 1 ? 's surge' : ' surges') + ', and you move again.'];
  });

  def(663, 'Strategic Bombing', 4, 'fire', 'The bombers come at dawn: destroy the enemy\'s strongest piece, then lay an ember HAZARD where it stood.', 'Bombs away. The city burns after.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['The bombers return to base.'];
    kill(g, t);
    E.setHaz(g, t.r, t.c, 'ember', 'burning rubble');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is erased, and the rubble still burns.'];
  });

  def(664, 'Paratroopers', 3, 'drop', 'Drop behind the lines: summon two Riflemen near the enemy back rank.', 'They dropped out of the sun.', (g, s) => summon(g, s, 'infantry', 2, s === 'w' ? [0, 1, 2] : [5, 6, 7]));

  def(665, 'Pillbox', 2, 'shield', 'A concrete nest with a machine gun: shield your king AND freeze the enemy piece nearest to him.', 'Nothing gets through; nothing moves.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1);
    let best = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); return ['The pillbox guards your king and pins the nearest foe.']; }
    return ['The pillbox guards your king.'];
  });

  def(666, 'Artillery Barrage', 3, 'fire', 'Fire for effect: destroy a random enemy minor piece and poison the enemy piece nearest to it.', 'The guns speak; the field answers.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (!t) return ['The guns are silent.'];
    const lines = [];
    kill(g, t);
    lines.push('Artillery destroys an enemy ' + MD.pieceName(t.cell.t) + '.');
    let near = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - t.r) + Math.abs(q.c - t.c); if (q !== t && d < bd) { bd = d; near = q; } }
    if (near) { Fx.mod(near.cell, 'p', 1); lines.push('Shrapnel poisons a nearby enemy.'); }
    return lines;
  });

  def(667, 'Enigma Cracked', 2, 'book', 'Read their orders before they act: take an EXTRA move, then FREEZE the enemy piece that would move first (their most advanced).', 'The code is broken.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const t = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    const lines = ['Enigma broken — an extra move is yours.'];
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('Their vanguard is frozen by your foreknowledge.'); }
    return lines;
  });

  def(668, 'Sniper', 2, 'target', 'One round, one life: destroy the enemy\'s weakest piece.', 'One breath. One trigger.', (g, s) => {
    const t = weak(g, s);
    if (!t) return ['The sniper holds fire.'];
    kill(g, t);
    return ['A single shot drops the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(669, 'Katyusha', 3, 'storm', 'Rockets scream: destroy one random enemy piece on EACH of two random files.', 'The stalin organ plays.', (g, s) => {
    const c1 = Math.floor(Math.random() * Fx.bd(g));
    let c2 = Math.floor(Math.random() * Fx.bd(g));
    while (c2 === c1) c2 = Math.floor(Math.random() * Fx.bd(g));
    const lines = [];
    const t1 = rnd(foes(g, s).filter(q => q.c === c1));
    if (t1) { kill(g, t1); lines.push('Rockets obliterate an enemy on file ' + 'abcdefghijkl'[c1] + '.'); }
    const t2 = rnd(foes(g, s).filter(q => q.c === c2));
    if (t2) { kill(g, t2); lines.push('More rockets strike file ' + 'abcdefghijkl'[c2] + '.'); }
    return lines.length ? lines : ['The rockets land on empty steppe.'];
  });

  def(670, 'U-Boat Wolfpack', 3, 'drop', 'Torpedoes from below: destroy a random enemy ROOK or QUEEN.', 'The periscope is a ghost.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q'));
    if (!t) return ['No capital ship to sink.'];
    kill(g, t);
    return ['A torpedo rips the enemy ' + MD.pieceName(t.cell.t) + ' apart!'];
  });

  def(671, 'Tank Destroyer', 3, 'target', 'Hull-down and waiting for the heavy stuff: destroy a random enemy piece worth a rook or more.', 'It waits for the heavy stuff.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) return ['No heavy target drives into the kill zone.'];
    kill(g, t);
    return ['An ambush destroys the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(672, 'D-Day', 4, 'drop', 'The longest day: summon TWO Howitzers and TWO Riflemen onto the enemy\'s half.', 'Into the jaws of death.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2] : [5, 6, 7];
    const lines = [];
    lines.push(...summon(g, s, 'howitzer', 2, rows));
    lines.push(...summon(g, s, 'infantry', 2, rows));
    return lines.length ? lines : ['The landing craft find no beach.'];
  });

  def(673, 'Partisans', 2, 'users', 'The resistance rises behind their lines: convert a random enemy PAWN — it defects to you.', 'The underground fights on.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The partisans are silent.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['An enemy pawn defects to the resistance!'];
  });

  def(674, 'Field Medics', 2, 'heart', 'No one left behind: cleanse your whole army and revive a fallen pawn.', 'The medics crawl through the wire.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = n ? ['Medics cleanse ' + n + ' of your units.'] : [];
    const r = Fx.revive(g, s, 1, { type: 'p' });
    if (r.length) lines.push(...r);
    return lines.length ? lines : ['The aid station is quiet.'];
  });

  def(675, 'Supply Lines', 1, 'coin', 'An army marches on its stomach: shield every friendly piece on your back rank and cleanse your king.', 'Keep the convoys rolling.', (g, s) => {
    const back = s === 'w' ? 7 : 0;
    const lines = [];
    const rank = own(g, s).filter(q => q.r === back);
    const n = Fx.statusOn(g, rank, 's', 1, 'shield');
    if (n) lines.push('The rear echelon is armored.');
    const k = E.findKing(g, s);
    if (k && g.board[k.r][k.c].b) { g.board[k.r][k.c].b.f = 0; g.board[k.r][k.c].b.p = 0; }
    return lines.length ? lines : ['The supply train is ambushed.'];
  });

  def(676, 'Scorched Earth', 3, 'fire', 'Leave nothing: destroy every enemy PAWN, at the cost of your two least advanced pawns.', 'A desert we leave behind.', (g, s) => {
    const eps = foes(g, s).filter(q => q.cell.t === 'p');
    const lines = [];
    for (const q of eps) kill(g, q);
    const mineP = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    for (const q of mineP) if (g.board[q.r][q.c]) { Fx.removeAt(g, q.r, q.c, {}); }
    lines.unshift('Scorched earth takes ' + eps.length + ' enemy pawn' + (eps.length === 1 ? '' : 's') + (mineP.length ? ', at the cost of ' + mineP.length + ' of your own.' : '.'));
    return lines;
  });

  def(677, 'Armored Spearhead', 4, 'boltring', 'The panzers break through: destroy a random enemy ROOK and downgrade the enemy\'s strongest piece.', 'There is no defense against a spearhead.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (t) { kill(g, t); lines.push('The spearhead crushes an enemy rook.'); }
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const u = foes(g, s).filter(q => map[q.cell.t] && q !== t).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (u) { u.cell.t = map[u.cell.t]; Fx.flash(g, u.r, u.c, 'transform', ''); lines.push('The strongest enemy is punched down a rank.'); }
    return lines.length ? lines : ['The spearhead stalls.'];
  });

  def(678, 'Winter Offensive', 2, 'ice', 'General Winter fights with you: FREEZE two random enemy pieces.', 'The thaw has not come.', (g, s) => {
    const n = Fx.freezeN(g, s, 2);
    return n ? ['The cold seizes ' + n + ' enemy.'] : ['The thaw has come early.'];
  });

  def(679, 'Air Superiority', 3, 'storm', 'Clear skies: destroy the enemy\'s most advanced piece, then freeze another enemy on the same file.', 'Wings over the battlefield.', (g, s) => {
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!lead) return ['The skies are empty.'];
    const lines = [];
    kill(g, lead);
    lines.push('A strafing run destroys the enemy vanguard.');
    const same = foes(g, s).find(q => q.c === lead.c);
    if (same) { Fx.mod(same.cell, 'f', 1); Fx.flash(g, same.r, same.c, 'freeze', ''); lines.push('Another on the file is pinned.'); }
    return lines;
  });

  def(680, 'Radar Sweep', 1, 'eye', 'Contact: FREEZE the enemy\'s most advanced piece.', 'Beep. Beep. Contact.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!t) return ['The scope is clear.'];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['Radar locks and freezes the enemy vanguard.'];
  });

  def(681, 'Flamethrower', 2, 'fire', 'Burn the foxhole: destroy a random enemy pawn, then lay an ember HAZARD where it stood.', 'It burns through anything.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The fuel is dry.'];
    kill(g, t);
    E.setHaz(g, t.r, t.c, 'ember', 'burning trench');
    return ['The foxhole burns — an enemy pawn is gone, and the trench still smolders.'];
  });

  def(682, 'Trench Warfare', 2, 'shield', 'Dig in: shield every friendly PAWN.', 'Holding the line.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, ps, 's', 1, 'shield');
    return n ? ['Trenches shield ' + n + ' of your pawns.'] : ['No pawns to entrench.'];
  });

  def(683, 'Counterattack', 3, 'swap', 'Now we strike: your most advanced pawn destroys the enemy directly ahead and advances into that square.', 'Turn the tide.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const nr = p.r + (s === 'w' ? -1 : 1);
    if (nr < 0 || nr >= Fx.bd(g)) return [];
    const cell = g.board[nr][p.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['No enemy holds the square ahead.'];
    kill(g, { r: nr, c: p.c });
    Fx.relocate(g, p.r, p.c, nr, p.c, {});
    return ['Your vanguard counterattacks and takes the square!'];
  });

  def(684, 'War Bonds', 1, 'coin', 'The home front pays: your most advanced pawn is upgraded to a KNIGHT.', 'Every bond is a bullet.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return ['No one subscribed.'];
    p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['Victory bonds knight your vanguard!'];
  });

  def(685, 'Recon Plane', 2, 'eye', 'Eyes above: FREEZE the enemy piece on their most crowded file.', 'The plane sees everything.', (g, s) => {
    const counts = Array.from({ length: Fx.bd(g) }, () => 0);
    for (const q of foes(g, s)) counts[q.c]++;
    let best = 0; for (let c = 1; c < Fx.bd(g); c++) if (counts[c] > counts[best]) best = c;
    const t = rnd(foes(g, s).filter(q => q.c === best));
    if (!t) return ['The plane sees nothing.'];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['Recon freezes an enemy in the thickest file.'];
  });

  def(686, 'Demolition Squad', 2, 'fire', 'Blow the bridge: destroy a random enemy piece on the center files — or any enemy piece if none are there.', 'Timbers, timbers.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => q.c === 3 || q.c === 4));
    if (!t) t = rnd(foes(g, s));
    if (!t) return ['The charges are unset.'];
    kill(g, t);
    return ['The demolition squad removes the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(687, 'Fight to the Last', 3, 'shield', 'We will not retreat: shield every friendly piece in the two ranks in front of your king.', 'Stand and die well.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const rows = s === 'w' ? [k.r - 1, k.r - 2] : [k.r + 1, k.r + 2];
    const guard = own(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    return n ? ['The last stand shields ' + n + ' defender' + (n > 1 ? 's' : '') + '.'] : ['There is no one left to stand.'];
  });

  def(688, 'Naval Bombardment', 3, 'drop', 'The fleet opens from the coast: destroy a random enemy piece on an EDGE file, then push another edge piece inward.', 'From sea to shining sea.', (g, s) => {
    const edge = foes(g, s).filter(q => q.c === 0 || q.c === Fx.bd(g) - 1);
    const lines = [];
    const t = rnd(edge);
    if (t) { kill(g, t); lines.push('Naval guns destroy an enemy ' + MD.pieceName(t.cell.t) + ' on the coast.'); }
    const u = rnd(edge.filter(q => q !== t));
    if (u) {
      const nc = u.c === 0 ? 1 : 6;
      if (!g.board[u.r][nc]) { Fx.relocate(g, u.r, u.c, u.r, nc, {}); lines.push('Shelling forces another inland.'); }
    }
    return lines.length ? lines : ['The fleet fires at empty water.'];
  });

  def(689, 'Combat Engineers', 2, 'portal', 'Bridge layers: your three most advanced pawns each hop one square forward, and all friendly HAZARDS are cleared (your own traps too).', 'Build, then move.', (g, s) => {
    const ps = advP(g, s).slice(0, 3);
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      if (!g.board[p.r][p.c]) continue;
      const nr = p.r + dr;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    Fx.clearAllHaz(g);
    return ['Engineers push ' + moved + ' pawn' + (moved > 1 ? 's' : '') + ' forward and sweep every hazard from the field.'];
  });

  def(690, 'Propaganda', 1, 'heart', 'A rousing broadcast: cleanse your whole army.', 'Victory is certain.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    return n ? ['The broadcast steadies ' + n + ' of your units.'] : ['Morale is already high.'];
  });

  def(691, 'Outflank', 3, 'swap', 'Envelop them: teleport your most advanced pawn to an empty square on the enemy\'s back rank.', 'Around the flank.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const rows = s === 'w' ? [0, 1] : [6, 7];
    const d = rnd(Fx.emptySq(g, r => rows.includes(r)));
    if (!d) return ['The flank is sealed.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    return ['Your vanguard outflanks to ' + sn(d.r, d.c) + ' behind enemy lines!'];
  });

  def(692, 'Machine Gun Nest', 2, 'target', 'Brrrrt: poison every enemy piece adjacent to your most advanced pawn.', 'The nest chews up the assault.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const near = foes(g, s).filter(q => Math.abs(q.r - p.r) <= 1 && Math.abs(q.c - p.c) <= 1);
    const n = Fx.statusOn(g, near, 'p', 1, 'poison');
    return n ? ['The nest poisons ' + n + ' enemy at your vanguard.'] : ['No one dares approach the nest.'];
  });

  def(693, 'Fortress Europe', 4, 'shield', 'The Atlantic Wall: shield every friendly piece on your half.', 'Impregnable.', (g, s) => {
    const rows = s === 'w' ? [3, 4, 5, 6, 7] : [0, 1, 2, 3, 4];
    const def = own(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, def, 's', 1, 'shield');
    return n ? ['The wall shields ' + n + ' defender' + (n > 1 ? 's' : '') + '.'] : ['The wall is unmanned.'];
  });

  def(694, 'Night Raid', 2, 'void', 'Silent knives in the dark: destroy the enemy piece that moved last, or their weakest piece.', 'They never heard it.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    let t = null, tType = null;
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { t = { r: last.to.r, c: last.to.c }; tType = cell.t; }
    }
    if (!t) {
      const w = weak(g, s);
      if (w) { t = { r: w.r, c: w.c }; tType = w.cell.t; }
    }
    if (!t || !tType) return ['The raid finds no sentry.'];
    Fx.removeAt(g, t.r, t.c, {});
    return ['A night raid eliminates the enemy ' + MD.pieceName(tType) + '.'];
  });

  def(695, 'Human Wave', 3, 'users', 'The reserves are committed: summon three pawns in front of your king.', 'They just keep coming.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const q of Fx.uniqN(spots, 3)) { Fx.place(g, s, 'p', q.r, q.c, {}); lines.push('A fresh pawn takes the line at ' + sn(q.r, q.c) + '.'); }
    return lines.length ? lines : ['The reserves are spent.'];
  });

  def(696, 'Rations', 1, 'heart', 'Hot food: your most advanced pawn is cleansed and shielded.', 'An army marches on stew.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    if (p.cell.b) { p.cell.b.f = 0; p.cell.b.p = 0; }
    Fx.mod(p.cell, 's', 1);
    return ['Rations steady your vanguard (shield).'];
  });

  def(697, 'Carpet Bombing', 4, 'fire', 'Bombers blot out the sun: destroy a random enemy piece on EACH of two random files, then freeze one more.', 'The earth shakes for miles.', (g, s) => {
    const c1 = Math.floor(Math.random() * Fx.bd(g));
    let c2 = Math.floor(Math.random() * Fx.bd(g));
    while (c2 === c1) c2 = Math.floor(Math.random() * Fx.bd(g));
    const lines = [];
    const t1 = rnd(foes(g, s).filter(q => q.c === c1));
    if (t1) { kill(g, t1); lines.push('Carpet bombs destroy an enemy on file ' + 'abcdefghijkl'[c1] + '.'); }
    const t2 = rnd(foes(g, s).filter(q => q.c === c2));
    if (t2) { kill(g, t2); lines.push('More bombs fall on file ' + 'abcdefghijkl'[c2] + '.'); }
    const u = rnd(foes(g, s).filter(q => q !== t1 && q !== t2));
    if (u) { Fx.mod(u.cell, 'f', 1); lines.push('A straggler is frozen by the shockwave.'); }
    return lines.length ? lines : ['The bombers release over empty fields.'];
  });

  def(698, 'Rear Echelon', 2, 'crown', 'Bring up HQ: shield your king and shield your most advanced piece.', 'The generals are safe.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is guarded.'); }
    const p = advP(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); lines.push('The vanguard is guarded.'); }
    return lines;
  });

  def(699, 'Veterans', 2, 'star', 'Old soldiers never die: upgrade your two most advanced pawns to KNIGHTS.', 'They simply fade away — not yet.', (g, s) => {
    const ps = advP(g, s).slice(0, 2);
    const lines = [];
    for (const p of ps) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A veteran rises to knight at ' + sn(p.r, p.c) + '.'); }
    return lines.length ? lines : ['The old guard is gone.'];
  });

  def(700, 'Home Front', 2, 'coin', 'The factories never sleep: revive a fallen piece — or if none have fallen, summon a Rifleman (factory hand turned soldier).', 'Total war, total production.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    return summon(g, s, 'infantry', 1);
  });

  def(701, 'Guerrilla Tactics', 2, 'void', 'Hit and run: your most advanced pawn darts two squares sideways to an empty square and is shielded.', 'Strike, vanish, strike.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const pool = [];
    for (let dc = -2; dc <= 2; dc++) {
      const r = p.r + dr * 2, c = p.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) pool.push({ r, c });
    }
    const d = rnd(pool);
    if (!d) return ['No cover for the hit-and-run.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    Fx.mod(g.board[d.r][d.c], 's', 1);
    return ['Your vanguard melts into the terrain at ' + sn(d.r, d.c) + ', shielded.'];
  });

  def(702, 'Code Talkers', 2, 'book', 'The code they never break: shield your king and cleanse your most advanced pawn.', 'The code the enemy never breaks.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is protected by the unbreakable code.'); }
    const p = advP(g, s)[0];
    if (p) { if (p.cell.b) { p.cell.b.f = 0; p.cell.b.p = 0; } lines.push('Your vanguard is cleansed.'); }
    return lines.length ? lines : ['The code is silent.'];
  });

  def(703, 'Blitz Spearhead', 4, 'storm', 'Armor and air in one fist: take an EXTRA move and upgrade your most advanced pawn to a QUEEN.', 'There is no defense.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const p = advP(g, s)[0];
    if (p) { p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', ''); return ['Blitzkrieg! An extra move, and your vanguard becomes a queen.']; }
    return ['Blitzkrieg! An extra move is yours.'];
  });

  def(704, 'War Correspondent', 1, 'book', 'The world is watching: shield your most advanced piece (a famous soldier must survive).', 'Keep the cameras rolling.', (g, s) => {
    const p = advP(g, s)[0] || adv(g, s)[0];
    if (!p) return [];
    Fx.mod(p.cell, 's', 1);
    return ['The famous vanguard is protected for the newsreels.'];
  });

  def(705, 'General\'s Orders', 2, 'crown', 'Follow the flag: your most advanced piece advances two squares (or one if blocked) and is shielded.', 'The general leads from the front.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    let r = p.r, moved = 0;
    while (moved < 2) {
      const nr = r + dr;
      if (nr < 0 || nr >= Fx.bd(g) || g.board[nr][p.c]) break;
      Fx.relocate(g, r, p.c, nr, p.c, {}); r = nr; moved++;
    }
    Fx.mod(g.board[r][p.c], 's', 1);
    return ['The general advances ' + moved + ' square' + (moved > 1 ? 's' : '') + ', shielded.'];
  });

  def(706, 'Total War', 4, 'crown', 'Everything is a weapon: every friendly pawn surges one step, every enemy pawn is poisoned, and you take an EXTRA move.', 'The whole world at war.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const nr = p.r + dr;
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    const eps = foes(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, eps, 'p', 1, 'poison');
    Fx.grantExtra(g, s, 1);
    return ['Total war! ' + moved + ' pawn' + (moved > 1 ? 's advance' : ' advances') + ', ' + n + ' enemy pawn' + (n === 1 ? ' is' : 's are') + ' poisoned, and you move again.'];
  });

  MD.AB_15 = A;
})();

/* ============================================================
   Mod Chess — Ability set 15: WORLD WAR II (War)
   IDs 657-706. Tanks, airstrikes, codebreakers, partisans and
   the arsenal of democracy. Every card is 'auto', has a
   fallback, and never removes a king.
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
  const nonKing = q => q.cell.t !== 'k';
  const foes = (g, s) => en(g, s).filter(nonKing);
  const mine = (g, s) => own(g, s).filter(q => q.cell.t !== 'k');
  const advPawns = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
  const strong = (g, s) => foes(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
  const weak = (g, s) => foes(g, s).sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
  const kill = (g, q, lines, what) => { Fx.removeAt(g, q.r, q.c, {}); lines.push(what || 'destroyed'); };
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(657, 'Infantry Advance', 1, 'War', 'paw', 'Move your two most advanced pawns one square forward each.', 'Boots on the ground.', (g, s) => {
    const ps = advPawns(g, s).slice(0, 2);
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      if (!g.board[p.r][p.c]) continue;
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    return moved ? ['Infantry advances — ' + moved + ' pawn' + (moved > 1 ? 's' : '') + ' forward.'] : ['The infantry is pinned down.'];
  });

  def(658, 'Tank Division', 3, 'War', 'boltring', 'Heavy armor rolls up: summon a Golem (your heavy tank) and destroy a random enemy pawn.', 'Steel and treads.', (g, s) => {
    const lines = Fx.summonN(g, s, 'golem', 1, { rows: s === 'w' ? [4, 5] : [2, 3] });
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (t) kill(g, t, lines, 'The tank\'s gun destroys an enemy pawn.');
    return lines.length ? lines : ['The division is still in the depot.'];
  });

  def(659, 'Artillery Barrage', 3, 'War', 'fire', 'Heavy guns soften the line: destroy a random enemy minor piece, then poison the enemy piece nearest it.', 'Fire for effect.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (!t) return ['The guns find no target.'];
    const lines = [];
    kill(g, t, lines, 'Artillery destroys an enemy ' + MD.pieceName(t.cell.t) + '.');
    let near = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - t.r) + Math.abs(q.c - t.c); if (q !== t && d < bd) { bd = d; near = q; } }
    if (near) { Fx.mod(near.cell, 'p', 1); Fx.flash(g, near.r, near.c, 'poison', ''); lines.push('Shrapnel poisons a nearby enemy.'); }
    return lines;
  });

  def(660, 'Strategic Bombing', 4, 'War', 'fire', 'The bombers come at dawn: destroy the enemy\'s strongest piece on the board.', 'Bombs away.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['The bombers return to base.'];
    kill(g, t, [], '');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is erased by high explosives!'];
  });

  def(661, 'Paratroopers', 3, 'War', 'drop', 'Drop behind the lines: summon three Imps near the enemy back rank.', 'They dropped out of the sun.', (g, s) => Fx.summonN(g, s, 'imp', 3, { rows: s === 'w' ? [0, 1, 2] : [5, 6, 7] }));

  def(662, 'Enigma Cracking', 2, 'War', 'book', 'Read their codes: you know the enemy\'s every move — take an extra move.', 'The code is broken.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    return ['Enigma broken — an extra move is yours.'];
  });

  def(663, 'Radar Sweep', 1, 'War', 'eye', 'Lock onto the target: freeze the enemy\'s most advanced piece.', 'Contact.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!t) return ['The scope is clear.'];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['Radar locks and freezes the enemy vanguard.'];
  });

  def(664, 'Sniper', 2, 'War', 'target', 'One round, one kill: destroy the enemy\'s weakest piece.', 'One breath, one trigger.', (g, s) => {
    const t = weak(g, s);
    if (!t) return ['The sniper holds fire.'];
    kill(g, t, [], '');
    return ['A single shot drops the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(665, 'Pillbox', 2, 'War', 'shield', 'Reinforced concrete: shield your king and every friendly piece on the same rank.', 'Nothing gets through.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const guards = own(g, s).filter(q => q.r === k.r);
    const n = Fx.statusOn(g, guards, 's', 1, 'shield');
    return n ? ['The bunker wards ' + n + ' piece' + (n > 1 ? 's' : '') + ' on your king\'s rank.'] : ['The bunker is empty.'];
  });

  def(666, 'Minefield', 2, 'War', 'skull', 'Sow the field: poison two random enemy pieces on your half of the board.', 'Every step could be the last.', (g, s) => {
    const rows = s === 'w' ? [3, 4, 5, 6] : [1, 2, 3, 4];
    const t = foes(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, Fx.uniqN(t, 2), 'p', 1, 'poison');
    return n ? ['Mines poison ' + n + ' enemy unit' + (n > 1 ? 's' : '') + ' in your territory.'] : ['The minefield is empty.'];
  });

  def(667, 'Flamethrower', 2, 'War', 'fire', 'Clear the foxhole: destroy a random enemy pawn and poison the enemy piece next to it.', 'Burns through anything.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The fuel is dry.'];
    const lines = [];
    kill(g, t, lines, 'The flamethrower consumes an enemy pawn.');
    const near = foes(g, s).find(q => Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    if (near) { Fx.mod(near.cell, 'p', 1); Fx.flash(g, near.r, near.c, 'poison', ''); lines.push('Fire catches the neighbor.'); }
    return lines;
  });

  def(668, 'Blitzkrieg', 4, 'War', 'storm', 'Lightning war: every friendly pawn surges one square forward, then you take an extra move.', 'Strike before they wake.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    Fx.grantExtra(g, s, 1);
    return ['Blitzkrieg! ' + moved + ' pawn' + (moved > 1 ? 's surge' : ' surges') + ' forward, and you move again.'];
  });

  def(669, 'Katyusha', 3, 'War', 'storm', 'Rocket artillery screams in: destroy a random enemy piece on a random file.', 'The stalin organ plays.', (g, s) => {
    const c = Math.floor(Math.random() * 8);
    const t = rnd(foes(g, s).filter(q => q.c === c));
    if (!t) return ['The rockets land on empty steppe.'];
    kill(g, t, [], '');
    return ['Katyusha rockets obliterate the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(670, 'U-Boat Wolfpack', 3, 'War', 'drop', 'Torpedoes from the deep: destroy a random enemy ROOK or QUEEN (whichever is present).', 'They never saw the periscope.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q'));
    if (!t) t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (!t) return ['No capital ship to sink.'];
    kill(g, t, [], '');
    return ['A torpedo rips the enemy ' + MD.pieceName(t.cell.t) + ' apart!'];
  });

  def(671, 'Espionage', 2, 'War', 'swap', 'A spy in their ranks: one random enemy PAWN defects and joins you.', 'Trust no one.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The spy is turned away.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['An enemy pawn defects with top-secret intel!'];
  });

  def(672, 'D-Day Landing', 4, 'War', 'drop', 'The longest day: summon two Warhorses AND two Imps on the enemy\'s half of the board.', 'Into the jaws of death.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2] : [5, 6, 7];
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'warhorse', 2, { rows }));
    lines.push(...Fx.summonN(g, s, 'imp', 2, { rows }));
    return lines.length ? lines : ['The landing craft find no beach.'];
  });

  def(673, 'Partisans', 2, 'War', 'users', 'The resistance rises: summon two Goblins (partisan fighters) in your own territory.', 'The underground fights on.', (g, s) => {
    const rows = s === 'w' ? [4, 5, 6] : [1, 2, 3];
    return Fx.summonN(g, s, 'goblin', 2, { rows });
  });

  def(674, 'Field Medics', 2, 'War', 'heart', 'Combat medics stabilize the line: cleanse all your pieces and revive a fallen pawn.', 'No one left behind.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = [];
    if (n) lines.push('Medics cleanse ' + n + ' of your units.');
    const r = Fx.revive(g, s, 1, { type: 'p' });
    if (r.length) lines.push(...r);
    return lines.length ? lines : ['The aid station is quiet.'];
  });

  def(675, 'Supply Lines', 1, 'War', 'coin', 'Keep the army fed: every friendly piece on your back rank is shielded and your king is healed (cleansed).', 'An army marches on its stomach.', (g, s) => {
    const lines = [];
    const back = s === 'w' ? 7 : 0;
    const rank = own(g, s).filter(q => q.r === back);
    const n = Fx.statusOn(g, rank, 's', 1, 'shield');
    if (n) lines.push('The rear echelon is armored.');
    const k = E.findKing(g, s);
    if (k && g.board[k.r][k.c].b) { g.board[k.r][k.c].b.f = 0; g.board[k.r][k.c].b.p = 0; }
    return lines.length ? lines : ['The supply train is ambushed.'];
  });

  def(676, 'Scorched Earth', 3, 'War', 'fire', 'Burn it all: destroy every enemy PAWN, then your own two most advanced pawns are destroyed by the fires too.', 'A desert we leave behind.', (g, s) => {
    const eps = foes(g, s).filter(q => q.cell.t === 'p');
    const lines = [];
    for (const q of eps) kill(g, q, lines, '');
    const myPs = advPawns(g, s).slice(0, 2);
    for (const q of myPs) if (g.board[q.r][q.c]) { Fx.removeAt(g, q.r, q.c, {}); }
    lines.unshift('Scorched earth destroys ' + eps.length + ' enemy pawn' + (eps.length === 1 ? '' : 's') + (myPs.length ? ', at the cost of ' + myPs.length + ' of your own.' : '.'));
    return lines.length ? lines : ['There is nothing left to burn.'];
  });

  def(677, 'General\'s Orders', 2, 'War', 'crown', 'The general takes the field: your most advanced piece advances two squares and is shielded.', 'Follow the flag.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    let targetR = p.r;
    const lines = [];
    for (const dist of [2, 1]) {
      const nr = p.r + dr * dist;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) {
        if (dist === 2 && g.board[p.r + dr][p.c]) continue;
        Fx.relocate(g, p.r, p.c, nr, p.c, {});
        targetR = nr;
        lines.push('The general advances ' + dist + ' square' + (dist > 1 ? 's' : '') + '.');
        break;
      }
    }
    Fx.mod(g.board[targetR][p.c], 's', 1);
    Fx.flash(g, targetR, p.c, 'shield', '');
    lines.push('The general is armored.');
    return lines;
  });

  def(678, 'Winter Offensive', 2, 'War', 'ice', 'The general winter freezes the enemy: freeze two random enemy pieces.', 'General Winter fights with you.', (g, s) => {
    const n = Fx.freezeN(g, s, 2);
    return n ? ['The cold seizes ' + n + ' enemy unit' + (n > 1 ? 's' : '') + '.'] : ['The thaw has come early.'];
  });

  def(679, 'Armored Spearhead', 4, 'War', 'boltring', 'The panzer spearhead breaks through: destroy a random enemy ROOK and downgrade the enemy\'s strongest piece.', 'Guderian would be proud.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (t) kill(g, t, lines, 'The spearhead crushes an enemy rook.');
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const u = foes(g, s).filter(q => map[q.cell.t] && q !== t).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (u) { u.cell.t = map[u.cell.t]; Fx.flash(g, u.r, u.c, 'transform', ''); lines.push('The strongest enemy is punched down a rank.'); }
    return lines.length ? lines : ['The spearhead stalls.'];
  });

  def(680, 'Air Superiority', 3, 'War', 'storm', 'Wings over the battlefield: destroy a random enemy piece on the enemy\'s most advanced file, then freeze another.', 'Clear skies ahead.', (g, s) => {
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!lead) return ['The skies are empty.'];
    const lines = [];
    const same = foes(g, s).filter(q => q.c === lead.c);
    const t = rnd(same) || lead;
    kill(g, t, lines, 'A strafing run destroys an enemy ' + MD.pieceName(t.cell.t) + '.');
    const u = rnd(foes(g, s).filter(q => q !== t));
    if (u) { Fx.mod(u.cell, 'f', 1); Fx.flash(g, u.r, u.c, 'freeze', ''); lines.push('Another is pinned by fire.'); }
    return lines;
  });

  def(681, 'Code Talkers', 2, 'War', 'book', 'An unbreakable code: shield your king AND cleanse your most advanced pawn.', 'The code the enemy never breaks.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is protected by the unbreakable code.'); }
    const p = advPawns(g, s)[0];
    if (p) { if (p.cell.b) { p.cell.b.f = 0; p.cell.b.p = 0; } lines.push('Your vanguard is cleansed.'); }
    return lines.length ? lines : ['The code is silent.'];
  });

  def(682, 'Trench Warfare', 2, 'War', 'shield', 'Dig in: every friendly PAWN gains a shield.', 'Holding the line.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, ps, 's', 1, 'shield');
    return n ? ['Trenches shield ' + n + ' of your pawns.'] : ['No pawns to entrench.'];
  });

  def(683, 'Counterattack', 3, 'War', 'swap', 'Turn the tide: your most advanced pawn destroys the enemy directly in front of it, then advances into that square.', 'Now we strike back.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const nr = p.r + (s === 'w' ? -1 : 1);
    if (nr < 0 || nr > 7) return [];
    const cell = g.board[nr][p.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['No enemy holds the square ahead.'];
    Fx.removeAt(g, nr, p.c, {});
    Fx.relocate(g, p.r, p.c, nr, p.c, {});
    return ['Your vanguard counterattacks and takes the square, destroying the enemy ' + MD.pieceName(cell.t) + '!'];
  });

  def(684, 'War Bonds', 1, 'War', 'coin', 'The home front pays: your most advanced pawn is upgraded to a KNIGHT (bought with victory bonds).', 'Every bond is a bullet.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return ['No one subscribed.'];
    p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['Victory bonds knight your vanguard!'];
  });

  def(685, 'Recon Plane', 2, 'War', 'eye', 'Eyes in the sky: shield your king and freeze the enemy piece on the most crowded file.', 'The plane sees everything.', (g, s) => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const q of foes(g, s)) counts[q.c]++;
    let best = 0; for (let c = 1; c < 8; c++) if (counts[c] > counts[best]) best = c;
    const t = rnd(foes(g, s).filter(q => q.c === best));
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is guarded from above.'); }
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('Recon freezes an enemy in the thickest file.'); }
    return lines.length ? lines : ['The plane sees nothing.'];
  });

  def(686, 'Demolition Squad', 2, 'War', 'fire', 'Blow the bridge: destroy a random enemy piece standing on the center files (d or e), or any piece if none are there.', 'Timbers, timbers.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => q.c === 3 || q.c === 4));
    if (!t) t = rnd(foes(g, s));
    if (!t) return ['The charges are unset.'];
    kill(g, t, [], '');
    return ['The demolition squad removes the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(687, 'Fight to the Last', 3, 'War', 'shield', 'We will not retreat: shield every friendly piece in the two ranks in front of your king.', 'Stand and die well.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const rows = s === 'w' ? [k.r - 1, k.r - 2] : [k.r + 1, k.r + 2];
    const guard = own(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    return n ? ['The last stand shields ' + n + ' defender' + (n > 1 ? 's' : '') + ' before the king.'] : ['There is no one left to stand.'];
  });

  def(688, 'Tank Destroyer', 3, 'War', 'target', 'Hull-down and waiting: destroy the enemy\'s most valuable piece worth a rook or more — the ambush is perfect.', 'It waits for the heavy stuff.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) return ['No heavy target drives into the kill zone.'];
    kill(g, t, [], '');
    return ['An ambush destroys the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(689, 'Naval Bombardment', 3, 'War', 'drop', 'The fleet opens up from the coast: destroy a random enemy piece on an edge file, then push one other edge piece inward.', 'From sea to shining sea.', (g, s) => {
    const edge = foes(g, s).filter(q => q.c === 0 || q.c === 7);
    const lines = [];
    const t = rnd(edge);
    if (t) kill(g, t, lines, 'Naval guns destroy an enemy ' + MD.pieceName(t.cell.t) + ' on the coast.');
    const u = rnd(edge.filter(q => q !== t));
    if (u) {
      const nc = u.c === 0 ? 1 : 6;
      if (!g.board[u.r][nc]) { Fx.relocate(g, u.r, u.c, u.r, nc, {}); lines.push('Shelling forces another inland.'); }
    }
    return lines.length ? lines : ['The fleet fires at empty water.'];
  });

  def(690, 'Sapper Engineers', 2, 'War', 'book', 'Clear the way: remove all friendly poison & freeze AND your three most advanced pawns each hop one step forward.', 'First to the wire.', (g, s) => {
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; }
    const ps = advPawns(g, s).slice(0, 3);
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      if (!g.board[p.r][p.c]) continue;
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    return ['Sappers cleanse the line' + (moved ? ' and push ' + moved + ' pawn' + (moved > 1 ? 's' : '') + ' forward' : '') + '.'];
  });

  def(691, 'Propaganda', 1, 'War', 'heart', 'A rousing broadcast lifts morale: cleanse your whole army.', 'Victory is certain.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    return n ? ['The broadcast steadies ' + n + ' of your unit' + (n > 1 ? 's' : '') + '.'] : ['Morale is already high.'];
  });

  def(692, 'Outflank', 3, 'War', 'swap', 'Envelop them: teleport your most advanced pawn to an empty square on the enemy\'s back rank.', 'Around the flank.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const rows = s === 'w' ? [0, 1] : [6, 7];
    const pool = Fx.emptySq(g, r => rows.includes(r));
    const d = rnd(pool);
    if (!d) return ['The flank is sealed.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    return ['Your vanguard outflanks to ' + sn(d.r, d.c) + ' behind enemy lines!'];
  });

  def(693, 'Rations', 1, 'War', 'heart', 'Hot food and a full canteen: your most advanced pawn is shielded and cleansed.', 'An army marches on stew.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    if (p.cell.b) { p.cell.b.f = 0; p.cell.b.p = 0; }
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    return ['Rations steady your vanguard (shield).'];
  });

  def(694, 'Machine Gun Nest', 2, 'War', 'target', 'A fixed position chews up attackers: poison every enemy piece adjacent to your most advanced pawn.', 'Brrrrt.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const near = foes(g, s).filter(q => Math.abs(q.r - p.r) <= 1 && Math.abs(q.c - p.c) <= 1);
    const n = Fx.statusOn(g, near, 'p', 1, 'poison');
    return n ? ['The nest poisons ' + n + ' enemy adjacent to your vanguard.'] : ['No one dares approach the nest.'];
  });

  def(695, 'Fortress Europe', 4, 'War', 'shield', 'The Atlantic Wall: shield every friendly piece on your half of the board.', 'Impregnable.', (g, s) => {
    const rows = s === 'w' ? [3, 4, 5, 6, 7] : [0, 1, 2, 3, 4];
    const def = own(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, def, 's', 1, 'shield');
    return n ? ['The wall shields ' + n + ' defender' + (n > 1 ? 's' : '') + ' on your side.'] : ['The wall is unmanned.'];
  });

  def(696, 'Combat Engineers', 2, 'War', 'portal', 'Bridge layers: summon a Dwarf (your sapper) beside your most advanced pawn, then that pawn advances a step.', 'Build, then move.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const lines = Fx.summonN(g, s, 'dwarf', 1, { rows: [p.r] });
    const nr = p.r + (s === 'w' ? -1 : 1);
    if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('The sappers clear the way forward.'); }
    return lines.length ? lines : ['The engineers are pinned.'];
  });

  def(697, 'Night Raid', 2, 'War', 'void', 'Silent knives in the dark: destroy a random enemy piece that moved last, or the weakest enemy piece.', 'They never heard it.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    let t = null;
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') t = { r: last.to.r, c: last.to.c, cell };
    }
    if (!t) t = weak(g, s);
    if (!t) return ['The raid finds no sentry.'];
    kill(g, t, [], '');
    return ['A night raid eliminates the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(698, 'Human Wave', 3, 'War', 'users', 'The reserves are committed: summon three pawns in front of your king.', 'They just keep coming.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const q of Fx.uniqN(spots, 3)) { Fx.place(g, s, 'p', q.r, q.c, {}); lines.push('A fresh pawn takes the line at ' + sn(q.r, q.c) + '.'); }
    return lines.length ? lines : ['The reserves are spent.'];
  });

  def(699, 'War Correspondent', 1, 'War', 'book', 'The world is watching: your most advanced piece is shielded (a famous soldier must survive).', 'Keep the cameras rolling.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    return ['The famous vanguard is protected for the newsreels.'];
  });

  def(700, 'Carpet Bombing', 4, 'War', 'fire', 'The bombers blot out the sun: destroy a random enemy piece in each of two random files.', 'The earth shakes for miles.', (g, s) => {
    const lines = [];
    const c1 = Math.floor(Math.random() * 8);
    let c2 = Math.floor(Math.random() * 8);
    while (c2 === c1) c2 = Math.floor(Math.random() * 8);
    const t1 = rnd(foes(g, s).filter(q => q.c === c1));
    if (t1) kill(g, t1, lines, 'Carpet bombs destroy an enemy ' + MD.pieceName(t1.cell.t) + ' on file ' + 'abcdefgh'[c1] + '.');
    const t2 = rnd(foes(g, s).filter(q => q.c === c2));
    if (t2) kill(g, t2, lines, 'More bombs destroy an enemy ' + MD.pieceName(t2.cell.t) + ' on file ' + 'abcdefgh'[c2] + '.');
    return lines.length ? lines : ['The bombers release over empty fields.'];
  });

  def(701, 'Rear Echelon', 2, 'War', 'crown', 'Bring up headquarters: shield your king and summon an Imp (your staff officer) beside it.', 'The generals are safe.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const lines = [];
    Fx.mod(g.board[k.r][k.c], 's', 1);
    lines.push('The king is guarded by headquarters.');
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) near.push({ r, c });
    }
    const q = rnd(near);
    if (q) { Fx.place(g, s, 'imp', q.r, q.c, {}); lines.push('A staff officer takes post at ' + sn(q.r, q.c) + '.'); }
    return lines;
  });

  def(702, 'Veterans', 2, 'War', 'star', 'Old soldiers never die: upgrade two of your most advanced pawns to KNIGHTS.', 'They simply fade away — not yet.', (g, s) => {
    const ps = advPawns(g, s).slice(0, 2);
    const lines = [];
    for (const p of ps) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A veteran rises to knight at ' + sn(p.r, p.c) + '.'); }
    return lines.length ? lines : ['The old guard is gone.'];
  });

  def(703, 'Blitz Spearhead', 4, 'War', 'storm', 'Armor and air in one fist: take an extra move AND your most advanced pawn is upgraded to a QUEEN.', 'There is no defense.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const p = advPawns(g, s)[0];
    if (p) { p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', ''); return ['Blitzkrieg! An extra move, and your vanguard becomes a queen.']; }
    return ['Blitzkrieg! An extra move is yours.'];
  });

  def(704, 'Home Front', 2, 'War', 'coin', 'The factories never sleep: revive a fallen piece OR summon a Dwarf (factory worker turned soldier).', 'Total war, total production.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    return Fx.summonN(g, s, 'dwarf', 1);
  });

  def(705, 'Guerilla Tactics', 2, 'War', 'void', 'Hit and run: your most advanced pawn darts to a random empty square two rows ahead, evading capture (shielded).', 'Strike, vanish, strike.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const pool = [];
    for (let dc = -2; dc <= 2; dc++) {
      const r = p.r + dr * 2, c = p.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) pool.push({ r, c });
    }
    const d = rnd(pool);
    if (!d) return ['No cover for the hit-and-run.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    Fx.mod(g.board[d.r][d.c], 's', 1);
    Fx.flash(g, d.r, d.c, 'shield', '');
    return ['Your vanguard melts into the terrain at ' + sn(d.r, d.c) + ', shielded.'];
  });

  def(706, 'Total War', 4, 'War', 'crown', 'Everything is a weapon: every friendly pawn surges one step forward, every enemy pawn is poisoned, and you take an extra move.', 'The whole world at war.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    const eps = foes(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, eps, 'p', 1, 'poison');
    Fx.grantExtra(g, s, 1);
    return ['Total war! ' + moved + ' pawn' + (moved > 1 ? 's advance' : ' advances') + ', ' + n + ' enemy pawn' + (n === 1 ? ' is' : 's are') + ' poisoned, and you move again.'];
  });

  MD.AB_15 = A;
})();

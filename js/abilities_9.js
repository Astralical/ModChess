/* ============================================================
   Mod Chess — Ability set 9: THE MACHINE (sci-fi / robotic)
   IDs 357-406. Lasers, hacks, drones, reactors and constructs.
   Every card has graceful fallbacks so it never soft-locks.
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
  const fwd = s => (s === 'w' ? -1 : 1);
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(357, 'Reactor Pulse', 2, 'SciFi', 'bolt', 'Upgrade one random friendly pawn into a bishop and one random friendly knight into a rook — the grid surges.', 'Power to the people.', (g, s) => {
    const pawn = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    const knight = rnd(own(g, s).filter(q => q.cell.t === 'n'));
    const lines = [];
    if (pawn) { pawn.cell.t = 'b'; Fx.flash(g, pawn.r, pawn.c, 'transform', ''); lines.push('A pawn is wired into a Bishop.'); }
    if (knight) { knight.cell.t = 'r'; Fx.flash(g, knight.r, knight.c, 'transform', ''); lines.push('A knight is rebuilt as a Rook.'); }
    return lines.length ? lines : ['No components to upgrade.'];
  });

  def(358, 'EMP Overload', 3, 'SciFi', 'bolt', 'Freeze every enemy piece on your two most crowded files — their circuits fry.', 'One pulse, total blackout.', (g, s) => {
    const counts = Array.from({ length: Fx.bd(g) }, () => 0);
    for (const q of en(g, s)) counts[q.c]++;
    const files = Array.from({ length: Fx.bd(g) }, (_, i) => i).sort((a, b) => counts[b] - counts[a]).slice(0, 2);
    const targets = en(g, s).filter(q => q.cell.t !== 'k' && files.includes(q.c));
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['The EMP fries ' + n + ' enemy unit' + (n > 1 ? 's' : '') + ' on the crowded files!'] : ['No concentrated targets to fry.'];
  });

  def(359, 'Laser Grid', 2, 'SciFi', 'fire', 'Destroy a random enemy piece on the same rank or file as your rook, then your rook is shielded.', 'Cut lines of light.', (g, s) => {
    const rook = rnd(own(g, s).filter(q => q.cell.t === 'r'));
    if (!rook) return ['You need a tower to anchor the grid.'];
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k' && (q.r === rook.r || q.c === rook.c)));
    const lines = [];
    if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('The grid vaporizes the ' + MD.pieceName(t.cell.t) + '!'); }
    Fx.mod(g.board[rook.r][rook.c], 's', 1); Fx.flash(g, rook.r, rook.c, 'shield', '');
    lines.push('Your rook is shielded.');
    return lines;
  });

  def(360, 'Deploy Sentry', 2, 'SciFi', 'spark', 'Summon a Rook on an empty square that is shielded, and a pawn beside it.', 'Sentries never sleep.', (g, s) => {
    const lines = Fx.summonN(g, s, 'r', 1, { rows: s === 'w' ? [6, 7] : [0, 1] });
    const got = own(g, s).filter(q => q.cell.t === 'r').slice(-1)[0];
    if (got) { Fx.mod(got.cell, 's', 1); Fx.flash(g, got.r, got.c, 'shield', ''); }
    lines.push(...Fx.summonN(g, s, 'p', 1));
    return lines.length ? lines : ['No room for a sentry.'];
  });

  def(361, 'Hack the King\'s Guard', 3, 'SciFi', 'void', 'Take control of a random enemy ROOK — it switches sides where it stands.', 'Their own towers turn on them.', (g, s) => {
    const rooks = en(g, s).filter(q => q.cell.t === 'r');
    const t = rnd(rooks);
    if (!t) return ['No enemy tower is networked.'];
    t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
    return ['You seize the enemy tower at ' + sn(t.r, t.c) + '!'];
  });

  def(362, 'Drone Swarm', 1, 'SciFi', 'spark', 'Summon two Imps on empty squares — recon drones that skitter and scurry.', 'A thousand eyes, one will.', (g, s) => Fx.summonN(g, s, 'imp', 2));

  def(363, 'Turret Array', 3, 'SciFi', 'fire', 'Every friendly Rook fires: destroy the first enemy piece it sees along its rank, then all your rooks are shielded.', 'The walls have teeth.', (g, s) => {
    const rooks = own(g, s).filter(q => q.cell.t === 'r');
    const lines = [];
    for (const rook of rooks) {
      for (const dc of [1, -1]) {
        let c = rook.c + dc;
        while (c >= 0 && c < Fx.bd(g)) {
          if (g.board[rook.r][c]) { if (g.board[rook.r][c].c === O(s) && g.board[rook.r][c].t !== 'k') { Fx.removeAt(g, rook.r, c, {}); lines.push('A turret strikes ' + sn(rook.r, c) + '.'); } break; }
          c += dc;
        }
      }
    }
    if (rooks.length) Fx.statusOn(g, rooks, 's', 1, 'shield');
    return lines.length ? lines : (rooks.length ? ['The turrets hold fire, ready and warded.'] : ['No towers to mount turrets on.']);
  });

  def(364, 'Nanobots', 2, 'SciFi', 'spark', 'Heal your own host: remove all freeze and poison from your pieces, and repair (revive) your most recently lost pawn.', 'Machines mend machines.', (g, s) => {
    const lines = [];
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; if (q.cell.b.s <= 0) q.cell.b = undefined; n++; }
    if (n) lines.push('Nanobots repair ' + n + ' unit' + (n > 1 ? 's' : '') + '.');
    lines.push(...Fx.revive(g, s, 1, { type: 'p' }));
    return lines.length ? lines : ['The nanobots idle — nothing to fix yet.'];
  });

  def(365, 'Railgun', 2, 'SciFi', 'fire', 'Destroy the enemy piece furthest from your queen, then push your queen 1 square toward the enemy.', 'A shot measured in files.', (g, s) => {
    const q = own(g, s).find(x => x.cell.t === 'q');
    const foes = en(g, s).filter(x => x.cell.t !== 'k');
    if (!q || !foes.length) return [];
    const t = foes.slice().sort((a, b) => (Math.abs(a.r - q.r) + Math.abs(a.c - q.c)) - (Math.abs(b.r - q.r) + Math.abs(b.c - q.c))).pop();
    Fx.removeAt(g, t.r, t.c, {});
    const r = q.r + fwd(s);
    if (r >= 0 && r < Fx.bd(g) && !g.board[r][q.c]) Fx.relocate(g, q.r, q.c, r, q.c, {});
    return ['The railgun deletes the distant ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(366, 'Servo Override', 1, 'SciFi', 'bolt', 'Move a random friendly piece one square in any direction (as if it had wheels).', 'Everything has a motor now.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    const t = rnd(mine);
    if (!t) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
    }
    const d = rnd(spots);
    if (!d) return ['The servo binds — no space to roll.'];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    return ['Your ' + MD.pieceName(t.cell.t) + ' rolls to ' + sn(d.r, d.c) + '.'];
  });

  def(367, 'Antivirus', 1, 'SciFi', 'spark', 'Cleanse your most valuable piece of poison and freeze, then shield it.', 'Firewall engaged.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!mine) return [];
    if (mine.cell.b) { mine.cell.b.f = 0; mine.cell.b.p = 0; if (mine.cell.b.s <= 0) mine.cell.b = undefined; }
    Fx.mod(mine.cell, 's', 1); Fx.flash(g, mine.r, mine.c, 'shield', '');
    return ['Your ' + MD.pieceName(mine.cell.t) + ' is cleansed and shielded.'];
  });

  def(368, 'Mecha Frame', 3, 'SciFi', 'spark', 'Upgrade your most advanced pawn into a Golem (a heavy mech) and shield it.', 'Heavy plate, heavier fist.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return [];
    p.cell.t = 'golem'; Fx.flash(g, p.r, p.c, 'transform', '');
    Fx.mod(p.cell, 's', 1);
    return ['Your vanguard is rebuilt as a shielded Golem mech!'];
  });

  def(369, 'Static Field', 1, 'SciFi', 'bolt', 'Freeze every enemy piece adjacent to your queen.', 'Don\'t touch the rail.', (g, s) => {
    const q = own(g, s).find(x => x.cell.t === 'q');
    if (!q) return [];
    const foes = en(g, s).filter(x => x.cell.t !== 'k' && Math.abs(x.r - q.r) <= 1 && Math.abs(x.c - q.c) <= 1);
    const n = Fx.statusOn(g, foes, 'f', 1, 'freeze');
    return n ? ['Static locks ' + n + ' unit' + (n > 1 ? 's' : '') + ' beside the queen.'] : ['No one near the queen to shock.'];
  });

  def(370, 'Target Lock', 2, 'SciFi', 'target', 'Freeze the enemy piece with the highest value, then destroy the enemy piece with the lowest value.', 'Designated, then deleted.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
    if (!foes.length) return [];
    const hi = foes[0], lo = foes[foes.length - 1];
    const lines = [];
    if (hi !== lo) { Fx.mod(hi.cell, 'f', 1); Fx.flash(g, hi.r, hi.c, 'freeze', ''); lines.push('The high-value target is locked and frozen.'); }
    Fx.removeAt(g, lo.r, lo.c, {});
    lines.push('The low-value target is deleted.');
    return lines;
  });

  def(371, 'Auto-Cannon', 1, 'SciFi', 'fire', 'Destroy two random enemy pawns.', 'Rapid fire, no questions.', (g, s) => Fx.destroyN(g, s, 2, { only: 'p' }));

  def(372, 'Cyber Infestation', 2, 'SciFi', 'spark', 'Poison a random enemy piece and downgrade another random enemy piece.', 'Viruses have no honor.', (g, s) => {
    const lines = [];
    const t1 = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    const others = en(g, s).filter(q => q !== t1 && q.cell.t !== 'k');
    const t2 = rnd(others);
    if (t1) { Fx.mod(t1.cell, 'p', 1); Fx.flash(g, t1.r, t1.c, 'poison', ''); lines.push('A unit is infected.'); }
    if (t2) lines.push(...Fx.downgradeSq(g, [t2]));
    return lines.length ? lines : ['No systems to infect.'];
  });

  def(373, 'Overcharge Battery', 1, 'SciFi', 'bolt', 'Shield your two most advanced pawns — their armor capacitors charge.', 'Always keep them charged.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    const n = Fx.statusOn(g, pawns, 's', 1, 'shield');
    return n ? ['The vanguard batteries are charged.'] : [];
  });

  def(374, 'Gravity Boots', 2, 'SciFi', 'void', 'Swap your two most advanced pawns with any two of your pieces on your back rank.', 'They climb where others can\'t.', (g, s) => {
    const fwdPawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    const back = own(g, s).filter(q => q.cell.t !== 'p' && q.cell.t !== 'k' && (s === 'w' ? q.r >= 6 : q.r <= 1));
    if (!fwdPawns.length || !back.length) return ['Nothing to redeploy.'];
    const n = Math.min(fwdPawns.length, back.length);
    for (let i = 0; i < n; i++) Fx.swapSq(g, fwdPawns[i], back[i]);
    return ['Your vanguard boots to the back line, swapping with ' + n + ' piece' + (n > 1 ? 's' : '') + '.'];
  });

  def(375, 'Thermal Lance', 2, 'SciFi', 'fire', 'Destroy the enemy piece in front of your most advanced rook (same file), then freeze the next one behind it.', 'White-hot and then cold.', (g, s) => {
    const rooks = own(g, s).filter(q => q.cell.t === 'r').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const rook = rooks[0];
    if (!rook) return [];
    const dir = fwd(s);
    let r = rook.r + dir;
    const lines = [];
    while (r >= 0 && r < Fx.bd(g)) {
      const cell = g.board[r] && g.board[r][rook.c];
      if (cell) {
        if (cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, r, rook.c, {}); lines.push('The lance burns a hole through ' + sn(r, rook.c) + '.'); }
        const r2 = r + dir;
        if (cell.c === O(s) && r2 >= 0 && r2 < Fx.bd(g) && g.board[r2] && g.board[r2][rook.c] && g.board[r2][rook.c].c === O(s)) { Fx.mod(g.board[r2][rook.c], 'f', 1); Fx.flash(g, r2, rook.c, 'freeze', ''); lines.push('The unit behind is flash-frozen.'); }
        break;
      }
      r += dir;
    }
    return lines.length ? lines : ['The lance meets open air.'];
  });

  def(376, 'System Reboot', 3, 'SciFi', 'swap', 'A random friendly piece respawns on an empty square behind your lines (teleport it home), and you take an extra move.', 'Reboot and redeploy.', (g, s) => {
    const t = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (t) {
      const rows = s === 'w' ? [7, 6] : [0, 1];
      const d = rnd(Fx.emptySq(g, (r, c) => rows.includes(r)));
      if (d) { Fx.relocate(g, t.r, t.c, d.r, d.c, {}); Fx.grantExtra(g, s, 1); return ['Your ' + MD.pieceName(t.cell.t) + ' reboots to ' + sn(d.r, d.c) + ' — move again!']; }
    }
    Fx.grantExtra(g, s, 1);
    return ['No unit to reboot — you use the extra cycle to move again.'];
  });

  def(377, 'Uplink', 2, 'SciFi', 'spark', 'Copy the enemy\'s most advanced pawn: summon a mirror pawn on your side adjacent to your king.', 'The uplink copies the file.', (g, s) => {
    const pawns = en(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const t = pawns[0];
    if (!t) return ['No enemy pawn on the network.'];
    const k = E.findKing(g, s);
    const nb = g.n || 8;
    const spots = [];
    if (k) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < nb && c >= 0 && c < nb && !g.board[r][c]) spots.push({ r, c });
    }
    const d = rnd(spots) || rnd(Fx.emptySq(g, (r, c) => Fx.inOwnHalf(g, s, r)));
    if (!d) return ['No free port to spawn into.'];
    Fx.place(g, s, 'p', d.r, d.c, {});
    return ['A mirror of their pawn is cloned to ' + sn(d.r, d.c) + '!'];
  });

  def(378, 'Kinetic Shield', 1, 'SciFi', 'shield', 'Shield a random friendly ROOK or BISHOP for the enemy\'s next turn.', 'Reactive armor, always on.', (g, s) => {
    const t = rnd(own(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'b'));
    if (!t) return [];
    Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', '');
    return ['A kinetic shield hums around the ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(379, 'Concussion Mine', 2, 'SciFi', 'fire', 'Destroy a random enemy piece AND all enemy pieces adjacent to it — the shockwave clears the sector.', 'Loud. Then quiet.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    Fx.removeAt(g, t.r, t.c, {});
    let gone = 1;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && g.board[r][c] && g.board[r][c].c === O(s) && g.board[r][c].t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
    }
    return ['The mine takes ' + gone + ' enemy unit' + (gone > 1 ? 's' : '') + '!'];
  });

  def(380, 'Prototype', 3, 'SciFi', 'spark', 'Your most advanced pawn is rebuilt as a random heavy mech (Golem, Griffon or Hydra) and given a shield.', 'Field-testing: over.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return [];
    const pool = ['golem', 'griffon', 'hydra'];
    const k = rnd(pool);
    p.cell.t = k; Fx.flash(g, p.r, p.c, 'transform', '');
    Fx.mod(p.cell, 's', 1);
    return ['A prototype ' + MD.pieceName(k) + ' stomps off the line, shielded!'];
  });

  def(381, 'Short Circuit', 1, 'SciFi', 'bolt', 'Freeze a random enemy piece and shield a random friendly piece — the charge has to go somewhere.', 'Pop. Fizz. Clunk.', (g, s) => {
    const lines = [];
    const t = rnd(en(g, s).filter(q => q.cell.t !== 'k'));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('An enemy unit short-circuits.'); }
    const f = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (f) { Fx.mod(f.cell, 's', 1); Fx.flash(g, f.r, f.c, 'shield', ''); lines.push('The surge shields one of yours.'); }
    return lines;
  });

  def(382, 'Bunker', 2, 'SciFi', 'shield', 'Shield every friendly piece on the two files beside your king — a defensive perimeter.', 'Dig in.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const targets = own(g, s).filter(q => Math.abs(q.c - k.c) <= 1 && Math.abs(q.r - k.r) <= 2);
    const n = Fx.statusOn(g, targets, 's', 1, 'shield');
    return n ? ['The perimeter is sealed — ' + n + ' unit' + (n > 1 ? 's are' : ' is') + ' shielded.'] : ['The bunker is empty.'];
  });

  def(383, 'Magnetic Crane', 1, 'SciFi', 'void', 'Swap a random friendly piece with the nearest enemy piece to it.', 'A magnet for trouble.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k');
    const foes = en(g, s).filter(q => q.cell.t !== 'k');
    if (!mine.length || !foes.length) return [];
    let best = null, bd = 99;
    for (const m of mine) for (const f of foes) { const d = Math.abs(m.r - f.r) + Math.abs(m.c - f.c); if (d < bd) { bd = d; best = [m, f]; } }
    if (!best) return [];
    Fx.swapSq(g, best[0], best[1]);
    return ['The crane snaps two units together and swaps them.'];
  });

  def(384, 'Self-Destruct', 3, 'SciFi', 'fire', 'Destroy one of your pawns and every enemy piece adjacent to it — controlled demolition.', 'You\'ll rebuild.', (g, s) => {
    const pawn = rnd(own(g, s).filter(q => q.cell.t === 'p'));
    if (!pawn) return ['No pawn to sacrifice.'];
    Fx.removeAt(g, pawn.r, pawn.c, {});
    let gone = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = pawn.r + dr, c = pawn.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && g.board[r][c] && g.board[r][c].c === O(s) && g.board[r][c].t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
    }
    return ['The pawn detonates, taking ' + gone + ' enemy unit' + (gone === 1 ? '' : 's') + ' with it!'];
  });

  def(385, 'Clean Sweep', 2, 'SciFi', 'swap', 'Teleport every friendly piece on your back two ranks to random empty squares in your front half.', 'Redeploy the whole garrison.', (g, s) => {
    const n2 = g.n || 8;
    const mine = own(g, s).filter(q => s === 'w' ? q.r >= n2 - 2 : q.r <= 1);
    let moved = 0;
    for (const q of mine) {
      const d = rnd(Fx.emptySq(g, (r, c) => s === 'w' ? r <= (n2 >> 1) : r >= (n2 >> 1) - 1));
      if (d) { Fx.relocate(g, q.r, q.c, d.r, d.c, {}); moved++; }
    }
    return moved ? ['The garrison teleports forward — ' + moved + ' unit' + (moved > 1 ? 's' : '') + ' moved.'] : ['No garrison to move.'];
  });

  def(386, 'Signal Jam', 1, 'SciFi', 'void', 'Freeze the enemy piece that moved last — its comms are cut.', 'Now they\'re alone.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    if (!last || last.color !== O(s)) return ['No recent transmission to jam.'];
    const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['The signal slipped away.'];
    Fx.mod(cell, 'f', 1); Fx.flash(g, last.to.r, last.to.c, 'freeze', '');
    return ['The last mover is jammed and frozen.'];
  });

  def(387, 'Jump Jets', 2, 'SciFi', 'swap', 'Teleport your most advanced pawn over the enemy line to a random empty square two ranks beyond it, then shield it.', 'Straight up, then down.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const p = pawns[0];
    if (!p) return [];
    const t = p.r + 2 * fwd(s);
    const spots = Fx.emptySq(g, (r, c) => s === 'w' ? r <= t : r >= t);
    const d = rnd(spots);
    if (!d) return ['The jets find no landing pad.'];
    Fx.relocate(g, p.r, p.c, d.r, d.c, {});
    Fx.mod(g.board[d.r][d.c], 's', 1);
    return ['Your vanguard jumps the line to ' + sn(d.r, d.c) + ', shielded!'];
  });

  def(388, 'Degauss', 1, 'SciFi', 'bolt', 'Remove ALL shield timers from enemy pieces — their armor shorts out.', 'Shields down.', (g, s) => {
    let n = 0;
    for (const q of en(g, s)) if (q.cell.b && q.cell.b.s > 0) { q.cell.b.s = 0; if (q.cell.b.f <= 0 && q.cell.b.p <= 0) q.cell.b = undefined; n++; }
    return n ? ['The degaussing coil strips ' + n + ' enemy shield' + (n > 1 ? 's' : '') + '.'] : ['No enemy shields to strip.'];
  });

  def(389, 'Autopilot', 3, 'SciFi', 'clock', 'Your two most advanced pieces each take a bonus step toward the enemy, then you move again (extra move, no new spell).', 'The fleet flies itself.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
    let moved = 0;
    for (const q of mine) {
      const r = q.r + fwd(s);
      if (r >= 0 && r < Fx.bd(g) && !g.board[r][q.c]) { Fx.relocate(g, q.r, q.c, r, q.c, {}); moved++; }
    }
    Fx.grantExtra(g, s, 1);
    const lines = moved ? ['Your vanguard advances on autopilot' + (moved > 1 ? ' — both units!' : '') + '.'] : ['Autopilot holds position.'];
    lines.push('Move again!');
    return lines;
  });

  def(390, 'Particle Beam', 2, 'SciFi', 'fire', 'Destroy the enemy piece directly in front of your most advanced minor piece (same file).', 'A clean surgical cut.', (g, s) => {
    const minors = own(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const m = minors[0];
    if (!m) return ['No minor piece to mount the beam on.'];
    const r = m.r + fwd(s);
    if (r < 0 || r >= Fx.bd(g)) return ['The beam fires into empty space.'];
    const cell = g.board[r] && g.board[r][m.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['No target in the beam\'s path.'];
    Fx.removeAt(g, r, m.c, {});
    return ['The particle beam cuts down the ' + MD.pieceName(cell.t) + '!'];
  });

  def(391, 'Overclock Reactor', 4, 'SciFi', 'fire', 'Destroy every enemy piece on your two most advanced pawn files, then shield all your pawns.', 'Critical mass. Containment: no.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    if (!pawns.length) return [];
    const files = [...new Set(pawns.slice(0, 2).map(q => q.c))];
    const gone = [];
    for (const q of en(g, s)) if (q.cell.t !== 'k' && files.includes(q.c)) { Fx.removeAt(g, q.r, q.c, {}); gone.push(q); }
    const lines = gone.length ? ['The reactor melts through ' + gone.length + ' enemy unit' + (gone.length > 1 ? 's' : '') + ' on the vanguard files!'] : ['The reactor vents harmlessly.'];
    const n = Fx.statusOn(g, own(g, s).filter(q => q.cell.t === 'p'), 's', 1, 'shield');
    if (n) lines.push('Your pawns are hardened.');
    return lines;
  });

  def(392, 'Ghost Protocol', 2, 'SciFi', 'void', 'Teleport your strongest piece to a random empty square and shield it — it becomes untargetable.', 'You never saw it.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!mine) return [];
    const d = rnd(Fx.emptySq(g));
    if (!d) return ['No shadow to step into.'];
    Fx.relocate(g, mine.r, mine.c, d.r, d.c, {});
    Fx.mod(g.board[d.r][d.c], 's', 1);
    return ['Your ' + MD.pieceName(mine.cell.t) + ' vanishes and reappears at ' + sn(d.r, d.c) + ', shielded.'];
  });

  def(393, 'Scrap Metal', 1, 'SciFi', 'spark', 'Revive a random captured friendly ROOK if you lost one, else summon a pawn.', 'Salvage everything.', (g, s) => {
    const lines = Fx.revive(g, s, 1, { type: 'r' });
    if (lines.length) return lines;
    return Fx.summonN(g, s, 'p', 1);
  });

  def(394, 'Ion Cannon', 3, 'SciFi', 'fire', 'Destroy the enemy piece with the HIGHEST value on the d and e files, then freeze one behind it.', 'Orbital fire on the center.', (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && (q.c === 3 || q.c === 4));
    if (!foes.length) return ['No enemy sits under the ion cannon.'];
    const t = foes.sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    Fx.removeAt(g, t.r, t.c, {});
    const r2 = t.r + (t.cell && t.cell.c === 'w' ? -1 : 1);
    if (r2 >= 0 && r2 < Fx.bd(g) && g.board[r2] && g.board[r2][t.c] && g.board[r2][t.c].c === O(s)) { Fx.mod(g.board[r2][t.c], 'f', 1); Fx.flash(g, r2, t.c, 'freeze', ''); }
    return ['The ion cannon vaporizes the center ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(395, 'Fabricator', 2, 'SciFi', 'spark', 'Upgrade two random friendly pawns into knights — assembly line!', 'Mass production, medieval style.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const picks = Fx.uniqN(pawns, 2);
    if (!picks.length) return [];
    const lines = [];
    for (const p of picks) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('A knight rolls off the line.'); }
    return lines;
  });

  def(396, 'Defense Grid', 4, 'SciFi', 'shield', 'Shield ALL of your pieces AND freeze every enemy piece in your half of the board.', 'The fortress wakes up.', (g, s) => {
    const lines = [];
    const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    if (n) lines.push('Your whole host is shielded.');
    const f = Fx.statusOn(g, en(g, s).filter(q => Fx.inOwnHalf(g, s, q.r)), 'f', 1, 'freeze');
    if (f) lines.push('Invaders in your sector are frozen.');
    return lines.length ? lines : ['The grid hums on an empty field.'];
  });

  def(397, 'Repair Drone', 1, 'SciFi', 'spark', 'Heal (unfreeze) one frozen friendly piece and shield it.', 'Patch and protect.', (g, s) => {
    const frozen = own(g, s).filter(q => q.cell.b && q.cell.b.f > 0);
    const t = frozen[0] || rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    if (t.cell.b) t.cell.b.f = 0;
    Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', '');
    return ['A repair drone patches and shields the ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(398, 'Crash Protocol', 3, 'SciFi', 'fire', 'Your strongest piece crashes down on the enemy: destroy the enemy adjacent to it with the highest value, then your piece is shielded.', 'High impact, high drama.', (g, s) => {
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!mine) return [];
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - mine.r) <= 1 && Math.abs(q.c - mine.c) <= 1).sort((a, b) => val(b.cell.t) - val(a.cell.t));
    const t = foes[0];
    if (!t) return ['No enemy within crash radius.'];
    Fx.removeAt(g, t.r, t.c, {});
    Fx.mod(mine.cell, 's', 1);
    return ['Your ' + MD.pieceName(mine.cell.t) + ' crashes into the ' + MD.pieceName(t.cell.t) + ' and holds its ground.'];
  });

  def(399, 'Trojan Pawn', 1, 'SciFi', 'spark', 'Summon a pawn inside enemy territory (their back four ranks).', 'It came in the crate.', (g, s) => {
    return Fx.summonN(g, s, 'p', 1, { rows: Fx.enemyHalfRows(g, s) });
  });

  def(400, 'Mech Pilot', 2, 'SciFi', 'spark', 'Swap your most advanced pawn with any of your knights or bishops, then upgrade that piece to a rook.', 'Everyone wants the heavy frame.', (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
    const minor = rnd(own(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    const p = pawns[0];
    if (!p || !minor) return ['No pilot and mech pair found.'];
    Fx.swapSq(g, p, minor);
    minor.cell.t = 'r'; Fx.flash(g, minor.r, minor.c, 'transform', '');
    return ['A knight/bishop hops in and the pawn takes the mech — now a Rook!'];
  });

  def(401, 'Blackout', 2, 'SciFi', 'bolt', 'Freeze every enemy queen, rook and bishop — the lights go out for their heavy hitters.', 'Power down.', (g, s) => {
    const targets = en(g, s).filter(q => (q.cell.t === 'q' || q.cell.t === 'r' || q.cell.t === 'b'));
    const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
    return n ? ['Blackout! ' + n + ' heavy unit' + (n > 1 ? 's are' : ' is') + ' frozen in the dark.'] : ['No heavy units to black out.'];
  });

  def(402, 'Assembly Line', 3, 'SciFi', 'spark', 'Summon TWO friendly Rooks on empty squares of your back two ranks.', 'They come off the line two at a time.', (g, s) => Fx.summonN(g, s, 'r', 2, { rows: Fx.backRows(g, s) }));

  def(403, 'Warp Core Leak', 4, 'SciFi', 'void', 'Every enemy piece slides one square toward the CENTER files, and the center square they land on detonates.', 'Do not stand near the engine.', (g, s) => {
    const n = g.n || 8;
    const h = n >> 1;
    let moved = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
      const nc = c < h ? c + 1 : c - 1;
      if (nc !== c && !g.board[r][nc]) { Fx.relocate(g, r, c, r, nc, {}); moved++; }
    }
    let gone = 0;
    for (let r = h - 1; r <= h; r++) for (let c = h - 1; c <= h; c++) {
      const cell = g.board[r] && g.board[r][c];
      if (cell && cell.t !== 'k' && cell.c === O(s)) { Fx.removeAt(g, r, c, {}); gone++; }
    }
    const lines = [];
    if (moved) lines.push('Enemy units are dragged to the core.');
    if (gone) lines.push('The leak annihilates ' + gone + ' overloaded unit' + (gone > 1 ? 's' : '') + '!');
    return lines.length ? lines : ['The core holds.'];
  });

  def(404, 'Optical Camo', 2, 'SciFi', 'void', 'Teleport a random friendly piece to any empty square and give it a shield, then freeze the enemy nearest to it.', 'Invisible, then devastating.', (g, s) => {
    const t = rnd(own(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    const d = rnd(Fx.emptySq(g));
    if (!d) return [];
    Fx.relocate(g, t.r, t.c, d.r, d.c, {});
    Fx.mod(g.board[d.r][d.c], 's', 1);
    const foes = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - d.r) <= 1 && Math.abs(q.c - d.c) <= 1);
    const v = rnd(foes);
    if (v) { Fx.mod(v.cell, 'f', 1); Fx.flash(g, v.r, v.c, 'freeze', ''); return ['Your ' + MD.pieceName(t.cell.t) + ' appears at ' + sn(d.r, d.c) + ' and startles an enemy into freezing!']; }
    return ['Your ' + MD.pieceName(t.cell.t) + ' appears at ' + sn(d.r, d.c) + ', hidden in plain sight.'];
  });

  def(405, 'Failsafe', 4, 'SciFi', 'clock', 'If any of your pieces are frozen or poisoned, purge them all — and take an extra move. Otherwise shield your king.', 'It never hurts to have a button.', (g, s) => {
    const cursed = own(g, s).filter(q => q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0));
    if (cursed.length) {
      for (const q of cursed) { q.cell.b.f = 0; q.cell.b.p = 0; if (q.cell.b.s <= 0) q.cell.b = undefined; }
      Fx.grantExtra(g, s, 1);
      return ['The failsafe purges ' + cursed.length + ' glitch' + (cursed.length > 1 ? 'es' : '') + ' — move again!'];
    }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); return ['No glitches — the failsafe wards your king instead.']; }
    return [];
  });

  def(406, 'Apex Machine', 4, 'SciFi', 'spark', 'Summon a Golem mech AND a Griffon fighter on empty squares, and shield every friendly pawn.', 'The machine age arrives.', (g, s) => {
    const lines = Fx.summonN(g, s, 'golem', 1);
    lines.push(...Fx.summonN(g, s, 'griffon', 1));
    const n = Fx.statusOn(g, own(g, s).filter(q => q.cell.t === 'p'), 's', 1, 'shield');
    if (n) lines.push('The infantry is hardened.');
    return lines.length ? lines : ['The factory floor is full.'];
  });

  MD.AB_9 = A;
})();

/* ============================================================
   Mod Chess — Ability set 12: JUJUTSU KAISEN (咒术回战)  IDs 507-556
   Signature ideas:
     • Shikigami & curse summons (Divine Dog / Nue / Mahoraga) — new troops.
     • BINDING VOWS — powerful effects that cost you your own vanguard.
     • CURSED ENERGY HAZARDS — poison domains laid as terrain traps.
     • REVERSED techniques heal; sealing = freezing; curses are contagious.
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
  // a binding vow: sacrifice the caster's most advanced pawn
  const vow = (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return null;
    kill(g, p);
    return p;
  };
  const summon = (g, s, t, n, rows) => Fx.summonN(g, s, t, n, rows ? { rows } : {});
  const nearFoeOf = (g, q) => foes(g, q.cell.c).filter(f => Math.abs(f.r - q.r) <= 1 && Math.abs(f.c - q.c) <= 1);
  const A = [];
  const def = (id, name, rarity, icon, desc, flavor, run) => A.push({ id, name, rarity, cat: 'Jujutsu', icon, desc, flavor, target: 'auto', run });

  def(507, 'Divine Dog', 1, 'paw', 'Summon a Divine Dog shikigami — it hunts: freeze one random enemy beside where it lands.', 'Cursed wolf, born to chase.', (g, s) => {
    const lines = summon(g, s, 'divinedog', 1);
    const dg = own(g, s).filter(q => q.cell.t === 'divinedog').slice(-1)[0];
    if (dg) { const t = rnd(nearFoeOf(g, dg)); if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('The Divine Dog pins a foe down.'); } }
    return lines.length ? lines : ['No room for the shikigami.'];
  });

  def(508, 'Nue', 3, 'storm', 'Summon Nue, the thunder-bird — it coils lightning: poison one random enemy on its landing rank.', 'Its wings crackle with a curse\'s grief.', (g, s) => {
    const lines = summon(g, s, 'nue', 1);
    const nu = own(g, s).filter(q => q.cell.t === 'nue').slice(-1)[0];
    if (nu) { const t = rnd(foes(g, s).filter(q => q.r === nu.r)); if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('Nue\'s discharge poisons an enemy.'); } }
    return lines.length ? lines : ['The sky refuses Nue.'];
  });

  def(509, 'Mahoraga', 4, 'target', 'The Divine General adapts to anything: summon Mahoraga, then destroy the enemy piece that is CURRENTLY strongest.', 'The wheel turns; the curse adapts.', (g, s) => {
    const lines = summon(g, s, 'mahoraga', 1);
    const t = strong(g, s);
    if (t) { kill(g, t); lines.push('The wheel of retribution crushes the enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines.length ? lines : ['Mahoraga finds no arena.'];
  });

  def(510, 'Binding Vow: Recoil', 3, 'scale', 'Sacrifice your most advanced pawn, then poison EVERY enemy piece on that pawn\'s old file.', 'A contract sealed in flesh.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return ['The vow requires a vanguard.'];
    const file = p.c;
    kill(g, p);
    const t = foes(g, s).filter(q => q.c === file);
    const n = Fx.statusOn(g, t, 'p', 1, 'poison');
    return ['You sever your vanguard — ' + n + ' enemy on file ' + 'abcdefghijkl'[file] + ' is poisoned.'];
  });

  def(511, 'Binding Vow: Surge', 3, 'clock', 'Sacrifice your most advanced pawn to seize an EXTRA move — and your next piece to move gains a shield.', 'Strength bought with a heartbeat.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return ['The vow has no anchor.'];
    kill(g, p);
    Fx.grantExtra(g, s, 1);
    const q = adv(g, s)[0];
    if (q) { Fx.mod(q.cell, 's', 1); Fx.flash(g, q.r, q.c, 'shield', ''); }
    return ['The vow burns a pawn — an extra move is yours, and your vanguard is warded.'];
  });

  def(512, 'Black Flash Chain', 2, 'storm', 'A distortion lands twice: destroy a random enemy minor piece; if it had a neighbor, destroy that neighbor too.', 'Where space bends, it keeps bending.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (!t) return ['The Flash misses.'];
    kill(g, t);
    const lines = ['Black Flash erases an enemy ' + MD.pieceName(t.cell.t) + '.'];
    const near = foes(g, s).find(q => Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    if (near) { kill(g, near); lines.push('The distortion carries to its neighbor.'); }
    return lines;
  });

  def(513, 'Hollow Technique: Purple', 4, 'void', 'Imaginary mass erases a LINE: destroy every enemy piece on the file or rank through your most advanced piece.', 'Void meets the world at a point.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return ['Nothing to anchor the void.'];
    const lines = [];
    const targets = foes(g, s).filter(q => q.r === p.r || q.c === p.c);
    for (const t of targets) { kill(g, t); lines.push('Purple unmakes an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines.length ? lines : ['The beam passes through empty space.'];
  });

  def(514, 'Domain: Malevolent Shrine', 4, 'net', 'Open a sure-hit domain: carve a 3×3 cursed ground around the enemy king (any piece that steps into those squares is poisoned) and FREEZE the strongest enemy standing inside it.', 'Within the shrine, there is no escape.', (g, s) => {
    const k = E.findKing(g, O(s));
    if (!k) return ['The domain opens on emptiness.'];
    const lines = [];
    const n = Fx.layHazardZone(g, k.r, k.c, 'poison', { ring: true, name: 'cursed shrine ground' });
    if (n) lines.push('Cursed ground seeps across ' + n + ' square' + (n > 1 ? 's' : '') + ' around the king.');
    const inside = foes(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const star = inside.sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (star) { Fx.mod(star.cell, 'f', 1); Fx.flash(g, star.r, star.c, 'freeze', ''); lines.push('Cleave seals the ' + MD.pieceName(star.cell.t) + ' beside the king.'); }
    return lines.length ? lines : ['The shrine finds no ground to corrupt.'];
  });

  def(515, 'Domain: Coffin of the Iron Mountain', 3, 'lock', 'Molten iron seals the STRONGEST enemy in a coffin — it is PETRIFIED: it cannot move or be captured for two of its own turns (and a lesser foe is poisoned).', 'Iron, then silence.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['The coffin stays empty.'];
    Fx.mod(t.cell, 'st', 2); Fx.flash(g, t.r, t.c, 'freeze', '');
    const lines = ['The strongest enemy is sealed in an iron coffin (petrified for two turns).'];
    const u = weak(g, s);
    if (u && u !== t) { Fx.mod(u.cell, 'p', 1); Fx.flash(g, u.r, u.c, 'poison', ''); lines.push('A lesser foe is poisoned by the molten slag.'); }
    return lines;
  });

  def(516, 'Reversed Curse: Heal', 2, 'heart', 'Positive energy flows: cleanse every friendly piece AND resurrect your most recently fallen ally.', 'To reverse a curse is to heal.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = n ? ['Reverse energy cleanses ' + n + ' of your pieces.'] : [];
    const r = Fx.revive(g, s, 1);
    if (r.length) lines.push(...r);
    return lines.length ? lines : ['The healing has nothing to mend.'];
  });

  def(517, 'Reversed Curse: Red', 3, 'storm', 'Positive and negative collide: cleanse your army, then detonate one random enemy piece (destroy it).', 'Two halves of the same power.', (g, s) => {
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; }
    const t = rnd(foes(g, s));
    if (!t) return ['Red finds no enemy to repel.'];
    kill(g, t);
    return ['Your army is cleansed, and Red detonates an enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(518, 'Cursed Energy Overflow', 1, 'spark', 'Raw cursed energy floods forward: your most advanced pawn surges a step and is shielded.', 'Power with nowhere to go.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const nr = p.r + (s === 'w' ? -1 : 1);
    if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); }
    const r2 = g.board[nr >= 0 && nr < Fx.bd(g) ? nr : p.r][p.c];
    Fx.mod(r2, 's', 1); Fx.flash(g, nr >= 0 && nr < Fx.bd(g) ? nr : p.r, p.c, 'shield', '');
    return ['Cursed energy pushes your vanguard and wraps it in a ward.'];
  });

  def(519, 'Idle Transfiguration', 3, 'rune', 'Reshape souls en masse: up to FOUR random enemy PAWNs become pawns of YOURS.', 'The shape of a soul is a suggestion.', (g, s) => {
    const ps = en(g, s).filter(q => q.cell.t === 'p').sort(() => Math.random() - 0.5).slice(0, 4);
    if (!ps.length) return ['No souls to transfigure.'];
    const lines = [];
    for (const p of ps) { p.cell.c = s; Fx.flash(g, p.r, p.c, 'move', ''); lines.push('An enemy pawn is transfigured to your cause.'); }
    Fx.clearEp(g);
    return lines;
  });

  def(520, 'Cursed Womb', 2, 'portal', 'A half-curse is born: summon a Spriggan — it regenerates and, when killed, splits into two pawns.', 'A scream given a body.', (g, s) => summon(g, s, 'spriggan', 1));

  def(521, 'Six Eyes', 2, 'eye', 'See every thread of fate: shield your king, then FREEZE the enemy piece that moved last.', 'Nothing is hidden from those eyes.', (g, s) => {
    const k = E.findKing(g, s);
    const lines = [];
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is guarded.'); }
    const last = g.hist[g.hist.length - 1];
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.mod(cell, 'f', 1); Fx.flash(g, last.to.r, last.to.c, 'freeze', ''); lines.push('The last mover is read and frozen.'); }
    }
    return lines.length ? lines : ['The Six Eyes see nothing worth sealing.'];
  });

  def(522, 'Limitless', 4, 'shield', 'Infinity itself: shield EVERY friendly piece, and reflect — any enemy that was shielded LOSES their shield.', 'The infinite is a wall that moves with you.', (g, s) => {
    const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    const lines = n ? ['Infinity wraps your whole army (' + n + ').'] : [];
    let stripped = 0;
    for (const q of foes(g, s)) if (q.cell.b && q.cell.b.s > 0) { q.cell.b.s = 0; stripped++; }
    if (stripped) lines.push('Their shields are pulled into the void.');
    return lines.length ? lines : ['Infinity stands alone.'];
  });

  def(523, 'Prison Realm', 4, 'lock', 'The box that holds the unsealable: FREEZE the enemy king\'s position — every enemy piece adjacent to the king is sealed with him.', 'A thousand years, then a second.', (g, s) => {
    const k = E.findKing(g, O(s));
    if (!k) return [];
    const guard = foes(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, guard, 'f', 1, 'freeze');
    const lines = n ? ['The royal guard is sealed beside the king (' + n + ').'] : ['The king stands alone — the box snaps shut on nothing.'];
    if (!guard.length) lines[0] = 'The Prison Realm finds no guard to seal with the king.';
    return lines;
  });

  def(524, 'Curse Contagion', 2, 'skull', 'Curses spread like rot: poison the enemy\'s strongest piece — then poison any enemy piece ADJACENT to it.', 'A curse, once caught, is never alone.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['Nothing to infect.'];
    const lines = [];
    Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    lines.push('The ' + MD.pieceName(t.cell.t) + ' is infected.');
    const near = foes(g, s).filter(q => q !== t && Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    const u = rnd(near);
    if (u) { Fx.mod(u.cell, 'p', 1); Fx.flash(g, u.r, u.c, 'poison', ''); lines.push('The curse spreads to a neighbor.'); }
    return lines;
  });

  def(525, 'Sukuna\'s Fingers', 3, 'rune', 'Swallow the King of Curses\' power: upgrade your most advanced pawn to a QUEEN — but an enemy pawn is also corrupted into a powerful pawn (advance it).', 'More fingers, more hunger.', (g, s) => {
    const p = advP(g, s)[0];
    const lines = [];
    if (p) { p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('Your vanguard is crowned by cursed flesh.'); }
    const ep = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (ep) {
      const nr = ep.r + (s === 'w' ? 1 : -1);
      if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][ep.c]) { Fx.relocate(g, ep.r, ep.c, nr, ep.c, {}); lines.push('An enemy pawn is twisted and driven forward.'); }
    }
    return lines.length ? lines : ['The fingers hunger for a host.'];
  });

  def(526, 'Shadow Pool', 2, 'void', 'Draw from the shadow: summon TWO Divine Dogs behind enemy lines.', 'The shadows remember every shikigami.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2] : [5, 6, 7];
    const lines = [];
    for (let i = 0; i < 2; i++) lines.push(...summon(g, s, 'divinedog', 1, rows));
    return lines.length ? lines : ['The shadow pool is dry.'];
  });

  def(527, 'Cursed Speech', 3, 'wind', '"Run." A command with no escape: every enemy piece on the same RANK as your most advanced piece is pushed two squares back.', 'Words can be weapons.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    const dir = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const q of foes(g, s).filter(x => x.r === p.r).sort((a, b) => (dir < 0 ? a.c - b.c : b.c - a.c))) {
      let nr = q.r + dir, nc = q.c;
      if (nr < 0 || nr >= Fx.bd(g) || g.board[nr][nc]) continue;
      Fx.relocate(g, q.r, q.c, nr, nc, {}); moved++;
    }
    return moved ? ['Cursed speech hurls ' + moved + ' enemy' + (moved > 1 ? 's' : '') + ' back.'] : ['The command is swallowed.'];
  });

  def(528, 'Ten Shadows: Full Summon', 4, 'paw', 'The whole menagerie answers: summon a Divine Dog, a Nue, and Mahoraga on empty squares.', 'Ten shadows, one master.', (g, s) => {
    const lines = [];
    lines.push(...summon(g, s, 'divinedog', 1));
    lines.push(...summon(g, s, 'nue', 1));
    lines.push(...summon(g, s, 'mahoraga', 1));
    return lines.length ? lines : ['The shadows will not part.'];
  });

  def(529, 'Vengeful Wail', 2, 'skull', 'A grudge screams across the board: freeze up to TWO enemy pieces that stand adjacent to each other.', 'Grief does not forgive.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['The wail echoes off empty walls.'];
    const lines = [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    lines.push('The strongest foe is frozen by the wail.');
    const near = foes(g, s).find(q => q !== t && Math.abs(q.r - t.r) + Math.abs(q.c - t.c) === 1);
    if (near) { Fx.mod(near.cell, 'f', 1); Fx.flash(g, near.r, near.c, 'freeze', ''); lines.push('A neighbor is caught in the scream.'); }
    return lines;
  });

  def(530, 'Curse of Attraction', 1, 'eye', 'Draw them close: relocate the enemy\'s WEAKEST piece to an empty square right beside your king — where it is trapped.', 'Come closer. Just a little more.', (g, s) => {
    const t = weak(g, s);
    const k = E.findKing(g, s);
    if (!t || !k) return [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) near.push({ r, c });
    }
    const q = rnd(near);
    if (!q) return ['No room to lure it.'];
    Fx.relocate(g, t.r, t.c, q.r, q.c, {});
    return ['The weak enemy ' + MD.pieceName(t.cell.t) + ' is lured into the lion\'s den.'];
  });

  def(531, 'Simple Domain', 1, 'shield', 'A tiny refuge: cleanse the four pieces beside your king and shield the king.', 'The least of domains, yet a wall.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let n = 0;
    for (const q of own(g, s)) if (Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1 && q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    Fx.mod(g.board[k.r][k.c], 's', 1);
    return ['A simple domain shelters the king' + (n ? ', cleansing ' + n : '') + '.'];
  });

  def(532, 'Inverted Spear of Heaven', 2, 'sword', 'A blade that nullifies sorcery: downgrade the enemy\'s strongest piece TWO tiers (queen→bishop, rook→knight…).', 'It cuts the divine from the divine.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    const map = { q: 'b', r: 'n', b: 'p', n: 'p' };
    const to = map[t.cell.t];
    if (!to) return ['The spear finds nothing enchanted.'];
    t.cell.t = to; Fx.flash(g, t.r, t.c, 'transform', '');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is stripped by the spear of heaven.'];
  });

  def(533, 'Domain Expansion: Self-Embodiment', 3, 'net', 'Your domain warps space around you: swap your king with the enemy\'s most advanced piece — they trade places.', 'In my domain, geometry obeys me.', (g, s) => {
    const k = E.findKing(g, s);
    const t = foes(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r))[0];
    if (!k || !t) return [];
    Fx.swapSq(g, { r: k.r, c: k.c }, { r: t.r, c: t.c });
    return ['Your domain bends — the enemy vanguard and your king trade places!'];
  });

  def(534, 'Flash Step', 2, 'wind', 'Blink like a black flash: teleport your most advanced piece to any empty square, then it gains a shield.', 'There, then here, then gone.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    const q = rnd(Fx.emptySq(g));
    if (!q) return ['No space to blink into.'];
    Fx.relocate(g, p.r, p.c, q.r, q.c, {});
    Fx.mod(g.board[q.r][q.c], 's', 1); Fx.flash(g, q.r, q.c, 'shield', '');
    return ['Your piece flashes to ' + sn(q.r, q.c) + ', warded.'];
  });

  def(535, 'Poisoned Domain', 2, 'skull', 'Lay a cursed bog: turn THREE random empty squares in the enemy\'s half into poison HAZARDS (any piece stepping there is poisoned).', 'The ground itself is cursed.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const n = Fx.layHazards(g, 'poison', 3, { rows, name: 'cursed bog' });
    return n ? ['A cursed bog seeps across ' + n + ' empty square' + (n > 1 ? 's' : '') + '.'] : ['The ground refuses the curse.'];
  });

  def(536, 'Six Eyes: Domain Reading', 2, 'eye', 'Read the domain: if the enemy\'s strongest piece is shielded or frozen, its power is copied — shield & freeze YOUR strongest piece the same way.', 'Understanding is half the victory.', (g, s) => {
    const t = strong(g, s);
    const mine = adv(g, s)[0];
    if (!t || !mine) return [];
    const b = t.cell.b || {};
    const lines = [];
    if (b.s > 0) { Fx.mod(mine.cell, 's', 1); lines.push('You mirror their shield.'); }
    if (b.f > 0) { Fx.mod(mine.cell, 'f', 1); lines.push('You reflect their binding back at them — no, at yourself? Your vanguard is bound too.'); }
    if (!lines.length) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('No technique to copy — so you freeze theirs.'); }
    return lines;
  });

  def(537, 'Yuji\'s Divergent Fist', 2, 'target', 'A second impact follows the first: destroy a random enemy pawn; if it had been shielded, destroy another.', 'The first blow is a decoy.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The fist finds nothing to strike.'];
    const hadShield = !!(t.cell.b && t.cell.b.s > 0);
    kill(g, t);
    const lines = ['A divergent fist demolishes an enemy pawn.'];
    if (hadShield) {
      const u = rnd(foes(g, s));
      if (u) { kill(g, u); lines.push('The second impact shatters a shielded foe entirely.'); }
    }
    return lines;
  });

  def(538, 'Mimicry', 3, 'swap', 'Copy the last enemy spell you SAW cast — if they froze you, you freeze them back twice over (freeze two of their pieces).', 'Every technique can be learned.', (g, s) => {
    // generic "copy your own army's current misfortune back at them"
    let frozen = 0;
    for (const q of own(g, s)) if (q.cell.b && q.cell.b.f > 0) frozen++;
    const lines = [];
    const n = Fx.freezeN(g, s, frozen > 0 ? 2 : 1);
    if (n) lines.push(frozen ? 'Your own bindings are returned tenfold — ' + n + ' enemy frozen.' : 'You turn the technique outward — ' + n + ' enemy frozen.');
    return lines.length ? lines : ['Nothing to imitate.'];
  });

  def(539, 'Star Rage', 3, 'fire', 'A black hole in a fist: destroy a random enemy piece worth a rook or more, then FREEZE the piece that was nearest to it.', 'The mass of dying stars.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) return ['Star Rage needs a planet to crush.'];
    const lines = [];
    kill(g, t);
    lines.push('Star Rage annihilates an enemy ' + MD.pieceName(t.cell.t) + '.');
    let near = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - t.r) + Math.abs(q.c - t.c); if (d < bd) { bd = d; near = q; } }
    if (near) { Fx.mod(near.cell, 'f', 1); Fx.flash(g, near.r, near.c, 'freeze', ''); lines.push('The shockwave freezes its neighbor.'); }
    return lines;
  });

  def(540, 'Transfigured Human', 2, 'rune', 'Twist one into a puppet: transform a random enemy MINOR piece into a pawn — but it stays theirs, weaker and sadder.', 'Humanity is a costume.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (!t) return ['No flesh to reshape.'];
    t.cell.t = 'p'; Fx.flash(g, t.r, t.c, 'transform', '');
    return ['An enemy ' + MD.pieceName('p') + ' is all that remains of their ' + MD.pieceName('n') + '.'];
  });

  def(541, 'Cursed Tool: Playful Cloud', 2, 'sword', 'A staff that never misses: destroy a random enemy piece worth a rook or more — if none, destroy a random pawn.', 'Weight, then truth.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['Playful Cloud has no one to strike.'];
    kill(g, t);
    return ['Playful Cloud cracks the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(542, 'Curse Manipulation', 4, 'swap', 'Uzumaki — swallow curses whole: STEAL every enemy TROOP (summoned creature) on the board. They now fight for you.', 'All curses belong to the king of curses.', (g, s) => {
    const tps = foes(g, s).filter(q => E.isTroop(q.cell.t));
    if (!tps.length) return ['There are no curses to claim.'];
    const lines = [];
    for (const t of tps) { t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); lines.push('You claim an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    Fx.clearEp(g);
    return lines;
  });

  def(543, 'Nobara\'s Resonance', 3, 'skull', 'Strike the doll, wound the wielder: poison the enemy\'s strongest piece AND the enemy standing on the same file as it.', 'A straw doll, a hammer, a scream.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    const lines = [];
    Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    lines.push('The strongest is poisoned.');
    const same = foes(g, s).find(q => q.c === t.c && q !== t);
    if (same) { Fx.mod(same.cell, 'p', 1); Fx.flash(g, same.r, same.c, 'poison', ''); lines.push('Its file-mate resonates and is poisoned too.'); }
    return lines;
  });

  def(544, 'Barrier: Veil', 2, 'shield', 'Weave a veil around your king\'s file: shield every friendly piece on your king\'s file and rank.', 'The veil keeps the weak safe.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const guard = own(g, s).filter(q => q.r === k.r || q.c === k.c);
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    return n ? ['A veil wards ' + n + ' of your defenders around the king.'] : ['The veil wraps an empty court.'];
  });

  def(545, 'Grudge Bearer', 3, 'skull', 'Your fallen demand payment: revive your strongest fallen piece — if none have fallen, freeze the enemy\'s strongest instead.', 'The dead are patient.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    const t = strong(g, s);
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); return ['No dead to raise — the grudge freezes the strongest foe instead.']; }
    return ['Even the grudge finds nothing.'];
  });

  def(546, 'Kashimo\'s Mythical Beast', 4, 'storm', 'A body of pure lightning: take an EXTRA move; if you are in check, instead destroy the checking piece.', 'The past, perfected.', (g, s) => {
    if (E.inCheck(g, s)) {
      const chk = MD.Fx.checkers(g, s);
      if (chk.length) { kill(g, chk[0]); return ['Lightning meets the check — the attacker is vaporized!']; }
    }
    Fx.grantExtra(g, s, 1);
    return ['Your body becomes lightning — an extra move is yours.'];
  });

  def(547, 'Mei Mei\'s Crow Storm', 2, 'target', 'A thousand crows, one target: destroy a random enemy minor piece; each of YOUR pawns on the board has a 25% chance to caw (nothing more, it\'s theater).', 'Black wings, blacker deals.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (!t) return ['The crows circle without diving.'];
    kill(g, t);
    return ['The crows tear apart an enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(548, 'Nanami\'s Overtime', 3, 'target', '7:3 ratio, delivered: destroy the enemy\'s strongest piece — but only if it is worth a rook or less. If it is stronger, freeze it instead.', 'Work is a kind of sorcery.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['Overtime with nothing to do.'];
    if (val(t.cell.t) <= 500) { kill(g, t); return ['The ratio strikes — the enemy ' + MD.pieceName(t.cell.t) + ' is cut down.']; }
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['Too strong to cut — the ratio pins it in place instead.'];
  });

  def(549, 'Toji\'s Heavenly Restriction', 2, 'scale', 'No cursed energy, all body: your most advanced piece is upgraded to a Samurai AND cannot be frozen this game (until it moves).', 'Talent is a curse; this is freedom.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    p.cell.t = 'samurai'; Fx.flash(g, p.r, p.c, 'transform', '');
    if (p.cell.b) p.cell.b.f = 0;
    return ['Your vanguard becomes a Samurai, untouchable by curses.'];
  });

  def(550, 'Hakari\'s Jackpot', 3, 'dice', 'The pachinko spins: JACKPOT — take an extra move AND cleanse your army. Otherwise, a consolation: freeze a random foe.', 'BANG. BANG. BANG.', (g, s) => {
    if (Math.random() < 0.5) {
      Fx.grantExtra(g, s, 1);
      let n = 0;
      for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
      return ['JACKPOT! An extra move' + (n ? ' and ' + n + ' pieces healed' : '') + '!'];
    }
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); return ['Consolation — a random foe is frozen solid.']; }
    return ['The machine eats your coin.'];
  });

  def(551, 'The Disaster Curses', 4, 'drop', 'Volcano, Forest, Ocean — nature\'s fury given grudge: destroy a random enemy rook, freeze a random enemy piece, and poison another.', 'The earth remembers every wrong.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (t) { kill(g, t); lines.push('Jogo\'s fire melts an enemy rook.'); }
    const u = rnd(foes(g, s).filter(q => q !== t));
    if (u) { Fx.mod(u.cell, 'f', 1); Fx.flash(g, u.r, u.c, 'freeze', ''); lines.push('Hanami\'s roots freeze a foe.'); }
    const v = rnd(foes(g, s).filter(q => q !== t && q !== u));
    if (v) { Fx.mod(v.cell, 'p', 1); Fx.flash(g, v.r, v.c, 'poison', ''); lines.push('Dagon\'s tide poisons another.'); }
    return lines.length ? lines : ['The disasters sleep.'];
  });

  def(552, 'Exorcist\'s Blade', 2, 'sword', 'A blessed sword cuts through the unreal: destroy a random enemy TROOP; if none, destroy a random enemy minor piece.', 'Purge the unclean with steel and prayer.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => E.isTroop(q.cell.t)));
    if (!t) t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (!t) return ['The blade finds no spirit to cut.'];
    kill(g, t);
    return ['The exorcist\'s blade severs the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(553, 'Satoru\'s Reversal: Blue', 3, 'void', 'Pull the world toward you: relocate EVERY enemy piece one square toward your king — a vortex of impossible force.', 'Attraction, made absolute.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let moved = 0;
    const order = foes(g, s).slice().sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)));
    for (const q of order) {
      if (!g.board[q.r][q.c]) continue;
      const dr = Math.sign(k.r - q.r), dc = Math.sign(k.c - q.c);
      const nr = q.r + dr, nc = q.c + dc;
      if (nr >= 0 && nr < Fx.bd(g) && nc >= 0 && nc < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, q.r, q.c, nr, nc, {}); moved++; }
    }
    return moved ? ['Blue pulls ' + moved + ' enemy' + (moved > 1 ? 's' : '') + ' toward your king.'] : ['The vortex finds no prey to drag.'];
  });

  def(554, 'Cursed Seed', 1, 'leaf', 'Plant a seed of cursed energy: your most advanced pawn is shielded and poisons the next enemy it captures (mark it — no, simply shield it).', 'Small roots, deep grudges.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    return ['Your vanguard is seeded with a ward.'];
  });

  def(555, 'Shikigami Hunt', 3, 'paw', 'The pack is released: summon TWO Divine Dogs behind enemy lines, and freeze one random enemy piece.', 'Let the dogs hunt.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2] : [5, 6, 7];
    const lines = [];
    lines.push(...summon(g, s, 'divinedog', 2, rows));
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('A foe is caught and frozen.'); }
    return lines.length ? lines : ['The dogs find no ground.'];
  });

  def(556, 'Special Grade', 4, 'crown', 'The strongest of a generation steps forward: summon Mahoraga AND take an extra move.', 'Special grade: do not approach.', (g, s) => {
    const lines = summon(g, s, 'mahoraga', 1);
    Fx.grantExtra(g, s, 1);
    lines.push('You move again while Mahoraga adapts.');
    return lines.length ? lines : ['Even the special grade waits for room.'];
  });

  MD.AB_12 = A;
})();

/* ============================================================
   Mod Chess — Ability set 12: JUJUTSU KAISEN (咒术回战)
   IDs 507-556. Cursed energy, domains, exorcists, shikigami,
   and the special grades. Every card is 'auto' target, has a
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
  const kill = (g, q, lines, what) => { Fx.removeAt(g, q.r, q.c, {}); lines.push(what || 'destroyed'); };
  const summon = (g, s, type, n, rows) => Fx.summonN(g, s, type, n, rows ? { rows } : {});
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  def(507, 'Cursed Energy Overflow', 1, 'Jujutsu', 'storm', 'Cursed energy floods your front line: your most advanced pawn surges forward one step and gains a shield.', 'Power with nowhere to go.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const nr = p.r + (s === 'w' ? -1 : 1);
    const lines = [];
    if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('Your vanguard lurches forward.'); }
    Fx.mod(g.board[nr >= 0 && nr < 8 ? nr : p.r][p.c], 's', 1);
    Fx.flash(g, nr >= 0 && nr < 8 ? nr : p.r, p.c, 'shield', '');
    lines.push('Cursed energy wards the vanguard.');
    return lines;
  });

  def(508, 'Black Flash', 2, 'Jujutsu', 'storm', 'A distortion of space — destroy a random enemy minor piece (knight or bishop).', 'The impossible critical hit.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (!t) return ['You cannot land the Flash — no minor piece in reach.'];
    kill(g, t, [], 'Black Flash annihilates the enemy ' + MD.pieceName(t.cell.t) + '!');
    return ['Black Flash annihilates the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(509, 'Hollow Purple', 4, 'Jujutsu', 'void', 'Imaginary mass: destroy the enemy\'s most valuable piece AND the piece beside it.', 'Void meets void.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['Hollow Purple finds nothing to erase.'];
    const lines = [];
    kill(g, t, lines, 'The strongest enemy ' + MD.pieceName(t.cell.t) + ' is erased.');
    const near = foes(g, s).filter(q => Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1 && q.cell !== t.cell)[0];
    if (near) kill(g, near, lines, 'The blast swallows a neighbor too.');
    return lines;
  });

  def(510, 'Domain Expansion: Malevolent Shrine', 4, 'Jujutsu', 'net', 'A sure-hit domain — freeze every enemy standing in the two central files, then destroy the strongest one among them.', 'Within the shrine, none escape.', (g, s) => {
    const trapped = foes(g, s).filter(q => q.c === 3 || q.c === 4);
    const lines = [];
    if (!trapped.length) return ['Your domain opens on empty space.'];
    const n = Fx.statusOn(g, trapped, 'f', 1, 'freeze');
    if (n) lines.push('The domain freezes ' + n + ' invader' + (n > 1 ? 's' : '') + ' in the kill zone.');
    const star = trapped.sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (star) kill(g, star, lines, 'Cleave dismantles the ' + MD.pieceName(star.cell.t) + '.');
    return lines;
  });

  def(511, 'Vengeful Curse Unleashed', 3, 'Jujutsu', 'void', 'Release a grudge: summon a Lich and a Banshee on empty squares — spirits of those who died wronged.', 'They come for their due.', (g, s) => {
    const lines = [];
    lines.push(...summon(g, s, 'lich', 1));
    lines.push(...summon(g, s, 'banshee', 1));
    return lines.length ? lines : ['No ground for the spirits to rise through.'];
  });

  def(512, 'Cursed Womb', 2, 'Jujutsu', 'portal', 'A transfigured half-human hatches: summon a Spriggan (it regenerates and never fully dies).', 'A scream given shape.', (g, s) => summon(g, s, 'spriggan', 1));

  def(513, 'Idle Transfiguration', 3, 'Jujutsu', 'rune', 'Reshape an enemy pawn\'s soul — one random enemy PAWN becomes YOUR pawn.', 'The shape of the soul is a suggestion.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['No pawn to transfigure.'];
    t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
    return ['An enemy pawn is transfigured to fight for you!'];
  });

  def(514, 'Reversed Cursed Technique', 2, 'Jujutsu', 'heart', 'Positive energy heals: remove freeze & poison from all your pieces and shield your most advanced pawn.', 'To reverse a curse is to bless.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; if (!(q.cell.b.s > 0) && !(q.cell.b.z > 0) && !(q.cell.b.mature > 0)) q.cell.b = undefined; n++; }
    const lines = [];
    if (n) lines.push('Reverse energy cleanses ' + n + ' of your piece' + (n > 1 ? 's' : '') + '.');
    const p = advPawns(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); lines.push('Your vanguard is blessed.'); }
    return lines.length ? lines : ['The technique finds no wound to heal.'];
  });

  def(515, 'Cursed Energy Burst', 1, 'Jujutsu', 'storm', 'A raw blast: poison a random enemy piece and push it one square back.', 'Force and foul intent.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return [];
    Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    const dir = s === 'w' ? -1 : 1;
    const nr = t.r + dir;
    if (nr >= 0 && nr < 8 && !g.board[nr][t.c]) Fx.relocate(g, t.r, t.c, nr, t.c, {});
    return ['Cursed energy surges through an enemy ' + MD.pieceName(t.cell.t) + ', poisoning it.'];
  });

  def(516, 'Six Eyes', 2, 'Jujutsu', 'eye', 'Limitless perception: shield your king, then freeze the enemy piece closest to it.', 'Nothing is hidden.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', '');
    let best = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); return ['Your king is guarded and the nearest threat is read and frozen.']; }
    return ['Your king is guarded.'];
  });

  def(517, 'Limitless', 3, 'Jujutsu', 'void', 'Infinity at the center: shield every friendly piece adjacent to your king.', 'The infinite approaches asymptotically.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const guards = own(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.statusOn(g, guards, 's', 1, 'shield');
    return n ? ['Infinity wards ' + n + ' guardian' + (n > 1 ? 's' : '') + ' around your king.'] : ['No guard stands by the king.'];
  });

  def(518, 'Infinity', 4, 'Jujutsu', 'shield', 'Absolute defense: shield your king AND every friendly pawn on the board.', 'The strongest wall.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('The king is wrapped in infinity.'); }
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, ps, 's', 1, 'shield');
    if (n) lines.push(n + ' pawn' + (n > 1 ? 's are' : ' is') + ' shielded.');
    return lines.length ? lines : ['Infinity stands alone.'];
  });

  def(519, 'Vengeful Spirit', 3, 'Jujutsu', 'skull', 'A grudge walks the board: summon a Banshee on an empty square and freeze the enemy piece nearest to it.', 'It remembers.', (g, s) => {
    const lines = summon(g, s, 'banshee', 1);
    const b = own(g, s).filter(q => q.cell.t === 'banshee').slice(-1)[0];
    if (b) {
      let best = null, bd = 99;
      for (const q of foes(g, s)) { const d = Math.abs(q.r - b.r) + Math.abs(q.c - b.c); if (d < bd) { bd = d; best = q; } }
      if (best) { Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); lines.push('The spirit freezes the nearest foe with its wail.'); }
    }
    return lines.length ? lines : ['The spirit cannot manifest.'];
  });

  def(520, 'Shikigami: Divine Dogs', 2, 'Jujutsu', 'paw', 'Summon two Warhorses — the divine hounds answer and lunge one step forward.', 'Wolf, wolf, bite.', (g, s) => {
    const lines = summon(g, s, 'warhorse', 2, s === 'w' ? [4, 5] : [2, 3]);
    for (const h of own(g, s).filter(q => q.cell.t === 'warhorse').slice(-2)) {
      const r = h.r + (s === 'w' ? -1 : 1), c = h.c;
      if (r >= 0 && r < 8 && !g.board[r][c]) Fx.relocate(g, h.r, h.c, r, c, {});
    }
    return lines.length ? lines : ['The hounds find no ground.'];
  });

  def(521, 'Shikigami: Nue', 3, 'Jujutsu', 'storm', 'The thunder-bird shikigami: summon a Griffon and strike one random enemy piece with lightning (destroy a minor piece).', 'The sky tears.', (g, s) => {
    const lines = summon(g, s, 'griffon', 1);
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (t) kill(g, t, lines, 'Nue\'s bolt fells an enemy ' + MD.pieceName(t.cell.t) + '.');
    return lines.length ? lines : ['Nue circles an empty sky.'];
  });

  def(522, 'Shikigami: Rabbit Escape', 2, 'Jujutsu', 'paw', 'A flood of rabbits: summon three Imps across your side of the board.', 'There are always more rabbits.', (g, s) => summon(g, s, 'imp', 3, s === 'w' ? [4, 5, 6] : [1, 2, 3]));

  def(523, 'Shikigami: Max Elephant', 3, 'Jujutsu', 'drop', 'The elephant god floods the field: summon a Golem, then push every enemy piece on the edge files one square inward.', 'A river where a beast stands.', (g, s) => {
    const lines = summon(g, s, 'golem', 1);
    let moved = 0;
    for (const q of foes(g, s)) {
      const nc = q.c === 0 ? 1 : 7;
      if ((q.c === 0 || q.c === 7) && !g.board[q.r][nc]) { Fx.relocate(g, q.r, q.c, q.r, nc, {}); moved++; }
    }
    if (moved) lines.push('The flood shoves ' + moved + ' edge piece' + (moved > 1 ? 's' : '') + ' inward.');
    return lines.length ? lines : ['The elephant finds no room to wade.'];
  });

  def(524, 'Playful Cloud', 2, 'Jujutsu', 'sword', 'A cursed tool of legend: destroy a random enemy ROOK, or if none, a random enemy piece.', 'It hits as hard as its master\'s grief.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (!t) t = rnd(foes(g, s));
    if (!t) return ['Playful Cloud finds no target.'];
    kill(g, t, [], '');
    return ['Playful Cloud smashes the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(525, 'Prison Realm', 4, 'Jujutsu', 'lock', 'Seal the strongest foe: freeze the enemy\'s most valuable piece AND the two pieces beside it.', 'Sealed for a thousand years.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['There is no one worth sealing.'];
    const lines = [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    lines.push('The ' + MD.pieceName(t.cell.t) + ' is sealed away.');
    const near = foes(g, s).filter(q => q !== t && Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    for (const q of Fx.uniqN(near, 2)) { Fx.mod(q.cell, 'f', 1); Fx.flash(g, q.r, q.c, 'freeze', ''); }
    if (near.length) lines.push('Its guards are sealed with it.');
    return lines;
  });

  def(526, 'Binding Vow', 2, 'Jujutsu', 'scale', 'Sacrifice a pawn for power: destroy your own most advanced pawn, then take an extra move with a shielded vanguard.', 'Power is a contract.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return ['The vow needs a sacrifice.'];
    const lines = [];
    Fx.removeAt(g, p.r, p.c, {});
    lines.push('You sacrifice your vanguard to the vow.');
    const p2 = advPawns(g, s)[0];
    if (p2) { Fx.mod(p2.cell, 's', 1); Fx.flash(g, p2.r, p2.c, 'shield', ''); lines.push('Your new vanguard is shielded by the bargain.'); }
    Fx.grantExtra(g, s, 1);
    return lines;
  });

  def(527, 'Simple Domain', 1, 'Jujutsu', 'shield', 'A small refuge: cleanse all status effects from your pieces adjacent to your king and shield one of them.', 'The least domain.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = own(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    let n = 0;
    for (const q of near) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const one = rnd(near.filter(q => q.cell.t !== 'k'));
    if (one) { Fx.mod(one.cell, 's', 1); Fx.flash(g, one.r, one.c, 'shield', ''); }
    return ['A simple domain shelters the king' + (n ? ', cleansing ' + n : '') + '.'];
  });

  def(528, 'Inverted Spear of Heaven', 2, 'Jujutsu', 'sword', 'The blade that cuts cursed power: downgrade the enemy\'s strongest piece one tier (queen→rook, rook→bishop…).', 'It nullifies the divine.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const to = map[t.cell.t];
    if (!to) return ['The spear finds nothing to nullify.'];
    t.cell.t = to; Fx.flash(g, t.r, t.c, 'transform', '');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is weakened by the spear of heaven.'];
  });

  def(529, 'Disaster Curse: Volcano', 3, 'Jujutsu', 'fire', 'Jogo erupts: destroy a random enemy piece and scorch the four squares around where it stood (any pieces there are destroyed).', 'The earth is angry.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return ['The volcano finds no fuel.'];
    const lines = [];
    kill(g, t, lines, 'Jogo\'s flame consumes an enemy ' + MD.pieceName(t.cell.t) + '.');
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = t.r + dr, c = t.c + dc;
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      const q = g.board[r][c];
      if (q && q.c !== s && q.t !== 'k') kill(g, { r, c }, lines, 'A bystander is caught in the eruption.');
    }
    return lines;
  });

  def(530, 'Disaster Curse: Forest', 3, 'Jujutsu', 'leaf', 'Hanami blooms: summon a Treant on an empty square and spawn two thorn pawns beside your king.', 'Flowers where you walk.', (g, s) => {
    const lines = summon(g, s, 'treant', 1);
    const k = E.findKing(g, s);
    if (k) {
      const spots = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = k.r + dr, c = k.c + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
      }
      for (const q of Fx.uniqN(spots, 2)) { Fx.place(g, s, 'p', q.r, q.c, {}); lines.push('A thorn rises at ' + sn(q.r, q.c) + '.'); }
    }
    return lines.length ? lines : ['The forest cannot take root.'];
  });

  def(531, 'Disaster Curse: Ocean', 2, 'Jujutsu', 'drop', 'Dagon drowns the shore: poison every enemy piece on the edge files (up to four).', 'The tide remembers.', (g, s) => {
    const shore = foes(g, s).filter(q => q.c === 0 || q.c === 7);
    const n = Fx.statusOn(g, shore, 'p', 1, 'poison');
    return n ? ['The flood poisons ' + n + ' enemy piece' + (n > 1 ? 's' : '') + ' on the edges.'] : ['The shore is dry.'];
  });

  def(532, 'Disaster Curse: Transfiguration', 4, 'Jujutsu', 'skull', 'Mahito reshapes flesh: transform the enemy\'s strongest piece into YOUR pawn — a puppet wearing its skin.', 'Humanity is a costume.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['No flesh to reshape.'];
    t.cell.t = 'p'; t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'transform', '');
    return ['The enemy ' + MD.pieceName('p') + ' is transfigured into your puppet!'];
  });

  def(533, 'Yuji\'s Cursed Fists', 2, 'Jujutsu', 'target', 'Punch through the line: destroy a random enemy pawn and take an extra move.', 'Itadori hits like a truck.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['Yuji finds no pawn to punch.'];
    kill(g, t, [], '');
    Fx.grantExtra(g, s, 1);
    return ['A raw punch demolishes an enemy pawn — and you keep moving.'];
  });

  def(534, 'Megumi\'s Shadows', 2, 'Jujutsu', 'void', 'Draw from the shadow: summon two random shikigami (Imp or Warhorse) beside your most advanced pawn.', 'The shadow pool stirs.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const rows = [p.r];
    const lines = [];
    for (let i = 0; i < 2; i++) {
      const type = Math.random() < 0.5 ? 'imp' : 'warhorse';
      const pre = own(g, s).length;
      lines.push(...Fx.summonN(g, s, type, 1, { rows }));
      if (own(g, s).length === pre) break;
    }
    return lines.length ? lines : ['The shadow pool is empty.'];
  });

  def(535, 'Nobara\'s Resonance', 3, 'Jujutsu', 'skull', 'Strike the doll, hurt the wielder: poison two enemy pieces that share a file with your most advanced pawn.', 'A straw doll and a hammer.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const same = foes(g, s).filter(q => q.c === p.c);
    const n = Fx.statusOn(g, Fx.uniqN(same, 2), 'p', 1, 'poison');
    return n ? ['Resonance poisons ' + n + ' enemy piece' + (n > 1 ? 's' : '') + ' on your file.'] : ['The resonance finds no echo.'];
  });

  def(536, 'Gojo\'s Blindfold', 1, 'Jujutsu', 'void', 'See without looking: shield your most advanced piece and freeze the enemy that threatens it most.', 'Behind the blindfold, everything is clear.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    let best = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - p.r) + Math.abs(q.c - p.c); if (d < bd) { bd = d; best = q; } }
    if (best) { Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', ''); return ['Your vanguard is shielded and its hunter is frozen.']; }
    return ['Your vanguard is shielded.'];
  });

  def(537, 'Sukuna\'s Fingers', 3, 'Jujutsu', 'rune', 'Consume the King of Curses\' flesh: upgrade your most advanced pawn into a Queen, then poison a random enemy piece.', 'More fingers, more power, more hunger.', (g, s) => {
    const p = advPawns(g, s)[0];
    const lines = [];
    if (p) { p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('Your vanguard is crowned by cursed power.'); }
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('Cursed energy poisons an enemy.'); }
    return lines.length ? lines : ['The fingers hunger for a host.'];
  });

  def(538, 'Malevolent Kitchen', 2, 'Jujutsu', 'fire', 'Cleave and dismantle: destroy up to two enemy pieces on the same rank as your king.', 'Chef\'s special.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const rank = foes(g, s).filter(q => q.r === k.r);
    const picks = Fx.uniqN(rank, 2);
    const lines = [];
    for (const q of picks) kill(g, q, lines, 'Dismantle cuts an enemy ' + MD.pieceName(q.cell.t) + '.');
    return lines.length ? lines : ['The kitchen is clean.'];
  });

  def(539, 'Ten Shadows', 4, 'Jujutsu', 'paw', 'The full menagerie answers: summon three random beasts (Warhorse, Griffon, Golem, or Banshee) on empty squares.', 'Ten shadows, one will.', (g, s) => {
    const pool = ['warhorse', 'griffon', 'golem', 'banshee'];
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const before = own(g, s).length;
      lines.push(...Fx.summonN(g, s, type, 1));
      if (own(g, s).length === before) break;
    }
    return lines.length ? lines : ['The shadows refuse to part.'];
  });

  def(540, 'Cursed Speech', 3, 'Jujutsu', 'wind', '"Get lost." Force the enemy\'s most advanced piece to flee all the way back to its own side.', 'Words become weapons.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!t) return [];
    const rows = s === 'w' ? [0, 1, 2] : [5, 6, 7];
    const dest = Fx.rand(Fx.emptySq(g, r => rows.includes(r)));
    if (!dest) return ['The command is swallowed.'];
    Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
    return ['Cursed speech forces the enemy ' + MD.pieceName(t.cell.t) + ' to the back of the line.'];
  });

  def(541, 'Infinity Barrier', 4, 'Jujutsu', 'shield', 'The ultimate neutral technique: shield every friendly piece on the board.', 'You shall not touch.', (g, s) => {
    const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    return n ? ['Infinity wraps your entire army (' + n + ' pieces).'] : ['Your army is gone.'];
  });

  def(542, 'Cursed Spirit Drain', 2, 'Jujutsu', 'void', 'Feed on negative energy: destroy a random enemy troop (summoned creature) or, if none, shield your king instead.', 'Curse eats curse.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => E.isTroop(q.cell.t)));
    if (t) { kill(g, t, [], ''); return ['You devour an enemy ' + MD.pieceName(t.cell.t) + ' for its cursed energy!']; }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); return ['No curse to eat — you ward your king instead.']; }
    return [];
  });

  def(543, 'Exorcist\'s Purge', 3, 'Jujutsu', 'sword', 'A blessed blade: destroy a random enemy piece worth a rook or more, or if none, freeze the strongest enemy.', 'Purge the unclean.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (t) { kill(g, t, [], ''); return ['The purge destroys an enemy ' + MD.pieceName(t.cell.t) + '!']; }
    const star = strong(g, s);
    if (star) { Fx.mod(star.cell, 'f', 1); Fx.flash(g, star.r, star.c, 'freeze', ''); return ['No major threat — the purge freezes the strongest enemy instead.']; }
    return ['Nothing to purge.'];
  });

  def(544, 'Mei Mei\'s Crows', 2, 'Jujutsu', 'target', 'A murder of crows descends: destroy a random enemy minor piece (knight/bishop/pawn).', 'Black wings, black bargains.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (!t) return ['The crows find no prey.'];
    kill(g, t, [], '');
    return ['The crows tear apart an enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(545, 'Nanami\'s Overtime', 3, 'Jujutsu', 'target', '7:3 — a precise ratio: destroy the enemy\'s strongest MINOR piece (knight or bishop).', 'Work is a kind of sorcery.', (g, s) => {
    const t = foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
    if (!t) return ['Overtime with nothing to cut.'];
    kill(g, t, [], '');
    return ['The ratio strikes true — the enemy ' + MD.pieceName(t.cell.t) + ' is cut down.'];
  });

  def(546, 'Maki\'s Dragon Bone', 2, 'Jujutsu', 'sword', 'A staff that ignores sorcery: downgrade two random enemy pieces one tier each.', 'No cursed energy required.', (g, s) => {
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const pool = foes(g, s).filter(q => map[q.cell.t]);
    const picks = Fx.uniqN(pool, 2);
    const lines = [];
    for (const q of picks) { q.cell.t = map[q.cell.t]; Fx.flash(g, q.r, q.c, 'transform', ''); lines.push('An enemy ' + MD.pieceName(q.cell.t) + ' is weakened.'); }
    return lines.length ? lines : ['Dragon Bone finds no enchanted flesh.'];
  });

  def(547, 'Panda\'s Core', 2, 'Jujutsu', 'leaf', 'A soul in a robot: summon a Spriggan beside your king — it regenerates and refuses to die.', 'Sister, brother, core.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) near.push({ r, c });
    }
    const q = rnd(near);
    if (!q) return summon(g, s, 'spriggan', 1);
    Fx.place(g, s, 'spriggan', q.r, q.c, {});
    return ['A Spriggan core takes root beside your king.'];
  });

  def(548, 'Inumaki\'s Command', 2, 'Jujutsu', 'ice', '"Don\'t move." Freeze the enemy piece that moved last and one other random enemy piece.', 'Stop.', (g, s) => {
    const lines = [];
    const last = g.hist[g.hist.length - 1];
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.mod(cell, 'f', 1); Fx.flash(g, last.to.r, last.to.c, 'freeze', ''); lines.push('The last mover freezes in place.'); }
    }
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('Another foe is commanded to stop.'); }
    return lines.length ? lines : ['The command hangs in the air.'];
  });

  def(549, 'Curse Manipulation', 4, 'Jujutsu', 'swap', 'Uzumaki: steal a random enemy piece worth a rook or less and bring it to your banner.', 'All curses belong to the king.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => val(q.cell.t) <= 500));
    if (!t) return ['No curse small enough to claim.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['You swallow an enemy ' + MD.pieceName(t.cell.t) + ' and turn it to your cause!'];
  });

  def(550, 'Body of Distorted Killing', 3, 'Jujutsu', 'skull', 'A body that warps the world: poison every enemy pawn on the board (up to five).', 'Bodies are not sacred.', (g, s) => {
    const ps = foes(g, s).filter(q => q.cell.t === 'p');
    const n = Fx.statusOn(g, ps, 'p', 1, 'poison');
    return n ? ['The distortion poisons ' + n + ' enemy pawn' + (n > 1 ? 's' : '') + '.'] : ['The distortion finds no pawns.'];
  });

  def(551, 'Blood Manipulation', 2, 'Jujutsu', 'drop', 'Piercing Blood: poison a random enemy piece, then shield your most advanced pawn.', 'Blood is the sharpest blade.', (g, s) => {
    const t = rnd(foes(g, s));
    const lines = [];
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('Piercing blood poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = advPawns(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); lines.push('Your vanguard is blood-warded.'); }
    return lines.length ? lines : ['Your blood finds no target.'];
  });

  def(552, 'Mythical Beast Amber', 4, 'Jujutsu', 'storm', 'A lightning body: take an extra move, and your most advanced piece gains a shield.', 'The past catches up.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); return ['Your body becomes lightning — an extra move, and your vanguard is shielded.']; }
    return ['Lightning fills you — an extra move is yours.'];
  });

  def(553, 'Hakari\'s Jackpot', 3, 'Jujutsu', 'dice', 'Roll the dice: a jackpot grants an extra move and heals your army; otherwise summon an Imp and freeze a foe. Either way, something happens.', 'Bang! Bang! Bang!', (g, s) => {
    if (Math.random() < 0.5) {
      Fx.grantExtra(g, s, 1);
      let n = 0;
      for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
      return ['JACKPOT! An extra move is yours' + (n ? ' and ' + n + ' pieces are healed' : '') + '!'];
    }
    const lines = summon(g, s, 'imp', 1);
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('A consolation prize — a foe is frozen.'); }
    return lines.length ? lines : ['The machine pays out nothing.'];
  });

  def(554, 'Star Rage', 3, 'Jujutsu', 'fire', 'A black hole in miniature: destroy a random enemy ROOK and weaken (downgrade) the piece next to it.', 'The mass of a star in a fist.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (!t) return ['Star Rage needs a tower to crush.'];
    const lines = [];
    kill(g, t, lines, 'Star Rage vaporizes the enemy rook!');
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const near = foes(g, s).find(q => map[q.cell.t] && Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    if (near) { near.cell.t = map[near.cell.t]; Fx.flash(g, near.r, near.c, 'transform', ''); lines.push('A bystander is crushed to a lesser form.'); }
    return lines;
  });

  def(555, 'Heavenly Restriction', 2, 'Jujutsu', 'scale', 'A body unbound by curses: downgrade the enemy\'s QUEEN to a rook (or, if none, freeze their strongest piece).', 'No talent, all power.', (g, s) => {
    const q = rnd(foes(g, s).filter(c => c.cell.t === 'q'));
    if (q) { q.cell.t = 'r'; Fx.flash(g, q.r, q.c, 'transform', ''); return ['The enemy queen is stripped of rank — she falls to rook.']; }
    const star = strong(g, s);
    if (star) { Fx.mod(star.cell, 'f', 1); Fx.flash(g, star.r, star.c, 'freeze', ''); return ['No queen — the restriction freezes the strongest foe instead.']; }
    return ['Nothing is bound.'];
  });

  def(556, 'Special Grade Assault', 4, 'Jujutsu', 'crown', 'The sorcerers mobilize: summon a Phoenix Egg AND revive one of your fallen pieces.', 'Special grade threat level: maximum.', (g, s) => {
    const lines = [];
    lines.push(...summon(g, s, 'phoenix', 1));
    const r = Fx.revive(g, s, 1);
    if (r.length) lines.push(...r);
    else { const k = E.findKing(g, s); if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Nothing to revive — your king is warded instead.'); } }
    return lines.length ? lines : ['The assault finds an empty battlefield.'];
  });

  MD.AB_12 = A;
})();

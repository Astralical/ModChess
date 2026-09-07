/* ============================================================
   Mod Chess — Ability set 13: 江湖侠客 (WUXIA HEROES)  IDs 557-606
   Signature ideas:
     • New sects: Sword Immortal (jianke), Qilin mount, Yasha.
     • FORMATION arts — reposition whole groups precisely.
     • HIDDEN WEAPON hazards (Tang Sect traps laid on empty squares).
     • QINGGONG — pure movement / extra-step techniques.
     • DIANXUE — sealing = freezing, with counter-art interactions.
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
  const adv = (g, s) => mine(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
  const advP = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
  const strong = (g, s) => foes(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
  const weak = (g, s) => foes(g, s).sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
  const kill = (g, q) => { Fx.removeAt(g, q.r, q.c, {}); };
  const summon = (g, s, t, n, rows) => Fx.summonN(g, s, t, n, rows ? { rows } : {});
  const A = [];
  const def = (id, name, rarity, icon, desc, flavor, run) => A.push({ id, name, rarity, cat: 'Wuxia', icon, desc, flavor, target: 'auto', run });

  def(557, 'Sword Immortal Descends', 3, 'sword', 'A jianke (Sword Immortal) descends from the sect and strikes: summon one, then it cuts the enemy piece directly in front of it.', 'One sword, one breath, one kill.', (g, s) => {
    const lines = summon(g, s, 'jianke', 1, s === 'w' ? [4, 5, 6] : [1, 2, 3]);
    const j = own(g, s).filter(q => q.cell.t === 'jianke').slice(-1)[0];
    if (j) {
      const nr = j.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < 8) { const t = g.board[nr][j.c]; if (t && t.c === O(s) && t.t !== 'k') { kill(g, { r: nr, c: j.c }); lines.push('A single cut fells the enemy before it.'); } }
    }
    return lines.length ? lines : ['The immortal waits for a worthy foe.'];
  });

  def(558, 'Qilin Grace', 4, 'leaf', 'The Qilin, a beast of pure virtue: summon one — it heals itself each turn and cannot be corrupted by curses.', 'Where the qilin walks, grass grows.', (g, s) => summon(g, s, 'qilin', 1));

  def(559, 'Yasha Binding', 3, 'void', 'A demon is bound to your service: summon a Yasha; when it dies it splits into two pawns.', 'Even demons keep one oath.', (g, s) => summon(g, s, 'yasha', 1));

  def(560, 'Yanqing Shield Formation', 2, 'shield', 'Form the iron wall: every friendly piece that stands ADJACENT to another friendly piece is shielded.', 'United, they are a city wall.', (g, s) => {
    const links = [];
    const all = own(g, s);
    for (const q of all) if (all.some(p => p !== q && Math.abs(p.r - q.r) + Math.abs(p.c - q.c) === 1)) links.push(q);
    const n = Fx.statusOn(g, links, 's', 1, 'shield');
    return n ? ['The formation shields ' + n + ' linked defender' + (n > 1 ? 's' : '') + '.'] : ['Your pieces stand apart.'];
  });

  def(561, 'Qinggong: Over the Wall', 2, 'wind', 'Light as a feather: your most advanced piece leaps over the piece in front of it to the empty square beyond (or takes two steps).', 'They vault the city wall.', (g, s) => {
    const p = advP(g, s)[0] || adv(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const over = p.r + dr, land = p.r + dr * 2;
    if (land >= 0 && land < 8 && g.board[over] && g.board[over][p.c] && !g.board[land][p.c]) {
      Fx.relocate(g, p.r, p.c, land, p.c, {});
      return ['Your vanguard vaults clean over the piece ahead!'];
    }
    if (over >= 0 && over < 8 && !g.board[over][p.c]) { Fx.relocate(g, p.r, p.c, over, p.c, {}); return ['Light steps carry your vanguard forward.']; }
    return ['No wall to vault.'];
  });

  def(562, 'Dianxue: Hundred Steps', 2, 'target', 'A finger of force at range: freeze a random enemy piece, and poison the enemy piece behind it (same file).', 'The acupoint is the same on every body.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    const lines = ['A point-seal freezes an enemy ' + MD.pieceName(t.cell.t) + '.'];
    const behind = foes(g, s).find(q => q.c === t.c && q !== t);
    if (behind) { Fx.mod(behind.cell, 'p', 1); Fx.flash(g, behind.r, behind.c, 'poison', ''); lines.push('The force carries to the one behind it.'); }
    return lines;
  });

  def(563, 'Tang Sect: Hidden Needles', 2, 'skull', 'Lay a needle HAZARD on two random empty squares in the enemy\'s half — any piece stepping there is poisoned.', 'You will not see the needle.', (g, s) => {
    const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const n = Fx.layHazards(g, 'poison', 2, { rows, name: 'hidden needle' });
    return n ? ['Hidden needles are seeded across ' + n + ' empty square' + (n > 1 ? 's' : '') + '.'] : ['No ground for the needles.'];
  });

  def(564, 'Huagong Dafa', 3, 'rune', 'The art that dissolves power: downgrade the enemy\'s STRONGEST piece two tiers (queen→bishop…).', 'Decades of kung fu, undone in a breath.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    const map = { q: 'b', r: 'n', b: 'p', n: 'p' };
    const to = map[t.cell.t];
    if (!to) return ['The art cannot dissolve this one.'];
    t.cell.t = to; Fx.flash(g, t.r, t.c, 'transform', '');
    return ['The enemy\'s inner force dissolves — a ' + MD.pieceName(to) + ' remains.'];
  });

  def(565, 'Beidou Seven Stars Formation', 4, 'star', 'Seven stars link the field: FREEZE seven random enemy pieces OR, if fewer than seven exist, freeze them all.', 'The Dipper turns, and none may move.', (g, s) => {
    const n = Fx.freezeN(g, s, 7);
    return n ? ['The Seven Stars seal ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '!'] : ['The stars find no foes to bind.'];
  });

  def(566, 'Feiyan Zouzhao', 3, 'swap', 'Swallow the sword: steal a random enemy MINOR piece (knight/bishop) — it now fights for you.', 'Every sect covets a fine blade.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    if (!t) return ['No fine blade to seize.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['You seize the enemy ' + MD.pieceName(t.cell.t) + ' and turn it to your school!'];
  });

  def(567, 'Dugu Jiu Jian', 4, 'sword', 'A sword with no technique beats all swords: destroy the enemy\'s strongest piece — but if it is worth more than a rook, you only FREEZE it.', 'To defeat any sword, use none.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    if (val(t.cell.t) > 500) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); return ['Too mighty to cut — the swordless strike binds it instead.']; }
    kill(g, t);
    return ['The peerless sword cuts down the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(568, 'Eighteen Dragon Palms', 3, 'storm', 'Palm after palm: destroy a random enemy ROOK; the final palm destroys the piece that is now the enemy\'s most advanced.', 'Eighteen hits in one breath.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (t) { kill(g, t); lines.push('The first palm shatters an enemy rook.'); }
    const lead = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (lead) { kill(g, lead); lines.push('The last palm crushes the enemy vanguard.'); }
    return lines.length ? lines : ['The palms strike empty air.'];
  });

  def(569, 'Yi Jin Jing', 2, 'heart', 'The sinew classic remakes the body: cleanse every friendly piece, and upgrade your most advanced pawn to a KNIGHT.', 'Bones that bend, sinews that sing.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = n ? ['The classic cleanses ' + n + ' of your pieces.'] : [];
    const p = advP(g, s)[0];
    if (p) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('Your vanguard is remade into a knight.'); }
    return lines.length ? lines : ['The classic hums to empty halls.'];
  });

  def(570, 'Qiankun Da Nuo Yi', 3, 'swap', 'The Great Shift: swap your two most advanced pawns with each other AND rotate your king one square (it may not move into check).', 'Power is only placement.', (g, s) => {
    const ps = advP(g, s);
    if (ps.length >= 2) { Fx.swapSq(g, ps[0], ps[1]); }
    const lines = [];
    if (ps.length >= 2) lines.push('Your two vanguards trade places.');
    const k = E.findKing(g, s);
    if (k) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      const spots = [];
      for (const [dr, dc] of dirs) {
        const r = k.r + dr, c = k.c + dc;
        if (r < 0 || r > 7 || c < 0 || c > 7 || g.board[r][c]) continue;
        spots.push({ r, c });
      }
      const pick = rnd(spots);
      if (pick) { Fx.relocate(g, k.r, k.c, pick.r, pick.c, {}); lines.push('Your king flows one square to ' + sn(pick.r, pick.c) + '.'); }
    }
    return lines.length ? lines : ['The shift needs two anchors.'];
  });

  def(571, 'Lingbo Weibu', 2, 'wind', 'Treading waves: your most advanced pawn may take TWO extra steps this card (move it up to three total if clear), and your king gains a shield.', 'They walk on the river and leave no ripples.', (g, s) => {
    const p = advP(g, s)[0];
    const lines = [];
    if (p) {
      const dr = s === 'w' ? -1 : 1;
      let r = p.r, moved = 0;
      while (moved < 3) {
        const nr = r + dr;
        if (nr < 0 || nr > 7 || g.board[nr][p.c]) break;
        Fx.relocate(g, r, p.c, nr, p.c, {});
        r = nr; moved++;
      }
      if (moved) lines.push('Your vanguard drifts ' + moved + ' step' + (moved > 1 ? 's' : '') + ' on the waves.');
    }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is warded.'); }
    return lines.length ? lines : ['The water is still.'];
  });

  def(572, 'Xixing Dafa', 2, 'swap', 'Absorb the enemy\'s qi: every enemy PAWN that is poisoned is converted — it joins your side instead of dying.', 'Their life becomes your breath.', (g, s) => {
    const tainted = foes(g, s).filter(q => q.cell.t === 'p' && q.cell.b && q.cell.b.p > 0);
    if (!tainted.length) return ['No weakened qi to absorb.'];
    const lines = [];
    for (const t of tainted) { t.cell.b.p = 0; t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); lines.push('An enemy pawn\'s qi is absorbed — it joins you.'); }
    Fx.clearEp(g);
    return lines;
  });

  def(573, 'Yiyang Zhi', 1, 'target', 'One Yang finger: freeze the enemy\'s most advanced piece.', 'One finger, one point, one truth.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['A point-seal freezes the enemy vanguard.'];
  });

  def(574, 'Taiji Push', 2, 'swap', 'Yield, then return the force: every enemy piece adjacent to your king is pushed TWO squares back.', 'The force returns to its sender.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const dir = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const q of foes(g, s).filter(x => Math.abs(x.r - k.r) <= 1 && Math.abs(x.c - k.c) <= 1)) {
      const nr = q.r + dir;
      if (nr < 0 || nr > 7 || g.board[nr][q.c]) continue;
      Fx.relocate(g, q.r, q.c, nr, q.c, {}); moved++;
    }
    return moved ? ['Taiji repels ' + moved + ' attacker' + (moved > 1 ? 's' : '') + ' from the king.'] : ['Nothing presses the king.'];
  });

  def(575, 'Xiao Li Feidao', 3, 'target', 'The flying dagger that never misses: destroy the enemy\'s weakest piece, then FREEZE the one that protected it (adjacent).', 'One dagger, and it is always enough.', (g, s) => {
    const t = weak(g, s);
    if (!t) return ['The dagger rests.'];
    const lines = [];
    kill(g, t);
    lines.push('A flying dagger ends the enemy ' + MD.pieceName(t.cell.t) + '.');
    const guard = foes(g, s).find(q => Math.abs(q.r - t.r) + Math.abs(q.c - t.c) === 1);
    if (guard) { Fx.mod(guard.cell, 'f', 1); Fx.flash(g, guard.r, guard.c, 'freeze', ''); lines.push('Its protector is frozen, unable to react.'); }
    return lines;
  });

  def(576, 'Shaolin Wall', 3, 'shield', 'The temple wall never falls: shield every friendly piece on the two ranks in front of your king.', 'Eighteen arhats, one unbroken wall.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const rows = s === 'w' ? [k.r - 1, k.r - 2] : [k.r + 1, k.r + 2];
    const guard = own(g, s).filter(q => rows.includes(q.r));
    const n = Fx.statusOn(g, guard, 's', 1, 'shield');
    return n ? ['The Shaolin wall shields ' + n + ' defender' + (n > 1 ? 's' : '') + ' before the king.'] : ['The wall has no defenders.'];
  });

  def(577, 'Wudang Taiji Sword', 2, 'sword', 'The soft sword deflects: if the enemy\'s strongest piece attacked you (is on your half), FREEZE it; otherwise your king is shielded.', 'The willow bends; the oak breaks.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    const onYourHalf = Fx.inOwnHalf(g, s, t.r);
    if (onYourHalf) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); return ['The taiji sword deflects the invader and binds it.']; }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); return ['No threat on your half — the sword becomes a shield for the king.']; }
    return [];
  });

  def(578, 'Emperor of Duan: Liumai Shenjian', 2, 'storm', 'Six-Vessel divine sword: fire a beam down a FILE — destroy the enemy\'s most advanced piece.', 'Qi like a sword-beam through a file.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!t) return ['The beam finds no target.'];
    kill(g, t);
    return ['A divine sword-beam pierces the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(579, 'Wudu Gu Poison', 1, 'skull', 'Raise the Gu: poison a random enemy piece; if it is a pawn, poison it twice-over (it will detonate sooner).', 'Feed them to the insects.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return [];
    Fx.mod(t.cell, 'p', t.cell.t === 'p' ? 1 : 1);
    Fx.flash(g, t.r, t.c, 'poison', '');
    return ['Gu poison seeps into an enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(580, 'Gai Bang: Beggar\'s Sect', 2, 'users', 'Ten thousand beggars swarm: freeze every enemy piece adjacent to your king, and poison one random enemy piece.', 'Ten thousand sticks, one rhythm.', (g, s) => {
    const k = E.findKing(g, s);
    const lines = [];
    if (k) {
      const near = foes(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
      const n = Fx.statusOn(g, near, 'f', 1, 'freeze');
      if (n) lines.push('The beggars mob ' + n + ' enemy at your king\'s door.');
    }
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('A poisoned needle finds a random foe.'); }
    return lines.length ? lines : ['The sect has no quarrel today.'];
  });

  def(581, 'Mingjiao Fire Art', 2, 'fire', 'The cult of light burns through armor: destroy a random enemy piece and lay an ember HAZARD on the square it vacated.', 'For the light, the field burns.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return ['The flame finds nothing.'];
    kill(g, t);
    E.setHaz(g, t.r, t.c, 'ember', 'sacred fire');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' is consumed, and the square now BURNS (any stepping piece is poisoned & unshielded).'];
  });

  def(582, 'Dongfang Bubai', 4, 'target', 'Peerless speed: take an EXTRA move, then destroy a random enemy minor piece.', 'So fast the needles are already in.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b'));
    const lines = ['You move again — a blur of motion.'];
    if (t) { kill(g, t); lines.push('A needle drops the enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines;
  });

  def(583, 'Tie Bu Shan', 1, 'shield', 'Iron-shirt body: shield your king and your most advanced piece.', 'Fists ring on iron cloth.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king dons the iron shirt.'); }
    const p = advP(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); lines.push('The vanguard dons the iron shirt.'); }
    return lines;
  });

  def(584, 'Xiao Yao Pai', 3, 'swap', 'The Carefree Sect ignores the rules: swap your most advanced piece with the enemy\'s strongest piece.', 'Freely taking what pleases the heart.', (g, s) => {
    const t = strong(g, s);
    const p = adv(g, s)[0];
    if (!t || !p) return [];
    Fx.swapSq(g, { r: t.r, c: t.c }, { r: p.r, c: p.c });
    return ['You trade places with the enemy ' + MD.pieceName(t.cell.t) + ' — now your pawn stands where it was.'];
  });

  def(585, 'Sao Di Seng', 3, 'sword', 'The broom monk sweeps once: destroy every enemy PAWN on the file of your most advanced piece.', 'The broom moves once, and the floor is clean.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return [];
    const ps = foes(g, s).filter(q => q.cell.t === 'p' && q.c === p.c);
    const lines = [];
    for (const t of ps) { kill(g, t); lines.push('A sweep removes an enemy pawn.'); }
    return lines.length ? lines : ['The file is already clean.'];
  });

  def(586, 'Qianzhang Fofa', 2, 'portal', 'A thousand hands, one mind: every empty square beside your king grows a thorn pawn (up to four).', 'Guardians of the thousand-hand Guanyin.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
    }
    const lines = [];
    for (const q of spots) { Fx.place(g, s, 'p', q.r, q.c, {}); lines.push('A thorned hand rises at ' + sn(q.r, q.c) + '.'); }
    return lines.length ? lines : ['No hands can reach the king.'];
  });

  def(587, 'Jiuyin Baiguzhua', 2, 'skull', 'Nine-Yin skeleton claw: poison a random enemy piece and weaken (downgrade) a random enemy minor piece.', 'Bone-deep wounds that will not heal.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); lines.push('The claw poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const u = rnd(foes(g, s).filter(q => map[q.cell.t]));
    if (u) { u.cell.t = map[u.cell.t]; Fx.flash(g, u.r, u.c, 'transform', ''); lines.push('Another is clawed into a lesser form.'); }
    return lines.length ? lines : ['The claw rakes air.'];
  });

  def(588, 'Hong Qigong', 2, 'paw', 'The Northern Beggar fights hungry: poison a random enemy piece, then your most advanced pawn surges forward.', 'Hunger is the best seasoning for victory.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('A ragged palm poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = advP(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('Your vanguard surges forward.'); }
    }
    return lines.length ? lines : ['The old beggar has nowhere to sit.'];
  });

  def(589, 'Huang Yaoshi: Mystic Maze', 3, 'dice', 'Rearrange the jianghu: shuffle ALL enemy pieces to random empty squares (a bewilderment maze).', 'Walk the peach-blossom maze and lose your way.', (g, s) => {
    const es = foes(g, s);
    if (!es.length) return [];
    let moved = 0;
    for (const q of es) {
      if (!g.board[q.r][q.c]) continue;
      const d = rnd(Fx.emptySq(g));
      if (!d) continue;
      Fx.relocate(g, q.r, q.c, d.r, d.c, {}); moved++;
    }
    return moved ? ['The maze scatters ' + moved + ' enemy piece' + (moved > 1 ? 's' : '') + ' across the board.'] : ['The maze refuses to turn.'];
  });

  def(590, 'Xiao Longnu: Jade Maiden', 2, 'ice', 'Cold as the ancient tomb: freeze every enemy piece on the file of your most advanced piece.', 'Jade qi, colder than winter.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    const t = foes(g, s).filter(q => q.c === p.c);
    const n = Fx.statusOn(g, t, 'f', 1, 'freeze');
    return n ? ['Jade-cold qi freezes ' + n + ' enemy on your file.'] : ['The file is warm.'];
  });

  def(591, 'Yang Guo: Heavy Iron Sword', 3, 'sword', 'A heavy sword needs no skill: destroy a random enemy piece worth a rook or more.', 'Weight is its own technique.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) return ['The heavy sword finds nothing worth the swing.'];
    kill(g, t);
    return ['The heavy iron sword crushes the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(592, 'Guo Jing: Pawn to Throne', 2, 'crown', 'The loyal knight of the realm: your most advanced pawn is promoted to a QUEEN.', 'Dumb as a peasant, loyal as a hound, strong as a dragon.', (g, s) => {
    const p = advP(g, s)[0];
    if (!p) return ['No pawn to crown.'];
    p.cell.t = 'q'; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['Your vanguard ascends to QUEEN by sheer loyalty!'];
  });

  def(593, 'Duan Yu: Bo Jue', 2, 'target', 'A life-giving finger: your king is cleansed AND your most advanced pawn gains a shield.', 'The gentle prince heals what others wound.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k && g.board[k.r][k.c].b) { g.board[k.r][k.c].b.f = 0; g.board[k.r][k.c].b.p = 0; }
    const p = advP(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); lines.push('Your vanguard is blessed by the Bo Jue finger.'); }
    return lines.length ? lines : ['The prince finds no one to heal.'];
  });

  def(594, 'Mingjiao Resurgence', 3, 'portal', 'The cult rises from the ashes: revive your strongest fallen piece — if none have fallen, summon a Yasha.', 'The sacred flame is never truly out.', (g, s) => {
    const r = Fx.revive(g, s, 1);
    if (r.length) return r;
    return summon(g, s, 'yasha', 1);
  });

  def(595, 'Wulin Mengzhu', 3, 'crown', 'Lord of the martial world: rally every friendly piece on your back rank (shield them) and shield your king.', 'All sects, one banner.', (g, s) => {
    const back = s === 'w' ? 7 : 0;
    const lines = [];
    const rank = own(g, s).filter(q => q.r === back);
    const n = Fx.statusOn(g, rank, 's', 1, 'shield');
    if (n) lines.push('The alliance wards your back rank.');
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('The king is guarded by the assembled sects.'); }
    return lines.length ? lines : ['The alliance has no banners to raise.'];
  });

  def(596, 'An Sha', 2, 'void', 'A shadow ends one life: destroy the enemy\'s weakest piece.', 'You will never see them.', (g, s) => {
    const t = weak(g, s);
    if (!t) return ['The shadow finds no one.'];
    kill(g, t);
    return ['A shadow silently ends the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(597, 'Linghu Chong: Dugu', 3, 'sword', 'Breaking-sword style: FREEZE every enemy piece that has a shield, then destroy one random enemy pawn.', 'The style exists to break defenses.', (g, s) => {
    const shielded = foes(g, s).filter(q => q.cell.b && q.cell.b.s > 0);
    const n = Fx.statusOn(g, shielded, 'f', 1, 'freeze');
    const lines = n ? ['The breaking-sword seals ' + n + ' shielded foe' + (n > 1 ? 's' : '') + '.'] : [];
    const p = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (p) { kill(g, p); lines.push('A pawn is cut through.'); }
    return lines.length ? lines : ['No defense to break.'];
  });

  def(598, 'Qinggong: Yun Ti', 2, 'wind', 'Cloud steps: move your two most advanced pieces one step each (any direction), or take an extra move if they cannot.', 'Treading clouds, no footprints.', (g, s) => {
    const ps = adv(g, s).slice(0, 2);
    let moved = 0;
    for (const p of ps) {
      if (!g.board[p.r][p.c]) continue;
      const spots = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = p.r + dr, c = p.c + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) spots.push({ r, c });
      }
      const q = rnd(spots);
      if (q) { Fx.relocate(g, p.r, p.c, q.r, q.c, {}); moved++; }
    }
    if (moved) return ['Cloud steps carry ' + moved + ' of your pieces to new ground.'];
    Fx.grantExtra(g, s, 1);
    return ['No clear ground — you take an extra move instead.'];
  });

  def(599, 'Duan Yu: Lingbo Liuying', 3, 'wind', 'Wave-walking, shadow-splitting: take an extra move AND your king cannot be captured until your next turn (shield it).', 'Walk the waves; leave no shadow.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); return ['An extra move is yours, and the king drifts beyond reach (shielded).']; }
    return ['An extra move is yours.'];
  });

  def(600, 'Xuzhu: Wuwei Jie', 1, 'rune', 'The vow of no-self: cleanse your army.', 'Empty the self; the world cannot harm what is empty.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    return n ? ['No-self cleanses ' + n + ' of your pieces.'] : ['Your army is already empty of curses.'];
  });

  def(601, 'Jianghu Quan', 4, 'users', 'The whole jianghu answers the call: summon a Sword Immortal AND a Qilin on empty squares.', 'Old friends, old debts, old swords.', (g, s) => {
    const lines = [];
    lines.push(...summon(g, s, 'jianke', 1));
    lines.push(...summon(g, s, 'qilin', 1));
    return lines.length ? lines : ['The jianghu is silent today.'];
  });

  def(602, 'Sect Ambush', 2, 'target', 'An ambush on the road: destroy a random enemy piece on an edge file, then lay a trap HAZARD on an empty adjacent square.', 'The ambush never happened. That is the point.', (g, s) => {
    const edge = foes(g, s).filter(q => q.c === 0 || q.c === 7);
    const t = rnd(edge);
    if (!t) return ['No traveler walks the edge.'];
    kill(g, t);
    const lines = ['An ambush cuts down the enemy ' + MD.pieceName(t.cell.t) + ' on the edge.'];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const r = t.r + dr, c = t.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) near.push({ r, c });
    }
    const q = rnd(near);
    if (q) { E.setHaz(g, q.r, q.c, 'trap', 'sect ambush'); lines.push('A hidden blade-trap is set on the road behind.'); }
    return lines;
  });

  def(603, 'Feng Qingyang', 2, 'sword', 'The sword saint\'s single lesson: your most advanced piece surges two squares straight forward (or as far as it can).', 'One move, mastered for a lifetime.', (g, s) => {
    const p = adv(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    let r = p.r, moved = 0;
    while (moved < 2) {
      const nr = r + dr;
      if (nr < 0 || nr > 7 || g.board[nr][p.c]) break;
      Fx.relocate(g, r, p.c, nr, p.c, {}); r = nr; moved++;
    }
    return moved ? ['A perfect thrust carries your piece ' + moved + ' square' + (moved > 1 ? 's' : '') + ' forward.'] : ['The thrust is blocked.'];
  });

  def(604, 'Qi Jiguang', 2, 'shield', 'Mandarin-duck formation: every friendly piece that stands NEXT to an enemy is shielded.', 'Discipline is a shield.', (g, s) => {
    const near = own(g, s).filter(q => foes(g, s).some(f => Math.abs(f.r - q.r) + Math.abs(f.c - q.c) === 1));
    const n = Fx.statusOn(g, near, 's', 1, 'shield');
    return n ? ['The formation shields ' + n + ' front-line piece' + (n > 1 ? 's' : '') + '.'] : ['The front is clear.'];
  });

  def(605, 'Dugu Qiubai', 4, 'sword', 'The lonely peak: your whole army presses — every friendly pawn advances one square, then take an extra move.', 'Above all blades, alone.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    Fx.grantExtra(g, s, 1);
    return ['The lonely peak presses ' + moved + ' pawn' + (moved > 1 ? 's' : '') + ' forward, and you move again.'];
  });

  def(606, 'Xuanmen: Great Formation', 4, 'star', 'The orthodox sects weave a grand formation: shield every friendly piece AND freeze every enemy pawn.', 'Ten thousand masters, one circle.', (g, s) => {
    const a = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
    const b = Fx.statusOn(g, foes(g, s).filter(q => q.cell.t === 'p'), 'f', 1, 'freeze');
    return ['The grand formation wards your army' + (b ? ' and seals ' + b + ' enemy pawn' + (b > 1 ? 's' : '') : '') + '.'];
  });

  MD.AB_13 = A;
})();

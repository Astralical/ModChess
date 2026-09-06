/* ============================================================
   Mod Chess — Ability set 13: 江湖侠客 (WUXIA HEROES)
   IDs 557-606. Sects, secret arts, inner force, hidden weapons
   and legendary swords. Every card is 'auto', has a fallback,
   and never removes a king.
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

  def(557, 'Qinggong: Swift Steps', 2, 'Wuxia', 'wind', 'Lightness skill — your most advanced piece glides two squares forward; if blocked, it takes an extra move instead.', 'Feet barely touch the ground.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const nr = p.r + dr * 2;
    if (nr >= 0 && nr < 8 && !g.board[nr][p.c] && !g.board[p.r + dr][p.c]) {
      Fx.relocate(g, p.r, p.c, nr, p.c, {});
      return ['Your vanguard darts two squares forward.'];
    }
    Fx.grantExtra(g, s, 1);
    return ['The path is blocked — you flow around it with an extra move instead.'];
  });

  def(558, 'Dianxue: Seal Meridians', 2, 'Wuxia', 'target', 'Acupoint sealing: freeze a random enemy piece AND the piece standing next to it.', 'A tap, and the body forgets how to move.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return ['Your fingers find no vessel to seal.'];
    const lines = [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    lines.push('An enemy ' + MD.pieceName(t.cell.t) + ' is sealed.');
    const near = foes(g, s).find(q => q !== t && Math.abs(q.r - t.r) <= 1 && Math.abs(q.c - t.c) <= 1);
    if (near) { Fx.mod(near.cell, 'f', 1); Fx.flash(g, near.r, near.c, 'freeze', ''); lines.push('Its neighbor is sealed too.'); }
    return lines;
  });

  def(559, 'Tie Bu Shan: Iron Shirt', 1, 'Wuxia', 'shield', 'Iron-body defense: shield your most advanced piece.', 'Fists bounce off iron cloth.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', '');
    return ['Your vanguard dons the iron shirt.'];
  });

  def(560, 'Jin Zhong Zhao: Golden Bell', 2, 'Wuxia', 'shield', 'The golden bell covers the whole body: shield every friendly piece on the same rank as your king.', 'Ring, and none shall strike.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const guards = own(g, s).filter(q => q.r === k.r);
    const n = Fx.statusOn(g, guards, 's', 1, 'shield');
    return n ? ['The golden bell wards ' + n + ' piece' + (n > 1 ? 's' : '') + ' on the king\'s rank.'] : ['The bell rings over an empty rank.'];
  });

  def(561, 'Huagong Dafa', 3, 'Wuxia', 'rune', 'The art of dissolving power: downgrade the enemy\'s strongest piece two tiers (queen→bishop, rook→knight…).', 'Their decades become your breath.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    const map = { q: 'b', r: 'n', b: 'n', n: 'p' };
    const to = map[t.cell.t];
    if (!to) return ['The art cannot dissolve this one.'];
    t.cell.t = to; Fx.flash(g, t.r, t.c, 'transform', '');
    return ['You dissolve the enemy\'s inner force — their ' + MD.pieceName(to) + ' remains.'];
  });

  def(562, 'Xixing Dafa: Star Absorption', 2, 'Wuxia', 'swap', 'Absorb your opponent\'s qi: steal a random enemy PAWN and make it yours.', 'Power flows toward the abyss.', (g, s) => {
    const t = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['No stray qi to absorb.'];
    t.cell.c = s; Fx.clearEp(g); Fx.flash(g, t.r, t.c, 'move', '');
    return ['You absorb an enemy pawn\'s qi — it now serves you!'];
  });

  def(563, 'Yijin Jing', 2, 'Wuxia', 'heart', 'The sinew-changing classic: cleanse all your pieces of poison and freeze, then your most advanced pawn surges a step forward.', 'The body remakes itself.', (g, s) => {
    let n = 0;
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; n++; }
    const lines = [];
    if (n) lines.push('The classic cleanses ' + n + ' of your piece' + (n > 1 ? 's' : '') + '.');
    const p = advPawns(g, s)[0];
    if (p) {
      const nr = p.r + (s === 'w' ? -1 : 1);
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); lines.push('Your vanguard flows forward.'); }
    }
    return lines.length ? lines : ['The classic hums to an empty hall.'];
  });

  def(564, 'Xianglong Shiba Zhang', 4, 'Wuxia', 'dragon', 'Eighteen Dragon-Subduing Palms: destroy a random enemy ROOK, then the palm\'s echo destroys the piece behind it.', 'Dragon falls to palm.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (!t) return ['The palm finds no dragon to subdue.'];
    const lines = [];
    kill(g, t, lines, 'A palm crushes the enemy rook!');
    const behind = foes(g, s).find(q => q !== t && Math.abs(q.r - t.r) + Math.abs(q.c - t.c) === 1);
    if (behind) kill(g, behind, lines, 'The echo strikes the piece beside it.');
    return lines;
  });

  def(565, 'Dagou Bang Fa', 2, 'Wuxia', 'target', 'The dog-beating staff: destroy a random enemy piece that moved last, or a random pawn.', 'No dog, no master, no mercy.', (g, s) => {
    const last = g.hist[g.hist.length - 1];
    let t = null;
    if (last && last.color === O(s)) {
      const cell = g.board[last.to.r] && g.board[last.to.r][last.to.c];
      if (cell && cell.c === O(s) && cell.t !== 'k') t = { r: last.to.r, c: last.to.c, cell };
    }
    if (!t) t = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (!t) return ['The staff finds no stray dog.'];
    kill(g, t, [], '');
    return ['The dog-beating staff cracks an enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(566, 'Kuihua Baodian', 3, 'Wuxia', 'sword', 'The Sunflower Manual: blinding speed — take an extra move, but the flower demands a sacrifice (destroy your own least advanced pawn).', 'Speed beyond speed.', (g, s) => {
    const p = advPawns(g, s).slice(-1)[0];
    const lines = [];
    if (p) { Fx.removeAt(g, p.r, p.c, {}); lines.push('The manual takes your least advanced pawn as tribute.'); }
    Fx.grantExtra(g, s, 1);
    lines.push('You move like a shadow — an extra move is yours.');
    return lines;
  });

  def(567, 'Dugu Jiu Jian', 4, 'Wuxia', 'sword', 'Nine Swords Beyond the World: destroy the enemy\'s strongest piece — no defense can stop a sword that has no technique.', 'The sword that defeats all swords.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['The peerless sword finds no rival.'];
    kill(g, t, [], '');
    return ['The enemy ' + MD.pieceName(t.cell.t) + ' falls to a sword with no technique!'];
  });

  def(568, 'Liu Mai Shen Jian', 2, 'Wuxia', 'storm', 'Six-Vessel Divine Sword: flick two fingers of energy — destroy two random enemy pawns on different files.', 'Qi like sword-beams.', (g, s) => {
    const ps = foes(g, s).filter(q => q.cell.t === 'p');
    const picks = Fx.uniqN(ps, 2);
    if (!picks.length) return ['Your fingers find nothing to cut.'];
    const lines = [];
    for (const q of picks) kill(g, q, lines, 'A divine sword-beam pierces an enemy pawn.');
    return lines;
  });

  def(569, 'Qiankun Da Nuoyi', 3, 'Wuxia', 'swap', 'The Great Shift: swap the position of the enemy\'s strongest piece with your king\'s most advanced pawn.', 'Power is only placement.', (g, s) => {
    const t = strong(g, s);
    const p = advPawns(g, s)[0];
    if (!t || !p) return ['The shift needs two anchors.'];
    Fx.swapSq(g, { r: t.r, c: t.c }, { r: p.r, c: p.c });
    return ['The great shift teleports the enemy ' + MD.pieceName(t.cell.t) + ' into your vanguard\'s place!'];
  });

  def(570, 'Dou Zhuan Xing Yi', 3, 'Wuxia', 'swap', 'Reversing stars: redirect an enemy piece — swap two random enemy pieces with each other.', 'Their own army tangles itself.', (g, s) => {
    const es = Fx.uniqN(foes(g, s), 2);
    if (es.length < 2) return ['The stars will not align.'];
    Fx.swapSq(g, { r: es[0].r, c: es[0].c }, { r: es[1].r, c: es[1].c });
    return ['Two enemy pieces find themselves suddenly elsewhere!'];
  });

  def(571, 'Lingbo Weibu', 2, 'Wuxia', 'wind', 'Wave-walking steps: take an extra move and your king gains a shield.', 'Walk on the waves, untouchable.', (g, s) => {
    Fx.grantExtra(g, s, 1);
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); return ['You drift on the waves — an extra move, and your king is guarded.']; }
    return ['You drift on the waves — an extra move is yours.'];
  });

  def(572, 'Yiyang Zhi', 2, 'Wuxia', 'target', 'One-Yang Finger: a point of pure force — freeze a random enemy piece and push it one square back.', 'One finger, one truth.', (g, s) => {
    const t = rnd(foes(g, s));
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    const nr = t.r + (s === 'w' ? -1 : 1);
    if (nr >= 0 && nr < 8 && !g.board[nr][t.c]) Fx.relocate(g, t.r, t.c, nr, t.c, {});
    return ['One-Yang force freezes an enemy ' + MD.pieceName(t.cell.t) + ' and shoves it back.'];
  });

  def(573, 'Hama Gong', 2, 'Wuxia', 'leaf', 'Toad style: your most advanced pawn hops two squares diagonally forward (like a toad) if the landing is clear.', 'Ribbit. Power.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const targets = [];
    for (const dc of [-1, 1]) {
      const r = p.r + dr * 2, c = p.c + dc * 2;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) targets.push({ r, c });
    }
    const q = rnd(targets);
    if (!q) { Fx.mod(p.cell, 's', 1); return ['The toad crouches — your vanguard is shielded instead.']; }
    Fx.relocate(g, p.r, p.c, q.r, q.c, {});
    return ['Your vanguard hops like a toad to ' + sn(q.r, q.c) + '.'];
  });

  def(574, 'Shihou Gong', 3, 'Wuxia', 'wind', 'Lion\'s Roar: a sonic shockwave — push every enemy piece one square away from your king, then freeze one of them.', 'The roar shakes the valley.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    let moved = 0;
    for (const q of foes(g, s)) {
      const dr = Math.sign(q.r - k.r), dc = Math.sign(q.c - k.c);
      const nr = q.r + dr, nc = q.c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !g.board[nr][nc]) { Fx.relocate(g, q.r, q.c, nr, nc, {}); moved++; }
    }
    const lines = [];
    if (moved) lines.push('The roar shoves ' + moved + ' enemy' + (moved > 1 ? 's' : '') + ' back.');
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('One foe is stunned by the roar.'); }
    return lines.length ? lines : ['The lion is hoarse.'];
  });

  def(575, 'Yitian Jian', 3, 'Wuxia', 'sword', 'Heaven-Reliant Sword: destroy a random enemy ROOK; if none, destroy the strongest enemy piece.', 'The sword of the heavens obeys no one.', (g, s) => {
    let t = rnd(foes(g, s).filter(q => q.cell.t === 'r'));
    if (!t) t = strong(g, s);
    if (!t) return ['The sword yearns for a worthy target.'];
    kill(g, t, [], '');
    return ['Yitian Sword cleaves the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(576, 'Tulong Dao', 3, 'Wuxia', 'sword', 'Dragon-Slayer Blade: destroy the enemy piece worth the most on the board; a pawn, if that is all there is.', 'Whoever holds the blade commands the jianghu.', (g, s) => {
    const t = strong(g, s);
    if (!t) return [];
    kill(g, t, [], '');
    return ['Tulong Blade falls — the enemy ' + MD.pieceName(t.cell.t) + ' is destroyed!'];
  });

  def(577, 'Jiuyang Shengong', 3, 'Wuxia', 'heart', 'Nine-Yang Divine Art: your most advanced pawn becomes a mighty warrior — upgrade it to a Griffon, then heal it.', 'Yang energy, pure and endless.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    p.cell.t = 'griffon'; Fx.flash(g, p.r, p.c, 'transform', '');
    return ['Your vanguard is transformed by nine-yang qi into a Griffon!'];
  });

  def(578, 'Jiuyin Baigu Zhua', 2, 'Wuxia', 'skull', 'Nine-Yin Skeleton Claw: poison a random enemy piece and weaken (downgrade) another.', 'The claw leaves bone-deep wounds.', (g, s) => {
    const t = rnd(foes(g, s));
    const lines = [];
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('The claw poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const map = { q: 'r', r: 'b', b: 'n', n: 'p' };
    const u = rnd(foes(g, s).filter(q => map[q.cell.t] && q !== t));
    if (u) { u.cell.t = map[u.cell.t]; Fx.flash(g, u.r, u.c, 'transform', ''); lines.push('Another is clawed into a lesser form.'); }
    return lines.length ? lines : ['The claw rakes empty air.'];
  });

  def(579, 'Wudu Sect: Five Poisons', 1, 'Wuxia', 'skull', 'The five-poison cult strikes: poison two random enemy pieces.', 'Where the banners of the Wudu fly, flowers do not bloom.', (g, s) => {
    const n = Fx.poisonN(g, s, 2);
    return n ? ['Five poisons seep into ' + n + ' enemy piece' + (n > 1 ? 's' : '') + '.'] : ['No enemy to poison.'];
  });

  def(580, 'Tang Men An Qi', 2, 'Wuxia', 'target', 'Tang Sect hidden weapons: a flurry of darts — poison a random enemy piece and destroy a random enemy pawn.', 'The darts come from nowhere.', (g, s) => {
    const lines = [];
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('A dart poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    const p = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (p) kill(g, p, lines, 'A dart strikes down an enemy pawn.');
    return lines.length ? lines : ['Your sleeve is empty.'];
  });

  def(581, 'Gai Bang: Beggar\'s Sect', 2, 'Wuxia', 'users', 'Eighteen beggars, one staff: summon two Imps (your young beggar disciples) beside your king.', 'The beggars of the world are legion.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) near.push({ r, c });
    }
    const picks = Fx.uniqN(near, 2);
    const lines = [];
    for (const q of picks) { Fx.place(g, s, 'imp', q.r, q.c, {}); lines.push('A young disciple takes a place at ' + sn(q.r, q.c) + '.'); }
    return lines.length ? lines : ['The sect finds no room to gather.'];
  });

  def(582, 'Shaolin: Eighteen Arhats', 3, 'Wuxia', 'shield', 'The monks form a living wall: summon a Guardian and shield every friendly pawn beside it.', 'Iron fists, iron will.', (g, s) => {
    const lines = Fx.summonN(g, s, 'guardian', 1, { rows: s === 'w' ? [5, 6] : [1, 2] });
    const gd = own(g, s).filter(q => q.cell.t === 'guardian').slice(-1)[0];
    if (gd) {
      const near = own(g, s).filter(q => Math.abs(q.r - gd.r) <= 1 && Math.abs(q.c - gd.c) <= 1);
      const n = Fx.statusOn(g, near, 's', 1, 'shield');
      if (n) lines.push('The monks beside the Guardian are armored.');
    }
    return lines.length ? lines : ['The temple doors are barred.'];
  });

  def(583, 'Wudang Taiji', 3, 'Wuxia', 'swap', 'Tai Chi redirects a thousand pounds: swap your king with your most advanced piece (they trade places safely).', 'Yield, and the force returns to the sender.', (g, s) => {
    const k = E.findKing(g, s);
    const p = advPawns(g, s)[0] || rnd(mine(g, s).filter(q => q.r !== k.r || q.c !== k.c));
    if (!k || !p) return [];
    Fx.swapSq(g, { r: k.r, c: k.c }, { r: p.r, c: p.c });
    return ['Taiji flows — your king and your vanguard trade places.'];
  });

  def(584, 'Mingjiao: Fire Art', 2, 'Wuxia', 'fire', 'The cult of light burns: destroy a random enemy pawn and poison a random enemy piece.', 'For the light.', (g, s) => {
    const lines = [];
    const p = rnd(foes(g, s).filter(q => q.cell.t === 'p'));
    if (p) kill(g, p, lines, 'Holy fire consumes an enemy pawn.');
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('Smoke poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines.length ? lines : ['The sacred flame sputters.'];
  });

  def(585, 'Liudamen: Six Sects Siege', 4, 'Wuxia', 'users', 'Six great sects surround the enemy: freeze three random enemy pieces.', 'The mountain has many paths.', (g, s) => {
    const n = Fx.freezeN(g, s, 3);
    return n ? ['Six sects converge — ' + n + ' enemy piece' + (n > 1 ? 's are' : ' is') + ' frozen.'] : ['The sects find no foe to surround.'];
  });

  def(586, 'Sao Di Seng', 4, 'Wuxia', 'rune', 'The Sweeping Monk: one stroke clears the dust — destroy the enemy\'s most advanced piece.', 'The broom moves once.', (g, s) => {
    const t = foes(g, s).sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r))[0];
    if (!t) return ['The broom finds no dust.'];
    kill(g, t, [], '');
    return ['A single sweep removes the enemy ' + MD.pieceName(t.cell.t) + '.'];
  });

  def(587, 'Dongfang Bubai: Needles', 3, 'Wuxia', 'target', 'The peerless one strikes first: destroy a random enemy minor piece, then take an extra move.', 'In the blink of an eye.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b' || q.cell.t === 'p'));
    if (!t) return ['The needle finds no thread.'];
    kill(g, t, [], '');
    Fx.grantExtra(g, s, 1);
    return ['A needle flashes — an enemy ' + MD.pieceName(t.cell.t) + ' falls, and you move again.'];
  });

  def(588, 'Feng Qingyang', 2, 'Wuxia', 'sword', 'The sword saint\'s lesson: your most advanced piece learns one perfect thrust — it surges two squares forward.', 'One move, ten thousand hours.', (g, s) => {
    const p = advPawns(g, s)[0] || rnd(mine(g, s));
    if (!p) return [];
    const dr = s === 'w' ? -1 : 1;
    const nr = p.r + dr * 2;
    if (nr >= 0 && nr < 8 && !g.board[nr][p.c] && !g.board[p.r + dr][p.c]) {
      Fx.relocate(g, p.r, p.c, nr, p.c, {});
      return ['A perfect thrust carries your piece two squares forward.'];
    }
    Fx.mod(p.cell, 's', 1);
    return ['No open path — the lesson becomes a guard instead (shield).'];
  });

  def(589, 'Hong Qigong', 2, 'Wuxia', 'paw', 'The Northern Beggar fights hungry: summon a Warhorse (his loyal steed) and poison a random enemy piece.', 'Hunger is a weapon.', (g, s) => {
    const lines = Fx.summonN(g, s, 'warhorse', 1);
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('A ragged palm poisons an enemy ' + MD.pieceName(t.cell.t) + '.'); }
    return lines.length ? lines : ['The old beggar has nowhere to sit.'];
  });

  def(590, 'Huang Yaoshi', 3, 'Wuxia', 'dice', 'The Eastern Heretic\'s formations: rearrange your army — every friendly pawn moves to a random empty square on its side.', 'The peach-blossom maze confounds.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    if (!ps.length) return [];
    const rows = s === 'w' ? [3, 4, 5, 6, 7] : [0, 1, 2, 3, 4];
    let moved = 0;
    for (const p of ps) {
      if (!g.board[p.r][p.c]) continue;
      const pool = Fx.emptySq(g, (r, c) => rows.includes(r));
      const q = rnd(pool);
      if (!q) continue;
      Fx.relocate(g, p.r, p.c, q.r, q.c, {});
      moved++;
    }
    return moved ? ['The formation reshuffles ' + moved + ' of your pawns into a maze.'] : ['The maze refuses to move.'];
  });

  def(591, 'Xiao Longnu', 2, 'Wuxia', 'ice', 'The Jade Maiden\'s art is cold: freeze the enemy piece closest to your most advanced pawn.', 'Cold as the ancient tomb.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    let best = null, bd = 99;
    for (const q of foes(g, s)) { const d = Math.abs(q.r - p.r) + Math.abs(q.c - p.c); if (d < bd) { bd = d; best = q; } }
    if (!best) return [];
    Fx.mod(best.cell, 'f', 1); Fx.flash(g, best.r, best.c, 'freeze', '');
    return ['Jade-cold qi freezes the nearest enemy ' + MD.pieceName(best.cell.t) + '.'];
  });

  def(592, 'Yang Guo: One Arm', 3, 'Wuxia', 'sword', 'The Condor Hero strikes with heavy sword: destroy a random enemy piece worth a rook or more.', 'A heavy sword needs no skill.', (g, s) => {
    const t = rnd(foes(g, s).filter(q => val(q.cell.t) >= 500));
    if (!t) return ['The heavy sword finds nothing worth its weight.'];
    kill(g, t, [], '');
    return ['The heavy iron sword crushes the enemy ' + MD.pieceName(t.cell.t) + '!'];
  });

  def(593, 'Guo Jing: Jianglong', 2, 'Wuxia', 'dragon', 'The Northern Beggar\'s heir uses the dragon palm: your most advanced pawn destroys the enemy directly in front of it.', 'Dragon qi in a mortal body.', (g, s) => {
    const p = advPawns(g, s)[0];
    if (!p) return [];
    const nr = p.r + (s === 'w' ? -1 : 1);
    if (nr < 0 || nr > 7) return [];
    const cell = g.board[nr][p.c];
    if (!cell || cell.c !== O(s) || cell.t === 'k') return ['The palm strikes empty air.'];
    Fx.removeAt(g, nr, p.c, {});
    return ['A dragon palm blasts the enemy ' + MD.pieceName(cell.t) + ' standing before your vanguard!'];
  });

  def(594, 'Linghu Chong: Drunken', 1, 'Wuxia', 'dice', 'Drunken swordsmanship: a random thing happens — freeze a foe OR take an extra move. The wine decides.', 'Stagger, and strike true.', (g, s) => {
    if (Math.random() < 0.5) {
      Fx.grantExtra(g, s, 1);
      return ['The wine steadies you — an extra move is yours.'];
    }
    const t = rnd(foes(g, s));
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); return ['A drunken lunge freezes an enemy ' + MD.pieceName(t.cell.t) + '.']; }
    return ['The wine is gone and nothing happens.'];
  });

  def(595, 'Xiao Feng: Eighteen Paws', 2, 'Wuxia', 'paw', 'The hero of the north summons his pack: summon a Warhorse AND an Imp beside your most advanced piece.', 'Where Xiao Feng stands, no one stands alone.', (g, s) => {
    const p = advPawns(g, s)[0];
    const rows = p ? [p.r] : undefined;
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'warhorse', 1, rows ? { rows } : {}));
    lines.push(...Fx.summonN(g, s, 'imp', 1, rows ? { rows } : {}));
    return lines.length ? lines : ['The hero\'s call goes unanswered.'];
  });

  def(596, 'Duan Yu: Lingbo + Liuyang', 3, 'Wuxia', 'void', 'The gentle prince drains you: downgrade the enemy\'s QUEEN to a bishop, or if none, downgrade their strongest piece twice.', 'The Six-Vessel art, again and again.', (g, s) => {
    const q = foes(g, s).find(c => c.cell.t === 'q');
    if (q) { q.cell.t = 'b'; Fx.flash(g, q.r, q.c, 'transform', ''); return ['The prince\'s finger drains the enemy queen to a bishop.']; }
    const t = strong(g, s);
    if (!t) return [];
    const map = { q: 'b', r: 'n', b: 'n', n: 'p' };
    const to = map[t.cell.t];
    if (!to) return ['The art has nothing to drink.'];
    t.cell.t = to; Fx.flash(g, t.r, t.c, 'transform', '');
    return ['The strongest enemy is drained to a ' + MD.pieceName(to) + '.'];
  });

  def(597, 'Xuzhu: Wuwei', 2, 'Wuxia', 'rune', 'The novice monk\'s emptiness: cleanse your army, shield your king, and freeze the enemy\'s strongest piece.', 'In emptiness, all arts are mastered.', (g, s) => {
    const lines = [];
    for (const q of own(g, s)) if (q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0)) { q.cell.b.f = 0; q.cell.b.p = 0; }
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is guarded.'); }
    const t = strong(g, s);
    if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('The enemy\'s strongest is frozen in emptiness.'); }
    return lines.length ? lines : ['Emptiness finds nothing.'];
  });

  def(598, 'Qianzhang: One-Thousand Hand', 2, 'Wuxia', 'portal', 'The thousand-hand Bodhisattva: summon an Imp on every empty square adjacent to your king (up to four).', 'A thousand hands protect.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const near = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c]) near.push({ r, c });
    }
    const lines = [];
    for (const q of near) { Fx.place(g, s, 'imp', q.r, q.c, {}); lines.push('A hand appears at ' + sn(q.r, q.c) + '.'); }
    return lines.length ? lines : ['No hands can reach the king.'];
  });

  def(599, 'Qi Jiguang: Formation', 3, 'Wuxia', 'shield', 'Mandarin-duck formation: every friendly piece that stands next to an enemy is shielded.', 'Discipline is a wall.', (g, s) => {
    const near = [];
    for (const q of own(g, s)) {
      const touched = foes(g, s).some(f => Math.abs(f.r - q.r) <= 1 && Math.abs(f.c - q.c) <= 1);
      if (touched) near.push(q);
    }
    const n = Fx.statusOn(g, near, 's', 1, 'shield');
    return n ? ['The formation shields ' + n + ' of your front-line piece' + (n > 1 ? 's' : '') + '.'] : ['No enemy presses your line.'];
  });

  def(600, 'Duan Yanqing: Duan Jia', 1, 'Wuxia', 'crown', 'The Emperor of Dali\'s royal guard: shield your king and your most advanced pawn.', 'The imperial family endures.', (g, s) => {
    const lines = [];
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); lines.push('The king is guarded.'); }
    const p = advPawns(g, s)[0];
    if (p) { Fx.mod(p.cell, 's', 1); Fx.flash(g, p.r, p.c, 'shield', ''); lines.push('The vanguard is guarded.'); }
    return lines.length ? lines : ['The palace is empty.'];
  });

  def(601, 'Xiao Yao Pai', 3, 'Wuxia', 'void', 'The Carefree Sect\'s arts: swap your most advanced pawn with the enemy\'s strongest piece — take what serves you.', 'Freely taking, freely giving.', (g, s) => {
    const t = strong(g, s);
    const p = advPawns(g, s)[0];
    if (!t || !p) return ['The carefree arts need two targets.'];
    Fx.swapSq(g, { r: t.r, c: t.c }, { r: p.r, c: p.c });
    return ['You trade places with the enemy ' + MD.pieceName(t.cell.t) + ' — now it is where your pawn stood.'];
  });

  def(602, 'Shenzhao Jing: Demon Subduing', 2, 'Wuxia', 'eye', 'The demon-subduing scripture: freeze every enemy TROOP (summoned creature) on the board.', 'Demons tremble at the sutra.', (g, s) => {
    const tps = foes(g, s).filter(q => E.isTroop(q.cell.t));
    const n = Fx.statusOn(g, tps, 'f', 1, 'freeze');
    return n ? ['The sutra seals ' + n + ' summoned demon' + (n > 1 ? 's' : '') + '.'] : ['No demons walk the board.'];
  });

  def(603, 'Dugu Qiubai', 4, 'Wuxia', 'sword', 'Seeking defeat: your whole army presses forward — every friendly pawn advances one square.', 'A lonely peak above all blades.', (g, s) => {
    const ps = own(g, s).filter(q => q.cell.t === 'p');
    const dr = s === 'w' ? -1 : 1;
    let moved = 0;
    for (const p of ps) {
      const nr = p.r + dr;
      if (nr >= 0 && nr < 8 && !g.board[nr][p.c]) { Fx.relocate(g, p.r, p.c, nr, p.c, {}); moved++; }
    }
    return moved ? ['The great swordsman leads — ' + moved + ' pawn' + (moved > 1 ? 's surge' : ' surges') + ' forward.'] : ['The peak is immobile.'];
  });

  def(604, 'Wulin Mengzhu', 3, 'Wuxia', 'crown', 'Lord of the martial world: rally your forces — every friendly piece on your back rank is shielded and your most advanced pawn is upgraded to a knight.', 'All sects bow.', (g, s) => {
    const lines = [];
    const back = s === 'w' ? 7 : 0;
    const rank = own(g, s).filter(q => q.r === back);
    const n = Fx.statusOn(g, rank, 's', 1, 'shield');
    if (n) lines.push('Your back rank is warded.');
    const p = advPawns(g, s)[0];
    if (p) { p.cell.t = 'n'; Fx.flash(g, p.r, p.c, 'transform', ''); lines.push('Your vanguard is knighted by the alliance.'); }
    return lines.length ? lines : ['The alliance finds no banners.'];
  });

  def(605, 'An Sha: Shadow Kill', 2, 'Wuxia', 'void', 'A shadow assassin vanishes one enemy: destroy the enemy\'s least valuable piece.', 'You never saw them.', (g, s) => {
    const t = weak(g, s);
    if (!t) return ['The shadow finds no one to end.'];
    kill(g, t, [], '');
    return ['A shadow ends the enemy ' + MD.pieceName(t.cell.t) + ' without a sound.'];
  });

  def(606, 'Jianghu Gathering', 4, 'Wuxia', 'users', 'The whole jianghu comes: summon a Samurai AND a Spriggan AND an Imp onto empty squares.', 'Old friends, old debts, old swords.', (g, s) => {
    const lines = [];
    lines.push(...Fx.summonN(g, s, 'samurai', 1));
    lines.push(...Fx.summonN(g, s, 'spriggan', 1));
    lines.push(...Fx.summonN(g, s, 'imp', 1));
    return lines.length ? lines : ['The jianghu is silent today.'];
  });

  MD.AB_13 = A;
})();

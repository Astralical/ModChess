/* Mod Chess — Ability set 6/6: The Thirty-Six Stratagems (三十六计)  (IDs 221-256) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const rand = arr => Fx.rand(arr);
  const sn = (r, c) => E.sqName(r, c);
  const val = t => E.val(t);

  function noTarget(what) { return [what + ' — the stratagem finds no opening.']; }

  MD.AB_6 = [
    { id: 221, name: 'Deceive the Sky', icon: '🌌', rarity: 3, cat: 'Chaos',
      desc: '瞒天过海 — Teleport your strongest piece anywhere on the board, crossing the whole field unseen.',
      flavor: 'The crossing that no one sees coming.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
        const t = pool[0];
        return t ? Fx.teleportToEmpty(g, t, {}) : noTarget('Nowhere to hide');
      } },

    { id: 222, name: 'Besiege Wei, Save Zhao', icon: '⚔️', rarity: 3, cat: 'Attack',
      desc: '围魏救赵 — Strike where the enemy is weakest: destroy the enemy piece deepest inside your territory.',
      flavor: 'Attack what they must defend, and the siege lifts itself.',
      target: 'auto',
      run: (g, s) => {
        const rows = s === 'w' ? [5, 6, 7] : [0, 1, 2];
        const pool = en(g, s).filter(q => rows.includes(q.r) && q.cell.t !== 'k');
        const t = rand(pool);
        if (!t) return noTarget('No foe has dared advance');
        Fx.removeAt(g, t.r, t.c, {});
        return ['The deep invader on ' + sn(t.r, t.c) + ' is cut off and destroyed.'];
      } },

    { id: 223, name: 'Kill with a Borrowed Blade', icon: '🗡️', rarity: 2, cat: 'Attack',
      desc: '借刀杀人 — Turn the enemy on itself: their own pawn destroys one of their own minor pieces.',
      flavor: 'Two enemies, one blade, zero blame.',
      target: 'auto',
      run: (g, s) => {
        const minor = en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b');
        const t = rand(minor);
        if (!t) return noTarget('No minor pieces to betray');
        Fx.removeAt(g, t.r, t.c, {});
        const pawns = en(g, s).filter(q => q.cell.t === 'p');
        if (pawns.length) {
          const p = rand(pawns);
          Fx.removeAt(g, p.r, p.c, {});
          return ['A mutinous pawn slays the enemy ' + MD.pieceName(t.cell.t) + ', then flees the field.'];
        }
        return ['A pawn of the enemy strikes down its own ' + MD.pieceName(t.cell.t) + '!'];
      } },

    { id: 224, name: 'Wait at Ease', icon: '😌', rarity: 4, cat: 'Time',
      desc: '以逸待劳 — Rest while the enemy labors: take an extra move this turn.',
      flavor: 'Let them march all day; you move at dusk.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['You bide your time — act again!']; } },

    { id: 225, name: 'Loot the Burning House', icon: '🔥', rarity: 2, cat: 'Attack',
      desc: '趁火打劫 — Destroy a random enemy piece. If the enemy is already in check, destroy a second one.',
      flavor: 'Plunder is easiest when they are already fighting fires.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.destroyN(g, s, 1);
        if (E.inCheck(g, O(s))) lines.push(...Fx.destroyN(g, s, 1));
        return lines.length ? lines : noTarget('The house is empty');
      } },

    { id: 226, name: 'Feint East, Strike West', icon: '🎭', rarity: 2, cat: 'Chaos',
      desc: '声东击西 — Make a show of one wing while the real blow lands elsewhere: scatter two random enemy pieces to new squares.',
      flavor: 'They rushed east to defend a ghost.',
      target: 'auto',
      run: (g, s) => {
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        const picks = Fx.uniqN(foes, 2);
        let n = 0;
        for (const q of picks) {
          const dest = rand(Fx.emptySq(g));
          if (dest) { Fx.relocate(g, q.r, q.c, dest.r, dest.c, {}); n++; }
        }
        return n ? ['The enemy formation is pulled apart by a feint.'] : noTarget('No room to feint');
      } },

    { id: 227, name: 'Something from Nothing', icon: '✨', rarity: 3, cat: 'Summon',
      desc: '无中生有 — Conjure a completely random custom troop from thin air.',
      flavor: 'First there was nothing. Then there was a Goblin.',
      target: 'auto',
      run: (g, s) => {
        const key = MD.TROOP_KEYS[Math.floor(Math.random() * MD.TROOP_KEYS.length)];
        const lines = Fx.summonN(g, s, key, 1);
        return lines.length ? lines : noTarget('The conjuring finds no space');
      } },

    { id: 228, name: 'Secret Path', icon: '🛤️', rarity: 1, cat: 'Chaos',
      desc: '暗渡陈仓 — A random friendly pawn secretly advances to an empty square deep in enemy territory.',
      flavor: 'The road they never guarded.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = rand(pawns);
        if (!p) return noTarget('No pawn to send');
        const rows = s === 'w' ? [0, 1, 2, 3] : [4, 5, 6, 7];
        let dest = rand(Fx.emptySq(g, r => rows.includes(r)));
        if (!dest) dest = rand(Fx.emptySq(g));
        if (!dest) return noTarget('Every path is blocked');
        Fx.relocate(g, p.r, p.c, dest.r, dest.c, {});
        return ['A pawn slips along the hidden road to ' + sn(dest.r, dest.c) + '.'];
      } },

    { id: 229, name: 'Watch the Fire', icon: '🌉', rarity: 2, cat: 'Buff',
      desc: '隔岸观火 — Stay safe across the river: shield ALL of your pieces for the enemy\'s next turn.',
      flavor: 'Let them burn their bridges. You keep yours.',
      target: 'auto',
      run: (g, s) => {
        const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
        return n ? ['Your army watches from behind a wall of light.'] : [];
      } },

    { id: 230, name: 'Knife Behind a Smile', icon: '😏', rarity: 2, cat: 'Attack',
      desc: '笑里藏刀 — A random enemy pawn smiles, defects to your side… and it\'s still a pawn.',
      flavor: 'The friendliest face hides the sharpest plan.',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p');
        const t = rand(pawns);
        if (!t) return noTarget('No one is smiling back');
        t.cell.c = s;
        Fx.flash(g, t.r, t.c, 'move', '');
        Fx.clearEp(g);
        return ['An enemy pawn defects with a grin on ' + sn(t.r, t.c) + '.'];
      } },

    { id: 231, name: 'Plum for Peach', icon: '🍑', rarity: 2, cat: 'Economy',
      desc: '李代桃僵 — Sacrifice a random pawn of yours to shield your strongest surviving piece.',
      flavor: 'The plum falls so the peach may live.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = rand(pawns);
        if (!p) return noTarget('No pawn to give');
        Fx.removeAt(g, p.r, p.c, {});
        const top = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
        if (top) { Fx.mod(top.cell, 's', 1); Fx.flash(g, top.r, top.c, 'shield', ''); }
        return ['A pawn is lost so that your champion endures.'];
      } },

    { id: 232, name: 'Steal the Goat', icon: '🐐', rarity: 1, cat: 'Attack',
      desc: '顺手牵羊 — While the enemy is distracted, take a random enemy pawn for yourself.',
      flavor: 'It was just standing there.',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p');
        const t = rand(pawns);
        if (!t) return noTarget('No goat to pilfer');
        t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
        return ['You walk off with an enemy pawn from ' + sn(t.r, t.c) + '.'];
      } },

    { id: 233, name: 'Startle the Snake', icon: '🐍', rarity: 1, cat: 'Status',
      desc: '打草惊蛇 — Beat the grass: freeze a random enemy piece that was lying in wait.',
      flavor: 'Now that it has moved, it cannot move.',
      target: 'auto',
      run: (g, s) => Fx.freezeN(g, s, 1) },

    { id: 234, name: 'Borrowed Corpse', icon: '⚱️', rarity: 3, cat: 'Economy',
      desc: '借尸还魂 — Resurrect your strongest fallen piece to march again.',
      flavor: 'The body is borrowed. The grudge is permanent.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.revive(g, s, 1);
        return lines.length ? lines : noTarget('Your graveyard is empty');
      } },

    { id: 235, name: 'Lure the Tiger Down', icon: '🐯', rarity: 3, cat: 'Chaos',
      desc: '调虎离山 — Teleport the enemy\'s strongest piece far from its post.',
      flavor: 'The mountain tiger is now a house cat.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
        const t = pool[0];
        if (!t) return noTarget('No tiger to lure');
        const dest = rand(Fx.emptySq(g));
        if (!dest) return noTarget('Nowhere to lure it');
        Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
        return ['The enemy ' + MD.pieceName(t.cell.t) + ' is lured off its mountain to ' + sn(dest.r, dest.c) + '.'];
      } },

    { id: 236, name: 'Let Go to Catch', icon: '🪁', rarity: 2, cat: 'Chaos',
      desc: '欲擒故纵 — The enemy piece threatening your king is let go… for now. Teleport it far away and mark it.',
      flavor: 'Give them rope. Take it back later.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        if (!k || !foes.length) return noTarget('No quarry');
        foes.sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)));
        const t = foes[0];
        const dest = rand(Fx.emptySq(g));
        if (!dest) return noTarget('No room to release it');
        Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
        Fx.mod(g.board[dest.r][dest.c], 'p', 1);
        Fx.flash(g, dest.r, dest.c, 'poison', '');
        return ['The nearest threat is released to ' + sn(dest.r, dest.c) + ' — and cursed for later.'];
      } },

    { id: 237, name: 'Brick to Attract Jade', icon: '🧱', rarity: 3, cat: 'Economy',
      desc: '抛砖引玉 — Throw away a random pawn (the brick) to conjure a random custom troop (the jade).',
      flavor: 'A cheap stone buys a priceless treasure.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = rand(pawns);
        if (!p) return noTarget('No brick to throw');
        Fx.removeAt(g, p.r, p.c, {});
        const key = MD.TROOP_KEYS[Math.floor(Math.random() * MD.TROOP_KEYS.length)];
        const lines = Fx.summonN(g, s, key, 1);
        lines.unshift('A pawn is cast away…');
        return lines;
      } },

    { id: 238, name: 'Take the Ringleader', icon: '👑', rarity: 4, cat: 'Attack',
      desc: '擒贼擒王 — Destroy the enemy queen outright. If she is already gone, destroy their strongest remaining piece.',
      flavor: 'Cut off the head and the body wanders.',
      target: 'auto',
      run: (g, s) => {
        const q = en(g, s).filter(x => x.cell.t === 'q');
        if (q[0]) { Fx.removeAt(g, q[0].r, q[0].c, {}); return ['The enemy queen falls to the stratagem!']; }
        const lines = Fx.destroyN(g, s, 1, { prefer: 'high' });
        return lines.length ? lines : noTarget('Nothing left to lead');
      } },

    { id: 239, name: 'Cut the Firewood', icon: '🪵', rarity: 2, cat: 'Attack',
      desc: '釜底抽薪 — Remove the fire beneath the pot: destroy every enemy pawn on the central d- and e-files.',
      flavor: 'No firewood, no fire, no fight.',
      target: 'auto',
      run: (g, s) => {
        const hit = en(g, s).filter(q => (q.c === 3 || q.c === 4) && q.cell.t === 'p');
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['The central pawns are taken from under the enemy.'] : noTarget('No firewood in the center');
      } },

    { id: 240, name: 'Fish in Troubled Water', icon: '🐟', rarity: 3, cat: 'Attack',
      desc: '混水摸鱼 — Pluck a random enemy piece that is already cursed (frozen or poisoned) and add it to your side.',
      flavor: 'While they struggle, you reel them in.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k' && q.cell.b && (q.cell.b.f > 0 || q.cell.b.p > 0 || q.cell.b.s > 0));
        const t = rand(pool);
        if (!t) return noTarget('The waters are clear');
        t.cell.c = s;
        if (t.cell.b) { t.cell.b.f = 0; t.cell.b.p = 0; }
        Fx.flash(g, t.r, t.c, 'move', '');
        Fx.clearEp(g);
        return ['A troubled enemy ' + MD.pieceName(t.cell.t) + ' is fished into your army.'];
      } },

    { id: 241, name: 'Golden Cicada Shell', icon: '🦗', rarity: 3, cat: 'Kingship',
      desc: '金蝉脱壳 — Your king flees to safety, leaving a decoy pawn shell behind.',
      flavor: 'They stab the shell. You are already gone.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return noTarget('No king to escape');
        const old = { r: k.r, c: k.c };
        const lines = Fx.kingTeleport(g, s, true);
        if (!lines.length) return noTarget('Nowhere to flee');
        if (!g.board[old.r][old.c]) { Fx.place(g, s, 'p', old.r, old.c, {}); lines.push('A decoy pawn is left in the king\'s place.'); }
        return lines;
      } },

    { id: 242, name: 'Close the Door', icon: '🚪', rarity: 3, cat: 'Summon',
      desc: '关门捉贼 — Summon spectral pawns around the enemy king to close off its escape.',
      flavor: 'The thief is inside. Now shut the house.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, O(s));
        if (!k) return noTarget('No thief to trap');
        const spots = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = k.r + dr, c = k.c + dc;
          if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
        }
        const lines = [];
        for (const sp of spots.slice(0, 3)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A spectral pawn slams a door at ' + sn(sp.r, sp.c) + '.'); }
        if (lines.length < 3) {
          // doorframe full: barricade the whole block around the trapped king
          const ring = Fx.emptySq(g, (r, c) => Math.abs(r - k.r) <= 2 && Math.abs(c - k.c) <= 2);
          const extra = ring.filter(sp => !spots.some(o => o.r === sp.r && o.c === sp.c)).slice(0, 3 - lines.length);
          for (const sp of extra) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A spectral pawn barricades ' + sn(sp.r, sp.c) + '.'); }
        }
        return lines.length ? lines : noTarget('The door is already sealed');
      } },

    { id: 243, name: 'Befriend Far, Strike Near', icon: '🌍', rarity: 2, cat: 'Attack',
      desc: '远交近攻 — Destroy the enemy piece closest to your king while leaving the far ones be.',
      flavor: 'Make peace at a distance. Make war at your doorstep.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        if (!k || !foes.length) return noTarget('No foe nearby');
        foes.sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)));
        const t = foes[0];
        Fx.removeAt(g, t.r, t.c, {});
        return ['The nearest enemy ' + MD.pieceName(t.cell.t) + ' is struck down.'];
      } },

    { id: 244, name: 'Pass Through & Conquer', icon: '🏇', rarity: 3, cat: 'Chaos',
      desc: '假道伐虢 — Your strongest piece seizes the road and appears in the enemy\'s back lines.',
      flavor: 'They granted passage. That was the mistake.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
        const t = pool[0];
        if (!t) return noTarget('Nothing to send');
        const rows = s === 'w' ? [0, 1] : [6, 7];
        let dest = rand(Fx.emptySq(g, r => rows.includes(r)));
        if (!dest) dest = rand(Fx.emptySq(g));
        if (!dest) return noTarget('The road is blocked');
        Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
        return ['Your ' + MD.pieceName(t.cell.t) + ' marches through and takes the enemy rear at ' + sn(dest.r, dest.c) + '.'];
      } },

    { id: 245, name: 'Swap the Beams', icon: '🛠️', rarity: 3, cat: 'Chaos',
      desc: '偷梁换柱 — Swap the enemy\'s two strongest pieces with each other, undermining their formation.',
      flavor: 'The roof looks the same. It is not.',
      target: 'auto',
      run: (g, s) => {
        const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
        if (foes.length < 2) return noTarget('Not enough beams to swap');
        Fx.swapSq(g, foes[0], foes[1]);
        return ['The enemy\'s two mightiest pieces swap places in confusion.'];
      } },

    { id: 246, name: 'Scold the Mulberry', icon: '🌳', rarity: 1, cat: 'Curse',
      desc: '指桑骂槐 — Curse an enemy minor piece standing near your strongest piece (an indirect insult).',
      flavor: 'You scold the tree. The locust hears.',
      target: 'auto',
      run: (g, s) => {
        const me = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
        let pool = [];
        if (me) {
          pool = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - me.r) <= 2 && Math.abs(q.c - me.c) <= 2);
        }
        if (!pool.length) pool = en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b');
        const t = rand(pool);
        if (!t) return noTarget('Nothing within earshot');
        Fx.mod(t.cell, 'f', 1);
        Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is frozen by the pointed insult.'];
      } },

    { id: 247, name: 'Feigned Madness', icon: '🤪', rarity: 2, cat: 'Luck',
      desc: '假痴不癫 — Pretend to be weak: if the enemy leads in material, steal their weakest piece; otherwise, shield your king.',
      flavor: 'The fool they underestimate is the one who wins.',
      target: 'auto',
      run: (g, s) => {
        const diff = Fx.material(g, s) - Fx.material(g, O(s));
        if (diff < 0) {
          const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(a.cell.t) - val(b.cell.t));
          const t = foes[0];
          if (!t) return noTarget('Nothing to take');
          t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
          return ['They fell for the act — you take their weakest piece!'];
        }
        const k = E.findKing(g, s);
        if (!k) return noTarget('No king');
        Fx.mod(g.board[k.r][k.c], 's', 1);
        Fx.flash(g, k.r, k.c, 'shield', '');
        return ['You play the fool and quietly shield your king.'];
      } },

    { id: 248, name: 'Remove the Ladder', icon: '🪜', rarity: 3, cat: 'Attack',
      desc: '上屋抽梯 — Cut off the enemy king\'s support: destroy a random piece standing beside their king.',
      flavor: 'Once you are up the wall, someone takes the ladder.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, O(s));
        if (!k) return noTarget('No king on the roof');
        const pool = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
        const t = rand(pool.length ? pool : en(g, s).filter(q => q.cell.t !== 'k'));
        if (!t) return noTarget('Nothing to remove');
        Fx.removeAt(g, t.r, t.c, {});
        return ['A guard beside the enemy king is removed — the ladder falls.'];
      } },

    { id: 249, name: 'Bloom on the Withered Tree', icon: '🌸', rarity: 2, cat: 'Buff',
      desc: '树上开花 — Two random friendly pawns blossom into bishops on the spot.',
      flavor: 'Even a dead tree can wear flowers.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const picks = Fx.uniqN(pawns, 2);
        return Fx.transformSq(g, picks, 'b', () => 'A pawn blossoms into a Bishop!');
      } },

    { id: 250, name: 'Guest Becomes Host', icon: '🏠', rarity: 3, cat: 'Attack',
      desc: '反客为主 — A random enemy piece forgets its allegiance and joins your army where it stands.',
      flavor: 'The guest who slowly takes over the house.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k');
        const t = rand(pool);
        if (!t) return noTarget('No guests to turn');
        t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is now the host of your army!'];
      } },

    { id: 251, name: 'Beauty\'s Trap', icon: '💋', rarity: 2, cat: 'Status',
      desc: '美人计 — The enemy\'s strongest piece is so charmed it freezes in place for a turn.',
      flavor: 'Some traps are made of silk, not steel.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t));
        const t = pool[0];
        if (!t || t.cell.t === 'k') return noTarget('No one worth charming');
        Fx.mod(t.cell, 'f', 1);
        Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['The enemy ' + MD.pieceName(t.cell.t) + ' is utterly charmed — frozen!'];
      } },

    { id: 252, name: 'Empty City', icon: '🏯', rarity: 4, cat: 'Kingship',
      desc: '空城计 — Bluff with an open gate: shield your king. If you are in check, your king also vanishes to a random safe square.',
      flavor: 'The empty city is the most defended of all.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return noTarget('No king to bluff with');
        const lines = ['The gates are flung open — yet none dare enter.'];
        Fx.mod(g.board[k.r][k.c], 's', 1);
        Fx.flash(g, k.r, k.c, 'shield', '');
        if (E.inCheck(g, s)) lines.push(...Fx.kingTeleport(g, s, true));
        return lines;
      } },

    { id: 253, name: 'Sowing Discord', icon: '🔀', rarity: 2, cat: 'Chaos',
      desc: '反间计 — Two random enemy pieces distrust each other and swap places.',
      flavor: 'The best spy needs no message — only doubt.',
      target: 'auto',
      run: (g, s) => {
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        if (foes.length < 2) return noTarget('Too few to distrust each other');
        const a = rand(foes);
        const b = rand(foes.filter(q => q !== a));
        Fx.swapSq(g, a, b);
        return ['Two enemy pieces trade posts, eyeing each other with suspicion.'];
      } },

    { id: 254, name: 'Self-Inflicted Wound', icon: '🩹', rarity: 3, cat: 'Attack',
      desc: '苦肉计 — Feign disaster: sacrifice a random pawn, then strip the enemy queen down to a rook.',
      flavor: 'They believe your wound. They pay for it.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = rand(pawns);
        if (!p) return noTarget('No pawn to wound');
        Fx.removeAt(g, p.r, p.c, {});
        const q = en(g, s).filter(x => x.cell.t === 'q');
        const lines = ['A pawn falls in a convincing show of weakness…'];
        if (q[0]) { q[0].cell.t = 'r'; Fx.flash(g, q[0].r, q[0].c, 'transform', ''); lines.push('…and the enemy queen is quietly dethroned to a Rook!'); }
        return lines;
      } },

    { id: 255, name: 'Chain Stratagems', icon: '⛓️', rarity: 3, cat: 'Luck',
      desc: '连环计 — One scheme after another: freeze a random enemy piece, then destroy a random enemy pawn.',
      flavor: 'Every answer they find is the next trap.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.freezeN(g, s, 1);
        lines.push(...Fx.destroyN(g, s, 1, { only: 'p' }));
        return lines.length ? lines : noTarget('The chain finds no links');
      } },

    { id: 256, name: 'Retreat Is Best', icon: '🏃', rarity: 2, cat: 'Kingship',
      desc: '走为上 — When all else fails, run: teleport your king to safety near your own side and shield it.',
      flavor: 'Of the thirty-six stratagems, fleeing is the best.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return noTarget('No king to retreat');
        const lines = Fx.kingTeleport(g, s, true);
        const k2 = E.findKing(g, s);
        if (k2) { Fx.mod(g.board[k2.r][k2.c], 's', 1); Fx.flash(g, k2.r, k2.c, 'shield', ''); lines.push('Your king retreats and regroups.'); }
        return lines.length ? lines : noTarget('Nowhere left to run');
      } }
  ];
})();

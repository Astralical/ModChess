/* Mod Chess — Ability set 4/4 (IDs 151-200) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const E = MD.Engine, Fx = MD.Fx, O = MD.Fx.opp, pick = MD.pick;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);
  const FILES = 'abcdefgh';

  MD.AB_4 = [
    { id: 151, name: 'Dreadnought', icon: '🚢', rarity: 3, cat: 'Buff',
      desc: 'Upgrade your most advanced pawn straight into a queen.',
      flavor: 'The vanguard becomes the vanquisher.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
        const t = pawns[0];
        return t ? Fx.transformSq(g, [t], 'q', () => 'The lead pawn is crowned Queen on the spot!') : [];
      } },

    { id: 152, name: 'Loyalist Uprising', icon: '🚩', rarity: 3, cat: 'Summon',
      desc: 'Summon two friendly pawns on EVERY file where you have a pawn.',
      flavor: 'The peasants remember their oaths.',
      target: 'auto',
      run: (g, s) => {
        const files = [...new Set(own(g, s).filter(q => q.cell.t === 'p').map(q => q.c))];
        const lines = [];
        for (const c of files) {
          const empties = Fx.emptySq(g, r => r !== 0 && r !== 7 && !g.board[r] ? false : true);
          const spots = empties.filter(q => q.c === c);
          for (const sp of spots.slice(0, 2)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A loyalist pawn joins file ' + 'abcdefghijkl'[c] + '.'); }
        }
        return lines;
      } },

    { id: 153, name: 'Ancient Pact', icon: '📜', rarity: 3, cat: 'Economy',
      desc: 'Resurrect two random captured friendly pawns.',
      flavor: 'The old treaty demands the dead return.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 2, { type: 'p' }) },

    { id: 154, name: 'Ghost Legion', icon: '👻', rarity: 4, cat: 'Economy',
      desc: 'Resurrect up to FOUR captured friendly pieces.',
      flavor: 'An entire legion, unburied at once.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 4) },

    { id: 155, name: 'Borrowed Time', icon: '⏰', rarity: 4, cat: 'Time',
      desc: 'Take TWO extra moves this turn.',
      flavor: 'Borrowed time is still time.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 2); return ['The hourglass favors you — two extra moves!']; } },

    { id: 156, name: 'Paradox', icon: '🌀', rarity: 4, cat: 'Time',
      desc: 'The enemy skips their turn AND you act again (extra move).',
      flavor: 'Causality weeps.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['A paradox unfolds — you move again!']; } },

    { id: 157, name: 'Instant', icon: '⚡', rarity: 1, cat: 'Time',
      desc: 'Move again right now (extra move).',
      flavor: 'Some spells are just... faster.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['Cast at instant speed — move again!']; } },

    { id: 158, name: 'Mana Echo', icon: '🔁', rarity: 2, cat: 'Time',
      desc: 'After you move this turn, move one extra time.',
      flavor: 'The spell echoes off the walls of reality.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['Your next move echoes — extra move!']; } },

    { id: 159, name: 'Displace', icon: '📍', rarity: 1, cat: 'Chaos',
      desc: 'Swap the positions of your king and the nearest enemy piece.',
      flavor: 'Trade places with the threat. Bold.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        foes.sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)));
        const t = foes[0];
        if (!t) return [];
        Fx.swapSq(g, k, t);
        return ['You swap places with the nearest enemy piece!'];
      } },

    { id: 160, name: 'Switcheroo', icon: '🃏', rarity: 1, cat: 'Chaos',
      desc: 'Swap two random enemy pieces with each other.',
      flavor: 'Their own formation betrays them.',
      target: 'auto',
      run: (g, s) => {
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        if (foes.length < 2) return [];
        const a = Fx.rand(foes);
        const b = Fx.rand(foes.filter(q => q !== a));
        Fx.swapSq(g, a, b);
        return ['Two enemy pieces suddenly swap places!'];
      } },

    { id: 161, name: 'Rearrange', icon: '🧩', rarity: 2, cat: 'Chaos',
      desc: 'Rearrange all of your back-rank pieces among the empty back-rank squares.',
      flavor: 'The war council reshuffles.',
      target: 'auto',
      run: (g, s) => {
        const n = g.n || 8;
        const row = s === 'w' ? n - 1 : 0;
        const cells = [];
        for (let c = 0; c < n; c++) if (g.board[row][c]) { cells.push(g.board[row][c]); g.board[row][c] = null; }
        const order = [];
        for (let c = 0; c < n; c++) order.push(c);
        order.sort(() => Math.random() - 0.5);
        for (let i = 0; i < cells.length && i < order.length; i++) g.board[row][order[i]] = cells[i];
        g.ep = null;
        g.castle.wk = false; g.castle.wq = false;
        return ['Your back rank is rearranged!'];
      } },

    { id: 162, name: 'Flanking Maneuver', icon: '🪖', rarity: 2, cat: 'Chaos',
      desc: 'Move the two pieces on your a- and h-files\' back rank toward the center files.',
      flavor: 'Outflank them before they blink.',
      target: 'auto',
      run: (g, s) => {
        const n = g.n || 8;
        const h = n >> 1;
        const row = s === 'w' ? n - 1 : 0;
        const lines = [];
        const flank = (from) => {
          const cell = g.board[row][from];
          if (!cell) return;
          const dir = from < h ? 1 : -1;
          // sweep toward the center files for the first open square
          for (let step = 1; step <= h; step++) {
            const c = from + step * dir;
            if (c < 0 || c >= n) break;
            if (!g.board[row][c]) {
              Fx.relocate(g, row, from, row, c, {});
              lines.push('A piece outflanks to file ' + FILES[c] + '.');
              return;
            }
          }
          // corridor packed: leapfrog with the first piece met on the way in
          for (let step = 1; step <= h; step++) {
            const c = from + step * dir;
            if (c < 0 || c >= n) break;
            if (g.board[row][c]) {
              Fx.swapSq(g, { r: row, c: from }, { r: row, c: c });
              lines.push('A piece leapfrogs inward to file ' + FILES[c] + '.');
              return;
            }
          }
        };
        flank(0); flank(n - 1);
        return lines.length ? lines : ['The back rank is sealed — no flanking room.'];
      } },

    { id: 163, name: 'Crumbling Ground', icon: '🏚️', rarity: 2, cat: 'Attack',
      desc: 'Destroy all enemy pieces on the two center files (d & e).',
      flavor: 'The center cannot hold.',
      target: 'auto',
      run: (g, s) => {
        const hit = en(g, s).filter(q => q.cell.t !== 'k' && (q.c === 3 || q.c === 4));
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['The center files collapse, swallowing the enemy.'] : [];
      } },

    { id: 164, name: 'Ravine', icon: '⛰️', rarity: 1, cat: 'Attack',
      desc: 'Destroy a random enemy piece standing on the d- or e-file.',
      flavor: 'The earth splits beneath the center.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k' && (q.c === 3 || q.c === 4));
        const t = Fx.rand(pool);
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['A chasm opens beneath an enemy on the center file.'];
      } },

    { id: 165, name: 'Ward', icon: '🕯️', rarity: 1, cat: 'Buff',
      desc: 'Shield your most advanced piece for the next enemy turn.',
      flavor: 'Protect your vanguard.',
      target: 'auto',
      run: (g, s) => {
        const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
        const t = mine[0];
        if (!t) return [];
        Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', '');
        return ['A ward glimmers around your most advanced piece.'];
      } },

    { id: 166, name: 'Vanguard Bulwark', icon: '🛡️', rarity: 2, cat: 'Buff',
      desc: 'Shield the three most advanced friendly pieces.',
      flavor: 'The tip of the spear cannot break.',
      target: 'auto',
      run: (g, s) => {
        const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 3);
        const n = Fx.statusOn(g, mine, 's', 1, 'shield');
        return n ? ['Your vanguard is warded.'] : [];
      } },

    { id: 167, name: 'Hollow Crown', icon: '🫅', rarity: 3, cat: 'Curse',
      desc: 'Downgrade the enemy queen to a rook AND freeze their king.',
      flavor: 'A crown made of glass.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const q = en(g, s).filter(x => x.cell.t === 'q');
        if (q[0]) { q[0].cell.t = 'r'; Fx.flash(g, q[0].r, q[0].c, 'transform', ''); lines.push('The enemy queen is dethroned to a Rook.'); }
        const k = E.findKing(g, O(s));
        if (k) { Fx.mod(g.board[k.r][k.c], 'f', 1); Fx.flash(g, k.r, k.c, 'freeze', ''); lines.push('Their king is frozen.'); }
        return lines;
      } },

    { id: 168, name: 'Shadowbind', icon: '🕷️', rarity: 2, cat: 'Status',
      desc: 'Freeze the enemy piece that last moved.',
      flavor: 'The shadows remember movement.',
      target: 'auto',
      run: (g, s) => {
        const last = g.hist[g.hist.length - 1];
        if (!last || last.color !== O(s)) return ['No recent enemy move to bind.'];
        const cell = g.board[last.to.r][last.to.c];
        if (!cell || cell.c !== O(s)) return ['The trail has gone cold.'];
        Fx.mod(cell, 'f', 1); Fx.flash(g, last.to.r, last.to.c, 'freeze', '');
        return ['The last mover is frozen in shadow.'];
      } },

    { id: 169, name: 'Trapdoor', icon: '🪤', rarity: 1, cat: 'Attack',
      desc: 'Destroy a random enemy piece that is on the 4th rank (from your view).',
      flavor: 'Some squares are simply booby-trapped.',
      target: 'auto',
      run: (g, s) => {
        const n = g.n || 8;
        const row = s === 'w' ? n - 4 : 3;
        let pool = en(g, s).filter(q => q.cell.t !== 'k' && q.r === row);
        let t = Fx.rand(pool);
        let where = 'rank ' + (n - row);
        if (!t) {
          // no one on the trap rank: the spring snags the most advanced foe
          pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
          t = pool[0];
          where = 'their front line';
        }
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['A trapdoor opens beneath an enemy on ' + where + '.'];
      } },

    { id: 170, name: 'Landmine', icon: '💥', rarity: 2, cat: 'Attack',
      desc: 'Destroy a random enemy piece and all enemy pieces around it (never the king).',
      flavor: 'One step. Then silence.',
      target: 'auto',
      run: (g, s) => {
        const t = Fx.rand(en(g, s).filter(q => q.cell.t !== 'k'));
        if (!t) return [];
        let gone = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = t.r + dr, c = t.c + dc;
          const cell = g.board[r] && g.board[r][c];
          if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, r, c, {}); gone++; }
        }
        Fx.removeAt(g, t.r, t.c, {});
        const lines = ['The blast erases the epicenter.'];
        if (gone) lines.unshift('The shockwave takes ' + gone + ' more enemy unit' + (gone > 1 ? 's' : '') + '!');
        return lines;
      } },

    { id: 171, name: 'Sunburst', icon: '☀️', rarity: 3, cat: 'Attack',
      desc: 'Destroy every enemy piece in the four diagonal lines through your king.',
      flavor: 'Light pours from the throne.',
      target: 'auto',
      run: (g, s) => {
        const n = g.n || 8;
        const k = E.findKing(g, s);
        if (!k) return [];
        const hit = [];
        for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          let r = k.r + dr, c = k.c + dc;
          while (r >= 0 && r < n && c >= 0 && c < n) {
            const cell = g.board[r][c];
            if (cell && cell.c === O(s) && cell.t !== 'k') hit.push({ r, c });
            else if (cell) break;
            r += dr; c += dc;
          }
        }
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['Diagonal rays of light erase the enemy.'] : [];
      } },

    { id: 172, name: 'Checkmate Gambit', icon: '♞', rarity: 4, cat: 'Attack',
      desc: 'Destroy the enemy piece currently giving check to your king (if any).',
      flavor: 'The blade pointed at you is the blade you take.',
      target: 'auto',
      run: (g, s) => {
        if (!E.inCheck(g, s)) return ['You are not in check — the gambit fizzles.'];
        const checkers = Fx.checkers(g, s);
        const t = Fx.rand(checkers);
        if (!t) return ['The source of the check is untouchable.'];
        Fx.removeAt(g, t.r, t.c, {});
        return ['You cut down the piece that dared check your king!'];
      } },

    { id: 173, name: 'Silence', icon: '🤫', rarity: 3, cat: 'Curse',
      desc: 'The enemy cannot use an ability on their next turn (draw is skipped).',
      flavor: 'In the silence, only steel speaks.',
      target: 'auto',
      run: (g, s) => {
        g.silence[O(s)] = true;
        return ['The enemy\'s magic is silenced for their next turn!'];
      } },

    { id: 174, name: 'Hexproof', icon: '🧿', rarity: 3, cat: 'Buff',
      desc: 'Cleanse your king of curses (poison/frost) and shield it from the next enemy turn.',
      flavor: 'The evil eye finds no purchase.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return ['You have no king to ward.'];
        const cell = g.board[k.r][k.c];
        const lines = [];
        if (cell.b && (cell.b.f > 0 || cell.b.p > 0)) {
          cell.b.f = 0; cell.b.p = 0;
          lines.push('Your king is cleansed of curses.');
        }
        Fx.mod(cell, 's', 1);
        Fx.flash(g, k.r, k.c, 'shield', '');
        lines.push('A warding charm shields your king.');
        return lines;
      } },

    { id: 175, name: 'Lucky Seven', icon: '🍀', rarity: 1, cat: 'Luck',
      desc: 'A random roll: 50% to destroy an enemy piece, 50% to summon a pawn for you.',
      flavor: 'Lady Luck flips a coin.',
      target: 'auto',
      run: (g, s) => (Math.random() < 0.5
        ? (lines => (lines.length ? lines : ['The coin lands tails. Nothing happens.']))(Fx.destroyN(g, s, 1))
        : Fx.summonN(g, s, 'p', 1)) },

    { id: 176, name: 'Chaos Orb', icon: '🔮', rarity: 2, cat: 'Luck',
      desc: 'Randomly: destroy an enemy piece, freeze one, or summon a pawn for you.',
      flavor: 'The orb rolls where it will.',
      target: 'auto',
      run: (g, s) => {
        const roll = Math.floor(Math.random() * 3);
        if (roll === 0) { const l = Fx.destroyN(g, s, 1); return l.length ? l : ['The orb flickers harmlessly.']; }
        if (roll === 1) { const l = Fx.freezeN(g, s, 1); return l.length ? l : ['The orb flickers harmlessly.']; }
        const l = Fx.summonN(g, s, 'p', 1); return l.length ? l : ['The orb flickers harmlessly.'];
      } },

    { id: 177, name: 'Wild Magic', icon: '🌈', rarity: 3, cat: 'Luck',
      desc: 'Cast a random ability from the entire codex, chosen at random.',
      flavor: 'You reach into the deck and pull... something.',
      target: 'auto',
      run: (g, s) => {
        const pool = root.MD.ABILITIES.filter(a => a.id !== 177 && a.id !== 47);
        const rand = pool[Math.floor(Math.random() * pool.length)];
        g.wildChain = true;
        const sub = rand.target !== 'auto' ? Fx.autoTarget(g, s, rand.target) : null;
        const lines = (typeof rand.run === 'function') ? (rand.run(g, s, sub) || []) : [];
        return ['Wild Magic surges! It casts: ' + rand.icon + ' ' + rand.name + '!'].concat(lines);
      } },

    { id: 178, name: 'Fate\'s Dice', icon: '🎲', rarity: 2, cat: 'Luck',
      desc: 'Roll a die: 1–2 destroy a random enemy pawn; 3–4 summon a knight; 5–6 upgrade a pawn.',
      flavor: 'The dice never lie. They just mumble.',
      target: 'auto',
      run: (g, s) => {
        const roll = 1 + Math.floor(Math.random() * 6);
        if (roll <= 2) return Fx.destroyN(g, s, 1, { only: 'p' });
        if (roll <= 4) return Fx.summonN(g, s, 'n', 1);
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = Fx.rand(pawns);
        return p ? Fx.transformSq(g, [p], 'r', () => 'A pawn is upgraded to a Rook!') : [];
      } },

    { id: 179, name: 'Gambler\'s Ruin', icon: '♠️', rarity: 3, cat: 'Luck',
      desc: 'Flip a coin: heads you destroy TWO enemy pieces; tails you lose a random piece of your own.',
      flavor: 'All in.',
      target: 'auto',
      run: (g, s) => {
        if (Math.random() < 0.5) return Fx.destroyN(g, s, 2);
        const mine = own(g, s).filter(q => q.cell.t !== 'k');
        const t = Fx.rand(mine);
        if (!t) return ['You have nothing left to gamble.'];
        Fx.removeAt(g, t.r, t.c, {});
        return ['The coin betrays you. Your ' + MD.pieceName(t.cell.t) + ' is lost.'];
      } },

    { id: 180, name: 'Balance of Power', icon: '⚖️', rarity: 4, cat: 'Economy',
      desc: 'Each side returns their most recently captured piece to the board.',
      flavor: 'The universe abhors a one-sided war.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.revive(g, s, 1);
        lines.push(...Fx.revive(g, O(s), 1));
        return lines;
      } },

    { id: 181, name: 'Exchange', icon: '🔄', rarity: 2, cat: 'Economy',
      desc: 'Destroy one random enemy piece, then one of your own is resurrected.',
      flavor: 'A trade, but you set the terms.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.destroyN(g, s, 1);
        lines.push(...Fx.revive(g, s, 1));
        return lines;
      } },

    { id: 182, name: 'Tithe', icon: '⛩️', rarity: 1, cat: 'Economy',
      desc: 'Resurrect a captured friendly piece of the same type as the last piece you lost.',
      flavor: 'What was taken shall be returned.',
      target: 'auto',
      run: (g, s) => {
        const last = g.capt[s][g.capt[s].length - 1];
        if (!last) return ['Nothing has been lost yet.'];
        return Fx.revive(g, s, 1, { type: last.t });
      } },

    { id: 183, name: 'Storm Caller', icon: '⛈️', rarity: 2, cat: 'Attack',
      desc: 'Destroy a random enemy piece on every file where you have doubled pawns.',
      flavor: 'The storm answers the crowded ranks.',
      target: 'auto',
      run: (g, s) => {
        const cols = {};
        for (const q of own(g, s)) if (q.cell.t === 'p') cols[q.c] = (cols[q.c] || 0) + 1;
        const files = Object.keys(cols).filter(c => cols[c] >= 2).map(Number);
        const hit = en(g, s).filter(q => q.cell.t !== 'k' && files.includes(q.c));
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['Lightning ravages the crowded enemy files.'] : ['No doubled pawn files to call the storm.'];
      } },

    { id: 184, name: 'Harvest Moon', icon: '🌕', rarity: 2, cat: 'Curse',
      desc: 'Destroy the two most advanced enemy pawns.',
      flavor: 'The moon takes what the fields grew.',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
        const picks = pawns.slice(0, 2);
        for (const q of picks) Fx.removeAt(g, q.r, q.c, {});
        return picks.length ? ['The harvest reaps the enemy vanguard.'] : [];
      } },

    { id: 185, name: 'Caltrops', icon: '🪝', rarity: 1, cat: 'Curse',
      desc: 'Poison a random enemy piece that can still move this turn.',
      flavor: 'Every step could be your last.',
      target: 'auto',
      run: (g, s) => Fx.poisonN(g, s, 1) },

    { id: 186, name: 'Eyebite', icon: '👁️', rarity: 1, cat: 'Curse',
      desc: 'Freeze a random enemy minor piece.',
      flavor: 'Do not meet its gaze.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b');
        const t = Fx.rand(pool);
        if (!t) return [];
        Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is frozen by your gaze.'];
      } },

    { id: 187, name: 'Numbing Cold', icon: '🧣', rarity: 1, cat: 'Status',
      desc: 'Freeze a random enemy major piece (rook or queen).',
      flavor: 'The heavy pieces go numb first.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q');
        const t = Fx.rand(pool);
        if (!t) return [];
        Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' goes numb with cold.'];
      } },

    { id: 188, name: 'Eternal Frost', icon: '❄️', rarity: 4, cat: 'Status',
      desc: 'Freeze every enemy piece except their king and the pieces standing beside it. The monarch always has a thawed escape.',
      flavor: 'An ice age — with one merciful window.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, O(s));
        const spared = [];
        if (k) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = k.r + dr, c = k.c + dc;
          if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && g.board[r][c]) spared.push({ r, c });
        }
        const targets = en(g, s).filter(q => q.cell.t !== 'k' && !spared.some(p => p.r === q.r && p.c === q.c));
        const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
        return n ? ['Eternal frost seals the enemy army — the king\'s own circle alone stays thawed!'] : ['The frost finds no one beyond the king\'s guard.'];
      } },

    { id: 189, name: 'Avatar', icon: '🐉', rarity: 4, cat: 'Kingship',
      desc: 'Summon a friendly queen beside your king, then shield them both.',
      flavor: 'The king\'s wrath, given form.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const near = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = k.r + dr, c = k.c + dc;
          if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) near.push({ r, c });
        }
        let sq = Fx.rand(near);
        if (!sq) {
          // crowded throne room: the avatar manifests just outside the court
          const ring = Fx.emptySq(g, (r, c) => Math.abs(r - k.r) <= 2 && Math.abs(c - k.c) <= 2);
          sq = Fx.rand(ring);
        }
        if (!sq) return ['No room for an avatar.'];
        Fx.place(g, s, 'q', sq.r, sq.c, {});
        const list = [{ r: k.r, c: k.c }, sq];
        Fx.statusOn(g, list, 's', 1, 'shield');
        return ['An avatar queen materializes at ' + sn(sq.r, sq.c) + ', and the king is warded too.'];
      } },

    { id: 190, name: 'Undying Loyalty', icon: '🧎', rarity: 2, cat: 'Kingship',
      desc: 'Summon two friendly pawns to shield your king.',
      flavor: 'They would die a thousand times.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const spots = [];
        const nb = g.n || 8;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = k.r + dr, c = k.c + dc;
          if (r >= 0 && r < nb && c >= 0 && c < nb && !g.board[r][c]) spots.push({ r, c });
        }
        const lines = [];
        for (const sp of spots.slice(0, 2)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); Fx.mod(g.board[sp.r][sp.c], 's', 1); lines.push('A loyal pawn throws itself before the king.'); }
        if (!lines.length) {
          const open = Fx.emptySq(g, (r, c) => Fx.inOwnHalf(g, s, r)).slice(0, 2);
          for (const sp of open) { Fx.place(g, s, 'p', sp.r, sp.c, {}); Fx.mod(g.board[sp.r][sp.c], 's', 1); lines.push('A loyal pawn rushes up to guard the king.'); }
        }
        return lines.length ? lines : ['No loyal pawn can reach the king.'];
      } },

    { id: 191, name: 'Tyrant\'s Command', icon: '👑', rarity: 3, cat: 'Chaos',
      desc: 'Force the enemy\'s most advanced piece to retreat to your side of the board.',
      flavor: 'You command. They obey.',
      target: 'auto',
      run: (g, s) => {
        const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
        const t = foes[0];
        if (!t) return [];
        const rows = s === 'w' ? [5, 6, 7] : [0, 1, 2];
        const dest = Fx.rand(Fx.emptySq(g, r => rows.includes(r)));
        if (!dest) return [];
        Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
        return ['The enemy ' + MD.pieceName(t.cell.t) + ' is forced back into your half.'];
      } },

    { id: 192, name: 'Overrun', icon: '🐘', rarity: 2, cat: 'Chaos',
      desc: 'All enemy pawns flee one square back toward their own side; any that cannot flee instead surge one square forward — the line bends, nothing is destroyed.',
      flavor: 'The whole line wavers.',
      target: 'auto',
      run: (g, s) => {
        // build a list of enemy pawns first so moves are stable
        const pawns = [];
        for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
          const cell = g.board[r][c];
          if (cell && cell.c !== s && cell.t === 'p') pawns.push({ r, c });
        }
        let moved = 0;
        // 1) try to retreat (toward their own back rank)
        for (const p of pawns) {
          const cell = g.board[p.r][p.c];
          if (!cell) continue;               // could have moved already
          const back = cell.c === 'w' ? 1 : -1;
          const nr = p.r + back, nc = p.c;
          if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, p.r, p.c, nr, nc, {}); moved++; }
        }
        if (moved) return ['The enemy line falls back as one — ' + moved + ' pawn' + (moved > 1 ? 's flee' : ' flees') + '.'];
        // 2) nothing could retreat: the line surges FORWARD instead
        for (const p of pawns) {
          const cell = g.board[p.r][p.c];
          if (!cell) continue;
          const fwd = cell.c === 'w' ? -1 : 1;
          const nr = p.r + fwd, nc = p.c;
          if (nr >= 0 && nr < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, p.r, p.c, nr, nc, {}); moved++; }
        }
        return moved ? ['With nowhere to run, the enemy pawns surge forward!'] : ['The enemy pawns are frozen in place — not one stirs.'];
      } },

    { id: 193, name: 'Broken Arrow', icon: '🏹', rarity: 1, cat: 'Attack',
      desc: 'Destroy a random enemy piece on the enemy\'s most crowded file.',
      flavor: 'Where they cluster, they fall.',
      target: 'auto',
      run: (g, s) => {
        const counts = Array.from({ length: Fx.bd(g) }, () => 0);
        for (const q of en(g, s)) if (q.cell.t !== 'k') counts[q.c]++;
        let best = 0; for (let c = 1; c < Fx.bd(g); c++) if (counts[c] > counts[best]) best = c;
        const t = Fx.rand(en(g, s).filter(q => q.cell.t !== 'k' && q.c === best));
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['An arrow finds the enemy ' + MD.pieceName(t.cell.t) + ' in the thick of their line.'];
      } },

    { id: 194, name: 'Repel', icon: '✋', rarity: 2, cat: 'Chaos',
      desc: 'Push all enemy pieces one square away from your king.',
      flavor: 'An invisible hand shoves them back.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        let moved = 0;
        for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
          const cell = g.board[r][c];
          if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
          const dr = Math.sign(r - k.r), dc = Math.sign(c - k.c);
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < Fx.bd(g) && nc >= 0 && nc < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, r, c, nr, nc, {}); moved++; }
        }
        return moved ? ['A wave of force pushes the enemy back!'] : [];
      } },

    { id: 195, name: 'Magnetize', icon: '🧲', rarity: 2, cat: 'Chaos',
      desc: 'Pull all friendly pieces one square toward your king.',
      flavor: 'The crown calls its own.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        let moved = 0;
        for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
          const cell = g.board[r][c];
          if (!cell || cell.c !== s || cell.t === 'k') continue;
          const dr = Math.sign(k.r - r), dc = Math.sign(k.c - c);
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < Fx.bd(g) && nc >= 0 && nc < Fx.bd(g) && !g.board[nr][nc]) { Fx.relocate(g, r, c, nr, nc, {}); moved++; }
        }
        return moved ? ['Your army clusters around the king.'] : [];
      } },

    { id: 196, name: 'Rallying Cry', icon: '📣', rarity: 2, cat: 'Buff',
      desc: 'Every friendly piece adjacent to your king is upgraded one tier.',
      flavor: 'His presence makes them greater.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const list = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const cell = g.board[k.r + dr] && g.board[k.r + dr][k.c + dc];
          if (cell && cell.c === s && cell.t !== 'k') list.push({ r: k.r + dr, c: k.c + dc, cell });
        }
        return Fx.upgradeSq(g, list, 2);
      } },

    { id: 197, name: 'Final Stand', icon: '🏔️', rarity: 4, cat: 'Kingship',
      desc: 'If you are in check, destroy the checking piece AND shield all your pieces.',
      flavor: 'The last line holds.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        if (E.inCheck(g, s)) {
          const checkers = Fx.checkers(g, s);
          const t = Fx.rand(checkers);
          if (t) { Fx.removeAt(g, t.r, t.c, {}); lines.push('You strike down a checker!'); }
          else lines.push('The check comes from an untouchable source.');
        }
        const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
        if (n) lines.push('Your whole army is shielded.');
        return lines;
      } },

    { id: 198, name: 'Sacred Ground', icon: '🛐', rarity: 3, cat: 'Buff',
      desc: 'All friendly pieces adjacent to your king are shielded and upgraded one tier.',
      flavor: 'The ground itself fights for the faithful.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const list = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const cell = g.board[k.r + dr] && g.board[k.r + dr][k.c + dc];
          if (cell && cell.c === s && cell.t !== 'k') list.push({ r: k.r + dr, c: k.c + dc, cell });
        }
        const lines = Fx.upgradeSq(g, list, 1);
        Fx.statusOn(g, list, 's', 1, 'shield');
        return lines.concat(list.length ? ['The king\'s guard is blessed.'] : []);
      } },

    { id: 199, name: 'Ragnarok', icon: '🌋', rarity: 4, cat: 'Attack',
      desc: 'Destroy every enemy piece except their king, at the cost of one of your own pieces.',
      flavor: 'The end of all things. Almost.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.destroyAll(g, s, c => c.t !== 'k');
        const mine = own(g, s).filter(q => q.cell.t !== 'k');
        const victim = Fx.rand(mine);
        if (victim) { Fx.removeAt(g, victim.r, victim.c, {}); lines.push('The worldfire claims one of your own as fuel.'); }
        return lines.length ? lines : ['Ragnarok spares everyone.'];
      } },

    { id: 200, name: 'Ascended King', icon: '✨', rarity: 4, cat: 'Kingship',
      desc: 'Your king gains a second wind: shield it, teleport it safely, and take an extra move.',
      flavor: 'Kings do not die. They ascend.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const k = E.findKing(g, s);
        if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); lines.push('Your king is shielded.'); }
        lines.push(...Fx.kingTeleport(g, s, true));
        Fx.grantExtra(g, s, 1);
        lines.push('And time itself bends — move again!');
        return lines;
      } }
  ];
})();

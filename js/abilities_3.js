/* Mod Chess — Ability set 3/4 (IDs 101-150) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const E = MD.Engine, Fx = MD.Fx, O = MD.Fx.opp, pick = MD.pick;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);

  MD.AB_3 = [
    { id: 101, name: 'Rain of Fire', icon: '🎇', rarity: 3, cat: 'Attack',
      desc: 'Destroy 3 random enemy pieces of the lowest value first.',
      flavor: 'The weak burn first; the strong burn last.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 3, { prefer: 'low' }) },

    { id: 102, name: 'Judgment', icon: '⚖️', rarity: 3, cat: 'Attack',
      desc: 'Destroy the enemy\'s most powerful piece, unless it is their king.',
      flavor: 'The scales always tip toward the crown.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { prefer: 'high' }) },

    { id: 103, name: 'Kraken\'s Reach', icon: '🐙', rarity: 3, cat: 'Chaos',
      desc: 'Pull the most advanced enemy pawn into your own camp — it joins you.',
      flavor: 'The tentacle drags deserters home.',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
        const t = pawns[0];
        if (!t) return [];
        const row = Fx.pawnRow(g, s);
        const empties = Fx.emptySq(g, r => r === row);
        const dest = Fx.rand(empties);
        if (!dest) return [];
        Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
        t.cell.c = s;
        return ['A captured enemy pawn is dragged to your back lines.'];
      } },

    { id: 104, name: 'Whirlwind', icon: '🌪️', rarity: 2, cat: 'Chaos',
      desc: 'Rotate the four pieces directly around your king clockwise.',
      flavor: 'The court spins like a hurricane.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const sq = [[-1, 0], [0, 1], [1, 0], [0, -1]].map(([dr, dc]) => ({ r: k.r + dr, c: k.c + dc }))
          .filter(q => q.r >= 0 && q.r < Fx.bd(g) && q.c >= 0 && q.c < Fx.bd(g));
        if (sq.length < 2) return [];
        const cells = sq.map(q => g.board[q.r][q.c]);
        for (let i = 0; i < sq.length; i++) {
          const next = sq[(i + 1) % sq.length];
          const cur = sq[i];
          if (cells[i]) E.revokeLeave(g, cur.r, cur.c, cells[i]);
          if (cells[i]) g.board[next.r][next.c] = cells[i];
          g.board[cur.r][cur.c] = null;
        }
        g.ep = null;
        return ['Everything around the king spins!'];
      } },

    { id: 105, name: 'Black Hole', icon: '🕳️', rarity: 4, cat: 'Attack',
      desc: 'Choose an empty square — it collapses, destroying every enemy piece in the surrounding ring (kings are never swallowed).',
      flavor: 'Even light does not escape.',
      target: 'emptyAny',
      run: (g, s, sq) => {
        const q = pick(g, s, sq, 'emptyAny');
        if (!q) return [];
        const gone = [];
        for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
          const cell = g.board[r][c];
          if (!cell || cell.c !== O(s) || cell.t === 'k') continue;
          if (Math.max(Math.abs(r - q.r), Math.abs(c - q.c)) === 2) { Fx.removeAt(g, r, c, {}); gone.push(cell); }
        }
        return gone.length ? ['The black hole swallows ' + gone.length + ' enemy piece' + (gone.length > 1 ? 's' : '') + '!'] : ['The ring is empty.'];
      } },

    { id: 106, name: 'Implosion', icon: '🧨', rarity: 3, cat: 'Attack',
      desc: 'Destroy the enemy piece with the fewest legal moves left (the trapped one).',
      flavor: 'The cornered rat dies first.',
      target: 'auto',
      run: (g, s) => {
        const foe = O(s);
        const fromCount = {};
        for (const m of E.legalMoves(g, foe)) {
          const key = m.r0 * Fx.bd(g) + m.c0;
          fromCount[key] = (fromCount[key] || 0) + 1;
        }
        const scored = en(g, s).filter(q => q.cell.t !== 'k').map(q => ({ q, n: fromCount[q.r * Fx.bd(g) + q.c] || 0 }))
          .sort((a, b) => a.n - b.n);
        if (!scored.length) return [];
        Fx.removeAt(g, scored[0].q.r, scored[0].q.c, {});
        return ['The most trapped enemy piece is destroyed.'];
      } },

    { id: 107, name: 'Coup de Grâce', icon: '🪦', rarity: 2, cat: 'Attack',
      desc: 'Destroy a random enemy piece that is currently pinned to its king.',
      flavor: 'They could not move. Now they cannot move at all.',
      target: 'auto',
      run: (g, s) => {
        const foe = O(s);
        const legalSet = new Set(E.legalMoves(g, foe).map(m => m.r0 * Fx.bd(g) + m.c0));
        const pinned = en(g, s).filter(q => !legalSet.has(q.r * Fx.bd(g) + q.c) && q.cell.t !== 'k');
        const t = Fx.rand(pinned.length ? pinned : en(g, s).filter(q => q.cell.t !== 'k'));
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['A blade finds the defenseless enemy ' + MD.pieceName(t.cell.t) + '.'];
      } },

    { id: 108, name: 'Warp Strike', icon: '🛸', rarity: 2, cat: 'Attack',
      desc: 'Destroy the enemy piece that is closest to your king.',
      flavor: 'They brought the war to your door.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        foes.sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)));
        const t = foes[0];
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['The nearest threat is erased from the board.'];
      } },

    { id: 109, name: 'Long Shot', icon: '🎯', rarity: 2, cat: 'Attack',
      desc: 'Destroy the enemy piece furthest from your king.',
      flavor: 'Out of sight is not out of range.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        foes.sort((a, b) => (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)) - (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)));
        const t = foes[0];
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['A sniper\'s bolt finds the distant enemy ' + MD.pieceName(t.cell.t) + '.'];
      } },

    { id: 110, name: 'Collateral', icon: '💣', rarity: 2, cat: 'Attack',
      desc: 'Destroy a random enemy piece AND a random friendly pawn (collateral damage).',
      flavor: 'No plan survives contact with your own artillery.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.destroyN(g, s, 1);
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const mine = Fx.rand(pawns);
        if (mine) { Fx.removeAt(g, mine.r, mine.c, {}); lines.push('...and one of your own pawns. Collateral.'); }
        return lines;
      } },

    { id: 111, name: 'Sacrifice', icon: '🕯️', rarity: 3, cat: 'Attack',
      desc: 'Destroy one of your own pieces to destroy TWO random enemy pieces.',
      flavor: 'Everything has a price. Everything.',
      target: 'auto',
      run: (g, s) => {
        const mine = own(g, s).filter(q => q.cell.t !== 'k');
        const victim = Fx.rand(mine);
        if (!victim) return [];
        Fx.removeAt(g, victim.r, victim.c, {});
        const lines = Fx.destroyN(g, s, 2);
        lines.unshift('You sacrifice your ' + MD.pieceName(victim.cell.t) + '...');
        return lines;
      } },

    { id: 112, name: 'Blood Price', icon: '🩸', rarity: 4, cat: 'Attack',
      desc: 'Destroy the enemy queen, but your king is frozen for a turn.',
      flavor: 'A crown for a crown.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.destroyN(g, s, 1, { only: 'q' });
        if (!lines.length) return ['The enemy queen is already gone — wasted ritual.'];
        const k = E.findKing(g, s);
        if (k) { Fx.mod(g.board[k.r][k.c], 'f', 1); Fx.flash(g, k.r, k.c, 'freeze', ''); lines.push('Your king is frozen by the ritual\'s toll.'); }
        return lines;
      } },

    { id: 113, name: 'Elemental Shift', icon: '🧪', rarity: 2, cat: 'Transform',
      desc: 'Turn a random friendly minor piece into a rook.',
      flavor: 'Fire into iron.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).filter(q => q.cell.t === 'b' || q.cell.t === 'n');
        const t = Fx.rand(pool);
        return t ? Fx.transformSq(g, [t], 'r', () => 'A minor piece is reforged as a Rook.') : [];
      } },

    { id: 114, name: 'Alchemy', icon: '⚗️', rarity: 3, cat: 'Transform',
      desc: 'Turn a random friendly minor piece into a queen.',
      flavor: 'Lead into gold. Knights into queens.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).filter(q => q.cell.t === 'b' || q.cell.t === 'n' || q.cell.t === 'r');
        const t = Fx.rand(pool);
        return t ? Fx.transformSq(g, [t], 'q', () => 'Transmutation complete: now a Queen.') : [];
      } },

    { id: 115, name: 'Berserker Rage', icon: '🪓', rarity: 2, cat: 'Transform',
      desc: 'Turn a random friendly rook into a queen that fights twice as hard.',
      flavor: 'The tower screams and becomes something greater.',
      target: 'auto',
      run: (g, s) => {
        const r = Fx.rand(own(g, s).filter(q => q.cell.t === 'r'));
        return r ? Fx.transformSq(g, [r], 'q', () => 'A rook rages into a Queen!') : [];
      } },

    { id: 116, name: 'Polymorph', icon: '🦎', rarity: 2, cat: 'Transform',
      desc: 'Choose an enemy major piece — it becomes a lowly pawn.',
      flavor: 'The powerful, humbled.',
      target: 'enemyMajor',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'enemyMajor');
        return t ? Fx.transformSq(g, [t], 'p', () => 'An enemy ' + MD.pieceName(t.cell.t) + ' collapses into a Pawn!') : [];
      } },

    { id: 117, name: 'Petrify', icon: '🪦', rarity: 2, cat: 'Status',
      desc: 'Petrify an enemy piece of your choosing: it is sealed in stone — unable to move or be captured until one of its own turns passes.',
      flavor: 'Choose who becomes a statue.',
      target: 'enemyAny',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'enemyAny');
        if (!t) return [];
        Fx.mod(t.cell, 'st', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is petrified — a statue that cannot move or be captured.'];
      } },

    { id: 118, name: 'Crystal Coffin', icon: '💎', rarity: 3, cat: 'Status',
      desc: 'Seal the strongest enemy non-king piece in crystal: it cannot move or be captured until one of its own turns passes.',
      flavor: 'A prison of perfect clarity.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k')
          .sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        const top = pool[0];
        if (!top) return [];
        Fx.mod(top.cell, 'st', 1); Fx.flash(g, top.r, top.c, 'freeze', '');
        return ['The enemy ' + MD.pieceName(top.cell.t) + ' is sealed in crystal — immobile and un-capturable until its own turn passes.'];
      } },

    { id: 119, name: 'Frost Nova', icon: '🧊', rarity: 2, cat: 'Status',
      desc: 'Freeze every enemy piece adjacent to your king.',
      flavor: 'Cold radiates from the crown.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const cell = g.board[k.r + dr] && g.board[k.r + dr][k.c + dc];
          if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.mod(cell, 'f', 1); Fx.flash(g, k.r + dr, k.c + dc, 'freeze', ''); n++; }
        }
        return n ? ['An icy ring freezes ' + n + ' nearby enemy piece' + (n > 1 ? 's' : '') + '.'] : ['The frost finds no enemies nearby.'];
      } },

    { id: 120, name: 'Sanctuary', icon: '🕊️', rarity: 2, cat: 'Buff',
      desc: 'Shield every friendly piece adjacent to your king.',
      flavor: 'Holy ground follows the king.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const cell = g.board[k.r + dr] && g.board[k.r + dr][k.c + dc];
          if (cell && cell.c === s) { Fx.mod(cell, 's', 1); Fx.flash(g, k.r + dr, k.c + dc, 'shield', ''); n++; }
        }
        return n ? ['A holy aura shields your royal guard.'] : [];
      } },

    { id: 121, name: 'Last Stand', icon: '🛡️', rarity: 4, cat: 'Buff',
      desc: 'Shield ALL of your pieces AND freeze all enemy pieces adjacent to your king.',
      flavor: 'Here we stand, and here we die — but not today.',
      target: 'auto',
      run: (g, s) => {
        const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
        const k = E.findKing(g, s);
        let froze = 0;
        if (k) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const cell = g.board[k.r + dr] && g.board[k.r + dr][k.c + dc];
          if (cell && cell.c === O(s) && cell.t !== 'k') { Fx.mod(cell, 'f', 1); froze++; }
        }
        return ['Every ally is shielded' + (froze ? '; nearby foes frozen.' : '.')];
      } },

    { id: 122, name: 'Divine Shield', icon: '😇', rarity: 3, cat: 'Buff',
      desc: 'Shield your king AND your queen for the next enemy turn.',
      flavor: 'The divine protects its chosen two.',
      target: 'auto',
      run: (g, s) => {
        const list = [];
        const k = E.findKing(g, s); if (k) list.push({ r: k.r, c: k.c });
        const q = own(g, s).find(x => x.cell.t === 'q'); if (q) list.push({ r: q.r, c: q.c });
        const n = Fx.statusOn(g, list, 's', 1, 'shield');
        return n ? ['Light envelops your king and queen.'] : [];
      } },

    { id: 123, name: 'Mana Surge', icon: '💠', rarity: 2, cat: 'Buff',
      desc: 'Mana floods the humblest vessel — promote a random friendly pawn to a BISHOP at once.',
      flavor: 'The magic finds the humblest vessel.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = Fx.rand(pawns);
        return p ? Fx.transformSq(g, [p], 'b', () => 'A pawn is suffused with mana — now a Bishop.') : [];
      } },

    { id: 124, name: 'Runic Growth', icon: '🔤', rarity: 3, cat: 'Buff',
      desc: 'Upgrade ALL friendly knights to rooks.',
      flavor: 'The runes rewrite their purpose.',
      target: 'auto',
      run: (g, s) => {
        const ns = own(g, s).filter(q => q.cell.t === 'n');
        return Fx.transformSq(g, ns, 'r', () => 'A knight becomes a Rook!');
      } },

    { id: 125, name: 'Sword of Light', icon: '🗡️', rarity: 3, cat: 'Attack',
      desc: 'Destroy the enemy piece directly in front of your king (same file, nearest).',
      flavor: 'The king\'s gaze burns.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const dir = s === 'w' ? -1 : 1;
        let r = k.r + dir;
        while (r >= 0 && r < Fx.bd(g)) {
          const cell = g.board[r][k.c];
          if (cell) {
            // the beam cannot touch the enemy king — regicide is not a spell
            if (cell.c === O(s) && cell.t !== 'k') { Fx.removeAt(g, r, k.c, {}); return ['A beam of light annihilates the piece at ' + sn(r, k.c) + '.']; }
            break;
          }
          r += dir;
        }
        return ['No foe stands in the king\'s sightline.'];
      } },

    { id: 126, name: 'Cannonade', icon: '💣', rarity: 3, cat: 'Attack',
      desc: 'Destroy the entire file of your strongest piece\'s column.',
      flavor: 'One gun. One file. No survivors.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        const big = pool[0];
        if (!big) return [];
        const col = big.c;
        const hit = en(g, s).filter(q => q.c === col && q.cell.t !== 'k');
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['Cannon fire clears file ' + 'abcdefghijkl'[col] + '.']
          : ['The cannon finds only the enemy king — it holds the line.'];
      } },

    { id: 127, name: 'Sweeping Lance', icon: '🔱', rarity: 2, cat: 'Attack',
      desc: 'Destroy all enemy pieces on your king\'s entire rank.',
      flavor: 'A spear the width of the world.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const row = k.r;
        const hit = en(g, s).filter(q => q.r === row);
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['Your rank is swept clean of foes.'] : [];
      } },

    { id: 128, name: 'Enfilade', icon: '🩸', rarity: 2, cat: 'Attack',
      desc: 'Destroy every enemy piece on the file where you have the most pieces.',
      flavor: 'Concentrate force. Break the line.',
      target: 'auto',
      run: (g, s) => {
        const counts = Array.from({ length: Fx.bd(g) }, () => 0);
        for (const q of own(g, s)) counts[q.c]++;
        let best = 0; for (let c = 1; c < Fx.bd(g); c++) if (counts[c] > counts[best]) best = c;
        const hit = en(g, s).filter(q => q.cell.t !== 'k' && q.c === best);
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['Overwhelming force erases file ' + 'abcdefghijkl'[best] + '.'] : [];
      } },

    { id: 129, name: 'Rook Lift', icon: '🏗️', rarity: 2, cat: 'Chaos',
      desc: 'Move a random friendly rook to your most advanced pawn\'s file.',
      flavor: 'The tower glides to support the push.',
      target: 'auto',
      run: (g, s) => {
        const rooks = own(g, s).filter(q => q.cell.t === 'r');
        const r = Fx.rand(rooks);
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        if (!pawns.length || !r) return [];
        pawns.sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
        const lead = pawns[0];
        const empties = Fx.emptySq(g, rr => rr === lead.r && rr !== r.r);
        const dest = Fx.rand(empties);
        if (!dest) return [];
        Fx.relocate(g, r.r, r.c, dest.r, dest.c, {});
        return ['Your rook repositions to support the front line.'];
      } },

    { id: 130, name: 'Knights\' Tour', icon: '♘', rarity: 1, cat: 'Chaos',
      desc: 'Move a random friendly knight anywhere empty.',
      flavor: 'Knights go where they please.',
      target: 'auto',
      run: (g, s) => {
        const ns = own(g, s).filter(q => q.cell.t === 'n');
        const t = Fx.rand(ns);
        return t ? Fx.teleportToEmpty(g, t, {}) : [];
      } },

    { id: 131, name: 'Bishop\'s Pilgrimage', icon: '⛪', rarity: 1, cat: 'Chaos',
      desc: 'Move a random friendly bishop to any empty square.',
      flavor: 'The pilgrim walks where the spirit leads.',
      target: 'auto',
      run: (g, s) => {
        const bs = own(g, s).filter(q => q.cell.t === 'b');
        const t = Fx.rand(bs);
        return t ? Fx.teleportToEmpty(g, t, {}) : [];
      } },

    { id: 132, name: 'Rook Slide', icon: '📐', rarity: 1, cat: 'Chaos',
      desc: 'Slide a random friendly rook along its rank to the edge of the board.',
      flavor: 'Straight to the wall, always.',
      target: 'auto',
      run: (g, s) => {
        const rooks = own(g, s).filter(q => q.cell.t === 'r');
        const t = Fx.rand(rooks);
        if (!t) return [];
        // slide toward the far edge first; then any open square on its rank
        let dests = [];
        const rank = Fx.emptySq(g, (r, c) => r === t.r);
        const far = rank.sort((a, b) => Math.abs(b.c - t.c) - Math.abs(a.c - t.c))[0];
        if (far) dests.push(far);
        const dest = Fx.rand(dests);
        if (dest) {
          Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
          return ['Your rook slides to the edge of the board.'];
        }
        // crowded file: leap to any open square to keep the army fluid
        const open = Fx.rand(Fx.emptySq(g));
        if (open) {
          Fx.relocate(g, t.r, t.c, open.r, open.c, {});
          return ['Your rook redeploys to an open square.'];
        }
        return [];
      } },

    { id: 133, name: 'Pawn Storm', icon: '🌊', rarity: 2, cat: 'Chaos',
      desc: 'Advance ALL of your pawns one square (if empty ahead).',
      flavor: 'A grey tide that never stops.',
      target: 'auto',
      run: (g, s) => {
        let moved = 0;
        const dir = s === 'w' ? -1 : 1;
        const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (dir === -1 ? a.r - b.r : b.r - a.r));
        for (const q of pawns) {
          const nr = q.r + dir;
          if (nr < 0 || nr >= Fx.bd(g)) continue;
          if (!g.board[nr][q.c]) { Fx.relocate(g, q.r, q.c, nr, q.c, {}); moved++; }
        }
        return moved ? ['A wall of pawns surges forward!'] : ['The pawns are held in place.'];
      } },

    { id: 134, name: 'Tide of War', icon: '🌊', rarity: 3, cat: 'Chaos',
      desc: 'Push every piece (both sides) one square toward the enemy side.',
      flavor: 'War itself flows downhill.',
      target: 'auto',
      run: (g, s) => {
        let moved = 0;
        for (let rr = 0; rr < Fx.bd(g); rr++) for (let c = 0; c < Fx.bd(g); c++) {
          const cell = g.board[rr][c];
          if (!cell) continue;
          const dr = cell.c === 'w' ? -1 : 1;
          if (g.board[rr + dr] && !g.board[rr + dr][c]) { Fx.relocate(g, rr, c, rr + dr, c, {}); moved++; }
        }
        return moved ? ['The whole board surges toward the enemy!'] : [];
      } },

    { id: 135, name: 'Anchor', icon: '⚓', rarity: 1, cat: 'Buff',
      desc: 'Shield a random friendly pawn for the next enemy turn.',
      flavor: 'The first pawn shall not fall.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const t = Fx.rand(pawns);
        if (!t) return [];
        Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', '');
        return ['A pawn is wrapped in protective light.'];
      } },

    { id: 136, name: 'Bulwark', icon: '🧱', rarity: 2, cat: 'Buff',
      desc: 'Shield ALL friendly pawns for the next enemy turn.',
      flavor: 'The wall of shields holds.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const n = Fx.statusOn(g, pawns, 's', 1, 'shield');
        return n ? ['Every pawn is protected.'] : [];
      } },

    { id: 137, name: 'Bastion', icon: '🏰', rarity: 2, cat: 'Buff',
      desc: 'Summon a wall of four friendly pawns across your second rank.',
      flavor: 'A fortress rises in seconds.',
      target: 'auto',
      run: (g, s) => {
        const row = Fx.pawnRow(g, s);
        const h = Fx.half(g);
        const cols = [h - 2, h - 1, h, h + 1];
        return Fx.wallOfPawns(g, s, row, cols);
      } },

    { id: 138, name: 'Moat', icon: '💧', rarity: 1, cat: 'Curse',
      desc: 'The enemy\'s most advanced pawn drowns (destroyed).',
      flavor: 'Water finds the lowest and the leading.',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
        const t = pawns[0];
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['The leading enemy pawn is swept away by a sudden moat.'];
      } },

    { id: 139, name: 'Quicksand', icon: '🏜️', rarity: 1, cat: 'Curse',
      desc: 'Poison a random enemy pawn — it sinks at the end of its turn.',
      flavor: 'The ground remembers grudges.',
      target: 'auto',
      run: (g, s) => Fx.poisonN(g, s, 1) },

    { id: 140, name: 'Sandstorm', icon: '🌵', rarity: 2, cat: 'Curse',
      desc: 'Poison two random enemy pieces.',
      flavor: 'Grit in every gear.',
      target: 'auto',
      run: (g, s) => Fx.poisonN(g, s, 2) },

    { id: 141, name: 'Venomous Fang', icon: '🐍', rarity: 1, cat: 'Curse',
      desc: 'Poison a random enemy knight or bishop.',
      flavor: 'The serpent favors the clever.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b');
        const t = Fx.rand(pool);
        if (!t) return [];
        Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is bitten by a venomous fang.'];
      } },

    { id: 142, name: 'Curse of Sloth', icon: '😴', rarity: 2, cat: 'Status',
      desc: 'Freeze two random enemy pieces.',
      flavor: 'They will get to it. Eventually.',
      target: 'auto',
      run: (g, s) => Fx.freezeN(g, s, 2) },

    { id: 143, name: 'Gilded Cage', icon: '🦜', rarity: 3, cat: 'Status',
      desc: 'Freeze the enemy queen for a turn.',
      flavor: 'Even queens have gilded cages.',
      target: 'auto',
      run: (g, s) => {
        const q = en(g, s).filter(x => x.cell.t === 'q');
        const t = Fx.rand(q);
        if (!t) return [];
        Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['The enemy queen is frozen in place.'];
      } },

    { id: 144, name: 'Thornbush', icon: '🌹', rarity: 1, cat: 'Summon',
      desc: 'Summon a friendly pawn on the square right in front of your most advanced pawn.',
      flavor: 'Thorns grow where the vanguard treads.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
        const lead = pawns[0];
        if (!lead) return [];
        const nr = lead.r + (s === 'w' ? -1 : 1);
        if (nr < 0 || nr >= Fx.bd(g)) return [];
        if (g.board[nr][lead.c]) return ['The thorns find no room to grow.'];
        Fx.place(g, s, 'p', nr, lead.c, {});
        return ['A thorny pawn sprouts at ' + sn(nr, lead.c) + '.'];
      } },

    { id: 145, name: 'Twin Towers', icon: '🏯', rarity: 2, cat: 'Summon',
      desc: 'Summon two friendly rooks on the corners of your back rank if free.',
      flavor: 'Two towers frame the kingdom.',
      target: 'auto',
      run: (g, s) => {
        const n = g.n || 8;
        const row = s === 'w' ? n - 1 : 0;
        const lines = [];
        const tried = new Set();
        const order = [];
        for (let a = 0, b = n - 1; a <= b; a++, b--) { order.push(a); if (a !== b) order.push(b); }
        for (const c of order) {
          if (lines.length >= 2) break;
          if (g.board[row][c]) continue;
          Fx.place(g, s, 'r', row, c, {}); lines.push('A rook tower rises on ' + sn(row, c) + '.');
          tried.add(c);
        }
        if (lines.length < 2) {
          // back rank locked down: raise towers on any open ground ahead
          const h = n >> 1;
          const near = Fx.emptySq(g, (r, c) => s === 'w' ? r >= h - 1 : r <= h);
          const extra = near.filter(q => !tried.has(q.c)).slice(0, 2 - lines.length);
          for (const sp of extra) { Fx.place(g, s, 'r', sp.r, sp.c, {}); lines.push('A rook tower rises on ' + sn(sp.r, sp.c) + '.'); }
        }
        if (!lines.length) return ['No ground remains for the towers.'];
        return lines;
      } },

    { id: 146, name: 'Stone Circle', icon: '🪨', rarity: 2, cat: 'Summon',
      desc: 'Summon three friendly pawns surrounding your queen (if free).',
      flavor: 'Druids protect their highest priestess.',
      target: 'auto',
      run: (g, s) => {
        const q = own(g, s).find(x => x.cell.t === 'q');
        if (!q) return [];
        const spots = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = q.r + dr, c = q.c + dc;
          if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
        }
        const lines = [];
        for (const sp of spots.slice(0, 3)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A standing stone pawn rises beside the queen.'); }
        if (lines.length < 3) {
          // the circle widens when the queen's guard ring is full
          const ring = Fx.emptySq(g, (r, c) => Math.abs(r - q.r) <= 2 && Math.abs(c - q.c) <= 2);
          const spare = ring.filter(sp => !spots.some(o => o.r === sp.r && o.c === sp.c)).slice(0, 3 - lines.length);
          for (const sp of spare) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A standing stone pawn rises as the circle widens.'); }
        }
        if (!lines.length) return ['The druids find no ground for their stones.'];
        return lines;
      } },

    { id: 147, name: 'Ranger', icon: '🏹', rarity: 1, cat: 'Summon',
      desc: 'Summon a friendly bishop near the center of the board.',
      flavor: 'A scout who answers only to the wilds.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'b', 1, { rows: [3, 4] }) },

    { id: 148, name: 'Hidden Blade', icon: '🗡️', rarity: 1, cat: 'Summon',
      desc: 'Summon a friendly knight in the center of the board.',
      flavor: 'From the shadows, a hoofbeat.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'n', 1, { rows: [3, 4] }) },

    { id: 149, name: 'Escort Wings', icon: '🕊️', rarity: 2, cat: 'Chaos',
      desc: 'Swap your queen with a random friendly rook.',
      flavor: 'The queen borrows the tower\'s reach.',
      target: 'auto',
      run: (g, s) => {
        const q = own(g, s).find(x => x.cell.t === 'q');
        const r = Fx.rand(own(g, s).filter(x => x.cell.t === 'r'));
        if (!q || !r) return [];
        Fx.swapSq(g, q, r);
        return ['The queen and her tower trade places!'];
      } },

    { id: 150, name: 'Shadow Step', icon: '🌑', rarity: 2, cat: 'Chaos',
      desc: 'Swap any two of your pawns.',
      flavor: 'They were never where you thought.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        if (pawns.length < 2) return [];
        const a = Fx.rand(pawns);
        const b = Fx.rand(pawns.filter(q => q !== a));
        Fx.swapSq(g, a, b);
        return ['Two pawns trade places unseen.'];
      } }
  ];
})();

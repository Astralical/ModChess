/* Mod Chess — Ability set 2/4 (IDs 51-100) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;

  const E = MD.Engine, Fx = MD.Fx, O = MD.Fx.opp, pick = MD.pick;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);

  MD.AB_2 = [
    { id: 51, name: 'Smite', icon: '🔨', rarity: 2, cat: 'Attack',
      desc: 'Destroy a random enemy piece worth at least a rook.',
      flavor: 'Judgment, delivered by hammer.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { minVal: 500 }) },

    { id: 52, name: 'Twin Fang', icon: '🐍', rarity: 2, cat: 'Attack',
      desc: 'Destroy two random enemy pawns.',
      flavor: 'The serpent strikes low, where armies are weakest.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 2, { only: 'p' }) },

    { id: 53, name: 'Cull the Weak', icon: '⚖️', rarity: 2, cat: 'Attack',
      desc: 'Destroy every enemy pawn.',
      flavor: 'No pawn shall survive the harvest.',
      target: 'auto',
      run: (g, s) => Fx.destroyAll(g, s, c => c.t === 'p') },

    { id: 54, name: 'Shatter', icon: '💥', rarity: 3, cat: 'Attack',
      desc: 'Pick a square — every enemy piece adjacent (8 cells) is destroyed.',
      flavor: 'The ground itself rebels.',
      target: 'emptyAny',
      run: (g, s, sq) => {
        const q = pick(g, s, sq, 'emptyAny');
        return q ? Fx.bomb(g, q.r, q.c, 1, { only: O(s), diag: true }) : [];
      } },

    { id: 55, name: 'Tectonic Rupture', icon: '🌋', rarity: 3, cat: 'Attack',
      desc: 'Destroy a random enemy piece and everything next to it.',
      flavor: 'The earth swallows a whole squad.',
      target: 'auto',
      run: (g, s) => {
        const t = Fx.rand(en(g, s).filter(q => q.cell.t !== 'k'));
        if (!t) return [];
        const lines = Fx.bomb(g, t.r, t.c, 1, { diag: false });
        Fx.removeAt(g, t.r, t.c, {});
        lines.push('The epicenter is lost.');
        return lines;
      } },

    { id: 56, name: 'Icicle Spear', icon: '🗡️', rarity: 1, cat: 'Attack',
      desc: 'Destroy a random enemy minor piece (bishop or knight).',
      flavor: 'A frozen lance through the ranks.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t === 'b' || q.cell.t === 'n');
        const t = Fx.rand(pool);
        if (!t) return [];
        Fx.removeAt(g, t.r, t.c, {});
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is impaled on a spear of ice.'];
      } },

    { id: 57, name: 'Harpoon', icon: '⚓', rarity: 1, cat: 'Attack',
      desc: 'Destroy a random enemy rook.',
      flavor: 'Even the mightiest tower can be dragged down.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { only: 'r' }) },

    { id: 58, name: 'Witch Bolt', icon: '🪄', rarity: 1, cat: 'Attack',
      desc: 'Destroy a random enemy knight.',
      flavor: 'A hex with a horseshoe in mind.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { only: 'n' }) },

    { id: 59, name: 'Hammer of Dawn', icon: '🌞', rarity: 3, cat: 'Attack',
      desc: 'Destroy a random enemy bishop and a random enemy knight.',
      flavor: 'Light purges the crooked and the swift alike.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const b = en(g, s).filter(q => q.cell.t === 'b'); const bb = Fx.rand(b);
        const n = en(g, s).filter(q => q.cell.t === 'n'); const nn = Fx.rand(n);
        if (bb) { Fx.removeAt(g, bb.r, bb.c, {}); lines.push('A bishop is unmade.'); }
        if (nn) { Fx.removeAt(g, nn.r, nn.c, {}); lines.push('A knight is unmade.'); }
        return lines;
      } },

    { id: 60, name: 'Chain Lightning', icon: '🌩️', rarity: 2, cat: 'Attack',
      desc: 'Destroy a random enemy piece, then a random enemy piece next to where it stood.',
      flavor: 'The bolt hops from helmet to helmet.',
      target: 'auto',
      run: (g, s) => {
        const first = Fx.rand(en(g, s).filter(q => q.cell.t !== 'k'));
        if (!first) return [];
        const lines = [];
        Fx.removeAt(g, first.r, first.c, {});
        lines.push('First arc strikes ' + sn(first.r, first.c) + '.');
        const neigh = en(g, s).filter(q => q.cell.t !== 'k' && Math.abs(q.r - first.r) <= 1 && Math.abs(q.c - first.c) <= 1);
        const second = Fx.rand(neigh);
        if (second) { Fx.removeAt(g, second.r, second.c, {}); lines.push('The arc leaps to ' + sn(second.r, second.c) + '!'); }
        return lines;
      } },

    { id: 61, name: 'Overcharge', icon: '🔋', rarity: 2, cat: 'Buff',
      desc: 'Upgrade two random friendly pawns into knights.',
      flavor: 'Too much power for a pawn\'s frame.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const picks = Fx.uniqN(pawns, 2);
        return Fx.transformSq(g, picks, 'n', c => 'A pawn becomes a Knight!');
      } },

    { id: 62, name: 'Ascension', icon: '⬆️', rarity: 3, cat: 'Buff',
      desc: 'Upgrade all friendly pawns on the board to bishops.',
      flavor: 'The congregation ascends.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        return Fx.transformSq(g, pawns, 'b', () => 'A pawn is elevated to Bishop.');
      } },

    { id: 63, name: 'Knighthood', icon: '🤴', rarity: 2, cat: 'Buff',
      desc: 'Choose one of your pawns and knight it.',
      flavor: 'Rise, Sir Pawn-a-lot.',
      target: 'ownPawn',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'ownPawn');
        return t ? Fx.transformSq(g, [t], 'n', () => 'Your pawn is knighted!') : [];
      } },

    { id: 64, name: 'Coronation', icon: '👸', rarity: 4, cat: 'Buff',
      desc: 'Choose one of your pawns and crown it a queen.',
      flavor: 'Born in the dirt, dies on a throne.',
      target: 'ownPawn',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'ownPawn');
        return t ? Fx.transformSq(g, [t], 'q', () => 'Your pawn is crowned Queen!') : [];
      } },

    { id: 65, name: 'Stone to Steel', icon: '🪨', rarity: 2, cat: 'Buff',
      desc: 'Upgrade a random friendly knight and a random friendly bishop to rooks.',
      flavor: 'An upgrade the smiths will sing about.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const n = Fx.rand(own(g, s).filter(q => q.cell.t === 'n'));
        const b = Fx.rand(own(g, s).filter(q => q.cell.t === 'b'));
        if (n) { n.cell.t = 'r'; Fx.flash(g, n.r, n.c, 'transform', ''); lines.push('A knight dons heavy plate — now a Rook.'); }
        if (b) { b.cell.t = 'r'; Fx.flash(g, b.r, b.c, 'transform', ''); lines.push('A bishop trades mitre for helm — now a Rook.'); }
        return lines;
      } },

    { id: 66, name: 'Rook\'s Might', icon: '🏯', rarity: 3, cat: 'Buff',
      desc: 'Upgrade a random friendly rook into a queen.',
      flavor: 'The tower grows a crown.',
      target: 'auto',
      run: (g, s) => {
        const r = Fx.rand(own(g, s).filter(q => q.cell.t === 'r'));
        return r ? Fx.transformSq(g, [r], 'q', () => 'Your rook is promoted to Queen!') : [];
      } },

    { id: 67, name: 'Final Form', icon: '💎', rarity: 4, cat: 'Buff',
      desc: 'Upgrade ALL of your non-pawn, non-king pieces into queens.',
      flavor: 'The endgame state: everything is a queen.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).filter(q => q.cell.t !== 'p' && q.cell.t !== 'k' && q.cell.t !== 'q');
        return Fx.transformSq(g, pool, 'q', () => 'A warrior achieves Final Form.');
      } },

    { id: 68, name: 'Wall of Spears', icon: '🪖', rarity: 1, cat: 'Summon',
      desc: 'Summon three friendly pawns on random empty squares.',
      flavor: 'Pikemen appear from the morning mist.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'p', 3) },

    { id: 69, name: 'Phantom Steeds', icon: '🌫️', rarity: 2, cat: 'Summon',
      desc: 'Summon two friendly knights on random empty squares.',
      flavor: 'Ghostly hooves, no sound at all.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'n', 2) },

    { id: 70, name: 'Keep', icon: '🏰', rarity: 2, cat: 'Summon',
      desc: 'Summon two friendly rooks on random empty squares.',
      flavor: 'A fortress, conjured mid-battle.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'r', 2) },

    { id: 71, name: 'Cleric Chorus', icon: '⛪', rarity: 2, cat: 'Summon',
      desc: 'Summon two friendly bishops on random empty squares.',
      flavor: 'They came to bless — and to smite.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'b', 2) },

    { id: 72, name: 'Queen\'s Gambit', icon: '♛', rarity: 4, cat: 'Summon',
      desc: 'Summon a friendly queen to YOUR back rank.',
      flavor: 'A second queen is a declaration of war.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'q', 1, { rows: [Fx.backRow(g, s)] }) },

    { id: 73, name: 'Frontline Reinforcements', icon: '🎖️', rarity: 2, cat: 'Summon',
      desc: 'Summon three friendly pawns on the front three ranks (toward the enemy).',
      flavor: 'Reinforcements arrive where the fighting is worst.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'p', 3, { rows: Fx.frontPawnRows(g, s) }) },

    { id: 74, name: 'Gravitational Anchor', icon: '🧲', rarity: 3, cat: 'Chaos',
      desc: 'Pull every enemy piece one square toward the center.',
      flavor: 'They cannot resist the pull.',
      target: 'auto',
      run: (g, s) => {
        const n = g.n || 8;
        let moved = 0;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
          const cell = g.board[r][c];
          if (!cell || cell.c !== O(s)) continue;
          const dr = Fx.towardMidRow(g, r);
          const dc = Fx.towardMidCol(g, c);
          if ((dr || dc) && !g.board[r + dr][c + dc]) { Fx.relocate(g, r, c, r + dr, c + dc, {}); moved++; }
        }
        return moved ? ['The enemy is dragged inward.'] : [];
      } },

    { id: 75, name: 'Scatter', icon: '💨', rarity: 2, cat: 'Chaos',
      desc: 'Teleport every friendly piece to a random empty square.',
      flavor: 'And then... nobody knew where anyone was.',
      target: 'auto',
      run: (g, s) => {
        let moved = 0;
        const mine = own(g, s).filter(q => q.cell.t !== 'k').slice().sort(() => Math.random() - 0.5);
        for (const q of mine) {
          const empties = Fx.emptySq(g);
          const dest = Fx.rand(empties);
          if (dest) { Fx.relocate(g, q.r, q.c, dest.r, dest.c, {}); moved++; }
        }
        return moved ? ['Your army scatters like startled crows.'] : [];
      } },

    { id: 76, name: 'Scatter the Enemy', icon: '🌪️', rarity: 2, cat: 'Chaos',
      desc: 'Teleport every enemy piece to a random empty square.',
      flavor: 'Formation is a privilege, not a right.',
      target: 'auto',
      run: (g, s) => {
        let moved = 0;
        const foes = en(g, s).filter(q => q.cell.t !== 'k').slice().sort(() => Math.random() - 0.5);
        for (const q of foes) {
          const dest = Fx.rand(Fx.emptySq(g));
          if (dest) { Fx.relocate(g, q.r, q.c, dest.r, dest.c, {}); moved++; }
        }
        return moved ? ['The enemy ranks dissolve into chaos.'] : [];
      } },

    { id: 77, name: 'Chaos Shuffle', icon: '🎲', rarity: 3, cat: 'Chaos',
      desc: 'Shuffle the positions of ALL non-king pieces randomly.',
      flavor: 'Nobody chose this battlefield.',
      target: 'auto',
      run: (g, s) => {
        const pieces = [];
        for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) {
          const cell = g.board[r][c];
          if (cell && cell.t !== 'k') { pieces.push({ cell }); E.revokeLeave(g, r, c, cell); g.board[r][c] = null; }
        }
        pieces.sort(() => Math.random() - 0.5);
        const empties = [];
        for (let r = 0; r < Fx.bd(g); r++) for (let c = 0; c < Fx.bd(g); c++) if (!g.board[r][c]) empties.push({ r, c });
        pieces.sort(() => Math.random() - 0.5);
        for (let i = 0; i < pieces.length && i < empties.length; i++) {
          const dest = empties[i]; const p = pieces[i];
          g.board[dest.r][dest.c] = p.cell;
        }
        g.ep = null; g.castle = { wk: false, wq: false, bk: false, bq: false };
        return ['Absolute pandemonium rearranges the board!'];
      } },

    { id: 78, name: 'Mirror World', icon: '🪞', rarity: 4, cat: 'Chaos',
      desc: 'Flip the entire board 180°. Every piece is mirrored.',
      flavor: 'In the mirror world, everyone is a little different.',
      target: 'auto',
      run: (g, s) => Fx.mirrorBoard(g) },

    { id: 79, name: 'King\'s Leap', icon: '🤸', rarity: 2, cat: 'Kingship',
      desc: 'Teleport your king to any random empty square far from the action.',
      flavor: 'Kings should not be where the fighting is.',
      target: 'auto',
      run: (g, s) => Fx.kingTeleport(g, s, true) },

    { id: 80, name: 'Regicide Rush', icon: '⚔️', rarity: 3, cat: 'Kingship',
      desc: 'Your king may leap to a random empty square anywhere on the board.',
      flavor: 'Sometimes the king must lead from the front.',
      target: 'auto',
      run: (g, s) => Fx.kingTeleport(g, s, false) },

    { id: 81, name: 'Royal Escort', icon: '🛡️', rarity: 2, cat: 'Kingship',
      desc: 'Summon two friendly pawns beside your king.',
      flavor: 'The crown is never unguarded for long.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        const spots = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = k.r + dr, c = k.c + dc;
          if (r >= 0 && r < Fx.bd(g) && c >= 0 && c < Fx.bd(g) && !g.board[r][c]) spots.push({ r, c });
        }
        const lines = [];
        for (const sp of spots.slice(0, 2)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A guard pawn appears at ' + sn(sp.r, sp.c) + '.'); }
        if (!lines.length) {
          // crowded court: raise the guard further out, then anywhere in own half
          const row = Fx.pawnRow(g, s);
          let pool = Fx.emptySq(g, (r, c) => r === row || r === Fx.backRow(g, s));
          if (!pool.length) pool = Fx.emptySq(g, (r, c) => Fx.inOwnHalf(g, s, r));
          for (const sp of pool.slice(0, 2)) { Fx.place(g, s, 'p', sp.r, sp.c, {}); lines.push('A guard pawn rallies at ' + sn(sp.r, sp.c) + '.'); }
          if (!lines.length) return ['The guard is scattered — your court is already sealed.'];
        }
        return lines;
      } },

    { id: 82, name: 'Crown Tax', icon: '💰', rarity: 2, cat: 'Economy',
      desc: 'Resurrect your most recently captured piece onto the board.',
      flavor: 'Every kingdom has a ransom fund.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 1) },

    { id: 83, name: 'War Chest', icon: '🪙', rarity: 1, cat: 'Economy',
      desc: 'Resurrect a random captured friendly pawn.',
      flavor: 'Somebody paid the mercenaries.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 1, { type: 'p' }) },

    { id: 84, name: 'Call of Valor', icon: '📯', rarity: 3, cat: 'Economy',
      desc: 'Resurrect one captured friendly piece of every type you have lost.',
      flavor: 'The fallen answer one last call.',
      target: 'auto',
      run: (g, s) => {
        const types = [...new Set(g.capt[s].filter(p => p.t !== 'k').map(p => p.t))];
        const lines = [];
        for (const t of types) lines.push(...Fx.revive(g, s, 1, { type: t }));
        return lines;
      } },

    { id: 85, name: 'Echoes of the Fallen', icon: '🫧', rarity: 4, cat: 'Economy',
      desc: 'Resurrect two of your strongest captured pieces.',
      flavor: 'The battlefield remembers its heroes.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 2) },

    { id: 86, name: 'Battle Trance', icon: '🥁', rarity: 2, cat: 'Buff',
      desc: 'Shield your two most advanced pawns.',
      flavor: 'The drumbeat makes them fearless.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r)).slice(0, 2);
        const n = Fx.statusOn(g, pawns, 's', 1, 'shield');
        return n ? ['Your vanguard is blessed.'] : [];
      } },

    { id: 87, name: 'Inspire', icon: '💪', rarity: 1, cat: 'Buff',
      desc: 'Shield two random friendly pieces for a turn.',
      flavor: 'Words can be armor.',
      target: 'auto',
      run: (g, s) => Fx.shieldN(g, s, 2, true) },

    { id: 88, name: 'Necrotic Rot', icon: '🧪', rarity: 2, cat: 'Curse',
      desc: 'Poison two random enemy pawns.',
      flavor: 'The fields themselves turn against them.',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p');
        const picks = Fx.uniqN(pawns, 2);
        const n = Fx.statusOn(g, picks, 'p', 1, 'poison');
        return n ? ['Enemy pawns begin to wither.'] : [];
      } },

    { id: 89, name: 'Lich Curse', icon: '💀', rarity: 3, cat: 'Curse',
      desc: 'Poison the enemy queen AND a random enemy piece.',
      flavor: 'Undying hatred finds its favorite target.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const q = en(g, s).filter(x => x.cell.t === 'q');
        if (q[0]) { Fx.mod(q[0].cell, 'p', 1); Fx.flash(g, q[0].r, q[0].c, 'poison', ''); lines.push('The enemy queen is cursed.'); }
        lines.push(...Fx.poisonN(g, s, 1));
        return lines;
      } },

    { id: 90, name: 'Winter\'s Grasp', icon: '🥶', rarity: 2, cat: 'Status',
      desc: 'Freeze a random enemy major piece (rook or queen).',
      flavor: 'The heavy hitters always freeze first.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t === 'r' || q.cell.t === 'q');
        const t = Fx.rand(pool);
        if (!t) return [];
        Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' is frozen solid.'];
      } },

    { id: 91, name: 'Flash Freeze', icon: '🌡️', rarity: 1, cat: 'Status',
      desc: 'Freeze a random enemy knight and bishop.',
      flavor: 'Cold steel, colder still.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const n = en(g, s).filter(q => q.cell.t === 'n');
        const b = en(g, s).filter(q => q.cell.t === 'b');
        for (const list of [n, b]) {
          const t = Fx.rand(list);
          if (t) { Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', ''); lines.push('Frozen: ' + MD.pieceName(t.cell.t)); }
        }
        return lines;
      } },

    { id: 92, name: 'Time Stop', icon: '⏸️', rarity: 4, cat: 'Time',
      desc: 'The enemy loses their next turn entirely. You act again.',
      flavor: 'You have all the time in the world. They have none.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['Time freezes for the enemy — act again!']; } },

    { id: 93, name: 'Haste', icon: '🏃', rarity: 2, cat: 'Time',
      desc: 'Take an extra move this turn.',
      flavor: 'Run faster than the other army.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['Your army surges forward — move again!']; } },

    { id: 94, name: 'Slow', icon: '🐌', rarity: 2, cat: 'Time',
      desc: 'The enemy\'s strongest piece is frozen for their next turn.',
      flavor: 'Everything is relative.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k')
          .sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        const top = pool[0];
        if (!top) return [];
        Fx.mod(top.cell, 'f', 1); Fx.flash(g, top.r, top.c, 'freeze', '');
        return ['The enemy ' + MD.pieceName(top.cell.t) + ' is slowed to a crawl.'];
      } },

    { id: 95, name: 'Foresight', icon: '🔭', rarity: 1, cat: 'Time',
      desc: 'Your next move may come after casting — take an extra move.',
      flavor: 'You already know how this plays out.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['The future is clear. Move again!']; } },

    { id: 96, name: 'Betrayal', icon: '🐍', rarity: 3, cat: 'Attack',
      desc: 'Steal the strongest enemy piece.',
      flavor: 'The highest bidder always wins.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        const t = pool[0];
        if (!t) return [];
        t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' switches sides!'];
      } },

    { id: 97, name: 'Convert', icon: '🔄', rarity: 2, cat: 'Attack',
      desc: 'Steal a random enemy pawn and add it to your army.',
      flavor: 'Turncoat!',
      target: 'auto',
      run: (g, s) => {
        const pawns = en(g, s).filter(q => q.cell.t === 'p');
        const t = Fx.rand(pawns);
        if (!t) return [];
        t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
        return ['An enemy pawn defects to your side.'];
      } },

    { id: 98, name: 'Sabotage', icon: '🧨', rarity: 2, cat: 'Curse',
      desc: 'Downgrade two random enemy pieces one tier.',
      flavor: 'Their equipment mysteriously breaks.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k' && q.cell.t !== 'p');
        const picks = Fx.uniqN(pool, 2);
        return Fx.downgradeSq(g, picks);
      } },

    { id: 99, name: 'Curse of Rust', icon: '🦀', rarity: 1, cat: 'Curse',
      desc: 'Downgrade a random enemy rook to a bishop.',
      flavor: 'Iron does not last forever.',
      target: 'auto',
      run: (g, s) => {
        const r = en(g, s).filter(q => q.cell.t === 'r');
        const t = Fx.rand(r);
        return t ? Fx.transformSq(g, [t], 'b', () => 'An enemy rook rusts into a Bishop.') : [];
      } },

    { id: 100, name: 'Demoralize', icon: '📉', rarity: 1, cat: 'Curse',
      desc: 'Downgrade a random enemy queen to a rook.',
      flavor: 'A queen without conviction is just a rook.',
      target: 'auto',
      run: (g, s) => {
        const q = en(g, s).filter(x => x.cell.t === 'q');
        const t = Fx.rand(q);
        return t ? Fx.transformSq(g, [t], 'r', () => 'The enemy queen is stripped of her crown.') : [];
      } }
  ];
})();

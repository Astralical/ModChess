/* Mod Chess — Ability set 1/4 (IDs 1-50) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx, O = MD.Fx.opp, pick = MD.pick;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);

  MD.AB_1 = [
    { id: 1, name: 'Fireball', icon: '🔥', rarity: 1, cat: 'Attack',
      desc: 'Engulf a random enemy piece in arcane fire.',
      flavor: 'Every wizard\'s first spell. Still works on rooks.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1) },

    { id: 2, name: 'Lightning Bolt', icon: '⚡', rarity: 1, cat: 'Attack',
      desc: 'Strike a random enemy pawn dead with a thunderbolt.',
      flavor: 'Nature\'s way of saying "pawn storm denied".',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { only: 'p' }) },

    { id: 3, name: 'Meteor Swarm', icon: '☄️', rarity: 3, cat: 'Attack',
      desc: 'Two meteors crash down, destroying two random enemy pieces.',
      flavor: 'The sky is falling. Twice.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 2) },

    { id: 4, name: 'Plague', icon: '🦠', rarity: 2, cat: 'Curse',
      desc: 'Poison two random enemy pieces — they explode at the end of their next turn.',
      flavor: 'Cough once for yes.',
      target: 'auto',
      run: (g, s) => Fx.poisonN(g, s, 2) },

    { id: 5, name: 'Vampiric Bite', icon: '🧛', rarity: 2, cat: 'Attack',
      desc: 'Destroy the strongest enemy piece, but one of your pawns also falls to the hunger.',
      flavor: 'A terrible price for terrible power.',
      target: 'auto',
      run: (g, s) => {
        const lines = Fx.destroyN(g, s, 1, { prefer: 'high' });
        const mine = own(g, s).filter(q => q.cell.t === 'p');
        const victim = Fx.rand(mine);
        if (victim) { Fx.removeAt(g, victim.r, victim.c, {}); lines.push('Your pawn is drained to dust.'); }
        return lines;
      } },

    { id: 6, name: 'Freezing Touch', icon: '❄️', rarity: 1, cat: 'Status',
      desc: 'Freeze a random enemy piece; it cannot move on its next turn.',
      flavor: 'Stay a while. Stay forever!',
      target: 'auto',
      run: (g, s) => Fx.freezeN(g, s, 1) },

    { id: 7, name: 'Blizzard', icon: '🌨️', rarity: 3, cat: 'Status',
      desc: 'Freeze every enemy piece on YOUR half of the board — only the vanguard that crossed the line feels the cold.',
      flavor: 'Snowfall stops the invasion at the border.',
      target: 'auto',
      run: (g, s) => {
        const rowCut = s === 'w' ? 4 : 3; // enemy pieces on the caster's half
        const targets = en(g, s).filter(q => q.cell.t !== 'k' && (s === 'w' ? q.r >= rowCut : q.r <= rowCut));
        const n = Fx.statusOn(g, targets, 'f', 1, 'freeze');
        return n ? ['A howling blizzard freezes the enemy vanguard on your side of the field!'] : ['The storm howls over empty fields — no foe has crossed the line.'];
      } },

    { id: 8, name: 'Iron Aegis', icon: '🛡️', rarity: 1, cat: 'Buff',
      desc: 'Shield a random friendly piece so it cannot be captured next turn.',
      flavor: 'Forged in the heart of a dying star.',
      target: 'auto',
      run: (g, s) => Fx.shieldN(g, s, 1, true) },

    { id: 9, name: 'Holy Aura', icon: '✨', rarity: 3, cat: 'Buff',
      desc: 'Shield your three highest-value pieces from capture for a turn.',
      flavor: 'The light bends around your champions.',
      target: 'auto',
      run: (g, s) => {
        const pool = own(g, s).sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t)).slice(0, 3);
        const n = Fx.statusOn(g, pool, 's', 1, 'shield');
        return n ? ['Divine light protects your mightiest.'] : [];
      } },

    { id: 10, name: 'Rally the Troops', icon: '🎺', rarity: 1, cat: 'Buff',
      desc: 'One random friendly pawn is promoted to a knight.',
      flavor: 'Heroism is contagious.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = Fx.rand(pawns);
        return p ? Fx.transformSq(g, [p], 'n', () => 'A pawn is promoted to Knight!') : [];
      } },

    { id: 11, name: 'Celestial Promotion', icon: '🌟', rarity: 3, cat: 'Transform',
      desc: 'A random friendly pawn ascends directly to a queen.',
      flavor: 'Rags to riches in 0.5 seconds.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = Fx.rand(pawns);
        if (!p) return [];
        p.cell.t = 'q';
        Fx.flash(g, p.r, p.c, 'transform', '');
        return ['A chosen pawn is crowned Queen on ' + sn(p.r, p.c) + '.'];
      } },

    { id: 12, name: 'Summon Imp', icon: '😈', rarity: 1, cat: 'Summon',
      desc: 'Conjure a mischievous Imp on a random empty square. Imps skitter one step in any direction.',
      flavor: 'Small, annoying, and somehow always in the way.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'imp', 1) },

    { id: 13, name: 'Summon Warhorse', icon: '🐎', rarity: 2, cat: 'Summon',
      desc: 'Conjure a Warhorse on a random empty square — it leaps like a knight and can also dart one diagonal step.',
      flavor: 'He answers only to the smell of battle.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'warhorse', 1) },

    { id: 14, name: 'Summon Guardian', icon: '🛡️', rarity: 2, cat: 'Summon',
      desc: 'Conjure a Guardian on a random empty square — it slides like a rook and guards its adjacent diagonals.',
      flavor: 'It has watched a thousand wars.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'guardian', 1) },

    { id: 15, name: 'Summon Archmage', icon: '🧙', rarity: 3, cat: 'Summon',
      desc: 'Conjure an Archmage on a random empty square — it slides on diagonals and may blink one step orthogonally.',
      flavor: 'He claims the diagonal is the most sacred line.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'archmage', 1) },

    { id: 16, name: 'Summon Phoenix', icon: '🐦‍🔥', rarity: 4, cat: 'Summon',
      desc: 'Conjure a Phoenix from the ashes on a random empty square — it moves like a queen AND strikes like a knight.',
      flavor: 'Death is merely a suggestion.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'phoenix', 1) },

    { id: 17, name: 'Army of One', icon: '🫡', rarity: 4, cat: 'Summon',
      desc: 'Conjure four friendly pawns on random empty squares.',
      flavor: 'Quantity has a quality all its own.',
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, 'p', 4) },

    { id: 18, name: 'Gravity Well', icon: '🌀', rarity: 2, cat: 'Chaos',
      desc: 'Every piece slides one square toward the center row.',
      flavor: 'Physics was already the house rules.',
      target: 'auto',
      run: (g, s) => {
        let moved = 0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          const cell = g.board[r][c];
          if (!cell) continue;
          const dr = r < 3 ? 1 : r > 4 ? -1 : 0;
          const dc = c < 3 ? 1 : c > 4 ? -1 : 0;
          if ((dr || dc) && !g.board[r + dr][c + dc]) { Fx.relocate(g, r, c, r + dr, c + dc, {}); moved++; }
        }
        return moved ? ['The board lurches toward its core.'] : [];
      } },

    { id: 19, name: 'Gravity Flip', icon: '🪐', rarity: 3, cat: 'Chaos',
      desc: 'All pawns slide one square forward; all other pieces slide one square backward.',
      flavor: 'Up is down. Forward is back.',
      target: 'auto',
      run: (g, s) => {
        let moved = 0;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          const cell = g.board[r][c];
          if (!cell) continue;
          const dr = cell.t === 'p' ? (cell.c === 'w' ? -1 : 1) : (cell.c === 'w' ? 1 : -1);
          if (g.board[r + dr] && !g.board[r + dr][c]) { Fx.relocate(g, r, c, r + dr, c, {}); moved++; }
        }
        return moved ? ['The whole army shuffles on command.'] : [];
      } },

    { id: 20, name: 'Time Warp', icon: '⏳', rarity: 4, cat: 'Time',
      desc: 'Take an extra move this turn (a fresh set of abilities is dealt).',
      flavor: 'The clock is merely a suggestion.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['Time bends to your will — move again!']; } },

    { id: 21, name: 'Second Wind', icon: '💨', rarity: 4, cat: 'Time',
      desc: 'Trade one of your pieces? No — just move twice. Take an extra move.',
      flavor: 'Just when they think you\'re done.',
      target: 'auto',
      run: (g, s) => { Fx.grantExtra(g, s, 1); return ['Your heart keeps beating. Move again!']; } },

    { id: 22, name: 'Twilight Realm', icon: '🌒', rarity: 3, cat: 'Time',
      desc: 'If you are in check right now, teleport your king to a random faraway safe square, then you still move.',
      flavor: 'Escape into the space between seconds.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        if (E.inCheck(g, s)) lines.push(...Fx.kingTeleport(g, s, true));
        return lines.length ? lines : ['The realm finds no one in peril.'];
      } },

    { id: 23, name: 'King\'s Gambit', icon: '👑', rarity: 3, cat: 'Kingship',
      desc: 'Swap the positions of your king and one random friendly rook.',
      flavor: 'A gamble as old as crowns.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        const rooks = own(g, s).filter(q => q.cell.t === 'r');
        const r = Fx.rand(rooks);
        if (!k || !r) return [];
        Fx.swapSq(g, k, r);
        return ['The crown and the tower trade places!'];
      } },

    { id: 24, name: 'Court Intrigue', icon: '🗡️', rarity: 2, cat: 'Curse',
      desc: 'Choose an enemy piece to lose its nerve — it is downgraded one step (Q→R→B→N→P).',
      flavor: 'Rumors spread faster than cavalry.',
      target: 'enemyAny',
      run: (g, s, sq) => {
        let t = pick(g, s, sq, 'enemyAny');
        if (t && t.cell.t === 'k') {
          // courtiers never touch the throne; the scheming falls on another
          const alt = Fx.rand(en(g, s).filter(q => q.cell.t !== 'k'));
          if (alt) t = alt;
        }
        return t ? Fx.downgradeSq(g, [t]) : [];
      } },

    { id: 25, name: 'Hex of Weakness', icon: '🕸️', rarity: 1, cat: 'Curse',
      desc: 'Downgrade the enemy\'s most powerful piece one tier.',
      flavor: 'Greatness, revoked by contract.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k')
          .sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        return pool[0] ? Fx.downgradeSq(g, [pool[0]]) : [];
      } },

    { id: 26, name: 'Transmogrify', icon: '🐸', rarity: 1, cat: 'Transform',
      desc: 'Choose an enemy piece and turn it into a lowly pawn.',
      flavor: 'Kiss your queen goodbye.',
      target: 'enemyAny',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'enemyAny');
        if (!t || t.cell.t === 'k') return [];
        return Fx.transformSq(g, [t], 'p', cell => 'A mighty foe becomes a pawn on ' + sn(t.r, t.c) + '.');
      } },

    { id: 27, name: 'Knightfall', icon: '🐴', rarity: 1, cat: 'Transform',
      desc: 'Turn a random enemy piece into a knight (chaos loves horsemen).',
      flavor: 'Everyone\'s a knight now. Nobody asked.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k' && q.cell.t !== 'n');
        const t = Fx.rand(pool);
        return t ? Fx.transformSq(g, [t], 'n', () => 'A foe shape-shifts into a knight!') : [];
      } },

    { id: 28, name: 'Frog Prince', icon: '🐸', rarity: 1, cat: 'Transform',
      desc: 'One random friendly pawn becomes a knight (frog? no—prince).',
      flavor: 'A single kiss. A full charge.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p');
        const p = Fx.rand(pawns);
        return p ? Fx.transformSq(g, [p], 'n', () => 'A pawn is knighted on the spot!') : [];
      } },

    { id: 29, name: 'Possession', icon: '👻', rarity: 3, cat: 'Attack',
      desc: 'Steal a random enemy piece — it switches sides where it stands.',
      flavor: 'Your general now works for the other team.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k');
        const t = Fx.rand(pool);
        if (!t) return [];
        t.cell.c = s;
        Fx.flash(g, t.r, t.c, 'move', '');
        Fx.clearEp(g);
        return ['An enemy ' + MD.pieceName(t.cell.t) + ' on ' + sn(t.r, t.c) + ' joins your cause!'];
      } },

    { id: 30, name: 'Mind Control', icon: '🧠', rarity: 4, cat: 'Attack',
      desc: 'Choose an enemy piece — it defects to your side where it stands. (The king is immune.)',
      flavor: 'The strongest weapon is the enemy\'s own.',
      target: 'enemyNonKing',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'enemyNonKing');
        if (!t) return [];
        t.cell.c = s;
        Fx.flash(g, t.r, t.c, 'move', '');
        Fx.clearEp(g);
        return [MD.pieceName(t.cell.t).charAt(0).toUpperCase() + MD.pieceName(t.cell.t).slice(1) + ' on ' + sn(t.r, t.c) + ' switches allegiance!'];
      } },

    { id: 31, name: 'Banish', icon: '🌀', rarity: 2, cat: 'Attack',
      desc: 'Send a random enemy piece back to its starting square.',
      flavor: 'Return to the shadows you crawled from.',
      target: 'auto',
      run: (g, s) => {
        const foes = en(g, s).filter(q => q.cell.t !== 'k');
        const t = Fx.rand(foes);
        if (!t) return [];
        let lines = Fx.returnHome(g, s, t);
        if (!lines.length) {
          // starting square sealed (or occupied): cast it anywhere open
          const dest = Fx.rand(Fx.emptySq(g));
          if (!dest) return [];
          Fx.relocate(g, t.r, t.c, dest.r, dest.c, {});
          Fx.clearEp(g);
          lines = ['The ' + MD.pieceName(t.cell.t) + ' is banished to ' + sn(dest.r, dest.c) + '!'];
        }
        return lines;
      } },

    { id: 32, name: 'Teleport Strike', icon: '📡', rarity: 2, cat: 'Chaos',
      desc: 'Teleport a random friendly piece to a random empty square.',
      flavor: 'The element of surprise, packaged and shipped.',
      target: 'auto',
      run: (g, s) => {
        const t = Fx.rand(own(g, s).filter(q => q.cell.t !== 'k'));
        return t ? Fx.teleportToEmpty(g, t, {}) : [];
      } },

    { id: 33, name: 'Blink', icon: '💠', rarity: 1, cat: 'Chaos',
      desc: 'Choose one of your pieces and teleport it anywhere empty.',
      flavor: 'Right behind you.',
      target: 'ownAny',
      run: (g, s, sq) => {
        const t = pick(g, s, sq, 'ownAny');
        if (!t || t.cell.t === 'k') return [];
        return Fx.teleportToEmpty(g, t, {});
      } },

    { id: 34, name: 'Rearguard', icon: '🏰', rarity: 2, cat: 'Chaos',
      desc: 'Pick TWO of your pieces (one at a time) and swap their squares.',
      flavor: 'The war room rearranges the board.',
      target: 'ownAny', twoPick: true,
      run: (g, s, sel) => {
        const ownList = own(g, s);
        const a = sel && sel.a ? { r: sel.a.r, c: sel.a.c } : Fx.rand(ownList);
        const rest = ownList.filter(q => !a || q.r !== a.r || q.c !== a.c);
        const b = sel && sel.b ? { r: sel.b.r, c: sel.b.c } : Fx.rand(rest);
        if (!a || !b || (a.r === b.r && a.c === b.c)) return ['The drill needs two different pieces.'];
        if (!g.board[a.r] || !g.board[a.r][a.c] || !g.board[b.r] || !g.board[b.r][b.c]) return [];
        Fx.swapSq(g, a, b);
        return ['Your two chosen pieces trade places in a practiced drill.'];
      } },

    { id: 35, name: 'Body Swap', icon: '🔁', rarity: 3, cat: 'Chaos',
      desc: 'Pick ANY two pieces on the board (one at a time) and swap their squares.',
      flavor: 'You are me. I am... a rook?',
      target: 'anyPiece', twoPick: true,
      run: (g, s, sel) => {
        const all = Fx.squares(g, () => true);
        const a = sel && sel.a ? { r: sel.a.r, c: sel.a.c } : Fx.rand(all);
        const rest = all.filter(q => !a || q.r !== a.r || q.c !== a.c);
        const b = sel && sel.b ? { r: sel.b.r, c: sel.b.c } : Fx.rand(rest);
        if (!a || !b || (a.r === b.r && a.c === b.c)) return ['The body swap needs two souls.'];
        if (!g.board[a.r] || !g.board[a.r][a.c] || !g.board[b.r] || !g.board[b.r][b.c]) return [];
        Fx.swapSq(g, a, b);
        return ['Your two chosen pieces trade bodies across the board!'];
      } },

    { id: 36, name: 'Great Swap', icon: '♻️', rarity: 4, cat: 'Chaos',
      desc: 'Swap your king with the enemy king\'s position.',
      flavor: 'Thrones, relocated.',
      target: 'auto',
      run: (g, s) => {
        const kw = E.findKing(g, 'w'), kb = E.findKing(g, 'b');
        if (!kw || !kb) return [];
        Fx.swapSq(g, kw, kb);
        return ['The two monarchs trade thrones in a flash of light!'];
      } },

    { id: 37, name: 'Wraith Form', icon: '💀', rarity: 1, cat: 'Curse',
      desc: 'Poison a random enemy piece. It detonates at the end of its next turn.',
      flavor: 'Death follows it like a loyal pet.',
      target: 'auto',
      run: (g, s) => Fx.poisonN(g, s, 1) },

    { id: 38, name: 'Doom', icon: '🔮', rarity: 4, cat: 'Curse',
      desc: 'Mark the strongest enemy piece — and its weakest companion — with DOOM: each dies quietly at the end of its own next turn.',
      flavor: 'The oracle has spoken. Run.',
      target: 'auto',
      run: (g, s) => {
        const pool = en(g, s).filter(q => q.cell.t !== 'k')
          .sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        const top = pool[0];
        if (!top) return [];
        Fx.mod(top.cell, 'doom', 1);
        Fx.flash(g, top.r, top.c, 'poison', '');
        const lines = ['A death mark sears onto the enemy ' + MD.pieceName(top.cell.t) + ' — it has one turn to live.'];
        const weak = pool[pool.length - 1];
        if (weak && weak !== top) {
          Fx.mod(weak.cell, 'doom', 1);
          Fx.flash(g, weak.r, weak.c, 'poison', '');
          lines.push('Doom also brushes the weakest: ' + MD.pieceName(weak.cell.t) + '.');
        }
        return lines;
      } },

    { id: 39, name: 'Chill', icon: '🧊', rarity: 1, cat: 'Status',
      desc: 'Freeze a random enemy piece for one of its turns.',
      flavor: 'Cold enough to stop a knight\'s heart.',
      target: 'auto',
      run: (g, s) => Fx.freezeN(g, s, 1) },

    { id: 40, name: 'Polar Vortex', icon: '🌬️', rarity: 3, cat: 'Status',
      desc: 'Freeze the enemy king for a turn (it cannot move to escape).',
      flavor: 'Even royalty feels the cold.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, O(s));
        if (!k) return [];
        Fx.mod(g.board[k.r][k.c], 'f', 1);
        Fx.flash(g, k.r, k.c, 'freeze', '');
        return ['The enemy king is locked in ice!'];
      } },

    { id: 41, name: 'Stoneskin', icon: '🪨', rarity: 1, cat: 'Buff',
      desc: 'Shield your king from capture for the enemy\'s next turn.',
      flavor: 'Granite has never feared a sword.',
      target: 'auto',
      run: (g, s) => {
        const k = E.findKing(g, s);
        if (!k) return [];
        Fx.mod(g.board[k.r][k.c], 's', 1);
        Fx.flash(g, k.r, k.c, 'shield', '');
        return ['Your king is wrapped in living stone.'];
      } },

    { id: 42, name: 'Fortress', icon: '🧱', rarity: 2, cat: 'Buff',
      desc: 'Shield ALL of your pieces for one enemy turn.',
      flavor: 'An unbreakable wall of divine will.',
      target: 'auto',
      run: (g, s) => {
        const n = Fx.statusOn(g, own(g, s), 's', 1, 'shield');
        return n ? ['Every soldier gains an ethereal shield.'] : [];
      } },

    { id: 43, name: 'Regrowth', icon: '🌱', rarity: 2, cat: 'Economy',
      desc: 'Return a random captured friendly pawn to the battlefield.',
      flavor: 'The forest reclaims its soldiers.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 1, { type: 'p' }) },

    { id: 44, name: 'Resurrection', icon: '⚰️', rarity: 3, cat: 'Economy',
      desc: 'Return the strongest captured friendly piece to the board.',
      flavor: 'The tomb gives back what it borrowed.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 1) },

    { id: 45, name: 'Army of the Damned', icon: '🧟', rarity: 4, cat: 'Economy',
      desc: 'Resurrect up to three captured friendly pieces at once.',
      flavor: 'They don\'t stay dead around here.',
      target: 'auto',
      run: (g, s) => Fx.revive(g, s, 3) },

    { id: 46, name: 'Dark Ritual', icon: '🕯️', rarity: 4, cat: 'Attack',
      desc: 'Destroy the enemy queen outright — if she still lives.',
      flavor: 'All candles point at her.',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { only: 'q' }) },

    { id: 47, name: 'Assassinate', icon: '🗡️', rarity: 4, cat: 'Attack',
      desc: 'The assassin takes out the whole court: destroy every enemy queen and rook, then poison their strongest remaining piece. The king alone survives.',
      flavor: 'A knife in the dark — for everyone except the throne.',
      target: 'auto',
      run: (g, s) => {
        const lines = [];
        const court = en(g, s).filter(q => q.cell.t === 'q' || q.cell.t === 'r');
        for (const q of court) { Fx.removeAt(g, q.r, q.c, {}); }
        if (court.length) lines.push('The court falls — ' + court.length + ' major piece' + (court.length > 1 ? 's' : '') + ' struck down.');
        const rest = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
        const t = rest[0];
        if (t && !court.includes(t)) { Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', ''); lines.push('The strongest survivor is poisoned.'); }
        return lines.length ? lines : ['The court is empty — no one left to strike.'];
      } },

    { id: 48, name: 'Beheading', icon: '🪓', rarity: 3, cat: 'Attack',
      desc: 'Destroy the enemy\'s most powerful non-king piece.',
      flavor: 'Off with their head!',
      target: 'auto',
      run: (g, s) => Fx.destroyN(g, s, 1, { prefer: 'high' }) },

    { id: 49, name: 'Dragon\'s Breath', icon: '🐉', rarity: 2, cat: 'Attack',
      desc: 'Incinerate all enemy pieces standing in the file of your most advanced pawn.',
      flavor: 'The dragon follows the vanguard.',
      target: 'auto',
      run: (g, s) => {
        const pawns = own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => (s === 'w' ? a.r - b.r : b.r - a.r));
        const lead = pawns[0];
        if (!lead) return [];
        const col = lead.c;
        const hit = en(g, s).filter(q => q.cell.t !== 'k' && q.c === col);
        for (const q of hit) { Fx.removeAt(g, q.r, q.c, {}); }
        return hit.length ? ['Flame engulfs file ' + 'abcdefgh'[col] + '.'] : [];
      } },

    { id: 50, name: 'Rear Echelon Fire', icon: '🏹', rarity: 2, cat: 'Attack',
      desc: 'Destroy every enemy pawn on the enemy\'s back two ranks.',
      flavor: 'Volley into the camp before the battle.',
      target: 'auto',
      run: (g, s) => {
        const rows = O(s) === 'b' ? [0, 1] : [6, 7];
        const hit = en(g, s).filter(q => rows.includes(q.r) && q.cell.t === 'p');
        for (const q of hit) Fx.removeAt(g, q.r, q.c, {});
        return hit.length ? ['A volley shreds the enemy camp.'] : ['The arrows find no targets.'];
      } }
  ];
})();

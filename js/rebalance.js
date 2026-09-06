/* ============================================================
   Mod Chess — Balance & de-duplication pass.
   Loaded AFTER abilities_index.js. This layer:
     • reassigns rarity on a consistent power ladder, and
     • rewrites spells that were effectively duplicates of each
       other (same effect, different name) so every ability is
       mechanically distinct.
   Everything stays plain-data friendly (runs only use Fx/Engine).
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  if (!MD || !MD.ABILITIES) return;
  const E = MD.Engine, Fx = MD.Fx, O = Fx.opp;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);
  const rnd = a => Fx.rand(a);
  const val = t => E.val(t);
  const byId = id => MD.ABILITIES.find(a => a.id === id);

  /* ---------------- rarity ladder ----------------
     Common(1): minor single-target / 1 small summon / 1 freeze / small risk
     Rare(2):   2 pieces, single pawn/major destroy, revive, straightforward upgrades
     Epic(3):   rook/queen-class destroy, mass statuses, steals, big upgrades, strong summons
     Legendary(4): destroy the king/queen, steal strongest, extra-turn combos, army-wide effects
  ------------------------------------------------- */
  const RAR = {
    1: 2,   // Fireball — destroys any enemy piece (not just minor) → Rare
    5: 3,   // Vampiric Bite — destroy strongest (even with a cost) → Epic
    6: 1,   // Freezing Touch (now: freeze the most advanced piece)
    7: 3,   // Blizzard (vanguard lockdown) → Epic
    11: 3,  // pawn → queen outright → Epic
    14: 3,  // Guardian summon (rook-slider w/ diagonals) → Epic
    18: 2,  // Gravity Well (whole-board chaos)
    20: 4,  // Time Warp (pure extra move) → Legendary
    21: 3,  // Second Wind (extra move + ward king)
    22: 3,  // Twilight Realm (escape while in check)
    24: 2,  // Court Intrigue (choose a downgrade) → Rare
    25: 2,  // Hex of Weakness (downgrade strongest) → Rare
    26: 3,  // Transmogrify (choose any enemy → pawn) → Epic
    27: 2,  // Knightfall (random enemy → knight)
    29: 4,  // Possession (steal a random piece) → Legendary
    33: 2,  // Blink (place any of your pieces anywhere)
    34: 3,  // Rearguard (swap any two of your own pieces anywhere) → Epic
    36: 4,  // Great Swap (kings trade) → Legendary
    42: 3,  // Fortress (shield the whole army) → Epic
    44: 3,  // Resurrection (strongest captive back) → Epic
    45: 4,  // Army of the Damned (revive three) → Legendary
    53: 3,  // Cull the Weak (all enemy pawns) → Epic
    57: 3,  // Harpoon (destroy a rook) → Epic
    59: 3,  // Hammer of Dawn (bishop + knight) → Epic
    60: 3,  // Chain Lightning (piece + neighbor) → Epic
    62: 3,  // Ascension (all pawns → bishops) → Epic
    66: 3,  // Rook's Might (rook → queen)
    67: 4,  // Final Form (whole army → queens) → Legendary
    70: 3,  // Keep (two rooks) → Epic
    71: 2,  // Cleric Chorus (two bishops)
    72: 4,  // Queen's Gambit (summon a queen) → Legendary
    73: 2,  // Frontline Reinforcements
    74: 2,  // Gravitational Anchor
    78: 4,  // Mirror World
    80: 3,  // Regicide Rush (king leap)
    81: 2,  // Royal Escort
    83: 2,  // War Chest (pawn + minor revive)
    84: 3,  // Call of Valor (one of every lost type) → Epic
    85: 4,  // Echoes of the Fallen (two strongest back)
    89: 3,  // Lich Curse (queen + a piece poisoned)
    92: 4,  // Time Stop (enemy turn erased)
    93: 3,  // Haste (extra move + pawn surge)
    94: 2,  // Slow (freeze the two lead pieces)
    95: 1,  // Foresight (restricted extra move) → Common
    96: 4,  // Betrayal (steal the strongest piece) → Legendary
    102: 3, // Judgment (destroy the unprotected power piece)
    103: 2, // Kraken's Reach (steal the lead pawn) → Rare
    105: 4, // Black Hole (destroy a whole ring) → Legendary
    111: 3, // Sacrifice
    112: 4, // Blood Price (queen gone, king frozen) → Legendary
    115: 3, // Berserker Rage (rook → queen) → Epic
    117: 2, // Petrify (choose a freeze)
    118: 3, // Crystal Coffin (freeze strongest) → Epic
    119: 2, // Frost Nova
    121: 4, // Last Stand (shield all + freeze nearby) → Legendary
    122: 3, // Divine Shield
    123: 2, // Mana Surge
    124: 3, // Runic Growth (all knights → rooks) → Epic
    125: 3, // Sword of Light (destroy the piece facing the king) → Epic
    126: 4, // Cannonade (clear a whole file) → Legendary
    127: 3, // Sweeping Lance (clear the king's rank) → Epic
    128: 3, // Enfilade (clear your most crowded file) → Epic
    133: 2, // Pawn Storm
    134: 3, // Tide of War
    137: 2, // Bastion (wall of four pawns) → Rare
    140: 2, // Sandstorm (poison invaders) → Rare
    143: 3, // Gilded Cage (freeze the queen) → Epic
    145: 2, // Twin Towers
    146: 2, // Stone Circle
    149: 2, // Escort Wings
    150: 2, // Shadow Step (swap any two of your pawns) → Rare
    151: 3, // Dreadnought (most advanced pawn → queen) → Epic
    152: 3, // Loyalist Uprising
    153: 3, // Ancient Pact (two pawns back) → Epic
    154: 4, // Ghost Legion (revive four) → Legendary
    155: 4, // Borrowed Time (extra move + shrink enemy hand) → Legendary
    156: 4, // Paradox (extra move + silence enemy) → Legendary
    157: 1, // Instant (extra move at a pawn's cost) → Common
    158: 2, // Mana Echo (extra move + shield a piece) → Rare
    159: 3, // Displace (swap your king with the nearest enemy) → Epic
    163: 3, // Crumbling Ground (clear both center files) → Epic
    164: 2, // Ravine
    166: 2, // Vanguard Bulwark
    167: 3, // Hollow Crown (queen→rook + freeze king) → Epic
    168: 2, // Shadowbind
    170: 2, // Landmine
    171: 3, // Sunburst
    172: 4, // Checkmate Gambit
    174: 3, // Hexproof
    176: 2, // Chaos Orb
    177: 3, // Wild Magic
    179: 3, // Gambler's Ruin
    180: 3, // Balance of Power → Epic
    181: 2, // Exchange
    183: 3, // Storm Caller → Epic
    184: 2, // Harvest Moon
    185: 1, // Caltrops (poison the lead piece) → Common
    186: 1, // Eyebite
    187: 2, // Numbing Cold (freeze the enemy's rooks) → Rare
    188: 4, // Eternal Frost (army freeze, royal circle spared)
    190: 2, // Undying Loyalty
    191: 3, // Tyrant's Command
    193: 2, // Broken Arrow
    194: 2, // Repel
    196: 3, // Rallying Cry (upgrade your whole guard) → Epic
    198: 3, // Sacred Ground
    199: 4, // Ragnarok
    200: 4, // Ascended King
    221: 3, 222: 3, 223: 3, 224: 3, 225: 2, 226: 3, 227: 4, 228: 2, 229: 2,
    230: 2, 231: 2, 232: 1, 233: 1, 234: 3, 235: 3, 236: 3, 237: 4, 238: 4,
    239: 2, 240: 4, 241: 3, 242: 3, 243: 2, 244: 3, 245: 3, 246: 1, 247: 2,
    248: 3, 249: 2, 250: 3, 251: 2, 252: 4, 253: 2, 254: 3, 255: 3, 256: 2
  };
  for (const id in RAR) {
    const a = byId(+id);
    if (a) a.rarity = RAR[id];
  }

  /* ---------------- de-duplication: distinct mechanics ----------------
     Every rewritten ability keeps its id/name but does something else,
     so no two abilities in the codex are synonyms anymore.           */
  const R = {};

  // 6 Freezing Touch  → freeze the enemy's MOST ADVANCED piece (front line freezes)
  R[6] = (g, s) => {
    const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const t = pool[0];
    if (!t) return [];
    Fx.mod(t.cell, 'f', 1); Fx.flash(g, t.r, t.c, 'freeze', '');
    return ['The enemy vanguard — ' + MD.pieceName(t.cell.t) + ' on ' + sn(t.r, t.c) + ' — freezes on the spot.'];
  };

  // 92 Time Stop  → the enemy's NEXT TURN is erased (they never move)
  R[92] = (g, s) => {
    g.skipTurn = g.skipTurn || { w: false, b: false };
    g.skipTurn[O(s)] = true;
    return ['Time freezes. The enemy ' + (s === 'w' ? 'Black' : 'White') + ' loses their next turn entirely — it never happens!'];
  };

  // 93 Haste  → extra move AND your whole front line rushes forward
  R[93] = (g, s) => {
    let moved = 0;
    const dr = s === 'w' ? -1 : 1;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (!cell || cell.c !== s || cell.t !== 'p') continue;
      if (g.board[r + dr] && !g.board[r + dr][c]) { Fx.relocate(g, r, c, r + dr, c, {}); moved++; }
    }
    Fx.grantExtra(g, s, 1);
    const lines = ['Haste! Your army surges — move again!'];
    if (moved) lines.unshift('Your pawns surge forward — ' + moved + (moved > 1 ? ' advance!' : ' advances!'));
    return lines;
  };

  // 94 Slow  → freeze the enemy's TWO most advanced pieces
  R[94] = (g, s) => {
    const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r)).slice(0, 2);
    const n = Fx.statusOn(g, pool, 'f', 1, 'freeze');
    return n ? ['The enemy vanguard is slowed to a crawl.'] : [];
  };

  // 95 Foresight  → restricted extra move (you move again but may not cast on the extra turn)
  R[95] = (g, s) => {
    Fx.grantExtra(g, s, 1);
    g.silence = g.silence || { w: false, b: false };
    g.silence[s] = true; // the echo-turn is pure chess
    return ['You foresee the position — move again, though the echo turn has no room for spells.'];
  };

  // 102 Judgment  → destroy the strongest enemy piece that is NOT defended (else the strongest)
  R[102] = (g, s) => {
    const foes = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => val(b.cell.t) - val(a.cell.t));
    if (!foes.length) return [];
    const undefended = foes.filter(q => !E.attacked(g, q.r, q.c, q.cell.c));
    const t = undefended[0] || foes[0];
    Fx.removeAt(g, t.r, t.c, {});
    return ['Judgment falls on the unprotected ' + MD.pieceName(t.cell.t) + '!'];
  };

  // 126 Cannonade  → keep as-is (already unique).  No override.

  // 140 Sandstorm  → poison up to three enemy pieces on YOUR half (the invaders)
  R[140] = (g, s) => {
    const targets = en(g, s).filter(q => s === 'w' ? q.r >= 4 : q.r <= 3);
    const picks = Fx.uniqN(targets, 3);
    const n = Fx.statusOn(g, picks, 'p', 1, 'poison');
    return n ? ['The storm poisons the enemy troops that crossed into your territory!'] : ['No enemy has crossed the line.'];
  };

  // 155 Borrowed Time  → extra move AND the enemy draws only 2 spells next turn
  R[155] = (g, s) => {
    Fx.grantExtra(g, s, 1);
    g.lowHand = g.lowHand || { w: false, b: false };
    g.lowHand[O(s)] = true;
    return ['You borrow time — move again, and the enemy will draw fewer schemes next turn!'];
  };

  // 156 Paradox  → extra move AND the enemy is silenced (no spell next turn)
  R[156] = (g, s) => {
    Fx.grantExtra(g, s, 1);
    g.silence = g.silence || { w: false, b: false };
    g.silence[O(s)] = true;
    return ['A paradox unfolds — you act again while the enemy\'s magic chokes on itself!'];
  };

  // 157 Instant  → extra move, but you must feed a pawn to the clock
  R[157] = (g, s) => {
    const pawns = own(g, s).filter(q => q.cell.t === 'p');
    const victim = rnd(pawns);
    if (victim) { Fx.removeAt(g, victim.r, victim.c, {}); Fx.grantExtra(g, s, 1); return ['A pawn is sacrificed to the seconds — move again!']; }
    Fx.grantExtra(g, s, 1);
    return ['No pawn to burn — but the spell still fires. Move again!'];
  };

  // 158 Mana Echo  → extra move AND your most advanced piece is shielded
  R[158] = (g, s) => {
    Fx.grantExtra(g, s, 1);
    const mine = own(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const t = mine[0];
    if (t) { Fx.mod(t.cell, 's', 1); Fx.flash(g, t.r, t.c, 'shield', ''); }
    return ['Your move echoes — act again, and your lead piece is warded.'];
  };

  // 185 Caltrops  → poison the enemy's most advanced piece (renamed effect, unique)
  R[185] = (g, s) => {
    const pool = en(g, s).filter(q => q.cell.t !== 'k').sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
    const t = pool[0];
    if (!t) return [];
    Fx.mod(t.cell, 'p', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    return ['Caltrops shred the lead enemy ' + MD.pieceName(t.cell.t) + ' — it is poisoned!'];
  };

  // 187 Numbing Cold  → freeze EVERY enemy rook on the board
  R[187] = (g, s) => {
    const rooks = en(g, s).filter(q => q.cell.t === 'r');
    const n = Fx.statusOn(g, rooks, 'f', 1, 'freeze');
    return n ? ['The enemy towers go numb with cold!'] : ['No enemy rook stands to be numbed.'];
  };

  // 21 Second Wind  → extra move AND your king catches its breath (warded)
  R[21] = (g, s) => {
    Fx.grantExtra(g, s, 1);
    const k = E.findKing(g, s);
    if (k) { Fx.mod(g.board[k.r][k.c], 's', 1); Fx.flash(g, k.r, k.c, 'shield', ''); }
    return ['Your heart keeps beating — move again, and your king is warded!'];
  };

  // 224 Wait at Ease  → extra move, but only when you are NOT in check
  R[224] = (g, s) => {
    if (E.inCheck(g, s)) return ['You cannot rest while the sword is at your throat!'];
    Fx.grantExtra(g, s, 1);
    return ['You bide your time — act again!'];
  };

  // 229 Watch the Fire  → shield every friendly piece standing NEXT TO an enemy (across the river)
  R[229] = (g, s) => {
    const foes = en(g, s);
    const targets = own(g, s).filter(q => foes.some(f => Math.abs(f.r - q.r) <= 1 && Math.abs(f.c - q.c) <= 1));
    const n = Fx.statusOn(g, targets, 's', 1, 'shield');
    return n ? ['The pieces watching the enemy across the river are shielded.'] : ['No one stands across the river to protect.'];
  };

  // 250 Guest Becomes Host  → steal a random enemy piece standing ADJACENT to one of yours
  R[250] = (g, s) => {
    const mine = own(g, s);
    const guests = en(g, s).filter(q => q.cell.t !== 'k' && mine.some(m => Math.abs(m.r - q.r) <= 1 && Math.abs(m.c - q.c) <= 1));
    const t = rnd(guests.length ? guests : en(g, s).filter(q => q.cell.t !== 'k'));
    if (!t) return [];
    t.cell.c = s; Fx.flash(g, t.r, t.c, 'move', ''); Fx.clearEp(g);
    return ['A guest at your very doorstep ' + MD.pieceName(t.cell.t) + ' forgets its master and joins you!'];
  };

  // 251 Beauty's Trap  → freeze TWO enemy pieces standing beside their own king
  R[251] = (g, s) => {
    const k = E.findKing(g, O(s));
    if (!k) return [];
    const guards = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = k.r + dr, c = k.c + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && g.board[r][c] && g.board[r][c].c === O(s)) guards.push({ r, c });
    }
    const n = Fx.statusOn(g, Fx.uniqN(guards, 2), 'f', 1, 'freeze');
    return n ? ['The royal guard is utterly charmed — frozen beside their king!'] : ['The trap finds no guards to charm.'];
  };

  // 234 Borrowed Corpse  → revive your strongest fallen piece AND it rises shielded
  R[234] = (g, s) => {
    const before = new Set();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c]) before.add(r + ',' + c);
    const lines = Fx.revive(g, s, 1);
    if (!lines.length) return [];
    let risen = null;
    for (let r = 0; r < 8 && !risen; r++) for (let c = 0; c < 8; c++) {
      if (g.board[r][c] && !before.has(r + ',' + c)) { risen = { r, c }; break; }
    }
    if (risen) { Fx.mod(g.board[risen.r][risen.c], 's', 1); Fx.flash(g, risen.r, risen.c, 'shield', ''); }
    lines.push('The risen corpse is warded as it drags itself to war.');
    return lines;
  };

  // 83 War Chest  → revive a captured pawn AND a captured minor piece
  R[83] = (g, s) => {
    const lines = Fx.revive(g, s, 1, { type: 'p' });
    const minors = ['n', 'b'];
    for (const t of minors) {
      if (lines.length >= 2) break;
      if ((g.capt[s] || []).some(p => p.t === t)) lines.push(...Fx.revive(g, s, 1, { type: t }));
    }
    return lines.length ? lines : ['The war chest is empty — nothing lost yet to reclaim.'];
  };

  // 43 Regrowth stays (revive a random captured pawn). No override.

  for (const id in R) {
    const a = byId(+id);
    if (!a) continue;
    a.run = R[id];
  }

  // keep user-facing text in sync with the new mechanics above
  const DESC = {
    6: 'Freeze the enemy\'s MOST ADVANCED piece — the vanguard freezes first.',
    21: 'Catch your breath: take an extra move AND your king is warded against capture.',
    83: 'Open the war chest: return a captured pawn AND a captured minor piece to the board.',
    92: 'The enemy loses their next turn entirely — it is erased from time.',
    93: 'Your whole front line surges forward one step, then you take an extra move.',
    94: 'Slow the enemy\'s two most advanced pieces for a turn.',
    95: 'Foresee the position: take an extra move, but the echo turn has no room for spells.',
    102: 'Destroy the enemy\'s most powerful piece IF it is undefended — otherwise the scales spare it.',
    140: 'A sandstorm poisons up to three enemy pieces that crossed into your territory.',
    155: 'Borrow time: take an extra move, and the enemy draws only 2 spells next turn.',
    156: 'A paradox: take an extra move AND the enemy is silenced (no spell next turn).',
    157: 'Move again right now — but the clock demands a pawn as fuel.',
    158: 'Take an extra move, and your most advanced piece is shielded.',
    185: 'Poison the enemy\'s most advanced piece — caltrops shred the lead foot.',
    187: 'Numbing cold freezes every enemy rook on the board.',
    224: 'Rest while the enemy labors: take an extra move — but only if you are not in check.',
    229: 'Shield every friendly piece standing next to an enemy (watching across the river).',
    234: 'Resurrect your strongest fallen piece, and it rises warded.',
    250: 'A random enemy piece standing adjacent to one of your pieces forgets its allegiance and joins you.',
    251: 'Charm TWO enemy pieces standing beside their king — they freeze in place.'
  };
  for (const id in DESC) {
    const a = byId(+id);
    if (a) a.desc = DESC[id];
  }

  // keep icon mapping in sync with any semantic edits
  if (MD.assignAbilityIcons) MD.assignAbilityIcons(MD.ABILITIES);
})();

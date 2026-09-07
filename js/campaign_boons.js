/* ============================================================
   Mod Chess — CAMPAIGN EXTRA BOONS (post-wave choices)
   104 unique rewards layered on top of the core boon pool.
   Every name below is unique across the whole campaign, and each
   effect is a distinct parameterisation (no two are identical).
   Runs use only public MD.Fx / MD.Engine so this file may live
   anywhere after effects.js; campaign.js merges them in.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  if (!MD || !MD.Fx || !MD.Engine) return;
  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const pn = t => (MD.pieceName ? MD.pieceName(t) : t);
  const log = (g, t) => { if (MD.addLog) MD.addLog(g, t, 'sys', 'star'); };
  const toast = t => { if (MD.UI && MD.UI.toast) MD.UI.toast(t, 'sys'); };
  const N = g => (g.n | 0) || 8;
  const R = arr => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
  const own = (g, s) => Fx.own(g, s);
  const enem = (g, s) => Fx.enemy(g, s);
  const nonK = l => l.filter(q => q.cell.t !== 'k');
  const sortVal = l => l.slice().sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t));
  const advPawn = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => a.r - b.r)[0];
  const lagPawn = (g, s) => own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => b.r - a.r)[0];

  function emptySqs(g, ranks, cols) {
    const out = [];
    const n = N(g);
    for (const r of (ranks || [])) for (const c of (cols || [])) {
      if (r < 0 || r >= n || c < 0 || c >= n) continue;
      if (!g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) out.push({ r, c });
    }
    return out;
  }
  function nearKing(g, side, rad) {
    const k = E.findKing(g, side);
    if (!k) return [];
    const out = [];
    const n = N(g);
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      const r = k.r + dr, c = k.c + dc;
      if (r < 0 || r >= n || c < 0 || c >= n) continue;
      if (!g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) out.push({ r, c });
    }
    return out;
  }
  function put(g, side, type, spots) {
    const q = R(spots);
    if (!q) return false;
    const cell = Fx.place(g, side, type, q.r, q.c, { noRecruit: true });
    if (!cell) return false;
    return true;
  }
  const backCols = g => Array.from({ length: N(g) }, (_, i) => i);
  const homeRanks = (g, side) => (side === 'w' ? [N(g) - 1, N(g) - 2, N(g) - 3] : [0, 1, 2]);

  const B = [];
  const opt = (name, icon, rarity, cost, desc, run) => B.push({ name, icon, rarity: rarity || 2, cost, desc, run });
  const free = (name, icon, rarity, desc, run) => opt(name, icon, rarity, undefined, desc, run);

  /* ---------- A. specific-unit summonings (each a different troop) ---------- */
  const summons = [
    ['Hired Archer', 'ranger', 'A ranger joins the garrison.'],
    ['Warhorse Train', 'warhorse', 'A warhorse is saddled for the realm.'],
    ['Goblin Auxilia', 'goblin', 'A goblin skirmisher answers the horn.'],
    ['Imp Pact', 'imp', 'A bound imp crawls onto the field.'],
    ['Royal Spriggan', 'spriggan', 'A spriggan guardian sprouts by the Throne.'],
    ['Ronin Retainer', 'samurai', 'A samurai pledges his blade.'],
    ['Divine Hound', 'divinedog', 'A divine dog pads to your side.'],
    ['Nue Summons', 'nue', 'A nue slinks out of the storm.'],
    ['Sea Serpent Rise', 'seaserpent', 'A sea serpent coils into the fray.'],
    ['Siege Tank Roll', 'siegetank', 'A siege tank rumbles onto the board.'],
    ['Court Archmage', 'archmage', 'An archmage levitates into position.'],
    ['Stone Golem', 'golem', 'A golem stomps to the front.'],
    ['Griffon Perch', 'griffon', 'A griffon lands beside the Throne.'],
    ['Siren Song', 'siren', 'A siren drifts up from the waves.'],
    ['Qilin Pact', 'qilin', 'A qilin, beast of pure virtue, answers.'],
    ['Coral Guard', 'coralqueen', 'The reef queen sends a guardian.'],
    ['Leviathan Brood', 'leviathan', 'A leviathan breaches the board.'],
    ['Yasha Bound', 'yasha', 'A yasha is bound to your service.'],
    ['Infantry Platoon', 'infantry', 'A fresh platoon takes the line.'],
    ['Howitzer Team', 'howitzer', 'A howitzer crew wheels up.'],
    ['Zeppelin Scout', 'zeppelin', 'A zeppelin drifts overhead.'],
    ['Jianke Ward', 'jianke', 'A wandering jianke draws steel for you.'],
    ['Hydraling Egg', 'hydraling', 'A hydraling egg is placed in reserve.']
  ];
  summons.forEach(([nm, type, ds], i) => {
    free(nm, 'portal', 2, ds, g => { if (!put(g, 'w', type, nearKing(g, 'w', 1))) { toast('No room to deploy.'); } });
  });

  /* ---------- B. promotions & upgrades (each distinct) ---------- */
  free('Knight the Rearguard', 'sword', 2, 'Your LEAST advanced pawn is knighted.', g => { const p = lagPawn(g, 'w'); if (p) { p.cell.t = 'n'; } });
  free('Bishop the Vanguard', 'sword', 2, 'Your most advanced pawn becomes a BISHOP.', g => { const p = advPawn(g, 'w'); if (p) { p.cell.t = 'b'; } });
  free('Rook the Siegebreakers', 'sword', 3, 'Your two most advanced pawns become ROOKS.', g => { own(g, 'w').filter(q => q.cell.t === 'p').sort((a, b) => a.r - b.r).slice(0, 2).forEach(p => { p.cell.t = 'r'; }); });
  free('Grand Promotion', 'rune', 4, 'Promote a random pawn straight to a QUEEN.', g => { const p = R(own(g, 'w').filter(q => q.cell.t === 'p')); if (p) { p.cell.t = 'q'; } });
  free('Minor Ascension', 'spark', 1, 'Upgrade every friendly KNIGHT into a BISHOP.', g => { own(g, 'w').forEach(q => { if (q.cell.t === 'n') q.cell.t = 'b'; }); });
  free('Heavy Cavalier', 'bone', 2, 'Upgrade your most advanced KNIGHT into a ROOK.', g => { const ns = own(g, 'w').filter(q => q.cell.t === 'n').sort((a, b) => a.r - b.r); if (ns[0]) ns[0].cell.t = 'r'; });
  free('Warrior\'s Path', 'sword', 2, 'Your king\'s two nearest friendly pieces gain +ward (shielded).', g => { own(g, 'w').filter(q => q.cell.t !== 'k').sort((a, b) => { const k = E.findKing(g, 'w'); const da = Math.abs(a.r - k.r) + Math.abs(a.c - k.c), db = Math.abs(b.r - k.r) + Math.abs(b.c - k.c); return da - db; }).slice(0, 2).forEach(q => Fx.mod(q.cell, 's', 1)); });

  /* ---------- C. healing / cleansing (varied scopes) ---------- */
  free('Field Triage', 'heart', 1, 'Cleanse your back two ranks of poison and frost.', g => { own(g, 'w').forEach(q => { if (q.r >= N(g) - 2 && q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; } }); });
  free('Veteran\'s Rest', 'heart', 1, 'Cleanse every non-pawn friendly piece.', g => { own(g, 'w').forEach(q => { if (q.cell.t !== 'p' && q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; } }); });
  free('Royal Aegis', 'shield', 3, 'Shield your king AND your queen (if any) for two turns.', g => { const k = E.findKing(g, 'w'); if (k) Fx.mod(g.board[k.r][k.c], 's', 2); const q = own(g, 'w').find(x => x.cell.t === 'q'); if (q) Fx.mod(q.cell, 's', 2); });
  free('Knight\'s Vigil', 'shield', 1, 'Shield every friendly KNIGHT.', g => { let n = 0; own(g, 'w').forEach(q => { if (q.cell.t === 'n') { Fx.mod(q.cell, 's', 1); n++; } }); if (!n) toast('No knights to shield.'); });
  free('Bishop\'s Benediction', 'spark', 1, 'Shield every friendly BISHOP.', g => { own(g, 'w').forEach(q => { if (q.cell.t === 'b') Fx.mod(q.cell, 's', 1); }); });
  free('Rook\'s Wall', 'shield', 1, 'Shield every friendly ROOK.', g => { own(g, 'w').forEach(q => { if (q.cell.t === 'r') Fx.mod(q.cell, 's', 1); }); });
  free('Mist over the Line', 'wind', 2, 'Veil your three most advanced pieces in mist.', g => { own(g, 'w').filter(q => q.cell.t !== 'k').sort((a, b) => a.r - b.r).slice(0, 3).forEach(q => Fx.mod(q.cell, 'v', 2)); });
  free('Undying Banner', 'heart', 3, 'Cleanse your whole army and revive a fallen PAWN.', g => { own(g, 'w').forEach(q => { if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; } }); Fx.revive(g, 'w', 1, { type: 'p' }); });

  /* ---------- D. terrain & zone shaping ---------- */
  free('Bastion Walls', 'void', 2, 'Raise TWO walls beside your king.', g => { let n = 0; for (const q of nearKing(g, 'w', 1)) { if (n >= 2) break; if (E.setTerrain(g, q.r, q.c, 'wall')) n++; } if (!n) toast('No room for walls.'); });
  free('Moated Throne', 'drop', 2, 'Ring your king with a RIVER moat (where open).', g => { for (const q of nearKing(g, 'w', 1)) E.setTerrain(g, q.r, q.c, 'river'); });
  free('Sanctified Throne', 'shieldup', 3, 'Lay a SANCTUM zone under and around your king.', g => { const k = E.findKing(g, 'w'); if (k) Fx.layZoneZone(g, k.r, k.c, 'sanctum', { ring: true, c: 'w' }); });
  free('Caltrop Court', 'target', 2, 'Scatter hidden TRAP hazards across your back ranks.', g => { Fx.layHazards(g, 'trap', 3, { rows: homeRanks(g, 'w') }); });
  free('Poison Ivy Line', 'leaf', 2, 'Lay hidden POISON hazards on the enemy\'s front ranks.', g => { const n = N(g); Fx.layHazards(g, 'poison', 3, { rows: [0, 1].concat(n > 8 ? [2] : []) }); });
  free('Frosting the March', 'ice', 2, 'Lay hidden FREEZE hazards on the enemy\'s half.', g => { const n = N(g); Fx.layHazards(g, 'freeze', 3, { rows: Array.from({ length: n >> 1 }, (_, i) => i) }); });
  free('Ember Traps', 'fire', 2, 'Lay hidden EMBER hazards before your lines.', g => { const n = N(g); Fx.layHazards(g, 'ember', 3, { rows: [n - 3, n - 4, n - 5] }); });
  free('Hallowed Earth', 'leaf', 1, 'Purge ALL enemy ground zones from the board.', g => { const list = E.zoneList(g); const c = E.clearAllZones ? E.clearAllZones(g) : null; toast((list && list.length) ? list.length + ' zones cleared.' : 'No zones to clear.'); });
  free('Wall of the North', 'ice', 2, 'Freeze one whole FILE of the enemy\'s pieces (random).', g => { const n = N(g); const c = Math.floor(Math.random() * n); let z = 0; for (let r = 0; r < n; r++) { const cell = g.board[r][c]; if (cell && cell.c === 'b' && cell.t !== 'k') { Fx.mod(cell, 'f', 1); z++; } } if (!z) toast('No enemies on that file.'); });
  free('Tidal Sweep', 'drop', 2, 'Your most advanced pawn is swept one row deeper if open.', g => { const p = advPawn(g, 'w'); if (p && p.r > 0 && !g.board[p.r - 1][p.c]) { g.board[p.r - 1][p.c] = p.cell; g.board[p.r][p.c] = null; } });

  /* ---------- E. enemy harassment (distinct each) ---------- */
  free('Arrow Volley', 'target', 2, 'Poison the enemy\'s most advanced pawn.', g => { const e = enem(g, 'w').filter(q => q.cell.t === 'p').sort((a, b) => b.r - a.r)[0]; if (e) Fx.mod(e.cell, 'p', 1); });
  free('Hex the Vanguard', 'skull', 2, 'Doom the enemy\'s most advanced piece.', g => { const e = enem(g, 'w').filter(q => q.cell.t !== 'k').sort((a, b) => b.r - a.r)[0]; if (e) Fx.mod(e.cell, 'doom', 1); });
  free('Medusa\'s Glare', 'target', 3, 'Petrify the enemy piece nearest your king.', g => { const k = E.findKing(g, 'w'); let t = null, bd = 1e9; enem(g, 'w').forEach(q => { if (q.cell.t === 'k') return; const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; t = q; } }); if (t) Fx.mod(t.cell, 'st', 1); });
  free('Break Their Morale', 'skull', 1, 'Freeze two random enemy pieces.', g => { Fx.freezeN(g, 'w', 2); });
  free('Venom for the Host', 'drop', 2, 'Poison three random enemy pieces.', g => { const p = enem(g, 'w').filter(q => q.cell.t !== 'k'); const picks = p.sort(() => Math.random() - 0.5).slice(0, 3); picks.forEach(q => Fx.mod(q.cell, 'p', 1)); });
  free('Shatter Their Steel', 'rune', 2, 'Downgrade the enemy\'s strongest piece one tier.', g => { const top = sortVal(nonK(enem(g, 'w')))[0]; const map = { q: 'r', r: 'b', b: 'n', n: 'p' }; if (top) { const t = map[top.cell.t]; if (t) top.cell.t = t; } });
  free('Scatter the Flank', 'wind', 2, 'Fling the enemy\'s most advanced piece back to its own half.', g => { const e = enem(g, 'w').filter(q => q.cell.t !== 'k').sort((a, b) => b.r - a.r)[0]; const n = N(g); if (e) { const rows = [0, 1].concat(n > 8 ? [2] : []); const sp = emptySqs(g, rows, backCols(g)); if (sp.length) { const d = R(sp); if (d) { Fx.relocate(g, e.r, e.c, d.r, d.c, { text: 'flung' }); } } } });
  free('Blight the Rank', 'leaf', 2, 'Poison every enemy on the file of your queen.', g => { const q = own(g, 'w').find(x => x.cell.t === 'q'); const c = q ? q.c : Math.floor((N(g)) / 2); for (let r = 0; r < N(g); r++) { const cell = g.board[r][c]; if (cell && cell.c === 'b' && cell.t !== 'k') Fx.mod(cell, 'p', 1); } });
  free('Iron Curse', 'skull', 2, 'Frailty strikes the enemy\'s strongest piece.', g => { const top = sortVal(nonK(enem(g, 'w')))[0]; if (top) Fx.mod(top.cell, 'frail', true); });
  free('Snare the Warlord\'s Guard', 'target', 2, 'Freeze every enemy piece adjacent to their king.', g => { const k = E.findKing(g, 'b'); if (!k) return; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r = k.r + dr, c = k.c + dc; const cell = g.board[r] && g.board[r][c]; if (cell && cell.c === 'b' && cell.t !== 'k') Fx.mod(cell, 'f', 1); } });

  /* ---------- F. economy-lite extras ---------- */

  /* ---------- G. chaos / luck ---------- */
  free('Chaos Shrine', 'dice', 3, 'Random: a powerful ally OR a random enemy is destroyed.', g => { if (Math.random() < 0.6) { const t = R(['guardian', 'archmage', 'griffon', 'siren', 'samurai']); put(g, 'w', t, nearKing(g, 'w', 2)); } else { const q = R(nonK(enem(g, 'w'))); if (q) Fx.removeAt(g, q.r, q.c, {}); } });
  free('Doubled Pay', 'dice', 1, 'Flip for gold: heads +25, tails nothing.', g => { if (Math.random() < 0.5 && MD.Campaign && MD.Campaign.run) MD.Campaign.run.gold += 25; });
  free('Merciful Wind', 'wind', 1, 'Push every enemy piece one square toward its own back rank.', g => { const n = N(g); for (const q of enem(g, 'w')) { const nr = q.r + (q.cell.c === 'w' ? 1 : -1); if (q.r > 0 && q.r < n - 1 && !g.board[nr][q.c]) { g.board[nr][q.c] = q.cell; g.board[q.r][q.c] = null; } } });

  /* ---------- H. more zone & environment shaping ---------- */
  free('Fog Screen', 'wind', 2, 'Shroud your king\'s square and neighbours in FOG.', g => { const k = E.findKing(g, 'w'); if (k) Fx.layZoneZone(g, k.r, k.c, 'fog', { ring: true }); });
  free('Mire the Approach', 'drop', 2, 'Flood the enemy\'s half with MIRE zones.', g => { const n = N(g); Fx.layZone(g, 'mire', 3, { rows: Array.from({ length: n >> 1 }, (_, i) => i) }); });
  free('Rift the Field', 'void', 3, 'Tear RIFT zones into the enemy\'s half.', g => { const n = N(g); Fx.layZone(g, 'rift', 3, { rows: Array.from({ length: n >> 1 }, (_, i) => i) }); });
  free('Brier Line', 'leaf', 2, 'Grow THORNS zones before your own ranks.', g => { const n = N(g); Fx.layZone(g, 'thorns', 3, { rows: [n - 3, n - 4, n - 5] }); });
  free('Scorched Perimeter', 'fire', 2, 'Set FIRE zones along the row before your lines.', g => { const n = N(g); Fx.layZone(g, 'fire', 4, { rows: [n - 3, n - 4] }); });
  free('Ramparts', 'void', 2, 'Raise THREE walls on random back-rank files.', g => { const n = N(g); let placed = 0; const cols = backCols(g).sort(() => Math.random() - 0.5); for (const c of cols) { if (placed >= 3) break; if (E.setTerrain(g, n - 1, c, 'wall')) placed++; } });
  free('Broken Ground', 'rune', 2, 'Scatter random walls across the enemy\'s half.', g => { const n = N(g); const cols = backCols(g).sort(() => Math.random() - 0.5); let placed = 0; for (const c of cols) { if (placed >= 3) break; const r = 1 + Math.floor(Math.random() * Math.max(1, (n >> 1) - 1)); if (E.setTerrain(g, r, c, 'wall')) placed++; } });

  /* ---------- I. more enemy harassment ---------- */
  free('Poison the Reserves', 'skull', 2, 'Poison every enemy on its own back rank.', g => { const n = N(g); for (let c = 0; c < n; c++) { const cell = g.board[0] && g.board[0][c]; if (cell && cell.c === 'b' && cell.t !== 'k') Fx.mod(cell, 'p', 1); } });
  free('Freeze the Rear', 'ice', 2, 'Freeze every enemy on its own back rank.', g => { const n = N(g); for (let c = 0; c < n; c++) { const cell = g.board[0] && g.board[0][c]; if (cell && cell.c === 'b' && cell.t !== 'k') Fx.mod(cell, 'f', 1); } });
  free('Ice the Warlord', 'ice', 3, 'Freeze the enemy king for a turn — he cannot retreat.', g => { const k = E.findKing(g, 'b'); if (k) Fx.mod(g.board[k.r][k.c], 'f', 1); });
  free('Doom the Courier', 'skull', 3, 'Doom TWO random enemy pawns.', g => { const p = enem(g, 'w').filter(q => q.cell.t === 'p').sort(() => Math.random() - 0.5).slice(0, 2); p.forEach(q => Fx.mod(q.cell, 'doom', 1)); });
  free('Rust the Front', 'rune', 2, 'Downgrade every enemy PAWN in its two most advanced rows into nothing (destroyed).', g => { const n = N(g); for (let r = n - 1; r >= n - 2 && r >= 0; r--) for (let c = 0; c < n; c++) { const cell = g.board[r] && g.board[r][c]; if (cell && cell.c === 'b' && cell.t === 'p') Fx.removeAt(g, r, c, {}); } });
  free('Hobble the Knight', 'target', 2, 'Frail the enemy\'s strongest KNIGHT.', g => { const k = enem(g, 'w').filter(q => q.cell.t === 'n').sort((a, b) => Fx.value(b.cell.t) - Fx.value(a.cell.t))[0]; if (k) Fx.mod(k.cell, 'frail', true); });
  free('Shock the Line', 'storm', 2, 'Freeze every enemy on the file in front of your most advanced pawn.', g => { const p = advPawn(g, 'w'); const c = p ? p.c : Math.floor(N(g) / 2); for (let r = 0; r < N(g); r++) { const cell = g.board[r] && g.board[r][c]; if (cell && cell.c === 'b' && cell.t !== 'k') Fx.mod(cell, 'f', 1); } });
  free('Rout the Flanks', 'wind', 3, 'Push every enemy on the two outer files one square in.', g => { const n = N(g); for (const q of enem(g, 'w')) { if (q.c === 0 || q.c === n - 1) { const nc = q.c === 0 ? 1 : n - 2; if (!g.board[q.r][nc]) { g.board[q.r][nc] = q.cell; g.board[q.r][q.c] = null; } } } });
  free('Pestilence', 'drop', 3, 'Poison every enemy piece that has already moved up this game (front half).', g => { const n = N(g); for (const q of enem(g, 'w')) { if (q.r >= (n >> 1) && q.cell.t !== 'k') Fx.mod(q.cell, 'p', 1); } });
  free('Gorgon Court', 'target', 3, 'Petrify every enemy ADJACENT to your king.', g => { const k = E.findKing(g, 'w'); if (!k) return; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r = k.r + dr, c = k.c + dc; const cell = g.board[r] && g.board[r][c]; if (cell && cell.c === 'b' && cell.t !== 'k') Fx.mod(cell, 'st', 1); } });

  /* ---------- J. upgrades, conscripts & misc good turns ---------- */
  free('Conscript Spears', 'flag', 1, 'Summon two pawns on your back ranks.', g => { put(g, 'w', 'p', emptySqs(g, homeRanks(g, 'w'), backCols(g))); put(g, 'w', 'p', emptySqs(g, homeRanks(g, 'w'), backCols(g))); });
  free('Drill the Recruits', 'clock', 1, 'Your freshly-summoned pieces are roused — no summon-sickness.', g => { own(g, 'w').forEach(q => { if (q.cell.b) q.cell.b.z = 0; }); });
  free('Banner of Pawns', 'flag', 2, 'Shield every friendly PAWN.', g => { own(g, 'w').forEach(q => { if (q.cell.t === 'p') Fx.mod(q.cell, 's', 1); }); });
  free('Royal Standard', 'crown', 3, 'Shield your two most advanced pieces AND veil your king.', g => { own(g, 'w').filter(q => q.cell.t !== 'k').sort((a, b) => a.r - b.r).slice(0, 2).forEach(q => Fx.mod(q.cell, 's', 2)); const k = E.findKing(g, 'w'); if (k) Fx.mod(g.board[k.r][k.c], 'v', 2); });
  free('Bishop\'s Gambit', 'rune', 2, 'Upgrade a random BISHOP into a QUEEN.', g => { const b = R(own(g, 'w').filter(q => q.cell.t === 'b')); if (b) { b.cell.t = 'q'; } });
  free('Knight\'s Gambit', 'rune', 2, 'Upgrade a random KNIGHT into a QUEEN.', g => { const b = R(own(g, 'w').filter(q => q.cell.t === 'n')); if (b) { b.cell.t = 'q'; } });
  free('Siege Smith', 'fire', 3, 'Upgrade your most advanced ROOK into a QUEEN.', g => { const r = own(g, 'w').filter(q => q.cell.t === 'r').sort((a, b) => a.r - b.r)[0]; if (r) r.cell.t = 'q'; });
  free('Wall of Steel', 'shield', 2, 'Summon a shield-pawn beside each of your rooks.', g => { for (const q of own(g, 'w').filter(x => x.cell.t === 'r')) { const spots = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r = q.r + dr, c = q.c + dc; if (r >= 0 && r < N(g) && c >= 0 && c < N(g) && !g.board[r][c]) spots.push({ r, c }); } put(g, 'w', 'p', spots); } });
  free('Revive the Rook', 'heart', 3, 'Ransom back a lost ROOK (or strongest fallen piece).', g => { Fx.revive(g, 'w', 1, { type: 'r' }); });
  free('Revive the Steed', 'heart', 2, 'Ransom back a lost KNIGHT.', g => { const r = Fx.revive(g, 'w', 1, { type: 'n' }); if (!r.length) Fx.revive(g, 'w', 1); });
  free('Reinforce the Faith', 'spark', 2, 'Summon a random holy-aligned troop beside your king.', g => { put(g, 'w', R(['guardian', 'griffon', 'siren']), nearKing(g, 'w', 2)); });
  free('Call the Wild', 'paw', 2, 'Summon a random beast beside your king.', g => { put(g, 'w', R(['divinedog', 'warhorse', 'nue', 'spriggan']), nearKing(g, 'w', 2)); });
  free('Deep Court Magic', 'void', 3, 'Summon a random dark-aligned troop anywhere free.', g => { put(g, 'w', R(['lich', 'banshee', 'reaper']), emptySqs(g, homeRanks(g, 'w'), backCols(g))); });
  free('War Machines', 'boltring', 3, 'Summon a random war machine.', g => { put(g, 'w', R(['siegetank', 'howitzer', 'zeppelin']), nearKing(g, 'w', 2)); });
  free('Cavalry Charge Order', 'bone', 2, 'Your most advanced KNIGHT may not be captured for two enemy turns.', g => { const ns = own(g, 'w').filter(q => q.cell.t === 'n').sort((a, b) => a.r - b.r); if (ns[0]) Fx.mod(ns[0].cell, 's', 2); });
  free('Crown the Line', 'crown', 2, 'Shield every piece on your back two ranks.', g => { own(g, 'w').forEach(q => { if (q.r >= N(g) - 2) Fx.mod(q.cell, 's', 1); }); });
  free('Last Stand Order', 'flag', 2, 'Veil every piece on your back two ranks.', g => { own(g, 'w').forEach(q => { if (q.r >= N(g) - 2) Fx.mod(q.cell, 'v', 1); }); });

  /* ---------- K. luck & chaos (extra) ---------- */
  free('Gambler\'s Die', 'dice', 1, 'Roll: even — heal a random friendly piece; odd — freeze a random enemy.', g => { if (Math.random() < 0.5) { const q = R(nonK(own(g, 'w'))); if (q && q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; } } else { Fx.freezeN(g, 'w', 1); } });
  free('Chaos Flask', 'dice', 2, 'Random: either summon a troop, destroy a random enemy, or nothing.', g => { const r = Math.random(); if (r < 0.4) put(g, 'w', R(['imp', 'goblin', 'ranger']), nearKing(g, 'w', 2)); else if (r < 0.8) { const q = R(nonK(enem(g, 'w'))); if (q) Fx.removeAt(g, q.r, q.c, {}); } });
  free('Echo of Ages', 'star', 3, 'Double the shields of every already-shielded friendly piece.', g => { own(g, 'w').forEach(q => { if (q.cell.b && q.cell.b.s > 0) q.cell.b.s *= 2; }); });
  free('Time Favour', 'clock', 3, 'Your next round grants THREE moves instead of two.', g => { if (MD.Campaign && MD.Campaign.active && MD.Campaign.phase === 'reward') { MD.Campaign._nextTokens = 3; } });
  free('Favoured of Fate', 'star', 2, 'All your pieces are cleansed and your most advanced piece is veiled.', g => { own(g, 'w').forEach(q => { if (q.cell.b) { q.cell.b.p = 0; q.cell.b.f = 0; } }); const p = own(g, 'w').filter(q => q.cell.t !== 'k').sort((a, b) => a.r - b.r)[0]; if (p) Fx.mod(p.cell, 'v', 2); });
  free('Conscript Mounts', 'bone', 2, 'Summon a warhorse beside your most advanced knight.', g => { const ns = own(g, 'w').filter(q => q.cell.t === 'n').sort((a, b) => a.r - b.r)[0]; if (ns) put(g, 'w', 'warhorse', [{ r: Math.max(0, ns.r - 1), c: ns.c }]); else put(g, 'w', 'warhorse', nearKing(g, 'w', 2)); });
  free('Fortify the Flanks', 'shield', 1, 'Shield every friendly piece on the two outer files.', g => { const n = N(g); own(g, 'w').forEach(q => { if (q.c === 0 || q.c === n - 1) Fx.mod(q.cell, 's', 1); }); });
  free('Halo of Vigilance', 'spark', 2, 'Shield and cleanse every friendly piece adjacent to your king.', g => { const k = E.findKing(g, 'w'); if (!k) return; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r = k.r + dr, c = k.c + dc; const cell = g.board[r] && g.board[r][c]; if (cell && cell.c === 'w' && cell.t !== 'k') { if (cell.b) { cell.b.p = 0; cell.b.f = 0; } Fx.mod(cell, 's', 1); } } });
  free('Rally the Host', 'flag', 1, 'Shield every piece on your home FILE of the king.', g => { const k = E.findKing(g, 'w'); if (!k) return; for (let r = 0; r < N(g); r++) { const cell = g.board[r] && g.board[r][k.c]; if (cell && cell.c === 'w') Fx.mod(cell, 's', 1); } });
  free('Poisoned Wells', 'drop', 2, 'Lay hidden POISON hazards on random squares of your OWN half (the enemy drinks).', g => { const n = N(g); Fx.layHazards(g, 'poison', 3, { rows: Array.from({ length: n - (n >> 1) }, (_, i) => (n >> 1) + i) }); });

  /* ---------- make the final list collision-free & hand it over ---------- */
  const seen = {};
  const clean = B.filter(b => { if (!b || !b.name || seen[b.name] || (b.cost != null && isNaN(b.cost))) return false; seen[b.name] = 1; return true; });
  MD.CampaignExtraBoons = function (g, wave) { return clean; };
  MD.CampaignExtraBoons.count = () => clean.length;
})();

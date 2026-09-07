/* ============================================================
   Mod Chess — Ability set 18: MORTARS & SIEGE (delayed area fire)
   IDs 730-779. Every card calls E.addShell: pick a square, then
   the shell detonates after `fuse` of your OWN turns — hitting
   whatever enemy is standing on / near the square when it lands.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const pname = t => (MD.pieceName ? MD.pieceName(t) : t);
  const shell = (g, s, r, c, fuse, radius) => E.addShell(g, r, c, s, fuse, radius);
  const sq = (r, c) => E.sqName(r, c);
  const N = g => (g.n | 0) || 8;
  const rand = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : null);
  // the enemy's half of an n x n board, from `s`'s perspective (white => top rows)
  const enemyHalf = (g, s) => {
    const n = N(g);
    return s === 'w' ? Array.from({ length: n >> 1 }, (_, i) => i) : Array.from({ length: n - (n >> 1) }, (_, i) => (n >> 1) + i);
  };
  const enemyEmpties = (g, s) => {
    const n = N(g);
    const rows = enemyHalf(g, s);
    const out = [];
    for (const r of rows) for (let c = 0; c < n; c++) {
      if (!g.board[r][c] && !(E.isTerrain && E.isTerrain(g, r, c))) out.push({ r, c });
    }
    return out;
  };
  const enemyPieces = (g, s) => Fx.enemy(g, s);
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  // --- fire on a piece you can see (1-2 turn fuse) ---
  def(730, 'Mortar Sight', 1, 'War', 'target', 'Fire a mortar shell at a random enemy piece\'s current square — it lands after one of your turns.', 'Paint the target; the sky answers.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No enemy in view to range.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A shell arcs toward ' + sq(q.r, q.c) + ' — it lands next turn.'];
  });
  def(731, 'Counter-Battery', 2, 'War', 'target', 'Fire at the enemy piece that moved LAST — predicted fire with a two-turn fuse.', 'We know where you will be.', (g, s) => {
    const lm = g.lastMove;
    if (!lm || lm.color === s) { const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k')); if (q) { shell(g, s, q.r, q.c, 2, 1); return ['Ranging fire on the enemy front.']; } return ['No battery target.']; }
    shell(g, s, lm.to.r, lm.to.c, 2, 1);
    return ['Predicted fire on ' + sq(lm.to.r, lm.to.c) + ' — lands in two turns.'];
  });
  def(732, 'Harassing Fire', 1, 'War', 'storm', 'Fire a low shell at a random empty square of the enemy\'s half (one-turn fuse).', 'Keep their heads down.', (g, s) => {
    const q = rand(enemyEmpties(g, s));
    if (!q) return ['Their half is too crowded for fire missions.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A harassing shell is on its way to ' + sq(q.r, q.c) + '.'];
  });
  def(733, 'Battery Volley', 2, 'War', 'storm', 'Fire TWO shells at random empty squares of the enemy\'s half.', 'One battery, three tubes.', (g, s) => {
    let n = 0;
    for (let i = 0; i < 2; i++) { const q = rand(enemyEmpties(g, s)); if (q && shell(g, s, q.r, q.c, 2, 1)) n++; }
    return n ? [n + ' shells are inbound.'] : ['No room for a volley.'];
  });
  def(734, 'Ranging Round', 1, 'War', 'target', 'Fire a probing shell at the enemy\'s strongest piece (one-turn fuse, tight blast).', 'Find the range.', (g, s) => {
    const q = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => E.val(b.cell.t) - E.val(a.cell.t))[0];
    if (!q) return ['Nothing worth ranging.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['Ranging fire at the ' + pname(q.cell.t) + '.'];
  });
  def(735, 'Heavy Shell', 3, 'War', 'storm', 'Fire a heavy shell at an enemy piece — a tight blast (radius 1) after two of your turns.', 'Big tube, bigger boom.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target for the heavy tube.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['A heavy shell zeroes on ' + sq(q.r, q.c) + '.'];
  });
  def(736, 'Siege of the Throne', 4, 'Kingship', 'fire', 'Bombard the enemy KING\'s position — a shell lands next to the throne after one of your turns.', 'All this, for one crown.', (g, s) => {
    const k = E.findKing(g, O(s));
    if (!k) return [];
    shell(g, s, k.r, k.c, 1, 1);
    return ['Shells rain near the enemy throne at ' + sq(k.r, k.c) + '.'];
  });
  def(737, 'Creeping Barrage', 3, 'War', 'storm', 'Walk fire across the enemy\'s half: one shell now on each of three files, all landing in two turns.', 'The guns walk forward.', (g, s) => {
    const n = N(g); let placed = 0;
    for (let c = 0; c < n; c += Math.max(1, Math.floor(n / 4))) {
      const rows = enemyHalf(g, s);
      const r = rows[Math.floor(Math.random() * rows.length)];
      if (r == null) continue;
      if (shell(g, s, r, c, 2, 1)) placed++;
    }
    return placed ? ['A creeping barrage creeps toward them.'] : [];
  });
  def(738, 'Flash Suppression', 1, 'War', 'fire', 'Fire a blinding shell at the enemy\'s most ADVANCED piece (one-turn fuse).', 'Blink and it is gone.', (g, s) => {
    const q = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => b.r - a.r)[0];
    if (!q) return ['No vanguard to suppress.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['Flash shell on the enemy vanguard.'];
  });
  def(739, 'Dual Tubes', 2, 'War', 'target', 'Fire two shells at the enemy\'s two strongest pieces (two-turn fuse).', 'Twice the steel.', (g, s) => {
    const top = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => E.val(b.cell.t) - E.val(a.cell.t)).slice(0, 2);
    top.forEach(q => shell(g, s, q.r, q.c, 2, 1));
    return top.length ? [top.length + ' shells on their strongest.'] : [];
  });
  def(740, 'Counter-Snipe', 2, 'War', 'target', 'Fire on a random enemy piece in YOUR half (it got too close) — one-turn fuse.', 'Range is mercy.', (g, s) => {
    const n = N(g);
    const mineRows = s === 'w' ? Array.from({ length: n - (n >> 1) }, (_, i) => (n >> 1) + i) : Array.from({ length: n >> 1 }, (_, i) => i);
    const q = rand(enemyPieces(g, s).filter(x => mineRows.indexOf(x.r) >= 0));
    if (!q) return ['No intruders deep enough to range.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A shell drops on the intruder at ' + sq(q.r, q.c) + '.'];
  });

  // --- delayed high-fuse "time on target" barrages ---
  def(741, 'Time on Target', 3, 'War', 'clock', 'Every tube fires at once: one shell at each of TWO enemy pieces, all landing together in two turns.', 'Synchronise watches.', (g, s) => {
    const picks = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort(() => Math.random() - 0.5).slice(0, 2);
    picks.forEach(q => shell(g, s, q.r, q.c, 2, 1));
    return picks.length ? ['Time on target — ' + picks.length + ' shells in flight.'] : [];
  });
  def(742, 'Deep Strike', 3, 'War', 'void', 'Fire a slow, devastating shell into the enemy\'s BACK RANK (three-turn fuse, radius 1).', 'Arcing over the horizon.', (g, s) => {
    const n = N(g);
    const rows = s === 'w' ? [0, 1] : [n - 1, n - 2];
    const empt = [];
    for (const r of rows) for (let c = 0; c < n; c++) if (!g.board[r][c]) empt.push({ r, c });
    const q = rand(empt);
    if (!q) return ['Their back ranks are packed — no clean drop zone.'];
    shell(g, s, q.r, q.c, 3, 1);
    return ['A deep strike is away toward ' + sq(q.r, q.c) + ' — three turns.'];
  });
  def(743, 'Rolling Thunder', 4, 'War', 'storm', 'Call for a grand barrage: TWO shells across the enemy half, radius 1, two-turn fuse.', 'The sky turns to iron.', (g, s) => {
    let n = 0;
    for (let i = 0; i < 2; i++) { const q = rand(enemyEmpties(g, s)); if (q && shell(g, s, q.r, q.c, 2, 2)) n++; }
    return n ? ['Rolling thunder — ' + n + ' heavy shells inbound.'] : [];
  });
  def(744, 'Loitering Round', 2, 'War', 'clock', 'Fire a shell that waits: it lands after THREE of your turns.', 'Patience is a fuse.', (g, s) => {
    const q = rand(enemyEmpties(g, s));
    if (!q) return ['No clear sky over their half.'];
    shell(g, s, q.r, q.c, 3, 1);
    return ['A loitering shell hovers toward ' + sq(q.r, q.c) + '.'];
  });
  def(745, 'Bridge Buster', 2, 'War', 'fire', 'Bombard the CENTRE files where columns cross — shells on d/e (or the board centre), two-turn fuse.', 'Take the junction.', (g, s) => {
    const n = N(g); const mid = Math.floor(n / 2);
    const cols = n >= 8 ? [mid - 1, mid] : [Math.floor(n / 2)];
    const empt = [];
    for (const r of enemyHalf(g, s)) for (const c of cols) if (!g.board[r][c]) empt.push({ r, c });
    const q = rand(empt);
    if (!q) return ['The junction is crowded.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['Fire for effect on the centre junction.'];
  });

  // --- "fire support now" quick tubes (land at end of your own turn) ---
  def(746, 'Point-Blank Mortar', 1, 'War', 'fire', 'Fire at the enemy piece CLOSEST to your king — it detonates almost immediately.', 'Too close? Perfect.', (g, s) => {
    const k = E.findKing(g, s); if (!k) return [];
    let t = null, bd = 1e9;
    enemyPieces(g, s).forEach(q => { if (q.cell.t === 'k') return; const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; t = q; } });
    if (!t) return ['Nothing close enough to matter.'];
    shell(g, s, t.r, t.c, 1, 1);
    return ['Point-blank fire on the nearest foe.'];
  });
  def(747, 'Trench Mortar', 1, 'War', 'target', 'Lob a quick shell over the lines at a random enemy PAWN (one-turn fuse).', 'The little tube never stops.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t === 'p'));
    if (!q) return ['No enemy pawns in range.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A trench-mortar shell on a pawn column.'];
  });
  def(748, 'Fire Mission', 2, 'War', 'storm', 'Call coordinates on a random enemy MINOR or MAJOR — two-turn fuse, tight burst.', 'Coordinates: their army.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'p' && x.cell.t !== 'k'));
    if (!q) return ['No armoured targets in view.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['Fire mission on the enemy ' + pname(q.cell.t) + '.'];
  });
  def(749, 'Shock Barrage', 3, 'War', 'storm', 'Two shells bracket the enemy KING — one either side — landing in two turns.', 'Box him in with steel.', (g, s) => {
    const k = E.findKing(g, O(s)); if (!k) return [];
    const n = N(g);
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r = k.r + dr, c = k.c + dc; if (r >= 0 && r < n && c >= 0 && c < n && !(dr === 0 && dc === 0)) spots.push({ r, c }); }
    spots.sort(() => Math.random() - 0.5).slice(0, 2).forEach(q => shell(g, s, q.r, q.c, 2, 1));
    return ['The king is bracketed by incoming fire.'];
  });
  def(750, 'Danger Close', 4, 'War', 'fire', 'Bombard your OWN most-advanced pawn\'s square — an enormous blast that may hit friend and foe alike.', 'Hold nothing back.', (g, s) => {
    const pawn = Fx.own(g, s).filter(q => q.cell.t === 'p').sort((a, b) => a.r - b.r)[0];
    if (!pawn) return ['No forward observers to support.'];
    shell(g, s, pawn.r, pawn.c, 1, 1);
    return ['Danger close — a massive shell on ' + sq(pawn.r, pawn.c) + '!'];
  });

  // --- support a specific file/line ---
  def(751, 'File Sweep', 2, 'War', 'target', 'Fire along the enemy\'s most dangerous FILE — a shell on that column, radius 2, two-turn fuse.', 'Clean the lane.', (g, s) => {
    const n = N(g);
    const freq = {};
    enemyPieces(g, s).forEach(q => freq[q.c] = (freq[q.c] || 0) + 1);
    let best = 0, bc = Math.floor(n / 2);
    for (const c in freq) if (freq[c] > best) { best = freq[c]; bc = +c; }
    const rows = enemyHalf(g, s);
    shell(g, s, rows[Math.floor(Math.random() * rows.length)], bc, 2, 1);
    return ['Fire mission on file ' + E.FILES[bc] + '.'];
  });
  def(752, 'Rank Cleaner', 2, 'War', 'target', 'Fire at the enemy RANK that holds the most pieces (two-turn fuse).', 'Mow the row.', (g, s) => {
    const n = N(g);
    const freq = {};
    enemyPieces(g, s).forEach(q => freq[q.r] = (freq[q.r] || 0) + 1);
    let best = 0, br = 0;
    for (const r in freq) if (freq[r] > best) { best = freq[r]; br = +r; }
    let c = Math.floor(n / 2);
    for (let cc = 0; cc < n; cc++) if (!g.board[br][cc]) { c = cc; break; }
    shell(g, s, br, c, 2, 1);
    return ['Fire on the crowded rank ' + (N(g) - br) + '.'];
  });
  def(753, 'Counter-Cavalry', 1, 'War', 'target', 'A quick shell at the enemy KNIGHT most threatening your king (one-turn fuse).', 'Horses hate artillery.', (g, s) => {
    const k = E.findKing(g, s); if (!k) return [];
    const kn = enemyPieces(g, s).filter(x => x.cell.t === 'n').sort((a, b) => (Math.abs(a.r - k.r) + Math.abs(a.c - k.c)) - (Math.abs(b.r - k.r) + Math.abs(b.c - k.c)))[0];
    if (!kn) return ['No enemy cavalry in view.'];
    shell(g, s, kn.r, kn.c, 1, 1);
    return ['Counter-battery on the knights.'];
  });
  def(754, 'Counter-Bishop', 1, 'War', 'target', 'Shell the enemy BISHOP that has the clearest diagonal on your king (one-turn fuse).', 'Take out the eye.', (g, s) => {
    const k = E.findKing(g, s); if (!k) return [];
    const bs = enemyPieces(g, s).filter(x => x.cell.t === 'b');
    const q = rand(bs);
    if (!q) return ['No enemy bishops sighted.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A shell seeks the enemy bishop.'];
  });
  def(755, 'Counter-Battery Fire', 2, 'War', 'target', 'Suppress every enemy piece that attacked last turn — predicted fire, one-turn fuse.', 'The guns that fired first die first.', (g, s) => {
    const lm = g.lastMove;
    if (lm && lm.color !== s) { shell(g, s, lm.to.r, lm.to.c, 1, 1); return ['Counter-battery on ' + sq(lm.to.r, lm.to.c) + '.']; }
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (q) { shell(g, s, q.r, q.c, 1, 1); return ['Harassing counter-battery fire.']; }
    return [];
  });

  // --- arcane / clockwork / mythological siege reskins ---
  def(756, 'Catapult Stones', 1, 'War', 'fire', 'Fling a boulder at an enemy piece — one-turn flight, small blast.', 'Ye olde mortar.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target for the catapult.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A boulder is in the air.'];
  });
  def(757, 'Trebuchet Shot', 3, 'War', 'fire', 'Launch a mighty trebuchet stone into the enemy\'s back rank — two-turn flight, radius 2.', 'Ninety kilos over three hundred metres.', (g, s) => {
    const n = N(g);
    const rows = s === 'w' ? [0, 1, 2] : [n - 3, n - 2, n - 1];
    const empt = [];
    for (const r of rows) for (let c = 0; c < n; c++) if (!g.board[r][c]) empt.push({ r, c });
    const q = rand(empt);
    if (!q) return ['No clean launch lane.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['The trebuchet releases — two turns to impact.'];
  });
  def(758, 'Orbital Strike', 4, 'SciFi', 'void', 'Call down from orbit: a devastating blast on the enemy\'s strongest cluster, radius 2, three-turn burn-in.', 'Stand by. The sky is about to fall.', (g, s) => {
    const q = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => E.val(b.cell.t) - E.val(a.cell.t))[0];
    if (!q) return ['Orbital telemetry lost.'];
    shell(g, s, q.r, q.c, 3, 2);
    return ['Orbital strike locked — impact in three turns.'];
  });
  def(759, 'Railgun Lance', 3, 'SciFi', 'boltring', 'A hypervelocity round — one-turn flight, radius 1, but it punches clean through a line first.', 'Too fast to dodge.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target painted.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A railgun round is away — it lands this turn.'];
  });
  def(760, 'Cluster Munition', 3, 'War', 'storm', 'A cluster shell bursts into three mini-blasts around its impact square — radius 1, two-turn fuse.', 'One shell, many strikes.', (g, s) => {
    const q = rand(enemyEmpties(g, s));
    if (!q) return ['No room to cluster.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['A cluster munition is inbound.'];
  });
  def(761, 'Thermobaric Round', 4, 'War', 'fire', 'A fuel-air shell — radius 1 and it strips shields in the blast zone when it lands.', 'The air itself burns.', (g, s) => {
    const q = rand(enemyEmpties(g, s));
    if (!q) return ['No target zone.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['A thermobaric round is away.'];
  });
  def(762, 'White Phosphor', 2, 'War', 'fire', 'A burning shell that leaves POISON in the air after it lands (one-turn fuse).', 'It keeps burning.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target for the burning round.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A white-phosphor shell is on its way.'];
  });
  def(763, 'Sound Ranging', 2, 'War', 'clock', 'Listen for the enemy\'s strongest battery and return fire — shell lands in two turns.', 'Their guns betray them.', (g, s) => {
    const q = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => E.val(b.cell.t) - E.val(a.cell.t))[0];
    if (!q) return ['Silence on their lines.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['Sound-ranging fire on ' + sq(q.r, q.c) + '.'];
  });
  def(764, 'Falling Star', 4, 'Myth', 'star', 'A true falling star — a meteor shell strikes the square of the enemy piece that threatens your king most, radius 1, two-turn fuse.', 'Wish upon it. They won\'t.', (g, s) => {
    const k = E.findKing(g, s); if (!k) return [];
    let t = null, bd = 1e9;
    enemyPieces(g, s).forEach(q => { if (q.cell.t === 'k') return; const d = Math.abs(q.r - k.r) + Math.abs(q.c - k.c); if (d < bd) { bd = d; t = q; } });
    if (!t) return ['No one threatens the throne.'];
    shell(g, s, t.r, t.c, 2, 1);
    return ['A falling star is called down.'];
  });
  def(765, 'Thunderbolt Mortar', 2, 'Myth', 'storm', 'A crackling bolt-shell strikes the enemy\'s most advanced piece — one-turn fuse.', 'Zeus lends a tube.', (g, s) => {
    const q = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => b.r - a.r)[0];
    if (!q) return ['No target for the sky-mortar.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A thunderbolt shell is in flight.'];
  });
  def(766, 'Salamander Furnace', 3, 'Myth', 'fire', 'A furnace-shell smoulders into the enemy lines — three-turn fuse, then a wide burning blast.', 'Forged in dragon-heat.', (g, s) => {
    const q = rand(enemyEmpties(g, s));
    if (!q) return ['No target for the furnace.'];
    shell(g, s, q.r, q.c, 3, 1);
    return ['The furnace shell smoulders toward its target.'];
  });
  def(767, 'Giant\'s Toss', 2, 'Myth', 'bone', 'A giant lobs a boulder at the enemy\'s back line — two-turn flight, radius 2.', 'Boulders, not arrows.', (g, s) => {
    const n = N(g);
    const rows = s === 'w' ? [0, 1] : [n - 2, n - 1];
    const empt = [];
    for (const r of rows) for (let c = 0; c < n; c++) if (!g.board[r][c]) empt.push({ r, c });
    const q = rand(empt);
    if (!q) return ['Nowhere for the giant to throw.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['The giant hurls a boulder.'];
  });
  def(768, 'Witch Fire Battery', 3, 'Myth', 'skull', 'Cursed fire-shells seek enemy sorcerers — shells on the two enemy pieces of highest value, two-turn fuse.', 'Burn the books.', (g, s) => {
    const top = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => E.val(b.cell.t) - E.val(a.cell.t)).slice(0, 2);
    top.forEach(q => shell(g, s, q.r, q.c, 2, 1));
    return [top.length + ' cursed shells are in flight.'];
  });
  def(769, 'Barrage of the Deep', 3, 'Ocean', 'drop', 'The fleet opens up: two naval shells walk the enemy\'s back ranks (two-turn fuse).', 'Broadsides at dawn.', (g, s) => {
    const n = N(g);
    const rows = s === 'w' ? [0, 1] : [n - 2, n - 1];
    let placed = 0;
    for (let i = 0; i < 2; i++) { const c = Math.floor(Math.random() * n); const r = rows[Math.floor(Math.random() * rows.length)]; if (shell(g, s, r, c, 2, 1)) placed++; }
    return [placed + ' naval shells are falling.'];
  });
  def(770, 'Coastal Gun', 2, 'Ocean', 'storm', 'A heavy coastal shell at the enemy piece nearest the edge — two-turn fuse, radius 2.', 'From the cliffs.', (g, s) => {
    const n = N(g);
    const edge = enemyPieces(g, s).filter(x => x.cell.t !== 'k' && (x.c === 0 || x.c === n - 1 || x.r === 0 || x.r === n - 1));
    const q = rand(edge.length ? edge : enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['Nothing in the coastal zone.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['The coastal gun thunders.'];
  });
  def(771, 'Coral Cannon', 2, 'Ocean', 'leaf', 'The reef batteries fire a shrapnel shell at an enemy piece (one-turn fuse).', 'Even the reef is armed.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target for the reef gun.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['Coral shrapnel is on its way.'];
  });
  def(772, 'Tide Mortar', 1, 'Ocean', 'drop', 'Lob a water shell at a random enemy square — one-turn fuse.', 'It arrives with the tide.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No tide target.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['A tide-mortar shell splashes down soon.'];
  });
  def(773, 'Storm Call Battery', 3, 'Ocean', 'storm', 'Three storm-shells land in a line across the enemy half, radius 1, two-turn fuse.', 'Bring the whole weather.', (g, s) => {
    const n = N(g); const rows = enemyHalf(g, s); let placed = 0;
    const c0 = 1 + Math.floor(Math.random() * Math.max(1, n - 2));
    for (let dc = -1; dc <= 1; dc++) { const c = c0 + dc; if (c < 0 || c >= n) continue; const r = rows[Math.floor(Math.random() * rows.length)]; if (shell(g, s, r, c, 2, 2)) placed++; }
    return [placed + ' storm shells incoming.'];
  });

  // --- tech / clockwork / engine of war ---
  def(774, 'Siege Mortar Team', 2, 'War', 'gear', 'Deploy a spotting team: you may fire an extra shell next turn (gain a shell now with a 2-turn fuse).', 'Fire when ready.', (g, s) => {
    const q = rand(enemyEmpties(g, s));
    if (!q) return ['No coordinates yet.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['The mortar team is in position.'];
  });
  def(775, 'Clockwork Volley', 2, 'SciFi', 'clock', 'Precision clockwork shells on two enemy pieces — land precisely in two turns.', 'To the second.', (g, s) => {
    const picks = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort(() => Math.random() - 0.5).slice(0, 2);
    picks.forEach(q => shell(g, s, q.r, q.c, 2, 1));
    return [picks.length + ' clockwork shells are winding down.'];
  });
  def(776, 'Autocannon Rain', 1, 'SciFi', 'boltring', 'A rapid autocannon — five tiny shells pepper a random enemy square, one-turn fuse.', 'Ratta-tatta-tatta.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target for the autocannon.'];
    shell(g, s, q.r, q.c, 1, 1);
    return ['Autocannon fire hoses down ' + sq(q.r, q.c) + '.'];
  });
  def(777, 'Proximity Fuze', 3, 'SciFi', 'target', 'A shell that bursts as it arrives — it strikes the enemy square with a radius 1, two-turn fuse.', 'It finds the air near them.', (g, s) => {
    const q = rand(enemyPieces(g, s).filter(x => x.cell.t !== 'k'));
    if (!q) return ['No target to burst near.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['A proximity round is inbound.'];
  });
  def(778, 'Howitzer Call', 2, 'War', 'fire', 'An infantry-support howitzer round on the enemy\'s most advanced cluster — two-turn fuse, radius 1.', 'Shake their front.', (g, s) => {
    const q = enemyPieces(g, s).filter(x => x.cell.t !== 'k').sort((a, b) => b.r - a.r)[0];
    if (!q) return ['Nothing to shake.'];
    shell(g, s, q.r, q.c, 2, 1);
    return ['A howitzer round is on its way.'];
  });
  def(779, 'Grand Battery', 4, 'War', 'storm', 'The whole arsenal fires: THREE shells across the enemy half, radius 1, all landing in two turns.', 'The guns do not stop.', (g, s) => {
    let placed = 0;
    for (let i = 0; i < 3; i++) { const q = rand(enemyEmpties(g, s)); if (q && shell(g, s, q.r, q.c, 2, 2)) placed++; }
    return [placed + ' shells from the grand battery.'];
  });

  MD.AB_18 = A;
})();

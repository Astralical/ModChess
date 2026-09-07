/* ============================================================
   Mod Chess — CAMPAIGN MODE: "Siege of the Crystal Throne"
   A roguelike, one-time-run adventure layered on the chess board.
   You (White) defend the Throne against escalating WAVES of the
   Warlord's host. Your army PERSISTS between waves; every capture
   earns gold; after each wave you pick a boon (or risk an event).
   Die once and the run is over — a 1-time run.

   Turn flow each round: move up to 2 of your pieces, then press
   "Enemy Phase" — every surviving enemy steps once. Clear the
   wave (including the Warlord) to survive. Hold through 6 waves.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  if (!MD || !MD.Engine || !MD.Game) return; // loaded after main
  const E = MD.Engine, Fx = MD.Fx, UI = MD.UI;
  const O = E.opp;
  const $ = id => document.getElementById(id);
  const LOG = root.MD.addLog;

  const C = MD.Campaign = {
    active: false, run: null, g: null,
    phase: 'idle',            // idle | player | enemy | reward | over
    tokens: 2, enemyRunning: false,
    _orig: {}
  };
  const TOTAL_WAVES = 6;

  /* ---------------- terrain board templates ----------------
     each map: 8 rows x 8 chars from the top (black side) down to the bottom.
     '.' open · '#' wall (blocks move+sight) · '~' river (blocks move+sight).
     No map ever fully blocks a lane — there is always a way across. */
  const MAPS = [
    { name: 'The Open Field', grid: [
      '........', '........', '........', '........', '........', '........', '........', '........'] },
    { name: 'Ruined Keep', grid: [
      '........', '...#....', '..##....', '....#...', '...#....', '....#...', '...#....', '........'] },
    { name: 'The Divided River', grid: [
      '........', '...~....', '...~....', '...~....', '....~...', '....~...', '....~...', '........'] },
    { name: 'Twin Bastions', grid: [
      '........', '........', '..##.##.', '........', '........', '..##.##.', '........', '........'] },
    { name: 'Frozen Shallows', grid: [
      '..~~....', '........', '....~~..', '........', '..~~....', '........', '....~~..', '........'] },
    { name: 'Canyon of Bones', grid: [
      '........', '..#...#.', '..#...#.', '..#...#.', '..#...#.', '..#...#.', '..#...#.', '........'] }
  ];

  /* ---------------- wave recipes (escalating) ---------------- */
  // each recipe lists unit types; the Warlord (black king) is always added
  const WAVES = [
    ['p', 'p', 'p', 'p', 'p', 'p'],                                   // wave 1
    ['p', 'p', 'p', 'p', 'p', 'p', 'n', 'n'],                         // wave 2
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'n', 'b', 'r'],               // wave 3
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'r', 'r', 'b', 'n', 'imp'],   // wave 4
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'q', 'r', 'b', 'n', 'warhorse', 'hydraling'], // wave 5
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'q', 'q', 'r', 'r', 'b', 'n', 'siren', 'golem'] // wave 6 boss
  ];
  const valOf = t => E.val(t);

  function applyMap(g, map) {
    if (g.blocked) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.blocked[r][c] = null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const ch = map.grid[r][c];
      if (ch === '#') E.setTerrain(g, r, c, 'wall');
      else if (ch === '~') E.setTerrain(g, r, c, 'river');
    }
    if (C.run) C.run.mapName = map.name;
  }

  // re-deploy the surviving defenders into a fresh formation (no spawn-camping)
  function redeploy(g) {
    const units = listPieces(g, 'w');
    const free = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c] && !E.isTerrain(g, r, c);
    const king = units.find(u => u.cell.t === 'k');
    const rest = units.filter(u => u !== king).sort(() => Math.random() - 0.5);
    const clearCell = u => { g.board[u.r][u.c] = null; };
    // put the king safely on e1 (or the nearest free back square)
    const backSpots = [];
    for (const r of [7, 6, 5]) for (let c = 0; c < 8; c++) if (free(r, c)) backSpots.push({ r, c });
    let si = 0;
    if (king) {
      clearCell(king);
      const sq = (free(7, 4) ? { r: 7, c: 4 } : backSpots[0]) || { r: 6, c: 4 };
      g.board[sq.r][sq.c] = { c: 'w', t: 'k' };
    }
    // array of still-free back squares (recompute after king)
    const spots = [];
    for (const r of [7, 6, 5, 4]) for (let c = 0; c < 8; c++) if (free(r, c)) spots.push({ r, c });
    const anyFree = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (free(r, c)) anyFree.push({ r, c });
    for (const u of rest) {
      clearCell(u);
      let sq = spots[si++];
      if (!sq) sq = anyFree.length ? anyFree[Math.floor(Math.random() * anyFree.length)] : null;
      if (sq && free(sq.r, sq.c)) g.board[sq.r][sq.c] = { c: 'w', t: u.cell.t };
    }
    // rebuild anyTroop flag
    g.anyTroop = listPieces(g, 'w').some(p => E.isTroop(p.cell.t));
  }

  /* ---------------- board helpers ---------------- */
  function count(g, color) {
    let n = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && cell.c === color) n++;
    }
    return n;
  }
  function listPieces(g, color) {
    const out = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (cell && cell.c === color) out.push({ r, c, cell });
    }
    return out;
  }
  function findFree(g, ranks, cols) {
    const order = [];
    for (const r of ranks) for (const c of cols) if (!g.board[r][c] && !E.isTerrain(g, r, c)) order.push({ r, c });
    return order.length ? order[Math.floor(Math.random() * order.length)] : null;
  }
  function placeRaw(g, color, type, r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7 || g.board[r][c]) return false;
    if (E.isTerrain(g, r, c)) return false;
    g.board[r][c] = { c: color, t: type };
    if (E.isTroop(type)) g.anyTroop = true;
    return true;
  }

  /* ==================== SETUP ==================== */
  function buildGame() {
    const g = E.newGame();
    g.battleLog = []; g.logSeq = 0; g.spellLog = []; g.spellSeq = 0;
    g.extra = { w: 0, b: 0 }; g.extraCycle = { w: false, b: false };
    g.castle = { wk: false, wq: false, bk: false, bq: false };
    g.hist = []; g.lastMove = null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g.board[r][c] = null;
    // classic back rank with the king on e1 and NO queen (she must be earned)
    const back = { 0: 'r', 1: 'n', 2: 'b', 4: 'k', 5: 'b', 6: 'n', 7: 'r' };
    for (const c in back) g.board[7][+c] = { c: 'w', t: back[c] };
    for (let c = 0; c < 8; c++) g.board[6][c] = { c: 'w', t: 'p' };
    return g;
  }

  C.start = function () {
    // stop any existing standard game cleanly
    if (C.active) C.stop(false);
    const g = buildGame();
    const run = {
      wave: 1, gold: 0, kills: 0, rounds: 0, best: readBest(),
      mapOff: Math.floor(Math.random() * MAPS.length), mapName: 'The Open Field',
      startPlies: 0
    };
    C.g = g; C.run = run; C.active = true; C.phase = 'player';
    const Game = MD.Game;
    // reuse the live game state so the whole UI renders our board
    Game.g = g;
    Game.cfg = { botMode: true, diff: 3, human: 'w', mode: 'classic', campaign: true };
    Game.humanColor = 'w';
    Game.sel = null; Game.premove = null; Game.legalCache = [];
    Game.pickingIdx = -1; Game.pendingAbility = null; Game.promoPending = null;
    Game.lastAnimate = null;
    if (UI.setHomeColor) UI.setHomeColor('w');
    if (UI.closeModal) UI.closeModal('menuModal');
    if (UI.closeModal) UI.closeModal('resultModal');
    if (UI.closeModal) UI.closeModal('campRewardModal');
    if (UI.closeModal) UI.closeModal('campEndModal');
    UI.clearMsg();
    patchGame();
    showHud(true);
    LOG(g, '⚔ Campaign run begins — defend the Crystal Throne for ' + TOTAL_WAVES + ' waves.', 'sys', 'flag');
    LOG(g, 'Move up to 2 pieces per round, then press ENEMY PHASE. Captures earn gold. If your King falls, the run ends.', 'sys', 'flag');
    spawnWave(g, 1);
    C.tokens = 2;
    g.turn = 'w';
    Game.phase = 'move';
    UI.render();
    updateHud();
    banner('Wave 1 — The Warlord\'s vanguard marches on the Throne.', 'warn');
  };

  /* monkey-patch the shared Game object while a run is active so the
     standard chess input path is used but the flow is campaign-driven */
  function patchGame() {
    const Game = MD.Game;
    C._orig = {
      canGrab: Game.canGrab, grab: Game.grab,
      attemptUserMove: Game.attemptUserMove, startTurn: Game.startTurn,
      renderAndMaybeBot: Game.renderAndMaybeBot, finish: Game.finish,
      applyMove: Game.applyMove, skipAbility: Game.skipAbility
    };
    Game.canGrab = campCanGrab;
    Game.grab = campGrab;
    Game.attemptUserMove = campAttempt;
    Game.startTurn = () => {};
    Game.renderAndMaybeBot = () => {};
    Game.applyMove = () => {};
    Game.skipAbility = () => {};
  }
  function unpatch() {
    const Game = MD.Game;
    if (Game) for (const k in C._orig) if (C._orig[k]) Game[k] = C._orig[k];
    C._orig = {};
  }

  C.stop = function (toMenu) {
    if (!C.active) return;
    C.active = false; C.phase = 'idle';
    unpatch();
    showHud(false);
    UI.clearMsg();
    if (toMenu && MD.Game && MD.Game.showMenu) { MD.Game.g = null; MD.Game.showMenu(); }
  };

  /* ==================== PLAYER TURN (multi-move round) ==================== */
  function playerTurn() {
    if (!C.active) return;
    C.phase = 'player'; C.enemyRunning = false;
    const g = C.g;
    g.turn = 'w';
    for (const p of listPieces(g, 'w')) delete p.cell.moved;
    C.tokens = 2;
    // If the defender has NO legal move at all the run is over (checkmate/stalemate)
    if (E.legalMoves(g, 'w').length === 0) {
      endRun(false, E.inCheck(g, 'w') ? 'Checkmate — the Throne is surrounded and your king cannot move.' : 'Stalemate — your army is cornered with no legal move.');
      return;
    }
    MD.Game.phase = 'move';
    MD.Game.sel = null; MD.Game.legalCache = [];
    UI.render();
    updateHud();
  }

  function campCanGrab(r, c) {
    const g = C.g;
    if (!C.active || C.phase !== 'player' || C.enemyRunning) return false;
    const cell = g.board[r] && g.board[r][c];
    if (!cell || cell.c !== 'w') return false;
    if (g.turn !== 'w') return false;
    if (cell.moved) return false;                     // already moved this round
    if (cell.b && (cell.b.f > 0 || cell.b.z > 0)) return false;
    return true;
  }

  function campGrab(r, c) {
    MD.Game.sel = { r, c };
    MD.Game.legalCache = E.legalMoves(C.g, 'w').filter(m => m.r0 === r && m.c0 === c && !(C.g.board[m.r1][m.c1] && C.g.board[m.r1][m.c1].moved));
    UI.render();
  }

  function campAttempt(from, to) {
    if (!C.active || C.phase !== 'player' || C.enemyRunning) return;
    const g = C.g;
    const fromCell = g.board[from.r] && g.board[from.r][from.c];
    if (!fromCell || fromCell.c !== 'w' || fromCell.moved) return;
    if (C.tokens <= 0) return;
    const cands = E.legalMoves(g, 'w').filter(m => m.r0 === from.r && m.c0 === from.c && m.r1 === to.r && m.c1 === to.c);
    if (!cands.length) { MD.Game.sel = null; UI.render(); return; }
    // promotion: auto-queen for speed
    const mv = cands.find(m => !m.promo) || cands.find(m => m.promo === 'q') || cands[0];
    applyPlayerMove(g, mv);
  }

  function applyPlayerMove(g, mv) {
    const wasCapture = !!(g.board[mv.r1][mv.c1]);
    const capVal = wasCapture ? valOf(g.board[mv.r1][mv.c1].t) : 0;
    const anim = { from: { r: mv.r0, c: mv.c0 }, to: { r: mv.r1, c: mv.c1 } };
    E.applyMove(g, mv);
    MD.Game.lastAnimate = anim;
    MD.playSfx(wasCapture ? 'capture' : 'move');
    const san = g.lastMove ? g.lastMove.san : '';
    LOG(g, '⚔ ' + san, 'w', 'sword');
    if (wasCapture) {
      C.run.kills++;
      C.run.gold += Math.max(100, Math.round(capVal / 5) * 50);
      LOG(g, 'Your forces destroy an enemy unit — +' + Math.max(100, Math.round(capVal / 5) * 50) + ' gold.', 'sys', 'coin');
    }
    // mark moved
    const moved = g.board[mv.r1][mv.c1];
    if (moved) moved.moved = true;
    E.tickAfterMove(g, 'w');
    C.run.rounds++;
    MD.Game.sel = null;
    UI.render();
    updateHud();
    // wave cleared by your attack?
    if (count(g, 'b') === 0) { onWaveCleared(); return; }
    C.tokens--;
    if (C.tokens <= 0) {
      banner('Your round is spent — the enemy marches.', 'info');
      endPlayerRound();
    } else {
      banner(C.tokens + ' move' + (C.tokens > 1 ? 's' : '') + ' left this round.', 'info');
    }
  }

  function endPlayerRound() {
    if (C.phase !== 'player' || C.enemyRunning) return;
    const g = C.g;
    if (!E.hasKing(g, 'w')) { endRun(false, 'Your King was captured and the Throne has fallen.'); return; }
    if (count(g, 'b') === 0) { onWaveCleared(); return; }
    runEnemyPhase();
  }

  /* ==================== ENEMY PHASE ==================== */
  function runEnemyPhase() {
    if (!C.active) return;
    C.phase = 'enemy'; C.enemyRunning = true;
    const g = C.g;
    g.turn = 'b';
    MD.Game.sel = null; MD.Game.legalCache = [];
    UI.render();
    banner('The enemy host advances…', 'warn');
    const movers = listPieces(g, 'b');
    let i = 0;
    const step = () => {
      if (!C.active || C.phase !== 'enemy') return;
      if (!E.hasKing(g, 'w')) { endRun(false, 'Your King was captured and the Throne has fallen.'); return; }
      if (count(g, 'b') === 0) { onWaveCleared(); return; }
      // find the next black piece (in order) that can still move
      while (i < movers.length) {
        const sq = movers[i++];
        if (!sq) continue;
        const cell = g.board[sq.r] && g.board[sq.r][sq.c];
        if (!cell || cell.c !== 'b') continue; // it died earlier this phase
        if (cell.b && cell.b.f > 0) continue;  // frozen can't act
        const mv = chooseEnemyMove(g, sq.r, sq.c);
        if (mv) {
          applyEnemyMove(g, mv);
          return setTimeout(step, 130);
        }
      }
      // every surviving enemy has stepped
      E.tickAfterMove(g, 'b');
      UI.render();
      afterEnemyPhase();
    };
    setTimeout(step, 260);
  }

  function chooseEnemyMove(g, r, c) {
    const moves = E.legalMoves(g, 'b').filter(m => m.r0 === r && m.c0 === c);
    if (!moves.length) return null;
    const piece = g.board[r][c];
    // The Warlord is a commander, not a berserker: he only stirs to escape
    // check (or to finish a defenceless king). He does not charge.
    if (piece && piece.t === 'k') {
      const finisher = moves.find(m => m.capture && g.board[m.r1][m.c1] && g.board[m.r1][m.c1].t === 'k');
      if (finisher) return finisher;
      if (!E.inCheck(g, 'b')) return null;
      // escape: run to the square farthest from the nearest attacker
      const whites = listPieces(g, 'w');
      let best = null, bestD = -1;
      for (const mv of moves) {
        if (mv.capture && g.board[mv.r1][mv.c1] && g.board[mv.r1][mv.c1].t === 'k') return mv;
        let dmin = 99;
        for (const w of whites) { const dd = Math.abs(mv.r1 - w.r) + Math.abs(mv.c1 - w.c); if (dd < dmin) dmin = dd; }
        if (dmin > bestD) { bestD = dmin; best = mv; }
      }
      return best;
    }
    // nearest white piece (distance heuristic)
    const whites = listPieces(g, 'w');
    let best = null, bestScore = -1e9;
    for (const mv of moves) {
      let score = 0;
      if (mv.promo) score += 1600;                    // push for promotion
      if (mv.capture) {
        const target = g.board[mv.r1][mv.c1];
        score += 900 + (target ? valOf(target.t) : 0);
        if (target && target.t === 'k') score += 20000;
      }
      // approach the closest white piece
      let d0 = 99, d1 = 99;
      for (const w of whites) {
        const dd = Math.abs(r - w.r) + Math.abs(c - w.c);
        if (dd < d0) d0 = dd;
        const dd2 = Math.abs(mv.r1 - w.r) + Math.abs(mv.c1 - w.c);
        if (dd2 < d1) d1 = dd2;
      }
      score += (d0 - d1) * 40;
      // small preference to advance (black moves down)
      score += (mv.r1 - r) * 6;
      if (score > bestScore) { bestScore = score; best = mv; }
    }
    return best;
  }

  function applyEnemyMove(g, mv) {
    const wasCapture = !!(g.board[mv.r1][mv.c1]);
    const anim = { from: { r: mv.r0, c: mv.c0 }, to: { r: mv.r1, c: mv.c1 } };
    E.applyMove(g, mv);
    MD.Game.lastAnimate = anim;
    MD.playSfx(wasCapture ? 'capture' : 'move');
    const san = g.lastMove ? g.lastMove.san : '';
    LOG(g, '☠ ' + san, 'b', 'skull');
    const m = g.board[mv.r1][mv.c1];
    if (m) m.moved = true;
    UI.render();
    updateHud();
  }

  function afterEnemyPhase() {
    if (!C.active) return;
    const g = C.g;
    C.enemyRunning = false;
    if (!E.hasKing(g, 'w')) { endRun(false, 'Your King was captured and the Throne has fallen.'); return; }
    if (count(g, 'b') === 0) { onWaveCleared(); return; }
    playerTurn();
  }

  /* ==================== WAVES / REWARDS / END ==================== */
  function spawnWave(g, wave) {
    C.run.wave = wave;
    // choose a fresh battlefield (rotate maps per run so no two runs look alike)
    const map = MAPS[(C.run.mapOff + wave - 1) % MAPS.length];
    applyMap(g, map);
    // clear any lingering enemy pieces then raise a fresh defensive formation
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.board[r][c] && g.board[r][c].c === 'b') g.board[r][c] = null;
    redeploy(g);

    const recipe = WAVES[wave - 1] || [];
    const cols = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
    // the Warlord always at the heart of the host (skips terrain automatically)
    placeRaw(g, 'b', 'k', 0, 4) || placeRaw(g, 'b', 'k', 0, 3) || placeRaw(g, 'b', 'k', 1, 4) || placeRaw(g, 'b', 'k', 0, 2);
    const order = recipe.slice();
    for (const type of order) {
      const pawn = type === 'p';
      const ranks = pawn ? [1, 2, 3] : [0, 1, 2];
      let placed = false;
      for (const r of ranks) {
        for (const c of cols) {
          if (placeRaw(g, 'b', type, r, c)) { placed = true; break; }
        }
        if (placed) break;
      }
      if (!placed) {
        for (let r = 0; r < 8 && !placed; r++) for (let c = 0; c < 8; c++) if (placeRaw(g, 'b', type, r, c)) { placed = true; break; }
      }
    }
    LOG(g, 'The battle moves to ' + map.name + ' — the Warlord sends wave ' + wave + '.', 'sys', 'flag');
  }

  function onWaveCleared() {
    if (!C.active) return;
    const g = C.g;
    if (count(g, 'b') !== 0) return;
    if (C.run.wave >= TOTAL_WAVES) { endRun(true, 'All six waves broken! The Crystal Throne stands eternal.'); return; }
    // spoils of war — the realm pays for holding the line
    const bonus = 200 + C.run.wave * 80;
    C.run.gold += bonus;
    LOG(g, 'Wave ' + C.run.wave + ' repelled — the realm pays ' + bonus + ' gold in spoils.', 'sys', 'coin');
    C.phase = 'reward';
    banner('The host is scattered!', 'good');
    MD.playSfx('win');
    showReward(C.run.wave);
  }

  function showReward(clearedWave) {
    const title = $('campRewardTitle'), sub = $('campRewardSub'), box = $('campRewards');
    title.textContent = 'Wave ' + clearedWave + ' repelled!';
    sub.textContent = 'Gold: ' + C.run.gold + ' — strengthen the realm before wave ' + (clearedWave + 1) + ' (free boons and mercenary purchases).';
    UI.clearMsg();
    box.innerHTML = '';
    const choices = buildRewards(clearedWave);
    choices.forEach(ch => {
      const afford = !ch.cost || C.run.gold >= ch.cost;
      const b = document.createElement('button');
      b.className = 'camp-reward-btn rarity-' + (ch.rarity || 2) + (afford ? '' : ' disabled');
      b.innerHTML = '<span class="cr-icon">' + MD.iconHTML(ch.icon) + '</span>' +
        '<span class="cr-name">' + UI.esc(ch.name) + (ch.cost ? ' <em class="cr-cost">' + ch.cost + 'g</em>' : ' <em class="cr-cost free">free</em>') + '</span>' +
        '<span class="cr-desc">' + UI.esc(ch.desc) + '</span>';
      b.addEventListener('click', () => {
        if (ch.cost) {
          if (C.run.gold < ch.cost) { UI.toast('Not enough gold for this.', 'bad'); return; }
          C.run.gold -= ch.cost;
        }
        UI.closeModal('campRewardModal');
        try { ch.run(); } catch (err) { console.error('reward error', err); }
        C.run.wave++;
        spawnWave(C.g, C.run.wave);
        C.tokens = 2;
        banner('Wave ' + C.run.wave + ' · ' + (C.run.mapName || 'the field') + ' — a fiercer host marches.', 'warn');
        playerTurn();
      });
      box.appendChild(b);
    });
    UI.openModal('campRewardModal');
  }

  function buildRewards(wave) {
    const g = C.g;
    const opts = [];
    const pawns = listPieces(g, 'w').filter(p => p.cell.t === 'p');
    const units = listPieces(g, 'w');
    const randomType = () => ['imp', 'goblin', 'ranger', 'warhorse', 'samurai', 'spriggan', 'divinedog'][Math.floor(Math.random() * 7)];
    const hireType = () => ['nue', 'qilin', 'siegetank', 'coralqueen', 'seaserpent', 'howitzer', 'jianke', 'divinedog'][Math.floor(Math.random() * 8)];

    opts.push({
      name: 'Reinforcements', icon: 'portal', rarity: 2,
      desc: 'Summon a ' + MD.pieceName(randomType()) + ' to guard the Throne.',
      run: () => {
        const near = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const r = 7 + dr, c = 4 + dc;
          if (r >= 0 && r < 8 && c >= 0 && c < 8 && !g.board[r][c] && !E.isTerrain(g, r, c)) near.push({ r, c });
        }
        const q = near.length ? near[Math.floor(Math.random() * near.length)] : findFree(g, [6, 7], [0, 1, 2, 3, 4, 5, 6, 7]);
        const type = randomType();
        if (!q) return;
        placeRaw(g, 'w', type, q.r, q.c);
        LOG(g, 'Reinforcements arrive — a ' + MD.pieceName(type) + ' joins the garrison.', 'w', 'portal');
        UI.toast('A ' + MD.pieceName(type) + ' joins your army.', 'sys');
      }
    });

    opts.push({
      name: 'Royal Armorer', icon: 'shield', rarity: 2,
      desc: 'Every friendly piece standing on your back two ranks is shielded.',
      run: () => {
        let n = 0;
        for (const p of listPieces(g, 'w')) if (p.r >= 6) { Fx.mod(p.cell, 's', 1); n++; }
        LOG(g, 'The armorer shields ' + n + ' defender' + (n > 1 ? 's' : '') + '.', 'w', 'shield');
        UI.toast('Back ranks are shielded.', 'sys');
      }
    });

    opts.push({
      name: 'Drillmaster', icon: 'sword', rarity: 3,
      desc: 'Your most advanced pawn is promoted to a KNIGHT, and your King is healed.',
      run: () => {
        const adv = pawns.slice().sort((a, b) => (a.r < b.r ? 1 : -1))[0];
        if (adv) { adv.cell.t = 'n'; LOG(g, 'A pawn is knighted by the drillmaster.', 'w', 'sword'); }
        const k = E.findKing(g, 'w');
        if (k && g.board[k.r][k.c].b) { g.board[k.r][k.c].b.f = 0; g.board[k.r][k.c].b.p = 0; }
        UI.toast('Your vanguard is knighted.', 'sys');
      }
    });

    opts.push({
      name: 'War Chest', icon: 'coin', rarity: 1,
      desc: 'Plunder +' + (300 + wave * 100) + ' gold (spent on future boons).',
      run: () => {
        C.run.gold += 300 + wave * 100;
        LOG(g, 'The war chest swells by ' + (300 + wave * 100) + ' gold.', 'w', 'coin');
        UI.toast('+' + (300 + wave * 100) + ' gold.', 'sys');
      }
    });

    opts.push({
      name: 'Treasury Boon', icon: 'coin', rarity: 2,
      desc: 'Turn gold into steel: revive your most valuable fallen piece (if any).',
      run: () => {
        const r = Fx.revive(g, 'w', 1);
        if (r.length) { LOG(g, 'A fallen champion is ransomed back to the realm.', 'w', 'heart'); UI.toast('A fallen champion returns.', 'sys'); }
        else { C.run.gold += 200; UI.toast('No ransom needed — +200 gold.', 'sys'); }
      }
    });

    opts.push({
      name: 'Mysterious Shrine', icon: 'dice', rarity: 3,
      desc: 'A sudden EVENT: gamble everything on an ancient shrine (random powerful boon OR a setback).',
      run: () => {
        if (Math.random() < 0.62) {
          const type = ['guardian', 'archmage', 'griffon', 'siren', 'samurai'][Math.floor(Math.random() * 5)];
          const q = findFree(g, [6, 7], [0, 1, 2, 3, 4, 5, 6, 7]);
          if (q) { placeRaw(g, 'w', type, q.r, q.c); LOG(g, 'The shrine grants a ' + MD.pieceName(type) + ' ally!', 'w', 'star'); UI.toast('The shrine grants a ' + MD.pieceName(type) + '!', 'sys'); }
          else { C.run.gold += 400; UI.toast('The shrine grants 400 gold.', 'sys'); }
        } else {
          const victim = units.filter(u => u.cell.t !== 'k').sort(() => Math.random() - 0.5)[0];
          if (victim) {
            Fx.mod(victim.cell, 'p', 1);
            LOG(g, 'The shrine is cursed — one of your units is poisoned.', 'bad', 'skull');
            UI.toast('A curse poisons one of your units.', 'bad');
          }
        }
      }
    });

    // — gold purchases: mercenaries & royal works —
    opts.push({
      name: 'Mercenary Captain', icon: 'sword', rarity: 3, cost: 320,
      desc: 'Hire a champion: a ' + MD.pieceName(hireType()) + ' joins your army.',
      run: () => {
        const q = findFree(g, [5, 6, 7], [0, 1, 2, 3, 4, 5, 6, 7]);
        const type = hireType();
        if (q) { placeRaw(g, 'w', type, q.r, q.c); LOG(g, 'A hired ' + MD.pieceName(type) + ' takes the field.', 'w', 'star'); UI.toast('Hired a ' + MD.pieceName(type) + '.', 'sys'); }
        else UI.toast('No room to field the mercenary — gold refunded.', 'sys');
      }
    });
    opts.push({
      name: 'Royal Restoration', icon: 'heart', rarity: 3, cost: 260,
      desc: 'Field hospitals: cleanse your whole army, revive a fallen pawn, and shield your king.',
      run: () => {
        for (const p of listPieces(g, 'w')) if (p.cell.b && (p.cell.b.f > 0 || p.cell.b.p > 0)) { p.cell.b.f = 0; p.cell.b.p = 0; }
        Fx.revive(g, 'w', 1, { type: 'p' });
        const k = E.findKing(g, 'w');
        if (k) Fx.mod(g.board[k.r][k.c], 's', 1);
        LOG(g, 'The realm heals its wounds.', 'w', 'heart');
        UI.toast('Your army is restored.', 'sys');
      }
    });
    opts.push({
      name: 'Forge of Legends', icon: 'fire', rarity: 4, cost: 450,
      desc: 'Promote your most advanced pawn to a QUEEN and shield your two most advanced pieces.',
      run: () => {
        const adv = pawns.slice().sort((a, b) => (a.r < b.r ? 1 : -1))[0];
        if (adv) { adv.cell.t = 'q'; Fx.flash(g, adv.r, adv.c, 'transform', ''); LOG(g, 'The forge crowns a QUEEN.', 'w', 'fire'); }
        const top2 = listPieces(g, 'w').filter(p => p.cell.t !== 'k').sort((a, b) => (a.r < b.r ? 1 : -1)).slice(0, 2);
        for (const p of top2) Fx.mod(p.cell, 's', 1);
        UI.toast('The forge works its wonders.', 'sys');
      }
    });

    // always offer at least one free boon, then fill the rest from the pool
    const freePool = opts.filter(o => !o.cost);
    const paidPool = opts.filter(o => o.cost).sort(() => Math.random() - 0.5);
    const picks = [];
    if (freePool.length) picks.push(freePool[Math.floor(Math.random() * freePool.length)]);
    while (picks.length < 3) {
      const src = (picks.length === 1 && paidPool.length) ? paidPool : opts;
      const cand = src[Math.floor(Math.random() * src.length)];
      if (cand && !picks.includes(cand)) picks.push(cand); else break;
    }
    return picks;
  }

  /* ==================== RUN END ==================== */
  function endRun(victory, reason) {
    if (!C.active) return;
    C.phase = 'over';
    const run = C.run;
    const stats = [];
    const army = count(C.g, 'w');
    stats.push({ k: 'Waves cleared', v: (victory ? TOTAL_WAVES : Math.min(C.run.wave - 1 + 0, TOTAL_WAVES)) + ' / ' + TOTAL_WAVES });
    stats.push({ k: 'Enemies slain', v: run.kills });
    stats.push({ k: 'Gold plundered', v: run.gold });
    stats.push({ k: 'Surviving army', v: army + ' units' });
    if (!victory) {
      const best = readBest();
      if (C.run.wave - 1 > best) { writeBest(C.run.wave - 1); stats.push({ k: 'Best run', v: 'NEW — ' + (C.run.wave - 1) + ' waves' }); }
      else stats.push({ k: 'Best run', v: best + ' waves' });
    }
    const em = $('campEndEmoji'), tt = $('campEndTitle'), sb = $('campEndSub'), st = $('campRunStats');
    em.innerHTML = MD.iconHTML(victory ? 'trophy' : 'skull');
    tt.textContent = victory ? 'The Realm Is Saved!' : 'The Throne Has Fallen';
    sb.textContent = reason;
    st.innerHTML = stats.map(s => '<div class="camp-stat"><span>' + s.k + '</span><b>' + s.v + '</b></div>').join('');
    UI.render();
    UI.openModal('campEndModal');
  }

  function readBest() { try { return parseInt(localStorage.getItem('modchess.campaign.best') || '0', 10) || 0; } catch (e) { return 0; } }
  function writeBest(w) { try { localStorage.setItem('modchess.campaign.best', String(w)); } catch (e) {} }

  /* ==================== HUD / banners ==================== */
  function showHud(on) {
    const hud = $('campHud');
    if (hud) hud.style.display = on ? '' : 'none';
  }
  function updateHud() {
    if (!C.active || !C.g) return;
    const w = $('campWave'), gd = $('campGold'), ar = $('campArmy'), mv = $('campMoves');
    if (w) w.textContent = 'Wave ' + C.run.wave + '/' + TOTAL_WAVES;
    if (gd) gd.textContent = 'Gold ' + C.run.gold;
    if (ar) ar.textContent = 'Army ' + count(C.g, 'w');
    if (mv) mv.textContent = (C.phase === 'player' && !C.enemyRunning) ? 'Moves ' + C.tokens : (C.enemyRunning ? 'Enemies marching…' : 'Round over');
  }
  let _bannerT = null;
  function banner(text, kind) {
    UI.clearMsg();
    UI.showMsg ? UI.showMsg(text, kind || 'info') : null;
    if (_bannerT) clearTimeout(_bannerT);
    _bannerT = setTimeout(() => { if (C.active && C.phase === 'player') UI.clearMsg(); }, 3200);
  }
  MD.CampaignBanner = banner;

  /* ==================== static wiring ==================== */
  function wire() {
    const endRound = $('btnEndRound'), quit = $('btnQuitRun');
    if (endRound) endRound.addEventListener('click', () => { if (C.active && C.phase === 'player' && !C.enemyRunning) endPlayerRound(); });
    if (quit) quit.addEventListener('click', () => {
      if (!C.active) return;
      if (C.phase === 'enemy') return;
      endRun(false, 'You abandoned the siege.');
    });
    const retry = $('btnCampRetry'), cmenu = $('btnCampMenu');
    if (retry) retry.addEventListener('click', () => { UI.closeModal('campEndModal'); C.stop(false); C.start(); });
    if (cmenu) cmenu.addEventListener('click', () => { UI.closeModal('campEndModal'); C.stop(true); });
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  /* ---- debug / automation hooks (also handy for testing) ---- */
  C.busy = () => C.active && (C.phase === 'enemy' || C.enemyRunning);
  C.phaseOf = () => C.phase;
  C.waveOf = () => (C.run ? C.run.wave : 0);
  C.goldOf = () => (C.run ? C.run.gold : 0);
  C.armyOf = () => (C.active ? count(C.g, 'w') : 0);
  C.debugApply = function (r0, c0, r1, c1) {
    if (!C.active || C.phase !== 'player' || C.enemyRunning) return false;
    const g = C.g;
    if (C.tokens <= 0) return false;
    const fcell = g.board[r0] && g.board[r0][c0];
    if (!fcell || fcell.c !== 'w' || fcell.moved) return false;
    const mv = E.legalMoves(g, 'w').find(m => m.r0 === r0 && m.c0 === c0 && m.r1 === r1 && m.c1 === c1);
    if (!mv) return false;
    applyPlayerMove(g, mv);
    return true;
  };
  C.debugEndRound = function () {
    if (!C.active || C.phase !== 'player' || C.enemyRunning) return false;
    endPlayerRound();
    return true;
  };
  C.waitEnemy = function () {
    return new Promise(res => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        if (!C.active) { clearInterval(iv); return res(false); }
        if (!C.busy() && C.phase === 'player') { clearInterval(iv); return res(true); }
        if (Date.now() - t0 > 60000) { clearInterval(iv); return res(false); }
      }, 60);
    });
  };
  C.pickReward = function (i) {
    const box = $('campRewards');
    if (box && box.children[i]) { box.children[i].click(); return true; }
    return false;
  };
})();

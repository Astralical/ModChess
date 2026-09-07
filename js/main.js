/* ============================================================
   Mod Chess — Game orchestration / state machine
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, UI = MD.UI, Fx = MD.Fx, opp = MD.Fx.opp;

  const Game = {
    g: null,
    cfg: { botMode: false, diff: 2, human: 'w' },
    phase: 'menu', // menu | cards | move | bot | over
    hand: null,
    sel: null,
    legalCache: [],
    premove: null,
    pickingIdx: -1,
    pendingAbility: null,
    humanColor: 'w',
    lastAnimate: null,
    promoPending: null
  };
  MD.Game = Game;

  function addLog(g, text, kind, icon) {
    if (!g.battleLog) g.battleLog = [];
    g.battleLog.push({ text, kind: kind || 'sys', icon: icon || '' });
    g.logSeq = (g.logSeq || 0) + 1;
  }
  MD.addLog = addLog;

  function logColor(g, side, text) { addLog(g, text, side === 'w' ? 'w' : 'b', ''); }
  function sideOf(c) { return c === 'w' ? 'White' : 'Black'; }

  /* ---------------- menu ---------------- */
  Game.showMenu = function () {
    Game.phase = 'menu';
    const menu = $('#menuModal');
    menu.hidden = false;
    $('#modalBack').style.display = 'block';
    // default selection
    Game.cfg.botMode = true;
    Game.humanColor = MD.Settings.human || 'w';
    document.querySelectorAll('.mode-card').forEach(b => b.classList.toggle('selected', b.dataset.mode === 'bot'));
    const diff = MD.Settings.diff || 2;
    document.querySelectorAll('#diffRow .chip').forEach(c => c.classList.toggle('selected', +c.dataset.diff === diff));
    if (UI.setColorRow) UI.setColorRow();
    if (UI.setModeRow) UI.setModeRow();
    if (UI.setSizeRow) UI.setSizeRow();
    if (UI.setItemRow) UI.setItemRow();
    $('#diffRow').style.display = '';
    $('#colorRow').style.display = '';
    $('#smodeRow').style.display = '';
    $('#sizeRow').style.display = '';
    $('#itemRow').style.display = '';
  };

  Game.start = function (mode, diff, color, spellMode, size) {
    // A normal match must never inherit an active campaign (its patched hooks
    // and HUD would otherwise "merge" into the standard game).
    if (root.MD.Campaign && root.MD.Campaign.active) root.MD.Campaign.stop(false);
    const sz = ((size | 0) >= 4 && (size | 0) <= 14) ? (size | 0) : ((MD.Settings && (MD.Settings.size | 0) >= 4) ? MD.Settings.size | 0 : 8);
    Game.g = E.newGame(sz);
    Game.g.battleLog = [];
    Game.g.logSeq = 0;
    Game.g.spellLog = [];
    Game.g.spellSeq = 0;
    if (MD.Settings.items && MD.Items) { Game.g.itemEnabled = 1; Game.g.items = []; Game.g.itemCd = 0; addLog(Game.g, 'Item mode: magic treasures will spawn on the board — land a piece on one to claim it!', 'sys', 'star'); }
    Game.cfg.botMode = !!mode;   // mode is a boolean (true = vs computer)
    Game.cfg.diff = diff || MD.Settings.diff || 2;
    Game.cfg.mode = spellMode || 'classic';
    Game.cfg.size = sz;
    // local pass-and-play always starts White at the bottom; colour choice is for vs Computer
    const col = mode ? (color || 'w') : 'w';
    Game.cfg.human = col;
    Game.humanColor = col;
    Game.sel = null; Game.premove = null; Game.legalCache = [];
    Game.pickingIdx = -1; Game.pendingAbility = null; Game.promoPending = null;
    Game.targetMode = false; Game.targetList = [];
    Game.lastAnimate = null;
    UI.closeModal('menuModal');
    UI.closeModal('resultModal');
    UI.clearMsg();
    // put the human's side at the bottom of the board
    if (UI.setHomeColor) UI.setHomeColor(Game.humanColor);
    addLog(Game.g, 'A new battle begins — spell mode: ' + Game.cfg.mode.toUpperCase() + '. Every turn you must cast 1 spell, then move.', 'sys', 'flag');
    if (Game.cfg.botMode && Game.humanColor === 'b') addLog(Game.g, 'You are playing as Black — the computer opens as White.', 'sys', 'flag');
    Game.phase = 'cards';
    UI.render();
    Game.startTurn('w'); // White always opens
  };

  Game.rematch = function () {
    const was = Game.cfg;
    Game.start(was.botMode, was.diff, was.human, was.mode || 'classic', was.size || 8);
  };

  /* ---------------- turn handling ---------------- */
  Game.startTurn = function (color) {
    if (Game.phase === 'over' || !Game.g || Game.g.over) return;
    Game.g.turn = color;
    // delayed mortar/siege shells tick down as their firing side's turns begin
    if (MD.Engine && MD.Engine.tickShells) {
      const evs = MD.Engine.tickShells(Game.g, color);
      if (evs && evs.length) evs.forEach(ev => {
        addLog(Game.g, (ev.text || 'A shell lands!') + (ev.hit > 1 ? ' (' + ev.hit + ' caught in the blast)' : ''), 'bad', 'storm');
      });
    }
    Game.sel = null;
    Game.legalCache = [];
    // a Time Stop can make this whole turn vanish (the enemy simply never moves)
    if (Game.g.skipTurn && Game.g.skipTurn[color]) {
      Game.g.skipTurn[color] = false;
      UI.toast(MD.iconHTML('clock') + ' ' + sideOf(color) + '\'s turn is erased — they never move!', 'sys');
      Game.hand = null;
      Game.phase = 'move';
      UI.render();
      Game.startTurn(opp(color));
      return;
    }
    // premove auto-fire (vs bot, human's turn starts)
    if (Game.cfg.botMode && color === Game.humanColor && Game.premove && MD.Settings.premove) {
      const fired = Game.tryPremoveMove();
      if (fired) return; // move already handled; do not deal cards
      Game.premove = null; // cancelled
      UI.toast('Premove cancelled — the position changed.', 'sys');
    }
    // silence: this side may not use abilities this turn
    if (Game.g.silence[color]) {
      Game.g.silence[color] = false;
      Game.hand = null;
      Game.phase = 'move';
      UI.toast(sideOf(color) + ' is silenced — no spells this turn.', 'bad');
      Game.renderAndMaybeBot();
      return;
    }
    // a bonus/extra turn only allows a move — no fresh spells can be cast on it
    if (Game.g.moveOnly && Game.g.moveOnly[color]) {
      Game.g.moveOnly[color] = false;
      Game.hand = null;
      Game.phase = 'move';
      UI.toast('Bonus turn — move only, no new spells.', 'sys');
      Game.renderAndMaybeBot();
      return;
    }
    // deal the hand for this mode. (A Borrowed Time can shrink it.)
    const mode = Game.cfg.mode || 'classic';
    let baseN = mode === 'draft' ? 4 : 3;
    if (Game.g.lowHand && Game.g.lowHand[color]) { baseN = Math.max(1, baseN - 1); Game.g.lowHand[color] = false; }
    const echoId = (Game.g.echo && Game.g.echo[color]) || null;
    if (Game.g.echo) Game.g.echo[color] = null;
    if (mode === 'chaos') {
      // one spell is chosen for the player — cast automatically, then they must move
      Game.hand = { for: color, cards: MD.drawPlayable(Game.g, color, 1), used: false, usedId: null };
      Game.phase = 'cards';
      UI.render();
      UI.toast('Chaos: fate casts a spell for ' + sideOf(color) + '…', 'sys');
      setTimeout(() => Game.chaosFire(color), 500);
      return;
    }
    let cards = MD.drawPlayable(Game.g, color, baseN);
    // Echo mode: the opponent also received a copy of the spell you last cast
    if (mode === 'echo' && echoId && MD.abilityById(echoId)) {
      cards = cards.filter(a => a.id !== echoId);
      cards.unshift(MD.abilityById(echoId));
      cards = cards.slice(0, baseN);
    }
    Game.hand = { for: color, cards, used: false, usedId: null };
    Game.phase = 'cards';
    UI.toast(mode === 'draft' ? 'Draft: pick 1 of 4, then move.' : mode === 'echo' ? 'Echo: your opponent got a copy of the last spell cast.' : 'Cast 1 spell, then move.', 'sys');
    Game.renderAndMaybeBot();
  };

  // force-fire for Chaos mode (the spell is chosen for the player)
  Game.chaosFire = function (color) {
    setTimeout(() => {
      if (Game.g.over || !Game.hand || Game.hand.for !== color || Game.hand.used) return;
      const ab = Game.hand.cards[0];
      if (!ab) { Game.hand.used = true; Game.phase = 'move'; UI.render(); return; }
      const t = MD.needsTarget(ab) ? MD.botTarget(Game.g, ab, color) : null;
      Game.castAbility(ab, t);
      // if it's the computer's turn in chaos mode, it still has to make a move
      if (!Game.g.over && Game.cfg.botMode && Game.g.turn !== Game.humanColor) {
        Game.phase = 'bot';
        setTimeout(() => Game.botMove(), 350);
      }
    }, 60);
  };

  Game.renderAndMaybeBot = function () {
    UI.render();
    if (Game.cfg.botMode && Game.g.turn !== Game.humanColor && Game.phase !== 'over') {
      Game.phase = 'bot';
      setTimeout(() => Game.botTurn(), 650);
    }
  };

  /* ---------------- human ability casting ---------------- */
  function canAct(color) {
    return !Game.cfg.botMode || color === Game.humanColor;
  }
  Game.canAct = canAct;

  Game.onCardClick = function (id) {
    if (Game.phase === 'over') return;
    if (Game.phase !== 'cards') return;
    const h = Game.hand;
    if (!h || h.used) return;
    const side = h.for;
    if (!canAct(side)) return;
    const ab = h.cards.find(a => a.id === id);
    if (!ab) return;
    if (MD.needsTarget(ab)) {
      // enter picking mode
      Game.pendingAbility = ab;
      Game.pickingIdx = h.cards.indexOf(ab);
      Game.targetMode = true;
      Game.pickA = null;                       // two-piece spells start fresh
      Game.targetList = Fx.targetList(Game.g, side, ab.target);
      UI.render();
      return;
    }
    Game.castAbility(ab, null);
  };

  Game.pickTarget = function (r, c) {
    if (Game.pendingAbility && Game.pickingIdx >= 0) {
      const ab = Game.pendingAbility;
      const ok = (Game.targetList || []).some(q => q.r === r && q.c === c);
      if (!ok) {
        UI.toast('Pick a highlighted square for this spell.', 'sys');
        return;
      }
      if (ab.twoPick) {
        // first square selected — wait for the second
        if (!Game.pickA) {
          Game.pickA = { r, c };
          UI.toast('First piece chosen — now pick the SECOND piece to swap.', 'sys');
          UI.render();
          return;
        }
        if (Game.pickA.r === r && Game.pickA.c === c) {
          UI.toast('Pick two different pieces.', 'sys');
          return;
        }
        Game.castAbility(ab, { a: Game.pickA, b: { r, c } });
        return;
      }
      Game.castAbility(ab, { r, c });
    }
  };

  Game.castAbility = function (ab, sq) {
    const side = Game.g.turn;
    const beforeExtra = Game.g.extra[side];
    const res = MD.cast(Game.g, ab, side, sq || null);
    const gained = Game.g.extra[side] - beforeExtra;
    if (gained > 0) {
      if (Game.g.extraCycle[side]) {
        // cannot stretch time more than once per turn-cycle
        Game.g.extra[side] -= gained;
        UI.toast('The time stream is already stretched this turn.', 'sys');
      } else {
        Game.g.extraCycle[side] = true;
      }
    }
    Game.hand.used = true;
    Game.hand.usedId = ab.id;
    Game.pickingIdx = -1;
    Game.pendingAbility = null;
    Game.targetMode = false;
    Game.targetList = [];
    Game.pickA = null;
    Game.sel = null;
    // log & announce
    MD.playSfx('cast');
    const lines = res.lines;
    if (!Game.g.spellLog) Game.g.spellLog = [];
    Game.g.spellLog.push({ side, icon: ab.icon, name: ab.name, desc: ab.desc || '', rarity: ab.rarity || 1, lines: lines.slice(), ply: Game.g.hist.length + 1 });
    Game.g.spellSeq = (Game.g.spellSeq || 0) + 1;
    lines.forEach(l => addLog(Game.g, l, side, ab.icon));
    UI.showBurst(ab.icon, ab.name, side, lines, ab.desc);   // says what the spell does
    UI.playEffects(lines, ab.icon);                // effect readout toasts
    UI.playMarks(res.marks);
    UI.render();
    if (res.error) UI.toast('The spell fizzled!', 'bad');
    // victory check (e.g. assassinate)
    const end = E.evaluateEnd(Game.g, side);
    if (end.over) { Game.finish(end); return; }
    // Echo mode: the enemy receives a copy of this spell in their next hand
    if ((Game.cfg.mode || 'classic') === 'echo') {
      if (!Game.g.echo) Game.g.echo = { w: null, b: null };
      Game.g.echo[opp(side)] = ab.id;
    }
    // still this side's move — casting alone never ends your turn
    Game.phase = 'move';
    UI.render();
  };

  Game.skipAbility = function () {
    if (Game.phase !== 'cards') return;
    const h = Game.hand;
    if (h && !h.used && canAct(h.for)) {
      h.used = true; // treat as skipped
      Game.phase = 'move';
      Game.pickingIdx = -1;
      Game.pendingAbility = null;
      Game.targetMode = false;
      Game.targetList = [];
      UI.render();
    }
  };

  /* ---------------- bot turn ---------------- */
  Game.botTurn = function () {
    if (Game.phase !== 'bot' || Game.g.over) return;
    const side = Game.g.turn;
    const h = Game.hand;
    // chaos mode casts automatically via chaosFire; nothing more to do here
    if ((Game.cfg.mode || 'classic') === 'chaos') {
      setTimeout(() => { if (Game.g.over) return; Game.phase = 'move'; Game.botMove(); }, 620);
      return;
    }
    // the bot must cast one spell each turn (silenced/move-only turns have no hand)
    try {
      if (h && !h.used && h.cards.length && MD.Settings.diff >= 1) {
        let chosen = MD.AI.chooseAbility(Game.g, side, h.cards);
        if (!chosen) chosen = h.cards[Math.floor(Math.random() * h.cards.length)]; // forced cast
        const t = MD.botTarget(Game.g, chosen, side);
        Game.castAbility(chosen, t); // will set phase='move'
      } else {
        h.used = true;
        Game.phase = 'move';
      }
    } catch (err) {
      console.error('bot ability error', err);
      h.used = true;
      Game.phase = 'move';
    }
    setTimeout(() => {
      if (Game.g.over || Game.phase !== 'move') { if (!Game.g.over) { Game.phase = 'move'; } }
      Game.botMove();
    }, 420);
  };

  Game.botMove = function () {
    if (Game.g.over) return;
    const side = Game.g.turn;
    let move = null;
    try {
      move = MD.AI.chooseMove(Game.g, side, Game.cfg.diff);
    } catch (err) {
      console.error('AI search error', err);
    }
    if (!move) {
      // fallback so the bot can never silently stall: any legal move, or end the game
      try {
        const ms = E.legalMoves(Game.g, side);
        if (ms.length) { Game.applyMove(ms[Math.floor(Math.random() * ms.length)]); return; }
      } catch (err2) { console.error('AI fallback error', err2); }
      const end = E.evaluateEnd(Game.g, side);
      if (end.over) Game.finish(end);
      return;
    }
    Game.applyMove(move);
  };

  /* ---------------- executing a move ---------------- */
  Game.applyMove = function (move) {
    const mover = Game.g.turn;
    const anim = { from: { r: move.r0, c: move.c0 }, to: { r: move.r1, c: move.c1 } };
    const wasCapture = !!(Game.g.board[move.r1][move.c1] || move.ep);
    E.applyMove(Game.g, move);
    Game.lastAnimate = anim;
    MD.playSfx(wasCapture ? 'capture' : 'move');
    if (E.inCheck(Game.g, opp(mover))) MD.playSfx('check');
    const san = Game.g.lastMove ? Game.g.lastMove.san : '';
    logColor(Game.g, mover, (sideOf(mover) + ': ' + san));
    // claimed an item on the landing square?
    if (MD.Items && MD.Items.enabled(Game.g)) {
      const got = MD.Items.tryPickup(Game.g, move.r1, move.c1, mover);
      if (got && got.length) got.forEach(t => addLog(Game.g, '◆ ' + t, 'w', 'star'));
    }
    // hidden hazards that sprang as this move landed
    if (Game.g.hazLog && Game.g.hazLog.length) {
      Game.g.hazLog.forEach(t => addLog(Game.g, t, 'bad', 'target'));
      Game.g.hazLog = [];
    }
    Game.sel = null;
    UI.render();
    Game.resolveAfterMove(mover);
  };

  Game.resolveAfterMove = function (mover) {
    const g = Game.g;
    // status ticks (poison explosions, freeze/shield expiry, growth, auras)
    const events = E.tickAfterMove(g, mover);
    if (events.length) {
      for (const ev of events) {
        if (ev.kind === 'poison') addLog(g, 'A poisoned piece detonates!', 'bad', '💥');
        else if (ev.kind === 'grow') addLog(g, (ev.text || 'A troop grows into its adult form') + '.', 'sys', 'star');
        else if (ev.kind === 'aura') addLog(g, (ev.text || 'An aura pulses') + '.', 'w', 'spark');
        else if (ev.kind === 'regen') addLog(g, (ev.text || 'A troop regenerates') + '.', 'sys', 'heart');
        else if (ev.kind === 'rattle') addLog(g, (ev.text || 'A dying troop leaves a mark') + '.', 'bad', 'skull');
        else if (ev.kind === 'doom') addLog(g, (ev.text || 'A doomed piece perishes') + '.', 'bad', 'target');
        else if (ev.kind === 'zone') addLog(g, (ev.text || 'The ground reacts') + '.', 'sys', 'fire');
      }
    }
    // item drops: one becomes eligible after each side completes a move, but if
    // items are still unclaimed on the field the next waits 2^x turns (x = count)
    if (MD.Items && MD.Items.enabled(g)) MD.Items.spawnCheck(g);
    // next side to act (extra moves let the mover go again — but ONLY to move, no new spell)
    let next = opp(mover);
    if (g.extra[mover] > 0) {
      g.extra[mover]--;
      next = mover;
      if (!g.moveOnly) g.moveOnly = { w: false, b: false };
      g.moveOnly[mover] = true;
    }
    if (next !== mover) { g.extraCycle.w = false; g.extraCycle.b = false; }
    const end = E.evaluateEnd(g, next);
    if (end.over) { Game.finish(end); return; }
    Game.startTurn(next);
  };

  /* ---------------- premove ---------------- */
  Game.tryPremoveMove = function () {
    const prem = Game.premove;
    if (!prem) return false;
    const side = Game.g.turn;
    const moves = E.legalMoves(Game.g, side);
    const from = prem.from, to = prem.to;
    let cand = moves.find(m => m.r0 === from.r && m.c0 === from.c && m.r1 === to.r && m.c1 === to.c && !m.promo);
    if (!cand) cand = moves.find(m => m.r0 === from.r && m.c0 === from.c && m.r1 === to.r && m.c1 === to.c && m.promo === 'q');
    if (!cand) return false;
    Game.premove = null;
    Game.applyMove(cand);
    return true;
  };

  /* ---------------- human interactions ---------------- */
  Game.canGrab = function (r, c) {
    if (Game.phase === 'over') return false;
    const cell = Game.g.board[r][c];
    if (!cell) return false;
    if (Game.phase === 'bot') {
      return Game.cfg.botMode && MD.Settings.premove && cell.c === Game.humanColor;
    }
    if (Game.phase === 'cards' || Game.phase === 'move') {
      if (!canAct(cell.c)) return false;
      if (cell.c !== Game.g.turn) return false;
      if (cell.b && cell.b.f > 0) return false;
      if (cell.b && cell.b.z > 0) return false; // newly-summoned: still waking up
      return true;
    }
    return false;
  };

  Game.grab = function (r, c) {
    Game.sel = { r, c };
    if (Game.phase === 'cards' || Game.phase === 'move') {
      Game.legalCache = E.legalMoves(Game.g, Game.g.turn).filter(m => m.r0 === r && m.c0 === c);
    } else if (Game.phase === 'bot') {
      Game.legalCache = [];
    }
    UI.render();
  };

  Game.drop = function (fromR, fromC, toR, toC) {
    const from = { r: fromR, c: fromC }, to = { r: toR, c: toC };
    if (Game.phase === 'bot') {
      // premove via drag
      if (Game.cfg.botMode && MD.Settings.premove) {
        const cell = Game.g.board[fromR][fromC];
        if (cell && cell.c === Game.humanColor && (Game.g.board[toR][toC] ? Game.g.board[toR][toC].c !== cell.c : true)) {
          Game.premove = { from, to };
          UI.toast(MD.iconHTML('swap') + ' Premove queued: ' + E.sqName(fromR, fromC) + ' to ' + E.sqName(toR, toC), 'sys');
          Game.sel = null;
          UI.render();
        }
      }
      return;
    }
    if (Game.phase === 'cards' || Game.phase === 'move') {
      Game.attemptUserMove(from, to);
      return;
    }
  };

  Game.tap = function (r, c) {
    if (Game.phase === 'over') return;
    // ability target picking
    if (Game.pickingIdx >= 0 && Game.pendingAbility) {
      Game.pickTarget(r, c);
      return;
    }
    // premove selection via taps (bot phase)
    if (Game.phase === 'bot') {
      const cell = Game.g.board[r][c];
      if (Game.cfg.botMode && MD.Settings.premove && cell && cell.c === Game.humanColor) {
        Game.sel = { r, c };
        UI.render();
      } else if (Game.sel && Game.sel.r !== undefined && Game.sel.r >= 0) {
        Game.drop(Game.sel.r, Game.sel.c, r, c);
        Game.sel = null;
        UI.render();
      }
      return;
    }
    if (Game.phase !== 'cards' && Game.phase !== 'move') return;
    const cell = Game.g.board[r][c];
    if (cell && cell.c === Game.g.turn && cell.b && cell.b.f > 0) { UI.toast('This piece is frozen!', 'bad'); return; }
    if (cell && cell.c === Game.g.turn && cell.b && cell.b.z > 0) { UI.toast('Just summoned — it cannot act yet.', 'sys'); return; }
    if (Game.sel) {
      if (Game.sel.r === r && Game.sel.c === c) { Game.sel = null; UI.render(); return; }
      if (cell && cell.c === Game.g.turn) { Game.grab(r, c); return; }
      Game.attemptUserMove(Game.sel, { r, c });
      return;
    }
    if (cell && cell.c === Game.g.turn) {
      Game.grab(r, c);
    }
  };

  Game.attemptUserMove = function (from, to) {
    // every turn requires casting a spell BEFORE moving — no moves while a spell is pending
    if (Game.phase === 'cards') {
      UI.toast(MD.iconHTML('spark') + ' Cast a spell first, then make your move.', 'sys');
      Game.sel = null;
      UI.render();
      return;
    }
    const moves = E.legalMoves(Game.g, Game.g.turn);
    const cands = moves.filter(m => m.r0 === from.r && m.c0 === from.c && m.r1 === to.r && m.c1 === to.c);
    if (!cands.length) {
      Game.sel = null;
      UI.render();
      return;
    }
    // castle handling
    const castle = cands.find(m => m.castle);
    if (castle) {
      if (MD.Settings.autoCastle) { Game.applyMove(castle); return; }
      Game.sel = null; UI.render(); return;
    }
    const plain = cands.find(m => !m.promo);
    if (plain) { Game.applyMove(plain); return; }
    // promotion needed
    const q = cands.find(m => m.promo === 'q');
    if (MD.Settings.autoQueen) {
      if (q) { Game.applyMove(q); return; }
      Game.sel = null; UI.render(); return;
    }
    // ask user
    Game.promoPending = { from, to };
    Game.promoFrom = from; Game.promoTo = to;
    UI.openPromo(Game.g.turn);
  };

  Game.promote = function (type) {
    Game.promoPending = null;
    UI.closeModal('promoModal');
    const from = Game.promoFrom, to = Game.promoTo;
    Game.promoFrom = Game.promoTo = null;
    const moves = E.legalMoves(Game.g, Game.g.turn);
    const cand = moves.find(m => m.r0 === from.r && m.c0 === from.c && m.r1 === to.r && m.c1 === to.c && m.promo === type);
    if (cand) Game.applyMove(cand);
  };

  /* ---------------- finish ---------------- */
  Game.finish = function (end) {
    const g = Game.g;
    g.over = true; g.result = end.result; g.reason = end.reason; g.winner = end.winner;
    Game.phase = 'over';
    Game.sel = null;
    UI.render();
    setTimeout(() => {
      const resultIcon = end.winner === null ? 'handshake' : (Game.cfg.botMode ? (end.winner === Game.humanColor ? 'trophy' : 'skull') : 'trophy');
      $('#resultEmoji').innerHTML = MD.iconHTML(resultIcon);
      if (end.winner === null) {
        $('#resultTitle').textContent = 'Draw';
        $('#resultSub').innerHTML = end.reason;
      } else if (Game.cfg.botMode) {
        const youWin = end.winner === Game.humanColor;
        $('#resultTitle').textContent = youWin ? 'Victory!' : 'Defeat';
        $('#resultSub').innerHTML = end.reason + (youWin ? ' — the spells were on your side.' : ' — the machine out-spelled you.');
        MD.playSfx(youWin ? 'win' : 'lose');
      } else {
        $('#resultTitle').textContent = sideOf(end.winner) + ' wins';
        $('#resultSub').innerHTML = end.reason;
        MD.playSfx('win');
      }
      UI.openModal('resultModal');
    }, 1100);
  };

  Game.sideOf = sideOf;
})();

/* ============================================================
   Mod Chess — UI rendering & interactions
   Talks to MD.Game for all state transitions.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const $ = s => document.querySelector(s);
  root.$ = $;   // expose so main.js can use it
  const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };

  /* ---------- settings (persisted) ---------- */
  const DEFAULTS = { premove: true, autoQueen: true, legal: true, lastMove: true, autoCastle: true, sound: true, anim: true, theme: 'green', diff: 2, human: 'w', smode: 'classic' };
  MD.Settings = Object.assign({}, DEFAULTS);
  try {
    const saved = JSON.parse(localStorage.getItem('modchess.settings') || '{}');
    Object.assign(MD.Settings, saved);
  } catch (e) { /* ignore */ }
  const persist = () => { try { localStorage.setItem('modchess.settings', JSON.stringify(MD.Settings)); } catch (e) {} };
  MD.Settings.save = persist;

  /* ---------- profile (username + rating; online ELO will override later) ---------- */
  const PROFILE_DEFAULT = { name: '', elo: 1200, games: 0, wins: 0, losses: 0, draws: 0 };
  MD.Profile = Object.assign({}, PROFILE_DEFAULT);
  try {
    const savedP = JSON.parse(localStorage.getItem('modchess.profile') || '{}');
    Object.assign(MD.Profile, savedP);
  } catch (e) { /* ignore */ }
  MD.Profile.save = () => { try { localStorage.setItem('modchess.profile', JSON.stringify(MD.Profile)); } catch (e) {} };

  const UI = {};
  MD.UI = UI;

  /* ---------- tiny sound ---------- */
  const Sounds = {};
  function tone(freq, dur, type, vol) {
    if (!MD.Settings.sound) return;
    try {
      const ctx = Sounds.ctx || (Sounds.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.value = vol || 0.12;
      o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.2));
      o.stop(ctx.currentTime + (dur || 0.2));
    } catch (e) {}
  }
  MD.playSfx = function (kind) {
    if (kind === 'move') tone(320, 0.12, 'triangle', 0.14);
    else if (kind === 'capture') tone(200, 0.16, 'square', 0.12);
    else if (kind === 'cast') tone(120, 0.35, 'sawtooth', 0.06);
    else if (kind === 'win') { tone(520, 0.25, 'triangle', 0.12); setTimeout(() => tone(780, 0.35, 'triangle', 0.12), 180); }
    else if (kind === 'lose') { tone(300, 0.3, 'sawtooth', 0.1); setTimeout(() => tone(180, 0.4, 'sawtooth', 0.1), 200); }
    else if (kind === 'check') tone(600, 0.18, 'square', 0.08);
  };

  /* ---------- toast ---------- */
  UI.toast = function (text, kind) {
    const wrap = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = text;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3200);
  };

  /* ---------- modal helpers ---------- */
  UI.openModal = id => { const m = $('#' + id); if (m) { m.hidden = false; $('#modalBack').style.display = 'block'; } };
  UI.closeModal = id => { const m = $('#' + id); if (m) { m.hidden = true; $('#modalBack').style.display = 'none'; } };

  /* ---------- promotion picker ---------- */
  UI.openPromo = function (color) {
    const row = $('#promoRow');
    clear(row);
    ['q', 'r', 'b', 'n'].forEach(t => {
      const b = document.createElement('button');
      b.className = 'promo-btn';
      const img = document.createElement('img');
      img.src = MD.pieceSrc(color, t);
      b.appendChild(img);
      b.addEventListener('click', () => MD.Game.promote(t));
      row.appendChild(b);
    });
    UI.openModal('promoModal');
  };

  /* ---------- helpers ---------- */
  const troopOf = t => (MD.TROOPS && MD.TROOPS[t]) || null;
  function pieceNode(color, type) {
    const troop = troopOf(type);
    if (troop) {
      const s = document.createElement('span');
      s.className = 'ptoken ' + (color === 'w' ? 'pw' : 'pb');
      s.title = troop.name;
      const inner = document.createElement('span');
      inner.className = 'pt-emoji';
      inner.innerHTML = MD.iconHTML(MD.troopGlyph ? MD.troopGlyph(type) : type);
      s.appendChild(inner);
      return s;
    }
    const img = document.createElement('img');
    img.src = MD.pieceSrc(color, type);
    img.draggable = false;
    img.alt = type;
    return img;
  }
  MD.pieceNode = pieceNode;
  const cellImg = (cell) => (cell ? pieceNode(cell.c, cell.t) : null);
  function rarityClass(r) { return 'rarity-' + (r || 1); }
  UI.rarityClass = rarityClass;

  /* ================= BOARD ================= */
  let sq = 60, boardEl = null, squareLayer, pieceLayer, hiLayer, fxLayer, premoveLayer, msgEl;
  let ori = 1; // 1 = white bottom (standard)
  const FILES = 'abcdefgh';
  UI.ori = () => ori;

  function dispOf(r, c) { return { x: ori === 1 ? c : 7 - c, y: ori === 1 ? r : 7 - r }; }
  function fileOfDisp(x) { return ori === 1 ? FILES[x] : FILES[7 - x]; }
  function rankOfDisp(y) { return ori === 1 ? (8 - y) : (y + 1); }

  UI.flip = () => { ori = -ori; positionSquares(); UI.buildCoordinates(); UI.boardRefresh(); };
  // put the given colour at the bottom of the board (used when choosing your side)
  UI.setHomeColor = function (c) { ori = c === 'w' ? 1 : -1; positionSquares(); UI.buildCoordinates(); };

  function px(r, c) {
    const p = dispOf(r, c);
    return { x: p.x * sq, y: p.y * sq };
  }
  function toRc(clientX, clientY) {
    const rect = boardEl.getBoundingClientRect();
    const S = boardEl.clientWidth / 8;
    let x = Math.floor((clientX - rect.left) / S);
    let y = Math.floor((clientY - rect.top) / S);
    if (x < 0) x = 0; if (x > 7) x = 7;
    if (y < 0) y = 0; if (y > 7) y = 7;
    const c = ori === 1 ? x : 7 - x;
    const r = ori === 1 ? y : 7 - y;
    return { r, c };
  }

  function buildSquares() {
    boardEl = $('#board');
    squareLayer = $('#squareLayer');
    pieceLayer = $('#pieceLayer');
    hiLayer = $('#highlighter');
    fxLayer = $('#fxLayer');
    premoveLayer = $('#premoveLayer');
    msgEl = $('#boardMsg');
    clear(squareLayer);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const d = document.createElement('div');
      d.className = 'square ' + ((r + c) % 2 ? 'dark' : 'light');
      d.dataset.r = r; d.dataset.c = c;
      d.style.width = '12.5%';
      d.style.height = '12.5%';
      squareLayer.appendChild(d);
    }
    positionSquares();
  }
  UI.buildBoard = buildSquares;

  // lay tiles out according to current orientation (board flips cleanly)
  function positionSquares() {
    if (!squareLayer) return;
    for (const d of squareLayer.children) {
      const p = dispOf(+d.dataset.r, +d.dataset.c);
      d.style.left = (p.x * 12.5) + '%';
      d.style.top = (p.y * 12.5) + '%';
    }
  }
  UI.positionSquares = positionSquares;

  // coordinate labels, painted at the same grid positions as the tiles
  function buildCoordinates() {
    const top = $('#coordsTop'), bot = $('#coordsBottom'), lft = $('#coordsLeft'), rgt = $('#coordsRight');
    if (!boardEl || !top) return;
    clear(top); clear(bot); clear(lft); clear(rgt);
    const S = boardEl.clientWidth / 8;
    const mk = (container, el) => container.appendChild(el);
    // file letters along the top & bottom edges
    for (let x = 0; x < 8; x++) {
      for (const box of [top, bot]) {
        const s = document.createElement('span');
        s.textContent = fileOfDisp(x);
        s.style.left = (x * S + S * 0.035) + 'px';
        box === top ? (s.style.top = (S * 0.01) + 'px') : (s.style.bottom = (S * 0.01) + 'px');
        mk(box, s);
      }
    }
    // rank numbers along the left & right edges
    for (let y = 0; y < 8; y++) {
      for (const box of [lft, rgt]) {
        const s = document.createElement('span');
        s.textContent = rankOfDisp(y);
        s.style.top = (y * S + S * 0.03) + 'px';
        box === lft ? (s.style.left = (S * 0.03) + 'px') : (s.style.right = (S * 0.03) + 'px');
        mk(box, s);
      }
    }
  }
  UI.buildCoordinates = buildCoordinates;

  function statusClass(cell) {
    if (!cell || !cell.b) return '';
    const b = cell.b;
    if (b.z > 0) return 'recruiting';
    if (b.f > 0) return 'frozen';
    if (b.s > 0) return 'shielded';
    if (b.p > 0) return 'poisoned';
    return '';
  }

  // paint board pieces + highlights
  function boardRefresh() {
    if (!boardEl) return;
    sq = boardEl.clientWidth / 8;
    clear(pieceLayer); clear(hiLayer); clear(premoveLayer);
    const g = MD.Game.g;
    if (!g) return;

    // highlights
    if (MD.Settings.lastMove && g.lastMove) {
      addHL(g.lastMove.from.r, g.lastMove.from.c, 'last-from');
      addHL(g.lastMove.to.r, g.lastMove.to.c, 'last-to');
    }
    // check highlight
    const stm = g.turn;
    if (MD.Game.phase === 'over') {
      const overTxt = g.winner ? (g.winner === 'w' ? 'White wins' : 'Black wins') : 'Draw';
      let cls = 'draw';
      if (g.winner) {
        if (MD.Game.cfg && MD.Game.cfg.botMode) cls = (g.winner === MD.Game.humanColor) ? 'win' : 'lose';
        else cls = 'win';
      }
      showMsg(overTxt, cls);
    } else if (MD.Game.phase !== 'over' && E_inCheck(g, stm)) {
      const k = MD.Engine.findKing(g, stm);
      if (k) addHL(k.r, k.c, 'check');
    }

    // selection / legal dots
    const sel = MD.Game.sel;
    if (sel) {
      addHL(sel.r, sel.c, 'selected');
      if (MD.Game.phase === 'cards' || MD.Game.phase === 'move') {
        for (const m of MD.Game.legalCache || []) {
          if (m.r0 === sel.r && m.c0 === sel.c) {
            addHL(m.r1, m.c1, (m.capture ? 'dot capture' : 'dot'), true);
          }
        }
      }
    }
    // premove highlight
    const prem = MD.Game.premove;
    if (prem) {
      addHL(prem.from.r, prem.from.c, 'premove');
      addHL(prem.to.r, prem.to.c, 'premove' + (isCapTarget(prem.to) ? ' capture' : ''));
    }
    // ability target mode
    if (MD.Game.targetMode) {
      for (const q of MD.Game.targetList || []) {
        const cell = g.board[q.r][q.c];
        addHL(q.r, q.c, 'target' + (cell ? ' target-can' : '') + (cell ? ' capture' : ''), true);
      }
    }

    // pieces
    const seen = new Set();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = g.board[r][c];
      if (!cell) continue;
      const p = document.createElement('div');
      p.className = 'piece ' + statusClass(cell);
      p.dataset.r = r; p.dataset.c = c;
      const img = cellImg(cell);
      if (img) p.appendChild(img);
      if (cell.b) {
        const addB = (cls, ico) => {
          const bd = document.createElement('span');
          bd.className = 'pbadge ' + cls;
          bd.innerHTML = MD.iconHTML(ico);
          p.appendChild(bd);
        };
        if (cell.b.p > 0) addB('b-psn', 'skull');
        if (cell.b.f > 0) addB('b-frz', 'ice');
        if (cell.b.z > 0) { const r = document.createElement('span'); r.className = 'pbadge b-rec'; r.innerHTML = MD.iconHTML('clock'); r.title = 'Newly summoned — cannot act until its owner\'s next turn'; p.appendChild(r); }
        if (cell.b.mature > 0 && cell.b.growTo) { const r = document.createElement('span'); r.className = 'pbadge b-grow'; r.innerHTML = MD.iconHTML('star'); r.title = 'Growing — will become ' + (MD.pieceName ? MD.pieceName(cell.b.growTo) : cell.b.growTo) + ' after ' + cell.b.mature + ' more move' + (cell.b.mature > 1 ? 's' : ''); p.appendChild(r); }
        if (cell.b.s > 0) addB('b-shd', 'shield');
      }
      const pos = px(r, c);
      p.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      pieceLayer.appendChild(p);
    }
    // animate last chess move (normal move w/o abilities)
    if (MD.Game.lastAnimate && MD.Settings.anim) {
      const an = MD.Game.lastAnimate;
      MD.Game.lastAnimate = null;
      const { from, to } = an;
      const destEl = pieceAt(to.r, to.c);
      if (destEl) {
        const f = px(from.r, from.c);
        destEl.style.transition = 'none';
        destEl.style.transform = 'translate(' + f.x + 'px,' + f.y + 'px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const t = px(to.r, to.c);
            destEl.style.transition = 'transform .24s cubic-bezier(.2,.7,.3,1)';
            destEl.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px)';
          });
        });
      }
    }
  }

  function addHL(r, c, cls, ignoreEmpty) {
    const pos = px(r, c);
    const d = document.createElement('div');
    d.className = 'hl ' + cls;
    d.style.left = pos.x + 'px';
    d.style.top = pos.y + 'px';
    d.style.width = sq + 'px';
    d.style.height = sq + 'px';
    hiLayer.appendChild(d);
  }

  function isCapTarget(to) {
    const g = MD.Game.g;
    const prem = MD.Game.premove;
    if (!prem) return false;
    const moves = MD.Game.premoveLegal || [];
    return moves.some(m => m.r1 === to.r && m.c1 === to.c);
  }

  function pieceAt(r, c) {
    const g = MD.Game.g;
    const cell = g.board[r][c];
    if (!cell) return null;
    const els = pieceLayer.children;
    for (let i = 0; i < els.length; i++) {
      if (+els[i].dataset.r === r && +els[i].dataset.c === c) return els[i];
    }
    return null;
  }

  UI.px = px;
  UI.boardRefresh = boardRefresh;
  UI.refreshPieces = boardRefresh;
  function E_inCheck(g, s) { return MD.Engine.inCheck(g, s); }

  function showMsg(main, cls) {
    if (!msgEl) return;
    msgEl.innerHTML = '';
    const b = document.createElement('div');
    b.className = 'bm ' + cls;
    b.innerHTML = main + (MD.Game.g && MD.Game.g.reason ? '<small>' + MD.Game.g.reason + '</small>' : '');
    msgEl.appendChild(b);
    msgEl.classList.remove('hidden');
  }
  UI.showMsg = showMsg;
  UI.clearMsg = () => { if (msgEl) { msgEl.classList.add('hidden'); clear(msgEl); } };

  // fx marks from ability casts
  function playMarks(marks) {
    if (!marks || !MD.Settings.anim) return;
    marks.forEach((m, i) => {
      setTimeout(() => {
        const pos = px(m.r, m.c);
        const d = document.createElement('div');
        d.className = 'hl fx';
        d.style.left = pos.x + 'px'; d.style.top = pos.y + 'px';
        d.style.width = sq + 'px'; d.style.height = sq + 'px';
        d.style.background = m.kind === 'destroy' ? 'rgba(255,60,40,.6)' :
          m.kind === 'summon' ? 'rgba(90,255,160,.5)' :
          m.kind === 'transform' ? 'rgba(255,200,80,.6)' :
          m.kind === 'freeze' ? 'rgba(120,200,255,.5)' :
          m.kind === 'shield' ? 'rgba(120,255,170,.45)' :
          m.kind === 'poison' ? 'rgba(150,90,200,.5)' : 'rgba(255,255,255,.35)';
        fxLayer.appendChild(d);
        setTimeout(() => d.remove(), 700);
      }, i * 90);
    });
  }
  UI.playMarks = playMarks;

  function fxWord(r, c, text, cls) {
    if (!MD.Settings.anim) return;
    const pos = px(r, c);
    const d = document.createElement('div');
    d.className = 'fx-word ' + (cls || '');
    d.textContent = text;
    d.style.left = (pos.x + sq / 2) + 'px';
    d.style.top = (pos.y + sq / 3) + 'px';
    fxLayer.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }
  UI.fxWord = fxWord;

  /* ================= PLAYER PANELS ================= */
  function playerTag(sideColor, isMe) {
    const P = MD.Profile || {};
    const nm = P.name || '';
    return nm && isMe ? nm : '';
  }
  UI.playerTag = playerTag;

  function renderPlayerCards() {
    const g = MD.Game.g;
    const cfg = MD.Game.cfg;
    const P = MD.Profile || {};
    // mapping
    const topColor = ori === 1 ? 'b' : 'w';
    const meColor = ori === 1 ? 'w' : 'b';
    const meIsHuman = !cfg.botMode || MD.Game.humanColor === meColor;

    // me (bottom chip — chess.com shows your username + rating here)
    const profName = (P.name || '').trim();
    const meName = cfg.botMode ? (profName || 'You') : (meColor === 'w' ? 'White' : 'Black');
    const oppName = cfg.botMode ? 'Computer' : (topColor === 'w' ? 'White' : 'Black');
    $('#meName').textContent = meName;
    $('#oppName').textContent = oppName;
    // meta rows (user tag + rating like chess.com's player line)
    const meUser = cfg.botMode ? ('@' + (profName || 'guest')) : (meColor === 'w' ? 'White' : 'Black');
    const meElo = meIsHuman && !cfg.botMode ? '' : String(P.elo || 1200);
    $('#meUser').textContent = meUser;
    $('#meElo').textContent = meElo ? '• ' + meElo : '';
    const oppUser = cfg.botMode ? 'Mod AI' : (topColor === 'w' ? 'White' : 'Black');
    const oppElo = cfg.botMode ? '• ' + (['Easy', 'Normal', 'Hard'][(cfg.diff || 2) - 1] || 'Normal') : '';
    $('#oppUser').textContent = oppUser;
    $('#oppElo').textContent = oppElo;

    $('#meAvatar').className = 'avatar ' + meColor;
    $('#meAvatar').innerHTML = '<img src="' + MD.pieceSrc(meColor, 'k') + '" alt="king"/>';
    $('#oppAvatar').className = 'avatar ' + topColor;
    $('#oppAvatar').innerHTML = '<img src="' + MD.pieceSrc(topColor, 'k') + '" alt="king"/>';

    const active = g.turn;
    $('#meCard').classList.toggle('active', !g.over && active === meColor);
    $('#oppCard').classList.toggle('active', !g.over && active === topColor);

    const meDiff = advantage(g, meColor), topDiff = advantage(g, topColor);
    renderCaptured('#meCaptured', g, meColor, meDiff);
    renderCaptured('#oppCaptured', g, topColor, topDiff);

    // badges
    $('#meBadge').textContent = cfg.botMode && !(MD.Game.humanColor === meColor) ? 'AI' : '';
    $('#oppBadge').textContent = cfg.botMode && MD.Game.humanColor !== topColor ? 'AI' : '';

    // turn pill
    const pill = $('#turnPill');
    pill.classList.remove('you', 'bot', 'wait');
    if (g.over) { $('#turnPillText').textContent = 'Game over'; }
    else if (!cfg.botMode) { $('#turnPillText').textContent = (active === meColor ? meName : oppName) + ' to move'; pill.classList.add(active === meColor ? 'you' : 'bot'); }
    else if (active === MD.Game.humanColor) { $('#turnPillText').textContent = 'Your turn'; pill.classList.add('you'); }
    else { $('#turnPillText').textContent = 'Computer thinking…'; pill.classList.add('bot'); }
  }
  function renderCaptured(sel, g, color, diff) {
    const el = $(sel);
    clear(el);
    const shown = g.capt[color].slice().sort((a, b) => MD.Engine.val(b.t) - MD.Engine.val(a.t));
    shown.forEach(c => el.appendChild(pieceNode(color, c.t)));
    if (diff > 0) {
      const adv = document.createElement('span');
      adv.className = 'cap-advantage';
      if (diff >= 100) adv.textContent = '+' + Math.floor(diff / 100);
      else adv.textContent = '+1';
      el.appendChild(adv);
    }
  }
  function advantage(g, color) {
    let v = 0;
    for (const c of g.capt[color]) v += MD.Engine.val(c.t);
    for (const c of g.capt[MD.Engine.opp(color)]) v -= MD.Engine.val(c.t);
    return v;
  }
  UI.renderPlayerCards = renderPlayerCards;

  /* ================= ABILITY CARDS ================= */
  function renderCards() {
    const G = MD.Game;
    const zone = $('#azCards');
    clear(zone);
    const hand = G.hand && G.hand.cards ? G.hand.cards : [];
    const azTitle = $('#azTitle'), azSub = $('#azSub'), skipBtn = $('#btnSkipAbility'), note = $('#azNote');

    if (G.phase === 'over') {
      azTitle.textContent = 'Battle Over';
      azSub.textContent = '';
      skipBtn.style.display = 'none';
      note.textContent = '';
      zone.appendChild(empty('flag', 'The battle has concluded.', ''));
      return;
    }
    if (G.phase === 'cards' || G.phase === 'move') {
      // whose hand is on screen?
      const side = G.hand ? G.hand.for : null;
      const mode = G.cfg.mode || 'classic';
      const MODE_SUB = {
        classic: 'Classic — cast 1, then move',
        chaos: 'Chaos — fate casts 1 for you',
        draft: 'Draft — pick 1 of 4, then move',
        echo: 'Echo — your spell echoes to the enemy'
      };
      if (!side || (G.phase === 'cards' && !G.hand.cards.length)) {
        azTitle.textContent = 'Ability Phase';
        azSub.textContent = MODE_SUB[mode] || 'cast before moving';
        skipBtn.style.display = 'none';
        note.textContent = '';
        zone.appendChild(empty('spark', G.phase === 'cards' ? 'Dealing your spells…' : 'Choose a spell, then move.'));
        return;
      }
      const isHumanSide = G.cfg.botMode ? (side === G.humanColor) : true;
      if (!isHumanSide) {
        azTitle.textContent = 'Opponent\'s spells';
        azSub.textContent = MODE_SUB[mode] || 'face down until cast';
        skipBtn.style.display = 'none';
        note.textContent = '';
        const n = Math.max(1, (G.hand && G.hand.cards.length) || 3);
        for (let i = 0; i < n; i++) zone.appendChild(backCard());
        return;
      }
      azTitle.textContent = 'Your Spells — ' + (G.hand.used ? 'cast' : 'choose 1');
      azSub.textContent = MODE_SUB[mode] || 'cast before moving · revealed to all';
      skipBtn.style.display = 'none';
      if (G.hand.used) {
        note.textContent = G.phase === 'move' ? 'Make your move.' : '';
        hand.forEach((a, i) => zone.appendChild(makeCard(a, true, G.hand.usedId === a.id)));
      } else {
        note.textContent = G.pickingIdx >= 0 ? 'Pick a highlighted square on the board' :
          (mode === 'chaos' ? 'Fate is casting a spell for you…' : 'Click a card to cast it, then move.');
        hand.forEach((a, i) => zone.appendChild(makeCard(a, false, false, G.pickingIdx === i)));
      }
      return;
    }
    // waiting phase
    const youToMove = G.cfg.botMode ? G.g.turn === G.humanColor : true;
    azTitle.textContent = 'Waiting';
    azSub.textContent = youToMove ? '' : 'computer is thinking';
    skipBtn.style.display = 'none';
    note.textContent = '';
    zone.appendChild(empty('clock', youToMove ? '' : 'The computer is plotting…', ''));
  }
  function empty(icon, title, sub) {
    const d = document.createElement('div');
    d.className = 'az-empty';
    d.innerHTML = '<div class="az-empty-ico">' + MD.iconHTML(icon || 'spark') + '</div>' +
      (title ? '<div class="az-empty-title">' + esc(title) + '</div>' : '') +
      (sub ? '<div class="az-empty-sub">' + esc(sub) + '</div>' : '');
    return d;
  }
  function backCard() {
    const d = document.createElement('div');
    d.className = 'ability-card back';
    d.style.background = 'linear-gradient(135deg,#2b2f38,#191c22)';
    d.style.cursor = 'default';
    d.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px">' +
      '<span style="font-weight:800;color:#5b6270;letter-spacing:1px">SPELL</span>' +
      '<span class="az-back-ico">' + MD.iconHTML('lock') + '</span></div>' +
      '<div style="padding:0 12px 12px;color:#444c58;font-size:12px;line-height:1.4">' +
      'A mysterious ability, dealt to the enemy. Its effect stays hidden until it is cast on the board — and both sides will see it then.</div>';
    return d;
  }
  function makeCard(a, used, isCastUsed, picking) {
    const d = document.createElement('div');
    d.className = 'ability-card' + (used ? ' used' : ' castable') + (picking ? ' picking' : '');
    d.dataset.idx = String(a.id);
    const rare = MD.RARITY[a.rarity] || MD.RARITY[1];
    d.innerHTML =
      '<div class="ac-top"><div class="ac-icon">' + MD.iconHTML(a.icon) + '</div>' +
      '<div class="ac-name">' + esc(a.name) + '</div>' +
      '<div class="ac-rarity rarity-' + a.rarity + '" style="color:' + rare.color + '">' + rare.label.toUpperCase() + '</div></div>' +
      '<div class="ac-desc">' + esc(a.desc) + '</div>' +
      '<div class="ac-flavor">' + esc(a.flavor || '') + '</div>';
    if (isCastUsed) d.classList.add('used');
    if (!used) {
      d.addEventListener('click', ev => { ev.stopPropagation(); MD.Game.onCardClick(a.id); });
    }
    return d;
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  UI.renderCards = renderCards;
  UI.esc = esc;

  /* ================= ABILITY BURST + EFFECT READOUT ================= */
  function showBurst(icon, name, side, effectLines, desc) {
    const b = $('#burst');
    let effects = '';
    const rule = desc ? '<div class="bc-rule">' + esc(desc) + '</div>' : '';
    if (effectLines && effectLines.length) {
      const shown = effectLines.slice(0, 5);
      effects = '<div class="bc-effects">' + shown.map(l => '<div>• ' + esc(l) + '</div>').join('') +
        (effectLines.length > 5 ? '<div class="bc-more">…and ' + (effectLines.length - 5) + ' more</div>' : '') + '</div>';
    }
    b.innerHTML = '<div class="burst-card">' +
      '<div class="bc-icon">' + MD.iconHTML(icon) + '</div>' +
      '<div class="bc-side ' + side + '">' + (side === 'w' ? 'White' : 'Black') + ' casts</div>' +
      '<div class="bc-name">' + esc(name) + '</div>' + rule + effects + '</div>';
    b.classList.add('show');
    b.style.display = 'grid';
    const hold = 3400; // keep the readout up long enough to read what happened
    setTimeout(() => { b.classList.remove('show'); setTimeout(() => { b.style.display = 'none'; clear(b); }, 400); }, hold);
  }
  UI.showBurst = showBurst;

  // announce the actual resolved effects of a cast to both players
  function playEffects(lines, icon) {
    if (!lines || !lines.length) return;
    const shown = lines.slice(0, 5);
    shown.forEach((l, i) => {
      setTimeout(() => UI.toast(MD.iconHTML(icon || 'spark') + ' <b>Effect:</b> ' + esc(l), 'sys'), i * 120);
    });
    if (lines.length > 5) setTimeout(() => UI.toast('…and ' + (lines.length - 5) + ' more effects.', 'sys'), (shown.length) * 120);
  }
  UI.playEffects = playEffects;

  /* ================= MOVE / BATTLE LOG ================= */
  function renderLogs() {
    const g = MD.Game.g;
    // moves
    const ml = $('#moveLog');
    if (ML_currentCount !== g.hist.length) {
      ML_currentCount = g.hist.length;
      clear(ml);
      let row = null, num = 1;
      g.hist.forEach((h, i) => {
        if (h.color === 'w') {
          row = document.createElement('div');
          row.className = 'ml-row' + (i % 2 ? ' alt' : '');
          const n = document.createElement('span');
          n.className = 'ml-num'; n.textContent = num++;
          row.appendChild(n);
          ml.appendChild(row);
        }
        if (!row) { row = document.createElement('div'); row.className = 'ml-row'; ml.appendChild(row); }
        const mv = document.createElement('span');
        mv.className = 'ml-move';
        mv.textContent = h.san;
        mv.addEventListener('click', () => { /* could implement seek later */ });
        row.appendChild(mv);
      });
      ml.scrollTop = ml.scrollHeight;
    }
    UI.renderBattleLog();
  }
  let ML_currentCount = -1;
  function renderBattleLog() {
    const g = MD.Game.g;
    const bl = $('#battleLog');
    if (BL_count === g.logCount && g.logCount !== undefined) return;
    BL_count = g.logCount;
    clear(bl);
    const entries = g.battleLog || [];
    for (const e of entries) {
      const row = document.createElement('div');
      row.className = 'bl-item';
      let inner = '<span class="bl-' + (e.kind || 'sys') + '">' + esc(e.text) + '</span>';
      if (e.icon) inner = '<span class="bl-icon">' + MD.iconHTML(e.icon) + '</span>' + inner;
      row.innerHTML = inner;
      bl.appendChild(row);
    }
    bl.scrollTop = bl.scrollHeight;
  }
  let BL_count = undefined;
  UI.renderLogs = renderLogs;
  UI.renderBattleLog = renderBattleLog;
  UI.logCountOf = g => (g.battleLog || []).length;

  /* ---------- spell (ability) history log ---------- */
  let SP_count = undefined;
  function renderSpellLog() {
    const g = MD.Game.g;
    const el = $('#spellLog');
    if (!el || !g) return;
    if (SP_count === g.spellSeq && g.spellSeq !== undefined) return;
    SP_count = g.spellSeq;
    clear(el);
    const logs = g.spellLog || [];
    for (const e of logs) {
      const d = document.createElement('div');
      d.className = 'sp-item';
      let head = '<div class="sp-head">';
      if (e.icon) head += MD.iconHTML(e.icon) + ' ';
      head += '<b class="bl-' + (e.side || 'sys') + '">' + (e.side === 'w' ? 'White' : e.side === 'b' ? 'Black' : 'Sys') + '</b>' +
        ' casts <b>' + esc(e.name) + '</b><span class="sp-ply">#' + (e.ply || '') + '</span></div>';
      let body = '';
      if (e.desc) body += '<div class="sp-desc">' + esc(e.desc) + '</div>';
      (e.lines || []).forEach(l => { body += '<div class="sp-line">' + esc(l) + '</div>'; });
      d.innerHTML = head + body;
      el.appendChild(d);
    }
    el.scrollTop = el.scrollHeight;
  }
  UI.renderSpellLog = renderSpellLog;

  /* ================= CODEX ================= */
  function renderCodex(filterCat, filterRar) {
    const grid = $('#codexGrid');
    clear(grid);
    $('#codexCount').textContent = '— ' + MD.ABILITIES.length + ' spells —';
    let list = MD.ABILITIES;
    if (filterCat && filterCat !== 'All') list = list.filter(a => a.cat === filterCat);
    if (filterRar && filterRar !== 0) list = list.filter(a => a.rarity === filterRar);
    list.forEach(a => {
      const c = document.createElement('div');
      c.className = 'codex-card rarity-' + a.rarity;
      const rare = MD.RARITY[a.rarity];
      c.style.borderTopColor = rare.color;
      c.innerHTML = '<div class="cc-head"><span class="cc-icon">' + MD.iconHTML(a.icon) + '</span>' +
        '<span class="cc-name">' + esc(a.name) + '</span></div>' +
        '<div class="cc-cat" style="color:' + rare.color + '">#' + a.id + ' · ' + esc(a.cat) + ' · ' + rare.label + '</div>' +
        '<div class="cc-desc">' + esc(a.desc) + '</div>';
      grid.appendChild(c);
    });
  }
  UI.renderCodex = renderCodex;

  /* ================= THEME / MISC ================= */
  function applyTheme() {
    document.body.classList.remove('theme-green', 'theme-wood', 'theme-dark');
    document.body.classList.add('theme-' + MD.Settings.theme);
  }
  UI.applyTheme = applyTheme;

  function updateSoundBtn() {
    $('#btnSound').innerHTML = MD.iconHTML(MD.Settings.sound ? 'sound' : 'mute');
  }
  UI.updateSoundBtn = updateSoundBtn;

  /* ---------- global pointer handling for board ---------- */
  UI.bindBoard = function () {
    const board = $('#board');
    let down = null, dragging = false, ghost = null;

    board.addEventListener('pointerdown', e => {
      if (MD.Game.phase === 'over') return;
      if (e.target.closest('.hl, .coords, .piece-layer .fx-word')) { /* fine */ }
      const rc = toRc(e.clientX, e.clientY);
      if (rc.r === undefined) return;
      down = { x: e.clientX, y: e.clientY, rc };
      dragging = false;
    });

    window.addEventListener('pointermove', e => {
      if (!down) return;
      if (!dragging && (Math.abs(e.clientX - down.x) > 6 || Math.abs(e.clientY - down.y) > 6)) {
        const cell = MD.Game.g.board[down.rc.r][down.rc.c];
        if (cell && MD.Game.canGrab(down.rc.r, down.rc.c)) {
          dragging = true;
          MD.Game.grab(down.rc.r, down.rc.c);
          const img = cellImg(cell);
          ghost = document.createElement('div');
          ghost.className = 'dragpiece';
          ghost.appendChild(img);
          document.body.appendChild(ghost);
        }
      }
      if (dragging && ghost) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
      }
    });

    window.addEventListener('pointerup', e => {
      if (!down) return;
      const wasDrag = dragging;
      const target = toRc(e.clientX, e.clientY);
      if (wasDrag && ghost) {
        ghost.remove(); ghost = null;
        MD.Game.drop(down.rc.r, down.rc.c, target.r, target.c);
      } else {
        MD.Game.tap(down.rc.r, down.rc.c);
      }
      down = null; dragging = false;
    });
  };

  /* ---------- bind static UI controls ---------- */
  UI.bindStatic = function () {
    $('#btnFlip').addEventListener('click', () => { UI.flip(); UI.render(); });
    $('#btnSound').addEventListener('click', () => {
      MD.Settings.sound = !MD.Settings.sound; MD.Settings.save(); updateSoundBtn();
      if (MD.Settings.sound) tone(500, 0.12, 'triangle', 0.1);
    });
    $('#btnNewGame').addEventListener('click', () => MD.Game.showMenu());
    $('#btnPlay').addEventListener('click', () => MD.Game.showMenu());
    $('#btnSettings').addEventListener('click', () => { syncSettingsUI(); UI.openModal('settingsModal'); });
    $('#btnCodex').addEventListener('click', () => {
      UI.renderCodex('All', 0);
      const f = $('#codexFilter');
      clear(f);
      const state = { cat: 'All', rar: 0 };
      const rebuild = () => {
        clear(f);
        const mk = (label, val, isRar, active) => {
          const b = document.createElement('button');
          b.className = 'chip' + (active ? ' selected' : '');
          b.textContent = label;
          b.addEventListener('click', () => {
            if (isRar) state.rar = val; else state.cat = val;
            UI.renderCodex(state.cat, state.rar);
            rebuild();
          });
          return b;
        };
        f.appendChild(mk('All cats', 'All', false, state.cat === 'All'));
        MD.CATS.forEach(c => f.appendChild(mk(c, c, false, state.cat === c)));
        const sep = document.createElement('span'); sep.style.width = '10px'; f.appendChild(sep);
        f.appendChild(mk('Any rarity', 0, true, state.rar === 0));
        [1, 2, 3, 4].forEach(r => f.appendChild(mk('★'.repeat(r), r, true, state.rar === r)));
      };
      rebuild();
      UI.openModal('codexModal');
    });

    // promo close buttons & modals backdrop
    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => UI.closeModal(el.dataset.close));
    });
    $('#modalBack').addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => { m.hidden = true; });
      $('#modalBack').style.display = 'none';
    });
    function showTab(which) {
      ['tabMoves', 'tabLog', 'tabSpells'].forEach(id => {
        $('#' + id).classList.toggle('active', id === ('tab' + which[0].toUpperCase() + which.slice(1)));
      });
      $('#moveLog').style.display = which === 'moves' ? '' : 'none';
      $('#battleLog').style.display = which === 'log' ? '' : 'none';
      $('#spellLog').style.display = which === 'spells' ? '' : 'none';
      if (which === 'log') UI.renderBattleLog();
      if (which === 'spells') UI.renderSpellLog();
    }
    $('#tabMoves').addEventListener('click', () => showTab('moves'));
    $('#tabLog').addEventListener('click', () => showTab('log'));
    $('#tabSpells').addEventListener('click', () => showTab('spells'));
    $('#btnSkipAbility').addEventListener('click', () => MD.Game.skipAbility());
    $('#btnRematch').addEventListener('click', () => { UI.closeModal('resultModal'); MD.Game.rematch(); });
    $('#btnResultMenu').addEventListener('click', () => { UI.closeModal('resultModal'); MD.Game.showMenu(); });
  };

  /* settings sync */
  function syncSettingsUI() {
    $('#setPremove').checked = MD.Settings.premove;
    $('#setAutoQueen').checked = MD.Settings.autoQueen;
    $('#setLegal').checked = MD.Settings.legal;
    $('#setLastMove').checked = MD.Settings.lastMove;
    $('#setAutoCastle').checked = MD.Settings.autoCastle;
    $('#setSound').checked = MD.Settings.sound;
    $('#setAnim').checked = MD.Settings.anim;
    document.querySelectorAll('#themeSeg .seg-btn').forEach(b => b.classList.toggle('selected', b.dataset.theme === MD.Settings.theme));
  }
  function bindSettings() {
    $('#setPremove').addEventListener('change', e => { MD.Settings.premove = e.target.checked; persist(); });
    $('#setAutoQueen').addEventListener('change', e => { MD.Settings.autoQueen = e.target.checked; persist(); });
    $('#setLegal').addEventListener('change', e => { MD.Settings.legal = e.target.checked; persist(); UI.render(); });
    $('#setLastMove').addEventListener('change', e => { MD.Settings.lastMove = e.target.checked; persist(); UI.render(); });
    $('#setAutoCastle').addEventListener('change', e => { MD.Settings.autoCastle = e.target.checked; persist(); });
    $('#setSound').addEventListener('change', e => { MD.Settings.sound = e.target.checked; persist(); updateSoundBtn(); });
    $('#setAnim').addEventListener('change', e => { MD.Settings.anim = e.target.checked; persist(); });
    document.querySelectorAll('#themeSeg .seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        MD.Settings.theme = b.dataset.theme; persist(); applyTheme(); syncSettingsUI();
      });
    });
  }

  UI.render = function () {
    renderPlayerCards();
    renderCards();
    renderLogs();
    renderSpellLog();
    boardRefresh();
  };

  UI.init = function () {
    buildSquares();
    buildCoordinates();
    applyTheme();
    updateSoundBtn();
    UI.bindStatic();
    bindSettings();
    UI.bindBoard();
    window.addEventListener('resize', () => {
      if (boardEl) { UI.buildCoordinates(); if (MD.Game && MD.Game.g) UI.render(); }
    });
  };

  /* ---------- menu wiring & boot ---------- */
  function setColorRow() {
    const human = MD.Settings.human || 'w';
    document.querySelectorAll('#colorRow .chip').forEach(c => c.classList.toggle('selected', c.dataset.color === human));
  }
  UI.setColorRow = setColorRow;

  function setModeRow() {
    const sm = MD.Settings.smode || 'classic';
    document.querySelectorAll('#smodeRow .chip').forEach(c => c.classList.toggle('selected', c.dataset.smode === sm));
  }
  UI.setModeRow = setModeRow;

  function wireMenu() {
    document.querySelectorAll('.mode-card').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(x => x.classList.toggle('selected', x === b));
        const isBot = b.dataset.mode === 'bot';
        $('#diffRow').style.display = isBot ? '' : 'none';
        $('#colorRow').style.display = isBot ? '' : 'none';
      });
    });
    document.querySelectorAll('#diffRow .chip').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('#diffRow .chip').forEach(x => x.classList.toggle('selected', x === c));
        MD.Settings.diff = +c.dataset.diff;
        MD.Settings.save();
      });
    });
    document.querySelectorAll('#colorRow .chip').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('#colorRow .chip').forEach(x => x.classList.toggle('selected', x === c));
        MD.Settings.human = c.dataset.color;
        MD.Settings.save();
      });
    });
    document.querySelectorAll('#smodeRow .chip').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('#smodeRow .chip').forEach(x => x.classList.toggle('selected', x === c));
        MD.Settings.smode = c.dataset.smode;
        MD.Settings.save();
      });
    });
    $('#btnStart').addEventListener('click', () => {
      const sel = document.querySelector('.mode-card.selected');
      const isBot = !sel || sel.dataset.mode === 'bot';
      MD.Game.start(isBot, MD.Settings.diff, MD.Settings.human || 'w', MD.Settings.smode || 'classic');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    wireMenu();
    const logo = document.getElementById('logoMark');
    if (logo) logo.innerHTML = '<img src="' + MD.pieceSrc('w', 'n') + '" alt=""/>';
    const flipBtn = document.getElementById('btnFlip');
    if (flipBtn) flipBtn.innerHTML = MD.iconHTML('flip');
    document.querySelectorAll('.mode-emoji').forEach(el => {
      const k = el.dataset && el.dataset.ico;
      if (k) el.innerHTML = MD.iconHTML(k);
    });
    const pc = document.getElementById('poolCount');
    if (pc) pc.textContent = MD.ABILITIES ? MD.ABILITIES.length : 0;
    document.querySelectorAll('.modal').forEach(m => {
      m.hidden = m.id !== 'menuModal';
    });
    $('#modalBack').style.display = 'block';
    if (MD.Game && MD.Game.showMenu) MD.Game.showMenu();
  });
})();

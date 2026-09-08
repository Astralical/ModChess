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
  const DEFAULTS = { premove: true, autoQueen: true, legal: true, lastMove: true, autoCastle: true, sound: true, anim: true, theme: 'green', diff: 2, human: 'w', smode: 'classic', size: 8, items: false };
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
  const FILES = 'abcdefghijkl';
  UI.ori = () => ori;
  // current board dimension (default 8) — reads the live game if present
  function bdim() { const g = MD.Game && MD.Game.g; const nn = (g && g.n) | 0; return nn >= 4 ? nn : 8; }
  UI.bdim = bdim;

  function dispOf(r, c) { const n = bdim(); return { x: ori === 1 ? c : (n - 1 - c), y: ori === 1 ? r : (n - 1 - r) }; }
  function fileOfDisp(x) { const n = bdim(); return ori === 1 ? FILES[x] : FILES[n - 1 - x]; }
  function rankOfDisp(y) { const n = bdim(); return ori === 1 ? (n - y) : (y + 1); }

  UI.flip = () => { ori = -ori; positionSquares(); UI.buildCoordinates(); UI.boardRefresh(); };
  // put the given colour at the bottom of the board (used when choosing your side)
  UI.setHomeColor = function (c) { ori = c === 'w' ? 1 : -1; positionSquares(); UI.buildCoordinates(); };

  function px(r, c) {
    const p = dispOf(r, c);
    return { x: p.x * sq, y: p.y * sq };
  }
  function toRc(clientX, clientY) {
    const n = bdim();
    const rect = boardEl.getBoundingClientRect();
    const S = boardEl.clientWidth / n;
    let x = Math.floor((clientX - rect.left) / S);
    let y = Math.floor((clientY - rect.top) / S);
    if (x < 0) x = 0; if (x > n - 1) x = n - 1;
    if (y < 0) y = 0; if (y > n - 1) y = n - 1;
    const c = ori === 1 ? x : n - 1 - x;
    const r = ori === 1 ? y : n - 1 - y;
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
    const n = bdim();
    clear(squareLayer);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const d = document.createElement('div');
      d.className = 'square ' + ((r + c) % 2 ? 'dark' : 'light');
      d.dataset.r = r; d.dataset.c = c;
      d.style.width = (100 / n) + '%';
      d.style.height = (100 / n) + '%';
      squareLayer.appendChild(d);
    }
    positionSquares();
  }
  UI.buildBoard = buildSquares;

  // lay tiles out according to current orientation (board flips cleanly)
  function positionSquares() {
    if (!squareLayer) return;
    const n = bdim();
    for (const d of squareLayer.children) {
      const p = dispOf(+d.dataset.r, +d.dataset.c);
      d.style.left = (p.x * (100 / n)) + '%';
      d.style.top = (p.y * (100 / n)) + '%';
    }
  }
  UI.positionSquares = positionSquares;

  // coordinate labels, painted at the same grid positions as the tiles
  function buildCoordinates() {
    const top = $('#coordsTop'), bot = $('#coordsBottom'), lft = $('#coordsLeft'), rgt = $('#coordsRight');
    if (!boardEl || !top) return;
    clear(top); clear(bot); clear(lft); clear(rgt);
    const n = bdim();
    const S = boardEl.clientWidth / n;
    const mk = (container, el) => container.appendChild(el);
    // file letters along the top & bottom edges
    for (let x = 0; x < n; x++) {
      for (const box of [top, bot]) {
        const s = document.createElement('span');
        s.textContent = fileOfDisp(x);
        s.style.left = (x * S + S * 0.035) + 'px';
        box === top ? (s.style.top = (S * 0.01) + 'px') : (s.style.bottom = (S * 0.01) + 'px');
        mk(box, s);
      }
    }
    // rank numbers along the left & right edges
    for (let y = 0; y < n; y++) {
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
    if (b.st > 0) return 'sealed';
    if (b.z > 0) return 'recruiting';
    if (b.f > 0) return 'frozen';
    if (b.s > 0) return 'shielded';
    if (b.p > 0) return 'poisoned';
    if (b.doom > 0) return 'doomed';
    if (b.frail) return 'frail';
    return '';
  }

  // paint board pieces + highlights
  function boardRefresh() {
    if (!boardEl) return;
    const g = MD.Game.g;
    if (!g) return;
    const n = bdim();
    // a new board size between games -> rebuild the tile grid & coordinate labels
    if (squareLayer && squareLayer.children.length !== n * n) { buildSquares(); buildCoordinates(); }
    if (document.body) document.body.style.setProperty('--bdn', String(n));
    sq = boardEl.clientWidth / n;
    clear(pieceLayer); clear(hiLayer); clear(premoveLayer);

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
      // two-piece spells: show the already-chosen first square
      if (MD.Game.pendingAbility && MD.Game.pendingAbility.twoPick && MD.Game.pickA) {
        addHL(MD.Game.pickA.r, MD.Game.pickA.c, 'selected target-first', true);
      }
    }

    // terrain (walls & rivers) tiles, painted under the pieces
    if (g.blocked) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const terr = g.blocked[r][c];
        if (!terr) continue;
        const d = document.createElement('div');
        d.className = 'terrain ' + (terr.t === 'river' ? 'ter-river' : 'ter-wall');
        const pos = px(r, c);
        d.style.left = pos.x + 'px';
        d.style.top = pos.y + 'px';
        d.style.width = sq + 'px';
        d.style.height = sq + 'px';
        pieceLayer.appendChild(d);
      }
    }

    // pieces
    const seen = new Set();
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = g.board[r][c];
      if (!cell) continue;
      const p = document.createElement('div');
      p.className = 'piece ' + statusClass(cell) + (MD.Engine.obscured(g, r, c) ? ' veiled' : '');
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
        if (cell.b.v > 0) addB('b-vei', 'wind');
        if (cell.b.st > 0) addB('b-stn', 'lock');
        if (cell.b.doom > 0) addB('b-doom', 'target');
        if (cell.b.frail) addB('b-fra', 'sword');
        if (cell.b.z > 0) { const r = document.createElement('span'); r.className = 'pbadge b-rec'; r.innerHTML = MD.iconHTML('clock'); r.title = 'Newly summoned — cannot act until its owner\'s next turn'; p.appendChild(r); }
        if (cell.b.mature > 0 && cell.b.growTo) { const r = document.createElement('span'); r.className = 'pbadge b-grow'; r.innerHTML = MD.iconHTML('star'); r.title = 'Growing — will become ' + (MD.pieceName ? MD.pieceName(cell.b.growTo) : cell.b.growTo) + ' after ' + cell.b.mature + ' more move' + (cell.b.mature > 1 ? 's' : ''); p.appendChild(r); }
        if (cell.b.s > 0) addB('b-shd', 'shield');
      }
      const pos = px(r, c);
      p.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      pieceLayer.appendChild(p);
    }
    // claimed item markers (magic treasures waiting to be picked up)
    if (g.itemEnabled && g.items && g.items.length) {
      for (const it of g.items) {
        const idef = MD.itemById ? MD.itemById(it.id) : null;
        const d = document.createElement('div');
        d.className = 'itemmark';
        d.title = idef ? idef.name : 'treasure';
        d.innerHTML = MD.iconHTML(idef ? idef.icon : 'gem');
        const pos = px(it.r, it.c);
        d.style.left = pos.x + 'px';
        d.style.top = pos.y + 'px';
        d.style.width = sq + 'px';
        d.style.height = sq + 'px';
        pieceLayer.appendChild(d);
      }
    }
    // pending mortar/siege shells — a target marker with its fuse countdown
    if (g.shells && g.shells.length) {
      for (const sh of g.shells) {
        const d = document.createElement('div');
        d.className = 'shellmark';
        const pos = px(sh.r, sh.c);
        d.style.left = pos.x + 'px';
        d.style.top = pos.y + 'px';
        d.style.width = sq + 'px';
        d.style.height = sq + 'px';
        const ring = document.createElement('span');
        ring.className = 'shell-ring';
        ring.innerHTML = MD.iconHTML('target');
        const num = document.createElement('span');
        num.className = 'shell-n';
        num.textContent = sh.fuse;
        d.appendChild(ring); d.appendChild(num);
        pieceLayer.appendChild(d);
      }
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
    // hidden hazard terrain markers
    if (g.haz) {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const hz = g.haz[r] && g.haz[r][c];
        if (!hz) continue;
        const icon = hz.kind === 'trap' ? 'target' : hz.kind === 'poison' ? 'skull' : hz.kind === 'freeze' ? 'ice' : hz.kind === 'ward' ? 'shieldup' : 'fire';
        const d = document.createElement('div');
        d.className = 'hazmark';
        d.innerHTML = MD.iconHTML(icon);
        const pos = px(r, c);
        d.style.left = pos.x + 'px';
        d.style.top = pos.y + 'px';
        d.style.width = sq + 'px';
        d.style.height = sq + 'px';
        pieceLayer.appendChild(d);
      }
    }
    // ground zones (persistent terrain effects)
    if (g.zone) {
      const zicon = { fire: 'fire', thorns: 'leaf', mire: 'drop', sanctum: 'shieldup', rift: 'void', fog: 'wind' };
      const zcls = { fire: 'z-fire', thorns: 'z-thorns', mire: 'z-mire', sanctum: 'z-sanctum', rift: 'z-rift', fog: 'z-fog' };
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const zo = g.zone[r] && g.zone[r][c];
        if (!zo) continue;
        const d = document.createElement('div');
        d.className = 'zonemark ' + (zcls[zo.kind] || 'z-mire');
        d.innerHTML = MD.iconHTML(zicon[zo.kind] || 'fire');
        const pos = px(r, c);
        d.style.left = pos.x + 'px';
        d.style.top = pos.y + 'px';
        d.style.width = sq + 'px';
        d.style.height = sq + 'px';
        pieceLayer.appendChild(d);
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
    const inCamp = MD.Campaign && MD.Campaign.active;
    const profName = (P.name || '').trim();
    const meName = inCamp ? (profName || 'Your Realm') : cfg.botMode ? (profName || 'You') : (meColor === 'w' ? 'White' : 'Black');
    const oppName = inCamp ? 'The Warlord' : cfg.botMode ? 'Computer' : (topColor === 'w' ? 'White' : 'Black');
    $('#meName').textContent = meName;
    $('#oppName').textContent = oppName;
    // meta rows (user tag + rating like chess.com's player line)
    const meUser = inCamp ? ('@' + (profName || 'defender')) : cfg.botMode ? ('@' + (profName || 'guest')) : (meColor === 'w' ? 'White' : 'Black');
    const meElo = (meIsHuman && !cfg.botMode) && !inCamp ? '' : String(P.elo || 1200);
    $('#meUser').textContent = meUser;
    $('#meElo').textContent = inCamp ? '' : (meElo ? '• ' + meElo : '');
    const oppUser = inCamp ? 'Siege Host' : cfg.botMode ? 'Mod AI' : (topColor === 'w' ? 'White' : 'Black');
    const oppElo = inCamp ? '• waves of war' : cfg.botMode ? '• ' + (['Easy', 'Normal', 'Hard'][(cfg.diff || 2) - 1] || 'Normal') : '';
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
    const azTitle = $('#azTitle'), azSub = $('#azSub'), skipBtn = $('#btnSkipAbility'), note = $('#azNote');

    // campaign mode replaces the ability zone with its own instructions
    if (MD.Campaign && MD.Campaign.active) {
      azTitle.textContent = 'Siege of the Crystal Throne';
      azSub.textContent = 'roguelike campaign · 1-time run';
      skipBtn.style.display = 'none';
      note.textContent = '';
      const c = MD.Campaign;
      const line1 = c.phase === 'enemy' ? 'The enemy host is marching… hold the line!' :
        (c.phase === 'reward' ? 'The wave is broken — choose a boon.' : 'Your round — move up to ' + c.tokens + ' piece' + (c.tokens === 1 ? '' : 's') + ', then press ENEMY PHASE.');
      const line2 = c.phase === 'enemy' ? 'Every surviving enemy takes one step.' :
        'Captures earn gold · your army persists · lose your King and the run ends.';
      const d = document.createElement('div');
      d.className = 'az-empty';
      d.innerHTML = '<div class="az-empty-ico">' + MD.iconHTML(c.phase === 'enemy' ? 'skull' : 'crown') + '</div>' +
        '<div class="az-empty-title">' + esc(line1) + '</div>' +
        '<div class="az-empty-sub">' + esc(line2) + '</div>';
      zone.appendChild(d);
      return;
    }
    const hand = G.hand && G.hand.cards ? G.hand.cards : [];

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
        const twoPickNote = G.pendingAbility && G.pendingAbility.twoPick
          ? (G.pickA ? 'Now pick the SECOND piece on the board.' : 'Pick the FIRST piece, then a second.')
          : 'Pick a highlighted square on the board';
        note.textContent = G.pickingIdx >= 0 ? twoPickNote :
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
      const rare = MD.RARITY[a.rarity] || MD.RARITY[4];
      c.style.borderTopColor = rare.color;
      c.innerHTML = '<div class="cc-head"><span class="cc-icon">' + MD.iconHTML(a.icon) + '</span>' +
        '<span class="cc-name">' + esc(a.name) + '</span></div>' +
        '<div class="cc-cat" style="color:' + rare.color + '">#' + a.id + ' · ' + esc(a.cat) + ' · ' + rare.label + '</div>' +
        '<div class="cc-desc">' + esc(a.desc) + '</div>';
      grid.appendChild(c);
    });
  }
  UI.renderCodex = renderCodex;

  /* ================= PEDIA (reference handbook) ================= */
  function pediaCard(title, glyph, sub, desc) {
    const d = document.createElement('div');
    d.className = 'pedia-card';
    d.innerHTML = '<div class="pc-top">' + (glyph ? '<span class="pc-glyph">' + glyph + '</span>' : '') + '<span>' + esc(title) + '</span></div>' +
      (sub ? '<div class="pc-sub">' + esc(sub) + '</div>' : '') +
      (desc ? '<div class="pc-desc">' + esc(desc) + '</div>' : '');
    return d;
  }
  function pediaHeading(t) {
    const d = document.createElement('div');
    d.className = 'pedia-kind';
    d.textContent = t;
    return d;
  }
  function dirName(dr, dc) {
    if (!dr && !dc) return '';
    const dy = dr < 0 ? 'N' : dr > 0 ? 'S' : '';
    const dx = dc > 0 ? 'E' : dc < 0 ? 'W' : '';
    return dy + dx || '(' + dr + ',' + dc + ')';
  }
  function troopMoveText(d) {
    const parts = [];
    if (d.leap && d.leap.length) parts.push('Leaps: ' + d.leap.map(o => dirName(o[0], o[1])).join(' / '));
    if (d.slide && d.slide.length) parts.push('Slides: ' + d.slide.map(s => {
      const max = s.length > 2 && s[2] ? s[2] : Infinity;
      return dirName(s[0], s[1]) + (isFinite(max) ? ' ×' + max : ' any distance');
    }).join(' / '));
    const tr = [];
    if (d.recruit != null) tr.push('slow to summon');
    if (d.regen) tr.push('regenerates (cleanses poison/frost)');
    if (d.aura) tr.push('aura: ' + d.aura + 's an adjacent foe each own turn');
    if (d.onDeath === 'split') tr.push('splits into 2 pawns when slain');
    if (d.onDeath === 'burst') tr.push('explodes when slain');
    if (d.counter) {
      const eff = d.counter === true ? 'destroys its capturer' : d.counter === 'poison' ? 'poisons its capturer' : d.counter === 'freeze' ? 'freezes its capturer' : d.counter === 'doom' ? 'dooms its capturer' : 'counterattacks its capturer';
      tr.push('counter: ' + eff + ' when captured (kings safe)');
    }
    if (d.artillery) tr.push('artillery: fires on a ranged foe every ~' + ((d.artillery.cd || 1)) + ' own turn(s)');
    if (d.hero) tr.push('LEGENDARY HERO — a unique banner trick (see the card that summons it)');
    if (d.sworn) {
      const fac = d.sworn === 'shu' ? 'Shu' : d.sworn === 'wei' ? 'Wei' : d.sworn === 'wu' ? 'Wu' : d.sworn;
      tr.push('sworn ' + fac + ': while adjacent to a same-faction ally at your turn\'s end, cleanses poison/frost and gains a shield');
    }
    if (d.hatch) tr.push('arrives as an egg, hatches into ' + (MD.pieceName ? MD.pieceName(d.hatch.type) : d.hatch.type));
    if (d.growTo) tr.push('grows into ' + (MD.pieceName ? MD.pieceName(d.growTo) : d.growTo));
    if (tr.length) parts.push('Traits: ' + tr.join(', '));
    return parts.join(' · ') || 'a mysterious mover';
  }

  const PEDIA_STATUS = [
    ['Frozen (f)', 'Cannot move. The countdown passes only at the end of its OWN turns.', 'ice'],
    ['Shielded (s)', 'Cannot be captured by normal captures for a number of the enemy\'s turns.', 'shield'],
    ['Poisoned (p)', 'Succumbs quietly at the end of its own next turn — it rots away (no blast). Kings shrug off venom.', 'skull'],
    ['Summon-sickness (z)', 'Newly summoned pieces cannot move until they have survived one of their owner\'s turns.', 'clock'],
    ['Petrified (st)', 'Sealed in stone: cannot move AND cannot be captured. Erodes at the end of its own turns.', 'lock'],
    ['Doomed (doom)', 'Marked for death — destroyed quietly at the end of its own next turn.', 'target'],
    ['Frail (frail)', 'Shields do not protect it — it can be captured even while shielded.', 'sword'],
    ['Veiled (v)', 'Hidden in living mist: only an ADJACENT enemy can capture it (spells still find it).', 'wind'],
    ['Regenerate (trait)', 'A troop that cleanses its own poison and frost at the end of its owner\'s turn.', 'heart'],
    ['Aura (trait)', 'At the end of its owner\'s turn, freezes or poisons a random adjacent foe.', 'spark'],
    ['Counter (trait)', 'Punishes the piece that CAPTURES it — destroying, poisoning, freezing or dooming the attacker (kings stay safe).', 'sword'],
    ['Artillery (trait)', 'Auto-fires a ranged shell at a distant enemy every few of its own turns — line-of-sight and cooldown depend on the troop.', 'fire'],
    ['Sworn Oath (trait)', 'Three Kingdoms heroes (义) — a Shu/Wei/Wu hero standing next to a same-faction ally at the end of your turn is cleansed of poison/frost and shielded. Brothers watch each other\'s backs.', 'heart'],
    ['Growth (mature)', 'An egg or juvenile that transforms into its adult troop after a few of its owner\'s turns.', 'star']
  ];
  const PEDIA_ZONES = [
    ['Fire zone', 'Burns a piece standing there at the end of its own turn: poison + strip shield.', 'fire'],
    ['Thorns zone', 'Wounds any piece ending its turn there — it becomes DOOMED.', 'leaf'],
    ['Mire zone', 'Clings: the piece ends its turn there gets frozen (stuck next turn).', 'drop'],
    ['Sanctum zone', 'Cleanses + shields your pieces; pushes or poisons enemy pieces off it.', 'shieldup'],
    ['Rift zone', 'Tears any piece ending its turn there to a random empty square.', 'void'],
    ['Fog zone', 'Passive mist: pieces inside are hidden (only adjacent enemies can capture them).', 'wind'],
    ['Wall / River (terrain)', 'Impassable and block sliding sight. Campaign maps and some boards use them.', 'void'],
    ['Hazard (hidden trap)', 'One-shot traps: poison · freeze · trap (destroy) · ward · ember — spring when stepped on.', 'target']
  ];

  function renderPedia(tab) {
    const tabs = $('#pediaTabs'), body = $('#pediaBody');
    clear(tabs); clear(body);
    const mk = (label, key, active) => {
      const b = document.createElement('button');
      b.className = 'chip' + (active ? ' selected' : '');
      b.textContent = label;
      b.addEventListener('click', () => renderPedia(key));
      return b;
    };
    [['pieces', 'Custom Pieces'], ['statuses', 'Statuses & Ground'], ['items', 'Items'], ['modes', 'Modes & Board']].forEach(([k, l]) => tabs.appendChild(mk(l, k, tab === k)));
    const app = el => body.appendChild(el);

    if (tab === 'pieces') {
      const T = MD.TROOPS || {};
      const keys = Object.keys(T).sort((a, b) => ((T[b].value || 0) - (T[a].value || 0)) || a.localeCompare(b));
      if (!keys.length) app(pediaCard('No custom troops', '', '', ''));
      keys.forEach(k => {
        const d = T[k];
        const glyph = (MD.troopGlyph && MD.iconHTML) ? MD.iconHTML(MD.troopGlyph(k)) : '';
        app(pediaCard(d.name || k, glyph, 'Type “' + k + '” · power ' + (d.value || 0) + (d.letter ? ' · ' + d.letter : ''), troopMoveText(d)));
      });
    } else if (tab === 'statuses') {
      app(pediaHeading('Piece statuses'));
      PEDIA_STATUS.forEach(s => app(pediaCard(s[0], MD.iconHTML(s[2]), '', s[1])));
      app(pediaHeading('Ground zones, terrain & traps'));
      PEDIA_ZONES.forEach(s => app(pediaCard(s[0], MD.iconHTML(s[2]), '', s[1])));
    } else if (tab === 'items') {
      const I = MD.ITEMS || [];
      app(pediaCard('Magic Items', MD.iconHTML('gem'), I.length + ' treasures in the item pool', 'Item drops (when ON) place a random treasure on an empty square each turn. Land ANY piece on it to claim it — both sides can grab them! If items are left unclaimed the next one waits 2^x turns (x = items on the field).'));
      const byKind = {};
      I.forEach(it => { (byKind[it.kind] = byKind[it.kind] || []).push(it); });
      Object.keys(byKind).sort().forEach(kind => {
        app(pediaHeading('kind: ' + kind + ' (' + byKind[kind].length + ')'));
        const row = document.createElement('div');
        row.className = 'pedia-tags';
        byKind[kind].forEach(it => {
          const s = document.createElement('span');
          s.className = 'pedia-tag';
          s.title = (it.flavor || '') + (it.rarity >= 3 ? '  (rare!)' : '');
          s.innerHTML = MD.iconHTML(it.icon) + ' ' + esc(it.name);
          row.appendChild(s);
        });
        body.appendChild(row);
      });
    } else {
      const M = [
        ['Spell modes', 'Classic: pick 1 of 3 spells per turn, then move. · Chaos: fate casts a random spell for you. · Draft: 4 spells, cast exactly 1. · Echo: your spell is copied into the opponent\'s hand next turn.'],
        ['Board sizes', '6×6 (rapid, no castling) · 8×8 (classic) · 10×10 · 12×12 grand boards. The campaign even grows its board as waves progress.'],
        ['Item drops', 'A toggle that scatters magic items onto empty squares — grab them for buffs, summons, enemy damage, or the occasional curse.'],
        ['Campaign', '“Siege of the Crystal Throne”: an endless roguelike where your army persists, the board grows, and every 5th wave is a boss siege. Waves are procedural after the opening ones, with host, raid and ambush encounters. Gold is scarce — spend it on boons.'],
        ['Custom troops', 'Standard pieces (pawns…king) plus 40+ custom troops — check the “Custom Pieces” tab for every one of them. See “Ability Codex” for all ' + (MD.ABILITIES ? MD.ABILITIES.length : 0) + ' spells.'],
        ['Statuses', 'Freeze, shield, poison, petrify, doom, frail, veil, summon-sickness — and persistent ground zones & hidden traps. See the “Statuses & Ground” tab.']
      ];
      M.forEach(([t, d]) => app(pediaCard(t, '', '', d)));
    }
  }
  UI.renderPedia = renderPedia;

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
    const clearDrag = () => {
      down = null; dragging = false;
      if (ghost) { ghost.remove(); ghost = null; }
    };
    const sqPx = () => {
      // .dragpiece lives on <body> where the board's --sq is NOT inherited;
      // read it explicitly so a ghost is always exactly one square big.
      const cs = getComputedStyle(board);
      const v = parseFloat(cs.getPropertyValue('--sq'));
      return (v > 0 ? v : 60);
    };

    board.addEventListener('pointerdown', e => {
      if (MD.Game.phase === 'over') return;
      // right/middle clicks must never start a tap or drag (their native
      // context menu can swallow the pointerup and leave a stuck ghost)
      if (e.pointerType === 'mouse' && e.button !== 0) { clearDrag(); return; }
      if (e.target.closest('.hl, .coords, .piece-layer .fx-word')) { /* fine */ }
      const rc = toRc(e.clientX, e.clientY);
      if (rc.r === undefined) return;
      down = { x: e.clientX, y: e.clientY, rc };
      dragging = false;
    });

    // a right-click (native context menu) must not leave an in-flight drag behind
    board.addEventListener('contextmenu', e => { e.preventDefault(); clearDrag(); });

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
          const sz = sqPx();
          ghost.style.width = sz + 'px';
          ghost.style.height = sz + 'px';
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

    // safety nets: cancel/abandoned gestures & window blur must release a stuck ghost
    window.addEventListener('pointercancel', clearDrag);
    window.addEventListener('blur', clearDrag);
    window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button !== 0) clearDrag(); });
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
        [1, 2, 3, 4, 5].forEach(r => f.appendChild(mk('★'.repeat(r), r, true, state.rar === r)));
      };
      rebuild();
      UI.openModal('codexModal');
    });
    $('#btnPedia').addEventListener('click', () => { UI.renderPedia('pieces'); UI.openModal('pediaModal'); });

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

  function setSizeRow() {
    const s = (MD.Settings.size | 0) >= 4 ? MD.Settings.size | 0 : 8;
    document.querySelectorAll('#sizeRow .chip').forEach(c => c.classList.toggle('selected', (+c.dataset.size) === s));
  }
  UI.setSizeRow = setSizeRow;

  function setItemRow() {
    const on = MD.Settings.items ? 1 : 0;
    document.querySelectorAll('#itemRow .chip').forEach(c => c.classList.toggle('selected', (+c.dataset.items) === on));
  }
  UI.setItemRow = setItemRow;

  function wireMenu() {
    document.querySelectorAll('.mode-card').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(x => x.classList.toggle('selected', x === b));
        const isBot = b.dataset.mode === 'bot';
        const isCamp = b.dataset.mode === 'campaign';
        $('#diffRow').style.display = isBot ? '' : 'none';
        $('#colorRow').style.display = isBot ? '' : 'none';
        $('#smodeRow').style.display = isCamp ? 'none' : '';
        $('#sizeRow').style.display = isCamp ? 'none' : '';
        $('#itemRow').style.display = isCamp ? 'none' : '';
      });
    });
    document.querySelectorAll('#itemRow .chip').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('#itemRow .chip').forEach(x => x.classList.toggle('selected', x === c));
        MD.Settings.items = (+c.dataset.items) === 1;
        MD.Settings.save();
      });
    });
    document.querySelectorAll('#sizeRow .chip').forEach(c => {
      c.addEventListener('click', () => {
        document.querySelectorAll('#sizeRow .chip').forEach(x => x.classList.toggle('selected', x === c));
        MD.Settings.size = +c.dataset.size;
        MD.Settings.save();
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
      const mode = sel ? sel.dataset.mode : 'bot';
      if (mode === 'campaign') {
        if (MD.Campaign && MD.Campaign.start) { MD.Campaign.start(); return; }
      }
      const isBot = mode === 'bot';
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

/* ============================================================
   Mod Chess — Profile, Match History & Game Analysis (meta)
   Loaded AFTER main.js. Records every action (moves + spells)
   as compact board snapshots, saves finished matches locally,
   and replays them in an analysis board.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  if (!MD || !MD.Game || !MD.UI) return;
  const Game = MD.Game, UI = MD.UI, E = MD.Engine;

  /* ---------- compact piece type <-> code ---------- */
  const up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const t2c = {}, c2t = {};
  ['p', 'n', 'b', 'r', 'q', 'k'].forEach(t => { t2c[t] = t; c2t[t] = t; });
  let ui = 0;
  (MD.TROOP_KEYS || []).forEach(k => { if (t2c[k] === undefined) { const code = up[ui++]; t2c[k] = code; c2t[code] = k; } });
  const codeOf = t => t2c[t] || 'p';
  const typeOf = c => c2t[c] || 'p';

  function encodeBoard(board) {
    let s = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      s += cell ? codeOf(cell.t) + cell.c : '00';
    }
    return s;
  }
  function decodeBoard(str) {
    const b = [];
    for (let r = 0; r < 8; r++) {
      b.push([]);
      for (let c = 0; c < 8; c++) {
        const a = str[(r * 8 + c) * 2], d = str[(r * 8 + c) * 2 + 1];
        b[r].push((a === '0') ? null : { c: d, t: typeOf(a) });
      }
    }
    return b;
  }
  const captCodes = list => (list || []).map(p => codeOf(p.t));

  function snap(g) {
    return {
      b: encodeBoard(g.board), t: g.turn,
      lm: g.lastMove ? [g.lastMove.from.r, g.lastMove.from.c, g.lastMove.to.r, g.lastMove.to.c] : null,
      capt: { w: captCodes(g.capt.w), b: captCodes(g.capt.b) }
    };
  }

  /* ---------- recorder ---------- */
  const Meta = { cur: null };
  MD.Meta = Meta;

  Meta.begin = function (mode, diff, color) {
    Meta.cur = { id: Date.now(), mode: !!mode ? 'bot' : 'local', diff: diff || 2, color: color || 'w', at: new Date().toISOString(), steps: [], done: false };
    Meta.rec('s', 'Opening position');
  };
  Meta.rec = function (kind, label) {
    const cur = Meta.cur;
    if (!cur || !MD.Game.g || cur.done) return;
    const s = snap(MD.Game.g);
    s.kind = kind; s.label = label;
    cur.steps.push(s);
  };
  Meta.stepMove = function () {
    const g = MD.Game.g; if (!g) return;
    const n = (g.hist || []).filter(h => h.color === 'w').length;
    const san = (g.lastMove && g.lastMove.san) || '';
    Meta.rec('m', n + '. ' + san);
  };
  Meta.stepCast = function (ab) {
    const g = MD.Game.g;
    const lines = (g.lastCast && g.lastCast.lines) || [];
    Meta.rec('c', ((ab && ab.name) || 'Spell') + (lines[0] ? ' — ' + String(lines[0]).slice(0, 70) : ''));
  };
  Meta.end = function (end) {
    const cur = Meta.cur;
    if (!cur || cur.done) return;
    cur.done = true;
    const g = MD.Game.g;
    if (g) {
      const last = cur.steps[cur.steps.length - 1];
      const s = snap(g);
      s.kind = 'e'; s.label = 'Result — ' + (end.reason || 'Game over');
      if (!last || last.b !== s.b) cur.steps.push(s);
    }
    // build a history record
    const rec = {
      id: cur.id, at: cur.at, mode: cur.mode, diff: cur.diff, color: cur.color,
      result: end.winner === null ? 'draw' : end.winner,
      reason: end.reason || '', steps: cur.steps
    };
    const P = MD.Profile || {};
    if (cur.mode === 'bot') {
      const humanWin = end.winner === null ? 0.5 : (end.winner === cur.color ? 1 : 0);
      const opp = { 1: 1000, 2: 1200, 3: 1400 }[cur.diff] || 1200;
      const K = 24;
      const exp = 1 / (1 + Math.pow(10, (opp - P.elo) / 400));
      const delta = Math.round(K * (humanWin - exp));
      P.elo = Math.max(100, Math.round((P.elo || 1200) + delta));
      P.games = (P.games || 0) + 1;
      if (humanWin === 1) P.wins = (P.wins || 0) + 1; else if (humanWin === 0.5) P.draws = (P.draws || 0) + 1; else P.losses = (P.losses || 0) + 1;
      if (P.save) P.save();
      if (UI.toast) UI.toast('Rating ' + (delta >= 0 ? '+' : '') + delta + ' → ' + P.elo, 'sys');
    }
    Meta.saveHistory(rec);
  };

  /* ---------- history (localStorage) ---------- */
  const KEY = 'modchess.history';
  Meta.list = function () {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  };
  Meta.saveHistory = function (rec) {
    const list = Meta.list();
    list.unshift(rec);
    // keep size sane
    while (list.length > 8) list.pop();
    // also hard cap by rough size
    let json = JSON.stringify(list);
    while (json.length > 3000000 && list.length > 1) { list.pop(); json = JSON.stringify(list); }
    try { localStorage.setItem(KEY, json); } catch (e) {
      // drop oldest until it fits
      while (list.length > 1) { list.pop(); try { localStorage.setItem(KEY, JSON.stringify(list)); break; } catch (e2) {} }
    }
  };
  Meta.remove = function (id) {
    const list = Meta.list().filter(r => r.id !== id);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  };
  Meta.get = id => Meta.list().find(r => r.id === id);

  /* ---------- hooks into the game flow ---------- */
  const _start = Game.start;
  Game.start = function (mode, diff, color) {
    const r = _start.apply(this, arguments);
    Meta.begin(mode, diff, color);
    return r;
  };
  const _apply = Game.applyMove;
  Game.applyMove = function (move) {
    const r = _apply.apply(this, arguments);
    Meta.stepMove();
    return r;
  };
  const _cast = Game.castAbility;
  Game.castAbility = function (ab, sq) {
    const r = _cast.apply(this, arguments);
    Meta.stepCast(ab);
    return r;
  };
  const _finish = Game.finish;
  Game.finish = function (end) {
    const r = _finish.apply(this, arguments);
    Meta.end(end);
    return r;
  };

  /* ---------- analysis board rendering ---------- */
  const SIZE = 8;
  function buildAnBoard() {
    const wrap = document.getElementById('anBoard');
    if (!wrap) return;
    clearNode(wrap);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const d = document.createElement('div');
      d.className = 'an-sq ' + ((r + c) % 2 ? 'dark' : 'light');
      d.style.left = (c * 12.5) + '%'; d.style.top = (r * 12.5) + '%';
      wrap.appendChild(d);
    }
  }
  function clearNode(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function drawAnBoard(boardStr, lm) {
    const wrap = document.getElementById('anBoard');
    if (!wrap) return;
    // remove piece + highlight layers but keep squares
    [...wrap.querySelectorAll('.an-p, .an-hl')].forEach(n => n.remove());
    const board = decodeBoard(boardStr);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      const p = document.createElement('div');
      p.className = 'an-p';
      p.style.left = (c * 12.5) + '%'; p.style.top = (r * 12.5) + '%';
      p.appendChild(MD.pieceNode(cell.c, cell.t));
      wrap.appendChild(p);
    }
    if (lm) {
      for (const [r, c] of [[lm[0], lm[1]], [lm[2], lm[3]]]) {
        const h = document.createElement('div');
        h.className = 'an-hl';
        h.style.left = (c * 12.5) + '%'; h.style.top = (r * 12.5) + '%';
        wrap.appendChild(h);
      }
    }
  }
  function drawAnTrays(capt) {
    const el = document.getElementById('anTrays');
    if (!el) return;
    clearNode(el);
    const val = t => E.val(t);
    const mkRow = (side, label) => {
      const row = document.createElement('div');
      row.className = 'at-row';
      const lab = document.createElement('span');
      lab.textContent = label + ':';
      row.appendChild(lab);
      const list = (capt[side] || []).map(typeOf).sort((a, b) => val(b) - val(a));
      if (!list.length) row.appendChild(document.createTextNode(' —'));
      list.forEach(t => row.appendChild(MD.pieceNode(side === 'w' ? 'b' : 'w', t)));
      // material edge
      const mat = (capt[side] || []).reduce((s, c) => s + val(typeOf(c)), 0) - (capt[side === 'w' ? 'b' : 'w'] || []).reduce((s, c) => s + val(typeOf(c)), 0);
      if (mat > 0) {
        const adv = document.createElement('span');
        adv.className = 'cap-advantage';
        adv.textContent = '+' + Math.round(mat / 100);
        row.appendChild(adv);
      }
      el.appendChild(row);
    };
    mkRow('w', 'White took');
    mkRow('b', 'Black took');
  }

  /* ---------- profile + history UI ---------- */
  function openProfile() {
    const P = MD.Profile || {};
    const inp = document.getElementById('pfName');
    if (inp) inp.value = P.name || '';
    const elo = document.getElementById('pfElo');
    if (elo) elo.textContent = P.elo || 1200;
    const st = document.getElementById('pfStatus');
    if (st) st.textContent = (P.games || 0) + ' games · ' + (P.wins || 0) + 'W / ' + (P.losses || 0) + 'L / ' + (P.draws || 0) + 'D';
    UI.openModal('profileModal');
  }
  Meta.openProfile = openProfile;

  function openHistory() {
    const list = Meta.list();
    const box = document.getElementById('historyList');
    if (!box) return;
    clearNode(box);
    if (!list.length) {
      box.innerHTML = '<div class="hist-empty">No matches yet. Finish a game and it will appear here for review.</div>';
    } else {
      list.forEach(r => {
        const row = document.createElement('div');
        row.className = 'hist-item';
        const who = (r.color === 'w' ? 'You (White)' : 'You (Black)') + ' vs ' + (r.mode === 'bot' ? 'Computer' : 'Local');
        const resClass = r.result === 'draw' ? 'draw' : (r.mode === 'bot' ? ((r.result === r.color) ? 'win' : 'lose') : (r.result ? 'win' : 'lose'));
        const resTxt = r.result === 'draw' ? 'Draw' : (r.result === 'w' ? 'White wins' : 'Black wins');
        const date = new Date(r.at).toLocaleString();
        const main = document.createElement('div');
        main.className = 'h-main';
        main.innerHTML = '<div class="h-title"><span class="' + resClass + '">' + resTxt + '</span></div>' +
          '<div class="h-sub">' + who + ' · ' + (r.steps ? r.steps.length : 0) + ' steps · ' + date + (r.reason ? ' · ' + r.reason : '') + '</div>';
        row.appendChild(main);
        const an = document.createElement('button');
        an.className = 'btn-small primary'; an.textContent = 'Analyse';
        an.addEventListener('click', () => Meta.analyze(r.id));
        const del = document.createElement('button');
        del.className = 'btn-small'; del.textContent = '✕';
        del.addEventListener('click', () => { Meta.remove(r.id); openHistory(); });
        row.appendChild(an); row.appendChild(del);
        box.appendChild(row);
      });
    }
    UI.openModal('historyModal');
  }
  Meta.openHistory = openHistory;

  /* ---------- analysis viewer ---------- */
  let anId = null, anSteps = [], anIdx = 0, anTimer = null;
  Meta.analyze = function (id) {
    UI.closeModal('historyModal');
    const rec = Meta.get(id);
    if (!rec) { UI.toast('Match not found.', 'bad'); return; }
    anId = id; anSteps = rec.steps || []; anIdx = 0;
    buildAnBoard();
    renderMoves();
    anGo(0);
    UI.openModal('analysisModal');
  };
  function renderMoves() {
    const el = document.getElementById('anMoves');
    if (!el) return;
    clearNode(el);
    anSteps.forEach((s, i) => {
      const m = document.createElement('span');
      m.className = 'an-move' + (s.kind === 'c' ? ' ability' : '') + (i === anIdx ? ' cur' : '');
      m.textContent = s.label;
      m.title = s.label;
      m.addEventListener('click', () => anGo(i));
      el.appendChild(m);
    });
    el.scrollTop = el.scrollHeight;
  }
  function anGo(i) {
    anIdx = Math.max(0, Math.min(anSteps.length - 1, i));
    const s = anSteps[anIdx];
    drawAnBoard(s.b, s.lm);
    drawAnTrays(s.capt);
    const cap = document.getElementById('anCaption');
    if (cap) cap.textContent = (anIdx === 0 ? '' : '#' + anIdx + '  ') + s.label;
    renderMoves();
  }
  Meta.anGo = anGo;
  Meta.anNext = () => anGo(anIdx + 1);
  Meta.anPrev = () => anGo(anIdx - 1);
  Meta.anEnd = () => anGo(anSteps.length - 1);
  Meta.anPlay = () => {
    if (anTimer) { clearInterval(anTimer); anTimer = null; }
    else anTimer = setInterval(() => { if (anIdx >= anSteps.length - 1) { clearInterval(anTimer); anTimer = null; } else anGo(anIdx + 1); }, 750);
  };

  /* ---------- wire buttons ---------- */
  function wire() {
    const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); };
    on('btnProfile', openProfile);
    on('btnHistory', openHistory);
    on('btnProfileSave', () => {
      const inp = document.getElementById('pfName');
      if (inp) { MD.Profile.name = inp.value.trim().slice(0, 18); MD.Profile.save(); }
      openProfile();
      if (UI.render && MD.Game.g) UI.render();
      if (UI.toast) UI.toast('Profile saved.', 'sys');
    });
    on('btnOnline', () => {
      if (MD.Online && MD.Online.open) MD.Online.open();
      else if (UI.toast) UI.toast('Online play is not configured yet — see the README.', 'sys');
    });
    on('anPrev', () => Meta.anPrev());
    on('anNext', () => Meta.anNext());
    on('anEnd', () => Meta.anEnd());
    on('anPlay', () => Meta.anPlay());
    // closing analysis stops autoplay
    const close = document.querySelector('#analysisModal .modal-close');
    if (close) close.addEventListener('click', () => { if (anTimer) { clearInterval(anTimer); anTimer = null; } });
  }
  if (document.readyState !== 'loading') wire(); else document.addEventListener('DOMContentLoaded', wire);
})();

/* ============================================================
   Mod Chess — vector ICON system (no emojis anywhere)
   Every icon is inline SVG. Ability icons resolve to one of the
   line icons; troops get custom filled glyphs.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD || (root.MD = {});

  const LINE = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const B = {};   // body store: key -> svg inner markup

  /* ---------- tiny path/primitive helpers ---------- */
  const p = d => `<path d="${d}"/>`;
  const ci = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const rct = (x, y, w, h, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx || 0}"/>`;

  /* ==================== UI + CATEGORY icons (line style) ==================== */
  const addLine = (key, shapes) => { B[key] = `<g ${LINE}>${shapes}</g>`; };

  addLine('sound', p('M3 10v4h4l5 5V5L7 10H3z') + p('M16.5 8.5a5 5 0 0 1 0 7') + p('M19 6a9 9 0 0 1 0 12'));
  addLine('mute', p('M3 10v4h4l5 5V5L7 10H3z') + p('M16 9l6 6M22 9l-6 6'));
  addLine('flip', p('M4 7h13a4 4 0 0 1 0 8H8') + p('M7 4 4 7l3 3') + p('M17 20l3-3-3-3') + p('M20 17H7a4 4 0 0 1 0-8h9'));
  addLine('gear', ci(12, 12, 3.4) + p('M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1'));
  addLine('close', p('M6 6l12 12M18 6 6 18'));
  addLine('robot', rct(5, 8, 14, 10, 2) + ci(12, 4, 1.6) + p('M12 6V4') + ci(9, 13, 1.2) + ci(15, 13, 1.2) + ln(12, 15, 12, 17));
  addLine('users', ci(9, 8, 3.2) + p('M3.5 19a5.5 5.5 0 0 1 11 0') + ci(17, 9, 2.6) + p('M15.5 13.6A5 5 0 0 1 20.5 19'));
  addLine('trophy', p('M7 4h10v5a5 5 0 0 1-10 0V4z') + p('M7 6H4a0 0 0 0 0 0 3a3 3 0 0 0 3 3') + p('M17 6h3a0 0 0 0 1 0 3a3 3 0 0 1-3 3') + p('M12 14v4M8 21h8M10 21v-3M14 21v-3'));
  addLine('skull', p('M12 3a8 8 0 0 0-6.4 12.7c.8 1 .4 1.9.5 2.6.1.7.5 1.3 1 1.7h9.8c.5-.4.9-1 1-1.7.1-.7-.3-1.6.5-2.6A8 8 0 0 0 12 3z') + ci(9, 10.5, 1.2) + ci(15, 10.5, 1.2) + p('M10.5 16.5h3M12 16.5V18.5'));
  addLine('handshake', p('M2 15l3-3 3 2 4-6 3 1-2 4 3-1 2 2 4-3') + p('M5 8l2-2M7 8l3-3 5 1'));
  addLine('home', p('M4 11 12 4l8 7') + p('M6 10v9h12v-9'));
  addLine('sword', p('M15 4h5v5L8 21l-5-5L15 4z') + p('M18 6l-4 4M14 10 3 21'));
  addLine('hex', p('M12 2 20 6v12l-8 4-8-4V6l8-4z') + ci(12, 12, 2.4));
  addLine('shield', p('M12 2 5 5v6c0 4.6 3 8 7 11 4-3 7-6.4 7-11V5l-7-3z'));
  addLine('shieldup', p('M12 2 5 5v6c0 4.6 3 8 7 11 4-3 7-6.4 7-11V5l-7-3z') + p('M12 8v6M9 11l3-3 3 3'));
  addLine('portal', ci(12, 12, 8) + ci(12, 12, 4.4) + p('M12 2v3M12 19v3M2 12h3M19 12h3') + p('M9 7l3 5 3-5'));
  addLine('rune', p('M12 3v18M3 12h18') + p('M5 5l3 3M19 19l-3-3M19 5l-3 3M5 19l3-3'));
  addLine('chaos', p('M12 3a9 9 0 1 1-7 14') + ci(12, 12, 3) + p('M8 19l2-4M17 6l-1 4'));
  addLine('eye', p('M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z') + ci(12, 12, 2.6));
  addLine('clock', ci(12, 12, 8.5) + p('M12 7v5l3.5 2'));
  addLine('crown', p('M3 17h18M4 17 3 8l5 3 4-6 4 6 5-3-1 9') );
  addLine('coin', ci(12, 12, 8.5) + p('M12 7v10M12 7c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2'));
  addLine('dice', rct(4, 4, 16, 16, 3) + ci(8.5, 8.5, 1) + ci(15.5, 8.5, 1) + ci(8.5, 15.5, 1) + ci(15.5, 15.5, 1));
  addLine('fire', p('M12 3c1 3-3 5-3 8a3 3 0 0 0 6 0c0-1-.3-2-.8-3 .8 1 2.3 2 2.8 4 .5 2-1.5 4-5 4s-5.5-2.5-4.5-5.5C8 8 11 6 12 3z'));
  addLine('ice', p('M12 2v20M2 12h20') + ln(5, 5, 7, 7) + ln(19, 5, 17, 7) + ln(5, 19, 7, 17) + ln(19, 19, 17, 17));
  addLine('storm', p('M13 2 4 14h6l-1 8 9-12h-6l1-8z'));
  addLine('drop', p('M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'));
  addLine('leaf', p('M4 20C4 10 11 4 20 4c0 9-5 16-16 16z') + p('M4 20c3-5 7-9 11-11'));
  addLine('void', ci(12, 12, 6) + ci(12, 12, 2) + p('M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22'));
  addLine('spark', p('M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z') + p('M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z'));
  addLine('wind', p('M3 8h9a3 3 0 1 0-3-3') + p('M3 12h14a3 3 0 1 1-3 3') + p('M3 16h6a2.5 2.5 0 1 1-2.5 2.5'));
  addLine('swap', p('M4 6h12l-3-3M20 18H8l3 3') + p('M4 18V8M20 6v10'));
  addLine('shuffle', p('M3 7h4l10 10h4') + p('M3 17h4l2-2M17 7h4') + p('M12 7h2M3 12h7'));
  addLine('arrows', p('M12 3v18M3 12h18M6 6l6 6 6-6M6 18l6-6 6 6')); // crossed arrows
  addLine('star', p('M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z'));
  addLine('book', p('M5 3h14a1 1 0 0 1 1 1v16H5a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z') + p('M19 20v-1'));
  addLine('flag', p('M5 21V4M5 4c4-2.5 9 2.5 14 0v10c-5 2.5-10-2.5-14 0'));
  addLine('target', ci(12, 12, 8.5) + ci(12, 12, 5) + ci(12, 12, 1.6));
  addLine('heart', p('M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z'));
  addLine('gem', p('M7 4h10l4 5-9 11L3 9l4-5z') + p('M3 9h18M12 20 8 9l3-5M12 20l4-11-3-5'));
  addLine('key', ci(7, 17, 3.4) + p('M9.4 14.6 20 4M15 8l3 3'));
  addLine('lock', rct(6, 10, 12, 10, 2) + p('M8 10V7a4 4 0 0 1 8 0v3') + ci(12, 15, 1.5));
  addLine('hourglass', p('M7 3h10M7 21h10M7 3c0 4 2.2 6.5 5 9 2.8-2.5 5-5 5-9M7 21c0-4 2.2-6.5 5-9 2.8 2.5 5 5 5 9'));
  addLine('scale', p('M12 3v18M8 21h8M12 6l-5 6M12 6l5 6') + p('M4 6l3 3 3-3M17 6l3 3')); // rough
  addLine('bone', p('M7 8a2.6 2.6 0 1 0-2.6 4.4A2.6 2.6 0 1 0 9.4 15M14 17a2.6 2.6 0 1 0 2.6-4.4A2.6 2.6 0 1 0 11.6 9')); // figure eight-ish
  addLine('boltring', ci(12, 12, 8) + p('M12 7v5l3 2'));
  addLine('net', p('M12 3 3 12l9 9 9-9-9-9z') + ln(3, 12, 21, 12) + ln(12, 3, 12, 21));
  addLine('check', p('M5 13l4 4L19 7'));
  addLine('play', p('M7 4l13 8-13 8V4z'));
  addLine('paw', p('M8 7a2.4 2.4 0 1 0 .2-4.8A2.4 2.4 0 0 0 8 7zM15.8 7a2.4 2.4 0 1 1 .2-4.8A2.4 2.4 0 0 1 15.8 7zM12 6a2.4 2.4 0 1 0 .2-4.8A2.4 2.4 0 0 0 12 6z') + p('M5 13a7 7 0 0 0 14 0c0-2-1-3-2-3.6-1.4-.8-3.4.2-5 .2s-3.6-1-5-.2C6 10 5 11 5 13z'));

  /* ==================== CUSTOM TROOP glyphs (filled) ==================== */
  const F = shapes => `<g fill="currentColor">${shapes}</g>`;
  // Head-and-neck style glyphs drawn in a ~24 box
  const TROOP = {
    imp: F(`<path d="M9 20l1.2-7a2.6 2.6 0 0 1 3.6 0L15 20c-1 .8-2 .8-3 .8s-2 0-3-.8z"/>` +
      `<circle cx="9.6" cy="11.5" r="1.1"/><circle cx="14.4" cy="11.5" r="1.1"/>` +
      `<path d="M6.5 9.5 4 6l3.6 1M17.5 9.5 20 6l-3.6 1"/>`),
    warhorse: F(`<path d="M6 21l1.5-5L3 9l4 1 3.5-6h4L13 9h4l1 4-3 2-2.5 1.5L17 21l-5-1.5L7 21z"/>`),
    guardian: F(`<path d="M12 2 5 5v6c0 4.6 3 8 7 11 4-3 7-6.4 7-11V5l-7-3z"/><path d="M9 10l3 4 3-4"/>`),
    archmage: F(`<path d="M12 2 5 7v3l7-5 7 5V7l-7-5z"/><path d="M7 11v2l5 8 5-8v-2"/><circle cx="12" cy="4.4" r="1.2"/>`),
    phoenix: F(`<path d="M12 2c1.5 2.5-1 4.5-.5 6 .4 1.2 2 1.8 3.4 1.2C17 8.4 17 5 14.5 3.5 15.6 6 17.5 8.6 17.5 12c0 4.2-3.4 8-8.5 8C4 20 3 16 5 13.5 4 15 4.5 17.5 6 18.5c-2-1.5-3-4.5-1.6-7.5L3 13l.5-4c1.8-1.8 4.5-3 7-5l1.5-2z"/>`),
    goblin: F(`<circle cx="12" cy="13" r="6"/><path d="M5 8 2 5.5c1.6 1 3.4 1.6 5 1.7M19 8l3-2.5c-1.6 1-3.4 1.6-5 1.7"/><circle cx="10" cy="13" r="1"/><circle cx="14" cy="13" r="1"/><path d="M10.5 16.6c1 .6 2 .6 3 0"/>`),
    ranger: F(`<path d="M20 5 13 12l-2-2 7-7 2 2z"/><path d="M13 12 6 5H3l9 8 1-1z"/><path d="M10.5 14.5 4 21h4l4.5-4.5"/>`),
    dwarf: F(`<circle cx="12" cy="11" r="5.5"/><path d="M6.5 11c-.6-2 .4-4.5 2.8-5.6l-3-3.4c1.6.4 2.8 1.5 3.6 2.8M17.5 11c.6-2-.4-4.5-2.8-5.6l3-3.4c-1.6.4-2.8 1.5-3.6 2.8"/><path d="M8.5 15.5 6 21h12l-2.5-5.5a6 6 0 0 1-7 0z"/>`),
    harpy: F(`<path d="M12 22c0-6 2-9 5-12l-2-1c-1 3-3 4.5-6 5-1.6.4-2.4.6-3.5 2L5 14c2-1 4-1 6-.4C9 16.5 8.5 19.5 9 22"/>`),
    golem: F(`<path d="M12 2c-3 2-4 6-2 9l-3 1 2 2-2 2 4 1 1 4 1-4 4-1-2-2 2-2-3-1c2-3 1-7-2-9z"/>`),
    sphinx: F(`<path d="M4 20l1-6L2 9l4 1 3-6h6l3 6 4-1-3 5 1 6h-5l-1-3h-4l-1 3H4z"/><circle cx="9" cy="12" r=".8"/><circle cx="15" cy="12" r=".8"/>`),
    lich: F(`<path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.8V21h-8v-6.2A7 7 0 0 1 12 2z"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/><path d="M12 14.5 10 17h4l-2-2.5"/>`),
    treant: F(`<path d="M12 3l2 4 3-1-1.5 4H22v3h-4l2 3-5 1-1 6h-4l-1-6-5-1 2-3H2v-3h6.5L7 6l3 1 2-4z"/>`),
    griffon: F(`<path d="M14 3l-2 2 2 2-4 3H7l-1 3-2-1v4h3l2 3h9l1-6 3-2-3-4-2 1-3-5z"/><path d="M9 12c1 3 3 5 7 5"/>`),
    manticore: F(`<path d="M3 20l1-5-3-3 5 1 3-7h6l2 7 5-1-3 3 1 5h-5l-1-4h-3l-1 4H3z"/><path d="M21 4c-3 0-5 2-5 4l2 1 3-5z"/>`),
    vampire: F(`<path d="M12 3 6 7l1 5-3 4 4 1 1 4 3-6 3 6 1-4 4-1-3-4 1-5-6-4z"/><path d="M10 8h4"/>`),
    basilisk: F(`<path d="M3 21 12 3l4 5-3 2 4 4 2-6 2 1-1 5c-1 1-2 1.5-3 2L12 19l-1 2H3z"/><circle cx="7.5" cy="15.5" r="1.2"/><path d="M6 14l2 2"/>`),
    djinn: F(`<path d="M12 2 9 5l2 2-4 5-2-2-3 5 5 3 2 4h10l1-7 4-2-3-5-2 2-4-4 2-2-3-4z"/><circle cx="11.6" cy="12.4" r="1.4"/>`),
    owlbear: F(`<circle cx="12" cy="12" r="6.5"/><circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="7" r="2.2"/><circle cx="10.2" cy="12" r="1"/><circle cx="13.8" cy="12" r="1"/><path d="M12 12l-.2 4M12 16l-2 5M12 16l2 5"/>`),
    banshee: F(`<path d="M12 3a6.5 6.5 0 0 1 6.5 6.5c0 3-1.5 5-1.5 7.5H7c0-2.5-1.5-4.5-1.5-7.5A6.5 6.5 0 0 1 12 3z"/><path d="M8 17v5h8v-5"/><circle cx="9.6" cy="12" r=".9"/><circle cx="14.4" cy="12" r=".9"/><path d="M12 15v2"/>`),
    hydra: F(`<circle cx="5" cy="9" r="3.2"/><circle cx="12" cy="6" r="3.2"/><circle cx="19" cy="9" r="3.2"/><path d="M5 12v9M12 9v12M19 12v9M5 9l3 6M19 9l-3 6M12 6l-3 9M12 6l3 9"/><path d="M8 21h8M10 21l-.5 2M14 21l.5 2"/>`),
    tiger: F(`<circle cx="12" cy="13" r="7"/><path d="M6 6 3 3c1.6 1 3.4 2 5 2.5M18 6l3-3c-1.6 1-3.4 2-5 2.5"/><circle cx="12" cy="13" r="2.4"/><path d="M12 13l1-1M12 13l-1-1M13.4 11.6l1 1M10.6 11.6l-1 1"/><path d="M9.5 16c1.6 1.2 3.4 1.2 5 0"/>`),
    unicorn: F(`<path d="M10 3l2 2-3 5H5l-2 4 4 1 1 6h8l1-7 2-2-4-3 1-3-4-1-2-2z"/><path d="M13 3l4-1-1 4"/>`),
    turtle: F(`<path d="M6 3 4 7l3 2-2 2 4 1-1 3 2 1 1 5 2-5 1-1 2 1-1-3 4-1-2-2 3-2-2-4 4-2-2-3-3 3-1-1-1 1-2-3-3 3z"/>`),
    reaper: F(`<path d="M12 3 9 7l5 5 4-1-6-8z"/><path d="M13 8 9 12l-2-1v2l4 3h7l1-6-3-1-1 2-4-3z"/><path d="M9 12v3M9 21l1-4M15 21l-1-4"/>`),
    hydraling: F(`<circle cx="8" cy="13" r="2.4"/><circle cx="16" cy="13" r="2.4"/><path d="M8 15.4v6M16 15.4v6M8 13l3 4M16 13l-3 4"/><circle cx="8" cy="13" r="1"/><circle cx="16" cy="13" r="1"/>`),
    phoenixegg: F(`<path d="M12 4c3 2 4.5 5 4.5 8 0 3.6-2 8-4.5 8s-4.5-4.4-4.5-8C7.5 9 9 6 12 4z"/><path d="M12 8c1 1.4 1.4 2.8 1.4 4.6 0 2-1 4.4-1.4 4.4"/>`),
    spriggan: F(`<path d="M12 3 9 8l3-1 1 3-2 2 2 1-1 2-3-1 3 4 3-4-3 1 1-2 2-1-2-2 1-3 3 1-3-5z"/>`),
    gremlin: F(`<path d="M8 21l-1-7-3-2 3-2-1-5 4 2 1-4h2l1 4 4-2-1 5 3 2-3 2-1 7-4-2-4 2z"/><circle cx="10.5" cy="13" r="1"/><circle cx="13.5" cy="13" r="1"/>`),
    warden: F(`<path d="M12 2 6 5v6c0 4 2.6 7.2 6 9.6 3.4-2.4 6-5.6 6-9.6V5l-6-3z"/><path d="M12 7v8M12 12l-3-3M12 15l3-3"/>`),
    samurai: F(`<path d="M19 3 8 14l-2 5 5-2L22 6l-3-3z"/><path d="M12 12l-3 1-2 2M14 10l1 3-2 2"/><circle cx="6.5" cy="17.5" r="1.4"/>`),
    siren: F(`<path d="M12 3c2.6 2.4 4 5.2 4 8a4 4 0 0 1-8 0c0-2.8 1.4-5.6 4-8z"/><path d="M9 13c-2.5 2-4 4.4-4 7h14c0-2.6-1.5-5-4-7M10.5 18l1-2M13.5 18l-1-2"/><path d="M9 12c0 2 1.4 3 3 3"/>`)
  };

  // ======== build markup helpers ========
  function inner(key) { return B[key] || TROOP[key] || B.spark || ''; }
  function svgMarkup(key, cls, extra) {
    const size = extra || '';
    return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true"${size}>${inner(key)}</svg>`;
  }
  MD.iconHTML = key => svgMarkup(key, '');
  MD.iconEl = function (key, cls) {
    const d = document.createElement('span');
    d.className = 'iconwrap ' + (cls || '');
    d.innerHTML = svgMarkup(key, '');
    return d.firstChild;
  };
  MD.iconNames = () => Object.keys(B).concat(Object.keys(TROOP));

  // ======== troop icons ========
  MD.troopGlyph = type => (TROOP[type] ? type : 'paw');
  MD.TROOP_GLYPHS = TROOP;

  /* ============ ability icon resolution ============ */
  const CAT_DEFAULT = {
    Attack: 'sword', Curse: 'skull', Buff: 'shieldup', Summon: 'portal',
    Transform: 'rune', Chaos: 'chaos', Status: 'eye', Time: 'clock',
    Kingship: 'crown', Economy: 'coin', Luck: 'dice',
    Wild: 'leaf', Void: 'void', SciFi: 'boltring', Show: 'star', Myth: 'rune',
    Jujutsu: 'rune', Wuxia: 'sword', Ocean: 'drop', War: 'target'
  };
  const KEYWORD = [
    [/fire|flame|burn|dragon'?s?|inciner|meteor|ragnarok|cannon|sunburst/i, 'fire'],
    [/ice|frost|freeze|snow|blizzard|chill|polar|winter|crystal|frozen|glacial/i, 'ice'],
    [/bolt|lightning|storm|thunder|volt|warp|smite|wither/i, 'storm'],
    [/poison|venom|plague|rot|tox|fume|wraith/i, 'skull'],
    [/shield|ward|aegis|protect|guard|fortress|sanctuary|armor|stoneskin|bulwark/i, 'shield'],
    [/summon|conjure|call |rises|materialize|reinforce|summon/i, 'portal'],
    [/swap|exchange|switch|trade|convert|swap|steal|pilfer|defect|possess|betray|mind/i, 'swap'],
    [/teleport|blink|warp|scatter|shuffle|mirror|flip|chaos|rearrange|banish|displace|relocat/i, 'chaos'],
    [/time|haste|slow|extra|again|warp|hour|second|retreat|flee|run/i, 'clock'],
    [/king|royal|crown|throne|regicide|monarch/i, 'crown'],
    [/resurrect|revive|rises|grave|corpse|return|ghost|damned|undying|echo/i, 'heart'],
    [/pawn/i, 'target'],
    [/queen|phoenix/i, 'gem'],
    [/knight|horse|steed|warhorse/i, 'bone'],
    [/rook|tower|guardian|keep/i, 'shield'],
    [/bishop|cleric|church|archmage|mage|wizard/i, 'spark'],
    [/water|wave|tide|rain|flood|sea|river|moat/i, 'drop'],
    [/leaf|nature|forest|tree|thorn|vine|bloom|petal|wood/i, 'leaf'],
    [/moon|night|dark|shadow|void|black|umbra|eclipse/i, 'void'],
    [/coin|gold|chest|tax|tithe|bounty|fortune/i, 'coin'],
    [/dice|luck|roll|random|wild|chaos orb|gambler|coin flip|fate/i, 'dice'],
    [/holy|divine|light|bless|heal|guardian angel/i, 'spark'],
    [/blood|bite|vampir|crimson/i, 'drop'],
    [/arrow|bow|archer|harpoon|sniper|bolt(?! lightning)|hunt/i, 'target']
  ];
  function troopKeyIn(name) {
    const T = MD.TROOPS || {};
    for (const k in T) { const t = T[k]; if (t && name.includes(t.name.toLowerCase())) return k; }
    return null;
  }

  MD.abilityIconKey = function (ab) {
    if (!ab) return 'spark';
    // troop summon spells show their creature glyph
    if (ab.troop) return ab.troop;
    const n = (ab.name || '').toLowerCase();
    const troopKey = troopKeyIn(n);
    if (troopKey) return troopKey;
    for (const [re, key] of KEYWORD) { if (re.test(n)) return key; }
    const d = (ab.desc || '').toLowerCase();
    for (const [re, key] of KEYWORD) { if (re.test(d)) return key; }
    return CAT_DEFAULT[ab.cat] || 'spark';
  };

  // register: remap emoji icon fields to vector icon keys
  MD.assignAbilityIcons = function (list) {
    list.forEach(a => { a.icon = MD.abilityIconKey(a); });
    return list;
  };

  MD.uiIcon = (() => {
    const m = { sound: 'sound', mute: 'mute', flip: 'flip', gear: 'gear', close: 'close', robot: 'robot', users: 'users', trophy: 'trophy', skull: 'skull', handshake: 'handshake', home: 'home' };
    return k => m[k] || k;
  })();
})();

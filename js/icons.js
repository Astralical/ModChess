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
  // evenodd lets a glyph punch visible holes (eyes, mouths, emblems) inside a
  // filled silhouette — without it every nested shape merges into a flat blob.
  const F = shapes => `<g fill="currentColor" fill-rule="evenodd">${shapes}</g>`;
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
    siren: F(`<path d="M12 3c2.6 2.4 4 5.2 4 8a4 4 0 0 1-8 0c0-2.8 1.4-5.6 4-8z"/><path d="M9 13c-2.5 2-4 4.4-4 7h14c0-2.6-1.5-5-4-7M10.5 18l1-2M13.5 18l-1-2"/><path d="M9 12c0 2 1.4 3 3 3"/>`),
    divinedog: F(`<circle cx="9" cy="13" r="4"/><circle cx="17" cy="13" r="4"/><path d="M6.5 14c-.5 2 1 4 2.5 4s2.4-1.5 0-3M15.5 14c.5 2-1 4-2.5 4s-2.4-1.5 0-3M9 11.5c1.2 1 2.8 1 4 0" />`),
    nue: F(`<path d="M12 3l-2 4h-3L4 5c1.5 2.4 1.2 5.4-1 7l2 2c1.5-1 2.4-2.4 2.6-4L7 10h2l-1 9 4-2 4 2-1-9h2l-.6 0c.2 1.6 1.1 3 2.6 4l2-2c-2.2-1.6-2.5-4.6-1-7l-3 2h-3l-2-4z"/>`),
    mahoraga: F(`<circle cx="12" cy="13" r="5.5"/><path d="M12 7.5V2M4 17l-3 4M20 17l3 4M5 8 1 6l3 5M19 8l3-2-3 5M12 7.5c-1.5 0-2.4 1-2.4 2.6 0 1 1 1.8 2.4 3 1.4-1.2 2.4-2 2.4-3 0-1.6-.9-2.6-2.4-2.6z"/>`),
    jianke: F(`<path d="M20 3 8 15l-1 6 6-1L23 8l-3-5z"/><path d="M12 12l-3-1-3 3 2 2 4-4z"/><path d="M7 18 3 22"/><circle cx="4.5" cy="21.5" r="1"/>`),
    qilin: F(`<path d="M5 21l1-7-3-2 4-2 3-6h6l1 5 4 1-2 3-3-1 1 8H5z"/><circle cx="9.5" cy="13.5" r=".9"/><path d="M13 7l3-5 2 4"/>`),
    yasha: F(`<path d="M12 3a9 9 0 0 1 9 9c0 4-3 8-9 8s-9-4-9-8a9 9 0 0 1 9-9z"/><path d="M6 5l1 6 3-3M18 5l-1 6-3-3M12 8l1 2-2 4 2 3 2-3-2-4 1-2M10.5 17h3"/>`),
    seaserpent: F(`<path d="M4 21c1-4 3-6 6-7l-3-4 4-2 3 6 3-8 3 2-2 7 2-1-1 3c-1 1-2 2-3 2H8c-1.6 0-2.6.4-3 2H4z"/>`),
    leviathan: F(`<path d="M3 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M12 4v14M12 4c-2.6 2.2-3 5-1 7M12 4c2.6 2.2 3 5 1 7"/><path d="M8 21l1 2M16 21l-1 2M12 21v1"/>`),
    coralqueen: F(`<path d="M12 2c2.4 2.6 3.6 5 3.6 8 0 3.4-1.8 7-3.6 9-1.8-2-3.6-5.6-3.6-9C8.4 7 9.6 4.6 12 2z"/><path d="M12 8c.8.8 1.1 1.8 1.1 3 0 1.2-.5 2.6-1.1 3.4-.6-.8-1.1-2.2-1.1-3.4 0-1.2.3-2.2 1.1-3z"/><path d="M8 15l-1 6 4-2 1 3 1-3 4 2-1-6"/>`),
    siegetank: F(`<path d="M3 20h12v-5H3v5z"/><path d="M5 15V9h2v3h2V7h2v2h3v6"/><path d="M6 20v3M12 20v3M8 5l4-3 4 3M8 5h8v4H8z"/>`),
    zeppelin: F(`<ellipse cx="12" cy="9" rx="8" ry="4.4"/><path d="M12 4.6V3M9 13.5l-1 6 4-1 4 1-1-6M12 13.4V18M12 9l3-4M12 9l-3-4"/><path d="M8 13.5h8"/>`),
    howitzer: F(`<path d="M3 20h6l1-3 4-1 1-4-4 2-1-2-2 1-1-3 3-1 2-3-3 1V4l-1 3-4 2v3H3l-1 5 2 3z"/>`),
    infantry: F(`<path d="M12 2l3 2 1 4-3 1 3 2-1 3-3-1-3 1-1-3 3-2-3-1 1-4 3-2z"/><path d="M12 12v6M10 18h4M9 21l1-3M15 21l-1-3"/>`)
  };
  /* ---- Every troop owns a DISTINCT glyph — no two units share art ----
     These used to alias a generic creature silhouette, which made whole sets
     (heroes, Three Kingdoms, the outbreak) impossible to tell apart. Each is
     now its own emblem/silhouette with punched-out eyes & details (evenodd).
     All vector, no emojis. */
  Object.assign(TROOP, {
    // --- counter / outbreak troops ---
    porcupine: F('<path d="M12 3.4l1.6 3.4h-3.2zM12 20.6l1.6-3.4h-3.2zM3.4 12l3.4 1.6v-3.2zM20.6 12l-3.4 1.6v-3.2zM5.6 5.6l3.6 1.6-2 2zM18.4 5.6l-3.6 1.6 2 2zM5.6 18.4l1.6-3.6 2 2zM18.4 18.4l-1.6-3.6-2 2z"/><circle cx="12" cy="12" r="5.4"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="12" cy="14" r="1.2"/>'),
    scorpion: F('<circle cx="12" cy="13.6" r="3.2"/><path d="M9.2 12.2 5.6 10l-2.6 1.8 2.2 1.6-2.6 1.2 2.2 1.8 3.4-1.2zM14.8 12.2 18.4 10l2.6 1.8-2.2 1.6 2.6 1.2-2.2 1.8-3.4-1.2z"/><circle cx="14.2" cy="11.4" r="1.2"/><circle cx="16" cy="9" r="1.1"/><circle cx="17.4" cy="6.4" r="1.1"/><path d="M18.2 5l2.6.8-2 1.8z"/><circle cx="12" cy="13.6" r="1"/>'),
    urchin: F('<circle cx="12" cy="12" r="4.8"/><path d="M12 7.2l.9-3.6.9 3.6zM12 16.8l.9 3.6.9-3.6zM7.2 12l-3.6.9 3.6.9zM16.8 12l3.6.9-3.6.9zM8.6 8.6 6.2 6.2l3.1.4zM15.4 8.6l2.4-2.4-3.1.4zM8.6 15.4l-2.4 2.4 3.1-.4zM15.4 15.4l2.4 2.4-3.1-.4z"/><circle cx="12" cy="12" r="1.4"/>'),
    plaguebearer: F('<path d="M13.4 3.6a5.4 5.4 0 0 1 2.4 10.2l-.4 7.6h-4.6l-.6-7.2a5.4 5.4 0 0 1 3.2-10.6z"/><path d="M11.4 10.6 2 13.2l9.4 2.6z"/><circle cx="14.4" cy="8" r="1.2"/>'),
    zombie: F('<circle cx="9.4" cy="6" r="3.2"/><path d="M6.8 9.2h5.4l4.6 3.8-1.8 2-3.6-2.4v8.4h-3v-5.6l-3.6 3.8-2-1.8 4.2-4.8H6.8z"/><circle cx="8.6" cy="5.4" r=".9"/><circle cx="11" cy="5.4" r=".9"/>'),
    ghoul: F('<path d="M5.4 21c-1.6-3.6-1.2-7.4.8-10.4l1.6 1V9.2l2 .6V6.6l2 1V6l1.8 1.6c3 2.8 3.6 6.8 2.2 10.6-2.6 1.6-7.4 1.8-10.4 2.8z"/><path d="M3.4 13.8 1.6 16l2.4.6zM6.6 21.4 5 23.4h3.2zM10.8 21.6 10.4 23.6l2.6-1.2z"/>'),
    bloater: F('<circle cx="12" cy="12" r="8"/><path d="M7.4 8.6l3 1.8-2.2 2.4 3 2.4-1.2 1.2-3-2.6 2.2-2.4-2.6-1.6z"/><circle cx="15.2" cy="9.4" r="1.8"/><circle cx="9" cy="15.6" r="1.4"/>'),
    plaguehound: F('<path d="M5 18.6 6 9.4l2-4.6 3 2.2 3-2.2 2 4.6 1 9.2-2.2 2.4-2-4.4-2.2 3.4-2-3.4-2 4.4z"/><circle cx="8.8" cy="11.6" r="1"/><circle cx="15.2" cy="11.6" r="1"/><path d="M10 16.4h4l-2 2z"/>'),
    necrolord: F('<path d="M12 3.6c4.2 0 7.4 3 7.4 6.8 0 2-1 3.8-2.6 4.8l.6 6.2H7.4l.6-6.2C6.4 14.2 5.4 12.4 5.4 10.4c0-3.8 3.2-6.8 6.6-6.8z"/><path d="M4.4 6.6 1 3l3.4 1zM19.6 6.6 23 3l-3.4 1z"/><circle cx="9.6" cy="10.4" r="1.2"/><circle cx="14.4" cy="10.4" r="1.2"/><path d="M12 14.4l1.6 3h-3.2z"/>'),
    // --- sci-fi / void / show ---
    servodrone: F('<rect x="8.6" y="9.2" width="6.8" height="6" rx="1.4"/><rect x="1" y="4.6" width="6" height="2" rx="1"/><rect x="17" y="4.6" width="6" height="2" rx="1"/><circle cx="3.6" cy="8.2" r="1.8"/><circle cx="20.4" cy="8.2" r="1.8"/><rect x="4.4" y="6" width="4.6" height="1.6" rx=".8" transform="rotate(20 4.4 6)"/><rect x="15" y="13.4" width="4.6" height="1.6" rx=".8" transform="rotate(-20 15 13.4)"/><circle cx="12" cy="12.2" r="1.6"/>'),
    warbot: F('<rect x="5" y="6.6" width="14" height="9.4" rx="2"/><rect x="1.6" y="9" width="3" height="3.4" rx="1"/><rect x="19.4" y="9" width="3" height="3.4" rx="1"/><rect x="10.6" y="2.4" width="2.8" height="4" rx="1"/><circle cx="9.4" cy="11" r="1.4"/><circle cx="14.6" cy="11" r="1.4"/><rect x="9" y="16" width="6" height="5" rx="1"/><rect x="10.6" y="18" width="2.8" height="3" rx="1"/>'),
    voidwisp: F('<path d="M12 2.4c3.8 3.8 5.8 7 5.8 10.4 0 3.4-2.6 6.4-5.8 6.4s-5.8-3-5.8-6.4c0-3.4 2-6.6 5.8-10.4z"/><circle cx="10.4" cy="10.6" r="1.1"/><circle cx="13.6" cy="10.6" r="1.1"/><path d="M8.4 19.6l.6 2.6 1.6-2.2zM12 19.4l.6 3 1.6-2.8zM15.6 19.6l.6 2.6 1.6-2.2z"/>'),
    starspawn: F('<path d="M12 2.6l2.4 6.2 6.6.4-5 4.4 1.6 6.6L12 16.8l-5.6 3.2L8 13.4l-5-4.4 6.6-.4z"/><circle cx="12" cy="11.4" r="2.6"/><circle cx="12" cy="11.4" r="1"/>'),
    strongman: F('<rect x="2.4" y="5.4" width="19.2" height="2.4" rx="1.2"/><rect x="2" y="3" width="3.2" height="7" rx="1.2"/><rect x="6" y="3.4" width="3.2" height="6.2" rx="1.2"/><rect x="14.8" y="3.4" width="3.2" height="6.2" rx="1.2"/><rect x="18.8" y="3" width="3.2" height="7" rx="1.2"/><path d="M7.4 11.4c2.2-.6 4-.2 4.6 1.6.6-1.8 2.4-2.2 4.6-1.6l-1 3.2-1.8-1v9.4h-3.6v-9.4l-1.8 1z"/>'),
    firebreather: F('<circle cx="9.6" cy="13" r="5.2"/><circle cx="8" cy="12" r="1"/><circle cx="11.2" cy="12" r="1"/><path d="M5.6 8.2 2.6 4l4.2 1zM13.6 8.2 16.6 4l-1 4.4z"/><path d="M14.4 12.2c1.6-.6 3.4-.2 4.6 1-1.2.8-3.2.8-4.6-.2z"/><path d="M15.6 14.6c2 .2 3.8 1.4 4.6 3-1.8.4-4-.6-5.2-1.8z"/><path d="M17.4 11c2.2.6 3.8 2 4.6 4-2.2 0-4.2-1.4-5-2.8z"/>'),
    wolf: F('<path d="M4 20.4l1.6-9.2L4 4.4l4.2 3.2 3.8-2 3.8 2L20 4.4l-1.6 6.8 1.6 9.2-4.2-3.2-3.8 2.2-3.8-2.2z"/><circle cx="9.6" cy="12" r="1"/><circle cx="14.4" cy="12" r="1"/><path d="M10.4 16.4h3.2l-1.6 2.2z"/>'),
    // --- Three Kingdoms ---
    liubei: F('<path d="M4.6 20.6 9.6 4.2l2.2.6-4.6 16.4zM19.4 20.6 14.4 4.2l-2.2.6 4.6 16.4z"/><rect x="3.6" y="19.6" width="16.8" height="2.4" rx="1.2"/><circle cx="12" cy="10.6" r="1.6"/>'),
    guanyu: F('<rect x="10.8" y="2.4" width="2.4" height="19.2" rx="1.2"/><path d="M13.2 2.6c3.4 1.2 5 4 4.6 7.6l-4.6-1.6z"/><path d="M11 2.6C7.6 3.8 6 6.6 6.4 10.2l4.6-1.6z"/><path d="M13.6 9.6l3.4 1-3.4 1zM10.4 9.6 7 10.6l3.4 1z"/>'),
    zhangfei: F('<path d="M12 1.6 9.4 4.6l4 2.4-4 2.4 4 2.4-4 2.4 4 2.4-4 2.4 3 3 1.8-2-2.4-2 4-2.4-4-2.4 4-2.4-4-2.4 4-2.4-3.4-2.4z"/><rect x="11" y="18.6" width="2" height="4.4" rx="1"/>'),
    zhugeliang: F('<path d="M12 20.4 3.6 9c3-2.4 6-3.6 8.4-3.6S17.4 6.6 20.4 9z"/><rect x="11" y="19" width="2" height="3.4" rx="1"/><circle cx="7.6" cy="12.6" r=".9"/><circle cx="12" cy="13.4" r=".9"/><circle cx="16.4" cy="12.6" r=".9"/>'),
    caocao: F('<path d="M12 2.6c3.4 0 5.6 2.2 5.6 5.6v3.2H6.4V8.2C6.4 4.8 8.6 2.6 12 2.6z"/><path d="M6.6 9.4 2 6v5.4l4.6-1zM17.4 9.4 22 6v5.4l-4.6-1z"/><rect x="5.6" y="11.8" width="12.8" height="2.2" rx="1.1"/><circle cx="12" cy="3.8" r="1.1"/><path d="M8 6.2h8l-1 2.4H9z"/>'),
    xiahoudun: F('<path d="M12 4.6c4 0 6.6 2.8 6.6 7 0 3.4-2.4 6.4-6.6 6.4S5.4 15 5.4 11.6c0-4.2 2.6-7 6.6-7z"/><path d="M5 9.4l11 3-1.2 2.6-10.4-3z"/><circle cx="15" cy="8.4" r="1.2"/><circle cx="9.6" cy="13.4" r="1.1"/><rect x="13" y="6" width="9" height="1.8" rx=".9" transform="rotate(-35 13 6)"/><path d="M21.6 3l2.2.4-.6 2.2z"/>'),
    guojia: F('<path d="M6.4 13.6a4.4 4.4 0 0 1 1.2-8.4 5.6 5.6 0 0 1 10.4 1.6A4 4 0 0 1 19 13.6z"/><path d="M12.6 13.4l-3.4 5.6h3.2l-1 4.4 5-7.4h-3.2l1.2-2.6z"/>'),
    sunquan: F('<path d="M3.4 19h17.2l-1.2-9-4 3-3.4-7-3.4 7-4-3z"/><path d="M4.6 9 1.4 4l4 1.2zM19.4 9l3.2-5-4 1.2z"/><circle cx="12" cy="13" r="1.4"/><path d="M9.4 16.4h5.2l-1 1.6h-3.2z"/>'),
    zhouyu: F('<path d="M12 20.6 4 9.4c3-2.6 6-4 8-4s5 1.4 8 4z"/><path d="M12 2c.8 2-1 3.2-1 5a2.2 2.2 0 0 0 4.4.4c0-2.2-1.4-3.6-3.4-5.4z"/><rect x="11" y="19" width="2" height="3.4" rx="1"/><circle cx="8.4" cy="13" r=".9"/><circle cx="12" cy="13.8" r=".9"/><circle cx="15.6" cy="13" r=".9"/>'),
    taishici: F('<path d="M7.6 2.6c5.6 2.6 5.6 16.2 0 18.8l-2-1.6c4.6-2.2 4.6-13.4 0-15.6z"/><rect x="7.4" y="3.4" width="1.4" height="17.2" rx=".7"/><rect x="7.4" y="11.2" width="14.6" height="1.6" rx=".8"/><path d="M20.4 10.6 23 12l-2.6 1.4z"/><circle cx="10" cy="12" r="1.2"/>'),
    huangzhong: F('<circle cx="10" cy="13" r="7"/><circle cx="10" cy="13" r="4.2"/><circle cx="10" cy="13" r="1.6"/><rect x="9.4" y="12.4" width="13" height="1.4" rx=".7" transform="rotate(-45 10 13)"/><path d="M21.6 3.4 23.4 5.2l-3 3-1.8-1.8z"/>'),
    ganning: F('<path d="M12 4.2a6.4 6.4 0 0 1 6.4 6.4v4.6l2 3.2H3.6l2-3.2V10.6A6.4 6.4 0 0 1 12 4.2z"/><rect x="11" y="2.2" width="2" height="2.4" rx="1"/><rect x="10.4" y="19.4" width="3.2" height="2.4" rx="1"/><circle cx="12" cy="13" r="1.6"/>'),
    diaochan: F('<path d="M14.6 2.6a9.4 9.4 0 1 0 0 18.8 7.6 7.6 0 1 1 0-18.8z"/><path d="M18.4 6.4c2.4 1.6 3.2 4 2.6 6.6l-2.6-1.2c.6-1.8 0-3.6-1.6-4.6z"/><circle cx="17.4" cy="9.6" r="1"/>'),
    lubu: F('<rect x="11" y="2.2" width="2.2" height="19.6" rx="1.1"/><path d="M13.2 2.4c3.6 1.4 5 4.4 4.4 8l-4.4-1.8z"/><path d="M10.8 2.4C7.2 3.8 5.8 6.8 6.4 10.4l4.4-1.8z"/><path d="M13.8 8.8 17.4 10l-3.6 1.2zM10.2 8.8 6.6 10l3.6 1.2z"/>'),
    // --- Heroes ---
    alexander: F('<path d="M12 2.2 5 5v6c0 5 3 8.6 7 11.8 4-3.2 7-6.8 7-11.8V5z"/><path d="M12 6.4l1.6 3.4 3.6.4-2.8 2.4.8 3.8L12 14.8l-3.2 1.6.8-3.8-2.8-2.4 3.6-.4z"/>'),
    caesar: F('<path d="M12 21c-3.6 0-6.6-2-8-5.4 2.4.4 4 1.6 4.8 3.4zM12 21c3.6 0 6.6-2 8-5.4-2.4.4-4 1.6-4.8 3.4z"/><rect x="11.2" y="8" width="1.6" height="12" rx=".8"/><path d="M12 9.4C11 7.6 9.2 6.6 6.6 6.8c.6 2.2 2 3.6 4.2 4zM12 9.4c1-1.8 2.8-2.8 5.4-2.6-.6 2.2-2 3.6-4.2 4zM12 13.4c-1.2-1.6-3-2.4-5.6-2.2.8 2 2.2 3.2 4.4 3.4zM12 13.4c1.2-1.6 3-2.4 5.6-2.2-.8 2-2.2 3.2-4.4 3.4z"/>'),
    spartacus: F('<circle cx="6" cy="12" r="3.4"/><circle cx="18" cy="12" r="3.4"/><circle cx="6" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/><path d="M8.6 10.4 11 9.6l.7 2-2.4.8zM15.4 13.6 13 14.4l-.7-2 2.4-.8z"/>'),
    hannibal: F('<path d="M7 20.6c-1.6-2.6-2-6-1.2-9.4.8-3.4 3-6 6.6-6.6 4-.6 7.2 1.8 8 5.6.6 3 .2 6.6-.8 10.4h-2.4l.6-6.6c-1.2 1.6-3.2 2.6-5.6 2.6v4h-2.6v-4c-1.6-1.6-2.2-3.6-2-5.6l-2 9.6z"/><circle cx="13" cy="10" r="1.2"/><path d="M5.4 12.4 2 11.4l3-1.4zM20.4 12.6 23.6 11.6l-2.8-1.4z"/>'),
    genghis: F('<path d="M3 3.4c4 .6 7.6 3 10 7.2l-2.2 2.2C9 9.4 6.2 7.4 3 6.6zM21 3.4c-4 .6-7.6 3-10 7.2l2.2 2.2C15 9.4 17.8 7.4 21 6.6z"/><rect x="3.6" y="18.6" width="16.8" height="2.4" rx="1.2"/>'),
    napoleon: F('<path d="M2.6 12.6 12 4.4l9.4 8.2-4 2.6-5.4-3-5.4 3z"/><path d="M9.4 16.6c1.6 1.2 3.6 1.2 5.2 0l-.6 2.4h-4z"/>'),
    sunzu: F('<path d="M5.6 3.4h12.8v17.2H5.6z"/><rect x="2.6" y="2.2" width="3.6" height="19.6" rx="1.8"/><rect x="17.8" y="2.2" width="3.6" height="19.6" rx="1.8"/><rect x="8" y="6.6" width="8" height="1.6" rx=".8"/><rect x="8" y="10" width="8" height="1.6" rx=".8"/><rect x="8" y="13.4" width="5" height="1.6" rx=".8"/>'),
    leonidas: F('<path d="M12 2.4c4.6 0 7.6 3.4 7.6 8 0 3.4-.8 6.6-2 9.6h-3.2l.6-5.4c-1.6 1.6-4.4 1.6-6 0l.6 5.4H6.4c-1.2-3-2-6.2-2-9.6 0-4.6 3-8 7.6-8z"/><path d="M12 1.4c1.6 1.4 2.4 3 2.4 5l-2.4-1zM12 1.4c-1.6 1.4-2.4 3-2.4 5l2.4-1z"/><path d="M9 9h6v2.4H9z"/>'),
    gilgamesh: F('<path d="M3.6 21V9.4L12 3l8.4 6.4V21h-3.2v-8.6L12 8.4l-5.2 4V21z"/><rect x="10.6" y="14.4" width="2.8" height="6.6" rx="1.4"/><rect x="6.4" y="11.4" width="2" height="9.6" rx="1"/><rect x="15.6" y="11.4" width="2" height="9.6" rx="1"/>'),
    hercules: F('<path d="M8.6 21.4l3-8.6-2.4-3c-1.6-3 .2-6.6 3.4-7.8 3.2-1.2 6.6.8 7.2 4 .4 2.2-.6 4-2.6 5.2l-3.4 2-3 8.2z"/>'),
    odin: F('<path d="M2.6 14.4c3.4-6.4 8.8-9.8 14.4-9.6-1.4 2.2-.6 3.8 2.2 4.4l-1.6 3.4c-1.4 3.2-4.6 5.4-8.6 6l-1.6 3.6-1.6-3.6-3.2-1z"/><circle cx="15.4" cy="9.6" r="1.1"/><path d="M21 8.6 23.4 7l-2 3z"/>'),
    thor: F('<rect x="4.6" y="9.4" width="14.8" height="5.4" rx="1.4"/><rect x="9.6" y="14.4" width="4.8" height="7.4" rx="1.2"/><rect x="3.4" y="8.2" width="17.2" height="2" rx="1"/><path d="M8 6.6l1.6-3 1.6 2.2zM16 6.6l-1.6-3-1.6 2.2z"/>'),
    sunwukong: F('<rect x="10.8" y="4" width="2.4" height="18" rx="1.2"/><rect x="8.6" y="19.4" width="6.8" height="2.4" rx="1.2"/><circle cx="12" cy="4" r="2.6"/><circle cx="12" cy="4" r="1"/><path d="M9.6 3.4 6.8 2l2.6 2.6zM14.4 3.4 17.2 2l-2.6 2.6z"/>'),
    momotaro: F('<path d="M12 6c4.2 0 8 3.6 8 7.8S16.2 21.4 12 21.4 4 17.8 4 13.8 7.8 6 12 6z"/><path d="M12 6c0-2 1.2-4 3.4-5.2.4 2-1 4-3.4 5.2z"/><rect x="11" y="2.8" width="1.6" height="3.4" rx=".8"/><circle cx="12" cy="13" r="1.6"/>'),
    anansi: F('<circle cx="12" cy="12.4" r="3.6"/><circle cx="12" cy="6.4" r="2.4"/><path d="M8.8 11.2 3.4 8l1 2.4 4.8 2.4zM15.2 11.2 20.6 8l-1 2.4-4.8 2.4zM8.4 13.6 2.6 13l1.6 2.2 4.6-.2zM15.6 13.6l5.8-.6-1.6 2.2-4.6-.2zM9.4 15.6 5 20.4l2.6-.6 3.4-3.6zM14.6 15.6 19 20.4l-2.6-.6-3.4-3.6z"/><circle cx="12" cy="12.4" r="1.2"/>'),
    robinhood: F('<path d="M4 18.4c-.6-6.4 3.4-11.4 9-11.4 3.4 0 5.6 2 5.6 5l2.4.6-2.4 1.6c0 2.6-2.6 4.2-6.4 4.2z"/><path d="M17 8.6 22.4 3l-1 4.4 3 1-4 1.2z"/>'),
    arthur: F('<path d="M12 2.4l1.6 3.4-1.6 9.2-1.6-9.2z"/><rect x="8.4" y="15.4" width="7.2" height="2.4" rx="1.2"/><rect x="11" y="17.4" width="2" height="2.6" rx="1"/><path d="M3.4 20.4c0-2 2-3.4 4.6-3.4h8c2.6 0 4.6 1.4 4.6 3.4s-2 3.2-4.6 3.2H8c-2.6 0-4.6-1.2-4.6-3.2z"/>'),
    beowulf: F('<path d="M5.4 21.4c-.8-5.4 1-10.4 5-13.6l1.6 2.2c-3.2 2.8-4.6 6.8-4.2 11.4z"/><path d="M10.4 7.6 12.6 6l1 2.4-2 .8zM13.4 6.2 15.8 5l.8 2.4-2 .6zM16.6 5.4 19 4.6l.4 2.6-2 .2zM19.6 5.6 21.8 6l-.6 2.4-1.8-.6z"/><path d="M5 21.4 2.6 23l3 .6z"/>'),
    goku: F('<circle cx="12" cy="12" r="8"/><path d="M12 6.2l1.4 3.2 3.4.2-2.6 2.2.8 3.4-3-1.8-3 1.8.8-3.4L7.2 9.6l3.4-.2z"/><circle cx="8.4" cy="16.4" r="1"/><circle cx="15.6" cy="16.4" r="1"/>'),
    mulan: F('<path d="M12 2.6l1.6 3-1.6 11.4-1.6-11.4z"/><rect x="8.6" y="16" width="6.8" height="2.2" rx="1.1"/><rect x="11" y="18" width="2" height="4" rx="1"/><circle cx="5.4" cy="7.4" r="2.2"/><circle cx="2.6" cy="7.4" r="1.2"/><circle cx="8.2" cy="7.4" r="1.2"/><circle cx="5.4" cy="4.6" r="1.2"/><circle cx="5.4" cy="10.2" r="1.2"/>')
  });

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
    Jujutsu: 'rune', Wuxia: 'sword', Ocean: 'drop', War: 'target', Zombie: 'skull', 'Three Kingdoms': 'crown', Heroes: 'crown'
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

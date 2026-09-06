/* ============================================================
   Original vector chess pieces (flat Staunton-style, rendered as SVG).
   Drawn from scratch — no third-party assets.
   ============================================================ */
window.MD = window.MD || {};

(function () {
  function pal(w) {
    return {
      body: w ? '#fafaf6' : '#505058',
      hi:   w ? '#ffffff' : '#6f6f7a',
      lo:   w ? '#c4c4bb' : '#26262c',
      ink:  w ? '#3a3a34' : '#0d0d11',
      stroke: w ? 2.4 : 2.4
    };
  }

  // --- path fragments (coordinates are tuned on a 100x118 canvas) ---
  function defs(id, stops) {
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
      stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('') +
      `</linearGradient></defs>`;
  }

  function pawn(w) {
    const p = pal(w); const gid = w ? 'gW' : 'gB';
    return `<g>
      ${w ? '' : ''}
      <ellipse cx="50" cy="115" rx="26" ry="6" fill="${p.ink}" opacity=".25"/>
      <path d="M30 106 Q30 100 37 98 L40 98 Q40 94 44 92 L44 88 Q50 92 56 88 L56 92 Q60 94 60 98 L63 98 Q70 100 70 106 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <path d="M32 96 Q50 104 68 96 L70 106 Q50 112 30 106 Z" fill="${p.lo}" opacity=".55"/>
      <ellipse cx="50" cy="78" rx="13.5" ry="16" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <ellipse cx="47.5" cy="72" rx="5" ry="7" fill="${p.hi}" opacity=".7"/>
      <path d="M35 63 Q35 52 42 50 Q40 40 50 40 Q60 40 58 50 Q65 52 65 63 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <ellipse cx="50" cy="37" rx="15.5" ry="14.5" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <ellipse cx="46" cy="32" rx="5.5" ry="6" fill="${p.hi}" opacity=".8"/>
    </g>`;
  }

  function rook(w) {
    const p = pal(w); const gid = w ? 'gW' : 'gB';
    return `<g>
      <ellipse cx="50" cy="115" rx="27" ry="6" fill="${p.ink}" opacity=".25"/>
      <path d="M30 108 L30 96 Q30 92 34 92 L34 60 L66 60 L66 92 Q70 92 70 96 L70 108 Q50 114 30 108 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <path d="M31 106 Q50 112 69 106 L66 96 L34 96 Z" fill="${p.lo}" opacity=".5"/>
      <path d="M34 60 L30 44 L38 46 L38 32 L44 34 L44 22 L50 24 L50 22 L56 24 L56 34 L62 32 L62 46 L70 44 L66 60 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}" stroke-linejoin="round"/>
      <rect x="43" y="70" width="14" height="18" rx="3" fill="${p.lo}" opacity=".6"/>
      <rect x="36" y="50" width="5" height="8" fill="${p.hi}" opacity=".6"/>
      <rect x="60" y="50" width="4" height="8" fill="${p.hi}" opacity=".6"/>
    </g>`;
  }

  function bishop(w) {
    const p = pal(w); const gid = w ? 'gW' : 'gB';
    return `<g>
      <ellipse cx="50" cy="115" rx="26" ry="6" fill="${p.ink}" opacity=".25"/>
      <path d="M31 107 Q31 100 38 98 L39 96 L61 96 L62 98 Q69 100 69 107 Q50 113 31 107 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <path d="M33 104 Q50 110 67 104 L66 99 L34 99 Z" fill="${p.lo}" opacity=".5"/>
      <path d="M39 90 C36 74 42 66 44 56 L40 62 L37 56 L42 46 L38 52 L35 44 L43 32 C44 24 47 20 50 18 C53 20 56 24 57 32 L65 44 L62 52 L58 46 L63 56 L60 62 L56 56 C58 66 64 74 61 90 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}" stroke-linejoin="round"/>
      <path d="M50 60 L50 44 L46 50" fill="none" stroke="${p.lo}" stroke-width="3" opacity=".8"/>
      <circle cx="50" cy="14.5" r="6.5" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="47.6" cy="12" r="2.6" fill="${p.hi}" opacity=".85"/>
    </g>`;
  }

  function knight(w) {
    const p = pal(w); const gid = w ? 'gW' : 'gB';
    return `<g>
      <ellipse cx="50" cy="115" rx="27" ry="6" fill="${p.ink}" opacity=".25"/>
      <path d="M31 108 Q31 100 39 98 L44 96 L64 92 L70 96 L70 104 L70 110 Q50 115 31 108 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <path d="M33 106 Q50 112 68 106 L66 97 L34 97 Z" fill="${p.lo}" opacity=".5"/>
      <path d="M39 96 L46 66 Q42 62 42 56 C42 46 52 18 66 16 C63 22 62 26 60 30 L66 34 L62 40 L70 42 L60 52 L60 62 Q68 64 70 70 L72 78 L70 94 L44 96 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}" stroke-linejoin="round"/>
      <circle cx="58" cy="26" r="4.5" fill="${p.lo}"/>
      <circle cx="60.5" cy="24" r="2" fill="${p.hi}" opacity=".85"/>
      <path d="M49 44 L43 60 M60 48 L52 66" stroke="${p.ink}" stroke-width="2" opacity=".45"/>
    </g>`;
  }

  function queen(w) {
    const p = pal(w); const gid = w ? 'gW' : 'gB';
    return `<g>
      <ellipse cx="50" cy="115" rx="27" ry="6" fill="${p.ink}" opacity=".25"/>
      <path d="M30 107 Q30 99 38 96 L38 92 L62 92 L62 96 Q70 99 70 107 Q50 114 30 107 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <path d="M32 105 Q50 112 68 105 L67 97 L33 97 Z" fill="${p.lo}" opacity=".5"/>
      <path d="M50 88 L50 70 L43 78 L45 62 L50 66 L55 62 L57 78 L50 70 L50 88" fill="${p.lo}" opacity=".5"/>
      <path d="M34 58 L31 34 L38 46 L42 30 L47 46 L50 26 L53 46 L58 30 L62 46 L69 34 L66 58 Q61 62 57 62 L57 66 L43 66 L43 62 Q39 62 34 58 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}" stroke-linejoin="round"/>
      <circle cx="31" cy="28" r="5.5" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="50" cy="20" r="5.5" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="69" cy="28" r="5.5" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="40.6" cy="36" r="3.4" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="59.4" cy="36" r="3.4" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="48" cy="25" r="1.6" fill="${p.hi}" opacity=".9"/>
    </g>`;
  }

  function king(w) {
    const p = pal(w); const gid = w ? 'gW' : 'gB';
    return `<g>
      <ellipse cx="50" cy="115" rx="27.5" ry="6" fill="${p.ink}" opacity=".25"/>
      <path d="M30 107 Q30 99 38 96 L38 92 L62 92 L62 96 Q70 99 70 107 Q50 114 30 107 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <path d="M32 105 Q50 112 68 105 L67 97 L33 97 Z" fill="${p.lo}" opacity=".5"/>
      <path d="M41 56 C38 46 42 38 45 30 L40 33 L39 26 L44 30 L45 22 L50 28 L55 22 L56 30 L61 26 L60 33 L55 30 C58 38 62 46 59 56 Q55 60 50 60 Q45 60 41 56 Z" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}" stroke-linejoin="round"/>
      <rect x="46.5" y="14" width="7" height="12" rx="2" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <rect x="42" y="12" width="16" height="5" rx="2.5" fill="url(#${gid})" stroke="${p.ink}" stroke-width="${p.stroke}"/>
      <circle cx="50" cy="27" r="4" fill="${p.lo}"/>
      <path d="M50 60 L50 70 M46 65 L54 65" stroke="${p.lo}" stroke-width="3" opacity=".6"/>
      <circle cx="49" cy="30" r="1.5" fill="${p.hi}" opacity=".9"/>
    </g>`;
  }

  function pieceSVG(color, type) {
    const w = color === 'w';
    const body = w ? '#fafaf6' : '#505058';
    const hi = w ? '#ffffff' : '#73737d';
    const lo = w ? '#c6c6bd' : '#2b2b31';
    const ink = w ? '#3a3a34' : '#0c0c10';
    const gid = w ? 'gW' : 'gB';
    const map = { p: pawn, r: rook, n: knight, b: bishop, q: queen, k: king };
    const art = (map[type] || pawn)(w).replace(/url\(#g[WB]\)/g, `url(#${gid})`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 122">` +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${body}"/>` +
      `<stop offset="1" stop-color="${lo}"/></linearGradient></defs>` + art + `</svg>`;
    return svg;
  }

  function dataURI(color, type) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pieceSVG(color, type));
  }

  MD.pieceSVG = pieceSVG;
  MD.pieceSrc = dataURI;
})();

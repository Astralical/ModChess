// TROOP ICON uniqueness regression — REWORKED 2026-09-08.
// Every troop must draw its OWN distinct vector glyph (no two units may share
// art, and none may fall back to the generic 'paw'). Glyphs are inline SVG with
// fill-rule evenodd (so eyes/emblems punch through as holes) and contain NO
// emoji — this guards against the "all animals look the same" regression.
const fs = require('fs');
globalThis.MD = {};
['js/troops.js', 'js/icons.js'].forEach(p => eval(fs.readFileSync(p, 'utf8')));
const M = globalThis.MD;

let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗ FAIL:', n); } }

const T = M.TROOPS, G = M.TROOP_GLYPHS;
const keys = Object.keys(T);

ok(keys.length === 111, 'roster has 111 troops (got ' + keys.length + ')');

let missing = [], notSelf = [], paw = [];
const byMarkup = {};
for (const k of keys) {
  const glyph = M.troopGlyph(k);
  if (!Object.prototype.hasOwnProperty.call(G, k)) missing.push(k);
  if (glyph !== k) notSelf.push(k + '->' + glyph);
  if (glyph === 'paw') paw.push(k);
  const markup = M.iconHTML(glyph);
  (byMarkup[markup] = byMarkup[markup] || []).push(k);
}
ok(missing.length === 0, 'every troop has its own glyph entry' + (missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''));
ok(notSelf.length === 0, 'troopGlyph() maps each type to itself' + (notSelf.length ? ' (bad: ' + notSelf.join(', ') + ')' : ''));
ok(paw.length === 0, 'no troop falls back to the paw glyph');

const dupes = Object.keys(byMarkup).filter(m => byMarkup[m].length > 1).map(m => byMarkup[m].join('='));
ok(dupes.length === 0, 'no two troops share the same drawing' + (dupes.length ? ' (dupes: ' + dupes.join(' | ') + ')' : ''));
ok(Object.keys(byMarkup).length === keys.length, 'all ' + keys.length + ' drawings are unique');

// every glyph must be evenodd filled SVG, and free of emoji code points
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{2B00}-\u{2BFF}]/u;
let noHoles = [], emoji = [], skinny = [];
for (const k of keys) {
  const markup = M.iconHTML(k);
  if (!markup.includes('fill-rule="evenodd"')) noHoles.push(k);
  if (EMOJI.test(markup)) emoji.push(k);
  if (markup.length < 120) skinny.push(k);
}
ok(noHoles.length === 0, 'every glyph uses fill-rule evenodd (visible details)' + (noHoles.length ? ' (' + noHoles.join(', ') + ')' : ''));
ok(emoji.length === 0, 'no troop glyph contains emoji' + (emoji.length ? ' (' + emoji.join(', ') + ')' : ''));
ok(skinny.length === 0, 'every glyph carries real artwork' + (skinny.length ? ' (' + skinny.join(', ') + ')' : ''));

console.log('\nICONS: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

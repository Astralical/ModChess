// Audit: find abilities that throw or silently do nothing on common positions.
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js', 'js/abilities_1.js', 'js/abilities_2.js',
 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js', 'js/abilities_6.js', 'js/abilities_index.js'].forEach(load);
const lib = globalThis.MD, E = lib.Engine;

function boardHash(g) { return JSON.stringify(g.board) + '|' + g.ep; }

function noOpResult(g, ab, side) {
  const before = boardHash(g);
  const marksBefore = (g.fxevents || []).length;
  const t = lib.botTarget(g, ab, side);
  const res = lib.cast(g, ab, side, t);
  const boardChanged = boardHash(g) !== before;
  const lines = res.lines || [];
  const noTargetLine = lines.some(l => /(no |none|nowhere|empty|not in|wasted|clear|already|untouchable|fizzles)/i.test(l) && /no|not|none|fizzl|empty|already|wasted|clear/i.test(l));
  const noEffect = !boardChanged && !noTargetLine && res.marks.length === 0;
  return { error: !!res.error, boardChanged, noEffect, noTargetLine, lines: lines.join(' | ').slice(0, 90) };
}

const flagged = [];
lib.ABILITIES.forEach(ab => {
  const report = {};
  // start position white & black
  [['w', E.newGame()], ['b', E.newGame()]].forEach(([side, g]) => {
    const r = noOpResult(g, ab, side);
    report[side + '-start'] = r;
  });
  // open mid-game-ish (a few random plies)
  const g = E.newGame();
  let guard = 0;
  while (guard++ < 24) { const ms = E.legalMoves(g, g.turn); if (!ms.length) break; E.applyMove(g, ms[Math.floor(Math.random() * ms.length)]); g.turn = E.opp(g.turn); }
  const side = Math.random() < 0.5 ? 'w' : 'b';
  report['mid'] = noOpResult(g, ab, side);

  const errs = Object.values(report).filter(r => r.error);
  const noops = Object.values(report).filter(r => r.noEffect || r.noTargetLine);
  if (errs.length) flagged.push({ id: ab.id, name: ab.name, kind: 'ERROR', msg: errs[0].lines });
  else if (noops.length === Object.keys(report).length) flagged.push({ id: ab.id, name: ab.name, kind: 'NOOP-ALL', lines: noops[0].lines });
  else if (noops.length >= 2) flagged.push({ id: ab.id, name: ab.name, kind: 'noop-2/3', lines: noops.map(n => n.lines).join(' || ') });
});

console.log('Flagged', flagged.length, 'of', lib.ABILITIES.length);
flagged.forEach(f => console.log(`  [${f.kind}] #${f.id} ${f.name}: ${f.lines || f.msg}`));
process.exit(0);

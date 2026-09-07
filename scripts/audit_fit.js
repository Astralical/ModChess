/* ============================================================
   Mod Chess — fit audit: does each ability's effect match its
   NAME / FLAVOR? Cross-references thematic keywords in the
   name+flavor against the statuses/zones/verbs the run() source
   actually applies. Prints FLAG rows for strong mismatches and
   INFO rows for softer ones, then exits 1 if any FLAG.
   ============================================================ */
const fs = require('fs');
const path = require('path');
globalThis.MD = {};
const load = p => eval(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'));
['js/engine.js', 'js/troops.js', 'js/icons.js', 'js/effects.js',
 'js/abilities_1.js', 'js/abilities_2.js', 'js/abilities_3.js', 'js/abilities_4.js', 'js/abilities_5.js',
 'js/abilities_6.js', 'js/abilities_7.js', 'js/abilities_8.js', 'js/abilities_9.js', 'js/abilities_10.js',
 'js/abilities_11.js', 'js/abilities_12.js', 'js/abilities_13.js', 'js/abilities_14.js', 'js/abilities_15.js',
 'js/abilities_16.js', 'js/abilities_17.js',
 'js/abilities_index.js', 'js/rebalance.js'].forEach(load);

const flags = [], infos = [];
const nameTxt = ab => ((ab.name || '') + ' ').toLowerCase();
const src = ab => { try { return ab.run ? ab.run.toString() : ''; } catch (e) { return ''; } };
const hasName = (ab, re) => re.test(nameTxt(ab));
const uses = (ab, re) => re.test(src(ab));

// strong pairs: if the card NAME says this verb, its run() must apply the matching effect
const STRONG = [
  { name: 'petrify/seal/coffin/stone', say: /petrif|gorgon|coffin|stone\b|statue|encas|fossil|basalt/, use: /['"]st['"]|stoneOn|statusOn\([^)]*['"]st['"]/ },
  { name: 'doom/death-mark', say: /doom|death[- ]?mark|knell|executioner/, use: /['"]doom['"]|doomOn/ },
  { name: 'freeze/ice/frost (name)', say: /freez|frost\b|frozen|glacial|blizzard|chill\b|polar|snow|icicle/, use: /['"]f['"]|freezeN|['"]freeze['"]|\.f\b|ice/ },
  { name: 'fog/mist/veil/hide/invis', say: /fog\b|mist\b|veil\b|invisib|shroud\b|stealth|camouflage|camoufl|obscur/, use: /['"]v['"]|veilOn|['"]fog['"]|obscured/ }
];

for (const ab of MD.ABILITIES) {
  const s = src(ab);
  if (!s) continue;
  for (const chk of STRONG) {
    if (hasName(ab, chk.say) && !uses(ab, chk.use)) {
      flags.push(`${ab.id} ${ab.name}  :: name says "${chk.name}" but run never applies it (${trunc(ab.desc)})`);
    }
  }
  // soft heuristics for themed sets
  const full = ((ab.name || '') + ' ' + (ab.flavor || '') + ' ' + (ab.desc || '')).toLowerCase();
  if (/flame|fireball|inferno|conflagr|scorch|burning|blaze/.test(full) && !uses(ab, /fire|ember|['"]p['"]|poisonN|removeAt|bomb|blast|sear|inciner/)) {
    infos.push(`${ab.id} ${ab.name}  :: fire-named but no fire/burn effect (${trunc(ab.desc)})`);
  }
  if (/heal|cleanse|cure|restore|mend|repair/.test(full) && !uses(ab, /\.p *= *0|\.f *= *0|['"]s['"]|shieldN|veilOn|regen/)) {
    infos.push(`${ab.id} ${ab.name}  :: heal-named but no cleanse/ward effect (${trunc(ab.desc)})`);
  }
  if (/zone|ground|field|terrain|blighted earth|holy ground|scorch(ed)? earth/.test(full) && !uses(ab, /layZone|setZone|layHazard|setTerrain|setHaz/)) {
    infos.push(`${ab.id} ${ab.name}  :: 'ground/zone' flavor but no ground-layer effect (${trunc(ab.desc)})`);
  }
}
function trunc(x) { x = String(x || ''); return x.length > 88 ? x.slice(0, 85) + '…' : x; }

console.log('=== FLAGS (strong mismatches) ===');
flags.forEach(f => console.log('  FLAG', f));
console.log('=== INFO (soft) ===');
infos.slice(0, 120).forEach(f => console.log('  ·', f));
console.log(`\n${flags.length} flags, ${infos.length} info`);
process.exit(flags.length ? 1 : 0);

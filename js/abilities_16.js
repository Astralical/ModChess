/* ============================================================
   Mod Chess — Ability set 16: WILDCARDS (mechanic showcases)
   IDs 707-716. New verbs for statuses & terrain that earlier
   themes lacked: PETRIFY (seal, un-capturable), DOOM (quiet
   death-mark), ground ZONES (sanctum/fire/thorns/rift/mire) and
   one-turn RULE modifiers (move-limit / no-capture).
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx, O = Fx.opp;
  const en = (g, s) => Fx.enemy(g, s);
  const own = (g, s) => Fx.own(g, s);
  const sn = (r, c) => E.sqName(r, c);
  const rnd = a => Fx.rand(a);
  const val = t => E.val(t);
  const foes = (g, s) => en(g, s).filter(q => q.cell.t !== 'k');
  const mine = (g, s) => own(g, s).filter(q => q.cell.t !== 'k');
  const adv = (g, s) => mine(g, s).sort((a, b) => (s === 'w' ? b.r - a.r : a.r - b.r));
  const strong = (g, s) => foes(g, s).sort((a, b) => val(b.cell.t) - val(a.cell.t))[0];
  const weak = (g, s) => foes(g, s).sort((a, b) => val(a.cell.t) - val(b.cell.t))[0];
  const kill = (g, q) => { Fx.removeAt(g, q.r, q.c, {}); };
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });
  const halfRows = (g, s) => Fx.enemyHalfRows(g, s);

  def(707, 'Gorgon Gaze', 2, 'Curse', 'eye', 'PETRIFY two random enemy MINOR pieces (knight/bishop): they cannot move or be captured until two of their own turns pass.', 'Look, and be stone.', (g, s) => {
    const pool = foes(g, s).filter(q => q.cell.t === 'n' || q.cell.t === 'b');
    const picks = Fx.uniqN(pool, 2);
    if (!picks.length) return ['No mortal flesh to turn to stone.'];
    const lines = [];
    for (const q of picks) { Fx.mod(q.cell, 'st', 2); Fx.flash(g, q.r, q.c, 'freeze', ''); lines.push('An enemy ' + MD.pieceName(q.cell.t) + ' is petrified.'); }
    return lines;
  });

  def(708, 'Doomsworn', 3, 'Curse', 'target', 'Mark the enemy\'s strongest piece with DOOM — at the end of its next own turn it dies, quietly and without harming its neighbors.', 'A debt to death, now due.', (g, s) => {
    const t = strong(g, s);
    if (!t) return ['Death finds no worthy vessel.'];
    Fx.mod(t.cell, 'doom', 1); Fx.flash(g, t.r, t.c, 'poison', '');
    return ['The ' + MD.pieceName(t.cell.t) + ' is marked with doom — it has one turn to live.'];
  });

  def(709, 'Hallowed Ground', 2, 'Buff', 'shield', 'Sanctify the ground under your king (a 3×3 zone): your pieces standing there are cleansed and shielded each turn — enemies are pushed off or poisoned.', 'Only the faithful may rest here.', (g, s) => {
    const k = E.findKing(g, s);
    if (!k) return [];
    const n = Fx.layZoneZone(g, k.r, k.c, 'sanctum', { ring: true, c: s });
    return n ? ['Hallowed ground spreads across ' + n + ' square' + (n > 1 ? 's' : '') + ' around your king.'] : ['The ground is too crowded to sanctify.'];
  });

  def(710, 'Scorching Field', 3, 'Attack', 'fire', 'Set the enemy\'s half ablaze: turn up to FOUR empty squares into FIRE zones — any piece ending its turn there is burned (poisoned, shield stripped).', 'The field will not forgive a lingering step.', (g, s) => {
    const n = Fx.layZone(g, 'fire', 4, { rows: halfRows(g, s) });
    return n ? ['Fire spreads across ' + n + ' empty square' + (n > 1 ? 's' : '') + ' of the enemy\'s half.'] : ['No open ground to burn.'];
  });

  def(711, 'Brier Thicket', 3, 'Status', 'leaf', 'Grow a THORNS thicket on up to three random empty squares in the enemy\'s half — any piece that ends its turn there is DOOMED.', 'The briar remembers every step.', (g, s) => {
    const n = Fx.layZone(g, 'thorns', 3, { rows: halfRows(g, s) });
    return n ? ['A brier thicket claws up through ' + n + ' empty square' + (n > 1 ? 's' : '') + '.'] : ['The briers cannot find soil.'];
  });

  def(712, 'Chains of Command', 4, 'Time', 'lock', 'Bind the enemy general staff: this turn the enemy may ONLY move their PAWNS (and must still move one of them).', 'Orders, countermanded.', (g, s) => {
    const p = weak(g, s);
    Fx.limitMove(g, O(s), 'p');
    const lines = ['The enemy\'s command is chained — only their pawns may move this turn.'];
    if (p) { Fx.mod(p.cell, 'st', 1); lines.push('And their weakest piece is petrified for good measure.'); }
    return lines;
  });

  def(713, 'Shattered Advance', 2, 'Curse', 'sword', 'The enemy may NOT CAPTURE this turn (only quiet moves), and one random enemy pawn is poisoned.', 'Their blades are stayed.', (g, s) => {
    Fx.noCaptures(g, O(s));
    const lines = ['The enemy cannot capture this turn.'];
    const p = rnd(en(g, s).filter(q => q.cell.t === 'p'));
    if (p) { Fx.mod(p.cell, 'p', 1); Fx.flash(g, p.r, p.c, 'poison', ''); lines.push('An enemy pawn is poisoned besides.'); }
    return lines;
  });

  def(714, 'Warp Field', 3, 'Chaos', 'void', 'Tear RIFT zones into three random empty squares of the enemy\'s half — any enemy piece that ends its turn there is torn to a random empty square.', 'Space is not as solid as it seems.', (g, s) => {
    const n = Fx.layZone(g, 'rift', 3, { rows: halfRows(g, s) });
    return n ? ['Rifts gape across ' + n + ' empty square' + (n > 1 ? 's' : '') + ' of the enemy\'s half.'] : ['The fabric of space holds firm.'];
  });

  def(715, 'Sludge Mire', 1, 'Status', 'drop', 'Flood a MIRE over three random empty squares in the enemy\'s half — a piece that ends its turn there is stuck and cannot move next turn.', 'Slow, patient, devouring.', (g, s) => {
    const n = Fx.layZone(g, 'mire', 3, { rows: halfRows(g, s) });
    return n ? ['Mire swallows ' + n + ' empty square' + (n > 1 ? 's' : '') + ' of the field.'] : ['The ground is too dry to mire.'];
  });

  def(716, 'Royal Coffin', 4, 'Kingship', 'crown', 'PETRIFY every enemy piece standing next to their king — the whole royal guard is sealed in stone (un-capturable until their turns pass).', 'A throne ringed in statues.', (g, s) => {
    const k = E.findKing(g, O(s));
    if (!k) return [];
    const guard = foes(g, s).filter(q => Math.abs(q.r - k.r) <= 1 && Math.abs(q.c - k.c) <= 1);
    const n = Fx.stoneOn(g, guard, 99);
    return n ? ['The royal guard is petrified — ' + n + ' statue' + (n > 1 ? 's' : '') + ' ring the king.'] : ['The king stands alone and unguarded.'];
  });

  MD.AB_16 = A;
})();

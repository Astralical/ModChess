/* Mod Chess — Ability set 5/6: 20 new summonable custom TROOPS (IDs 201-220) */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const Fx = MD.Fx;

  // rarity by troop value
  const rar = v => (v < 500 ? 1 : v < 700 ? 2 : v < 1000 ? 3 : 4);
  const line = (key) => {
    const t = MD.TROOPS[key];
    return { key, icon: t.icon, name: t.name, value: t.value, rar: rar(t.value) };
  };

  // flavour + movement hints
  const M = {
    goblin:    { d: 'Conjure a Goblin on a random empty square. It hops in 2-step jumps — straight or diagonal.', f: 'Cheap, loud, and surprisingly deadly in a swarm.' },
    ranger:    { d: 'Conjure a Ranger on a random empty square. It shoots up to 3 squares along any line.', f: 'One arrow, two arrows, three arrows. Miss.' },
    dwarf:     { d: 'Conjure a Dwarf on a random empty square. It stomps up to 2 squares straight.', f: 'Short legs, long grudges.' },
    harpy:     { d: 'Conjure a Harpy on a random empty square. It glides 4 squares diagonally or steps 1 straight.', f: 'Its shriek arrives a moment before it does.' },
    golem:     { d: 'Conjure a Golem on a random empty square. It lumbers 3 squares straight and crushes anything adjacent.', f: 'Slow. Indestructible. Unimpressed.' },
    sphinx:    { d: 'Conjure a Sphinx on a random empty square. It leaps like a knight or in long 2-step diagonals.', f: 'Answer its riddle or lose a piece. Its riddle is always a knight fork.' },
    lich:      { d: 'Conjure a Lich on a random empty square. It glides 5 squares diagonally and may phase 2 squares straight.', f: 'It has died so many times that dying is a hobby.' },
    treant:    { d: 'Conjure a Treant on a random empty square. It creeps 1–2 steps straight and never tires.', f: 'The forest has a long memory and very long roots.' },
    griffon:   { d: 'Conjure a Griffon on a random empty square. It flies like a rook and dives like a knight.', f: 'King of the skies. Also of the a-file.' },
    manticore: { d: 'Conjure a Manticore on a random empty square. It prowls like a bishop and springs like a knight.', f: 'A lion\'s body, a scorpion\'s tail, and terrible table manners.' },
    vampire:   { d: 'Conjure a Vampire on a random empty square. It leaps like a knight and slips one step straight.', f: 'It only comes out at knight. Wait.' },
    basilisk:  { d: 'Conjure a Basilisk on a random empty square. It slithers up to 2 squares in any direction.', f: 'Eye contact optional; consequences mandatory.' },
    djinn:     { d: 'Conjure a Djinn on a random empty square. It glides up to 4 squares any direction and can curl one diagonal step.', f: 'Careful what you wish for — it grants all of it.' },
    owlbear:   { d: 'Conjure an Owlbear on a random empty square. It soars 3 diagonals or pounces like a knight.', f: 'Part owl, part bear, all fury.' },
    banshee:   { d: 'Conjure a Banshee on a random empty square. It wails through knight leaps and drifts one step anywhere.', f: 'Hearing it is a warning. Seeing it is a farewell.' },
    hydra:     { d: 'Conjure a Hydra on a random empty square. It strikes up to 5 squares along any line and bites one step straight.', f: 'Cut off one head, and a summon spell grows two more.' },
    tiger:     { d: 'Conjure a Tiger on a random empty square. It pounces in long 3+1 leaps or sprints 3 squares straight.', f: 'It does not chase. It ambushes.' },
    unicorn:   { d: 'Conjure a Unicorn on a random empty square. It gallops up to 6 squares diagonally and steps 1 straight.', f: 'It only fights for the pure of heart. And the winning side.' },
    turtle:    { d: 'Conjure a Battle Turtle on a random empty square. It creeps 1 square straight — but refuses to fall easily.', f: 'Slow and steady captures the castle.' },
    reaper:    { d: 'Conjure the Reaper on a random empty square. It glides like a queen and blinks 2 squares in any direction.', f: 'There is no negotiation. Only harvest.' }
  };

  const order = ['goblin', 'ranger', 'dwarf', 'harpy', 'golem', 'sphinx', 'lich', 'treant', 'griffon', 'manticore',
    'vampire', 'basilisk', 'djinn', 'owlbear', 'banshee', 'hydra', 'tiger', 'unicorn', 'turtle', 'reaper'];

  MD.AB_5 = order.map((key, i) => {
    const t = line(key);
    const m = M[key];
    return {
      id: 201 + i,
      name: 'Summon ' + t.name,
      icon: t.icon,
      rarity: t.rar,
      cat: 'Summon',
      troop: key,
      desc: m.d,
      flavor: m.f,
      target: 'auto',
      run: (g, s) => Fx.summonN(g, s, key, 1)
    };
  });
})();

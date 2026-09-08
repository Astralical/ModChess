/* ============================================================
   Mod Chess — Ability set 21: HEROES (传奇英雄)
   IDs 1010-1029. Twenty legendary heroes from history, myth,
   legend, folklore & anime take the field. Each hero is a MYTHIC
   (rarity 5) summon carrying its OWN unique banner trick — see
   js/heroes.js (MD.Heroes) for the twenty powers. They are rare,
   mighty, and change the board around them.
   ============================================================ */
(function () {
  const root = (typeof window !== 'undefined' ? window : globalThis);
  const MD = root.MD;
  const E = MD.Engine, Fx = MD.Fx;
  const O = c => (c === 'w' ? 'b' : 'w');
  const pname = t => (MD.pieceName ? MD.pieceName(t) : t);
  const bd = g => Fx.bd(g);
  const backRows = (g, s) => Fx.backRows(g, s);
  const ownRows = (g, s) => Fx.ownHalfRows(g, s);
  const summon = (g, s, type) => Fx.summonN(g, s, type, 1, { rows: ownRows(g, s) }) || [];
  const A = [];
  const def = (id, name, rarity, cat, icon, desc, flavor, run) => A.push({ id, name, rarity, cat, icon, desc, flavor, target: 'auto', run });

  // helper: summon a hero onto your own half
  const callHero = (type, heroName, powerText) => (g, s) => {
    const lines = summon(g, s, type);
    if (!lines.length) return ['The legends cannot find a foothold.'];
    return ['Summoned ' + heroName + '.'].concat(lines);
  };

  // — HISTORY —
  def(1010, 'Conquest Unending', 5, 'Heroes', 'sword', 'Summon Alexander the Great. Conquest: once he has taken a piece, every one of his turns he crushes the weakest enemy on the board — war never ends.', 'There are no more worlds to conquer.', (g, s) => callHero('alexander', 'Alexander the Great', '')(g, s));
  def(1011, 'The Eagle Standard', 5, 'Heroes', 'flag', 'Summon Julius Caesar. Imperium: each of his turns he reads the field — the foe nearest him is frozen, or if it is a mere pawn it defects and marches for Rome.', 'Veni, vidi, vici.', (g, s) => callHero('caesar', 'Julius Caesar', '')(g, s));
  def(1012, 'Spartacus Revolts', 5, 'Heroes', 'fire', 'Summon Spartacus. Revolt: each of his turns an enslaved pawn beside him breaks its chains and joins your army.', 'I am Spartacus.', (g, s) => callHero('spartacus', 'Spartacus', '')(g, s));
  def(1013, 'Elephants Over the Alps', 5, 'Heroes', 'storm', 'Summon Hannibal Barca. Stampede: every turn, his war-elephants trample the neighbours of the square he stands on into frozen terror.', 'We will find a way, or make one.', (g, s) => callHero('hannibal', 'Hannibal Barca', '')(g, s));
  def(1014, 'The Mongol Horde', 5, 'Heroes', 'wind', 'Summon Genghis Khan. Horde: each of his turns he calls another warhorse to the field while fewer than three ride with him.', 'I am the punishment of God.', (g, s) => callHero('genghis', 'Genghis Khan', '')(g, s));
  def(1015, 'Le Grande Armée', 5, 'Heroes', 'crown', 'Summon Napoleon. Marshal: each of his turns every friendly piece on his file and the two beside it is braced with a shield — his corps holds the line.', 'Victory belongs to the most persevering.', (g, s) => callHero('napoleon', 'Napoleon', '')(g, s));
  def(1016, 'The Art of War', 5, 'Heroes', 'lock', 'Summon Sun Tzu. Art of War: each of his turns the enemy closest to your King is quietly marked — at the end of its own turn it succumbs. Victory without battle.', 'Supreme excellence consists of breaking the enemy\'s resistance without fighting.', (g, s) => callHero('sunzu', 'Sun Tzu', '')(g, s));
  def(1017, 'This Is Sparta', 5, 'Heroes', 'shield', 'Summon Leonidas. Phalanx: while brothers stand beside him, he and every adjacent ally raise the shield wall; alone, even a king is exposed.', 'Tonight we dine in hell.', (g, s) => callHero('leonidas', 'Leonidas', '')(g, s));

  // — MYTH & FOLKLORE —
  def(1018, 'The King of Heroes', 5, 'Heroes', 'target', 'Summon Gilgamesh. Hunt: each of his turns he hunts in straight lines, bringing down the nearest beast he can see.', 'Shamhat unlocked the wild man\'s heart.', (g, s) => callHero('gilgamesh', 'Gilgamesh', '')(g, s));
  def(1019, 'The Twelve Labours', 5, 'Heroes', 'star', 'Summon Hercules. Labours: he grows mightier every turn — at his fourth labour he crushes an adjacent foe, at his eighth the gods ward his back, at his twelfth he is unstoppable.', 'Strength is not given — it is earned.', (g, s) => callHero('hercules', 'Hercules', '')(g, s));
  def(1020, 'Odin\'s Einherjar', 5, 'Heroes', 'skull', 'Summon Odin. Valhalla: each of his turns a fallen warrior is raised to fight again at your side.', 'The valiant shall feast forever.', (g, s) => callHero('odin', 'Odin', '')(g, s));
  def(1021, 'Mjölnir\'s Storm', 5, 'Heroes', 'storm', 'Summon Thor. Storm: every other turn Mjölnir arcs — every enemy on his file and rank is frozen in thunder.', 'Whosoever holds this hammer…', (g, s) => callHero('thor', 'Thor', '')(g, s));
  def(1022, 'Seventy-Two Transformations', 5, 'Heroes', 'spark', 'Summon Sun Wukong. Clones: each of his turns he plucks a hair and a monkey-clone (an Imp) springs up beside him.', 'The Great Sage, Equal to Heaven.', (g, s) => callHero('sunwukong', 'Sun Wukong', '')(g, s));
  def(1023, 'From the Peach', 5, 'Heroes', 'heart', 'Summon Momotaro. Companions: each of his turns a companion — his dog, monkey or pheasant — rallies to his side.', 'The Peach Boy and his loyal friends.', (g, s) => callHero('momotaro', 'Momotaro', '')(g, s));
  def(1024, 'Anansi\'s Web', 5, 'Heroes', 'drop', 'Summon Anansi. Web: each of his turns the nearest foe is caught fast in silk — and an adjacent one is also bitten with venom.', 'Trickster of the thousand stories.', (g, s) => callHero('anansi', 'Anansi', '')(g, s));

  // — LEGEND & EPIC —
  def(1025, 'Steal From the Rich', 5, 'Heroes', 'target', 'Summon Robin Hood. Outlaw: each of his turns, while any richer foe stands, the mightiest enemy is robbed of its power and he is warded.', 'Rob the rich to feed the poor.', (g, s) => callHero('robinhood', 'Robin Hood', '')(g, s));
  def(1026, 'The Sword in the Stone', 5, 'Heroes', 'sword', 'Summon King Arthur. Excalibur: each of his turns the sword cleaves whatever stands directly before him.', 'The once and future king.', (g, s) => callHero('arthur', 'King Arthur', '')(g, s));
  def(1027, 'Slayer of Grendel', 5, 'Heroes', 'storm', 'Summon Beowulf. Slayer: he grapples monsters, not men — an adjacent custom troop is torn apart, an ordinary man is frozen in awe.', 'Fate goes ever as fate must.', (g, s) => callHero('beowulf', 'Beowulf', '')(g, s));
  def(1028, 'Spirit of the Saiyan', 5, 'Heroes', 'star', 'Summon Goku (anime). Zenkai: every capture charges his spirit — once it reaches two bars he unleashes a wave that blasts the mightiest foe in his sight.', 'It\'s over 9000!', (g, s) => callHero('goku', 'Goku', '')(g, s));
  def(1029, 'Mulan Rides North', 5, 'Heroes', 'wind', 'Summon Mulan. Disguise: each of her turns she slips into the enemy line — the foe in front of her hesitates (frozen) and she hides herself in living mist.', 'The flower that blooms in adversity.', (g, s) => callHero('mulan', 'Mulan', '')(g, s));

  root.MD.AB_21 = A;
})();

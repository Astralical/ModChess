# ♞ Mod Chess — Ability Chess

A chess web app in the visual spirit of chess.com — **but every turn, both players
are dealt spells from a pool of 506 unique fantasy abilities** and must
cast **one** before moving. Spells can buff your army, curse the enemy, warp the
board, or reshape reality itself. When a spell is cast, **both sides always see it**
— a cinematic reveal, an on-screen effect readout, and a running battle log.

## ✨ Features

- **Chess, fully implemented** — legal move generation, castling, en passant,
  promotion (with picker), check/checkmate/stalemate, 50-move & insufficient-material draws.
- **Two game modes**
  - 🤖 **vs Computer** — 3 strengths (Easy / Normal / Hard), alpha-beta search with quiescence.
    Choose to play as **White or Black** from the menu.
  - 👥 **Two Players** — local pass-and-play.
- **The Ability system**
  - **506 hand-written spells**, each with its own icon, rarity (Common/Rare/
    Epic/Legendary), rules text, and flavor line.
    Browse all of them in the **Ability Codex**.
  - Each turn a player draws spells (Classic/Draft give a choice) and **must cast 1**
    before moving — no skipping. No two people ever see the same game twice.
  - **When a spell is used the game announces its exact effects** (burst text + toasts +
    battle-log entries), so both sides always know what just happened.
  - Categories: Attack, Curse, Buff, Summon, Transform, Chaos, Status, Time,
    Kingship, Economy, Luck — everything from *Fireball* to *Black Hole*, *Possession*,
    *Time Warp*, *Ragnarok*… and the 36 Stratagems.
  - **Five themed families** stack on the core: 🐺 **The Wild** (beasts & forests),
    🌌 **The Void** (stars & entropy), 🤖 **The Machine** (sci-fi robots & lasers),
    🎪 **Carnival of Miracles** (tricksters & circus), and 🏛️ **Legends & Myths**
    (gods & titans) — 50 spells each, several with summons.
  - A **balance & de-duplication pass** (js/rebalance.js) assigns every card a consistent
    rarity ladder and makes overlapping “same effect, different name” spells mechanically
    distinct (no two spells in the codex are synonyms).
  - Target-spells highlight valid squares for you to click.
  - Spell reveals are visible to **both** players (cards in hand are face-down for the opponent).
- **Custom summoned troops (25 creatures)** — summons now conjure real, unique units instead
  of reskinned pawns/rooks/queens. Each has its own emoji token and its own movement:
  Imps skitter, Warhorses leap-and-dart, Guardians slide and guard, Phoenixes move like a
  queen **and** strike like a knight… plus 20 more: Goblin, Ranger, Dwarf, Harpy, Golem,
  Sphinx, Lich, Treant, Griffon, Manticore, Vampire, Basilisk, Djinn, Owlbear, Banshee,
  Hydra, Tiger, Unicorn, Battle Turtle and the Reaper.
- **chess.com-style settings** — enable **premoves** (vs computer, they auto-fire on
  your turn), auto-queen, show legal moves, highlight last move, auto-castle, sound,
  animations, and board themes (**Green / Wood / Slate**). Settings persist locally.
- **Polished UI** — drag-and-drop *and* click-to-move, legal-move dots, last-move and
  check highlights, captured-piece trays, a moves log, a battle log, sound effects,
  smooth animations, board flip, and a chess.com-like look (original wood textures +
  an original flat vector piece set).

## ▶️ Running

No build step, no server, no dependencies — just open the file in any modern browser:

```
open index.html
```

Or serve it however you like (e.g. `python3 -m http.server`).

## 🎮 How a turn works

1. When it's your turn, spells are dealt on the right panel.
2. You **must cast one** (click a card). If it needs a target, the board lights up
   the legal squares — click one. The cast is announced to both players.
3. Make a **chess move** (drag or click) — moving is blocked until you've cast.
   The turn passes, and the next player (or the computer) draws their spells.

Watch the statuses: pieces can be **❄ frozen** (can't move their next turn),
**🛡 shielded** (can't be captured next turn), or **☠ poisoned** (detonates at the
end of its owner's next turn — taking nearby enemies with it). Losing your king
loses the game, and yes — some legendary spells target it directly.

## 📁 Project layout

```
index.html            main markup (board, panels, modals)
css/styles.css        chess.com-inspired styling + themes
js/pieces.js          original SVG vector piece set
js/engine.js          full chess engine (rules, statuses, custom troops) — pure data
js/troops.js          25 custom summonable troops (movement + emoji tokens)
js/effects.js         effect toolkit used by the 506 abilities (Fx)
js/abilities_1..4.js  the 200 core ability definitions (50 per file)
js/abilities_5.js     20 troop-summon abilities
js/abilities_6.js     36 stratagems (三十六计)
js/abilities_7.js     50 spells — The Wild
js/abilities_8.js     50 spells — The Void
js/abilities_9.js     50 spells — The Machine (sci-fi/robotic)
js/abilities_10.js    50 spells — Carnival of Miracles
js/abilities_11.js    50 spells — Legends & Myths
js/abilities_index.js registry + draw/cast logic
js/rebalance.js       rarity ladder + de-duplication pass
js/ai.js              bot: alpha-beta search + ability selection
js/ui.js              rendering, drag & drop, cards, overlays, codex, settings
js/main.js            game state machine / orchestration
js/meta.js            local profile, match history recorder + game analysis
js/online.js          Supabase auth / profile / ELO bridge (off until configured)
scripts/*.js          headless tests (run with node)
supabase/schema.sql   run once in your Supabase SQL editor
vercel.json           static hosting config for Vercel
```

## 🧪 Tests

```
node scripts/test_engine.js     # chess rules + troop movement (32 checks)
node scripts/test_abilities.js  # all 506 abilities dry-run without errors
node scripts/test_bot.js        # headless bot-vs-bot games
```

## 👤 Profile, history & analysis (local, no server needed)

- The **player chips** around the board now look like chess.com: avatar, your username
  and rating, and a **captured-pieces tray** under each name showing what each side has
  taken plus the material edge (`+N`).
- **Profile** (top bar) lets you set your display name; a local rating (start 1200)
  is adjusted after each game vs the computer (Easy≈1000 / Normal≈1200 / Hard≈1400).
- **History** (top bar) records every finished game with a full move + spell timeline.
- **Analyse** on any past game opens a board viewer — step forward/back with ◀ ▶,
  autoplay, click any move in the list, and watch both capture trays update.

## 🌐 Going online (GitHub → Vercel → Supabase)

This is a fully static site, so it's easy to put live. Accounts are **email + password**
(Supabase Auth), with a **username + ELO** on a `profiles` table and matches synced over
Supabase Realtime.

1. **Push to GitHub**
   ```
   git init && git add -A && git commit -m "Mod Chess"
   gh repo create mod-chess --public --source=. --push   # or add your remote + git push
   ```
2. **Deploy to Vercel** — import the repo (or `vercel --prod`). It's static; the included
   `vercel.json` already handles it. You'll get a public `https://your-site.vercel.app`.
3. **Create a Supabase project**, then in the SQL editor run **`supabase/schema.sql`**
   (profiles + matches + realtime moves, with row-level security).
4. Open the app **from the deployed https URL** (auth needs https, not `file://`),
   open **Profile → Play Online**, expand **Configure Supabase**, and paste your
   project URL + **anon (public)** key (Settings → API). They are stored only in the
   browser and can also be injected at build time via `window.MODCHESS_CONFIG`.
   - Email confirmation: for dev you can turn it off in Supabase Auth → Settings.
5. Users sign up (email + password + username), their profile/ELO row is created
   automatically, ratings update after matches, and the `matches`/`moves` tables carry
   live games between two signed-in users.

> The auth + profile/ELO layer is wired and ready in `js/online.js`; finish the
> **room/matchmaking** screen (lobby → open match → subscribe to its `moves` channel)
> to go fully 1-vs-1 live. Everything it needs is in the schema.

## ℹ️ Notes

- Original code and artwork — the board texture and pieces are drawn from scratch
  in a chess.com *style* (no proprietary assets are included).
- Ability balance is deliberately **wild and swingy** — that's the point of the mod.
  Insta-win mechanics have been removed — **no spell can ever remove a king** (blasts,
  rays and file/rank sweeps all spare the monarch). Strong cards are high-rarity.
- Summoned **troops** are real, moving pieces (not reskinned pawns/rooks): the engine
  generates their moves and tracks checks from them, and they show as unique emoji
  tokens on the board.
- Every turn you **must cast one spell and then move** (no skipping). Spells that
  grant an extra turn only let you **move** on the bonus turn — no second spell.
- **Spell modes** (choose in the menu): **Classic** (pick 1 of 3), **Chaos** (fate casts
  one random spell for you), **Draft** (pick 1 of 4), **Echo** (your spell is copied
  into your opponent's hand next turn).


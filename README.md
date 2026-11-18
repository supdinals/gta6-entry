[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/supdinals/gta6-entry/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/supdinals/gta6-entry/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
# NEON TIDE — Palmira Bay

An original open-world crime game for the make.fun **gta6-01** bounty ("Make GTA 6").
You are **Rio Vale**, a courier in the sun-drenched port city of **Palmira Bay**. Smuggler-queen
Mara Sol hires you for one small delivery — it becomes a five-mission story of theft, a police
sting, a checkpoint race and one last tide to ride.

Everything is original: the city, characters, vehicles, names, story, art and sounds are made
for this game. No names, logos, characters, maps or assets from any commercial game.

## What is in the game

- A 3D coastal city you explore **on foot and by car**: road grid, varied procedural buildings,
  sidewalks, street lamps, palm trees, a beach, a pier and the sea, under bright sun with shadows.
- **Traffic** that cruises the grid, slows for obstacles and stops for you; **pedestrians**
  strolling the sidewalks who flee from danger.
- **Stealable cars**: walk up and press **E** to get in, drive with arcade physics and a chase
  camera, press **E** again to get out.
- **Wanted level (1–5 stars)** and **PBPD police** who spawn, chase, ram and box you in.
  Hide out of sight to cool down. Get cornered or wrecked and it is **BUSTED / WASTED**, then respawn.
- **Five story missions** with dialog, gold world markers and minimap targets, cash rewards,
  a locked-wanted escape and a checkpoint race.
- **Combat**: punch with **F / click**, shoot with **Shift+F**, health bar and damage feedback.
- **Full HUD**: round minimap (roads, traffic, police blips, mission marker), wanted stars,
  money, health, vehicle name and speed, mission objective, in-game clock.
- **Start screen** with the story intro, **pause menu**, **help screen**, and a
  **localStorage save** (money, missions, position) with Continue.
- All sound is **procedural WebAudio**: engine, horn, siren, punches, shots, crashes, jingles.
- The only library is **three.js**, vendored as a minified module under `game/vendor/`;
  everything else is hand-written ES modules, one job per file, no build step, no network.

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrows | Move / drive |
| E | Enter / steal / exit a car |
| F or Click | Punch (in a car: shoot) |
| Shift+F | Shoot on foot · Shift alone: sprint |
| Space | Handbrake |
| H | Horn |
| Esc / P | Pause |
| Enter | Advance dialog |

## Play it locally

```sh
node serve.ts          # serves game/ on a local port, then open it in desktop Chrome
```

Node 22 or later is enough — there is nothing to install and no build step.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output and writes the dossier.
- `game/index.html`, `game/css/hud.css` — page and HUD styling.
- `game/js/` — the game source, one module per system (`city-layout`, `buildings`, `vehicles`,
  `traffic`, `pedestrians`, `player-on-foot`, `police`, `wanted`, `missions`, `story-dialog`,
  `combat`, `minimap`, `hud`, `audio-synth`, `save-game`, `input`, `chase-camera`, `main`).
- `game/vendor/three.module.min.js` — vendored three.js (MIT, its own license header inside).
- `screenshots/` — four real renders of this game in a browser; the first is the cover.

## License

MIT — see `LICENSE`. three.js is MIT-licensed by its authors (header in the vendored file).

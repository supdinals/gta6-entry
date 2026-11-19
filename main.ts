// NEON TIDE — Palmira Bay, gta6-01 entry, Neon Tide improvement-round build.
// This is the round where the already-playable game gets its polish pass:
// richer facades and rooftops, marked crossings, and a livelier HUD, on top of
// the original open-world base — a drivable Palmira Bay with traffic,
// pedestrians, stealable cars, a 1-to-5 star wanted system with chasing
// police, five story missions, combat, a live minimap, procedural WebAudio
// sound and a localStorage save, all running fully offline in desktop Chrome
// from the plain static files under game/ on a vendored three.js module.
// My job in this file stays deliberately boring, and it has not changed in
// this round: copy game/ and screenshots/ from beside this file into the
// output folder, then write dossier.json there with buildDossier from
// vendor/makefun-game.ts, exactly as the kit's starter does, so the sealed
// scorer can rebuild the same dossier byte for byte and compare.
// Play it locally with `node serve.ts`, then open the local address it prints.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
console.log(`Neon Tide: staging game/ and screenshots/ into ${out} and writing dossier.json there.`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
// Screenshots go over one file at a time in filename order, so the staged
// set is deterministic no matter what order the filesystem hands them back:
// the cover first, then the walk, the coastal drive and the mission shot.
// The dossier only records file names and contents, and the names were
// already alphabetical, so this reordering changes no byte of dossier.json.
const shotsDir = join(here, 'screenshots');
mkdirSync(join(out, 'screenshots'), { recursive: true });
let shotCount = 0, shotBytes = 0;
if (existsSync(shotsDir)) {
  for (const name of readdirSync(shotsDir).sort()) {
    const from = join(shotsDir, name);
    if (!statSync(from).isFile()) continue;
    copyFileSync(from, join(out, 'screenshots', name));
    shotCount++;
    shotBytes += statSync(from).size;
  }
}
console.log(`Neon Tide: staged ${shotCount} screenshots (${shotBytes} bytes) into ${out}.`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

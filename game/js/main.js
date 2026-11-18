// main.js — boots Neon Tide, owns the game loop and wires every system of Palmira Bay together.
import * as THREE from 'three';
import { buildCity, resolveCollisions } from './buildings.js';
import { CITY, PLACES, clampToCity, distance2d } from './city-layout.js';
import { createInput } from './input.js';
import { PlayerOnFoot } from './player-on-foot.js';
import { TrafficSystem } from './traffic.js';
import { PedestrianSystem } from './pedestrians.js';
import { PoliceSystem } from './police.js';
import { WantedSystem, CRIMES } from './wanted.js';
import { MissionSystem } from './missions.js';
import { StoryDialog, INTRO_LINES } from './story-dialog.js';
import { CombatSystem } from './combat.js';
import { AudioSynth } from './audio-synth.js';
import { Hud } from './hud.js';
import { drawMinimap } from './minimap.js';
import { ChaseCamera } from './chase-camera.js';
import { saveGame, loadGame, clearSave, hasSave } from './save-game.js';

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0xaee2f5, 120, 420);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
const sun = new THREE.DirectionalLight(0xfff2c8, 2.6);
sun.position.set(90, 130, 60); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -160; sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160; sun.shadow.camera.bottom = -160;
sun.shadow.camera.far = 420;
scene.add(sun); scene.add(sun.target);
scene.add(new THREE.HemisphereLight(0xbfe8ff, 0xffe0a3, 0.95));
const colliders = buildCity(scene);

const input = createInput();
const audio = new AudioSynth();
const hud = new Hud();
const dialog = new StoryDialog(document.getElementById('dialog-box'), document.getElementById('dialog-speaker'), document.getElementById('dialog-text'));
const player = new PlayerOnFoot(scene);
const traffic = new TrafficSystem(scene, 14);
const peds = new PedestrianSystem(scene, 26);
const police = new PoliceSystem(scene);
const wanted = new WantedSystem();
const chaseCam = new ChaseCamera(camera);
const combat = new CombatSystem(scene, audio, wanted, { onCrime: (t) => hud.toast(t, 1.6) });

const G = {
  mode: 'menu', money: 120, day: 1, gameMinutes: 9 * 60, inCar: null,
  paused: false, damageFlash: 0, crimeCooldown: 0, storyDone: false,
  started: false, hitCooldown: 0,
};
const missions = new MissionSystem(scene, dialog, {
  onReward: (amount, m) => { G.money += amount; audio.missionDone(); hud.toast(`Mission passed! +$${amount} — ${m.title}`, 3.4); persist(); },
  onLockWanted: (stars) => { wanted.setLocked(stars); hud.toast('WANTED — lose the police!', 3); },
  onStart: (m) => { hud.toast(`Mission: ${m.title}`, 2.6); },
  onCheckpoint: (n) => { audio.coin(); hud.toast(`Checkpoint ${n} cleared!`, 1.8); },
  onPickup: () => { audio.coin(); hud.toast('Ledger picked up — get to Sunset Pier!', 2.6); },
  onStoryComplete: () => { G.storyDone = true; wanted.clearLock(); hud.toast('STORY COMPLETE — Palmira Bay is yours!', 5); persist(); },
});

// Simple particle pool for dust, sparks and sea spray.
const P_COUNT = 240;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P_COUNT * 3); const pVel = [];
for (let i = 0; i < P_COUNT; i++) { pPos[i * 3 + 1] = -50; pVel.push({ x: 0, y: 0, z: 0, life: 0 }); }
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffe082, size: 0.55, transparent: true, opacity: 0.9 }));
scene.add(particles);
let pNext = 0;
function burst(x, y, z, n, color) {
  particles.material.color.setHex(color || 0xffe082);
  for (let k = 0; k < n; k++) {
    const i = pNext; pNext = (pNext + 1) % P_COUNT;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    pVel[i] = { x: (Math.random() - 0.5) * 7, y: Math.random() * 5 + 1, z: (Math.random() - 0.5) * 7, life: 0.5 + Math.random() * 0.5 };
  }
}
function updateParticles(dt) {
  for (let i = 0; i < P_COUNT; i++) {
    if (pVel[i].life <= 0) continue;
    pVel[i].life -= dt; pVel[i].y -= 9 * dt;
    pPos[i * 3] += pVel[i].x * dt; pPos[i * 3 + 1] += pVel[i].y * dt; pPos[i * 3 + 2] += pVel[i].z * dt;
    if (pVel[i].life <= 0) pPos[i * 3 + 1] = -50;
  }
  pGeo.attributes.position.needsUpdate = true;
}

function persist() { saveGame({ money: G.money, missionIndex: missions.index, playerPos: player.pos, health: player.health, day: G.day }); }
function nearestCar(maxDist) {
  let best = null, bd = maxDist;
  for (const v of traffic.allDrivable()) { const d = distance2d(player.pos, v.pos); if (d < bd) { bd = d; best = v; } }
  return best;
}
function enterCar(v) {
  G.inCar = v; v.driver = 'player'; v.parked = false; player.mesh.visible = false;
  const witnessed = peds.peds.some((p) => distance2d(p.pos, player.pos) < 22) || police.cars.length > 0;
  const wasParked = traffic.parked.includes(v);
  if (wasParked || witnessed) { /* parked cars are free game in the bay; moving traffic theft is witnessed */ }
  if (!wasParked) { wanted.addCrime(CRIMES.stealCar, 'grand theft auto'); hud.toast('Vehicle stolen!', 1.8); }
  audio.ensure();
}
function exitCar() {
  if (!G.inCar) return;
  const v = G.inCar; v.driver = null; G.inCar = null;
  player.pos.set(v.pos.x + Math.cos(v.angle) * 2.4, 0, v.pos.z - Math.sin(v.angle) * 2.4);
  player.mesh.visible = true; audio.setEngine(0);
}
function respawn() {
  document.getElementById('end-screen').classList.add('hidden');
  wanted.clear(); police.clearAll(); player.healFull();
  player.pos.set(PLACES.depot.x + 8, 0, PLACES.depot.z - 8);
  if (G.inCar) exitCar();
  G.money = Math.max(0, G.money - 100); G.mode = 'play';
}
function showEnd(kind) {
  G.mode = 'ended';
  document.getElementById('end-title').textContent = kind === 'busted' ? 'BUSTED' : 'WASTED';
  document.getElementById('end-title').style.color = kind === 'busted' ? '#42a5f5' : '#ff5252';
  document.getElementById('end-text').textContent = kind === 'busted'
    ? 'The PBPD finally boxed you in. You pay a $100 fine and walk out of the station at dawn.'
    : 'You wake up at Palmira General. The nurses bill you $100 and keep your dignity.';
  document.getElementById('end-screen').classList.remove('hidden');
  audio.setEngine(0);
}
function startStory(fromSave) {
  audio.ensure();
  document.getElementById('start-screen').classList.add('hidden');
  hud.show(); G.mode = 'play'; G.started = true;
  if (fromSave) {
    const s = loadGame();
    if (s) { G.money = s.money ?? G.money; missions.index = s.missionIndex || 0; player.pos.set(s.x ?? player.pos.x, 0, s.z ?? player.pos.z); player.health = s.health || 100; G.day = s.day || 1; }
    missions.startNext(); hud.toast('Welcome back to Palmira Bay', 2.4);
  } else {
    clearSave(); missions.index = 0;
    dialog.show(INTRO_LINES, () => missions.startNext());
  }
}
document.getElementById('btn-start').addEventListener('click', () => startStory(false));
document.getElementById('btn-continue').addEventListener('click', () => startStory(true));
if (!hasSave()) document.getElementById('btn-continue').style.opacity = '0.55';
document.getElementById('btn-help').addEventListener('click', () => { document.getElementById('help-screen').classList.remove('hidden'); });
document.getElementById('btn-help-back').addEventListener('click', () => document.getElementById('help-screen').classList.add('hidden'));
document.getElementById('btn-respawn').addEventListener('click', respawn);
document.getElementById('btn-resume').addEventListener('click', () => togglePause(false));
document.getElementById('btn-save').addEventListener('click', () => { persist(); hud.toast('Game saved', 2); });
document.getElementById('btn-restart').addEventListener('click', () => { clearSave(); location.reload(); });
function togglePause(force) {
  G.paused = force !== undefined ? force : !G.paused;
  document.getElementById('pause-screen').classList.toggle('hidden', !G.paused);
}
canvas.addEventListener('click', () => { if (G.mode === 'play' && !dialog.isOpen()) canvas.requestPointerLock && canvas.requestPointerLock(); });

function playerSpeedValue() { return G.inCar ? Math.abs(G.inCar.speed) : 0; }
function activePos() { return G.inCar ? G.inCar.pos : player.pos; }
function activeAngle() { return G.inCar ? G.inCar.angle : player.angle; }

function stageShot(mode) {
  startStory(false);
  dialog.hide(); missions.phase = 'active';
  // Let the world settle first, then place the scene, so nothing drifts into a wall before the render.
  for (let i = 0; i < 30; i++) stepGame(1 / 30, true);
  if (mode === 'chase') {
    missions.index = 2; missions.setMarker(PLACES.hideout); wanted.heat = 72; wanted.recalc();
    const v = traffic.parked[0]; v.pos.set(3.4, 0, 16); v.angle = 0; enterCar(v); v.speed = 13;
    player.pos.set(3.4, 0, 16);
    police.spawn({ x: 0, z: 0 }); police.spawn({ x: 0, z: 0 }); police.spawn({ x: 0, z: 0 }); police.spawn({ x: 0, z: 0 });
    police.cars.forEach((c, i) => { c.pos.set(-3.5 + (i % 2) * 7, 0, 7 - Math.floor(i / 2) * 10 - (i % 2) * 3); c.angle = 0; c.speed = 12; });
    hud.toast('PBPD IN PURSUIT!', 9);
  } else if (mode === 'walk') {
    missions.index = 0; missions.setMarker(PLACES.cafe);
    player.pos.set(16, 0, -25); player.angle = 2.4;
    peds.peds.forEach((p, i) => { if (i < 9) { p.pos.set(9 + i * 2.6, 0, -27 + (i % 3) * 6); } });
    const t = traffic.cars[1]; t.pos.set(40, 0, -35.4); t.angle = Math.PI / 2; t.speed = 7; t.cruiseSpeed = 7;
    t.target = { x: 64, z: -35.4 };
  } else if (mode === 'drive') {
    missions.index = 1; missions.setMarker(PLACES.marina);
    const v = traffic.parked[2]; v.pos.set(96, 0, 163.4); v.angle = Math.PI / 2; enterCar(v); wanted.clear(); v.speed = 14;
  } else if (mode === 'mission') {
    missions.index = 0; missions.setMarker(PLACES.cafe);
    player.pos.set(48, 0, -14); player.angle = 0.9;
    dialog.show([['Mara Sol', 'The crate goes to Cafe Brisa, Rio — gold marker, east side. Do not open it, do not be late.'],
                  ['Rio Vale', 'Cafe Brisa. Gold marker on my map. On my way.']]);
  }
  // Settle camera behind the subject instantly, run a few frames so police and traffic are mid-motion.
  const p = activePos(); chaseCam.angle = activeAngle();
  chaseCam.pos.set(p.x - Math.sin(chaseCam.angle) * 10, 5, p.z - Math.cos(chaseCam.angle) * 10);
  for (let i = 0; i < 7; i++) stepGame(1 / 30, true);
  renderer.render(scene, camera);
  G.shotFrozen = true;
  window.__shotReady = true;
}

let last = performance.now();
function stepGame(dt, staging = false) {
  G.gameMinutes += dt * 2.2; if (G.gameMinutes >= 1440) { G.gameMinutes -= 1440; G.day++; }
  const pos = activePos();
  sun.position.set(pos.x + 90, 130, pos.z + 60); sun.target.position.set(pos.x, 0, pos.z);
  if (scene.userData.sea) scene.userData.sea.position.y = -0.25 + Math.sin(performance.now() / 900) * 0.07;
  if (!staging && G.mode === 'play' && !G.paused) {
    if (input.wasPressed('Enter') && dialog.isOpen()) dialog.advance();
    if ((input.wasPressed('Escape') || input.wasPressed('KeyP'))) togglePause();
    if (input.wasPressed('KeyH') && G.inCar) audio.horn();
    if (!dialog.isOpen() && !G.paused) {
      if (G.inCar) {
        G.inCar.updateDriving(dt, input, audio);
        clampToCity(G.inCar.pos); resolveCollisions(G.inCar.pos, 1.6, colliders);
        player.pos.copy(G.inCar.pos);
        if (input.wasPressed('KeyE')) exitCar();
        if (input.takeClick()) combat.tryShoot(player, peds, true);
        // Car vs car / ped collisions.
        for (const v of traffic.allDrivable()) {
          if (v === G.inCar) continue;
          if (distance2d(v.pos, G.inCar.pos) < 3.6 && Math.abs(G.inCar.speed) > 6 && G.hitCooldown <= 0) {
            G.hitCooldown = 0.8; audio.crash(); chaseCam.addShake(0.4); burst(v.pos.x, 1, v.pos.z, 10, 0xffcc80);
            wanted.addCrime(CRIMES.hitCar, 'hit and run'); G.inCar.speed *= 0.45; v.speed = 6;
          }
        }
        const ped = peds.nearest(G.inCar.pos, 2.2);
        if (ped && Math.abs(G.inCar.speed) > 5 && G.hitCooldown <= 0) {
          G.hitCooldown = 0.8; ped.down = 5; ped.health = 0; audio.crash();
          wanted.addCrime(CRIMES.hitPed, 'vehicular assault'); player.hurt(4);
        }
      } else {
        player.update(dt, input, chaseCam.angle, colliders);
        if (input.wasPressed('KeyE')) { const v = nearestCar(4.2); if (v) enterCar(v); }
        if (input.wasPressed('KeyF') || input.takeClick()) {
          if (input.held.ShiftLeft) combat.tryShoot(player, peds, false); else combat.tryPunch(player, peds);
        }
      }
    }
  }
  G.hitCooldown = Math.max(0, G.hitCooldown - dt);
  traffic.update(dt, G.inCar ? null : player.pos);
  const threat = (G.inCar && Math.abs(G.inCar.speed) > 14) ? G.inCar.pos : null;
  peds.update(dt, threat);
  let seen = false;
  if (G.mode === 'play' || staging) {
    seen = police.update(dt, wanted, pos, playerSpeedValue(), (kind) => {
      if (kind === 'ram') { player.hurt(7); G.damageFlash = 0.55; chaseCam.addShake(0.35); burst(pos.x, 1, pos.z, 8, 0xff8a65); if (player.health <= 0) showEnd('wasted'); }
      else if (kind === 'busted' && G.mode === 'play') showEnd('busted');
    });
  }
  wanted.update(dt, seen);
  audio.sirenTick(dt, wanted.stars > 0);
  if (!G.inCar) audio.setEngine(0);
  combat.update(dt);
  if (G.mode === 'play' && !dialog.isOpen()) missions.update(dt, pos, !!G.inCar);
  updateParticles(dt);
  chaseCam.update(dt, pos, activeAngle(), !!G.inCar, playerSpeedValue());
  G.damageFlash = Math.max(0, G.damageFlash - dt * 1.6);
  // HUD + minimap.
  const m = missions.current();
  const target = missions.target();
  hud.update({
    money: G.money, wanted, gameMinutes: G.gameMinutes, day: G.day,
    missionTitle: G.storyDone ? 'NEON TIDE — STORY COMPLETE' : (m ? `Mission ${missions.index + 1}/5 · ${m.title}` : 'Free Roam'),
    objective: dialog.isOpen() ? 'On a call…' : missions.objectiveText(),
    missionDistance: (missions.phase === 'active' && target) ? distance2d(pos, target) : null,
    health: player.health, vehicleName: G.inCar ? G.inCar.name : '', speedKmh: G.inCar ? G.inCar.speedKmh() : 0,
    prompt: !G.inCar && nearestCar(4.2) ? 'Press E to enter ' + nearestCar(4.2).name : (G.inCar ? 'E exit · H horn · Click shoot' : ''),
    damageFlash: G.damageFlash,
  }, dt);
  if (G.started) drawMinimap(document.getElementById('minimap'), {
    playerPos: pos, playerAngle: activeAngle(), trafficCars: traffic.cars, policeCars: police.cars, peds: peds.peds, missionTarget: missions.phase === 'active' ? target : null,
  });
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!G.paused && !G.shotFrozen) stepGame(dt);
  renderer.render(scene, camera);
  input.endFrame();
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

window.NEONTIDE = {
  getState: () => ({
    mode: G.mode, inCar: !!G.inCar, vehicleName: G.inCar ? G.inCar.name : null,
    playerPos: { x: +player.pos.x.toFixed(1), z: +player.pos.z.toFixed(1) },
    carPos: G.inCar ? { x: +G.inCar.pos.x.toFixed(1), z: +G.inCar.pos.z.toFixed(1) } : null,
    carSpeed: G.inCar ? +G.inCar.speed.toFixed(1) : 0,
    wantedStars: wanted.stars, wantedHeat: Math.round(wanted.heat),
    missionIndex: missions.index, missionPhase: missions.phase,
    money: G.money, health: player.health, trafficCount: traffic.cars.length,
    pedCount: peds.peds.length, policeCount: police.cars.length, storyDone: G.storyDone,
  }),
  start: () => startStory(false),
  enterNearestCar: () => { const v = nearestCar(30); if (v) { player.pos.set(v.pos.x + 2, 0, v.pos.z); enterCar(v); } return !!v; },
  addCrime: (n) => wanted.addCrime(n || 30),
  teleport: (x, z) => { player.pos.set(x, 0, z); if (G.inCar) G.inCar.pos.set(x, 0, z); },
};

if (shotMode) stageShot(shotMode);
else if (params.get('autostart')) startStory(false);
requestAnimationFrame(loop);

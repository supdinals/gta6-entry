// missions.js — the five-mission Neon Tide story: objectives, gold markers, locked wanted escapes, a checkpoint race and the finale.
import * as THREE from 'three';
import { PLACES } from './city-layout.js';
export const MISSION_DEFS = [
  { id: 'm1', title: 'First Drop', reward: 250, needCar: false,
    objective: "Take Mara's crate to Cafe Brisa", target: 'cafe',
    intro: [['Mara Sol', 'Crate is by the depot door. Walk it, drive it, I do not care — get it to Cafe Brisa.'],
            ['Rio Vale', 'One crate. How hard can it be?']],
    outro: [['Cafe Owner', 'Mara sends a new face? Then the tide is turning. Here — she said double.']] },
  { id: 'm2', title: 'Marina Run', reward: 400, needCar: true,
    objective: 'Steal a car and reach Palmira Marina', target: 'marina',
    intro: [['Mara Sol', 'A buyer waits at the Marina and my van just died. Borrow a car, Rio. Borrow it fast.'],
            ['Rio Vale', 'Borrow. Right. That is the word we are using.']],
    outro: [['Buyer', 'Fast hands, new friend. Mara was right about you.']] },
  { id: 'm3', title: 'Heat Escape', reward: 550, needCar: true, lockWanted: 3,
    objective: 'Lose the police and reach the Old Cannery Hideout', target: 'hideout',
    intro: [['Mara Sol', 'The marina buy was a sting! Every PBPD unit in the bay is coming. Run to the Old Cannery and stay out of sight!']],
    outro: [['Mara Sol', 'You vanished like sea mist. The bay is talking about you now, Rio.']] },
  { id: 'm4', title: 'Tide Trial Race', reward: 700, needCar: true, race: true,
    objective: 'Win the checkpoint race: Market → Lookout → Garage → Pier', target: 'market',
    checkpoints: ['market', 'lookout', 'garage', 'pier'],
    intro: [['Racer Nia', 'My crew races for pink slips at sundown. Beat our checkpoint line and the Tide Garage is yours to use.']],
    outro: [['Racer Nia', 'Clean lines! The garage crew bows to the new tide.']] },
  { id: 'm5', title: 'The Last Tide', reward: 1200, needCar: true, lockWanted: 2,
    objective: 'Grab the depot ledger and deliver it to Sunset Pier', target: 'pier', pickup: 'depot',
    intro: [['Mara Sol', 'Final job. My ledger is at the depot and the police know it. Bring it to Sunset Pier and we both retire rich.'],
            ['Rio Vale', 'One last tide, then. Let us ride it.']],
    outro: [['Mara Sol', 'You did it, Rio. Palmira Bay is ours — the Neon Tide rises with you. STORY COMPLETE!']] },
];
export class MissionSystem {
  constructor(scene, dialog, hooks) {
    this.dialog = dialog; this.hooks = hooks;
    this.index = 0; this.phase = 'idle'; this.checkpoint = 0; this.pickedUp = false;
    this.marker = createMarker(); scene.add(this.marker);
    this.moneyEarned = 0;
  }
  current() { return MISSION_DEFS[this.index] || null; }
  isComplete() { return this.index >= MISSION_DEFS.length; }
  startNext() {
    const m = this.current(); if (!m) { this.phase = 'done'; this.marker.visible = false; return; }
    this.phase = 'intro'; this.checkpoint = 0; this.pickedUp = false;
    this.dialog.show(m.intro, () => {
      this.phase = 'active';
      if (m.lockWanted && this.hooks.onLockWanted) this.hooks.onLockWanted(m.lockWanted);
      if (m.race) this.setMarker(PLACES[m.checkpoints[0]]);
      else if (m.pickup) this.setMarker(PLACES[m.pickup]);
      else this.setMarker(PLACES[m.target]);
      if (this.hooks.onStart) this.hooks.onStart(m);
    });
    this.marker.visible = false;
  }
  setMarker(place) { this.marker.position.set(place.x, 0, place.z); this.marker.visible = true; this.targetPos = place; }
  target() { return this.targetPos || null; }
  update(dt, playerPos, inCar) {
    if (this.marker.visible) { this.marker.rotation.y += dt * 2; this.marker.children[0].position.y = 5 + Math.sin(performance.now() / 300) * 0.7; }
    if (this.phase !== 'active') return null;
    const m = this.current(); if (!m) return null;
    const t = this.target(); if (!t) return null;
    const dist = Math.hypot(playerPos.x - t.x, playerPos.z - t.z);
    if (m.race) {
      this.hooks.onObjective && this.hooks.onObjective(`Checkpoint ${this.checkpoint + 1}/${m.checkpoints.length} — head to ${PLACES[m.checkpoints[this.checkpoint]].name}`);
      if (dist < 13) {
        this.checkpoint++;
        if (this.checkpoint >= m.checkpoints.length) return this.complete();
        this.setMarker(PLACES[m.checkpoints[this.checkpoint]]);
        if (this.hooks.onCheckpoint) this.hooks.onCheckpoint(this.checkpoint);
      }
      return null;
    }
    if (m.pickup && !this.pickedUp) {
      if (dist < 10) { this.pickedUp = true; this.setMarker(PLACES[m.target]); if (this.hooks.onPickup) this.hooks.onPickup(); }
      return null;
    }
    if (dist < 11) return this.complete();
    return null;
  }
  complete() {
    const m = this.current();
    this.phase = 'outro'; this.marker.visible = false;
    if (this.hooks.onReward) this.hooks.onReward(m.reward, m);
    this.dialog.show(m.outro, () => {
      this.index++;
      if (this.isComplete()) { this.phase = 'done'; if (this.hooks.onStoryComplete) this.hooks.onStoryComplete(); }
      else this.startNext();
    });
    return m;
  }
  objectiveText() {
    const m = this.current();
    if (!m) return 'Story complete — free roam Palmira Bay!';
    if (this.phase === 'intro') return 'Listen to the call…';
    if (m.race && this.phase === 'active') return `Checkpoint ${this.checkpoint + 1}/${m.checkpoints.length}`;
    if (m.pickup && !this.pickedUp && this.phase === 'active') return 'Pick up the ledger at Mara\'s Depot first';
    return m.objective;
  }
}
export function createMarker() {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 14, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
  beam.position.y = 7; g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.28, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffb300 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; g.add(ring);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 4), new THREE.MeshBasicMaterial({ color: 0xffb300 }));
  arrow.rotation.x = Math.PI; arrow.position.y = 5; g.add(arrow);
  g.visible = false;
  return g;
}

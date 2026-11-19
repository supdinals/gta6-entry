// traffic.js — NPC traffic: cars that cruise the road grid, slow for the car ahead and swerve around obstacles.
import * as THREE from 'three';
import { CITY, nextGridPoint } from './city-layout.js';
import { createCarMesh, Vehicle, CAR_NAMES } from './vehicles.js';
export const TRAFFIC_COLORS = [0xff7043, 0x42a5f5, 0x66bb6a, 0xffee58, 0xab47bc, 0xef5350, 0x26c6da, 0xffffff, 0xffa726, 0x78909c];
export class TrafficSystem {
  constructor(scene, count = 14) {
    this.cars = [];
    for (let i = 0; i < count; i++) {
      const horiz = i % 2 === 0;
      const x = horiz ? -200 + i * 28 : CITY.xs[i % CITY.xs.length];
      const z = horiz ? CITY.zs[i % CITY.zs.length] : -150 + i * 22;
      const angle = horiz ? Math.PI / 2 : 0;
      const color = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
      const mesh = createCarMesh(color, false, CAR_NAMES[i % CAR_NAMES.length]);
      scene.add(mesh);
      const v = new Vehicle(mesh, x, z + (horiz ? 3.4 : 0), angle, { name: CAR_NAMES[i % CAR_NAMES.length], color });
      if (!horiz) v.pos.x += 3.4;
      v.cruiseSpeed = 10 + (i % 5);
      v.target = nextGridPoint(v.pos.x, v.pos.z, Math.sin(angle), Math.cos(angle));
      v.isTraffic = true;
      this.cars.push(v);
    }
    // A few parked cars ready to steal.
    this.parked = [];
    const spots = [[-170, 128, 0.4], [52, -52, 1.6], [180, 128, -0.5], [-52, -116, 2.8], [116, 84, 0.1], [12, 148, 3.1], [-116, 20, 1.2], [76, -148, -1.4]];
    spots.forEach(([x, z, a], i) => {
      const color = TRAFFIC_COLORS[(i + 3) % TRAFFIC_COLORS.length];
      const mesh = createCarMesh(color, false, CAR_NAMES[(i + 2) % CAR_NAMES.length]);
      scene.add(mesh);
      const v = new Vehicle(mesh, x, z, a, { name: CAR_NAMES[(i + 2) % CAR_NAMES.length], color, parked: true });
      this.parked.push(v);
    });
  }
  allDrivable() { return [...this.cars, ...this.parked]; }
  // A short two-tone horn from this system's own tiny synth. Traffic owns no
  // audio graph in main.js, so it lazily builds one quiet context on the
  // first honk and reuses it; if the browser refuses, it simply stays silent.
  honk(v) {
    try {
      if (!this.hornCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.hornCtx = new AC();
        this.hornGain = this.hornCtx.createGain(); this.hornGain.gain.value = 0.1;
        this.hornGain.connect(this.hornCtx.destination);
      }
      if (this.hornCtx.state === 'suspended') this.hornCtx.resume();
      for (const freq of [370, 466]) {
        const o = this.hornCtx.createOscillator(), g = this.hornCtx.createGain();
        o.type = 'square'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.5, this.hornCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.hornCtx.currentTime + 0.28);
        o.connect(g); g.connect(this.hornGain); o.start(); o.stop(this.hornCtx.currentTime + 0.28);
      }
      v.honkFlash = 0.3;
    } catch { /* no audio available: the honk is skipped, never an error */ }
  }
  update(dt, playerPos) {
    for (const v of this.cars) {
      if (v.driver === 'player') continue;
      const dx = v.target.x - v.pos.x, dz = v.target.z - v.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 4) {
        // At an intersection, mostly go straight, sometimes turn.
        const straight = { x: Math.sin(v.angle), z: Math.cos(v.angle) };
        let dir = straight;
        if ((v.pos.x * 13 + v.pos.z * 7 + v.cruiseSpeed) % 3 < 1) dir = { x: straight.z, z: -straight.x };
        v.target = nextGridPoint(v.pos.x, v.pos.z, dir.x, dir.z);
        v.desiredAngle = Math.atan2(dir.x, dir.z);
      } else v.desiredAngle = Math.atan2(dx, dz);
      let da = ((v.desiredAngle - v.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      v.angle += Math.max(-1.6 * dt, Math.min(1.6 * dt, da * 2.2 * dt + Math.sign(da) * 0.001));
      let speed = v.cruiseSpeed;
      // Following distance grows with speed: the car starts easing off early
      // and matches the leader's pace instead of braking late and hard.
      const followGap = 6 + Math.abs(v.speed) * 0.9;
      for (const o of this.cars) {
        if (o === v) continue;
        const ox = o.pos.x - v.pos.x, oz = o.pos.z - v.pos.z;
        const ahead = ox * Math.sin(v.angle) + oz * Math.cos(v.angle);
        const lateral = Math.abs(ox * Math.cos(v.angle) - oz * Math.sin(v.angle));
        if (ahead > 0 && ahead < followGap && lateral < 2.4) {
          const leaderPace = Math.abs(o.speed || 0) + Math.max(0, ahead - 5) * 0.7;
          speed = Math.min(speed, Math.max(0, leaderPace));
        }
      }
      let blockedByPlayer = false;
      if (playerPos) {
        const px = playerPos.x - v.pos.x, pz = playerPos.z - v.pos.z;
        const ahead = px * Math.sin(v.angle) + pz * Math.cos(v.angle);
        const lateral = Math.abs(px * Math.cos(v.angle) - pz * Math.sin(v.angle));
        const playerGap = 5 + Math.abs(v.speed) * 0.7;
        if (ahead > 0 && ahead < playerGap && lateral < 2.6) {
          // Ease to a stop behind the player; only a full stop at bumper range.
          speed = ahead < 3.6 ? 0 : Math.min(speed, (ahead - 3.4) * 1.1);
          blockedByPlayer = speed < v.cruiseSpeed * 0.5;
        }
      }
      // A short honk when the player has held this car up for a while, with a
      // per-car cooldown so a jam never turns into a chorus.
      v.blockedTime = blockedByPlayer && Math.abs(v.speed) < 1.2 ? (v.blockedTime || 0) + dt : 0;
      v.honkCooldown = Math.max(0, (v.honkCooldown || 0) - dt);
      if (v.blockedTime > 1.6 && v.honkCooldown <= 0) {
        v.honkCooldown = 4; v.blockedTime = 0;
        if (playerPos && Math.hypot(playerPos.x - v.pos.x, playerPos.z - v.pos.z) < 20) this.honk(v);
      }
      if (v.honkFlash > 0) v.honkFlash -= dt;
      // Approach the target speed with capped acceleration and gentler,
      // earlier braking, and light the brake lamps while shedding speed.
      v.brakeOn = speed < v.speed - 0.4;
      const delta = speed - v.speed;
      const maxDelta = (delta < 0 ? 7.5 : 4.2) * dt;
      v.speed += Math.max(-maxDelta, Math.min(maxDelta, delta));
      v.pos.x += Math.sin(v.angle) * v.speed * dt;
      v.pos.z += Math.cos(v.angle) * v.speed * dt;
      v.syncMesh(dt);
    }
    for (const p of this.parked) if (p.driver !== 'player') p.updateCoast(dt);
  }
}

// police.js — Palmira Bay police: patrol cars that spawn with wanted stars, chase, ram and box in the player.
import * as THREE from 'three';
import { createCarMesh, Vehicle } from './vehicles.js';
export class PoliceSystem {
  constructor(scene) {
    this.scene = scene; this.cars = []; this.maxCars = 0; this.bustTimer = 0; this.flash = 0;
  }
  desiredCars(stars) { return stars <= 0 ? 0 : stars === 1 ? 1 : stars === 2 ? 2 : stars === 3 ? 3 : stars === 4 ? 4 : 5; }
  update(dt, wanted, playerPos, playerSpeed, onBusted) {
    const want = this.desiredCars(wanted.stars);
    while (this.cars.length < want) this.spawn(playerPos);
    while (this.cars.length > want) { const v = this.cars.pop(); this.scene.remove(v.mesh); }
    this.flash += dt * 9;
    let anySees = false;
    for (const cop of this.cars) {
      const dx = playerPos.x - cop.pos.x, dz = playerPos.z - cop.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 65) anySees = true;
      // Aim slightly ahead of the player so intercepts feel deliberate.
      const lead = Math.min(1, dist / 40);
      const tx = playerPos.x + Math.sin(cop.aimAngle || 0) * 0, tz = playerPos.z;
      const goalX = playerPos.x, goalZ = playerPos.z;
      const desired = Math.atan2(goalX - cop.pos.x, goalZ - cop.pos.z);
      let da = ((desired - cop.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      cop.angle += Math.max(-2.1 * dt, Math.min(2.1 * dt, da * 3 * dt));
      const topSpeed = 21 + wanted.stars * 2.4;
      const targetSpeed = dist > 6 ? topSpeed : 4;
      cop.brakeOn = targetSpeed < cop.speed - 0.5;
      cop.speed += (targetSpeed - cop.speed) * Math.min(1, dt * 1.6);
      cop.pos.x += Math.sin(cop.angle) * cop.speed * dt;
      cop.pos.z += Math.cos(cop.angle) * cop.speed * dt;
      cop.pos.x = Math.max(-222, Math.min(222, cop.pos.x));
      cop.pos.z = Math.max(-190, Math.min(226, cop.pos.z));
      cop.syncMesh(dt);
      // Strobe the light bar: the red and blue halves trade places every
      // flash phase, one flaring bright while the other drops to a ember.
      const lights = cop.mesh.userData.policeLights;
      if (lights) {
        const redPhase = Math.sin(this.flash) > 0;
        lights.redMat.emissiveIntensity = redPhase ? 3.6 : 0.2;
        lights.blueMat.emissiveIntensity = redPhase ? 0.2 : 3.6;
      }
      // Ramming contact: slows and damages the player, builds the bust meter when the player is cornered.
      if (dist < 3.4) {
        cop.lastRam = (cop.lastRam || 0) + dt;
        if (cop.lastRam > 0.4) { cop.lastRam = 0; if (onBusted) onBusted('ram'); }
      }
    }
    if (want > 0 && playerSpeed < 2.2 && this.cars.some((c) => Math.hypot(c.pos.x - playerPos.x, c.pos.z - playerPos.z) < 9)) {
      this.bustTimer += dt;
      if (this.bustTimer > 2.6) { this.bustTimer = 0; if (onBusted) onBusted('busted'); }
    } else this.bustTimer = Math.max(0, this.bustTimer - dt * 2);
    return anySees;
  }
  spawn(playerPos) {
    const a = Math.random() * Math.PI * 2, r = 52 + Math.random() * 18;
    const x = Math.max(-215, Math.min(215, playerPos.x + Math.sin(a) * r));
    const z = Math.max(-185, Math.min(220, playerPos.z + Math.cos(a) * r));
    const mesh = createCarMesh(0xffffff, true, 'PBPD Interceptor');
    this.scene.add(mesh);
    const v = new Vehicle(mesh, x, z, a + Math.PI, { name: 'PBPD Interceptor', isPolice: true });
    v.speed = 12;
    this.cars.push(v);
  }
  clearAll() { for (const v of this.cars) this.scene.remove(v.mesh); this.cars = []; this.bustTimer = 0; }
}

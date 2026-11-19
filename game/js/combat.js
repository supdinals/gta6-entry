// combat.js — bare-knuckle and pistol combat: punches knock pedestrians down, shots flash and drop targets, hits cost health.
import * as THREE from 'three';
export class CombatSystem {
  constructor(scene, audio, wanted, hooks) {
    this.audio = audio; this.wanted = wanted; this.hooks = hooks || {};
    this.muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe082 }));
    this.muzzle.visible = false; scene.add(this.muzzle);
    this.flashTimer = 0; this.shotsFired = 0; this.hitsLanded = 0;
    this.hitFlashes = [];
  }
  update(dt) {
    if (this.flashTimer > 0) { this.flashTimer -= dt; if (this.flashTimer <= 0) this.muzzle.visible = false; }
    // Hit flashes count down here and restore each material's own emissive
    // exactly as it was, so a flashed pedestrian never stays white.
    for (let i = this.hitFlashes.length - 1; i >= 0; i--) {
      const f = this.hitFlashes[i]; f.timer -= dt;
      if (f.timer <= 0) {
        for (const s of f.saved) { s.mat.emissive.setHex(s.hex); s.mat.emissiveIntensity = s.intensity; }
        this.hitFlashes.splice(i, 1);
      }
    }
  }
  // A short white flash over every material of the target plus a physical
  // shove away from the attacker: the hit reads instantly, from any angle.
  flashHit(target, fromPos, push) {
    const dx = target.pos.x - fromPos.x, dz = target.pos.z - fromPos.z;
    const len = Math.hypot(dx, dz) || 1;
    target.pos.x += (dx / len) * push; target.pos.z += (dz / len) * push;
    if (this.hitFlashes.some((f) => f.target === target)) return;
    const saved = [];
    target.mesh.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) {
        saved.push({ mat: o.material, hex: o.material.emissive.getHex(), intensity: o.material.emissiveIntensity });
        o.material.emissive.setHex(0xffffff); o.material.emissiveIntensity = 0.95;
      }
    });
    if (saved.length) this.hitFlashes.push({ target, saved, timer: 0.13 });
  }
  tryPunch(player, peds) {
    player.punch(); this.audio.punch();
    const target = peds.nearest(player.pos, 2.4);
    if (target) {
      target.health -= 18; this.hitsLanded++;
      this.flashHit(target, { x: player.pos.x - Math.sin(player.angle), z: player.pos.z - Math.cos(player.angle) }, 1.35);
      if (target.health <= 0) { target.down = 4; }
      this.wanted.addCrime(12, 'assault');
      if (this.hooks.onCrime) this.hooks.onCrime('Assault! Wanted level rising');
      return target;
    }
    return null;
  }
  tryShoot(player, peds, fromCar) {
    this.shotsFired++; this.audio.shoot(); this.flashTimer = 0.07; this.muzzle.visible = true;
    this.muzzle.position.set(player.pos.x + Math.sin(player.angle) * 1.4, 1.5, player.pos.z + Math.cos(player.angle) * 1.4);
    this.wanted.addCrime(18, 'shots fired');
    const target = peds.nearest(player.pos, fromCar ? 26 : 18);
    if (target) {
      const dx = target.pos.x - player.pos.x, dz = target.pos.z - player.pos.z;
      const facing = Math.sin(player.angle) * dx + Math.cos(player.angle) * dz;
      if (facing > 0) {
        target.health -= 30; this.hitsLanded++;
        this.flashHit(target, player.pos, 0.8);
        if (target.health <= 0) target.down = 5;
      }
    }
    if (this.hooks.onCrime) this.hooks.onCrime('Shots fired!');
    return target;
  }
}
export function spawnThugs() { return []; }

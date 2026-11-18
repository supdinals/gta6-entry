// combat.js — bare-knuckle and pistol combat: punches knock pedestrians down, shots flash and drop targets, hits cost health.
import * as THREE from 'three';
export class CombatSystem {
  constructor(scene, audio, wanted, hooks) {
    this.audio = audio; this.wanted = wanted; this.hooks = hooks || {};
    this.muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe082 }));
    this.muzzle.visible = false; scene.add(this.muzzle);
    this.flashTimer = 0; this.shotsFired = 0; this.hitsLanded = 0;
  }
  update(dt) { if (this.flashTimer > 0) { this.flashTimer -= dt; if (this.flashTimer <= 0) this.muzzle.visible = false; } }
  tryPunch(player, peds) {
    player.punch(); this.audio.punch();
    const target = peds.nearest(player.pos, 2.4);
    if (target) {
      target.health -= 18; this.hitsLanded++;
      target.pos.x += Math.sin(player.angle) * 1.1; target.pos.z += Math.cos(player.angle) * 1.1;
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
      if (facing > 0) { target.health -= 30; this.hitsLanded++; if (target.health <= 0) target.down = 5; }
    }
    if (this.hooks.onCrime) this.hooks.onCrime('Shots fired!');
    return target;
  }
}
export function spawnThugs() { return []; }

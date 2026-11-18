// player-on-foot.js — Rio Vale on foot: a procedural low-poly character, walk/run movement and a punching arm.
import * as THREE from 'three';
import { clampToCity } from './city-layout.js';
import { resolveCollisions } from './buildings.js';
export function createPlayerMesh() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xff4081 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1565c0 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.4), shirt); torso.position.y = 1.15; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), skin); head.position.y = 1.85; head.castShadow = true; g.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xffd54f }));
  cap.position.y = 2.02; g.add(cap);
  const mkLimb = (mat, w, h) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat); m.castShadow = true; return m; };
  const armL = mkLimb(skin, 0.2, 0.75); armL.position.set(-0.48, 1.15, 0); g.add(armL);
  const armR = mkLimb(skin, 0.2, 0.75); armR.position.set(0.48, 1.15, 0); g.add(armR);
  const legL = mkLimb(pants, 0.24, 0.75); legL.position.set(-0.19, 0.38, 0); g.add(legL);
  const legR = mkLimb(pants, 0.24, 0.75); legR.position.set(0.19, 0.38, 0); g.add(legR);
  g.userData = { armL, armR, legL, legR, torso };
  return g;
}
export class PlayerOnFoot {
  constructor(scene) {
    this.mesh = createPlayerMesh(); scene.add(this.mesh);
    this.pos = this.mesh.position; this.pos.set(-178, 0, 146);
    this.angle = 0.6; this.health = 100; this.walkCycle = 0; this.punchTimer = 0; this.dead = false;
  }
  update(dt, input, camAngle, colliders) {
    let mx = 0, mz = 0;
    const f = (input.up ? 1 : 0) - (input.down ? 1 : 0), s = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (f || s) {
      const sin = Math.sin(camAngle), cos = Math.cos(camAngle);
      mx = sin * f + cos * s; mz = cos * f - sin * s;
      const len = Math.hypot(mx, mz) || 1; mx /= len; mz /= len;
      this.angle = Math.atan2(mx, mz);
      const speed = input.run ? 11 : 6.2;
      this.pos.x += mx * speed * dt; this.pos.z += mz * speed * dt;
      this.walkCycle += dt * (input.run ? 13 : 9);
    } else this.walkCycle *= 0.8;
    clampToCity(this.pos); resolveCollisions(this.pos, 0.7, colliders);
    this.mesh.rotation.y = this.angle;
    const sw = Math.sin(this.walkCycle) * 0.55, u = this.mesh.userData;
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
    if (this.punchTimer > 0) { this.punchTimer -= dt; u.armR.rotation.x = -1.9 * Math.sin(Math.min(1, this.punchTimer / 0.28) * Math.PI); }
    else { u.armL.rotation.x = -sw; u.armR.rotation.x = sw; }
    this.mesh.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.06;
  }
  punch() { this.punchTimer = 0.28; }
  hurt(amount) { this.health = Math.max(0, this.health - amount); return this.health <= 0; }
  healFull() { this.health = 100; }
}

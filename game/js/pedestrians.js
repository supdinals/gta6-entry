// pedestrians.js — Palmira Bay walkers: people strolling sidewalks with swinging limbs who flee from danger.
import * as THREE from 'three';
import { CITY } from './city-layout.js';
export function createPedestrianMesh(shirtColor, skinColor) {
  const g = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColor });
  const skin = new THREE.MeshStandardMaterial({ color: skinColor });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.36), shirt); torso.position.y = 1.08; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), skin); head.position.y = 1.72; g.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), new THREE.MeshStandardMaterial({ color: 0x37474f }));
  legL.position.set(-0.16, 0.35, 0); g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.16; g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), skin); armL.position.set(-0.42, 1.08, 0); g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.42; g.add(armR);
  g.userData = { legL, legR, armL, armR };
  return g;
}
export class PedestrianSystem {
  constructor(scene, count = 26) {
    this.peds = [];
    const shirts = [0xff8a65, 0x4fc3f7, 0xaed581, 0xffd54f, 0xf06292, 0x9575cd, 0x4db6ac, 0xffffff];
    const skins = [0xffcc99, 0xc68642, 0x8d5524, 0xf1c27d];
    for (let i = 0; i < count; i++) {
      const horiz = i % 2 === 0;
      const mesh = createPedestrianMesh(shirts[i % shirts.length], skins[i % skins.length]);
      scene.add(mesh);
      const along = -200 + ((i * 53) % 400);
      const lane = horiz ? CITY.zs[i % CITY.zs.length] + 12.5 : CITY.xs[i % CITY.xs.length] + 12.5;
      const p = {
        mesh, pos: mesh.position, health: 30, flee: 0, cycle: Math.random() * 6,
        dir: (i % 4 < 2) ? 1 : -1, horiz, lane, speed: 1.6 + (i % 3) * 0.4, down: 0,
      };
      p.pos.set(horiz ? along : lane, 0, horiz ? lane : along);
      this.peds.push(p);
    }
  }
  update(dt, threatPos) {
    for (const p of this.peds) {
      if (p.down > 0) { p.down -= dt; p.mesh.rotation.x = Math.PI / 2 - 0.2; if (p.down <= 0) { p.mesh.rotation.x = 0; p.health = 30; } continue; }
      let vx = 0, vz = 0;
      const fleeing = threatPos && Math.hypot(p.pos.x - threatPos.x, p.pos.z - threatPos.z) < 7;
      if (fleeing) {
        vx = (p.pos.x - threatPos.x); vz = (p.pos.z - threatPos.z);
        const l = Math.hypot(vx, vz) || 1; vx = vx / l * 4.6; vz = vz / l * 4.6;
      } else if (p.horiz) vx = p.dir * p.speed; else vz = p.dir * p.speed;
      p.pos.x += vx * dt; p.pos.z += vz * dt;
      if (p.pos.x > 218) p.dir = -1; if (p.pos.x < -218) p.dir = 1;
      if (p.pos.z > 188) p.dir = -1; if (p.pos.z < -186) p.dir = 1;
      if (vx || vz) p.mesh.rotation.y = Math.atan2(vx, vz);
      p.cycle += dt * (fleeing ? 14 : 8);
      const sw = Math.sin(p.cycle) * 0.5, u = p.mesh.userData;
      u.legL.rotation.x = sw; u.legR.rotation.x = -sw; u.armL.rotation.x = -sw * 0.7; u.armR.rotation.x = sw * 0.7;
    }
  }
  nearest(pos, maxDist) {
    let best = null, bd = maxDist;
    for (const p of this.peds) { if (p.down > 0) continue; const d = Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z); if (d < bd) { bd = d; best = p; } }
    return best;
  }
}

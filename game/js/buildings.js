// buildings.js — builds every static mesh of Palmira Bay: ground, roads, sidewalks, towers, palms, lamps, beach and sea.
import * as THREE from 'three';
import { CITY, buildingLots } from './city-layout.js';
export function buildCity(scene) {
  const colliders = [];
  const mat = (c, r = 0.9) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 520), mat(0x66bb6a, 1));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, 20); ground.receiveShadow = true; scene.add(ground);
  // Sand and sea on the south edge.
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(560, 60), mat(0xffe0a3, 1));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.01, 208); sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(560, 130), new THREE.MeshStandardMaterial({ color: 0x039be5, roughness: 0.25, metalness: 0.1 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.25, 292); scene.add(sea);
  scene.userData.sea = sea;
  // Roads: dark strips along every grid line, with dashed centre lines.
  const roadMat = mat(0x37474f, 1), dashMat = new THREE.MeshBasicMaterial({ color: 0xfff176 });
  for (const z of CITY.zs) addRoad(scene, 470, 6, 0, z, true, roadMat, dashMat);
  for (const x of CITY.xs) addRoad(scene, 6, 380, x, -8, false, roadMat, dashMat);
  // Sidewalk slabs inside each block.
  const walkMat = mat(0xb0bec5, 1);
  for (const lot of buildingLots()) { /* lots sit on blocks; slabs below */ }
  for (let bx = 0; bx < CITY.xs.length - 1; bx++) for (let bz = 0; bz < CITY.zs.length - 1; bz++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(46, 0.3, 46), walkMat);
    slab.position.set((CITY.xs[bx] + CITY.xs[bx + 1]) / 2, 0.12, (CITY.zs[bz] + CITY.zs[bz + 1]) / 2);
    slab.receiveShadow = true; scene.add(slab);
  }
  // Buildings with lit-window texture made on a canvas.
  for (const lot of buildingLots()) {
    const tex = windowTexture(lot.color, lot.seed);
    const b = new THREE.Mesh(new THREE.BoxGeometry(lot.w, lot.h, lot.d),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    b.position.set(lot.x, lot.h / 2 + 0.25, lot.z); b.castShadow = true; b.receiveShadow = true; scene.add(b);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(lot.w + 1, 1, lot.d + 1), mat(0x546e7a));
    roof.position.set(lot.x, lot.h + 0.6, lot.z); scene.add(roof);
    colliders.push({ x: lot.x, z: lot.z, hw: lot.w / 2 + 0.6, hd: lot.d / 2 + 0.6 });
  }
  // Palm trees and street lamps along roads.
  const trunkMat = mat(0x8d6e63), leafMat = mat(0x2e9e4f, 1);
  let n = 0;
  for (const x of CITY.xs) for (const z of CITY.zs) {
    for (const [ox, oz] of [[13, 13], [-13, 13], [13, -13], [-13, -13]]) {
      if (n++ % 2) continue;
      const px = x + ox, pz = z + oz;
      if (pz > 180) continue;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 6), trunkMat);
      trunk.position.set(px, 3, pz); trunk.castShadow = true; scene.add(trunk);
      for (let k = 0; k < 5; k++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5.5, 4), leafMat);
        const a = (k / 5) * Math.PI * 2;
        leaf.position.set(px + Math.cos(a) * 1.6, 6.6, pz + Math.sin(a) * 1.6);
        leaf.rotation.z = Math.cos(a) * 1.1; leaf.rotation.x = -Math.sin(a) * 1.1; scene.add(leaf);
      }
    }
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.4, 5), mat(0x455a64));
    lamp.position.set(x + 10.5, 2.7, z + 10.5); scene.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff9c4 }));
    bulb.position.set(x + 10.5, 5.5, z + 10.5); scene.add(bulb);
  }
  // Pier posts over the water.
  for (let i = -3; i <= 3; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 26), mat(0xa1887f));
    post.position.set(i * 7, 0.4, 214); scene.add(post);
  }
  return colliders;
}
export function addRoad(scene, w, d, x, z, horizontal, roadMat, dashMat) {
  const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d === 6 ? 15 : d), roadMat);
  if (!horizontal) r.geometry = new THREE.PlaneGeometry(15, 380);
  r.rotation.x = -Math.PI / 2; r.position.set(x, 0.03, z); r.receiveShadow = true; scene.add(r);
  const len = horizontal ? 470 : 380;
  for (let s = -len / 2 + 12; s < len / 2 - 6; s += 16) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(horizontal ? 6 : 0.5, horizontal ? 0.5 : 6), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(horizontal ? x + s : x, 0.06, horizontal ? z : z + s + 8); scene.add(dash);
  }
}
export function windowTexture(baseColor, seed) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  const col = new THREE.Color(baseColor);
  g.fillStyle = '#' + col.getHexString(); g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 120; y += 11) for (let x = 6; x < 56; x += 11) {
    const lit = ((x * 31 + y * 17 + seed * 13) % 5) < 2;
    g.fillStyle = lit ? '#fff59d' : '#37474f'; g.fillRect(x, y, 7, 7);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function resolveCollisions(pos, radius, colliders) {
  for (const b of colliders) {
    const dx = pos.x - b.x, dz = pos.z - b.z;
    const px = b.hw + radius - Math.abs(dx), pz = b.hd + radius - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) pos.x = b.x + Math.sign(dx || 1) * (b.hw + radius);
      else pos.z = b.z + Math.sign(dz || 1) * (b.hd + radius);
    }
  }
  return pos;
}

// buildings.js — builds every static mesh of Palmira Bay: ground, roads, sidewalks, towers, palms, lamps, beach and sea.
import * as THREE from 'three';
import { CITY, buildingLots, intersectionCrosswalks, roadEdgeLines } from './city-layout.js';
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
  // Solid edge lines along every kerb, laid just above the asphalt.
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xeceff1 });
  for (const line of roadEdgeLines()) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(line.w, line.d), edgeMat);
    edge.rotation.x = -Math.PI / 2; edge.position.set(line.x, 0.05, line.z); scene.add(edge);
  }
  // Zebra crossings at every intersection: one striped plane per band.
  const crossMat = new THREE.MeshBasicMaterial({ map: crosswalkTexture(), transparent: true, depthWrite: false });
  for (const band of intersectionCrosswalks()) {
    const cross = new THREE.Mesh(new THREE.PlaneGeometry(band.w, band.d), crossMat);
    cross.rotation.x = -Math.PI / 2;
    if (band.axis === 'across-z') cross.rotation.z = Math.PI / 2;
    cross.position.set(band.x, 0.07, band.z); scene.add(cross);
  }
  // Sidewalk slabs inside each block.
  const walkMat = mat(0xb0bec5, 1);
  for (const lot of buildingLots()) { /* lots sit on blocks; slabs below */ }
  for (let bx = 0; bx < CITY.xs.length - 1; bx++) for (let bz = 0; bz < CITY.zs.length - 1; bz++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(46, 0.3, 46), walkMat);
    slab.position.set((CITY.xs[bx] + CITY.xs[bx + 1]) / 2, 0.12, (CITY.zs[bz] + CITY.zs[bz + 1]) / 2);
    slab.receiveShadow = true; scene.add(slab);
  }
  // Buildings with lit-window texture made on a canvas.
  const acMat = mat(0x90a4ae), tankMat = mat(0x8d6e63), tankTopMat = mat(0x6d4c41);
  const awningMats = [0xef5350, 0x26a69a, 0xffca28, 0x5c6bc0, 0xff7043].map((c) => mat(c, 0.8));
  for (const lot of buildingLots()) {
    const tex = windowTexture(lot.color, lot.seed);
    const b = new THREE.Mesh(new THREE.BoxGeometry(lot.w, lot.h, lot.d),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    b.position.set(lot.x, lot.h / 2 + 0.25, lot.z); b.castShadow = true; b.receiveShadow = true; scene.add(b);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(lot.w + 1, 1, lot.d + 1), mat(0x546e7a));
    roof.position.set(lot.x, lot.h + 0.6, lot.z); scene.add(roof);
    const roofTop = lot.h + 1.1;
    // Rooftop props on most towers, picked deterministically from the lot seed:
    // boxy air-conditioning units, and a timber water tank on every fifth lot.
    if (lot.seed % 3 !== 0) {
      const acW = 2.6 + (lot.seed % 3) * 0.7;
      const ac = new THREE.Mesh(new THREE.BoxGeometry(acW, 1.3, 2.2), acMat);
      ac.position.set(lot.x + ((lot.seed % 5) - 2) * 2.2, roofTop + 0.65, lot.z + (((lot.seed * 3) % 5) - 2) * 2.2);
      ac.castShadow = true; scene.add(ac);
      if (lot.seed % 4 === 0) {
        const ac2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.8), acMat);
        ac2.position.set(lot.x - ((lot.seed % 4) - 1) * 3, roofTop + 0.45, lot.z - (((lot.seed * 7) % 5) - 2) * 2);
        ac2.castShadow = true; scene.add(ac2);
      }
    }
    if (lot.seed % 5 === 1) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 3.1, 10), tankMat);
      tank.position.set(lot.x + lot.w / 4, roofTop + 1.55, lot.z - lot.d / 4);
      tank.castShadow = true; scene.add(tank);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2, 1.1, 10), tankTopMat);
      cap.position.set(lot.x + lot.w / 4, roofTop + 3.65, lot.z - lot.d / 4); scene.add(cap);
    }
    if (lot.seed % 6 === 3) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.2, 5), acMat);
      mast.position.set(lot.x - lot.w / 4, roofTop + 2.1, lot.z + lot.d / 4); scene.add(mast);
    }
    // Slanted shop awnings over the ground floor of some facades, high enough
    // to walk under: they sit at 3.4 m, well above the player's head.
    if (lot.seed % 3 === 1) addAwning(scene, lot, 1, awningMats[lot.seed % awningMats.length]);
    if (lot.seed % 4 === 2) addAwning(scene, lot, -1, awningMats[(lot.seed + 2) % awningMats.length]);
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
// One slanted canopy over a building's ground floor, facing +z when side is
// 1 and -z when side is -1, held up by two slim poles at its front corners.
export function addAwning(scene, lot, side, material) {
  const w = lot.w * 0.62;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 2.8), material);
  canopy.position.set(lot.x, 3.45, lot.z + side * (lot.d / 2 + 1.15));
  canopy.rotation.x = side * 0.36; canopy.castShadow = true; scene.add(canopy);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.7 });
  for (const px of [-w / 2 + 0.3, w / 2 - 0.3]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3, 5), poleMat);
    pole.position.set(lot.x + px, 1.5, lot.z + side * (lot.d / 2 + 2.3)); scene.add(pole);
  }
}
// White zebra stripes on a transparent ground, drawn once and reused by every
// crossing band in the city.
export function crosswalkTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 64);
  g.fillStyle = 'rgba(245,245,245,0.92)';
  for (let x = 6; x < 122; x += 24) g.fillRect(x, 5, 13, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Deterministic 0..1 hash of a window's grid position and its building seed,
// so every facade keeps the same windows on every load and in every screenshot.
function windowHash(col, row, seed) {
  let n = (Math.imul(col + 1, 374761393) + Math.imul(row + 1, 668265263) + Math.imul(seed + 7, 2246822519)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function windowTexture(baseColor, seed) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  const col = new THREE.Color(baseColor);
  // A gentle vertical gradient keeps tall facades from reading as flat colour.
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#' + col.clone().offsetHSL(0, 0, 0.05).getHexString());
  grad.addColorStop(1, '#' + col.clone().offsetHSL(0, 0, -0.045).getHexString());
  g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = 31; x < 128; x += 32) g.fillRect(x, 0, 2, 256);
  const warm = ['#fff59d', '#ffd76e', '#ffe9a8', '#ffca7a'];
  for (let row = 0, y = 10; y < 240; row++, y += 19) for (let colI = 0, x = 9; x < 112; colI++, x += 19) {
    const r = windowHash(colI, row, seed);
    if (r < 0.3) g.fillStyle = warm[Math.floor(windowHash(colI, row, seed + 41) * warm.length)];
    else if (r < 0.44) g.fillStyle = '#bfe3ff';
    else if (r < 0.56) g.fillStyle = '#8fa3ad';
    else g.fillStyle = windowHash(colI, row, seed + 97) < 0.5 ? '#2f3e46' : '#3b4c56';
    g.fillRect(x, y, 11, 13);
    // Some windows are half-blinded: a darker lower band over the glass.
    if (windowHash(colI, row, seed + 173) < 0.27) {
      g.fillStyle = 'rgba(38,50,56,0.55)'; g.fillRect(x, y + 8, 11, 5);
      g.fillStyle = 'rgba(38,50,56,0.35)'; g.fillRect(x, y + 4, 11, 2);
    }
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.strokeRect(x + 0.5, y + 0.5, 10, 12);
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

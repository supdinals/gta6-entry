// vehicles.js — procedural car meshes and the arcade driving model every drivable car in Palmira Bay shares.
import * as THREE from 'three';
export const CAR_NAMES = ['Solana Coupe', 'Brisa Hatchback', 'Tide Pickup', 'Marina Sedan', 'Coral Convertible', 'Palm Van'];
export function createCarMesh(color, isPolice = false, name = '') {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: isPolice ? 0xf5f5f5 : color, roughness: 0.35, metalness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x81d4fa, roughness: 0.15, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 4.3), paint);
  body.position.y = 0.62; body.castShadow = true; group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.58, 2.1), glass);
  cabin.position.set(0, 1.18, -0.2); cabin.castShadow = true; group.add(cabin);
  if (isPolice) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.3, 4.34), new THREE.MeshStandardMaterial({ color: 0x0d47a1 }));
    stripe.position.y = 0.62; group.add(stripe);
    // Light bar as two separate emissive halves on a dark housing, so police.js
    // can strobe red and blue alternately instead of recolouring one block.
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.12, 0.54), dark);
    housing.position.set(0, 1.53, -0.2); group.add(housing);
    const redMat = new THREE.MeshStandardMaterial({ color: 0x33060a, emissive: 0xff1744, emissiveIntensity: 2.6 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x060a33, emissive: 0x2979ff, emissiveIntensity: 0.25 });
    const redHalf = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.48), redMat);
    redHalf.position.set(-0.41, 1.66, -0.2); redHalf.name = 'lightbar-red'; group.add(redHalf);
    const blueHalf = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.48), blueMat);
    blueHalf.position.set(0.41, 1.66, -0.2); blueHalf.name = 'lightbar-blue'; group.add(blueHalf);
    group.userData.policeLights = { redMat, blueMat };
  }
  // Each wheel is a pivot group on the axle line: the tyre mesh inside is
  // pre-rotated, and spinning the pivot around x rolls the wheel correctly.
  // A light spoke across the tyre makes the rotation actually visible.
  const wheels = [];
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.4, metalness: 0.5 });
  for (const [x, z] of [[-1.05, 1.45], [1.05, 1.45], [-1.05, -1.45], [1.05, -1.45]]) {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.42, z);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), dark);
    tyre.rotation.z = Math.PI / 2; pivot.add(tyre);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.72, 0.13), spokeMat);
    pivot.add(spoke);
    const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.72), spokeMat);
    pivot.add(spoke2);
    group.add(pivot); wheels.push(pivot);
  }
  // Headlights: an emissive bar that reads as lamps on, day or night.
  const hl = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x555033, emissive: 0xfff9c4, emissiveIntensity: 1.5 }));
  hl.position.set(0, 0.72, 2.16); group.add(hl);
  // Brake lights at the rear: dim red at rest, flaring when brakeOn is set.
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x330606, emissive: 0xff2222, emissiveIntensity: 0.55 });
  const bl = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.1), brakeMat);
  bl.position.set(0, 0.74, -2.16); bl.name = 'brakelight'; group.add(bl);
  group.userData.wheels = wheels;
  group.userData.brakeMat = brakeMat;
  group.userData.name = name;
  return group;
}
export class Vehicle {
  constructor(mesh, x, z, angle, opts = {}) {
    this.mesh = mesh; this.pos = mesh.position; this.pos.set(x, 0, z);
    this.angle = angle; this.speed = 0; this.steer = 0;
    this.name = opts.name || 'Solana Coupe'; this.isPolice = !!opts.isPolice;
    this.health = 100; this.driver = null; this.parked = !!opts.parked;
    this.color = opts.color || 0xff7043;
    this.brakeOn = false;
  }
  updateDriving(dt, input, audio) {
    // Braking means actively shedding forward speed: reverse key while moving
    // forwards, forward key while rolling backwards, or the handbrake.
    this.brakeOn = !!(input.handbrake || (input.down && this.speed > 1) || (input.up && this.speed < -1));
    const accel = input.up ? 26 : input.down ? -16 : 0;
    this.speed += accel * dt;
    if (input.handbrake) this.speed -= this.speed * 2.4 * dt;
    this.speed -= this.speed * 0.55 * dt;
    this.speed = Math.max(-13, Math.min(34, this.speed));
    const targetSteer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    this.steer += (targetSteer * 0.55 - this.steer) * Math.min(1, dt * 8);
    if (Math.abs(this.speed) > 0.2) this.angle += this.steer * dt * (this.speed > 0 ? 1 : -1) * Math.min(1, Math.abs(this.speed) / 9);
    this.pos.x += Math.sin(this.angle) * this.speed * dt;
    this.pos.z += Math.cos(this.angle) * this.speed * dt;
    this.syncMesh(dt);
    if (audio) audio.setEngine(Math.abs(this.speed) / 34);
  }
  updateCoast(dt) { this.brakeOn = Math.abs(this.speed) > 2; this.speed -= this.speed * 1.4 * dt; this.pos.x += Math.sin(this.angle) * this.speed * dt; this.pos.z += Math.cos(this.angle) * this.speed * dt; this.syncMesh(dt); }
  syncMesh(dt) {
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.angle;
    // Roll angle is distance over tyre radius, so wheels spin at road speed.
    const spin = this.speed * (dt || 0.016) / 0.42;
    for (const w of this.mesh.userData.wheels || []) w.rotation.x += spin;
    const brakeMat = this.mesh.userData.brakeMat;
    if (brakeMat) brakeMat.emissiveIntensity = this.brakeOn ? 3.4 : 0.55;
  }
  speedKmh() { return Math.round(Math.abs(this.speed) * 3.6); }
}
export function spawnParkedCars(THREEref, spots) { return spots; }

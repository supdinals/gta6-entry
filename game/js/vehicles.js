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
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
    bar.position.set(0, 1.6, -0.2); bar.name = 'lightbar'; group.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0x2979ff }));
    bar2.position.set(-0.4, 1.6, -0.2); group.add(bar2);
  }
  const wheels = [];
  for (const [x, z] of [[-1.05, 1.45], [1.05, 1.45], [-1.05, -1.45], [1.05, -1.45]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), dark);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z); group.add(w); wheels.push(w);
  }
  const hl = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff9c4 }));
  hl.position.set(0, 0.72, 2.16); group.add(hl);
  group.userData.wheels = wheels;
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
  }
  updateDriving(dt, input, audio) {
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
  updateCoast(dt) { this.speed -= this.speed * 1.4 * dt; this.pos.x += Math.sin(this.angle) * this.speed * dt; this.pos.z += Math.cos(this.angle) * this.speed * dt; this.syncMesh(dt); }
  syncMesh(dt) {
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.angle;
    const spin = this.speed * (dt || 0.016) * 2.2;
    for (const w of this.mesh.userData.wheels || []) w.rotation.x += spin;
  }
  speedKmh() { return Math.round(Math.abs(this.speed) * 3.6); }
}
export function spawnParkedCars(THREEref, spots) { return spots; }

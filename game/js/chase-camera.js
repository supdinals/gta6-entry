// chase-camera.js — the third-person camera: smooth follow on foot, wider chase view in a car, mouse orbit offset.
import * as THREE from 'three';
export class ChaseCamera {
  constructor(camera) {
    this.camera = camera; this.pos = new THREE.Vector3(-186, 8, 128);
    this.angle = 0.6; this.pitch = 0.32; this.shake = 0;
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) { this.angle -= e.movementX * 0.0032; this.pitch = Math.max(0.08, Math.min(0.9, this.pitch + e.movementY * 0.002)); }
    });
  }
  update(dt, targetPos, targetAngle, inCar, speed) {
    if (!inCar) {
      // On foot the camera drifts behind the player's facing unless the player is orbiting with the mouse.
      let da = ((targetAngle - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      if (!document.pointerLockElement) this.angle += da * Math.min(1, dt * 2.2);
    } else {
      let da = ((targetAngle - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.angle += da * Math.min(1, dt * (2.6 + Math.abs(speed) * 0.05));
      this.pitch += (0.3 - this.pitch) * Math.min(1, dt * 2);
    }
    const dist = inCar ? 10.5 + Math.abs(speed) * 0.16 : 7.5;
    const height = inCar ? 3.6 : 3.1;
    const back = new THREE.Vector3(targetPos.x - Math.sin(this.angle) * Math.cos(this.pitch) * dist,
      targetPos.y + height + Math.sin(this.pitch) * dist * 0.55,
      targetPos.z - Math.cos(this.angle) * Math.cos(this.pitch) * dist);
    this.pos.lerp(back, Math.min(1, dt * (inCar ? 5 : 7)));
    if (this.shake > 0) { this.shake -= dt; this.pos.x += (Math.random() - 0.5) * this.shake * 1.4; this.pos.y += (Math.random() - 0.5) * this.shake; }
    this.camera.position.copy(this.pos);
    this.camera.lookAt(targetPos.x, targetPos.y + 1.6, targetPos.z);
  }
  addShake(amount) { this.shake = Math.min(0.7, this.shake + amount); }
}

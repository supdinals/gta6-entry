// minimap.js — the round HUD minimap: roads, beach, player arrow, traffic, police blips and the gold mission marker.
import { CITY } from './city-layout.js';
export function drawMinimap(canvas, world) {
  const g = canvas.getContext('2d'); if (!g) return;
  const S = canvas.width, C = S / 2, scale = S / 500;
  const toMap = (x, z) => [C + (x - world.playerPos.x) * scale * 0 + x * scale + 20, C + z * scale - 8];
  // World-anchored map (north up), player centred-ish by using absolute mapping fitted to the city.
  const mx = (x) => (x + 250) * (S / 500), mz = (z) => (z + 210) * (S / 470);
  g.clearRect(0, 0, S, S);
  g.fillStyle = '#2e7d32'; g.fillRect(0, 0, S, S);
  // Beach and sea along the south edge: dry sand, a darker wet band at the
  // waterline, then sea with a few pale wave streaks so the coast reads at
  // a glance instead of as two flat colour blocks.
  g.fillStyle = '#ffe0a3'; g.fillRect(0, mz(182), S, mz(232) - mz(182));
  g.fillStyle = '#eec27f'; g.fillRect(0, mz(226), S, mz(232) - mz(226));
  g.fillStyle = '#039be5'; g.fillRect(0, mz(232), S, S - mz(232));
  g.strokeStyle = 'rgba(179,229,252,0.75)'; g.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const wy = mz(238) + i * 5;
    g.beginPath();
    for (let x = 6 + (i % 2) * 14; x < S - 10; x += 34) { g.moveTo(x, wy); g.lineTo(x + 16, wy); }
    g.stroke();
  }
  g.strokeStyle = '#37474f'; g.lineWidth = 7;
  for (const z of CITY.zs) { g.beginPath(); g.moveTo(0, mz(z)); g.lineTo(S, mz(z)); g.stroke(); }
  for (const x of CITY.xs) { g.beginPath(); g.moveTo(mx(x), 0); g.lineTo(mx(x), S); g.stroke(); }
  // Traffic dots.
  g.fillStyle = '#ffffff';
  for (const v of world.trafficCars) { g.fillRect(mx(v.pos.x) - 2, mz(v.pos.z) - 2, 4, 4); }
  // Police blips flash red/blue.
  for (const c of world.policeCars) { g.fillStyle = Math.floor(performance.now() / 300) % 2 ? '#ff1744' : '#2979ff'; g.beginPath(); g.arc(mx(c.pos.x), mz(c.pos.z), 4, 0, 7); g.fill(); }
  // Pedestrians as tiny dots near the player only (cheap and readable).
  g.fillStyle = '#ffccbc';
  for (const p of world.peds) { if (Math.abs(p.pos.x - world.playerPos.x) < 60 && Math.abs(p.pos.z - world.playerPos.z) < 60) g.fillRect(mx(p.pos.x) - 1, mz(p.pos.z) - 1, 2, 2); }
  // Mission target, pulsing: a swelling gold core inside a fading halo, on
  // the same rhythm as the light column in the world.
  if (world.missionTarget) {
    const pulse = Math.sin(performance.now() / 300) * 0.5 + 0.5;
    const tx = mx(world.missionTarget.x), tz = mz(world.missionTarget.z);
    g.fillStyle = 'rgba(255,179,0,0.3)';
    g.beginPath(); g.arc(tx, tz, 9 + pulse * 5, 0, 7); g.fill();
    g.fillStyle = '#ffb300'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.arc(tx, tz, 5 + pulse * 2, 0, 7); g.fill(); g.stroke();
  }
  // Player arrow.
  const px = mx(world.playerPos.x), pz = mz(world.playerPos.z);
  g.save(); g.translate(px, pz); g.rotate(world.playerAngle);
  g.fillStyle = '#ff4081'; g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.restore();
}
export function minimapLegend() { return 'pink arrow = you · gold = mission · red/blue = police · white = traffic'; }

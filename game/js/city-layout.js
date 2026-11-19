// city-layout.js — the street plan of Palmira Bay: road grid, blocks, beach and every named place missions use.
export const CITY = {
  block: 64, roadHalf: 9, sidewalk: 4,
  xs: [-192, -128, -64, 0, 64, 128, 192],
  zs: [-160, -96, -32, 32, 96, 160],
  minX: -224, maxX: 224, minZ: -192, maxZ: 232,
  beachZ: 196, seaZ: 232,
};
export const PLACES = {
  depot: { x: -192, z: 160, name: "Mara's Depot" },
  cafe: { x: 64, z: -32, name: "Cafe Brisa" },
  marina: { x: 192, z: 160, name: "Palmira Marina" },
  market: { x: -64, z: -96, name: "Sol Market" },
  garage: { x: 128, z: 96, name: "Tide Garage" },
  lookout: { x: -128, z: -160, name: "North Lookout" },
  pier: { x: 0, z: 196, name: "Sunset Pier" },
  hideout: { x: -192, z: -32, name: "Old Cannery Hideout" },
};
export function isOnRoadX(z) { return CITY.zs.some((rz) => Math.abs(z - rz) <= CITY.roadHalf + 1); }
export function isOnRoadZ(x) { return CITY.xs.some((rx) => Math.abs(x - rx) <= CITY.roadHalf + 1); }
export function isOnRoad(x, z) { return isOnRoadX(z) || isOnRoadZ(x); }
export function isBeach(z) { return z >= CITY.beachZ - 14 && z < CITY.seaZ; }
export function clampToCity(p) {
  p.x = Math.max(CITY.minX, Math.min(CITY.maxX, p.x));
  p.z = Math.max(CITY.minZ, Math.min(CITY.maxZ - 6, p.z));
  return p;
}
export function roadWaypoints() {
  const pts = [];
  for (const x of CITY.xs) for (const z of CITY.zs) pts.push({ x, z });
  return pts;
}
// Zebra crossings at every intersection, described as flat bands just outside
// the junction box. Each band crosses one road: 'across-x' bands sit north and
// south of the junction and are walked in the x direction, 'across-z' bands
// sit east and west and are walked in the z direction. buildings.js turns
// each band into one striped plane, so this stays pure layout data.
export function intersectionCrosswalks() {
  const bands = [];
  const off = CITY.roadHalf + 2.5;
  for (const x of CITY.xs) for (const z of CITY.zs) {
    bands.push({ x, z: z - off, w: 13, d: 5.6, axis: 'across-x' });
    bands.push({ x, z: z + off, w: 13, d: 5.6, axis: 'across-x' });
    bands.push({ x: x - off, z, w: 5.6, d: 13, axis: 'across-z' });
    bands.push({ x: x + off, z, w: 5.6, d: 13, axis: 'across-z' });
  }
  return bands;
}
// Solid edge lines for every road, one along each kerb. Returned as thin flat
// strips in world space so the renderer can lay them straight onto the road
// surface without re-deriving the grid geometry.
export function roadEdgeLines() {
  const lines = [];
  const inset = 6.7;
  for (const z of CITY.zs) {
    lines.push({ x: 0, z: z - inset, w: 470, d: 0.35 });
    lines.push({ x: 0, z: z + inset, w: 470, d: 0.35 });
  }
  for (const x of CITY.xs) {
    lines.push({ x: x - inset, z: -8, w: 0.35, d: 380 });
    lines.push({ x: x + inset, z: -8, w: 0.35, d: 380 });
  }
  return lines;
}
export function nextGridPoint(x, z, dirX, dirZ) {
  // Move to the next intersection along the current driving direction.
  let nx = x, nz = z;
  if (dirX > 0) { const c = CITY.xs.filter((v) => v > x + 2); nx = c.length ? Math.min(...c) : CITY.maxX - 20; }
  else if (dirX < 0) { const c = CITY.xs.filter((v) => v < x - 2); nx = c.length ? Math.max(...c) : CITY.minX + 20; }
  if (dirZ > 0) { const c = CITY.zs.filter((v) => v > z + 2); nz = c.length ? Math.min(...c) : 160; }
  else if (dirZ < 0) { const c = CITY.zs.filter((v) => v < z - 2); nz = c.length ? Math.max(...c) : -160; }
  return { x: nx, z: nz };
}
export function buildingLots() {
  const lots = [];
  const palette = [0xffcc80, 0xfff3e0, 0x90caf9, 0xffab91, 0xa5d6a7, 0xce93d8, 0xfff59d, 0x80deea, 0xf48fb1, 0xbcaaa4];
  let i = 0;
  for (let bx = 0; bx < CITY.xs.length - 1; bx++) for (let bz = 0; bz < CITY.zs.length - 1; bz++) {
    const cx = (CITY.xs[bx] + CITY.xs[bx + 1]) / 2, cz = (CITY.zs[bz] + CITY.zs[bz + 1]) / 2;
    // Each block holds 2x2 buildings with a small plaza gap.
    for (const ox of [-15, 15]) for (const oz of [-15, 15]) {
      if ((i * 7) % 11 === 0) { i++; continue; }
      const h = 10 + ((i * 37) % 34);
      lots.push({ x: cx + ox, z: cz + oz, w: 20 + (i % 3) * 3, d: 20 + ((i + 1) % 3) * 3, h, color: palette[i % palette.length], seed: i });
      i++;
    }
  }
  return lots;
}
export function distance2d(a, b) { const dx = a.x - b.x, dz = a.z - b.z; return Math.hypot(dx, dz); }

// wanted.js — the wanted system: crimes add heat, heat becomes 1-5 stars, hiding from police cools it down.
export class WantedSystem {
  constructor() { this.heat = 0; this.stars = 0; this.locked = 0; this.seenTimer = 0; this.coolTimer = 0; }
  addCrime(amount, label) {
    if (this.locked > 0) amount = Math.max(amount, 6);
    this.heat = Math.min(100, this.heat + amount);
    this.recalc();
    return label;
  }
  recalc() {
    const s = this.heat <= 0 ? 0 : this.heat < 18 ? 1 : this.heat < 36 ? 2 : this.heat < 55 ? 3 : this.heat < 78 ? 4 : 5;
    if (this.locked > 0) this.stars = Math.max(s, this.locked);
    else this.stars = s;
  }
  setLocked(stars) { this.locked = stars; this.heat = Math.max(this.heat, stars * 16); this.recalc(); }
  clearLock() { this.locked = 0; this.recalc(); }
  update(dt, isSeenByPolice) {
    if (isSeenByPolice) { this.coolTimer = 0; this.seenTimer += dt; }
    else if (this.stars > 0 && this.locked === 0) {
      this.coolTimer += dt;
      if (this.coolTimer > 2.2) { this.heat = Math.max(0, this.heat - dt * 4.2); this.recalc(); }
    }
  }
  clear() { this.heat = 0; this.stars = 0; this.locked = 0; this.coolTimer = 0; }
  starsText() { return '★'.repeat(this.stars) + '☆'.repeat(5 - this.stars); }
}
export const CRIMES = { stealCar: 22, hitCar: 10, hitPed: 26, punch: 12, shoot: 18, missionHeat: 30 };

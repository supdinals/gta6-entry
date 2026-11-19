// hud.js — writes game state into the HUD: money, wanted stars, health, vehicle name, speed, clock and prompts.
export class Hud {
  constructor() {
    this.el = {};
    for (const id of ['money-label','wanted-stars','clock-label','mission-title','mission-objective','mission-distance','health-bar','vehicle-label','speed-label','prompt-label','toast-label','damage-vignette','hud'])
      this.el[id] = document.getElementById(id);
    this.toastTimer = 0;
    this.vehicleNameShown = '';
    this.vehicleFade = 1;
  }
  show() { this.el['hud'].classList.remove('hidden'); }
  hide() { this.el['hud'].classList.add('hidden'); }
  update(state, dt) {
    this.el['money-label'].textContent = '$' + state.money.toLocaleString('en-US');
    this.el['wanted-stars'].textContent = state.wanted.stars > 0 ? state.wanted.starsText() : '';
    if (state.wanted.isCooling && state.wanted.isCooling()) {
      // Hidden and cooling: a slow, calm breathing blink, clearly gentler
      // than the hard alarm blink used while the chase is hot.
      this.el['wanted-stars'].style.opacity = String(0.55 + 0.35 * (Math.sin(performance.now() / 320) * 0.5 + 0.5));
    } else {
      this.el['wanted-stars'].style.opacity = state.wanted.stars > 2 && Math.floor(performance.now() / 350) % 2 ? '0.45' : '1';
    }
    const mins = Math.floor(state.gameMinutes) % 1440;
    const hh = String(Math.floor(mins / 60)).padStart(2, '0'), mm = String(mins % 60).padStart(2, '0');
    this.el['clock-label'].textContent = `Day ${state.day} · ${hh}:${mm} · Palmira Bay`;
    this.el['mission-title'].textContent = state.missionTitle;
    this.el['mission-objective'].textContent = state.objective;
    this.el['mission-distance'].textContent = state.missionDistance != null ? `Target: ${Math.round(state.missionDistance)} m` : '';
    this.el['health-bar'].style.width = Math.max(0, state.health) + '%';
    // The vehicle name fades in fresh every time the player gets into a
    // different car, instead of popping in fully formed.
    const vName = state.vehicleName || '';
    if (vName && vName !== this.vehicleNameShown) { this.vehicleNameShown = vName; this.vehicleFade = 0; }
    if (!vName) this.vehicleNameShown = '';
    this.vehicleFade = Math.min(1, this.vehicleFade + (dt || 0.016) * 1.8);
    this.el['vehicle-label'].textContent = vName;
    this.el['vehicle-label'].style.opacity = String(this.vehicleFade);
    this.el['speed-label'].textContent = state.vehicleName ? `${state.speedKmh} km/h` : (state.prompt ? '' : 'On foot — find a car and press E');
    this.el['prompt-label'].textContent = state.prompt || '';
    // Low health throbs on its own: below 30 the vignette pulses red even
    // between hits, and a real damage flash always wins over the pulse.
    let vignette = state.damageFlash || 0;
    if (state.health > 0 && state.health <= 30) {
      const pulse = 0.16 + 0.14 * (Math.sin(performance.now() / 210) * 0.5 + 0.5);
      vignette = Math.max(vignette, pulse);
    }
    this.el['damage-vignette'].style.boxShadow = `inset 0 0 90px rgba(255,0,0,${vignette})`;
    if (this.toastTimer > 0) { this.toastTimer -= dt; if (this.toastTimer <= 0) this.el['toast-label'].style.opacity = '0'; }
  }
  toast(text, seconds = 2.6) {
    this.el['toast-label'].textContent = text; this.el['toast-label'].style.opacity = '1'; this.toastTimer = seconds;
  }
}
export function formatMoney(n) { return '$' + n.toLocaleString('en-US'); }

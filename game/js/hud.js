// hud.js — writes game state into the HUD: money, wanted stars, health, vehicle name, speed, clock and prompts.
export class Hud {
  constructor() {
    this.el = {};
    for (const id of ['money-label','wanted-stars','clock-label','mission-title','mission-objective','mission-distance','health-bar','vehicle-label','speed-label','prompt-label','toast-label','damage-vignette','hud'])
      this.el[id] = document.getElementById(id);
    this.toastTimer = 0;
  }
  show() { this.el['hud'].classList.remove('hidden'); }
  hide() { this.el['hud'].classList.add('hidden'); }
  update(state, dt) {
    this.el['money-label'].textContent = '$' + state.money.toLocaleString('en-US');
    this.el['wanted-stars'].textContent = state.wanted.stars > 0 ? state.wanted.starsText() : '';
    this.el['wanted-stars'].style.opacity = state.wanted.stars > 2 && Math.floor(performance.now() / 350) % 2 ? '0.45' : '1';
    const mins = Math.floor(state.gameMinutes) % 1440;
    const hh = String(Math.floor(mins / 60)).padStart(2, '0'), mm = String(mins % 60).padStart(2, '0');
    this.el['clock-label'].textContent = `Day ${state.day} · ${hh}:${mm} · Palmira Bay`;
    this.el['mission-title'].textContent = state.missionTitle;
    this.el['mission-objective'].textContent = state.objective;
    this.el['mission-distance'].textContent = state.missionDistance != null ? `Target: ${Math.round(state.missionDistance)} m` : '';
    this.el['health-bar'].style.width = Math.max(0, state.health) + '%';
    this.el['vehicle-label'].textContent = state.vehicleName || '';
    this.el['speed-label'].textContent = state.vehicleName ? `${state.speedKmh} km/h` : (state.prompt ? '' : 'On foot — find a car and press E');
    this.el['prompt-label'].textContent = state.prompt || '';
    this.el['damage-vignette'].style.boxShadow = `inset 0 0 90px rgba(255,0,0,${state.damageFlash || 0})`;
    if (this.toastTimer > 0) { this.toastTimer -= dt; if (this.toastTimer <= 0) this.el['toast-label'].style.opacity = '0'; }
  }
  toast(text, seconds = 2.6) {
    this.el['toast-label'].textContent = text; this.el['toast-label'].style.opacity = '1'; this.toastTimer = seconds;
  }
}
export function formatMoney(n) { return '$' + n.toLocaleString('en-US'); }

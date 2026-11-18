// save-game.js — localStorage save: money, finished missions, player position and health survive a reload.
export const SAVE_KEY = 'neon-tide-save-v1';
export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      money: state.money, missionIndex: state.missionIndex,
      x: state.playerPos.x, z: state.playerPos.z, health: state.health,
      day: state.day, savedAt: Date.now(),
    }));
    return true;
  } catch { return false; }
}
export function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* storage unavailable */ } }
export function hasSave() { return loadGame() !== null; }

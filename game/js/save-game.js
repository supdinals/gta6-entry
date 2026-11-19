// save-game.js — localStorage save: money, finished missions, player position and health survive a reload.
export const SAVE_KEY = 'neon-tide-save-v2';
export const LEGACY_SAVE_KEY = 'neon-tide-save-v1';
export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 2,
      money: state.money, missionIndex: state.missionIndex,
      // The player's spot in the bay is part of the save, stored both as a
      // nested position and as flat x/z so older readers keep working.
      playerPos: { x: state.playerPos.x, z: state.playerPos.z },
      x: state.playerPos.x, z: state.playerPos.z, health: state.health,
      day: state.day, savedAt: Date.now(),
    }));
    return true;
  } catch { return false; }
}
export function loadGame() {
  try {
    // Current v2 saves first; a v1 save from before the version bump is
    // still honoured as a fallback and normalised to the same shape.
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && s.playerPos) { s.x = s.playerPos.x; s.z = s.playerPos.z; }
    return s;
  } catch { return null; }
}
export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(LEGACY_SAVE_KEY); } catch { /* storage unavailable */ }
}
export function hasSave() { return loadGame() !== null; }
